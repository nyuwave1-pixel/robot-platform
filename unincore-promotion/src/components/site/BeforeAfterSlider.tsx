"use client";

import Image from "next/image";
import { useState } from "react";
import type { BeforeAfter } from "@/content/types";

export function BeforeAfterSlider({ item }: { item: BeforeAfter }) {
  const [pos, setPos] = useState(50);
  return (
    <figure>
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-cream select-none">
        <Image src={item.after} alt={`${item.alt}: ${item.afterLabel}`} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <Image src={item.before} alt={`${item.alt}: ${item.beforeLabel}`} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }} />
        <span className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold">{item.beforeLabel}</span>
        <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-xs font-semibold text-ivory">{item.afterLabel}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Compare ${item.beforeLabel} and ${item.afterLabel}`}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      {item.caption && <figcaption className="mt-3 text-sm text-ink-mute">{item.caption}</figcaption>}
    </figure>
  );
}
