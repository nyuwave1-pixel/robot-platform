import { describe, expect, it } from "vitest";
import { extractAsin, resolveAmazonUrl, validateAmazonUrl } from "@/lib/amazon";
import { formatPromoWindow, isPromoActive } from "@/lib/promo";
import { detectChannel, cleanTag } from "@/lib/channel";
import { productOverrideSchema, settingsSchema } from "@/lib/schemas";
import { signSession, verifySession } from "@/lib/session";
import { publicView } from "@/lib/visibility";
import { DEFAULT_PRODUCTS, AMPOULE, MASK, WASH } from "@/content/products";

describe("Amazon links", () => {
  it("each product link points at its own ASIN", () => {
    for (const p of DEFAULT_PRODUCTS) {
      expect(extractAsin(p.amazonUrl)).toBe(p.asin);
      expect(validateAmazonUrl(p.amazonUrl, p.asin)).toEqual({ ok: true });
    }
    expect(new Set(DEFAULT_PRODUCTS.map((p) => p.asin)).size).toBe(3);
  });

  it("rejects a link to another product's ASIN", () => {
    const r = validateAmazonUrl(MASK.amazonUrl, AMPOULE.asin);
    expect(r.ok).toBe(false);
  });

  it("rejects non-Amazon and non-https hosts", () => {
    expect(validateAmazonUrl("https://evil.example/dp/B0HJRKRKT7", "B0HJRKRKT7").ok).toBe(false);
    expect(validateAmazonUrl("http://www.amazon.com/dp/B0HJRKRKT7", "B0HJRKRKT7").ok).toBe(false);
  });

  it("accepts Amazon Attribution links and keeps their parameters", () => {
    const attr = "https://www.amazon.com/dp/B0HJRKRKT7?maas=maas_adg_ABC123&ref_=aa_maas&tag=maas";
    expect(validateAmazonUrl(attr, "B0HJRKRKT7").ok).toBe(true);
    const url = resolveAmazonUrl({ ...AMPOULE, attribution: { meta: attr } }, { channel: "meta" });
    expect(url).toBe(attr);
  });

  it("falls back from an invalid channel link to the product link", () => {
    const bad = "https://www.amazon.com/dp/B0HGR6V48S?maas=x";
    expect(resolveAmazonUrl({ ...AMPOULE, attribution: { meta: bad } }, { channel: "meta" })).toBe(AMPOULE.amazonUrl);
  });

  it("uses the default attribution link for channels without their own", () => {
    const def = "https://www.amazon.com/dp/B0HGQYFF13?maas=def&ref_=aa_maas";
    expect(resolveAmazonUrl({ ...WASH, attribution: { default: def } }, { channel: "google" })).toBe(def);
  });
});

describe("Promotions", () => {
  const p = AMPOULE.promotion;
  it("is active only inside the BFCM window (US Pacific)", () => {
    expect(isPromoActive(p, new Date("2026-11-19T07:59:59Z"))).toBe(false); // Nov 18 23:59:59 PST
    expect(isPromoActive(p, new Date("2026-11-19T08:00:00Z"))).toBe(true);
    expect(isPromoActive(p, new Date("2026-12-01T07:59:59Z"))).toBe(true); // Nov 30 23:59:59 PST
    expect(isPromoActive(p, new Date("2026-12-01T08:00:00Z"))).toBe(false);
  });
  it("is off when disabled or 0%", () => {
    expect(isPromoActive({ ...p, enabled: false }, new Date("2026-11-25T12:00:00Z"))).toBe(false);
    expect(isPromoActive({ ...p, discountPct: 0 }, new Date("2026-11-25T12:00:00Z"))).toBe(false);
  });
  it("ampoule stays at 20% until the 30% upgrade is confirmed", () => {
    expect(DEFAULT_PRODUCTS.map((x) => x.promotion.discountPct)).toEqual([20, 20, 20]);
  });
  it("formats the window with the last inclusive day", () => {
    expect(formatPromoWindow(p)).toBe("Nov 19 – Nov 30");
  });
});

describe("Channel detection", () => {
  it.each([
    [{ utm_source: "facebook", utm_medium: "paid_social" }, "meta"],
    [{ utm_source: "ig" }, "meta"],
    [{ fbclid: "abc" }, "meta"],
    [{ gclid: "abc" }, "google"],
    [{ utm_source: "google", utm_medium: "cpc" }, "google"],
    [{ utm_source: "newsletter", utm_medium: "email" }, "email"],
    [{ referrer: "https://www.google.com/" }, "organic"],
    [{}, "direct"],
  ])("%o → %s", (utm, ch) => {
    expect(detectChannel(utm)).toBe(ch);
  });
  it("cleans tags", () => {
    expect(cleanTag("BFCM 2026 <script>")).toBe("bfcm_2026_script");
  });
});

