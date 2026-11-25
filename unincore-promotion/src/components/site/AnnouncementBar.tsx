"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Pause, Play } from "@phosphor-icons/react";

/**
 * Top banner. On a product page it runs that product's key selling points as a
 * slow marquee (paused on hover, static under reduced motion); elsewhere it
 * shows the site announcement.
 */
export function AnnouncementBar({ text, banners }: { text: string; banners: Record<string, string[]> }) {
  const pathname = usePathname();
  const items = banners[pathname] ?? [text];
  const [paused, setPaused] = useState(false);
  const loop = [...items, ...items, ...items, ...items];

  return (
    <div className="lp-marquee-wrap relative overflow-hidden bg-[#16150F] text-white" data-paused={paused}>
      <p className="sr-only">{items.join(". ")}</p>
      <div aria-hidden className="lp-marquee flex w-max items-center py-2">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center">
            {loop.map((t, i) => (
              <span key={`${half}-${i}`} className="flex items-center whitespace-nowrap text-[12.5px] font-medium tracking-[0.01em] text-white/90">
                <span className="px-5">{t}</span>
                <span className="h-3 w-px bg-white/25" />
              </span>
            ))}
          </div>
        ))}
      </div>
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-10 w-10 bg-gradient-to-l from-[#16150F] to-transparent" />
      <button
        type="button"
        onClick={() => setPaused((v) => !v)}
        aria-label={paused ? "Play announcements" : "Pause announcements"}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center bg-[#16150F] text-white/80 transition-colors hover:text-white focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-white"
      >
        {paused ? <Play size={13} weight="fill" /> : <Pause size={13} weight="fill" />}
      </button>
    </div>
  );
}
