"use client";
/**
 * 사용 전/후 비교 카드. 두 사진을 겹쳐 두고 세로 분할선이 좌우로 오가며 '사용 전 → 사용 후' 로 바뀐다.
 * 마우스·손가락을 올리면 분할선이 포인터를 따라간다. 화면 밖이거나 모션 최소화 설정이면 멈춘다.
 * 분할 위치는 CSS 변수(--p)만 바꿔서 리렌더 없이 그린다.
 */
import { useEffect, useRef } from "react";

const CYCLE = 6.4; // 초: 사용 전 유지 → 넘어감 → 사용 후 유지 → 되돌아감

function posAt(t: number) {
  const s = ((t % CYCLE) + CYCLE) % CYCLE;
  const ease = (x: number) => x * x * (3 - 2 * x);
  if (s < 1.2) return 100; // 사용 전이 화면 전체
  if (s < 3.0) return 100 - 100 * ease((s - 1.2) / 1.8);
  if (s < 4.6) return 0; // 사용 후가 화면 전체
  return 100 * ease((s - 4.6) / 1.8);
}

export default function BeforeAfter({
  before,
  after,
  beforeLabel,
  afterLabel,
  alt,
  phase = 0,
  animate = true,
  className = "",
}: {
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
  alt: string;
  phase?: number;
  animate?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hover = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--p", "50%");
    if (!animate) return;
    let raf = 0;
    let visible = false;
    const t0 = performance.now();
    const tick = (now: number) => {
      if (!hover.current) el.style.setProperty("--p", `${posAt((now - t0) / 1000 + phase)}%`);
      raf = visible ? requestAnimationFrame(tick) : 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [animate, phase]);

  const follow = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    hover.current = true;
    e.currentTarget.style.setProperty("--p", `${Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))}%`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={follow}
      onPointerDown={follow}
      onPointerLeave={() => (hover.current = false)}
      className={`relative h-full w-full touch-pan-y select-none ${className}`}
      data-testid="before-after"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={`${alt} — ${afterLabel}`} loading="lazy" decoding="async" draggable={false} className="absolute inset-0 h-full w-full object-cover object-top" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={before}
        alt={`${alt} — ${beforeLabel}`}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover object-top"
        style={{ clipPath: "inset(0 calc(100% - var(--p, 50%)) 0 0)" }}
      />
      {/* 분할선 */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-white/80 shadow-[0_0_14px_3px_rgba(125,211,252,0.7)]" style={{ left: "var(--p, 50%)" }}>
        <span className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-ink/50 backdrop-blur" />
      </div>
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] tracking-wide text-white/90 backdrop-blur">{beforeLabel}</span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-scan/80 px-2 py-0.5 text-[10px] tracking-wide text-ink backdrop-blur">{afterLabel}</span>
    </div>
  );
}
