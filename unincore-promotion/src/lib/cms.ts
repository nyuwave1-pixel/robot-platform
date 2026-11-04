import "server-only";
import { DEFAULT_PRODUCTS } from "@/content/products";
import { DEFAULT_SETTINGS } from "@/content/site";
import { publicView } from "./visibility";

/**
 * Content source. The site is a static Amazon landing site: all copy lives in
 * src/content/*.ts and is baked in at build time (no CMS, no runtime storage).
 * Pending claims are filtered out here, so pages never see them.
 */
const PRODUCTS = DEFAULT_PRODUCTS.filter((p) => p.published).map(publicView);

export async function getProducts() {
  return PRODUCTS;
}
export async function getProductBySlug(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug) ?? null;
}
export async function getSettings() {
  return DEFAULT_SETTINGS;
}
