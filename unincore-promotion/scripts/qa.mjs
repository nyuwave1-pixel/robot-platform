/**
 * End-to-end QA against a running server.
 *   BASE_URL=http://localhost:3100 node scripts/qa.mjs
 * Build with NEXT_PUBLIC_GA4_ID set so the analytics checks can read the GA4 events.
 * Writes a Markdown report to qa-artifacts/qa-report.md and exits non-zero on failure.
 */
import { createRequire } from "node:module";
// Works with a project-local playwright or a globally installed one.
const { chromium } = createRequire(import.meta.url)("playwright");
import fs from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const SITE = process.env.EXPECT_SITE_URL || "https://promotion.unincore.com";
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
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA });
const page = await ctx.newPage();
// GA4 events the page queued (gtag keeps every command in window.dataLayer).
const gaEvents = (pg = page) =>
  pg.evaluate(() =>
    (window.dataLayer || [])
      .map((x) => Array.from(x))
      .filter((a) => a[0] === "event")
      .map(([, e, p = {}]) => ({ e, p: p.product_key, loc: p.cta_location, ch: p.channel, url: p.link_url })),
  );

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
    check(`${path} has VideoObject for each creator video`, types.filter((t) => t === "VideoObject").length >= 3);
    check(`${path} has Product + BreadcrumbList schema, no FAQPage`, ["Product", "BreadcrumbList"].every((t) => types.includes(t)) && !types.includes("FAQPage"));
  }
  if (path === "/") check("home has Organization + WebSite schema", types.includes("Organization") && types.includes("WebSite"));
}

// ---------- Amazon links ----------
for (const p of PRODUCTS) {
  await page.goto(`${BASE}/products/${p.slug}`, { waitUntil: "load" });
  await page.waitForTimeout(400);
  const links = await page.$$eval("a[data-cta]", (as) => as.map((a) => ({ href: a.href, asin: a.dataset.asin, target: a.target, loc: a.dataset.cta })));
  const own = links.filter((l) => l.asin === p.asin);
  check(`${p.key}: hero/final/sticky CTAs present`, ["hero", "final", "sticky"].every((loc) => own.some((l) => l.loc === loc)), own.map((l) => l.loc).join(","));
  check(`${p.key}: savings box hidden while no promotion is live`, !(await page.evaluate(() => document.body.innerText.includes("promotion details will be shown here"))) && !own.some((l) => l.loc === "offer"));
  check(`${p.key}: all own CTAs go to amazon.com/${p.asin}`, own.length > 0 && own.every((l) => l.href.includes(p.asin) && new URL(l.href).hostname.endsWith("amazon.com")));
  check(`${p.key}: CTAs open in a new tab`, own.every((l) => l.target === "_blank"));
  // Korea sales figures come from the brand's own Amazon US listing images (landing.ts). No other product may show them.
  const figures = await page.evaluate(() => ({ k100: document.body.innerText.includes("100,000+"), m10: document.body.innerText.includes("10M+") }));
  check(`${p.key}: Korea sales figures only on the product whose listing states them`, figures.k100 === (p.key === "ampoule") && figures.m10 === (p.key === "mask"), JSON.stringify(figures));
  check(`${p.key}: no FAQ section on the product page (landing plan)`, (await page.locator("details[data-faq]").count()) === 0);
}

