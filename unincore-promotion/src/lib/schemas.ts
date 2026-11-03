import { z } from "zod";
import { ASIN_RE, validateAmazonUrl } from "./amazon";

const text = (max: number) => z.string().trim().max(max);
const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || /^https:\/\//.test(v), "Must be an https:// URL")
  .optional();
const mediaUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || /^https:\/\//.test(v) || v.startsWith("/"), "Must be https:// or a /path on this site");
const status = z.enum(["verified", "pending"]);
const isoDateTime = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date/time");

export const promotionSchema = z
  .object({
    enabled: z.boolean(),
    name: text(80),
    startsAt: isoDateTime,
    endsAt: isoDateTime,
    discountPct: z.number().int().min(0).max(90),
    headline: text(120),
    detail: text(400),
    couponNote: text(200).optional(),
    amazonUrl: optionalUrl,
  })
  .refine((p) => Date.parse(p.endsAt) > Date.parse(p.startsAt), { message: "End must be after start", path: ["endsAt"] });

const titled = z.object({ title: text(120), text: text(600) });

/** Fields an editor may override from the CMS. */
export const productOverrideSchema = z
  .object({
    published: z.boolean(),
    asin: z.string().trim().toUpperCase().regex(ASIN_RE, "ASIN must be 10 uppercase letters/digits"),
    asinVerified: z.boolean(),
    amazonUrl: z.string().trim().max(2000),
    attribution: z.object({ default: optionalUrl, meta: optionalUrl, google: optionalUrl, email: optionalUrl }),
    heroEyebrow: text(80),
    heroHeadline: text(140),
    heroSub: text(400),
    tagline: text(160),
    heroImage: mediaUrl.optional(),
    benefits: z.array(titled).max(8),
    differentiators: z.array(titled).max(8),
    claims: z
      .array(
        z.object({
          id: text(40).min(1),
          value: text(30),
          label: text(140),
          detail: text(300).optional(),
          source: text(400).optional(),
          status,
        }),
      )
      .max(10),
    claimsNote: text(600),
    ingredients: z
      .array(z.object({ name: text(80).min(1), inci: text(120).optional(), role: text(80), detail: text(500), status }))
      .max(12),
    beforeAfter: z
      .array(
        z.object({
          id: text(40).min(1),
          before: mediaUrl,
          after: mediaUrl,
          beforeLabel: text(40),
          afterLabel: text(40),
          alt: text(200),
          caption: text(200).optional(),
          status,
        }),
      )
      .max(12),
    videos: z
      .array(
        z.object({
          id: text(40).min(1),
          src: mediaUrl,
          poster: mediaUrl,
          title: text(120),
          description: text(400),
          uploadDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
          duration: z.string().regex(/^PT(\d+H)?(\d+M)?(\d+S)?$/, "Use ISO 8601, e.g. PT0M30S").optional().or(z.literal("")),
          creator: text(80).optional(),
          status,
        }),
      )
      .max(12),
    faqs: z.array(z.object({ q: text(200), a: text(1000) })).max(20),
    promotion: promotionSchema,
    price: z
      .object({ amount: z.string().regex(/^\d+(\.\d{2})?$/), currency: z.literal("USD"), verifiedAt: z.string() })
      .optional()
      .nullable(),
    seo: z.object({
      title: text(70).min(10),
      description: text(170).min(50),
      keywords: z.array(text(60)).max(15),
      ogImage: mediaUrl.optional(),
    }),
  })
  .partial()
  .superRefine((o, ctx) => {
    const asin = o.asin;
    if (!asin) return;
    const check = (url: string | undefined, path: (string | number)[]) => {
      if (!url) return;
      const r = validateAmazonUrl(url, asin);
      if (!r.ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: r.reason, path });
    };
    check(o.amazonUrl, ["amazonUrl"]);
    if (o.attribution) for (const [k, v] of Object.entries(o.attribution)) check(v, ["attribution", k]);
    check(o.promotion?.amazonUrl, ["promotion", "amazonUrl"]);
  });

export type ProductOverride = z.infer<typeof productOverrideSchema>;

const trackingId = (re: RegExp, msg: string) => z.string().trim().refine((v) => v === "" || re.test(v), msg);

export const trackingSchema = z.object({
  ga4Id: trackingId(/^G-[A-Z0-9]{4,15}$/, "GA4 IDs look like G-XXXXXXX"),
  gtmId: trackingId(/^GTM-[A-Z0-9]{4,10}$/, "GTM IDs look like GTM-XXXXXX"),
  metaPixelId: trackingId(/^\d{8,20}$/, "Meta Pixel IDs are numeric"),
});

export const settingsSchema = z.object({
  tracking: trackingSchema,
  announcement: z.object({ enabled: z.boolean(), text: text(160) }),
  consentMode: z.enum(["opt-out", "opt-in"]),
  contactEmail: z.string().trim().max(120).refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Invalid email"),
});
