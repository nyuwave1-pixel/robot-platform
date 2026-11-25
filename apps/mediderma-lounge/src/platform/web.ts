/**
 * 일반 웹 (게임 주소로 바로 들어온 경우). 보상을 주는 곳이 없어 기록은 보내지 않고,
 * 공유 링크는 홈 플랫폼(비트파크) 주소를 쓴다 — 친구는 비트파크에서 함께 플레이한다.
 */
import type { Platform } from "./types";

export const web: Platform = {
  id: "web",
  name: { ko: "웹", en: "Web" },
  detect: () => true,
  playUrl() { return typeof location !== "undefined" ? location.origin + location.pathname : "/"; },
  init() {},
  report() {},
};
