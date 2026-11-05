import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/cms";
import { abs, breadcrumbLd, faqLd, pageMetadata } from "@/lib/seo";
import { toAmazonProduct } from "@/lib/visibility";
import { AmazonButton } from "@/components/site/AmazonButton";
import { JsonLd } from "@/components/site/JsonLd";
import type { ProductKey } from "@/content/types";

const PATH = "/guides/korean-vitamin-c-skincare-routine";
const TITLE = "Korean Vitamin C Skincare Routine: 3 Steps | UNI&CORE";
const DESCRIPTION =
  "How to use vitamin C in a Korean skincare routine: enzyme cleanse, vitamin C sheet mask, then a 13.5% vitamin C serum ampoule. Order, tips and FAQs.";
const PUBLISHED = "2026-11-05";

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  keywords: [
    "Korean vitamin C skincare routine",
    "how to use vitamin C serum",
    "vitamin C routine order",
    "Korean skincare routine steps",
    "vitamin C sheet mask",
    "enzyme powder cleanser",
    "UNI&CORE",
  ],
  ogImage: "/og/home",
  absoluteTitle: true,
});

/** Step copy. Product facts come from the US labels and the official UNI&CORE detail pages. */
const STEPS: { key: ProductKey; step: string; title: string; body: string[]; when: string }[] = [
  {
    key: "wash",
    step: "Step 1 — Cleanse",
    title: "Start with an enzyme powder wash",
    body: [
      "Vitamin C works best on clean skin. A powder cleanser is a Korean favorite because the formula stays dry and fresh until you add water. The UNI&CORE Vita C Enzyme Powder Wash turns into a creamy foam and uses papain, bromelain and lipase enzymes — plus vitamin C (ascorbic acid) and curcumin — to clear away dead skin cells, excess sebum and impurities without harsh scrubbing.",
      "It is mildly acidic, at pH 5–5.5, so it suits daily use. Tear open one 1 g packet, lather with a little water, massage and rinse.",
    ],
    when: "Morning or evening, daily",
  },
  {
    key: "mask",
    step: "Step 2 — Mask",
    title: "Add a vitamin C sheet mask",
    body: [
      "Sheet masks are the Korean shortcut to a visible glow. The UNI&CORE Vita C Super Brightening Mask carries an essence with 2% pure vitamin C, glutathione and Inula britannica flower extract on a 100% TENCEL™ high-adherence sheet that hugs the skin.",
      "After cleansing, apply the mask with the darker side facing out, remove it after 10–20 minutes, and pat the remaining essence in. It is a natural fit before events or as a weekly brightening ritual.",
    ],
    when: "10–20 minutes, as often as you like a boost",
  },
  {
    key: "ampoule",
    step: "Step 3 — Brighten",
    title: "Finish with a 13.5% vitamin C serum ampoule",
    body: [
      "An ampoule is a concentrated serum. The UNI&CORE Vita C 13.5 Super Brightening Ampoule contains 13.5% pure vitamin C (ascorbic acid), stabilized in a dual-layer formula, with glutathione, camu camu, hyaluronic acid and panthenol.",
      "Apply 2 pumps over the face after cleansing (and after the mask, if you used one), avoiding the eye area, then follow with cream. In a 7-day human application test with 21 adults, skin glow improved by 35.6% and elasticity by 14.3%.* In the morning, always finish with sunscreen.",
    ],
    when: "Morning and/or evening, 2 pumps",
  },
];

const TIPS = [
  { title: "Order matters", text: "Go from thinnest to thickest: cleanser → sheet mask essence → vitamin C serum → moisturizer → sunscreen (morning)." },
  { title: "Wear sunscreen with vitamin C", text: "Vitamin C fits a morning routine well, but any brightening routine needs a broad-spectrum sunscreen during the day." },
  { title: "Sensitive skin? Ease in", text: "UNI&CORE recommends prepping with a toner before the ampoule for the first two weeks, then trying it right after cleansing. Patch test anything new." },
  { title: "Expect a yellow tint", text: "Pure vitamin C formulas with turmeric and beta-carotene are naturally yellow and can transfer to pillowcases, so let the ampoule absorb before bed." },
];

const FAQS = [
  { q: "What is the correct order for a vitamin C skincare routine?", a: "Cleanse first, then use a sheet mask if you're masking, then your vitamin C serum or ampoule, then moisturizer. In the morning, finish with sunscreen." },
  { q: "Should I use vitamin C serum in the morning or at night?", a: "Either works. Many people prefer the morning because vitamin C pairs well with sunscreen. The UNI&CORE Vita C 13.5 ampoule can be used morning and evening." },
  { q: "How often should I use a vitamin C sheet mask?", a: "Use it whenever your skin needs a brightening boost — for example before an event or once or twice a week. Each mask stays on for 10–20 minutes." },
  { q: "Can I use an enzyme cleanser every day?", a: "Yes. The UNI&CORE Vita C Enzyme Powder Wash exfoliates with enzymes rather than harsh scrubbing and is mildly acidic (pH 5–5.5), so it is made for everyday use." },
  { q: "Where can I buy the UNI&CORE vitamin C routine in the US?", a: "All three products are sold on Amazon.com through the official UNI&CORE listings. Use the Shop on Amazon buttons in this guide." },
];

