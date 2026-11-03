"use client";
import { useEffect, useRef, useState } from "react";
import { useInView } from "@/features/scroll/useSectionProgress";

/** 숫자 카운트업 (SSR 에서는 최종값 노출, 진입 시 0→값) */
export default function Counter({ value, decimals = 2, duration = 1.6, suffix = "", className }: { value: number; decimals?: number; duration?: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  const started = useRef(false);
  useInView(ref, () => {
    if (started.current) return; started.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / (duration * 1000));
      const e = 1 - Math.pow(1 - p, 3);
      setShown(value * e);
      if (p < 1) requestAnimationFrame(tick);
      else setShown(value);
    };
    requestAnimationFrame(tick);
  });
  useEffect(() => { if (!started.current) setShown(value); }, [value]);
  return <span ref={ref} className={className}><data value={value}>{shown.toFixed(decimals)}</data>{suffix}</span>;
}
