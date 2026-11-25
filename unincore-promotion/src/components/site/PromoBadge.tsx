"use client";

import type { Promotion } from "@/content/types";
import { usePromoActive } from "./PromoBanner";

export function PromoBadge({ promotion, initial, className = "" }: { promotion: Promotion; initial: boolean; className?: string }) {
  const active = usePromoActive(promotion, initial);
  if (!active) return null;
  return <span className={`rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-ivory ${className}`}>{promotion.discountPct}% off</span>;
}
