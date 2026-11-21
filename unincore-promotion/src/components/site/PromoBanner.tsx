"use client";

import { useEffect, useState } from "react";
import type { Promotion } from "@/content/types";
import { formatPromoWindow, isPromoActive } from "@/lib/promo";
import { track } from "@/lib/analytics";
import { AmazonButton, type AmazonProduct } from "./AmazonButton";

/**
 * Re-checks the promotion window in the browser, so a cached page switches
 * back to the regular layout the moment the promotion ends (and vice versa).
 */
export function usePromoActive(p: Promotion | undefined, initial: boolean) {
  const [active, setActive] = useState(initial);
  useEffect(() => {
    const check = () => setActive(isPromoActive(p));
    check();
    const t = window.setInterval(check, 60_000);
    return () => window.clearInterval(t);
  }, [p]);
  return active;
}

export function PromoStrip({ product, initialActive }: { product: AmazonProduct & { promotion: Promotion }; initialActive: boolean }) {
  const active = usePromoActive(product.promotion, initialActive);
  useEffect(() => {
    if (active) track("promotion_view", { product, label: product.promotion.name });
  }, [active, product]);
  if (!active) return null;
  const p = product.promotion;
  return (
    <div className="bg-ink text-ivory">
      <div className="container-site flex flex-col items-center justify-between gap-2 py-3 text-center sm:flex-row sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">
          <span className="mr-2 rounded-full bg-citrus px-2 py-0.5 text-ink">{p.discountPct}% off</span>
          {p.headline} · {formatPromoWindow(p)}
        </p>
        <AmazonButton product={product} location="promo" className="text-xs font-semibold uppercase tracking-[0.18em] underline underline-offset-4">
          Get the deal
        </AmazonButton>
      </div>
    </div>
  );
}

export function PromoOffer({
  product,
  initialActive,
  fallback,
}: {
  product: AmazonProduct & { promotion: Promotion };
  initialActive: boolean;
  fallback: React.ReactNode;
}) {
  const active = usePromoActive(product.promotion, initialActive);
  if (!active) return <>{fallback}</>;
  const p = product.promotion;
  return (
    <div className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-14 text-center text-ivory sm:px-14">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-citrus/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sun/20 blur-3xl" />
      <p className="eyebrow !text-ivory/60">{p.name} · {formatPromoWindow(p)}</p>
      <p className="mt-5 font-display text-7xl leading-none sm:text-8xl">
        {p.discountPct}% <span className="italic text-citrus">off</span>
      </p>
      <p className="mx-auto mt-5 max-w-lg text-ivory/80">{p.detail}</p>
      {p.couponNote && <p className="mt-2 text-sm text-ivory/60">{p.couponNote}</p>}
      <div className="mt-8 flex justify-center">
        <AmazonButton product={product} location="offer" className="btn bg-ivory text-ink hover:bg-citrus-light" />
      </div>
    </div>
  );
}
