"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Fig } from "./Fig";

type Row = { label: string; value: string; share: number; detail?: string };

/**
 * Clinical results on a shared 0-40% scale: hairline meters in the product's deep tone with a glass
 * bead at the reading. When the block first scrolls into view the meters fill.
 * The figures never count up: they always show the tested values, so a screenshot
 * taken mid-animation can't show a wrong number (JYT revision 1, item 3).
 */
export function ResultMeters({ rows }: { rows: Row[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen: keep the final state
    setT(0);
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / 1300);
          setT(1 - Math.pow(1 - p, 4));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="space-y-8">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-end justify-between gap-4">
            <p className="pb-1.5 text-[16px] font-semibold text-body">{r.label}</p>
            <p className="serif text-[clamp(36px,4vw,48px)] font-semibold leading-none tracking-[-0.02em] text-acc-deep">
              <Fig value={r.value} />
            </p>
          </div>
          <div className="meter mt-4" style={{ "--p": (r.share * t).toFixed(4) } as CSSProperties}>
            <div className="meter-fill" />
            <span className="meter-bead" />
          </div>
          {r.detail && <p className="mt-3 text-[13px] tabular-nums text-body-mute">{r.detail}</p>}
        </div>
      ))}
      <div aria-hidden className="relative h-7 text-[12px] tabular-nums text-body-mute">
        {[0, 10, 20, 30, 40].map((n) => (
          <span
            key={n}
            className={`absolute top-0 flex flex-col ${n === 0 ? "items-start" : n === 40 ? "-translate-x-full items-end" : "-translate-x-1/2 items-center"}`}
            style={{ left: `${(n / 40) * 100}%` }}
          >
            <span className="mb-1 h-2 w-px bg-body/25" />
            {n}%
          </span>
        ))}
      </div>
    </div>
  );
}
