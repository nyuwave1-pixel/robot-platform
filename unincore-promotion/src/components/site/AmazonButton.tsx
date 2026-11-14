"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { AttributionLinks, ProductKey, Promotion } from "@/content/types";
import { resolveAmazonUrl } from "@/lib/amazon";
import { currentChannel, track } from "@/lib/analytics";
import { isPromoActive } from "@/lib/promo";

export interface AmazonProduct {
  key: ProductKey;
  asin: string;
  name: string;
  amazonUrl: string;
  attribution: AttributionLinks;
  promotion?: Promotion;
  /** TikTok Shop product (the serum mist): the button opens this link instead of Amazon. */
  shop?: { kind: "tiktok"; url: string };
}

/**
 * Outbound link to the product's Amazon listing.
 * SSR renders the default product link (crawlers / no-JS); after hydration the
 * link switches to the channel-specific Amazon Attribution URL if configured.
 * A product with `shop` (TikTok Shop) always links to that shop page instead.
 */
export function AmazonButton({
  product,
  location,
  className = "btn-amazon",
  children,
  newTab = true,
}: {
  product: AmazonProduct;
  location: string;
  className?: string;
  children?: ReactNode;
  newTab?: boolean;
}) {
  const shop = product.shop;
  const [href, setHref] = useState(() => shop?.url ?? resolveAmazonUrl(product));

  useEffect(() => {
    if (shop) return setHref(shop.url);
    const promoUrl = isPromoActive(product.promotion) ? product.promotion?.amazonUrl : undefined;
    setHref(resolveAmazonUrl(product, { channel: currentChannel(), promoUrl }));
  }, [product, shop]);

  return (
    <a
      href={href}
      className={className}
      target={newTab ? "_blank" : undefined}
      rel="noopener"
      data-asin={product.asin || undefined}
      data-cta={location}
      onClick={() => track(shop ? "tiktok_cta_click" : "amazon_cta_click", { product, location, url: href })}
    >
      {children ?? (
        <>
          {shop ? "Shop on TikTok Shop" : "Shop on Amazon"}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M7 17 17 7M8 7h9v9" />
          </svg>
        </>
      )}
      {newTab && <span className="sr-only">{shop ? " (opens TikTok Shop in a new tab)" : " (opens Amazon.com in a new tab)"}</span>}
    </a>
  );
}
