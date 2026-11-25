import "server-only";
import { DEFAULT_PRODUCTS } from "@/content/products";
import { DEFAULT_SETTINGS } from "@/content/site";
import { publicView } from "./visibility";
import overrides from "@/content/seo-overrides.json";
import type { ProductContent } from "@/content/types";

/**
 * Content source. The site is a static Amazon landing site: all copy lives in
 * src/content/*.ts and is baked in at build time (no CMS, no runtime storage).
 * Pending claims are filtered out here, so pages never see them.
 */
/** Approved SEO changes published by unincore-engine (title/description/extra FAQs only — never facts). */
type Override = { seoTitle?: string; seoDescription?: string; extraFaqs?: { q: string; a: string }[] };
const OVERRIDES = (overrides as { products: Record<string, Override> }).products;

function applyOverride(p: ProductContent): ProductContent {
  const o = OVERRIDES[p.slug];
  if (!o) return p;
  return {
    ...p,
    seo: { ...p.seo, ...(o.seoTitle && { title: o.seoTitle }), ...(o.seoDescription && { description: o.seoDescription }) },
    faqs: [...p.faqs, ...(o.extraFaqs ?? []).filter((f) => !p.faqs.some((x) => x.q === f.q))],
  };
}

const PRODUCTS = DEFAULT_PRODUCTS.filter((p) => p.published).map(publicView).map(applyOverride);

export async function getProducts() {
  return PRODUCTS;
}
export async function getProductBySlug(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug) ?? null;
}
export async function getSettings() {
  return DEFAULT_SETTINGS;
}
