import Link from "next/link";
import type { Metadata } from "next";
import { getProducts } from "@/lib/cms";
import { pageMetadata, breadcrumbLd } from "@/lib/seo";
import { isPromoActive } from "@/lib/promo";
import { toAmazonProduct } from "@/lib/visibility";
import { ACCENT } from "@/lib/accent";
import { Packshot } from "@/components/site/Packshot";
import { AmazonButton } from "@/components/site/AmazonButton";
import { PromoBadge } from "@/components/site/PromoBadge";
import { JsonLd } from "@/components/site/JsonLd";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: "UNI&CORE | Korean Vitamin C Skincare — Shop on Amazon",
  description:
    "Shop UNI&CORE Korean vitamin C skincare on Amazon: a 13.5% vitamin C ampoule, a brightening sheet mask and an enzyme powder wash for an everyday glow.",
  path: "/",
  keywords: ["UNI&CORE", "Korean skincare", "K beauty skincare", "Korean beauty products", "vitamin C skincare", "Korean brightening skincare"],
  ogImage: "/og/home",
  absoluteTitle: true,
});

export default async function HomePage() {
  const products = await getProducts();
  const routine = [...products].sort((a, b) => a.routineStep - b.routineStep);
  const heroOrder = ["mask", "ampoule", "wash"].map((k) => products.find((p) => p.key === k)).filter(Boolean) as typeof products;

  return (
    <>
      {/* 01 HERO */}
      <section id="hero" className="grain relative overflow-hidden bg-gradient-to-b from-cream via-ivory to-ivory">
        <div className="pointer-events-none absolute left-1/2 top-[38%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-citrus/15 blur-3xl" />
        <div className="container-site relative grid items-center gap-6 pb-16 pt-6 sm:pt-14 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:pb-24 lg:pt-20">
          <div className="order-2 lg:order-1">
            <p className="eyebrow">Korean Vitamin C Skincare · Now on Amazon</p>
            <h1 className="mt-6 font-display text-[44px] leading-[0.98] sm:text-7xl lg:text-[88px]">
              Discover the <em className="text-citrus-deep">Science</em> of Beautiful Skin
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">Advanced Korean skincare, designed for your everyday glow.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#shop" className="btn-primary">Shop now</Link>
              <Link href="#collection" className="btn-ghost">Explore the collection</Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-2" aria-label="Product promotions">
              {products.map((p) => (
                <li key={p.slug}>
                  <Link href={`/products/${p.slug}`} className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-medium ring-1 ring-ink/10 transition hover:ring-ink/40">
                    <span className={`h-2 w-2 rounded-full ${ACCENT[p.accent].bg}`} />
                    {p.shortName}
                    <PromoBadge promotion={p.promotion} initial={isPromoActive(p.promotion)} className="!px-2 !py-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative order-1 mx-auto grid w-full max-w-[340px] grid-cols-3 items-end sm:max-w-[520px] lg:order-2 lg:max-w-[660px]">
            {heroOrder.map((p, i) => (
              <Link key={p.slug} href={`/products/${p.slug}`} className={`block transition duration-500 hover:-translate-y-2 ${i === 1 ? "z-10 scale-[1.28]" : "opacity-95"}`} aria-label={p.name}>
                <Packshot kind={p.key} image={p.heroImage} alt={`${p.name} by UNI&CORE`} priority sizes="(max-width:768px) 33vw, 200px" className={i === 1 ? "animate-floaty" : ""} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ingredient marquee */}
      <div className="overflow-hidden border-y border-ink/10 bg-ivory py-4" aria-hidden>
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap font-display text-2xl italic text-ink-mute">
          {Array.from({ length: 2 }).flatMap((_, r) =>
            ["13.5% Pure Vitamin C", "2% Vitamin C Sheet Mask", "Bromelain Enzyme", "Made in Korea", "Everyday Glow", "3-Step Routine"].map((t) => (
              <span key={`${r}-${t}`}>
                {t} <span className="not-italic text-citrus">✦</span>
              </span>
            )),
          )}
        </div>
      </div>

      {/* 02 COLLECTION */}
      <section id="collection" className="section">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end" data-reveal>
            <div>
              <p className="eyebrow">Our Skincare Collection</p>
              <h2 className="h-section mt-4 max-w-2xl">Three steps of vitamin C, one brighter-looking you.</h2>
            </div>
            <p className="max-w-sm text-ink-soft">Each formula is built around one hero ingredient, so your routine stays simple and every step has a clear job.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {routine.map((p, i) => {
              const a = ACCENT[p.accent];
              return (
                <article key={p.slug} className="card group flex flex-col overflow-hidden" data-reveal style={{ ["--reveal-delay" as string]: `${i * 120}ms` }}>
                  <Link href={`/products/${p.slug}`} className={`relative block bg-gradient-to-b ${a.gradient} px-10 pt-10`}>
                    <PromoBadge promotion={p.promotion} initial={isPromoActive(p.promotion)} className="absolute left-5 top-5" />
                    <Packshot kind={p.key} image={p.heroImage} alt={p.name} className="mx-auto max-w-[240px] transition duration-700 group-hover:-translate-y-2 group-hover:rotate-[-2deg]" sizes="(max-width:768px) 70vw, 280px" />
                  </Link>
                  <div className="flex flex-1 flex-col p-7">
                    <p className={`eyebrow ${a.text}`}>{p.keyIngredient}</p>
                    <h3 className="mt-3 text-3xl leading-tight">
                      <Link href={`/products/${p.slug}`}>{p.name}</Link>
                    </h3>
                    <p className="mt-3 text-ink-soft">{p.tagline}</p>
                    <ul className="mt-5 space-y-1.5 text-sm text-ink-soft">
                      {p.highlights.slice(0, 3).map((h) => (
                        <li key={h} className="flex gap-2"><span className={a.text}>—</span>{h}</li>
                      ))}
                    </ul>
                    <div className="mt-auto flex flex-wrap gap-2 pt-7">
                      <Link href={`/products/${p.slug}`} className="btn-ghost !min-h-[44px] !px-5 !text-[11px]">Discover more</Link>
                      <AmazonButton product={toAmazonProduct(p)} location="card" className="btn-amazon !min-h-[44px] !px-5 !text-[11px]" />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 03 ROUTINE */}
      <section id="routine" className="section bg-cream">
        <div className="container-site">
          <div className="text-center" data-reveal>
            <p className="eyebrow">The 3-Step Skincare Routine</p>
            <h2 className="h-section mx-auto mt-4 max-w-3xl">Cleanse. Mask. Brighten.</h2>
            <p className="mx-auto mt-5 max-w-xl text-ink-soft">Use them together for a complete vitamin C ritual — or start with the step your skin needs most.</p>
          </div>
          <ol className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
            <div className="absolute left-[16%] right-[16%] top-[92px] hidden h-px bg-ink/15 md:block" aria-hidden />
            {routine.map((p, i) => (
              <li key={p.slug} className="relative text-center" data-reveal style={{ ["--reveal-delay" as string]: `${i * 150}ms` }}>
                <div className={`relative mx-auto grid h-[184px] w-[184px] place-items-center rounded-full ${ACCENT[p.accent].bgLight} ring-8 ring-cream`}>
                  <Packshot kind={p.key} image={p.heroImage} alt="" className="w-[120px]" sizes="120px" />
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-ink px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-ivory">Step 0{p.routineStep}</span>
                </div>
                <h3 className="mt-6 text-2xl">{p.name}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-ink-soft">{p.routineText}</p>
                <Link href={`/products/${p.slug}#how-to-use`} className="mt-4 inline-block text-xs font-semibold uppercase tracking-widest underline underline-offset-4">How to use</Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 04 BRAND STORY */}
      <section className="section overflow-hidden">
        <div className="container-site grid items-center gap-14 lg:grid-cols-2">
          <div className="relative" data-reveal>
            <div className="aspect-[4/5] overflow-hidden rounded-[36px] bg-gradient-to-br from-citrus-light via-cream to-peach-light">
              <div className="flex h-full flex-col justify-between p-10">
                <p className="eyebrow">Made in Korea</p>
                <p className="font-display text-[120px] italic leading-none text-citrus/80 sm:text-[160px]">&amp;</p>
                <p className="font-display text-3xl leading-tight">United in Beauty,<br />Core in Confidence.</p>
              </div>
            </div>
          </div>
          <div data-reveal>
            <p className="eyebrow">Brand Story</p>
            <h2 className="h-section mt-4">Korean skincare science, made simple.</h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink-soft">
              <p>
                UNI&amp;CORE was born in Korea, where skincare is a daily ritual and every step is expected to earn its place. We focus on
                proven hero ingredients — like vitamin C and fruit enzymes — and build clean, focused formulas around them.
              </p>
              <p>
                The name says it all: <em>uni</em>, bringing people together through beauty, and <em>core</em>, the confidence that comes
                from skin that looks and feels its best. Now our vitamin C collection is available to shoppers across the US on Amazon.
              </p>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-ink/10 pt-8">
              {[
                ["K-Beauty", "Developed in Korea"],
                ["Vitamin C", "Hero ingredient line"],
                ["3 Steps", "Cleanse · Mask · Ampoule"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-display text-3xl">{k}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-widest text-ink-mute">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* 05 AMAZON SHOPPING */}
      <section id="shop" className="section bg-ink text-ivory" data-hide-sticky>
        <div className="container-site">
          <div className="text-center" data-reveal>
            <p className="eyebrow !text-ivory/50">Shop on Amazon</p>
            <h2 className="h-section mx-auto mt-4 max-w-3xl">Get the collection on Amazon.com</h2>
            <p className="mx-auto mt-5 max-w-lg text-ivory/70">Each button takes you directly to the official UNI&amp;CORE listing on Amazon, where you'll see current pricing, shipping and reviews.</p>
          </div>
          <ul className="mt-14 grid gap-5 md:grid-cols-3">
            {routine.map((p) => (
              <li key={p.slug} className="flex items-center gap-5 rounded-3xl bg-ivory/5 p-5 ring-1 ring-ivory/10" data-reveal>
                <div className={`w-24 shrink-0 rounded-2xl ${ACCENT[p.accent].bgLight} p-2`}>
                  <Packshot kind={p.key} image={p.heroImage} alt="" sizes="96px" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-widest text-ivory/50">Step 0{p.routineStep} · {p.size}</p>
                  <p className="mt-1 font-display text-2xl leading-tight">{p.shortName}</p>
                  <PromoBadge promotion={p.promotion} initial={isPromoActive(p.promotion)} className="mt-2 inline-block !bg-citrus !text-ink" />
                  <div className="mt-3">
                    <AmazonButton product={toAmazonProduct(p)} location="shop" className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-citrus underline underline-offset-4" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }])} />
    </>
  );
}
