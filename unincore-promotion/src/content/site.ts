import type { SiteSettings } from "./types";

export const SITE = {
  name: "UNI&CORE",
  legalName: "UNI&CORE Co., Ltd.",
  tagline: "United in Beauty, Core in Confidence",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://promotion.unincore.com").replace(/\/$/, ""),
  mainSite: "https://unincore.com",
  /** UNI&CORE's own US online store; linked from the footer so Google ties the two US sites to one brand. */
  usStore: "https://us.unincore.com",
  /** The same four products on the US store (productSeq), so Google ties each landing page to its store page. */
  usStoreProducts: { wash: 441, mask: 445, mist: 446, ampoule: 449 } as Record<string, number>,
  locale: "en_US",
  /** UNI&CORE brand store on Amazon (the share link's tracking parameters removed). */
  amazonStore: "https://www.amazon.com/stores/UNICORE/page/51BC645B-3E00-4AA5-A624-530B9E21DCE3",
  /** Official profiles, for the Organization structured data (sameAs). */
  social: [
    "https://www.tiktok.com/@unincore_official",
    // The brand's own channels, as listed in its Google Search Console (2026-11-18).
    "https://www.instagram.com/unincore.official/",
    "https://www.youtube.com/@unincore.official",
  ] as string[],
  /** Other ways US shoppers write the brand (Google, Amazon and TikTok search suggestions, 2026-11-13). */
  alternateNames: ["Uni and Core", "UNI & CORE", "Unincore", "UNI&CORE USA", "UNI&CORE Skincare"],
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
