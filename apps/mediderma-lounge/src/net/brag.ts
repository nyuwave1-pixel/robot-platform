/**
 * 뷰티 자랑 피드 (Supabase RPC — supabase/mdl_lounge_brag.sql)
 *  - 내 룩(의상 · 메이크업), 펫, 뷰티 가든, 케어 기록, 소품 컬렉션을 다른 플레이어에게 자랑한다
 *  - 자유 글 · 이미지는 없다: 종류 + 정해진 문구 + 게임 데이터(아이템 id · 숫자)만 올리고, 읽을 때 아는 값만 그린다
 *  - 하루 3번 올릴 수 있고 올릴 때마다 작은 보상, 좋아요는 자랑마다 한 번 (하루 30번)
 *  - 본인 확인은 콘테스트 · 방명록과 같은 기기 비밀값
 */
import { create } from "zustand";
import { PET_MAP, type PetType } from "../data/game";
import { CURIO_MAP, CURIO_SETS, PLANT_MAP } from "../data/life";
import { ROUTINE_MAP } from "../data/devices";
import { PET_ACC_MAP, PET_LEVELS, petLevel } from "../data/pets";
import { useGame, type Look } from "../store/game";
import { useLife } from "../store/life";
import { cleanLook, cleanName } from "./plaza";
import { rpc, secret } from "./contest";

export type BragKind = "look" | "pet" | "plant" | "care" | "collection";
export const BRAG_KINDS: BragKind[] = ["look", "pet", "plant", "care", "collection"];
/** 정해진 자랑 문구: 종류마다 번호 범위가 정해져 있다 (서버는 0~19 만 받는다) */
export const BRAG_MESSAGES: { id: number; kind: BragKind; ko: string; en: string }[] = [
  { id: 0, kind: "look", ko: "오늘의 룩 어때요?", en: "How's my look today?" },
  { id: 1, kind: "look", ko: "새 메이크업 해 봤어요", en: "Tried a new makeup look" },
  { id: 2, kind: "look", ko: "스타일 챌린지 준비 완료!", en: "Ready for the style challenge!" },
  { id: 3, kind: "look", ko: "오늘은 꾸꾸꾸 데이", en: "Full glam day" },
  { id: 4, kind: "pet", ko: "우리 아이 자랑할게요", en: "Meet my little one" },
  { id: 5, kind: "pet", ko: "오늘도 귀여움 폭발", en: "Cuteness overload today" },
  { id: 6, kind: "pet", ko: "산책 다녀왔어요", en: "Back from a walk" },
  { id: 7, kind: "plant", ko: "가든 수확 자랑!", en: "Garden harvest time!" },
  { id: 8, kind: "plant", ko: "정성껏 키웠어요", en: "Grown with love" },
  { id: 9, kind: "plant", ko: "원료 도감 채우는 중", en: "Filling my ingredient book" },
  { id: 10, kind: "care", ko: "오늘 케어 완료!", en: "Care done for today!" },
  { id: 11, kind: "care", ko: "결 방향까지 꼼꼼하게", en: "Careful, along every guide" },
  { id: 12, kind: "care", ko: "피부가 환해졌어요", en: "My skin feels brighter" },
  { id: 13, kind: "collection", ko: "컬렉션 모으는 중", en: "Growing my collection" },
  { id: 14, kind: "collection", ko: "세트 완성했어요!", en: "Completed a set!" },
];
export const BRAG_DAILY = 3;
export const BRAG_REWARD = 10;

export interface BragData {
  look?: Look; stage?: number;
  pet?: { type: string; name: string; affection: number; level?: number; acc?: string | null };
  plants?: { id: string; n: number; g?: number }[];
  care?: { routine: string | null; acc: number | null; stars: number | null };
  curios?: { owned: number; total: number; sets: string[]; best: string[] };
}
export interface Brag { id: number; writer: string; name: string; kind: BragKind; msg: number; data: BragData; likes: number; liked: boolean; at: string }

const int = (v: unknown, lo: number, hi: number) => (typeof v === "number" && isFinite(v) ? Math.round(Math.min(hi, Math.max(lo, v))) : null);