export default async function GuidePage() {
  const products = await getProducts();
  const byKey = Object.fromEntries(products.map((p) => [p.key, p]));
  const ampoule = byKey.ampoule;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Korean Vitamin C Skincare Routine: Cleanse, Mask, Brighten",
    description: DESCRIPTION,
    url: abs(PATH),
    mainEntityOfPage: abs(PATH),
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    inLanguage: "en-US",
    image: [abs("/og/home"), ...products.map((p) => abs(p.heroImage || `/og/${p.slug}`))],
    author: { "@type": "Organization", name: "UNI&CORE", url: abs("/") },
    publisher: { "@id": abs("/#organization") },
    about: products.map((p) => ({ "@type": "Product", name: `UNI&CORE ${p.name}`, url: abs(`/products/${p.slug}`) })),
  };

  return (
    <>
      <article>
        <header className="bg-cream">
          <div className="container-site max-w-4xl py-16 sm:py-24">
            <nav aria-label="Breadcrumb" className="text-xs text-ink-mute">
              <ol className="flex gap-2">
                <li><Link href="/" className="hover:text-ink">Home</Link></li>
                <li aria-hidden>/</li>
                <li aria-current="page">Vitamin C routine guide</li>
              </ol>
            </nav>
            <p className="eyebrow mt-8">Guide · Korean skincare</p>
            <h1 className="mt-4 font-display text-[40px] leading-[1.02] sm:text-6xl">Korean Vitamin C Skincare Routine: Cleanse, Mask, Brighten</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
              A simple three-step Korean routine built around vitamin C — what to use, in what order, and how often. Every product in this guide is
              available on Amazon.com.
            </p>
            {ampoule && (
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <AmazonButton product={toAmazonProduct(ampoule)} location="guide">Shop the routine on Amazon</AmazonButton>
                <a href="#steps" className="text-xs font-semibold uppercase tracking-widest underline underline-offset-4">Jump to the steps</a>
              </div>
            )}
          </div>
        </header>

        <section className="section">
          <div className="container-site max-w-3xl space-y-5 text-lg leading-relaxed text-ink-soft">
            <h2 className="h-section text-ink">Why vitamin C belongs in your routine</h2>
            <p>
              Vitamin C (ascorbic acid) is one of the most widely used antioxidants in skincare, known for helping skin look brighter and more even when used
              consistently. Pure ascorbic acid is also sensitive to water and air, so the way a product is formulated and packaged matters as much as the
              percentage on the label.
            </p>
            <p>
              Korean skincare layers several light, targeted steps instead of one heavy product. Applied to vitamin C, that means cleansing with a gentle
              exfoliating wash, giving skin a concentrated essence with a sheet mask, and sealing in a stabilized vitamin C serum — the routine below.
            </p>
          </div>
        </section>

        <section id="steps" className="section bg-cream" aria-labelledby="steps-title">
          <div className="container-site">
            <h2 id="steps-title" className="h-section max-w-3xl">The 3-step Korean vitamin C routine</h2>
            <ol className="mt-12 space-y-8">
              {STEPS.map((s) => {
                const p = byKey[s.key];
                if (!p) return null;
                return (
                  <li key={s.key} className="grid items-center gap-8 rounded-[32px] bg-white p-6 ring-1 ring-ink/5 sm:p-10 md:grid-cols-[260px_1fr]">
                    <Link href={`/products/${p.slug}`} className="relative mx-auto block aspect-[4/5] w-full max-w-[260px] overflow-hidden rounded-3xl" aria-label={p.name}>
                      <Image src={p.heroImage || `/og/${p.slug}`} alt={`UNI&CORE ${p.name}, ${p.size}`} fill sizes="260px" className="object-cover" />
                    </Link>
                    <div>
                      <p className="eyebrow">{s.step}</p>
                      <h3 className="mt-3 text-3xl leading-tight">{s.title}</h3>
                      {s.body.map((b) => (
                        <p key={b.slice(0, 40)} className="mt-3 leading-relaxed text-ink-soft">{b}</p>
                      ))}
                      <p className="mt-4 text-sm"><strong className="font-semibold">When:</strong> {s.when}</p>
                      <div className="mt-6 flex flex-wrap items-center gap-4">
                        <AmazonButton product={toAmazonProduct(p)} location="guide" />
                        <Link href={`/products/${p.slug}`} className="text-xs font-semibold uppercase tracking-widest underline underline-offset-4">
                          {p.shortName} details
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="mt-6 text-xs text-ink-mute">
              *Human application test after 7 days of use, 21 adults aged 20–60, SKINMED Co., Ltd. Clinical Trial Centre, as published by UNI&amp;CORE.
              Individual results may vary. These products are cosmetics and are not intended to diagnose, treat, cure or prevent any disease.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container-site">
            <h2 className="h-section max-w-3xl">Tips for using vitamin C</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {TIPS.map((t) => (
                <div key={t.title} className="card p-7">
                  <h3 className="text-2xl">{t.title}</h3>
                  <p className="mt-2 text-ink-soft">{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section bg-cream">
          <div className="container-site max-w-3xl">
            <h2 className="h-section">Vitamin C routine FAQ</h2>
            <div className="mt-10 space-y-3">
              {FAQS.map((f) => (
                <details key={f.q} className="rounded-2xl bg-white p-5 ring-1 ring-ink/5">
                  <summary className="cursor-pointer font-medium">{f.q}</summary>
                  <p className="mt-3 text-ink-soft">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </article>

      <JsonLd
        data={[
          articleLd,
          faqLd(FAQS),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Korean vitamin C skincare routine", path: PATH },
          ]),
        ]}
      />
    </>
  );
}
