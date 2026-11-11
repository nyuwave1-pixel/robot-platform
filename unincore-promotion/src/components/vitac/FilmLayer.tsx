"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/perf";
import { lazyPoster } from "@/lib/lazyPoster";
import type { Film } from "@/data/videos";

/**
 * Muted, looping film used as a background or inside a card.
 * Sources are attached only when the film comes near the viewport, playback
 * pauses off screen, and reduced-motion visitors see the poster only.
 */
/** `eager`: first-screen films keep their poster in the HTML (it is the LCP image). */
export function FilmLayer({ film, className = "", label, eager = false }: { film: Film; className?: string; label?: string; eager?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => (eager ? undefined : lazyPoster(ref.current, film.poster)), [film, eager]);

  useEffect(() => {
    const v = ref.current;
    if (!v || prefersReducedMotion()) return;
    let loaded = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!loaded) {
            loaded = true;
            const small = window.innerWidth < 768 && film.mobileSrc;
            v.innerHTML = small
              ? `<source src="${film.mobileSrc}" type="video/mp4">`
              : `${film.webm ? `<source src="${film.webm}" type="video/webm">` : ""}<source src="${film.src}" type="video/mp4">`;
            v.load();
          }
          v.play().catch(() => {});
        } else if (loaded) {
          v.pause();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [film]);

  return (
    <video
      ref={ref}
      className={`pointer-events-none h-full w-full object-cover ${className}`}
      poster={eager ? film.poster : undefined}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden={label ? undefined : true}
      aria-label={label}
    />
  );
}