/** 서버가 준 자랑 데이터도 종류에 맞는 아는 값만 받는다 */
export function cleanBragData(kind: BragKind, v: unknown): BragData | null {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  if (kind === "look") return { look: cleanLook(o.look), stage: int(o.stage, 1, 5) ?? 1 };
  if (kind === "pet") {
    const p = (o.pet && typeof o.pet === "object" ? o.pet : {}) as Record<string, unknown>;
    if (typeof p.type !== "string" || !PET_MAP[p.type]) return null;
    return { pet: { type: p.type, name: cleanName(p.name).slice(0, 10), affection: int(p.affection, 0, 100) ?? 0, level: int(p.level, 1, PET_LEVELS.length) ?? 1, acc: typeof p.acc === "string" && PET_ACC_MAP[p.acc] ? p.acc : null } };
  }
  if (kind === "plant") {
    const plants = (Array.isArray(o.plants) ? o.plants : []).slice(0, 3).map((x) => {
      const q = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
      return typeof q.id === "string" && PLANT_MAP[q.id] ? { id: q.id, n: int(q.n, 1, 9999) ?? 1, g: int(q.g, 0, 9999) ?? 0 } : null;
    }).filter((x): x is { id: string; n: number; g: number } => !!x);
    return plants.length ? { plants } : null;
  }
  if (kind === "care") {
    const c = (o.care && typeof o.care === "object" ? o.care : {}) as Record<string, unknown>;
    return { care: { routine: typeof c.routine === "string" && ROUTINE_MAP[c.routine] ? c.routine : null, acc: int(c.acc, 0, 100), stars: int(c.stars, 1, 5) } };
  }
  const c = (o.curios && typeof o.curios === "object" ? o.curios : {}) as Record<string, unknown>;
  const ids = (a: unknown, ok: (s: string) => boolean, n: number) => (Array.isArray(a) ? a : []).filter((s): s is string => typeof s === "string" && ok(s)).slice(0, n);
  return { curios: { owned: int(c.owned, 0, 999) ?? 0, total: int(c.total, 0, 999) ?? 0, sets: ids(c.sets, (s) => CURIO_SETS.some((x) => x.id === s), 8), best: ids(c.best, (s) => !!CURIO_MAP[s], 4) } };
}

export function cleanBrag(v: unknown): Brag | null {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const kind = BRAG_KINDS.find((k) => k === o.kind);
  const id = int(o.id, 1, Number.MAX_SAFE_INTEGER);
  const writer = typeof o.writer === "string" && /^[A-Z0-9]{6}$/.test(o.writer) ? o.writer : "";
  const msg = BRAG_MESSAGES.find((m) => m.id === o.msg && m.kind === kind);
  const t = typeof o.at === "string" ? Date.parse(o.at) : NaN;
  if (!kind || !id || !writer || !msg || !isFinite(t)) return null;
  const data = cleanBragData(kind, o.data);
  if (!data) return null;
  return { id, writer, name: cleanName(o.name), kind, msg: msg.id, data, likes: int(o.likes, 0, 1e6) ?? 0, liked: o.liked === true, at: new Date(t).toISOString() };
}

/** 지금 내 상태로 자랑 데이터를 만든다 (자랑할 게 없으면 null) */
export function bragDataOf(kind: BragKind, extra?: { petId?: string; care?: BragData["care"] }): BragData | null {
  const g = useGame.getState();
  if (kind === "look") return { look: g.look, stage: g.stage };
  if (kind === "pet") {
    const p = g.pets.find((x) => x.id === extra?.petId) ?? [...g.pets].sort((a, b) => b.affection - a.affection)[0];
    return p ? { pet: { type: p.type, name: p.name, affection: p.affection, level: petLevel(p.bond ?? 0), acc: p.acc ?? null } } : null;
  }
  if (kind === "plant") {
    const plants = Object.entries(useLife.getState().harvested).filter(([id, n]) => PLANT_MAP[id] && n > 0)
      .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, n]) => ({ id, n, g: (useLife.getState().golden ?? {})[id] ?? 0 }));
    return plants.length ? { plants } : null;
  }
  if (kind === "care") {
    if (extra?.care) return { care: extra.care };
    const last = g.routinesDone[g.routinesDone.length - 1];
    return last ? { care: { routine: last, acc: null, stars: null } } : null;
  }
  const L = useLife.getState();
  const owned = Object.keys(L.curios).filter((id) => CURIO_MAP[id] && L.curios[id] > 0);
  if (!owned.length) return null;
  const best = [...owned].sort((a, b) => CURIO_MAP[b].rarity - CURIO_MAP[a].rarity).slice(0, 4);
  return { curios: { owned: owned.length, total: Object.keys(CURIO_MAP).length, sets: L.setsClaimed.filter((s) => CURIO_SETS.some((x) => x.id === s)), best } };
}

/** new · hot = 모두의 자랑, follow = 내가 팔로우한 플레이어의 자랑만 (본인 확인 필요) */
export type BragSort = "new" | "hot" | "follow";
export const BRAG_SORTS: BragSort[] = ["new", "hot", "follow"];

