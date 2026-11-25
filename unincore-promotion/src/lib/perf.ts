"use client";

/**
 * Rendering tier for the cinematic layer.
 *   high → full WebGL effects
 *   mid  → WebGL at reduced resolution / density
 *   low  → no WebGL; the page shows its static photography + CSS
 *
 * "low" is chosen for reduced motion, data saver, no WebGL, or very weak devices,
 * so product photos and Amazon buttons never wait on 3D.
 */
export type Tier = "high" | "mid" | "low";

let cached: Tier | null = null;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function renderTier(): Tier {
  if (cached) return cached;
  if (typeof window === "undefined") return "low";
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const forced = new URLSearchParams(location.search).get("fx");
  if (forced === "high" || forced === "mid" || forced === "low") return (cached = forced);
  if (prefersReducedMotion() || nav.connection?.saveData || !hasWebGL()) return (cached = "low");
  const mem = nav.deviceMemory ?? 4;
  const cores = nav.hardwareConcurrency ?? 4;
  const small = window.innerWidth < 768;
  if (mem <= 2 || cores <= 2) return (cached = "low");
  if (small || mem <= 4 || cores <= 4) return (cached = "mid");
  return (cached = "high");
}
