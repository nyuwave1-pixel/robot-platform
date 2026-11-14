"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, renderTier } from "@/lib/perf";
import type { Film } from "@/data/videos";
import { lazyPoster } from "@/lib/lazyPoster";

/**
 * A pinned, full-screen film controlled by scroll (desktop): scrolling moves the
 * film forward and back frame by frame, and stops exactly where the visitor
 * stops. Captions step in as the film progresses.
 *
 * Touch devices and the mid tier get a muted autoplay loop instead (seeking on
 * scroll is janky there); reduced motion shows the poster and all captions.
 */
export function ScrubFilm({
  film,
  captions,
  eyebrow,
  note,
  tone = "dark",
  id,
}: {
  film: Film;
  captions: string[];
  eyebrow: string;
  note?: string;
  tone?: "dark" | "light";
  id?: string;
}) {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => lazyPoster(video.current, film.poster), [film]);
  const [step, setStep] = useState(-1);
  const [mode, setMode] = useState<"poster" | "scrub" | "loop">("poster");

  useEffect(() => {
    const s = section.current;
    const v = video.current;
    if (!s || !v) return;
    if (prefersReducedMotion()) {
      setStep(captions.length - 1);
      return;
    }
    const scrub = renderTier() === "high" && window.matchMedia("(pointer: fine)").matches;
    setMode(scrub ? "scrub" : "loop");

    let attached = false;
    let visible = false;
    let raf = 0;
    let target = 0;
    let shown = 0;

    const attach = () => {
      if (attached) return;
      attached = true;
      v.innerHTML = `${film.webm ? `<source src="${film.webm}" type="video/webm">` : ""}<source src="${film.src}" type="video/mp4">`;
      v.preload = "auto";
      v.load();
      if (!scrub) {
        v.loop = true;
        v.play().catch(() => {});
      }
    };

    const tick = () => {
      if (!visible) return;
      raf = requestAnimationFrame(tick);
      const r = s.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
      const next = p < 0.06 ? -1 : Math.min(captions.length - 1, Math.floor(p * captions.length * 0.999 + 0.15));
      setStep((cur) => (cur === next ? cur : next));
      if (scrub && v.readyState >= 1 && v.duration) {
        target = p * (v.duration - 0.05);
        shown += (target - shown) * 0.25; // ease toward the scroll position
        if (Math.abs(v.currentTime - shown) > 0.02 && !v.seeking) v.currentTime = shown;
      }
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) {
          attach();
          if (!scrub) v.play().catch(() => {});
          cancelAnimationFrame(raf);
          tick();
        } else {
          cancelAnimationFrame(raf);
          if (!scrub) v.pause();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(s);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [film, captions.length]);

  const dark = tone === "dark";
  return (
    <section ref={section} id={id} className={`relative h-[260vh] ${dark ? "bg-night text-ivory" : "bg-ivory text-ink"}`} aria-label={`${eyebrow}: ${captions.join(" ")}`}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <video
          ref={video}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          preload="none"
          aria-hidden
        />
        <div className={`absolute inset-0 ${dark ? "bg-[radial-gradient(80%_70%_at_50%_50%,rgba(8,7,6,0)_30%,rgba(8,7,6,.75)_100%)]" : "bg-[radial-gradient(80%_70%_at_50%_50%,rgba(247,242,234,0)_35%,rgba(247,242,234,.7)_100%)]"}`} aria-hidden />
        <div className="relative z-10 flex h-full flex-col justify-between px-5 pb-10 pt-24 sm:px-10 sm:pb-14">
          <p className={`eyebrow ${dark ? "!text-champagne" : ""}`}>{eyebrow}</p>
          <div className="grid gap-1 sm:gap-2" aria-hidden>
            {captions.map((c, i) => (
              <p
                key={c}
                className="vc-scrub-caption font-display text-[13vw] leading-[0.92] sm:text-[9vw] lg:text-[7.5vw]"
                data-on={step >= i ? "1" : "0"}
                style={{ ["--d" as string]: `${i * 60}ms` }}
              >
                {c}
              </p>
            ))}
          </div>
          <div className="flex items-end justify-between gap-6">
            {note && <p className={`max-w-sm text-xs ${dark ? "text-ivory/60" : "text-ink-mute"}`}>{note}</p>}
            <div className={`h-px w-40 shrink-0 sm:w-64 ${dark ? "bg-ivory/20" : "bg-ink/15"}`} aria-hidden>
              <div ref={bar} className="h-px origin-left bg-champagne" style={{ transform: mode === "poster" ? "scaleX(1)" : "scaleX(0)" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