interface BragState {
  sort: BragSort; kind: BragKind | null; status: "idle" | "loading" | "ok" | "error"; list: Brag[];
  /** 내 자랑 (최근 20개) · 받은 좋아요 합계 */
  mine: Brag[]; mineLikes: number;
  /** 팔로우한 플레이어가 마지막 확인 뒤 올린 새 자랑 수 */
  followNew: number;
}
export const useBrag = create<BragState>(() => ({ sort: "new", kind: null, status: "idle", list: [], mine: [], mineLikes: 0, followNew: 0 }));

/** 새로 받은 좋아요 → 팔로워 (한 번에 최대 BRAG_FOLLOW_CAP) */
export const BRAG_FOLLOW_CAP = 50;
export function newLikes(total: number, seen: number | undefined) {
  if (seen === undefined) return 0; // 처음 확인할 때는 지금까지 받은 것을 기준으로 삼는다
  return Math.max(0, Math.min(BRAG_FOLLOW_CAP, total - seen));
}

/** 내 자랑을 불러와 새로 받은 좋아요를 알려 준다 (팔로워 +) — 받은 수를 돌려준다 */
export async function checkBragLikes(): Promise<number> {
  const g = useGame.getState();
  if (!/^[A-Z0-9]{6}$/.test(g.friendCode ?? "")) return 0;
  try {
    const raw = await rpc<unknown[]>("mdl_brag_mine", { p_code: g.friendCode });
    const mine = (Array.isArray(raw) ? raw : []).map(cleanBrag).filter((b): b is Brag => !!b);
    const total = mine.reduce((a, b) => a + b.likes, 0);
    useBrag.setState({ mine, mineLikes: total });
    const seen = useGame.getState().bragLikesSeen;
    const n = newLikes(total, seen);
    // 지운 자랑이 있으면 합계가 줄 수 있다 → 기준만 맞춘다
    if (seen === undefined || total !== seen) useGame.setState((s) => ({ bragLikesSeen: total, followers: s.followers + n }));
    return n;
  } catch { return 0; }
}

export async function loadBrags(sort = useBrag.getState().sort, kind = useBrag.getState().kind) {
  useBrag.setState((s) => ({ sort, kind, status: s.list.length && s.sort === sort && s.kind === kind ? s.status : "loading" }));
  try {
    const code = useGame.getState().friendCode || null;
    let raw: unknown;
    if (sort === "follow") {
      if (!code || !/^[A-Z0-9]{6}$/.test(code)) { useBrag.setState({ status: "ok", list: [] }); return; }
      const r = await rpc<{ ok: boolean; list?: unknown }>("mdl_brag_following", { p_code: code, p_secret: secret(), p_kind: kind });
      if (!r.ok) throw new Error("auth");
      raw = r.list;
      markFollowSeen(Array.isArray(raw) ? raw.map(cleanBrag).filter((b): b is Brag => !!b) : []);
    } else {
      raw = await rpc<unknown[]>("mdl_brag_list", { p_sort: sort, p_kind: kind, p_code: code });
    }
    const cur = useBrag.getState();
    if (cur.sort !== sort || cur.kind !== kind) return;
    useBrag.setState({ status: "ok", list: (Array.isArray(raw) ? raw : []).map(cleanBrag).filter((b): b is Brag => !!b) });
  } catch {
    useBrag.setState({ status: "error" });
  }
}

export type BragResult = "ok" | "limit" | "auth" | "bad" | "empty" | "error";
export async function postBrag(kind: BragKind, msg: number, data: BragData | null): Promise<BragResult> {
  if (!data) return "empty";
  if (!BRAG_MESSAGES.some((m) => m.id === msg && m.kind === kind)) return "bad";
  const g = useGame.getState();
  try {
    const r = await rpc<{ ok: boolean; error?: string }>("mdl_brag_post", { p_code: g.friendCode, p_secret: secret(), p_name: g.name, p_kind: kind, p_msg: msg, p_data: data });
    if (r.ok) {
      useGame.setState((s) => ({ coins: s.coins + BRAG_REWARD, stats: { ...s.stats, posts: (s.stats.posts ?? 0) + 1 } }));
      void loadBrags("new", null);
      return "ok";
    }
    return (["limit", "auth", "bad"] as const).find((e) => e === r.error) ?? "error";
  } catch { return "error"; }
}

export async function likeBrag(id: number): Promise<"ok" | "dup" | "self" | "limit" | "missing" | "auth" | "error"> {
  // 먼저 화면에 반영하고, 실패하면 되돌린다
  const flip = (d: number, liked: boolean) => useBrag.setState((s) => ({ list: s.list.map((b) => (b.id === id ? { ...b, likes: b.likes + d, liked } : b)) }));
  flip(1, true);
  try {
    const g = useGame.getState();
    const r = await rpc<{ ok: boolean; error?: string }>("mdl_brag_like", { p_code: g.friendCode, p_secret: secret(), p_id: id });
    if (r.ok) return "ok";
    if (r.error !== "dup") flip(-1, false);
    return (["dup", "self", "limit", "missing", "auth"] as const).find((e) => e === r.error) ?? "error";
  } catch { flip(-1, false); return "error"; }
}

