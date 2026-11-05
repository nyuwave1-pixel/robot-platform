"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/perf";

/**
 * Exposes how far its box has travelled through the viewport as the CSS
 * variable --p (0 → 1), so children can animate with plain CSS (clip-path,
 * scale, translate). Reduced motion pins --p to 1 (the finished state).
 */
export function ScrollProgress({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.setProperty("--p", "1");
      return;
    }
    let raf = 0;
    let visible = false;
    const tick = () => {
      if (!visible) return;
      raf = requestAnimationFrame(tick);
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height * 0.6)));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) tick();
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={className} style={{ ["--p" as string]: 0 }}>
      {children}
    </div>
  );
}
