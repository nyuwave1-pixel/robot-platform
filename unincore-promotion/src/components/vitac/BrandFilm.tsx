"use client";

import { useRef } from "react";
import type { BrandFilm as Film } from "@/data/videos";
import { track } from "@/lib/analytics";
import type { AmazonProduct } from "@/components/site/AmazonButton";

/**
 * Responsive brand film: 16:9 cut from md up, 9:16 cut on phones.
 * Nothing downloads until the visitor presses play (preload="none").
 */
export function BrandFilm({ film, product, className = "" }: { film: Film; product?: AmazonProduct; className?: string }) {
  const played = useRef(false);
  const onPlay = () => {
    if (played.current) return;
    played.current = true;
    track("video_play", { ...(product ? { product } : {}), label: film.title });
  };
  return (
    <div className={className}>
      <video
        className="hidden aspect-video w-full rounded-[28px] bg-night object-cover ring-1 ring-champagne/20 md:block"
        src={film.src}
        poster={film.poster}
        controls
        playsInline
        preload="none"
        onPlay={onPlay}
        aria-label={film.title}
      />
      <video
        className="mx-auto block aspect-[9/16] w-full max-w-[380px] rounded-[28px] bg-night object-cover ring-1 ring-champagne/20 md:hidden"
        src={film.vertical}
        poster={film.verticalPoster}
        controls
        playsInline
        preload="none"
        onPlay={onPlay}
        aria-label={film.title}
      />
    </div>
  );
}
