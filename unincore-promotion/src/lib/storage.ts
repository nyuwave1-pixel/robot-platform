import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Tiny key/value + counter storage.
 *
 * - Production: Upstash Redis REST API (Vercel Marketplace "Upstash for Redis",
 *   exposes KV_REST_API_URL / KV_REST_API_TOKEN). No SDK — plain fetch.
 * - Local dev: JSON files in ./.data so the CMS works without any service.
 * - Production without credentials: reads return null (site serves defaults),
 *   writes throw StorageNotConfiguredError so the admin UI can say so.
 */

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("Storage is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN.");
  }
}

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const useRedis = Boolean(REDIS_URL && REDIS_TOKEN);
// Netlify: Netlify Blobs (site-wide store). Enabled by STORAGE_DRIVER=blobs or the Netlify runtime context.
const useBlobs = !useRedis && (process.env.STORAGE_DRIVER === "blobs" || Boolean(process.env.NETLIFY_BLOBS_CONTEXT));
// STORAGE_DRIVER=file forces JSON-file storage (self-hosted servers with a persistent disk, QA runs).
const useFile = !useRedis && !useBlobs && (process.env.STORAGE_DRIVER === "file" || process.env.NODE_ENV !== "production");
const DATA_DIR = path.join(process.cwd(), ".data");
const BLOB_STORE = "unincore-promotion";

export function storageMode(): "redis" | "blobs" | "file" | "none" {
  return useRedis ? "redis" : useBlobs ? "blobs" : useFile ? "file" : "none";
}

async function blobStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore({ name: BLOB_STORE, consistency: "strong" });
}
const blobKey = (key: string) => key.replace(/:/g, "/");

type RedisValue = string | number | null | RedisValue[];

async function redis(commands: (string | number)[][]): Promise<RedisValue[]> {
  const res = await fetch(`${REDIS_URL.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis error ${res.status}`);
  const data = (await res.json()) as { result?: RedisValue; error?: string }[];
  return data.map((r) => {
    if (r.error) throw new Error(r.error);
    return r.result ?? null;
  });
}

// ---------- file backend (dev only) ----------
let fileQueue: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = fileQueue.then(fn, fn);
  fileQueue = run.catch(() => undefined);
  return run;
}
async function readFileJson<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, name), "utf8")) as T;
  } catch {
    return fallback;
  }
}
async function writeFileJson(name: string, value: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const target = path.join(DATA_DIR, name);
  const tmp = `${target}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2));
  await fs.rename(tmp, target);
}
const safeName = (key: string) => key.replace(/[^a-z0-9:_-]/gi, "_").replace(/:/g, "__") + ".json";

// ---------- public API ----------
export async function getJson<T>(key: string): Promise<T | null> {
  if (useRedis) {
    const [v] = await redis([["GET", key]]);
    return typeof v === "string" ? (JSON.parse(v) as T) : null;
  }
  if (useBlobs) return ((await (await blobStore()).get(blobKey(key), { type: "json" })) as T | null) ?? null;
  if (useFile) return readFileJson<T | null>(safeName(key), null);
  return null;
}

export async function setJson(key: string, value: unknown): Promise<void> {
  if (useRedis) {
    await redis([["SET", key, JSON.stringify(value)]]);
    return;
  }
  if (useBlobs) {
    await (await blobStore()).setJSON(blobKey(key), value);
    return;
  }
  if (useFile) return serial(() => writeFileJson(safeName(key), value));
  throw new StorageNotConfiguredError();
}

export async function delKey(key: string): Promise<void> {
  if (useRedis) {
    await redis([["DEL", key]]);
    return;
  }
  if (useBlobs) {
    await (await blobStore()).delete(blobKey(key));
    return;
  }
  if (useFile) {
    await fs.rm(path.join(DATA_DIR, safeName(key)), { force: true });
    return;
  }
  throw new StorageNotConfiguredError();
}

/** Increment several fields of a hash at once (used for analytics counters). */
export async function hincrMany(key: string, fields: string[], ttlSeconds: number): Promise<void> {
  if (!fields.length) return;
  if (useRedis) {
    await redis([...fields.map((f) => ["HINCRBY", key, f, 1]), ["EXPIRE", key, ttlSeconds]]);
    return;
  }
  if (useFile) {
    const name = safeName(key);
    return serial(async () => {
      const cur = await readFileJson<Record<string, number>>(name, {});
      for (const f of fields) cur[f] = (cur[f] || 0) + 1;
      await writeFileJson(name, cur);
    });
  }
  // No storage: drop silently — GA4/Meta still receive the event client-side.
}

export async function hgetallMany(keys: string[]): Promise<Record<string, number>[]> {
  if (!keys.length) return [];
  if (useRedis) {
    const res = await redis(keys.map((k) => ["HGETALL", k]));
    return res.map((arr) => {
      const out: Record<string, number> = {};
      if (Array.isArray(arr)) for (let i = 0; i < arr.length; i += 2) out[String(arr[i])] = Number(arr[i + 1]);
      return out;
    });
  }
  if (useFile) return Promise.all(keys.map((k) => readFileJson<Record<string, number>>(safeName(k), {})));
  return keys.map(() => ({}));
}

/**
 * Append-only event log for backends without atomic counters (Netlify Blobs:
 * last write wins, so read-modify-write counters would lose updates).
 * Each event is one empty blob whose key encodes its dimensions; reading lists keys only.
 */
export async function appendEvent(day: string, encoded: string): Promise<void> {
  if (!useBlobs) throw new Error("appendEvent is only used with Netlify Blobs");
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}${Math.random()}`;
  await (await blobStore()).set(`events/${day}/${encodeURIComponent(encoded)}/${id}`, "");
}

export async function listEvents(days: string[]): Promise<string[][]> {
  if (!useBlobs) return days.map(() => []);
  const store = await blobStore();
  return Promise.all(
    days.map(async (day) => {
      const { blobs } = await store.list({ prefix: `events/${day}/` });
      return blobs.map((b) => decodeURIComponent(b.key.split("/")[2] || ""));
    }),
  );
}

export const usesEventLog = () => useBlobs;
