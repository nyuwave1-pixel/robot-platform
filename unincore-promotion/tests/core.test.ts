import { describe, expect, it } from "vitest";
import { extractAsin, resolveAmazonUrl, validateAmazonUrl } from "@/lib/amazon";
import { formatPromoWindow, isPromoActive } from "@/lib/promo";
import { detectChannel, cleanTag } from "@/lib/channel";
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
  // The shipped promos are off until the Amazon deal is confirmed; test the window logic on an enabled copy.
  const p = { ...AMPOULE.promotion, enabled: true };
  it("ships disabled until the Amazon deal is confirmed", () => {
    for (const x of DEFAULT_PRODUCTS) expect(isPromoActive(x.promotion, new Date("2026-11-25T12:00:00Z"))).toBe(false);
  });
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
