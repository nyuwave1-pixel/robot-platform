/**
 * 플랫폼이 알려 주는 플레이어 상태 (비트파크: 로그인 여부 · 표시 이름 · RP 잔액 · 오늘 적립 여부).
 * 게임 진행과 저장에는 쓰지 않고 화면 안내에만 쓴다 — 플랫폼이 없으면 비어 있다.
 */
import { create } from "zustand";

export interface PlatformStatus { known: boolean; loggedIn: boolean; name: string; rp: number | null; rpToday: boolean; rpReward: number }
export const usePlatformStatus = create<PlatformStatus>(() => ({ known: false, loggedIn: false, name: "", rp: null, rpToday: false, rpReward: 0 }));

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
