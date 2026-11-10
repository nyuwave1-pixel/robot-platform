"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Play } from "@phosphor-icons/react";
import { track } from "@/lib/analytics";

/**
 * Vertical creator video. Shows a clean poster with a play button; the video
 * (and the browser's controls) only load once someone taps it.
 */
export function VideoCard({ src, poster, caption, duration }: { src: string; poster: string; caption: string; duration: string }) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  return (
    <div className="relative aspect-[9/16] overflow-hidden rounded-[20px] bg-[#16150F] shadow-[0_0_0_1.5px_rgb(255_255_255/0.9),0_18px_34px_-24px_rgb(var(--acc-deep)/0.55)]">
      {playing ? (
        <video ref={ref} className="h-full w-full object-cover" src={src} poster={poster} playsInline controls autoPlay aria-label={caption} />
      ) : (
        <button
          type="button"
          onClick={() => {
            setPlaying(true);
            track("video_play", { label: caption });
          }}
          aria-label={`Play video: ${caption}`}
          className="group absolute inset-0 block"
        >
          <Image src={poster} alt="" fill sizes="(min-width: 1024px) 140px, 46vw" className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
          <span aria-hidden className="lens absolute left-1/2 top-1/2 w-12 -translate-x-1/2 -translate-y-1/2 text-[#16150F] transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95">
            <Play size={18} weight="fill" className="translate-x-[1px]" />
          </span>
          <span aria-hidden className="absolute bottom-2.5 left-2.5 rounded-[8px] bg-black/55 px-2 py-1 text-[11.5px] font-semibold tabular-nums text-white backdrop-blur-md">
            {duration}
          </span>
        </button>
      )}
    </div>
  );
}
