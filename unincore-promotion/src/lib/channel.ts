import type { Channel } from "@/content/types";

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>> & { fbclid?: string; gclid?: string; referrer?: string };

/** Map a visit's UTM/click-ids/referrer to a traffic channel. */
export function detectChannel(utm: Utm): Channel {
  const src = (utm.utm_source || "").toLowerCase();
  const med = (utm.utm_medium || "").toLowerCase();
  if (utm.fbclid || /^(fb|facebook|ig|instagram|meta|an|messenger)$/.test(src) || src.includes("facebook") || src.includes("instagram")) return "meta";
  if (utm.gclid || src === "google" && /cpc|ppc|paid/.test(med)) return "google";
  if (med === "email" || src.includes("klaviyo") || src.includes("newsletter") || src === "email") return "email";
  if (src === "google" || src === "bing") return "organic";
  if (src) return med.includes("organic") ? "organic" : "direct";
  const ref = (utm.referrer || "").toLowerCase();
  if (/google\.|bing\.|duckduckgo\.|yahoo\./.test(ref)) return "organic";
  if (/facebook\.com|instagram\.com|fb\.me|l\.facebook/.test(ref)) return "meta";
  return "direct";
}

/** Normalize a free-text tracking value for safe storage (bounded length/charset). */
export function cleanTag(v: unknown, max = 64): string {
  if (typeof v !== "string") return "";
  return v.toLowerCase().trim().replace(/[^a-z0-9._\-+ ]/g, "").replace(/\s+/g, "_").slice(0, max);
}
