"use client";
/** 저사양·WebGL 미지원·모션 최소화 환경에서는 3D 대신 2D 로 자동 전환한다 */
export function canUse3D(): boolean {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    const nav = navigator as Navigator & { deviceMemory?: number };
    if ((nav.deviceMemory ?? 8) <= 2) return false;
    if ((navigator.hardwareConcurrency ?? 8) <= 2) return false;
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