describe("Verification gating", () => {
  it("hides every pending claim/ingredient from public pages", () => {
    for (const p of DEFAULT_PRODUCTS) {
      const v = publicView(p);
      expect(v.claims.every((c) => c.status === "verified")).toBe(true);
      expect(v.ingredients.every((c) => c.status === "verified")).toBe(true);
    }
    // Unverified brief numbers (sales counts) must not be public by default.
    expect(publicView(AMPOULE).claims.map((c) => c.value)).not.toContain("100,000+");
    expect(publicView(MASK).claims.map((c) => c.value)).not.toContain("10M+");
    // Figures confirmed on the official brand detail page are public — and the test figures cite their source.
    expect(publicView(AMPOULE).claims.map((c) => c.value)).toContain("+35.6%");
    expect(publicView(WASH).claims.map((c) => c.value)).toContain("pH 5–5.5");
    for (const c of publicView(AMPOULE).claims.filter((x) => x.value.startsWith("+") || x.id === "pigmentation")) {
      expect(c.source).toMatch(/SKINMED/);
    }
  });
});

describe("CMS validation", () => {
  it("blocks saving a mismatched Amazon link", () => {
    const r = productOverrideSchema.safeParse({ asin: "B0HJRKRKT7", amazonUrl: MASK.amazonUrl });
    expect(r.success).toBe(false);
  });
  it("accepts a valid override", () => {
    const r = productOverrideSchema.safeParse({ asin: "B0HJRKRKT7", amazonUrl: AMPOULE.amazonUrl, promotion: AMPOULE.promotion, seo: AMPOULE.seo });
    expect(r.success).toBe(true);
  });
  it("rejects promotions that end before they start", () => {
    const r = productOverrideSchema.safeParse({ promotion: { ...AMPOULE.promotion, endsAt: "2026-11-01T00:00:00-08:00" } });
    expect(r.success).toBe(false);
  });
  it("validates tracking IDs", () => {
    const base = { announcement: { enabled: true, text: "x" }, contactEmail: "", consentMode: "opt-out" };
    expect(settingsSchema.safeParse({ ...base, tracking: { ga4Id: "G-ABC1234", gtmId: "", metaPixelId: "123456789012" } }).success).toBe(true);
    expect(settingsSchema.safeParse({ ...base, tracking: { ga4Id: "<script>", gtmId: "", metaPixelId: "" } }).success).toBe(false);
  });
});

describe("SEO uniqueness", () => {
  it("every product has a unique title and description within length limits", () => {
    const titles = DEFAULT_PRODUCTS.map((p) => p.seo.title);
    const descs = DEFAULT_PRODUCTS.map((p) => p.seo.description);
    expect(new Set(titles).size).toBe(3);
    expect(new Set(descs).size).toBe(3);
    for (const t of titles) expect(t.length).toBeLessThanOrEqual(70);
    for (const d of descs) expect(d.length).toBeLessThanOrEqual(170);
  });
});

describe("Admin sessions", () => {
  it("round-trips and rejects tampering", async () => {
    const tok = await signSession({ u: "admin", role: "admin" });
    expect((await verifySession(tok))?.role).toBe("admin");
    const [body, sig] = tok.split(".");
    const forged = Buffer.from(JSON.stringify({ u: "x", role: "admin", exp: 9999999999 })).toString("base64url");
    expect(await verifySession(`${forged}.${sig}`)).toBeNull();
    expect(await verifySession(`${body}.AAAA`)).toBeNull();
  });
  it("rejects expired tokens", async () => {
    const tok = await signSession({ u: "admin", role: "editor" }, -10);
    expect(await verifySession(tok)).toBeNull();
  });
});

import { counterFields, decodeEvent, encodeEvent, sanitize } from "@/lib/stats";
describe("Event log encoding (Netlify Blobs)", () => {
  it("round-trips to the same counter fields", () => {
    const t = sanitize({ e: "amazon_cta_click", p: "mask", ch: "meta", dev: "mobile", loc: "sticky", cmp: "bfcm_2026", src: "facebook" })!;
    const back = decodeEvent(encodeEvent(t))!;
    expect(counterFields(back)).toEqual(counterFields(t));
  });
});
