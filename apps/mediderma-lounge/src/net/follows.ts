/**
 * 플레이어 팔로우 (Supabase RPC — supabase/mdl_lounge_follows.sql)
 * 뷰티 자랑에서 본 플레이어를 팔로우하면 소셜 '친구' 탭에 실제 친구로 보인다 (놀러 가기 · 선물).
 */
import { create } from "zustand";
import { useGame } from "../store/game";
import { cleanName } from "./plaza";
import { rpc, secret } from "./contest";

export interface Followee { code: string; name: string }
export const useFollows = create<{ list: Followee[]; followers: number; loaded: boolean }>(() => ({ list: [], followers: 0, loaded: false }));

export function cleanFollows(v: unknown): { list: Followee[]; followers: number } {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const list = (Array.isArray(o.following) ? o.following.slice(0, 200) : []).map((x) => {
    const q = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    return typeof q.code === "string" && /^[A-Z0-9]{6}$/.test(q.code) ? { code: q.code, name: cleanName(q.name) } : null;
  }).filter((x): x is Followee => !!x);
  const f = typeof o.followers === "number" && isFinite(o.followers) ? Math.max(0, Math.floor(o.followers)) : 0;
  return { list, followers: f };
}

export async function loadFollows() {
  const g = useGame.getState();
  if (!g.started || !/^[A-Z0-9]{6}$/.test(g.friendCode ?? "")) return;
  try {
    const r = await rpc<{ ok: boolean }>("mdl_follow_list", { p_code: g.friendCode, p_secret: secret() });
    if (r.ok) useFollows.setState({ ...cleanFollows(r), loaded: true });
  } catch { /* 표시만 안 함 */ }
}

export const isFollowing = (code: string) => useFollows.getState().list.some((f) => f.code === code);

/** 팔로우 / 언팔로우 (화면에 먼저 반영, 실패하면 되돌림) */
export async function setFollow(code: string, name: string, on: boolean): Promise<"ok" | "self" | "limit" | "missing" | "auth" | "error"> {
  const g = useGame.getState();
  const before = useFollows.getState().list;
  useFollows.setState({ list: on ? [{ code, name }, ...before.filter((f) => f.code !== code)] : before.filter((f) => f.code !== code) });
  try {
    const r = await rpc<{ ok: boolean; error?: string }>("mdl_follow", { p_code: g.friendCode, p_secret: secret(), p_to: code, p_name: name, p_on: on });
    if (r.ok) return "ok";
    useFollows.setState({ list: before });
    return (["self", "limit", "missing", "auth"] as const).find((e) => e === r.error) ?? "error";
  } catch { useFollows.setState({ list: before }); return "error"; }
}
