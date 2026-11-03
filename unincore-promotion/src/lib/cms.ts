import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { DEFAULT_PRODUCTS } from "@/content/products";
import { DEFAULT_SETTINGS } from "@/content/site";
import type { ProductContent, ProductKey, SiteSettings } from "@/content/types";
import { getJson, setJson, delKey } from "./storage";
import type { ProductOverride } from "./schemas";

const CMS_TAG = "cms";
const productKey = (k: ProductKey) => `cms:product:${k}`;
const SETTINGS_KEY = "cms:settings";
const AUDIT_KEY = "cms:audit";

export function mergeProduct(base: ProductContent, o: ProductOverride | null): ProductContent {
  if (!o) return base;
  const { price, promotion, attribution, seo, ...rest } = o;
  const merged: ProductContent = {
    ...base,
    ...(Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)) as Partial<ProductContent>),
    promotion: promotion ? { ...base.promotion, ...promotion } : base.promotion,
    attribution: attribution ? { ...attribution } : base.attribution,
    seo: seo ? { ...base.seo, ...seo } : base.seo,
  };
  if (price === null) delete merged.price;
  else if (price) merged.price = price;
  return merged;
}

async function loadAll(): Promise<{ products: ProductContent[]; settings: SiteSettings }> {
  try {
    const [overrides, settings] = await Promise.all([
      Promise.all(DEFAULT_PRODUCTS.map((p) => getJson<ProductOverride>(productKey(p.key)))),
      getJson<Partial<SiteSettings>>(SETTINGS_KEY),
    ]);
    return {
      products: DEFAULT_PRODUCTS.map((p, i) => mergeProduct(p, overrides[i])),
      settings: {
        ...DEFAULT_SETTINGS,
        ...(settings || {}),
        tracking: { ...DEFAULT_SETTINGS.tracking, ...pickNonEmpty(settings?.tracking) },
        announcement: { ...DEFAULT_SETTINGS.announcement, ...(settings?.announcement || {}) },
      },
    };
  } catch (err) {
    // Storage outage must never take the landing pages down.
    console.error("[cms] falling back to defaults:", err);
    return { products: DEFAULT_PRODUCTS, settings: DEFAULT_SETTINGS };
  }
}

function pickNonEmpty<T extends object>(o: T | undefined): Partial<T> {
  if (!o) return {};
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== "" && v != null)) as Partial<T>;
}

const cachedLoad = unstable_cache(loadAll, ["cms-all"], { tags: [CMS_TAG], revalidate: 300 });

/** Public reads (cached, invalidated on every CMS save). */
export async function getCms() {
  return cachedLoad();
}
export async function getProducts(opts: { includeUnpublished?: boolean } = {}) {
  const { products } = await getCms();
  return opts.includeUnpublished ? products : products.filter((p) => p.published);
}
export async function getProductBySlug(slug: string, opts: { includeUnpublished?: boolean } = {}) {
  return (await getProducts(opts)).find((p) => p.slug === slug) ?? null;
}
export async function getSettings() {
  return (await getCms()).settings;
}

/** Admin reads bypass the cache. */
export async function getCmsFresh() {
  return loadAll();
}
export async function getProductOverride(key: ProductKey) {
  return getJson<ProductOverride>(productKey(key));
}

export async function saveProductOverride(key: ProductKey, override: ProductOverride, user: string) {
  await setJson(productKey(key), override);
  await audit(user, `product:${key}`, "update");
  revalidateTag(CMS_TAG);
}
export async function resetProduct(key: ProductKey, user: string) {
  await delKey(productKey(key));
  await audit(user, `product:${key}`, "reset");
  revalidateTag(CMS_TAG);
}
export async function saveSettings(settings: Omit<SiteSettings, "updatedAt" | "updatedBy">, user: string) {
  await setJson(SETTINGS_KEY, { ...settings, updatedAt: new Date().toISOString(), updatedBy: user });
  await audit(user, "settings", "update");
  revalidateTag(CMS_TAG);
}

export interface AuditEntry {
  at: string;
  user: string;
  target: string;
  action: string;
}
async function audit(user: string, target: string, action: string) {
  try {
    const log = (await getJson<AuditEntry[]>(AUDIT_KEY)) || [];
    log.unshift({ at: new Date().toISOString(), user, target, action });
    await setJson(AUDIT_KEY, log.slice(0, 100));
  } catch (err) {
    console.error("[cms] audit log failed:", err);
  }
}
export async function getAuditLog() {
  return (await getJson<AuditEntry[]>(AUDIT_KEY)) || [];
}
