/**
 * 포털(AIRobotVerse · airobotphysical.com) 안에서 실행될 때의 연동
 *  - 포털은 /games/play/beauty-life/ 에서 이 게임을 iframe 으로 띄운다
 *  - 뷰티 케어를 마치면 포털에 결과를 보내고, 포털이 로그인 사용자에게 RP 를 준다 (포털 쪽에서 게임당 하루 1회)
 *  - 결과는 허용된 포털 주소로만 보낸다. 게임 진행에는 영향을 주지 않는다
 */
import { useGame } from "../store/game";

export const PORTAL_GAME_ID = "beauty-life";
export const PORTAL_ORIGINS = ["https://airobotphysical.com", "https://www.airobotphysical.com", "https://airobotphysical.web.app"];
/** 케어 한 번 완료 = 포털 RP (포털이 상한·하루 1회를 다시 확인한다) */
export const PORTAL_RP = 40;

/** iframe 안이고, 부모가 허용된 포털이면 그 주소 (아니면 null) */
export function portalOrigin(): string | null {
  try {
    if (typeof window === "undefined" || window.parent === window) return null;
    const anc = (window.location as Location & { ancestorOrigins?: DOMStringList }).ancestorOrigins;
    const parent = anc && anc.length ? anc[0] : document.referrer ? new URL(document.referrer).origin : "";
    return PORTAL_ORIGINS.includes(parent) ? parent : null;
  } catch {
    return null;
  }
}

export function portalMessage(score: number) {
  return { type: "game_result", game: PORTAL_GAME_ID, score: Math.max(0, Math.floor(score)), rp: PORTAL_RP };
}

/** 케어 완료 횟수가 늘 때마다 포털에 알린다 */
export function initPortalBridge() {
  const origin = portalOrigin();
  if (!origin) return;
  let last = useGame.getState().stats.care ?? 0;
  useGame.subscribe((s) => {
    const n = s.stats.care ?? 0;
    if (n > last) {
      try { window.parent.postMessage(portalMessage(n), origin); } catch { /* 부모 창이 사라짐 */ }
    }
    last = n;
  });
}
