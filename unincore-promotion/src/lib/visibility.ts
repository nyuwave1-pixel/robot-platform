import type { ProductContent } from "@/content/types";

/** Strip anything not yet verified. Public pages always render through this. */
export function publicView(p: ProductContent): ProductContent {
  const ok = <T extends { status: string }>(xs: T[]) => xs.filter((x) => x.status === "verified");
  return {
    ...p,
    claims: ok(p.claims),
    ingredients: ok(p.ingredients),
    beforeAfter: ok(p.beforeAfter),
    videos: ok(p.videos),
  };
}

/** Minimal product shape sent to client components. */
export function toAmazonProduct(p: ProductContent) {
  return { key: p.key, asin: p.asin, name: p.name, amazonUrl: p.amazonUrl, attribution: p.attribution, promotion: p.promotion, shop: p.shop };
}

/**
 * The same, for the product's own landing page: when the product has a landing-page Amazon Attribution
 * link, it becomes the only attribution link, so every Amazon button on that page uses it unchanged.
 */
export function toLandingAmazonProduct(p: ProductContent) {
  const ap = toAmazonProduct(p);
  return p.landingAmazonUrl ? { ...ap, attribution: { default: p.landingAmazonUrl } } : ap;
}
