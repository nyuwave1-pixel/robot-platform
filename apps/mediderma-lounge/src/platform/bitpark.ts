/**
 * 비트파크 포털 (AIRobotVerse · airobotphysical.com) — 이 게임의 기본(홈) 플랫폼.
 *  - 포털은 /games/play/beauty-life/ 에서 게임을 iframe 으로 띄운다
 *  - 플레이 기록을 포털에 보내면 포털이 로그인 사용자에게 RP 를 준다 (상한 · 게임당 하루 1회는 포털이 확인)
 *  - 메시지는 허용된 포털 주소로만 보내고, 게임 진행에는 영향을 주지 않는다
 */
import type { LinkParams, Platform, PlayEvent } from "./types";
import { cleanStatus, usePlatformStatus } from "./status";

export const BITPARK_GAME_ID = "beauty-life";
export const BITPARK_ORIGINS = ["https://airobotphysical.com", "https://www.airobotphysical.com", "https://airobotphysical.web.app"];
/** 포털에서 게임을 여는 주소 (공유 · 초대 링크의 기준) */
export const BITPARK_PLAY_URL = "https://www.airobotphysical.com/games/play/beauty-life/";
/** 플레이 한 번 = 포털 RP (포털이 상한 · 하루 1회를 다시 확인한다) */
export const BITPARK_RP = 40;

/** iframe 안이고, 부모가 허용된 포털이면 그 주소 (아니면 null) */
export function bitparkOrigin(): string | null {
  try {
    if (typeof window === "undefined" || window.parent === window) return null;
    const anc = (window.location as Location & { ancestorOrigins?: DOMStringList }).ancestorOrigins;
    const parent = anc && anc.length ? anc[0] : document.referrer ? new URL(document.referrer).origin : "";
    return BITPARK_ORIGINS.includes(parent) ? parent : null;
  } catch {
    return null;
  }
}

/** 포털이 RP 를 주는 결과 메시지 (기존 규격) */
export function resultMessage(score: number) {
  return { type: "game_result", game: BITPARK_GAME_ID, score: Math.max(0, Math.floor(score)), rp: BITPARK_RP };
}
/** 어떤 플레이를 했는지 알리는 메시지 (포털 활동 기록 · 추후 이벤트용, 지금은 포털이 무시해도 된다) */
export function eventMessage(ev: PlayEvent, score: number) {
  return { type: "game_event", game: BITPARK_GAME_ID, event: ev, score: Math.max(0, Math.floor(score)) };
}

/** 링크 값은 형식이 맞는 것만 담는다 (포털도 다시 거른다) */
export function linkQuery(p: LinkParams = {}) {
  const q = new URLSearchParams();
  if (p.visit && /^[A-Z0-9]{6}$/.test(p.visit)) q.set("visit", p.visit);
  if (p.open && /^[a-z]{1,16}$/.test(p.open)) q.set("open", p.open);
  if (p.invite && /^[A-Z0-9]{6}$/.test(p.invite)) q.set("invite", p.invite);
  if (p.from) { const f = p.from.replace(/[\u0000-\u001f<>&"']/g, "").trim().slice(0, 12); if (f) q.set("from", f); }
  return q;
}

export const bitpark: Platform = {
  id: "bitpark",
  name: { ko: "비트파크", en: "BitPark" },
  detect: () => bitparkOrigin() !== null,
  playUrl(p) {
    const u = new URL(BITPARK_PLAY_URL);
    linkQuery(p).forEach((v, k) => u.searchParams.set(k, v));
    return u.toString();
  },
  init() {
    const origin = bitparkOrigin();
    if (!origin) return;
    // 포털 → 게임: 로그인 · RP 상태 (허용된 포털 창에서 온 것만)
    window.addEventListener("message", (e) => {
      if (e.origin !== origin || e.source !== window.parent) return;
      const d = e.data as Record<string, unknown> | null;
      if (!d || d.type !== "portal_status" || d.game !== BITPARK_GAME_ID) return;
      const st = cleanStatus(d);
      if (st) usePlatformStatus.setState(st);
    });
    try { window.parent.postMessage({ type: "game_ready", game: BITPARK_GAME_ID }, origin); } catch { /* 부모 창이 사라짐 */ }
  },
  report(ev, score) {
    const origin = bitparkOrigin();
    if (!origin) return;
    try {
      window.parent.postMessage(eventMessage(ev, score), origin);
      window.parent.postMessage(resultMessage(score), origin);
    } catch { /* 부모 창이 사라짐 */ }
  },
};
