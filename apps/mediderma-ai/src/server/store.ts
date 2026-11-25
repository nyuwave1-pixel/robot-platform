import "server-only";
import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync } from "node:fs";
import path from "node:path";
import type { TrackEvent } from "@/lib/events";

/**
 * 서버 저장소 어댑터 — 익명 이벤트, 운영 설정(KV), 사용자 신고만 저장한다. 이미지는 저장하지 않는다.
 *  - DATABASE_URL 이 있으면 PostgreSQL (스키마: db/schema.sql)
 *  - 없으면 로컬 JSON 파일(.data/store.json) — 개발·단일 서버용. 서버리스에서는 영속되지 않는다.
 */
export interface StoredEvent extends TrackEvent {
  id: number;
  ts: string;
  country: string;
}
export interface StoredReport {
  id: number;
  ts: string;
  sid: string;
  locale: string;
  message: string;
  context: string;
  status: "open" | "resolved";
}
export interface Store {
  kind: "postgres" | "file";
  /** 프로세스 재시작 후에도 데이터가 남는지 */
  persistent: boolean;
  addEvent(e: TrackEvent, country: string): Promise<void>;
  listEvents(sinceIso: string, limit?: number): Promise<StoredEvent[]>;
  getKV(key: string): Promise<unknown | null>;
  setKV(key: string, value: unknown): Promise<void>;
  addReport(r: Omit<StoredReport, "id" | "ts" | "status">): Promise<void>;
  listReports(limit?: number): Promise<StoredReport[]>;
  setReportStatus(id: number, status: StoredReport["status"]): Promise<void>;
  /** 보관 기간이 지난 이벤트·신고 삭제 */
  purge(olderThanIso: string): Promise<number>;
}

// ── 파일 저장소 ────────────────────────────────────────────
interface FileData {
  seq: number;
  events: StoredEvent[];
  kv: Record<string, unknown>;
  reports: StoredReport[];
}
function fileStore(): Store {
  const dir = process.env.DATA_DIR || path.join(process.cwd(), ".data");
  const file = path.join(dir, "store.json");
  let writable = true;
  let data: FileData = { seq: 0, events: [], kv: {}, reports: [] };
  try {
    mkdirSync(dir, { recursive: true });
    if (existsSync(file)) data = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    writable = false; // 읽기 전용 파일시스템(서버리스) → 메모리로만 동작
  }
  const flush = () => {
    if (!writable) return;
    try {
      writeFileSync(file + ".tmp", JSON.stringify(data));
      renameSync(file + ".tmp", file);
    } catch {
      writable = false;
    }
  };
  return {
    kind: "file",
    get persistent() {
      return writable && !process.env.VERCEL;
    },
    async addEvent(e, country) {
      data.events.push({ ...e, id: ++data.seq, ts: new Date().toISOString(), country });
      if (data.events.length > 200000) data.events.splice(0, data.events.length - 200000);
      flush();
    },
    async listEvents(sinceIso, limit = 100000) {
      return data.events.filter((e) => e.ts >= sinceIso).slice(-limit);
    },
    async getKV(key) {
      return data.kv[key] ?? null;
    },
    async setKV(key, value) {
      data.kv[key] = value;
      flush();
    },
    async addReport(r) {
      data.reports.push({ ...r, id: ++data.seq, ts: new Date().toISOString(), status: "open" });
      flush();
    },
    async listReports(limit = 200) {
      return data.reports.slice(-limit).reverse();
    },
    async setReportStatus(id, status) {
      const r = data.reports.find((x) => x.id === id);
      if (r) r.status = status;
      flush();
    },
    async purge(olderThanIso) {
      const before = data.events.length + data.reports.length;
      data.events = data.events.filter((e) => e.ts >= olderThanIso);
      data.reports = data.reports.filter((e) => e.ts >= olderThanIso);
      flush();
      return before - data.events.length - data.reports.length;
    },
  };
}

// ── PostgreSQL 저장소 ──────────────────────────────────────
async function pgStore(url: string): Promise<Store> {
  const postgres = (await import("postgres")).default;
  const sql = postgres(url, { max: 3, idle_timeout: 20, onnotice: () => {} });
  await sql`create table if not exists md_events (id bigserial primary key, ts timestamptz not null default now(), type text not null, sid text not null, locale text not null, country text not null, props jsonb not null default '{}')`;
  await sql`create index if not exists md_events_ts on md_events (ts)`;
  await sql`create table if not exists md_kv (key text primary key, value jsonb not null, updated_at timestamptz not null default now())`;
  await sql`create table if not exists md_reports (id bigserial primary key, ts timestamptz not null default now(), sid text not null, locale text not null, message text not null, context text not null, status text not null default 'open')`;
  return {
    kind: "postgres",
    persistent: true,
    async addEvent(e, country) {
      await sql`insert into md_events (type, sid, locale, country, props) values (${e.type}, ${e.sid}, ${e.locale}, ${country}, ${sql.json((e.props ?? {}) as never)})`;
    },
    async listEvents(sinceIso, limit = 100000) {
      const rows = await sql`select id, ts, type, sid, locale, country, props from md_events where ts >= ${sinceIso} order by id desc limit ${limit}`;
      return rows.reverse().map((r) => ({ id: Number(r.id), ts: new Date(r.ts).toISOString(), type: r.type, sid: r.sid, locale: r.locale, country: r.country, props: r.props })) as StoredEvent[];
    },
    async getKV(key) {
      const rows = await sql`select value from md_kv where key = ${key}`;
      return rows[0]?.value ?? null;
    },
    async setKV(key, value) {
      await sql`insert into md_kv (key, value) values (${key}, ${sql.json(value as never)}) on conflict (key) do update set value = excluded.value, updated_at = now()`;
    },
    async addReport(r) {
      await sql`insert into md_reports (sid, locale, message, context) values (${r.sid}, ${r.locale}, ${r.message}, ${r.context})`;
    },
    async listReports(limit = 200) {
      const rows = await sql`select * from md_reports order by id desc limit ${limit}`;
      return rows.map((r) => ({ id: Number(r.id), ts: new Date(r.ts).toISOString(), sid: r.sid, locale: r.locale, message: r.message, context: r.context, status: r.status })) as StoredReport[];
    },
    async setReportStatus(id, status) {
      await sql`update md_reports set status = ${status} where id = ${id}`;
    },
    async purge(olderThanIso) {
      const a = await sql`delete from md_events where ts < ${olderThanIso}`;
      const b = await sql`delete from md_reports where ts < ${olderThanIso}`;
      return a.count + b.count;
    },
  };
}

const g = globalThis as unknown as { __mdStore?: Promise<Store> };
export function getStore(): Promise<Store> {
  if (!g.__mdStore) {
    const url = process.env.DATABASE_URL;
    g.__mdStore = url ? pgStore(url) : Promise.resolve(fileStore());
    g.__mdStore.catch(() => {
      g.__mdStore = undefined;
    });
  }
  return g.__mdStore;
}
