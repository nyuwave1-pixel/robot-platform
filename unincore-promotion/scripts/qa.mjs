/**
 * End-to-end QA against a running server.
 *   BASE_URL=http://localhost:3100 ADMIN_USER=admin ADMIN_PASSWORD=… node scripts/qa.mjs
 * Writes a Markdown report to qa-artifacts/qa-report.md and exits non-zero on failure.
 */
import { createRequire } from "node:module";
// Works with a project-local playwright or a globally installed one.
const { chromium } = createRequire(import.meta.url)("playwright");
import fs from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const SITE = process.env.EXPECT_SITE_URL || "https://promotion.unincore.com";
const ADMIN_PW = process.env.ADMIN_PASSWORD || "";
const PRODUCTS = [
  { key: "ampoule", slug: "vitamin-c-13-5-ampoule", asin: "B0HJRKRKT7" },
  { key: "mask", slug: "vita-c-brightening-mask", asin: "B0HGR6V48S" },
  { key: "wash", slug: "vita-c-enzyme-powder-wash", asin: "B0HGQYFF13" },
];
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch();
// Regular desktop UA: /api/track ignores "HeadlessChrome" as a bot.
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA });
const page = await ctx.newPage();
const beacons = [];
// Playwright can't read sendBeacon Blob bodies, so mirror each beacon payload to the test.
await ctx.exposeBinding("__qaBeacon", (_src, text) => {
  try { beacons.push(JSON.parse(text)); } catch {}
});
await ctx.addInitScript(() => {
  const orig = navigator.sendBeacon.bind(navigator);
  navigator.sendBeacon = (url, data) => {
    if (String(url).includes("/api/track") && data instanceof Blob) data.text().then((t) => window.__qaBeacon(t));
    return orig(url, data);
  };
});

// ---------- pages & SEO ----------
const seen = { titles: new Set(), descs: new Set() };
for (const path of ["/", ...PRODUCTS.map((p) => `/products/${p.slug}`), "/privacy", "/terms", "/contact", "/disclaimer"]) {
  const res = await page.goto(BASE + path, { waitUntil: "load" });
  await page.waitForTimeout(250);
  check(`${path} returns 200`, res?.status() === 200, String(res?.status()));
  const meta = await page.evaluate(() => ({
    title: document.title,
    desc: document.querySelector('meta[name="description"]')?.content,
    canonical: document.querySelector('link[rel="canonical"]')?.href,
    ogTitle: document.querySelector('meta[property="og:title"]')?.content,
    ogImage: document.querySelector('meta[property="og:image"]')?.content,
    twitter: document.querySelector('meta[name="twitter:card"]')?.content,
    robots: document.querySelector('meta[name="robots"]')?.content,
    h1: document.querySelectorAll("h1").length,
    ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
    imgsNoAlt: [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).length,
    hreflang: document.querySelectorAll('link[rel="alternate"][hreflang]').length,
  }));
  check(`${path} unique title`, meta.title && !seen.titles.has(meta.title), meta.title);
  check(`${path} unique meta description`, meta.desc && !seen.descs.has(meta.desc), `${meta.desc?.length} chars`);
  seen.titles.add(meta.title);
  seen.descs.add(meta.desc);
  check(`${path} canonical`, meta.canonical === `${SITE}${path === "/" ? "/" : path}` || meta.canonical === `${SITE}${path}`, meta.canonical);
  check(`${path} OG + Twitter card`, meta.ogTitle && meta.ogImage && meta.twitter === "summary_large_image");
  check(`${path} indexable robots meta`, meta.robots?.startsWith("index, follow"), meta.robots);
  check(`${path} exactly one H1`, meta.h1 === 1, String(meta.h1));
  check(`${path} all images have alt`, meta.imgsNoAlt === 0);
  check(`${path} hreflang alternates`, meta.hreflang >= 1);
  let ldOk = true;
  const types = [];
  for (const l of meta.ld) {
    try {
      const j = JSON.parse(l);
      for (const x of [].concat(j)) types.push(x["@type"]);
    } catch { ldOk = false; }
  }
  check(`${path} JSON-LD parses`, ldOk, types.join(", "));
  if (path.startsWith("/products/")) {
    check(`${path} has Product + BreadcrumbList + FAQPage schema`, ["Product", "BreadcrumbList", "FAQPage"].every((t) => types.includes(t)));
  }
  if (path === "/") check("home has Organization + WebSite schema", types.includes("Organization") && types.includes("WebSite"));
}

