"use client";
import type React from "react";
/**
 * 첫 화면 인물(HeroPortrait) 위에 얹는 분석 HUD: 모서리 브래킷 · 스캔 라인 · 부위 표식.
 * 순수 CSS/SVG 라서 WebGL 이 없는 기기에서도 그대로 동작한다. 장식 요소이므로 aria-hidden.
 */
const MARKS: HudMark[] = [
  { x: 50, y: 24, lx: 80, ly: 12, align: "start" }, // 이마
  { x: 64, y: 52, lx: 90, ly: 50, align: "start" }, // 볼
  { x: 40, y: 43, lx: 9, ly: 34, align: "end" }, // 눈밑
  { x: 39, y: 68, lx: 10, ly: 78, align: "end" }, // 턱선
];

export type HudMark = { x: number; y: number; lx: number; ly: number; align: "start" | "end" };

export default function ScanHud({ labels, animate = true, marks = MARKS }: { labels: string[]; animate?: boolean; marks?: HudMark[] }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" data-testid="scan-hud">
      {/* 모서리 브래킷 */}
      {["left-[6%] top-[6%] border-l border-t", "right-[6%] top-[6%] border-r border-t", "left-[6%] bottom-[6%] border-l border-b", "right-[6%] bottom-[6%] border-r border-b"].map((c) => (
        <span key={c} className={`absolute h-7 w-7 border-scan2/70 ${c}`} />
      ))}
      {/* 스캔 라인 */}
      {animate && (
        <div className="absolute inset-x-[10%] top-0 h-full overflow-hidden">
          <div className="absolute inset-x-0 h-[2px] animate-scan bg-gradient-to-r from-transparent via-scan2 to-transparent shadow-[0_0_18px_4px_rgba(125,211,252,0.55)]" style={{ animationDuration: "4.8s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" }} />
        </div>
      )}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
        {marks.map((m, i) => (
          <g key={i}>
            <line x1={m.x} y1={m.y} x2={m.lx} y2={m.ly} stroke="rgba(125,211,252,0.55)" strokeWidth="0.25" strokeDasharray="1 1" style={animate ? { animation: "pulse-zone 2.4s ease-in-out infinite" } : undefined} />
            <circle cx={m.x} cy={m.y} r="1.1" fill="rgba(125,211,252,0.95)" />
            <circle cx={m.x} cy={m.y} r="2.6" fill="none" stroke="rgba(125,211,252,0.6)" strokeWidth="0.3" style={animate ? { animation: `pulse-zone 2.6s ease-in-out ${i * 0.5}s infinite` } : undefined} />
          </g>
        ))}
      </svg>
      {marks.map((m, i) =>
        labels[i] ? (
          <span
            key={i}
            // 좁은 화면에서는 라벨이 틀 밖으로 잘리지 않도록 가장자리 안쪽에 붙이고, sm 이상에서만 지정 좌표에 둔다.
            className={`absolute top-[var(--ly)] -translate-y-1/2 whitespace-nowrap rounded-full border border-scan2/40 bg-ink/70 px-2 py-0.5 text-[10px] tracking-wide text-scan2 backdrop-blur ${
              m.align === "end" ? "left-1 sm:left-[var(--lx)] sm:-translate-x-full" : "right-1 sm:right-auto sm:left-[var(--lx)]"
            }`}
            style={{ "--lx": `${m.lx}%`, "--ly": `${m.ly}%` } as React.CSSProperties}
          >
            {labels[i]}
          </span>
        ) : null,
      )}
    </div>
  );
}
