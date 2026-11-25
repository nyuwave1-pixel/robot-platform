/**
 * 플랫폼이 알려 주는 플레이어 상태 (비트파크: 로그인 여부 · 표시 이름 · RP 잔액 · 오늘 적립 여부).
 * 게임 진행과 저장에는 쓰지 않고 화면 안내에만 쓴다 — 플랫폼이 없으면 비어 있다.
 */
import { create } from "zustand";

export interface PlatformStatus { known: boolean; loggedIn: boolean; name: string; rp: number | null; rpToday: boolean; rpReward: number }
export const usePlatformStatus = create<PlatformStatus>(() => ({ known: false, loggedIn: false, name: "", rp: null, rpToday: false, rpReward: 0 }));

/** 플랫폼 계정에 연결된 게임 계정 (친구 코드 + 비밀값) — 다른 기기에서 같은 진행을 불러올 때 */
export interface AccountLink { code: string; secret: string }
/** known: 포털이 계정을 확인해 알려 줬는지 (연결이 없으면 link 는 null) */
export const useAccountLink = create<{ known: boolean; link: AccountLink | null }>(() => ({ known: false, link: null }));
export function cleanLink(v: unknown): AccountLink | null {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return typeof o.code === "string" && /^[A-Z0-9]{6}$/.test(o.code) && typeof o.secret === "string" && /^[0-9a-f]{32}$/.test(o.secret) ? { code: o.code, secret: o.secret } : null;
}

/** 플랫폼이 보낸 값은 아는 형식만 받는다 */
export function cleanStatus(v: unknown): PlatformStatus | null {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  if (typeof o.loggedIn !== "boolean") return null;
  const num = (x: unknown, hi: number) => (typeof x === "number" && isFinite(x) ? Math.max(0, Math.min(hi, Math.floor(x))) : null);
  return {
    known: true,
    loggedIn: o.loggedIn,
    name: o.loggedIn && typeof o.name === "string" ? o.name.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 12) : "",
    rp: o.loggedIn ? num(o.rp, 1e9) : null,
    rpToday: o.rpToday === true,
    rpReward: num(o.rpReward, 1000) ?? 0,
  };
}
