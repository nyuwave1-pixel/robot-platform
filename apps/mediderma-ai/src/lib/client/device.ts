"use client";
/**
 * 저사양·WebGL 미지원·모션 최소화 환경에서는 3D 대신 2D 로 자동 전환한다.
 * GPU 없이 CPU 로 그리는 소프트웨어 렌더러(SwiftShader·llvmpipe 등)도 2D 로 보낸다 —
 * 3D 타이틀·셰이더가 메인 스레드를 계속 점유해 화면이 버벅이고 배터리를 많이 쓰기 때문이다.
 */
const SOFTWARE_GL = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i;

let cached: boolean | null = null;
export function canUse3D(): boolean {
  if (cached !== null) return cached;
  cached = detect();
  return cached;
}

function detect(): boolean {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    if (nav.connection?.saveData) return false;
    if ((nav.deviceMemory ?? 8) <= 2) return false;
    if ((navigator.hardwareConcurrency ?? 8) <= 2) return false;
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !SOFTWARE_GL.test(renderer);
  } catch {
    return false;
  }
}
