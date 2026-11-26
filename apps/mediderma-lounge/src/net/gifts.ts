/**
 * 플레이어 간 선물 (Supabase RPC — supabase/mdl_lounge_gifts.sql)
 *  - 하트: 무료, 받는 사람 SOCIAL STAR +1 (하루 5명, 같은 사람 하루 한 번)
 *  - 코인: 100 · 500 (내 코인에서 빠진다, 하루 3번)
 *  - 받은 선물은 선물함에서 '모두 받기'로 지급
 */
import { create } from "zustand";
import { useGame } from "../store/game";
import { cleanName } from "./plaza";
import { rpc, secret } from "./contest";

export const GIFT_COINS = [100, 500] as const;
export interface Gift { id: number; from: string; name: string; kind: "heart" | "coins"; amount: number; at: string }

export function cleanGift(v: unknown): Gift | null {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const kind = o.kind === "heart" || o.kind === "coins" ? o.kind : null;
  const amount = typeof o.amount === "number" ? o.amount : 0;
  const t = typeof o.at === "string" ? Date.parse(o.at) : NaN;
  if (!kind || typeof o.id !== "number" || typeof o.from !== "string" || !/^[A-Z0-9]{6}$/.test(o.from) || !isFinite(t)) return null;
  if ((kind === "heart" && amount !== 1) || (kind === "coins" && !GIFT_COINS.includes(amount as 100 | 500))) return null;
  return { id: o.id, from: o.from, name: cleanName(o.name), kind, amount, at: new Date(t).toISOString() };
}

export const useGifts = create<{ list: Gift[]; status: "idle" | "loading" | "ok" | "error" }>(() => ({ list: [], status: "idle" }));

export async function loadInbox(): Promise<number> {
  const g = useGame.getState();
  if (!g.started || !/^[A-Z0-9]{6}$/.test(g.friendCode ?? "")) return 0;
  useGifts.setState((s) => ({ status: s.list.length ? s.status : "loading" }));
  try {
    const r = await rpc<{ ok: boolean; gifts?: unknown[] }>("mdl_gift_inbox", { p_code: g.friendCode, p_secret: secret() });
    if (!r.ok) { useGifts.setState({ status: "error" }); return 0; }
    const list = (Array.isArray(r.gifts) ? r.gifts : []).map(cleanGift).filter((x): x is Gift => !!x);
    useGifts.setState({ list, status: "ok" });
    return list.length;
  } catch { useGifts.setState({ status: "error" }); return 0; }
}

export type SendResult = "ok" | "money" | "self" | "dup" | "limit" | "missing" | "auth" | "bad" | "error";
export async function sendGift(to: string, kind: "heart" | "coins", amount: number): Promise<SendResult> {
  const g = useGame.getState();
  if (kind === "coins" && g.coins < amount) return "money";
  try {
    const r = await rpc<{ ok: boolean; error?: string }>("mdl_gift_send", { p_code: g.friendCode, p_secret: secret(), p_name: g.name, p_to: to, p_kind: kind, p_amount: kind === "heart" ? 1 : amount });
    if (r.ok) {
      if (kind === "coins") useGame.setState((s) => ({ coins: s.coins - amount }));
      return "ok";
    }
    return (["self", "dup", "limit", "missing", "auth", "bad"] as const).find((e) => e === r.error) ?? "error";
  } catch { return "error"; }
}

/** 선물함 모두 받기 → 지급한 양 */
export async function claimGifts(): Promise<{ hearts: number; coins: number; count: number } | null> {
  const g = useGame.getState();
  try {
    const r = await rpc<{ ok: boolean; hearts?: number; coins?: number; count?: number }>("mdl_gift_claim", { p_code: g.friendCode, p_secret: secret() });
    if (!r.ok) return null;
    const num = (v: unknown, hi: number) => (typeof v === "number" && isFinite(v) ? Math.max(0, Math.min(hi, Math.floor(v))) : 0);
    const out = { hearts: num(r.hearts, 50), coins: num(r.coins, 50 * 500), count: num(r.count, 50) };
    useGame.setState((s) => ({ stars: s.stars + out.hearts, coins: s.coins + out.coins }));
    useGifts.setState({ list: [] });
    return out;
  } catch { return null; }
}
