"use client";
import { useEffect, useState } from "react";

export type QualityTier = "high" | "mid" | "lite";

export function useReducedMotion() {
  const [reduced, set] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => set(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function useIsMobile(breakpoint = 768) {
  const [mobile, set] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const on = () => set(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [breakpoint]);
  return mobile;
}

/** 기기 성능 추정 → 3D/파티클 품질 프리셋 */
export function useQualityTier(): QualityTier {
  const [tier, set] = useState<QualityTier>("mid");
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
    const cores = nav.hardwareConcurrency || 4;
    const mem = nav.deviceMemory || 4;
    const saveData = nav.connection?.saveData === true;
    const slow = /2g|3g/.test(nav.connection?.effectiveType || "");
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    if (saveData || slow || (mobile && (cores <= 4 || mem <= 3))) set("lite");
    else if (mobile || cores <= 4 || mem <= 4) set("mid");
    else set("high");
  }, []);
  return tier;
}

export function hasWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** 인트로가 닫힌 뒤에만 true — 인트로 뒤에 가려진 히어로 영상 등 무거운 리소스를 지연 로드 */
export function useIntroClosed() {
  const [closed, set] = useState(false);
  useEffect(() => {
    const check = () => set(document.documentElement.dataset.intro === "closed");
    check();
    window.addEventListener("uc:intro-closed", check);
    return () => window.removeEventListener("uc:intro-closed", check);
  }, []);
  return closed;
}
