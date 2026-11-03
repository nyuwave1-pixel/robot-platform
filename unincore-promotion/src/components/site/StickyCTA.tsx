"use client";

import { useEffect, useState } from "react";
import { AmazonButton, type AmazonProduct } from "./AmazonButton";
import { usePromoActive } from "./PromoBanner";

/**
 * Mobile-only bottom bar. Appears after the hero scrolls away and hides while
 * the final CTA or footer is on screen, so it never covers the content it repeats.
 */
export function StickyCTA({ product, promoInitial }: { product: AmazonProduct; promoInitial: boolean }) {
  const [show, setShow] = useState(false);
  const promo = usePromoActive(product.promotion, promoInitial);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const hideZones = Array.from(document.querySelectorAll("[data-hide-sticky]"));
    if (!hero) return;
    let heroOut = false;
    const visibleZones = new Set<Element>();
    const update = () => setShow(heroOut && visibleZones.size === 0);
    const heroIo = new IntersectionObserver(([e]) => {
      heroOut = !e.isIntersecting;
      update();
    });
    const zoneIo = new IntersectionObserver((entries) => {
      for (const e of entries) e.isIntersecting ? visibleZones.add(e.target) : visibleZones.delete(e.target);
      update();
    });
    heroIo.observe(hero);
    hideZones.forEach((z) => zoneIo.observe(z));
    return () => {
      heroIo.disconnect();
      zoneIo.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-ivory/95 px-4 pt-3 backdrop-blur transition-transform duration-300 md:hidden ${show ? "translate-y-0" : "translate-y-full"}`}
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{product.name}</p>
          <p className="text-xs text-ink-mute">{promo && product.promotion ? `${product.promotion.discountPct}% off on Amazon` : "Available on Amazon.com"}</p>
        </div>
        <AmazonButton product={product} location="sticky" className="btn-amazon !min-h-[44px] !px-5 !text-xs">
          Shop now
        </AmazonButton>
      </div>
    </div>
  );
}
