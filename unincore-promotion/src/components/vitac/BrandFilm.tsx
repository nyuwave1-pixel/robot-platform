"use client";

import { useEffect, useRef } from "react";
import { lazyPoster } from "@/lib/lazyPoster";
import type { BrandFilm as Film } from "@/data/videos";
import { track } from "@/lib/analytics";
import type { AmazonProduct } from "@/components/site/AmazonButton";

/**
 * Responsive brand film: 16:9 cut from md up, 9:16 cut on phones.
 * Nothing downloads until the visitor presses play (preload="none").
 */
export function BrandFilm({ film, product, className = "" }: { film: Film; product?: AmazonProduct; className?: string }) {
  const played = useRef(false);
  const wide = useRef<HTMLVideoElement>(null);
  const tall = useRef<HTMLVideoElement>(null);
  // Only the variant shown at this breakpoint ever fetches its poster.
  useEffect(() => {
    const a = lazyPoster(wide.current, film.poster);
    const b = lazyPoster(tall.current, film.verticalPoster);
    return () => {
      a();
      b();
    };
  }, [film]);
  const onPlay = () => {
    if (played.current) return;
    played.current = true;
    track("video_play", { ...(product ? { product } : {}), label: film.title });
  };
  return (
    <div className={className}>
      <video
        className="hidden aspect-video w-full rounded-[28px] bg-night object-cover ring-1 ring-champagne/20 md:block"
        ref={wide}
        src={film.src}
        controls
        playsInline
        preload="none"
        onPlay={onPlay}
        aria-label={film.title}
      />
      <video
        className="mx-auto block aspect-[9/16] w-full max-w-[380px] rounded-[28px] bg-night object-cover ring-1 ring-champagne/20 md:hidden"
        ref={tall}
        src={film.vertical}
        controls
        playsInline
        preload="none"
        onPlay={onPlay}
        aria-label={film.title}
      />
    </div>
  );
}
