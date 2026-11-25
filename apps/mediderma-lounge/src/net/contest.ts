/**
 * 주간 라운지 꾸미기 콘테스트 (Supabase RPC — supabase/mdl_lounge_contest.sql)
 *  - 한 주(한국 시간 월요일 0시 ~ 일요일 24시)에 내 라운지를 한 번 출품하고, 다시 내면 사진이 바뀐다
 *  - 다른 플레이어 출품작에 한 주 5표까지 (작품마다 한 번, 내 라운지 제외)
 *  - 지난 주 순위에 따라 보상 (한 주에 한 번)
 * 서버는 친구 코드 + 이 기기에만 저장된 비밀값으로 본인을 확인한다 (남의 코드로 투표·출품 불가).
 */
import { create } from "zustand";
import { useGame, type Look } from "../store/game";
import { MAX_FURNITURE, cleanLook, cleanLounge, cleanName, type LoungeSnap } from "./plaza";

const REST = "https://qeabsjyglethzkwlkmaw.supabase.co/rest/v1/rpc";
/** 공개(publishable) 키 — 브라우저에 노출되도록 만들어진 값이라 비밀이 아니다 */
const KEY = "sb_publishable_JfbgxhQtx1cnSIdEmXPDvA_3tg9pk0-";
export const VOTES_PER_WEEK = 5;

export interface Entry { code: string; name: string; level: number; votes: number; rank: number; lounge: LoungeSnap; look: Look; stage: number }
export interface Me { week: string; prev: string; entered: boolean; received: number; used: number; votedFor: string[]; prevRank: number | null }

/** 순위 보상 (지난 주 결과로 한 번) */
export function contestReward(rank: number | null): { coins: number; gems: number; title: string } | null {
  if (!rank || rank < 1) return null;
  if (rank === 1) return { coins: 3000, gems: 50, title: "1st" };
  if (rank <= 3) return { coins: 2000, gems: 30, title: "TOP 3" };
  if (rank <= 10) return { coins: 1000, gems: 10, title: "TOP 10" };
  return { coins: 300, gems: 0, title: "ENTRY" };
}

/** 서버와 같은 주 표기 (한국 시간 ISO 주 "2026-W47") */
export function weekOf(now = Date.now()) {
  const k = new Date(now + 9 * 3_600_000); // 한국 시간을 UTC 자리로
  const d = new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day); // 그 주의 목요일
  const y = d.getUTCFullYear();
  const w = Math.ceil(((d.getTime() - Date.UTC(y, 0, 1)) / 86_400_000 + 1) / 7);
  return `${y}-W${String(w).padStart(2, "0")}`;
}
/** 이번 주가 끝나는 시각 (다음 월요일 0시, 한국 시간) */
export function weekEndsAt(now = Date.now()) {
  const k = new Date(now + 9 * 3_600_000);
  const day = k.getUTCDay() || 7;
  const monday = Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate() + (8 - day));
  return monday - 9 * 3_600_000;
}

/** 출품 사진: 라운지 꾸밈 + 캐릭터 외형 (서버 크기 제한 24KB 안쪽) */
export function snapshotOf() {
  const s = useGame.getState();
  return {
    lounge: { level: s.lounge.level, floor: s.lounge.floor, wall: s.lounge.wall, light: s.lounge.light, furniture: s.lounge.furniture.slice(0, MAX_FURNITURE).map((f) => ({ type: f.type, x: +f.x.toFixed(2), z: +f.z.toFixed(2), rot: +f.rot.toFixed(2) })) },
    look: { ...s.look, hideRank: undefined }, stage: s.stage,
  };
}

