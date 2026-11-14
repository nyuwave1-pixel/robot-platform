/**
 * Content model for the UNI&CORE promotion platform.
 *
 * Compliance rule baked into the model: anything that came from a brief and has
 * not yet been checked against a source document (clinical report, test
 * certificate, US label, sales ledger) carries `status: "pending"`.
 * Pending items are NEVER rendered on public pages — they only show in the
 * admin preview (/admin/preview/[slug]) with a "Pending verification" badge.
 */

export type VerificationStatus = "verified" | "pending";

export type ProductKey = "ampoule" | "mask" | "wash" | "mist";
export type Accent = "citrus" | "sun" | "peach";

/** Ad/traffic channel used to choose an Amazon Attribution link. */
export const CHANNELS = ["meta", "google", "email", "organic", "direct"] as const;
export type Channel = (typeof CHANNELS)[number];

export interface Claim {
  id: string;
  /** Headline figure, e.g. "+35.6%" or "100,000+". */
  value: string;
  label: string;
  detail?: string;
  /** Where the number comes from (report name, date, panel size). Shown as a footnote. */
  source?: string;
  status: VerificationStatus;
}

export interface BeforeAfter {
  id: string;
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
  alt: string;
  caption?: string;
  status: VerificationStatus;
}

export interface VideoItem {
  id: string;
  src: string;
  poster: string;
  title: string;
  description: string;
  /** ISO date (YYYY-MM-DD) — required by Google for VideoObject. */
  uploadDate: string;
  /** ISO 8601 duration, e.g. PT0M32S. */
  duration?: string;
  creator?: string;
  status: VerificationStatus;
}

export interface Ingredient {
  name: string;
  inci?: string;
  role: string;
  detail: string;
  status: VerificationStatus;
}

export interface TitledText {
  title: string;
  text: string;
}

export interface OfficialDetail {
  /** Brand page the slices were taken from. */
  sourceUrl: string;
  /** Top-to-bottom slices of the official detail image. */
  slices: { src: string; width: number; height: number }[];
  /** Plain-text outline of what the detail image covers (alt text + SEO). */
  outline: string[];
}

export interface Faq {
  q: string;
  a: string;
}

export interface Promotion {
  enabled: boolean;
  name: string;
  /** ISO 8601 with offset. Promotion is live when startsAt <= now < endsAt. */
  startsAt: string;
  endsAt: string;
  /** Whole-number percentage. Display only — never used to compute a price. */
  discountPct: number;
  headline: string;
  detail: string;
  couponNote?: string;
  /** Optional promo-specific Amazon URL (e.g. a deal page). Falls back to the product link. */
  amazonUrl?: string;
}

export interface AttributionLinks {
  /** Used when no channel-specific link is set. */
  default?: string;
  meta?: string;
  google?: string;
  email?: string;
}

export interface ProductSeo {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
}

export interface ProductContent {
  key: ProductKey;
  slug: string;
  published: boolean;

  asin: string;
  /** Set true only after someone opened the Amazon page and confirmed it is this product. */
  asinVerified: boolean;
  amazonUrl: string;
  attribution: AttributionLinks;
  /**
   * Set when the product is sold on TikTok Shop instead of Amazon (the serum mist). Every
   * "Shop on" button for the product then opens this link; Amazon links are not used.
   */
  shop?: { kind: "tiktok"; url: string };

  name: string;
  shortName: string;
  size: string;
  accent: Accent;
  routineStep: 1 | 2 | 3;

  heroEyebrow: string;
  heroHeadline: string;
  heroSub: string;
  tagline: string;
  keyIngredient: string;
  highlights: string[];
  specs: { label: string; value: string }[];

  /** Optional real photography. Without it, an illustrated packshot is rendered. */
  heroImage?: string;
  /** Optional brand key visual (portrait), shown in the texture section. */
  visualImage?: string;
  /** Full INCI list exactly as printed on the US label. */
  fullIngredients?: string;
  /** Caution text exactly as printed on the US label. */
  caution?: string;
  /** Official packshot on a white background (Product structured data, Amazon panel). */
  packshotWhite?: string;
  /** Official brand detail page, re-published as lazy-loaded image slices. */
  officialDetail?: OfficialDetail;
  /** Extra usage notes from the official detail page (shown under the steps). */
  usageNotes?: string[];
  /**
   * Long-form "About" copy for search: H2 + paragraphs written around the phrases
   * shoppers type into Google before buying on Amazon. Facts only from the label
   * and the official detail page.
   */
  about?: { heading: string; paragraphs: string[] }[];

  concerns: TitledText[];
  benefits: TitledText[];
  claims: Claim[];
  claimsNote: string;
  beforeAfter: BeforeAfter[];
  videos: VideoItem[];
  differentiators: TitledText[];
  ingredients: Ingredient[];
  texture: TitledText & { notes: string[] };
  howTo: TitledText[];
  routineText: string;
  faqs: Faq[];

  promotion: Promotion;

  /**
   * Optional verified list price for Product structured data. Leave unset unless
   * it was copied from the live Amazon listing — never estimated.
   */
  price?: { amount: string; currency: "USD"; verifiedAt: string };

  seo: ProductSeo;
}

export interface TrackingSettings {
  ga4Id: string;
  gtmId: string;
  metaPixelId: string;
}

export interface SiteSettings {
  tracking: TrackingSettings;
  announcement: { enabled: boolean; text: string };
  contactEmail: string;
  /**
   * "opt-out" (US default): analytics & ad pixels load unless the visitor opts out
   * or sends a Global Privacy Control signal. "opt-in": nothing loads until "Accept".
   */
  consentMode: "opt-out" | "opt-in";
  updatedAt?: string;
  updatedBy?: string;
}
