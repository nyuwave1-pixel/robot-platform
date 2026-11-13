"use client";

import { detectChannel, UTM_KEYS, type Utm } from "./channel";
import type { Channel } from "@/content/types";
import type { EventName } from "./events";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { loaded?: boolean };
  }
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}

const UTM_STORE = "uc_attr";
const CONSENT_STORE = "uc_consent";

export type ConsentChoice = "granted" | "denied" | null;

function safeGet(store: Storage | undefined, key: string): string | null {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
}
function safeSet(store: Storage | undefined, key: string, value: string) {
  try {
    store?.setItem(key, value);
  } catch {
    /* storage blocked */
  }
}

// ---------------- attribution ----------------
let memoAttr: Utm | null = null;

/**
 * Read UTM / click ids from the URL. A new tagged visit overwrites the stored
 * attribution (last non-direct touch); otherwise the session's stored values
 * are kept so internal navigation doesn't lose the campaign.
 */
export function captureAttribution(): Utm {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const fromUrl: Utm = {};
  for (const k of UTM_KEYS) {
    const v = params.get(k);
    if (v) fromUrl[k] = v.slice(0, 120);
  }
  const fbclid = params.get("fbclid");
  const gclid = params.get("gclid");
  if (fbclid) fromUrl.fbclid = fbclid.slice(0, 255);
  if (gclid) fromUrl.gclid = gclid.slice(0, 255);

  if (Object.keys(fromUrl).length) {
    const ref = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : "";
    memoAttr = { ...fromUrl, referrer: ref };
    safeSet(window.sessionStorage, UTM_STORE, JSON.stringify(memoAttr));
    return memoAttr;
  }
  if (memoAttr) return memoAttr;
  const stored = safeGet(window.sessionStorage, UTM_STORE);
  if (stored) {
    try {
      memoAttr = JSON.parse(stored) as Utm;
      return memoAttr;
    } catch {
      /* ignore */
    }
  }
  const ref = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : "";
  memoAttr = ref ? { referrer: ref } : {};
  if (ref) safeSet(window.sessionStorage, UTM_STORE, JSON.stringify(memoAttr));
  return memoAttr;
}

export function currentChannel(): Channel {
  return detectChannel(captureAttribution());
}

// ---------------- consent ----------------
export function gpcEnabled(): boolean {
  return typeof navigator !== "undefined" && navigator.globalPrivacyControl === true;
}
export function storedConsent(): ConsentChoice {
  if (typeof window === "undefined") return null;
  const v = safeGet(window.localStorage, CONSENT_STORE);
  return v === "granted" || v === "denied" ? v : null;
}
export function setConsent(choice: "granted" | "denied") {
  safeSet(window.localStorage, CONSENT_STORE, choice);
  window.dispatchEvent(new CustomEvent("uc-consent", { detail: choice }));
}
/** Whether ad/analytics storage is allowed for this visitor under the configured mode. */
export function trackingAllowed(mode: "opt-out" | "opt-in"): boolean {
  if (gpcEnabled()) return false;
  const c = storedConsent();
  if (c) return c === "granted";
  return mode === "opt-out";
}

let consentModeSetting: "opt-out" | "opt-in" = "opt-out";
let tagMode: "gtm" | "gtag" | "none" = "none";
/** gtm: push dataLayer events for GTM triggers. gtag: send GA4 events directly. */
export function configureAnalytics(opts: { consentMode: "opt-out" | "opt-in"; tagMode: "gtm" | "gtag" | "none" }) {
  consentModeSetting = opts.consentMode;
  tagMode = opts.tagMode;
}

// ---------------- events ----------------

function safeHost(url: string): string | undefined {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

function eventId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const META_EVENT_MAP: Partial<Record<EventName, [standard: boolean, name: string]>> = {
  view_item: [true, "ViewContent"],
  // JYT plan: Amazon button clicks are reported to Meta as "sticky_cta".
  amazon_cta_click: [false, "sticky_cta"],
  tiktok_cta_click: [false, "tiktok_cta"],
  video_play: [false, "VideoPlay"],
  promotion_view: [false, "PromotionView"],
};

/**
 * Internal event → GA4 event name. Where GA4 has a recommended/automatic event
 * we use its name so it lands in the standard reports; the rest stay custom.
 */
const GA4_NAME: Partial<Record<EventName, string>> = {
  promotion_view: "view_promotion",
  video_play: "video_start",
};

/** GA4 content group, so reports can be split by page type without regexes. */
export function contentGroup(path: string): string {
  if (path === "/") return "home";
  if (path.startsWith("/products/")) return "product";
  return "info";
}

export interface TrackParams {
  product?: { key: string; asin: string; name: string; shop?: { kind: string; url: string } };
  /** Destination URL for outbound clicks (Amazon). */
  url?: string;
  location?: string;
  label?: string;
  value?: string;
}

/**
 * Fire one event to every configured destination:
 *  - dataLayer (GTM) and gtag (GA4)
 *  - Meta Pixel (only when ad tracking is allowed)
 */
export function track(name: EventName, params: TrackParams = {}) {
  if (typeof window === "undefined") return;
  const attr = captureAttribution();
  const channel = detectChannel(attr);
  const allowed = trackingAllowed(consentModeSetting);
  const id = eventId();

  const gaParams: Record<string, unknown> = {
    event_id: id,
    channel,
    content_group: contentGroup(window.location.pathname),
    ...(params.location && { cta_location: params.location }),
    ...(params.label && { label: params.label }),
    ...(params.url && { link_url: params.url, link_domain: safeHost(params.url), outbound: true }),
    ...(params.product && {
      currency: "USD",
      items: [{ item_id: params.product.asin, item_name: params.product.name, item_brand: "UNI&CORE", item_category: "Skincare", item_category2: params.product.shop ? "Serum Mist" : "Vitamin C", affiliation: params.product.shop ? "TikTok Shop" : "Amazon.com" }],
      product_key: params.product.key,
    }),
  };
  const gaName = GA4_NAME[name] ?? name;
  window.dataLayer = window.dataLayer || [];
  if (tagMode === "gtm") window.dataLayer.push({ event: gaName, ...gaParams });
  else if (tagMode === "gtag" && window.gtag) window.gtag("event", gaName, gaParams);

  const meta = META_EVENT_MAP[name];
  if (meta && allowed && window.fbq) {
    const custom = params.product
      ? { content_ids: [params.product.asin], content_type: "product", content_name: params.product.name, cta_location: params.location }
      : { label: params.label };
    window.fbq(meta[0] ? "track" : "trackCustom", meta[1], custom, { eventID: id });
  }
}
