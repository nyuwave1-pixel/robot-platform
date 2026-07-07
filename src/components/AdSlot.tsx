"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, ADSENSE_ENABLED } from "@/lib/monetization";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdVariant = "banner" | "in-feed" | "sidebar";

const VARIANT_STYLES: Record<AdVariant, React.CSSProperties> = {
  banner: { display: "block", minHeight: 90 },
  "in-feed": { display: "block", minHeight: 100 },
  sidebar: { display: "block", minHeight: 250 },
};

interface AdSlotProps {
  slot?: string;
  variant?: AdVariant;
  className?: string;
}

export default function AdSlot({ slot, variant = "banner", className = "" }: AdSlotProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_ENABLED || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdBlock 등으로 스크립트가 없을 때 무시
    }
  }, []);

  if (!ADSENSE_ENABLED) return null;

  return (
    <div className={`overflow-hidden ${className}`} aria-label="Advertisement">
      <span className="block text-center text-[11px] uppercase tracking-widest text-zinc-500 mb-1">Ad</span>
      <ins
        className="adsbygoogle"
        style={VARIANT_STYLES[variant]}
        data-ad-client={ADSENSE_CLIENT}
        {...(slot ? { "data-ad-slot": slot } : {})}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