// ---------- Amazon links ----------
for (const p of PRODUCTS) {
  await page.goto(`${BASE}/products/${p.slug}`, { waitUntil: "load" });
  await page.waitForTimeout(400);
  const links = await page.$$eval("a[data-cta]", (as) => as.map((a) => ({ href: a.href, asin: a.dataset.asin, target: a.target, loc: a.dataset.cta })));
  const own = links.filter((l) => l.asin === p.asin);
  check(`${p.key}: hero/final/sticky CTAs present`, ["hero", "final", "sticky", "offer"].every((loc) => own.some((l) => l.loc === loc)), own.map((l) => l.loc).join(","));
  check(`${p.key}: all own CTAs go to amazon.com/${p.asin}`, own.length > 0 && own.every((l) => l.href.includes(p.asin) && new URL(l.href).hostname.endsWith("amazon.com")));
  check(`${p.key}: CTAs open in a new tab`, own.every((l) => l.target === "_blank"));
  const pending = await page.evaluate(() => document.body.innerText.includes("+35.6%") || document.body.innerText.includes("pH 5–5.5") || document.body.innerText.includes("10M+"));
  check(`${p.key}: unverified claims are not shown publicly`, !pending);
}

// ---------- ad routing & UTM ----------
beacons.length = 0;
const adUrl = `${BASE}/?product=mask&utm_source=facebook&utm_medium=paid_social&utm_campaign=bfcm_2026&utm_content=ugc_a&utm_term=women_25_44&fbclid=TEST123`;
await page.goto(adUrl, { waitUntil: "load" });
const u = new URL(page.url());
check("?product=mask routes to the mask landing page", u.pathname === "/products/vita-c-brightening-mask", u.pathname);
check("ad routing keeps all UTM params + fbclid", ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"].every((k) => u.searchParams.has(k)));
await page.waitForTimeout(500);
const pdv = beacons.find((b) => b.e === "product_detail_view");
check("product_detail_view beacon sent with UTM + channel", pdv && pdv.p === "mask" && pdv.ch === "meta" && pdv.cmp === "bfcm_2026" && pdv.src === "facebook", JSON.stringify(pdv));
check("view_item + page_view beacons sent", beacons.some((b) => b.e === "view_item") && beacons.some((b) => b.e === "page_view"));

// UTM survives internal navigation
await page.click('header a[href="/products/vitamin-c-13-5-ampoule"]');
await page.waitForURL("**/vitamin-c-13-5-ampoule");
await page.waitForTimeout(400);
const pdv2 = beacons.filter((b) => b.e === "product_detail_view").at(-1);
check("campaign attribution persists across internal navigation", pdv2?.p === "ampoule" && pdv2?.cmp === "bfcm_2026", JSON.stringify(pdv2));

// CTA click event (block the actual Amazon navigation)
await ctx.route("https://www.amazon.com/**", (r) => r.fulfill({ status: 200, body: "amazon stub" }));
const [popup] = await Promise.all([ctx.waitForEvent("page"), page.click('a[data-cta="hero"]')]);
await page.waitForTimeout(400);
const click = beacons.find((b) => b.e === "amazon_cta_click");
check("amazon_cta_click beacon (product, placement, channel)", click?.p === "ampoule" && click?.loc === "hero" && click?.ch === "meta", JSON.stringify(click));
check("Amazon opened in new tab with correct ASIN", popup.url().includes("B0HJRKRKT7"), popup.url());
await popup.close();

// FAQ event
await page.locator("details summary").first().click();
await page.waitForTimeout(300);
check("faq_open beacon", beacons.some((b) => b.e === "faq_open"));

// ---------- mobile sticky CTA ----------
const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" });
const mp = await mob.newPage();
await mp.goto(`${BASE}/products/vita-c-enzyme-powder-wash`, { waitUntil: "load" });
const hiddenAtTop = await mp.$eval('a[data-cta="sticky"]', (a) => a.closest("[aria-hidden]")?.getAttribute("aria-hidden"));
await mp.evaluate(() => window.scrollTo(0, 1800));
await mp.waitForTimeout(600);
const shownMid = await mp.$eval('a[data-cta="sticky"]', (a) => a.closest("[aria-hidden]")?.getAttribute("aria-hidden"));
await mp.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await mp.waitForTimeout(600);
const hiddenEnd = await mp.$eval('a[data-cta="sticky"]', (a) => a.closest("[aria-hidden]")?.getAttribute("aria-hidden"));
check("mobile sticky CTA hidden over hero, shown mid-page, hidden at final CTA/footer", hiddenAtTop === "true" && shownMid === "false" && hiddenEnd === "true", `${hiddenAtTop}/${shownMid}/${hiddenEnd}`);
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
check("no horizontal scroll on mobile", !overflow);
await mob.close();

// ---------- GPC ----------
const gpcCtx = await browser.newContext();
await gpcCtx.addInitScript(() => Object.defineProperty(navigator, "globalPrivacyControl", { get: () => true }));
const gp = await gpcCtx.newPage();
await gp.goto(BASE + "/", { waitUntil: "load" });
const consent = await gp.evaluate(() => (window.dataLayer || []).map((x) => Array.from(x)).find((a) => a[0] === "consent" && a[1] === "default"));
check("GPC signal → Consent Mode default denied", consent?.[2]?.ad_storage === "denied", JSON.stringify(consent?.[2]));
check("GPC → no cookie banner shown", (await gp.locator('[aria-label="Privacy choices"]').count()) === 0);
await gpcCtx.close();

// ---------- technical ----------
const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
check("sitemap.xml lists home + 3 products", PRODUCTS.every((p) => sm.includes(`${SITE}/products/${p.slug}`)) && sm.includes(`<loc>${SITE}/</loc>`));
check("sitemap excludes /admin", !sm.includes("/admin"));
const rb = await (await fetch(`${BASE}/robots.txt`)).text();
check("robots.txt disallows /admin + /api and points to sitemap", rb.includes("Disallow: /admin") && rb.includes("Disallow: /api/") && rb.includes(`Sitemap: ${SITE}/sitemap.xml`));
const nf = await fetch(`${BASE}/this-does-not-exist`);
check("unknown URL → 404", nf.status === 404);
const badProduct = await fetch(`${BASE}/products/not-a-product`);
check("unknown product → 404", badProduct.status === 404);
const og = await fetch(`${BASE}/og/vitamin-c-13-5-ampoule`);
check("OG image renders (PNG)", og.status === 200 && og.headers.get("content-type")?.includes("image/png"));
const badTrack = await fetch(`${BASE}/api/track`, { method: "POST", body: JSON.stringify({ e: "purchase" }), headers: { "Content-Type": "application/json" } });
check("/api/track rejects unknown events (no fake 'purchase')", badTrack.status === 400);
const hdr = await fetch(`${BASE}/`);
check("security headers set", hdr.headers.get("x-content-type-options") === "nosniff" && !!hdr.headers.get("strict-transport-security"));

// ---------- admin ----------
const adminRedirect = await fetch(`${BASE}/admin`, { redirect: "manual" });
check("/admin requires login", adminRedirect.status === 307 && adminRedirect.headers.get("location")?.includes("/admin/login"));
const apiNoAuth = await fetch(`${BASE}/api/admin/settings`, { method: "PUT", headers: { Origin: BASE, "Content-Type": "application/json" }, body: "{}" });
check("admin API without session → 401", apiNoAuth.status === 401);
const csrf = await fetch(`${BASE}/api/admin/login`, { method: "POST", headers: { Origin: "https://evil.example", "Content-Type": "application/json" }, body: JSON.stringify({ username: "admin", password: "x" }) });
check("cross-site login POST blocked (CSRF)", csrf.status === 403);

if (ADMIN_PW) {
  const ap = await ctx.newPage();
  await ap.goto(`${BASE}/admin/login`);
  await ap.fill('input[name="username"]', "admin");
  await ap.fill('input[name="password"]', "wrong-password-123");
  await ap.click('button:has-text("Sign in")');
  await ap.waitForSelector('[role="alert"]');
  check("wrong admin password rejected", true);
  await ap.fill('input[name="password"]', ADMIN_PW);
  await ap.click('button:has-text("Sign in")');
  await ap.waitForURL(`${BASE}/admin`);
  check("admin login → dashboard", (await ap.locator("h1:has-text('Dashboard')").count()) === 1);
  const dash = await ap.textContent("body");
  check("dashboard shows Amazon clicks section", /Amazon clicks/.test(dash || ""));
  const statCards = await ap.$$eval("p.tabular-nums", (els) => els.map((e) => e.textContent));
  check("dashboard recorded this run's product views + Amazon clicks", Number(statCards[1]) > 0 && Number(statCards[2]) > 0, statCards.join(" / "));

  const api = (path, method, body) =>
    ap.evaluate(async ([path, method, body]) => {
      const r = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      return { status: r.status, json: await r.json().catch(() => ({})) };
    }, [path, method, body]);

  // Mismatched ASIN must be rejected
  const bad = await api("/api/admin/products/ampoule", "PUT", { asin: "B0HJRKRKT7", amazonUrl: "https://www.amazon.com/dp/B0HGR6V48S/" });
  check("CMS rejects Amazon link with the wrong ASIN", bad.status === 422, JSON.stringify(bad.json.issues?.[0]));

  // Promotion automatic switching: live now
  const now = Date.now();
  const iso = (t) => new Date(t).toISOString();
  const promo = { enabled: true, name: "QA Flash Sale", startsAt: iso(now - 3600e3), endsAt: iso(now + 3600e3), discountPct: 20, headline: "QA: 20% off on Amazon", detail: "QA test promotion.", couponNote: "" };
  const live = await api("/api/admin/products/wash", "PUT", { asin: "B0HGQYFF13", promotion: promo, heroHeadline: "QA Headline Enzyme Wash" });
  check("CMS saves product override", live.status === 200, JSON.stringify(live.json));
  await page.goto(`${BASE}/products/vita-c-enzyme-powder-wash`, { waitUntil: "load" });
  check("CMS edit appears on the public page", (await page.locator("h1").textContent())?.includes("QA Headline"));
  check("live promotion shows banner + offer", (await page.locator("text=QA: 20% off on Amazon").count()) > 0 && (await page.locator("text=QA Flash Sale").count()) > 0);
  check("promotion_view event fired", beacons.some((b) => b.e === "promotion_view" && b.p === "wash"));

  // Ended → regular page
  await api("/api/admin/products/wash", "PUT", { asin: "B0HGQYFF13", promotion: { ...promo, startsAt: iso(now - 7200e3), endsAt: iso(now - 60e3) } });
  await page.goto(`${BASE}/products/vita-c-enzyme-powder-wash`, { waitUntil: "load" });
  check("ended promotion → page returns to regular layout", (await page.locator("text=QA: 20% off on Amazon").count()) === 0 && (await page.locator("text=Fast, trusted checkout").count()) === 1);

  // Verify a claim → becomes public
  const claim = { id: "qa", value: "QA-99%", label: "qa claim", source: "QA", status: "verified" };
  await api("/api/admin/products/wash", "PUT", { asin: "B0HGQYFF13", claims: [claim] });
  await page.goto(`${BASE}/products/vita-c-enzyme-powder-wash`, { waitUntil: "load" });
  check("verified claim becomes visible publicly", (await page.locator("text=QA-99%").count()) === 1);

  // Reset to defaults
  const reset = await api("/api/admin/products/wash", "DELETE");
  check("admin reset restores defaults", reset.status === 200);
  await page.goto(`${BASE}/products/vita-c-enzyme-powder-wash`, { waitUntil: "load" });
  check("default headline restored", (await page.locator("h1").textContent())?.includes("Power of Enzymes"));

  // Settings: invalid tracking ID rejected
  const badSettings = await api("/api/admin/settings", "PUT", { tracking: { ga4Id: "nope", gtmId: "", metaPixelId: "" }, announcement: { enabled: true, text: "x" }, contactEmail: "", consentMode: "opt-out" });
  check("settings rejects invalid GA4 ID", badSettings.status === 422);

  await ap.goto(`${BASE}/admin/preview/vitamin-c-13-5-ampoule`);
  check("admin preview shows pending claims flagged", (await ap.locator("text=Pending verification").count()) > 0 && (await ap.locator("text=+35.6%").count()) === 1);
} else {
  console.log("SKIP admin flow (set ADMIN_PASSWORD)");
}

await browser.close();

const failed = results.filter((r) => !r.ok);
fs.mkdirSync("qa-artifacts", { recursive: true });
fs.writeFileSync(
  "qa-artifacts/qa-report.md",
  `# QA report — ${new Date().toISOString()}\n\nTarget: ${BASE}\n\n**${results.length - failed.length}/${results.length} passed**\n\n| Result | Check | Detail |\n|---|---|---|\n` +
    results.map((r) => `| ${r.ok ? "✅" : "❌"} | ${r.name} | ${String(r.detail).replace(/\|/g, "\\|").slice(0, 160)} |`).join("\n") + "\n",
);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