export async function deleteBrag(id: number): Promise<boolean> {
  const g = useGame.getState();
  try {
    const r = await rpc<{ ok: boolean }>("mdl_brag_delete", { p_code: g.friendCode, p_secret: secret(), p_id: id });
    if (r.ok) useBrag.setState((s) => ({ list: s.list.filter((b) => b.id !== id) }));
    return r.ok;
  } catch { return false; }
}

export const petOf = (type: string): PetType | undefined => PET_MAP[type];

// ───────────── 주간 자랑왕 ─────────────
export interface KingRow { code: string; name: string; likes: number; posts: number; rank: number }
/** 지난 주 1~3위 보상 */
export function kingReward(rank: number): { coins: number; gems: number } | null {
  return rank === 1 ? { coins: 2000, gems: 30 } : rank === 2 ? { coins: 1200, gems: 15 } : rank === 3 ? { coins: 800, gems: 10 } : null;
}
export function cleanKing(v: unknown): KingRow[] {
  const out: KingRow[] = [];
  for (const raw of Array.isArray(v) ? v.slice(0, 10) : []) {
    const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const n = (x: unknown) => { const k = typeof x === "number" ? x : typeof x === "string" ? Number(x) : NaN; return isFinite(k) ? Math.max(0, Math.floor(k)) : 0; };
    if (typeof o.code !== "string" || !/^[A-Z0-9]{6}$/.test(o.code)) continue;
    out.push({ code: o.code, name: cleanName(o.name), likes: n(o.likes), posts: n(o.posts), rank: Math.max(1, n(o.rank)) });
  }
  return out;
}
export const useKing = create<{ list: KingRow[] }>(() => ({ list: [] }));
export async function loadKing() {
  try { useKing.setState({ list: cleanKing(await rpc<unknown[]>("mdl_brag_king", {})) }); } catch { /* 표시만 안 함 */ }
}
/** 지난 주 자랑왕이면 보상 받기 (한 번) → 받은 순위 · 보상 */
export async function claimKing(): Promise<{ rank: number; coins: number; gems: number } | null> {
  const g = useGame.getState();
  if (!g.started || !/^[A-Z0-9]{6}$/.test(g.friendCode ?? "")) return null;
  try {
    const r = await rpc<{ ok: boolean; rank?: number }>("mdl_brag_king_claim", { p_code: g.friendCode, p_secret: secret() });
    const rw = r.ok && typeof r.rank === "number" ? kingReward(r.rank) : null;
    if (!rw) return null;
    useGame.setState((s) => ({ coins: s.coins + rw.coins, gems: s.gems + rw.gems }));
    return { rank: r.rank!, ...rw };
  } catch { return null; }
}

/* ── 팔로잉 새 자랑 알림 ── */
const newest = (list: Brag[]) => list.reduce<string | undefined>((m, b) => (!m || b.at > m ? b.at : m), undefined);

/** seen 이후에 올라온 자랑 수. seen 이 없으면(처음) 0 — 예전 글이 한꺼번에 "새 글"로 뜨지 않게 */
export function countNewSince(list: Brag[], seen: string | undefined): number {
  if (!seen) return 0;
  const t = Date.parse(seen);
  return list.filter((b) => Date.parse(b.at) > t).length;
}

function markFollowSeen(list: Brag[]) {
  const n = newest(list);
  const cur = useGame.getState().followSeenAt;
  if (n && (!cur || Date.parse(n) > Date.parse(cur))) useGame.setState({ followSeenAt: n });
  useBrag.setState({ followNew: 0 });
}

/** 팔로우한 플레이어의 새 자랑 확인 → 새로 늘어난 수 (알림용). 팔로우가 없으면 서버를 부르지 않는다 */
export async function checkFollowFeed(hasFollows: boolean): Promise<number> {
  const g = useGame.getState();
  if (!hasFollows || !g.started || !/^[A-Z0-9]{6}$/.test(g.friendCode ?? "")) return 0;
  try {
    const r = await rpc<{ ok: boolean; list?: unknown }>("mdl_brag_following", { p_code: g.friendCode, p_secret: secret(), p_kind: null });
    if (!r.ok) return 0;
    const list = (Array.isArray(r.list) ? r.list : []).map(cleanBrag).filter((b): b is Brag => !!b);
    const seen = useGame.getState().followSeenAt;
    if (!seen) { markFollowSeen(list); return 0; }
    const n = countNewSince(list, seen);
    const before = useBrag.getState().followNew;
    useBrag.setState({ followNew: n });
    return Math.max(0, n - before);
  } catch { return 0; }
}
