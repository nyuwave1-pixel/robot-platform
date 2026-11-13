"use client";
/** 2D 얼굴 메시 (SVG) — 3D 를 쓸 수 없는 환경의 히어로, 그리고 영역 소개 섹션의 인터랙티브 맵 */
import { useMemo } from "react";
import { CANONICAL, FACE_ZONES, TRIANGLES } from "@/lib/analysis/zones";
import type { FaceZoneId } from "@/lib/analysis/types";

export default function FaceFallback({ active = null, onHover, mesh = false }: { active?: FaceZoneId | null; onHover?: (z: FaceZoneId | null) => void; mesh?: boolean }) {
  const { pts, polys, edges } = useMemo(() => {
    const p: [number, number][] = [];
    for (let i = 0; i < CANONICAL.length; i += 3) p.push([CANONICAL[i] * 10 + 100, -CANONICAL[i + 1] * 10 + 110]);
    const seen = new Set<string>();
    let d = "";
    for (let i = 0; i < TRIANGLES.length; i += 3) {
      for (const [a, b] of [[0, 1], [1, 2], [2, 0]] as const) {
        const u = TRIANGLES[i + a], v = TRIANGLES[i + b];
        const k = u < v ? `${u}-${v}` : `${v}-${u}`;
        if (seen.has(k)) continue;
        seen.add(k);
        d += `M${p[u][0].toFixed(1)} ${p[u][1].toFixed(1)}L${p[v][0].toFixed(1)} ${p[v][1].toFixed(1)}`;
      }
    }
    return { pts: p, polys: FACE_ZONES.map((z) => ({ id: z.id, d: z.polygon.map((i) => p[i].join(",")).join(" ") })), edges: d };
  }, []);
  return (
    <svg viewBox="0 0 200 220" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="ff-glow" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="rgba(79,182,255,0.22)" />
          <stop offset="1" stopColor="rgba(79,182,255,0)" />
        </radialGradient>
        <linearGradient id="ff-scan" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="rgba(127,224,255,0)" />
          <stop offset="0.5" stopColor="rgba(127,224,255,0.55)" />
          <stop offset="1" stopColor="rgba(127,224,255,0)" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="105" rx="92" ry="104" fill="url(#ff-glow)" />
      {mesh && <path d={edges} stroke="rgba(143,170,198,0.28)" strokeWidth="0.25" fill="none" />}
      {polys.map((z, i) => {
        const on = active === z.id;
        return (
          <polygon
            key={z.id}
            points={z.d}
            fill={on ? "rgba(79,182,255,0.42)" : "rgba(79,182,255,0.07)"}
            stroke={on ? "#9fe6ff" : "rgba(127,224,255,0.5)"}
            strokeWidth={on ? 0.9 : 0.4}
            style={{ transition: "fill .25s, stroke .25s", cursor: onHover ? "pointer" : undefined, animation: active === null && onHover ? `pulse-zone 3.2s ease-in-out ${i * 0.18}s infinite` : undefined, filter: on ? "drop-shadow(0 0 4px rgba(127,224,255,0.9))" : undefined }}
            onPointerEnter={() => onHover?.(z.id)}
            onPointerLeave={() => onHover?.(null)}
          />
        );
      })}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.5" fill="#c9d1d9" opacity="0.65" />
      ))}
      {mesh && (
        <rect x="6" y="0" width="188" height="26" fill="url(#ff-scan)">
          <animate attributeName="y" values="-10;200;-10" dur="5.5s" repeatCount="indefinite" />
        </rect>
      )}
    </svg>
  );
}
