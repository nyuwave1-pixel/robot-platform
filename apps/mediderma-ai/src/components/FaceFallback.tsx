"use client";
/** 3D 를 쓸 수 없는 환경용 2D 얼굴 메시 (SVG) */
import { useMemo } from "react";
import { CANONICAL, FACE_ZONES } from "@/lib/analysis/zones";

export default function FaceFallback() {
  const { pts, polys } = useMemo(() => {
    const p: [number, number][] = [];
    for (let i = 0; i < CANONICAL.length; i += 3) p.push([CANONICAL[i] * 10 + 100, -CANONICAL[i + 1] * 10 + 110]);
    return { pts: p, polys: FACE_ZONES.map((z) => z.polygon.map((i) => p[i].join(",")).join(" ")) };
  }, []);
  return (
    <svg viewBox="0 0 200 220" className="h-full w-full" aria-hidden>
      {polys.map((d, i) => (
        <polygon key={i} points={d} fill="rgba(79,182,255,0.08)" stroke="rgba(127,224,255,0.45)" strokeWidth="0.4" />
      ))}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.55" fill="#c9d1d9" opacity="0.7" />
      ))}
    </svg>
  );
}
