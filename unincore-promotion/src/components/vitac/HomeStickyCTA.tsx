"use client";

import { useEffect, useState } from "react";
import { AmazonButton, type AmazonProduct } from "@/components/site/AmazonButton";

/**
 * Mobile purchase bar for the home page. It follows the product the visitor is
 * looking at (sections marked data-product-key) and hides over the hero and the
 * final collection, where each product already has its own button.
 */
export function HomeStickyCTA({ products, labels }: { products: AmazonProduct[]; labels: Record<string, string> }) {
  const [active, setActive] = useState<string | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-product-key]"));
    const blockers = Array.from(document.querySelectorAll<HTMLElement>("#hero, [data-hide-sticky]"));
    const visibleBlockers = new Set<Element>();
    const ratios = new Map<string, number>();

    const pick = () => {
      let best: string | null = null;
      let bestRatio = 0;
      ratios.forEach((r, k) => {
        if (r > bestRatio) {
          bestRatio = r;
          best = k;
        }
      });
      if (best) setActive(best);
      setHidden(visibleBlockers.size > 0 || !best);
    };
    const sectionIo = new IntersectionObserver(
      (entries) => {
        for (const e of entries) ratios.set((e.target as HTMLElement).dataset.productKey!, e.isIntersecting ? e.intersectionRatio : 0);
        pick();
      },
      { threshold: [0, 0.15, 0.3, 0.5, 0.75] },
    );
    const blockIo = new IntersectionObserver((entries) => {
      for (const e of entries) e.isIntersecting ? visibleBlockers.add(e.target) : visibleBlockers.delete(e.target);
      pick();
    });
    sections.forEach((s) => sectionIo.observe(s));
    blockers.forEach((b) => blockIo.observe(b));
    return () => {
      sectionIo.disconnect();
      blockIo.disconnect();
    };
  }, []);

  const product = products.find((p) => p.key === active) ?? products[0];
  const show = !hidden && Boolean(product);

  return (
    <div
      aria-hidden={!show}
      inert={!show}
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-champagne/30 bg-obsidian/95 px-4 pt-3 text-ivory backdrop-blur transition-transform duration-300 md:hidden ${show ? "translate-y-0" : "translate-y-full"}`}
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      {product && (
        <div className="flex items-center gap-3">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{product.name}</p>
          <AmazonButton product={product} location="sticky" className="btn-gold !min-h-[44px] !px-5 !text-[11px]" newTab>
            {labels[product.key] ?? "Shop on Amazon"}
          </AmazonButton>
        </div>
      )}
    </div>
  );
}
