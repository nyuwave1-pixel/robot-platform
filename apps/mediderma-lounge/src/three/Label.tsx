import { useMemo } from "react";
import * as THREE from "three";

/** 캔버스로 그린 텍스트 평면 (외부 폰트 파일 다운로드 없이 한글·영문 표기) */
export function Label({ text, sub, width = 2, color = "#c9a66b", bg, size = 120, weight = 600, spacing = 0.12, ...props }: {
  text: string; sub?: string; width?: number; color?: string; bg?: string; size?: number; weight?: number; spacing?: number;
} & JSX.IntrinsicElements["mesh"]) {
  const { tex, aspect } = useMemo(() => {
    const c = document.createElement("canvas");
    const h = sub ? 320 : 220;
    c.width = 1024; c.height = h;
    const g = c.getContext("2d")!;
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, c.width, h); }
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = color;
    let fs = size;
    const font = (s: number, w = weight) => `${w} ${s}px "Pretendard Variable", "Apple SD Gothic Neo", "Noto Sans KR", "Helvetica Neue", Arial, sans-serif`;
    g.font = font(fs);
    try { (g as unknown as { letterSpacing: string }).letterSpacing = `${Math.round(fs * spacing)}px`; } catch { /* 미지원 브라우저 */ }
    while (g.measureText(text).width > 960 && fs > 30) { fs -= 6; g.font = font(fs); }
    g.fillText(text, 512, sub ? 130 : 110);
    if (sub) { g.font = font(46, 400); g.globalAlpha = 0.85; g.fillText(sub, 512, 245); }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return { tex: t, aspect: c.width / h };
  }, [text, sub, color, bg, size, weight, spacing]);
  return (
    <mesh {...props}>
      <planeGeometry args={[width, width / aspect]} />
      <meshBasicMaterial map={tex} transparent={!bg} toneMapped={false} />
    </mesh>
  );
}
