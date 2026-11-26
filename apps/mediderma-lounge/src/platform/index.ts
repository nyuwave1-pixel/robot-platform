/**
 * 플랫폼 연결 (지금은 비트파크 우선).
 *  - ADAPTERS 순서대로 detect() 해서 지금 실행 중인 플랫폼을 고른다 (없으면 일반 웹)
 *  - 공유 · 초대 · 방문 링크는 "지금 플랫폼이 직접 링크를 가지면 그 주소, 아니면 홈 플랫폼(비트파크)" 으로 만든다
 *  - 플레이 기록은 reportPlay() 한 곳으로 보낸다 → 플랫폼이 보상을 판단
 * 새 플랫폼 추가: types.ts 의 PlatformId 에 이름 추가 → 어댑터 파일 → ADAPTERS 에 넣기 (docs/PLATFORMS.md)
 */
import { useGame } from "../store/game";
import { bitpark } from "./bitpark";
import { web } from "./web";
import type { LinkParams, Platform, PlayEvent } from "./types";

export type { LinkParams, Platform, PlatformId, PlayEvent } from "./types";

/** 이 게임의 홈 플랫폼: 공유 링크 · "어디서 플레이하나요" 안내의 기준 */
export const HOME_PLATFORM: Platform = bitpark;
/** 감지 순서 (마지막은 항상 일반 웹) */
export const ADAPTERS: Platform[] = [bitpark, web];

let current: Platform | null = null;
export function platform(): Platform {
  if (!current) current = ADAPTERS.find((a) => a.detect()) ?? web;
  return current;
}
/** 홈 플랫폼 안에서 실행 중인지 (아니면 홈 플랫폼으로 안내) */
export const onHomePlatform = () => platform().id === HOME_PLATFORM.id;

/** 공유 · 초대 · 방문 링크 */
export function shareUrl(p?: LinkParams): string {
  const cur = platform();
  return (cur.id === "web" ? HOME_PLATFORM : cur).playUrl(p);
}

/** 플레이 기록을 플랫폼에 알린다 (같은 종류는 1분에 한 번만) */
const lastSent: Partial<Record<PlayEvent, number>> = {};
export function reportPlay(ev: PlayEvent, score = 1) {
  const now = Date.now();
  if ((lastSent[ev] ?? 0) > now - 60_000) return;
  lastSent[ev] = now;
  platform().report(ev, score);
}

/** 앱 시작 시 한 번: 플랫폼 준비 + 케어 완료를 자동으로 알린다 */
export function initPlatform() {
  const p = platform();
  p.init();
  let last = useGame.getState().stats.care ?? 0;
  useGame.subscribe((s) => {
    const n = s.stats.care ?? 0;
    if (n > last) reportPlay("care", n);
    last = n;
  });
}

/** 테스트용: 감지 결과 초기화 */
export function resetPlatformForTest() { current = null; for (const k of Object.keys(lastSent)) delete lastSent[k as PlayEvent]; }
