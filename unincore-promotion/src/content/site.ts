import type { SiteSettings } from "./types";

export const SITE = {
  name: "UNI&CORE",
  legalName: "UNI&CORE Co., Ltd.",
  tagline: "United in Beauty, Core in Confidence",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://promotion.unincore.com").replace(/\/$/, ""),
  mainSite: "https://unincore.com",
  locale: "en_US",
  /** UNI&CORE brand store on Amazon (the share link's tracking parameters removed). */
  amazonStore: "https://www.amazon.com/stores/UNICORE/page/51BC645B-3E00-4AA5-A624-530B9E21DCE3",
  social: [] as string[],
  /** Locales planned for hreflang expansion. Only en-US is live today. */
  locales: [{ code: "en-US", path: "" }],
};

export const DEFAULT_SETTINGS: SiteSettings = {
  tracking: {
    ga4Id: process.env.NEXT_PUBLIC_GA4_ID || "",
    gtmId: process.env.NEXT_PUBLIC_GTM_ID || "",
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
  },
  announcement: {
    enabled: true,
    text: "Korean vitamin C skincare by UNI&CORE, now available on Amazon.com",
  },
  // Left empty until the brand confirms a US-facing inbox.
  contactEmail: "",
  consentMode: "opt-out",
};