/** 서버가 준 값도 그대로 믿지 않는다 */
export function cleanEntry(v: unknown): Entry | null {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const code = typeof o.code === "string" && /^[A-Z0-9]{6}$/.test(o.code) ? o.code : "";
  if (!code) return null;
  const snap = (o.snapshot && typeof o.snapshot === "object" ? o.snapshot : {}) as Record<string, unknown>;
  const n = (x: unknown, lo: number, hi: number, d: number) => (typeof x === "number" && isFinite(x) ? Math.min(hi, Math.max(lo, Math.round(x))) : typeof x === "string" && /^\d+$/.test(x) ? Math.min(hi, Math.max(lo, Number(x))) : d);
  return { code, name: cleanName(o.name), level: n(o.level, 1, 10, 1), votes: n(o.votes, 0, 1e6, 0), rank: n(o.rank, 1, 1e6, 1), lounge: cleanLounge(snap.lounge), look: cleanLook(snap.look), stage: n(snap.stage, 1, 5, 1) };
}

/** 이 기기의 콘테스트 비밀값 (처음 한 번 만들고 저장) */
/** 기기 이전으로 계정을 넘겨받으면 새 비밀값으로 바꾼다 */
export function setSecret(s: string) {
  if (!/^[0-9a-f]{32}$/.test(s)) return;
  try { localStorage.setItem("mdl-contest-secret", s); } catch { /* 저장 불가 환경 */ }
}
export function newSecret() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function secret() {
  const k = "mdl-contest-secret";
  try {
    const old = localStorage.getItem(k);
    if (old && /^[0-9a-f]{32}$/.test(old)) return old;
  } catch { /* 저장 불가 환경 */ }
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  const s = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  try { localStorage.setItem(k, s); } catch { /* 저장 불가 환경: 이번 접속 동안만 */ }
  return s;
}

export async function rpc<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${REST}/${fn}`, { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${fn} ${res.status}`);
  return (await res.json()) as T;
}

interface ContestState { status: "idle" | "loading" | "ok" | "error"; me: Me | null; board: Entry[]; prevBoard: Entry[] }
export const useContest = create<ContestState>(() => ({ status: "idle", me: null, board: [], prevBoard: [] }));

export async function refreshContest() {
  const code = useGame.getState().friendCode;
  useContest.setState((s) => ({ status: s.me ? s.status : "loading" }));
  try {
    const [me, board] = await Promise.all([rpc<Me>("mdl_contest_me", { p_code: code }), rpc<unknown[]>("mdl_contest_board", {})]);
    const prevBoard = me?.prev ? await rpc<unknown[]>("mdl_contest_board", { p_week: me.prev }) : [];
    const clean = (l: unknown[]) => (Array.isArray(l) ? l : []).map(cleanEntry).filter((e): e is Entry => !!e);
    useContest.setState({
      status: "ok",
      me: me ? { ...me, votedFor: Array.isArray(me.votedFor) ? me.votedFor.filter((x) => typeof x === "string") : [], prevRank: typeof me.prevRank === "number" ? me.prevRank : null } : null,
      board: clean(board), prevBoard: clean(prevBoard).slice(0, 10),
    });
  } catch {
    useContest.setState({ status: "error" });
  }
}

export async function enterContest(): Promise<"ok" | "auth" | "size" | "error"> {
  const s = useGame.getState();
  try {
    const r = await rpc<{ ok: boolean; error?: string }>("mdl_contest_enter", { p_code: s.friendCode, p_secret: secret(), p_name: s.name, p_level: s.lounge.level, p_snapshot: snapshotOf() });
    void refreshContest();
    return r.ok ? "ok" : r.error === "auth" || r.error === "size" ? r.error : "error";
  } catch { return "error"; }
}

export async function voteContest(owner: string): Promise<"ok" | "self" | "dup" | "limit" | "missing" | "auth" | "error"> {
  try {
    const r = await rpc<{ ok: boolean; error?: string }>("mdl_contest_vote", { p_code: useGame.getState().friendCode, p_secret: secret(), p_owner: owner });
    void refreshContest();
    if (r.ok) return "ok";
    return (["self", "dup", "limit", "missing", "auth"] as const).find((e) => e === r.error) ?? "error";
  } catch { return "error"; }
}
