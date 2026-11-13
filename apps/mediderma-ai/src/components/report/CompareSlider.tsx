"use client";
import { useEffect, useRef, useState } from "react";

/** 두 캔버스(같은 크기)를 좌우로 가르는 BEFORE / AFTER 슬라이더. 마우스·터치·키보드 지원 */
export default function CompareSlider({ left, right, leftLabel, rightLabel, hint, testId = "slider" }: {
  left: HTMLCanvasElement; right: HTMLCanvasElement; leftLabel: string; rightLabel: string; hint: string; testId?: string;
}) {
  const [pos, setPos] = useState(50);
  const a = useRef<HTMLCanvasElement>(null);
  const b = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    for (const [ref, src] of [[a, left], [b, right]] as const) {
      const c = ref.current;
      if (!c) continue;
      c.width = src.width;
      c.height = src.height;
      c.getContext("2d")!.drawImage(src, 0, 0);
    }
  }, [left, right]);
  const move = (clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div>
      <div
        ref={box}
        data-testid={testId}
        className="relative select-none overflow-hidden rounded-xl touch-pan-y"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          move(e.clientX);
        }}
        onPointerMove={(e) => e.buttons && move(e.clientX)}
      >
        <canvas ref={b} className="block h-auto w-full" />
        <canvas ref={a} className="absolute inset-0 h-full w-full" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(79,182,255,0.9)]" style={{ left: `${pos}%` }}>
          <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs font-bold text-black">⇆</span>
        </div>
        <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-[11px]">{leftLabel}</span>
        <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-[11px] text-scan2">{rightLabel}</span>
      </div>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label={hint} className="mt-2 w-full accent-[#4fb6ff]" />
      <p className="text-center text-[11px] text-silver/70">{hint}</p>
    </div>
  );
}
