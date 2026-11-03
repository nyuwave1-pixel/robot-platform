import type { AttributionLinks, Channel, ProductContent } from "@/content/types";

/**
 * Amazon link handling.
 *
 * Guard rails against sending shoppers to the wrong product:
 *  - Only https URLs on amazon.com (or the amzn.to short domain) are accepted.
 *  - If a URL contains an ASIN (/dp/…, /gp/product/…), it must equal the product's ASIN.
 *  - Query strings on configured URLs (Amazon Attribution `maas`, `ref_`, `tag`…) are kept as-is.
 */

export const ASIN_RE = /^[A-Z0-9]{10}$/;
const ALLOWED_HOSTS = new Set(["www.amazon.com", "amazon.com", "smile.amazon.com", "amzn.to", "www.amzn.to"]);

export function extractAsin(url: string): string | null {
  const m = url.match(/\/(?:dp|gp\/product|gp\/aw\/d|product)\/([A-Z0-9]{10})(?:[/?#]|$)/i);
  return m ? m[1].toUpperCase() : null;
}

export type LinkCheck = { ok: true } | { ok: false; reason: string };

export function validateAmazonUrl(url: string, expectedAsin: string): LinkCheck {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { ok: false, reason: "Not a valid URL." };
  }
  if (u.protocol !== "https:") return { ok: false, reason: "URL must start with https://" };
  if (!ALLOWED_HOSTS.has(u.hostname.toLowerCase())) return { ok: false, reason: `Host ${u.hostname} is not amazon.com.` };
  const asin = extractAsin(u.pathname + u.search);
  if (asin && asin !== expectedAsin.toUpperCase()) {
    return { ok: false, reason: `URL points to ASIN ${asin}, but this product is ${expectedAsin}.` };
  }
  if (!asin && u.hostname.toLowerCase().endsWith("amazon.com") && !u.searchParams.has("maas")) {
    return { ok: false, reason: "No ASIN found in the URL. Use a /dp/ASIN product link or an Amazon Attribution link." };
  }
  return { ok: true };
}

/** Canonical, parameter-free product URL — the safe fallback. */
export function canonicalAmazonUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}`;
}

function pick(url: string | undefined, asin: string): string | undefined {
  if (!url) return undefined;
  return validateAmazonUrl(url, asin).ok ? url : undefined;
}

/**
 * Choose the outbound Amazon URL for a product.
 * Priority: active promo URL → channel Attribution link → default Attribution link → product URL → /dp/ASIN.
 */
export function resolveAmazonUrl(
  product: Pick<ProductContent, "asin" | "amazonUrl" | "attribution">,
  opts: { channel?: Channel; promoUrl?: string } = {},
): string {
  const a: AttributionLinks = product.attribution || {};
  const channelUrl = opts.channel && opts.channel in a ? a[opts.channel as keyof AttributionLinks] : undefined;
  return (
    pick(opts.promoUrl, product.asin) ||
    pick(channelUrl, product.asin) ||
    pick(a.default, product.asin) ||
    pick(product.amazonUrl, product.asin) ||
    canonicalAmazonUrl(product.asin)
  );
}
