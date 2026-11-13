"use client";
import type { EventType, TrackEvent } from "../events";

let ctx = { sid: "", locale: "ko" };
export function setTelemetryContext(sid: string, locale: string) {
  ctx = { sid, locale };
}
/** 익명 이벤트 전송 (실패해도 사용자 흐름에 영향 없음). 사진·점수는 보내지 않는다. */
export function track(type: EventType, props?: TrackEvent["props"]): void {
  if (!ctx.sid) return;
  const body = JSON.stringify({ type, sid: ctx.sid, locale: ctx.locale, props });
  try {
    if (navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }))) return;
  } catch {
    /* fall through */
  }
  fetch("/api/events", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
}
