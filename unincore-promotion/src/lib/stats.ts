import "server-only";
import { appendEvent, hgetallMany, hincrMany, listEvents, usesEventLog } from "./storage";
import { cleanTag } from "./channel";
import { CHANNELS } from "@/content/types";
import { DEVICES, EVENTS, type EventName, type TrackPayload } from "./events";

const TTL = 60 * 60 * 24 * 400;
const PRODUCT_KEYS = new Set(["ampoule", "mask", "wash"]);
const LOCATIONS = new Set(["hero", "sticky", "final", "promo", "offer", "card", "routine", "shop", "header", "related", "howto"]);

export function dayKey(d: Date = new Date()): string {
  // Bucket by US Pacific day so the dashboard matches Amazon/Meta reporting days.
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return `stats:${parts}`;
}

/** Validate an untrusted beacon payload into a strict, low-cardinality shape. */
export function sanitize(raw: unknown): TrackPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!EVENTS.includes(r.e as EventName)) return null;
  const p = typeof r.p === "string" && PRODUCT_KEYS.has(r.p) ? r.p : undefined;
  const ch = typeof r.ch === "string" && (CHANNELS as readonly string[]).includes(r.ch) ? r.ch : "direct";
  const dev = typeof r.dev === "string" && (DEVICES as readonly string[]).includes(r.dev) ? (r.dev as TrackPayload["dev"]) : "desktop";
  const loc = typeof r.loc === "string" && LOCATIONS.has(r.loc) ? r.loc : undefined;
  return {
    e: r.e as EventName,
    p,
    loc,
    ch,
    dev,
    src: cleanTag(r.src, 40) || undefined,
    med: cleanTag(r.med, 40) || undefined,
    cmp: cleanTag(r.cmp, 80) || undefined,
    cnt: cleanTag(r.cnt, 80) || undefined,
    path: typeof r.path === "string" ? r.path.slice(0, 200) : undefined,
    id: typeof r.id === "string" ? r.id.slice(0, 64) : undefined,
    ad: r.ad === true,
  };
}

/** Counter fields written per event. Field format: kind|event|dim[|dim2]. */
export function counterFields(t: TrackPayload): string[] {
  const f = [`e|${t.e}`, `ch|${t.e}|${t.ch}`, `dev|${t.e}|${t.dev}`];
  if (t.p) f.push(`p|${t.e}|${t.p}`, `pch|${t.e}|${t.p}|${t.ch}`);
  if (t.loc && t.p) f.push(`loc|${t.e}|${t.p}|${t.loc}`);
  if (t.cmp) f.push(`cmp|${t.e}|${t.cmp}`);
  if (t.src) f.push(`src|${t.e}|${t.src}`);
  return f;
}

const SEP = "\u001f";
/** Compact encoding of the dimensions counterFields() needs (for the append-only event log). */
export function encodeEvent(t: TrackPayload): string {
  return [t.e, t.p ?? "", t.ch ?? "", t.dev ?? "", t.loc ?? "", t.cmp ?? "", t.src ?? ""].join(SEP);
}
export function decodeEvent(s: string): TrackPayload | null {
  const [e, p, ch, dev, loc, cmp, src] = s.split(SEP);
  return sanitize({ e, p, ch, dev, loc, cmp, src });
}

export async function recordEvent(t: TrackPayload) {
  if (usesEventLog()) await appendEvent(dayKey().slice(6), encodeEvent(t));
  else await hincrMany(dayKey(), counterFields(t), TTL);
}

async function loadDayHashes(keys: string[]): Promise<Record<string, number>[]> {
  if (!usesEventLog()) return hgetallMany(keys);
  const days = await listEvents(keys.map((k) => k.slice(6)));
  return days.map((events) => {
    const h: Record<string, number> = {};
    for (const raw of events) {
      const t = decodeEvent(raw);
      if (t) for (const f of counterFields(t)) h[f] = (h[f] || 0) + 1;
    }
    return h;
  });
}

export interface StatsSummary {
  days: number;
  from: string;
  to: string;
  totals: Record<string, number>;
  byProduct: Record<string, Record<string, number>>;
  byChannel: Record<string, Record<string, number>>;
  byDevice: Record<string, Record<string, number>>;
  byCampaign: Record<string, Record<string, number>>;
  bySource: Record<string, Record<string, number>>;
  byProductChannel: Record<string, Record<string, Record<string, number>>>;
  ctaLocations: Record<string, Record<string, number>>;
  daily: { day: string; views: number; clicks: number }[];
}

function bump(obj: Record<string, Record<string, number>>, a: string, b: string, n: number) {
  (obj[a] ||= {})[b] = (obj[a][b] || 0) + n;
}

/** Zero-filled summary without touching storage (used when storage is unavailable). */
export function emptyStats(days: number): StatsSummary {
  const now = Date.now();
  const keys = Array.from({ length: days }, (_, i) => dayKey(new Date(now - (days - 1 - i) * 86400000)));
  return {
    days,
    from: keys[0]?.slice(6) ?? "",
    to: keys[keys.length - 1]?.slice(6) ?? "",
    totals: {},
    byProduct: {},
    byChannel: {},
    byDevice: {},
    byCampaign: {},
    bySource: {},
    byProductChannel: {},
    ctaLocations: {},
    daily: keys.map((k) => ({ day: k.slice(6), views: 0, clicks: 0 })),
  };
}

export async function getStats(days = 30): Promise<StatsSummary> {
  const now = Date.now();
  const keys = Array.from({ length: days }, (_, i) => dayKey(new Date(now - (days - 1 - i) * 86400000)));
  const hashes = await loadDayHashes(keys);
  const s: StatsSummary = {
    days,
    from: keys[0]?.slice(6) ?? "",
    to: keys[keys.length - 1]?.slice(6) ?? "",
    totals: {},
    byProduct: {},
    byChannel: {},
    byDevice: {},
    byCampaign: {},
    bySource: {},
    byProductChannel: {},
    ctaLocations: {},
    daily: [],
  };
  hashes.forEach((h, i) => {
    let views = 0;
    let clicks = 0;
    for (const [field, n] of Object.entries(h)) {
      const [kind, ev, a, b] = field.split("|");
      switch (kind) {
        case "e":
          s.totals[ev] = (s.totals[ev] || 0) + n;
          if (ev === "product_detail_view") views += n;
          if (ev === "amazon_cta_click") clicks += n;
          break;
        case "p":
          bump(s.byProduct, a, ev, n);
          break;
        case "ch":
          bump(s.byChannel, a, ev, n);
          break;
        case "dev":
          bump(s.byDevice, a, ev, n);
          break;
        case "cmp":
          bump(s.byCampaign, a, ev, n);
          break;
        case "src":
          bump(s.bySource, a, ev, n);
          break;
        case "pch":
          ((s.byProductChannel[a] ||= {})[b] ||= {})[ev] = (s.byProductChannel[a][b][ev] || 0) + n;
          break;
        case "loc":
          if (ev === "amazon_cta_click") bump(s.ctaLocations, a, b, n);
          break;
      }
    }
    s.daily.push({ day: keys[i].slice(6), views, clicks });
  });
  return s;
}
