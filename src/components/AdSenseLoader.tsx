"use client";

import { useEffect } from "react";
import { ADSENSE_CLIENT, ADSENSE_ENABLED } from "@/lib/monetization";

export default function AdSenseLoader() {
  useEffect(() => {
    if (!ADSENSE_ENABLED) return;
    if (document.querySelector('script[src*="adsbygoogle.js"]')) return;

    let loaded = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
      const s = document.createElement("script");
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
      s.async = true;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
      cleanup();
    };

    const events: (keyof WindowEventMap)[] = ["scroll", "pointermove", "pointerdown", "keydown", "touchstart"];
    const cleanup = () => events.forEach((e) => window.removeEventListener(e, load));
    events.forEach((e) => window.addEventListener(e, load, { once: true, passive: true }));

    return cleanup;
  }, []);

  return null;
}
