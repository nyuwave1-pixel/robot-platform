"use client";
/**
 * 사용 전/후 비교 카드. 사용 전·사용 후는 서로 다른 날 찍은 사진처럼 표정·포즈가 달라서,
 * 겹쳐 밀어 보는 방식 대신 두 장이 번갈아 서서히 바뀌는 크로스페이드로 보여준다.
 * 마우스를 올리면 사용 후에서 멈추고, 누르면(터치 포함) 전/후를 직접 바꿔 볼 수 있다.
 * 화면 밖이거나 모션 최소화 설정이면 자동 전환을 멈춘다.
 */
import { useEffect, useRef, useState } from "react";

const HOLD_BEFORE = 2200;
const HOLD_AFTER = 3000;

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
  const [showAfter, setShowAfter] = useState(!animate);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!animate || paused) return;
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let visible = false;
    let state = false;
    const step = () => {
      if (!visible) return;
      state = !state;
      setShowAfter(state);
      timer = setTimeout(step, state ? HOLD_AFTER : HOLD_BEFORE);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      clearTimeout(timer);
      if (visible) timer = setTimeout(step, HOLD_BEFORE + phase * 1000);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, [animate, paused, phase]);

  return (
    <div
      ref={ref}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") {
          setPaused(true);
          setShowAfter(true);
        }
      }}
      onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
      onClick={() => {
        setPaused(true);
        setShowAfter((v) => !v);
      }}
      className={`relative h-full w-full cursor-pointer select-none ${className}`}
      data-testid="before-after"
      data-state={showAfter ? "after" : "before"}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={before} alt={`${alt} — ${beforeLabel}`} loading="lazy" decoding="async" draggable={false} className="absolute inset-0 h-full w-full object-cover object-top" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={after}
        alt={`${alt} — ${afterLabel}`}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={`absolute inset-0 h-full w-full object-cover object-top transition-[opacity,transform] duration-700 ease-out ${showAfter ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"}`}
      />
      {/* 전/후 표시: 현재 보이는 쪽이 강조된다 */}
      <div className="theme-dark pointer-events-none absolute left-3 top-3 flex overflow-hidden rounded-full border border-white/20 bg-ink/60 text-[10px] tracking-wide backdrop-blur">
        <span className={`px-2.5 py-1 transition-colors duration-500 ${showAfter ? "text-white/70" : "bg-white/90 text-ink"}`}>{beforeLabel}</span>
        <span className={`px-2.5 py-1 transition-colors duration-500 ${showAfter ? "bg-scan text-ink" : "text-white/70"}`}>{afterLabel}</span>
      </div>
    </div>
  );
}
