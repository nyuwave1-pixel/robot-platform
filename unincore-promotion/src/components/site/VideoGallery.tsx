"use client";

import type { VideoItem } from "@/content/types";
import { track } from "@/lib/analytics";
import type { AmazonProduct } from "./AmazonButton";

export function VideoGallery({ videos, product }: { videos: VideoItem[]; product: AmazonProduct }) {
  return (
    <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
      {videos.map((v) => (
        <figure key={v.id} className="w-[72vw] max-w-[320px] shrink-0 snap-center sm:w-auto sm:max-w-none">
          <video
            className="aspect-[9/16] w-full rounded-3xl bg-cream object-cover"
            src={v.src}
            poster={v.poster}
            controls
            playsInline
            preload="none"
            onPlay={() => track("video_play", { product, label: v.title })}
          />
          <figcaption className="mt-3 text-sm">
            <span className="font-medium">{v.title}</span>
            {v.creator && <span className="text-ink-mute"> · {v.creator}</span>}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
