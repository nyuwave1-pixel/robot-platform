"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AmazonButton, type AmazonProduct } from "./AmazonButton";
import { usePromoActive } from "./PromoBanner";
import { AmazonLogo } from "@/components/landing/AmazonLogo";
import { TikTokShopMark } from "@/components/landing/TikTokShopMark";

/**
 * Mobile-only bottom bar. Appears after the gallery and its button scroll away
 * and hides while the final CTA or footer is on screen, so it never covers the
 * content it repeats. Desktop doesn't need it: the gallery button stays pinned.
 *
 * With a `label` (the product landing pages) it is one full-width Amazon button, the same size and
 * design as the desktop one (JYT revision 2, item 7). Without it, the older compact bar with the
 * product thumbnail and name.
 */
export function StickyCTA({ product, promoInitial, image, title, label }: { product: AmazonProduct; promoInitial: boolean; image?: string; title?: string; label?: string }) {
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
      inert={!show}
      className={`fixed inset-x-0 bottom-0 z-50 px-3 transition duration-500 ease-out lg:hidden ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[130%] opacity-0"}`}
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      {label ? (
        <AmazonButton
          product={product}
          location="sticky"
          className={`amz-btn mx-auto flex w-full max-w-xl ${product.shop ? "tts shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14),0_14px_30px_-12px_rgb(0_0_0/0.6)]" : "shadow-[inset_0_0_0_1px_rgb(196_85_0/0.55),inset_0_1px_0_rgb(255_255_255/0.6),0_14px_30px_-12px_rgb(120_60_0/0.55)]"}`}
        >
          <span>{promo && product.promotion ? `${product.promotion.discountPct}% off on` : label}</span>
          {product.shop ? <TikTokShopMark /> : <AmazonLogo title="Amazon" smile="currentColor" />}
        </AmazonButton>
      ) : (
      <div className="glass-bar mx-auto flex max-w-xl items-center gap-3 rounded-[20px] p-2 pl-2.5">
        {image && (
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[12px] bg-[#F5F5F1]">
            <Image src={image} alt="" fill sizes="44px" className="object-cover" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[13.5px] font-semibold leading-tight text-[#191A17]">{title ?? product.name}</p>
          <p className="mt-0.5 truncate text-[12px] text-[#5C5F58]">{promo && product.promotion ? `${product.promotion.discountPct}% off on Amazon` : "On Amazon.com"}</p>
        </div>
        <AmazonButton product={product} location="sticky" className="amz-btn amz-sm shrink-0 !px-3.5">
          <span>Shop on</span>
          <AmazonLogo title="Amazon" smile="currentColor" />
        </AmazonButton>
      </div>
      )}
    </div>
  );
}
