"use client";
/**
 * '가짜 3D' — Blender Cycles 로 미리 렌더링한 얼굴 턴테이블(36프레임 스프라이트 시트)을 프레임 단위로 넘긴다.
 * WebGL 없이도 고품질 3D 렌더를 보여 줄 수 있다. 에셋: public/3d/face-sequence.webp (scripts/blender 로 생성)
 *  - mode "pointer": 포인터 가로 위치로 회전 (터치·모션 최소화 환경은 자동 왕복)
 *  - mode "scroll" : 요소가 화면을 지나가는 스크롤 진행도로 회전
 */
import { useEffect, useRef, useState } from "react";

const META = { frames: 36, cols: 6, rows: 6 };
const SRC = "/3d/face-sequence.webp";

export default function FaceSequence({ mode = "pointer", className = "" }: { mode?: "pointer" | "scroll"; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = -1;
    const show = (t: number) => {
      const f = Math.max(0, Math.min(META.frames - 1, Math.round(t * (META.frames - 1))));
      if (f === frame) return;
      frame = f;
      el.style.backgroundPosition = `${((f % META.cols) / (META.cols - 1)) * 100}% ${(Math.floor(f / META.cols) / (META.rows - 1)) * 100}%`;
    };
    show(0.5);
    // 화면 근처에 왔을 때만 시트를 내려받는다
    let img: HTMLImageElement | null = null;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || img) return;
        img = new Image();
        img.onload = () => {
          el.style.backgroundImage = `url(${SRC})`;
          setLoaded(true);
        };
        img.src = SRC;
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanup: (() => void)[] = [() => io.disconnect()];
    if (mode === "scroll") {
      const onScroll = () => {
        const r = el.getBoundingClientRect();
        show(1 - (r.top + r.height / 2) / window.innerHeight);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanup.push(() => window.removeEventListener("scroll", onScroll));
    } else {
      let raf = 0;
      let hover = false;
      let target = 0.5;
      let cur = 0.5;
      const start = performance.now();
      const tick = () => {
        if (!hover && !reduce) target = 0.5 + Math.sin((performance.now() - start) / 2600) * 0.42; // 자동 왕복
        cur += (target - cur) * 0.12;
        show(cur);
        raf = requestAnimationFrame(tick);
      };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        const r = el.getBoundingClientRect();
        hover = true;
        target = (e.clientX - r.left) / r.width;
      };
      const onLeave = () => (hover = false);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      if (!reduce) raf = requestAnimationFrame(tick);
      cleanup.push(() => {
        cancelAnimationFrame(raf);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      });
    }
    return () => cleanup.forEach((fn) => fn());
  }, [mode]);
  return (
    <div
      ref={ref}
      aria-hidden
      data-testid="face-sequence"
      className={`aspect-square w-full bg-no-repeat transition-opacity duration-700 [filter:drop-shadow(0_0_26px_rgba(79,182,255,0.45))] ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
      style={{ backgroundSize: `${META.cols * 100}% ${META.rows * 100}%` }}
    />
  );
}
