"use client";
import { track as vercelTrack } from "@vercel/analytics";
import { sendGAEvent } from "@next/third-parties/google";

export type TrackParams = Record<string, string | number | boolean>;

/** 클릭 추적 — GA4(NEXT_PUBLIC_GA_ID 설정 시) + Vercel Analytics 커스텀 이벤트(Pro 이상에서 집계) */
export function track(name: string, params: TrackParams = {}) {
  try { if (process.env.NEXT_PUBLIC_GA_ID) sendGAEvent("event", name, params); } catch {}
  try { vercelTrack(name, params); } catch {}
}
