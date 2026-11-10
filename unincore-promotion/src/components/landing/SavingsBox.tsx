"use client";

import type { Promotion } from "@/content/types";
import { SAVINGS } from "@/content/landing";
import { formatPromoWindow } from "@/lib/promo";
import { usePromoActive } from "@/components/site/PromoBanner";
import type { AmazonProduct } from "@/components/site/AmazonButton";
import { AmazonCta } from "./AmazonCta";
import { rich } from "./rich";

/**
 * "Special savings on Amazon" box, shared by the three pages. Shows the plan's
 * placeholder line until JYT confirms the offer; a live promotion in
 * products.ts (enabled + dates) replaces it automatically.
 */
export function SavingsBox({ product, initialActive, ctaLabel }: { product: AmazonProduct & { promotion: Promotion }; initialActive: boolean; ctaLabel: string }) {
  const active = usePromoActive(product.promotion, initialActive);
  const p = product.promotion;
  return (
    <div className="glass-offer overflow-hidden rounded-[28px] px-7 py-9 sm:px-9 sm:py-10">
      <p className="relative inline-flex rounded-[8px] bg-amazon-ink px-2.5 py-1 text-[12px] font-bold text-white">{SAVINGS.tag}</p>
      <h2 className="relative mt-5 font-sans text-[clamp(30px,3.1vw,42px)] font-extrabold leading-[1.12] tracking-[-0.035em] text-body">{rich(SAVINGS.title, SAVINGS.accent)}</h2>
      {active ? (
        <div className="relative mt-6">
          <p className="serif text-[64px] font-semibold leading-none text-[#C45500]">{p.discountPct}% off</p>
          <p className="mt-3 text-[15px] leading-relaxed text-body-soft">{p.detail}</p>
          <p className="mt-1 text-[13px] text-body-mute">{formatPromoWindow(p)}</p>
        </div>
      ) : (
        <p className="relative mt-6 rounded-[14px] border border-dashed border-[#C45500]/35 bg-white/50 px-5 py-4 text-[16px] font-medium leading-relaxed text-body-soft">{SAVINGS.text}</p>
      )}
      <AmazonCta product={product} location="offer" label={ctaLabel} className="relative mt-7 w-full" />
      <p className="relative mt-4 text-[13px] text-body-mute">{SAVINGS.note}</p>
    </div>
  );
}
