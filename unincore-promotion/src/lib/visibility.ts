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
  return { key: p.key, asin: p.asin, name: p.name, amazonUrl: p.amazonUrl, attribution: p.attribution, promotion: p.promotion };
}