// ---------- ad routing & UTM ----------
const adUrl = `${BASE}/?product=mask&utm_source=facebook&utm_medium=paid_social&utm_campaign=bfcm_2026&utm_content=ugc_a&utm_term=women_25_44&fbclid=TEST123`;
await page.goto(adUrl, { waitUntil: "load" });
const u = new URL(page.url());
check("?product=mask routes to the mask landing page", u.pathname === "/products/vita-c-brightening-mask", u.pathname);
check("ad routing keeps all UTM params + fbclid", ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"].every((k) => u.searchParams.has(k)));
await page.waitForTimeout(500);
let ev = await gaEvents();
const pdv = ev.find((b) => b.e === "product_detail_view");
check("GA4 product_detail_view with product + channel", pdv && pdv.p === "mask" && pdv.ch === "meta", JSON.stringify(pdv));
check("GA4 view_item + page_view sent", ev.some((b) => b.e === "view_item") && ev.some((b) => b.e === "page_view"));

// UTM survives internal navigation
await page.click('header a[href="/products/vitamin-c-13-5-ampoule"]');
await page.waitForURL("**/vitamin-c-13-5-ampoule");
await page.waitForTimeout(400);
ev = await gaEvents();
const pdv2 = ev.filter((b) => b.e === "product_detail_view").at(-1);
check("campaign channel persists across internal navigation", pdv2?.p === "ampoule" && pdv2?.ch === "meta", JSON.stringify(pdv2));

// CTA click event (block the actual Amazon navigation)
await ctx.route("https://www.amazon.com/**", (r) => r.fulfill({ status: 200, body: "amazon stub" }));
const [popup] = await Promise.all([ctx.waitForEvent("page"), page.click('a[data-cta="hero"]')]);
await page.waitForTimeout(400);
const click = (await gaEvents()).find((b) => b.e === "amazon_cta_click");
check("GA4 amazon_cta_click (product, placement, channel, link)", click?.p === "ampoule" && click?.loc === "hero" && click?.ch === "meta" && click?.url?.includes("amazon.com"), JSON.stringify(click));
check("Amazon opened in new tab with correct ASIN", popup.url().includes("B0HJRKRKT7"), popup.url());
await popup.close();

// ---------- deferred tag loading ----------
{
  const tctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA });
  const tp = await tctx.newPage();
  const tagReqs = [];
  tp.on("request", (r) => { if (r.url().includes("googletagmanager.com/gtag/js")) tagReqs.push(Date.now()); });
  const tStart = Date.now();
  await tp.goto(BASE + "/", { waitUntil: "load" });
  await tp.waitForTimeout(600);
  const before = tagReqs.length;
  // On a slow first load the 3 s timer can fire before we look; only then is an early request acceptable.
  const slowLoad = Date.now() - tStart > 2500;
  await tp.mouse.move(200, 300);
  await tp.waitForTimeout(800);
  check("gtag.js waits for the first interaction, then loads", (before === 0 || slowLoad) && tagReqs.length === 1, `${before}/${tagReqs.length}${slowLoad ? " (slow load)" : ""}`);
  const idle = await tctx.newPage();
  const idleReqs = [];
  idle.on("request", (r) => { if (r.url().includes("googletagmanager.com/gtag/js")) idleReqs.push(1); });
  await idle.goto(BASE + "/", { waitUntil: "load" });
  await idle.waitForTimeout(4000);
  check("gtag.js loads by itself after 3 s without interaction", idleReqs.length === 1, String(idleReqs.length));
  await tctx.close();
}

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
check("sitemap has image entries for products and guides", (sm.match(/<image:loc>/g) || []).length >= 40 && sm.includes("/landing/amz/"));
const rb = await (await fetch(`${BASE}/robots.txt`)).text();
check("robots.txt allows crawling and points to sitemap", rb.includes("Allow: /") && rb.includes(`Sitemap: ${SITE}/sitemap.xml`));
check("no admin area", (await fetch(`${BASE}/admin`)).status === 404);
const guide = await fetch(`${BASE}/guides/korean-vitamin-c-skincare-routine`);
const guideHtml = await guide.text();
check("routine guide page live with Article + FAQ schema", guide.status === 200 && guideHtml.includes('"@type":"Article"') && guideHtml.includes('"@type":"FAQPage"'));
check("sitemap lists the routine guide", sm.includes(`${SITE}/guides/korean-vitamin-c-skincare-routine`));
const nf = await fetch(`${BASE}/this-does-not-exist`);
check("unknown URL → 404", nf.status === 404);
const badProduct = await fetch(`${BASE}/products/not-a-product`);
check("unknown product → 404", badProduct.status === 404);
const og = await fetch(`${BASE}/og/vitamin-c-13-5-ampoule`);
check("OG image renders (PNG)", og.status === 200 && og.headers.get("content-type")?.includes("image/png"));
const hdr = await fetch(`${BASE}/`);
check("security headers set", hdr.headers.get("x-content-type-options") === "nosniff" && !!hdr.headers.get("strict-transport-security"));

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
