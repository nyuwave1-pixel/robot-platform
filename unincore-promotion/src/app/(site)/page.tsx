import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ProductContent } from "@/content/types";
import { getProducts } from "@/lib/cms";
import { pageMetadata, breadcrumbLd } from "@/lib/seo";
import { isPromoActive } from "@/lib/promo";
import { publicView, toAmazonProduct } from "@/lib/visibility";
import { AmazonButton } from "@/components/site/AmazonButton";
import { PromoBadge } from "@/components/site/PromoBadge";
import { JsonLd } from "@/components/site/JsonLd";
import { BRAND } from "@/data/brand";
import { SCENES, RITUAL_ORDER } from "@/data/scenes";
import { FILMS, hasFilm } from "@/data/videos";
import { Intro } from "@/components/vitac/Intro";
import { MotionProvider } from "@/components/vitac/MotionProvider";
import { ShaderStage } from "@/components/vitac/ShaderStage";
import { TiltProduct } from "@/components/vitac/TiltProduct";
import { HomeStickyCTA } from "@/components/vitac/HomeStickyCTA";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: "UNI&CORE VITA C Collection | Korean Vitamin C Skincare on Amazon",
  description:
    "Discover the UNI&CORE VITA C Collection: an enzyme powder wash, a brightening sheet mask and the Vita C 13.5 ampoule — one Korean vitamin C ritual. Shop on Amazon.",
  path: "/",
  keywords: ["UNI&CORE", "Korean vitamin C skincare", "K beauty vitamin C", "vitamin C skincare routine", "Korean skincare", "vitamin C serum", "vitamin C sheet mask", "enzyme powder wash"],
  ogImage: "/og/home",
  absoluteTitle: true,
});

/** Label-verified vitamin C facts per product (US e-commerce labels). */
const IN_FORMULA: Record<string, string> = {
  wash: "Ascorbic acid, working alongside papain and bromelain enzymes.",
  mask: "Ascorbic acid in an essence with glutathione and hyaluronic acid.",
  ampoule: "Ascorbic acid listed second on the label — right after water.",
};

function byKey(products: ProductContent[]) {
  return RITUAL_ORDER.map((k) => products.find((p) => p.key === k)).filter(Boolean) as ProductContent[];
}

function BuyButton({ p, location, label, className = "btn-gold" }: { p: ProductContent; location: string; label: string; className?: string }) {
  return (
    <AmazonButton product={toAmazonProduct(p)} location={location} className={className}>
      {label}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M7 17 17 7M8 7h9v9" />
      </svg>
    </AmazonButton>
  );
}

export default async function HomePage() {
  const all = await getProducts();
  const products = byKey(all.map(publicView));
  const get = (k: string) => products.find((p) => p.key === k);
  const wash = get("wash");
  const mask = get("mask");
  const ampoule = get("ampoule");

  // Ingredient story: only ingredients that are verified against the US INCI lists.
  const ingredientMap = new Map<string, { name: string; inci?: string; role: string; detail: string; in: string[] }>();
  for (const p of products) {
    for (const ing of p.ingredients) {
      const id = (ing.inci || ing.name).toLowerCase();
      const cur = ingredientMap.get(id);
      if (cur) cur.in.push(p.shortName);
      else ingredientMap.set(id, { name: ing.name, inci: ing.inci, role: ing.role, detail: ing.detail, in: [p.shortName] });
    }
  }
  const ingredients = [...ingredientMap.values()].sort((a, b) => b.in.length - a.in.length);

  const buyLabels = Object.fromEntries(products.map((p) => [p.key, SCENES[p.key].buyShort]));

  return (
    <>
      <Intro products={products.map((p) => ({ key: p.key, name: p.name, image: p.heroImage }))} />
      <MotionProvider />

      {/* 01 HERO */}
      <section id="hero" className="relative isolate overflow-hidden bg-night text-ivory">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_70%_45%,rgba(233,185,77,.22),rgba(8,7,6,0)_70%)]" aria-hidden />
        <ShaderStage shader="gold" className="-z-10" />
        <div className="container-site grid items-center gap-8 pb-16 pt-8 lg:min-h-[min(92svh,860px)] lg:grid-cols-[1fr_1.1fr] lg:gap-10 lg:py-20">
          <div className="relative z-10 order-2 lg:order-1">
            <p className="eyebrow !text-champagne">{BRAND.hero.eyebrow}</p>
            <h1 className="mt-6 font-display text-[46px] leading-[0.98] sm:text-7xl lg:text-[92px]">
              {BRAND.hero.headline[0]} <em className="vc-gold-text not-italic">{BRAND.hero.headline[1]}</em>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ivory/75">{BRAND.hero.sub}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#shop" className="btn-gold" data-magnetic>
                Shop now
              </a>
              <a href="#ritual" className="btn-ghost-light" data-magnetic>
                Explore the collection
              </a>
            </div>
            <ul className="mt-10 flex flex-wrap gap-2" aria-label="The collection">
              {products.map((p) => (
                <li key={p.slug}>
                  <Link href={`/products/${p.slug}`} className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-ivory/5 px-4 py-2 text-xs font-medium ring-1 ring-ivory/15 transition hover:ring-champagne">
                    <span className="text-champagne">{SCENES[p.key].step}</span>
                    {p.shortName}
                    <PromoBadge promotion={p.promotion} initial={isPromoActive(p.promotion)} className="!px-2 !py-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative order-1 mx-auto grid w-full max-w-[330px] grid-cols-3 items-end gap-2 pt-6 sm:max-w-[560px] lg:order-2 lg:max-w-[640px] lg:pt-0">
            {[mask, ampoule, wash].map((p, i) =>
              p ? (
                <Link
                  key={p.slug}
                  href={`/products/${p.slug}`}
                  aria-label={p.name}
                  data-parallax={i === 1 ? "0.06" : "0.14"}
                  className={`block transition duration-500 hover:-translate-y-2 ${i === 1 ? "z-10 scale-[1.3]" : "opacity-90"}`}
                >
                  <span className="relative block aspect-[4/5] overflow-hidden rounded-[12%] shadow-[0_30px_60px_-30px_rgba(0,0,0,.9)] ring-1 ring-champagne/20">
                    <Image src={p.heroImage || ""} alt={`${p.name} by UNI&CORE`} fill priority sizes="(max-width:768px) 33vw, 220px" className="object-cover" />
                  </span>
                </Link>
              ) : null,
            )}
          </div>
        </div>
        <div className="vc-scroll-cue" aria-hidden>
          <span />
        </div>
      </section>

      {/* 02 THE VITAMIN C STORY */}
      <section className="section bg-ivory">
        <div className="container-site grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div>
            <p className="eyebrow">{BRAND.story.eyebrow}</p>
            <h2 className="h-section mt-4 max-w-xl" data-words>
              <Words text={BRAND.story.title} />
            </h2>
            <div className="mt-10 rounded-[28px] bg-cream p-8">
              <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-mute">About the ingredient</p>
              <ul className="mt-4 space-y-3 text-ink-soft">
                {BRAND.story.ingredient.map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-mute">In our formulas · from the US labels</p>
            <ol className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
              {products.map((p) => (
                <li key={p.key} className="grid grid-cols-[72px_1fr] items-center gap-5 py-5">
                  <span className="relative block aspect-[4/5] overflow-hidden rounded-2xl">
                    <Image src={p.heroImage || ""} alt={p.name} fill sizes="72px" className="object-cover" />
                  </span>
                  <span>
                    <span className="block text-[11px] font-semibold uppercase tracking-eyebrow text-champagne">
                      {SCENES[p.key].step} · {SCENES[p.key].verb}
                    </span>
                    <span className="mt-1 block font-display text-2xl leading-tight">{p.name}</span>
                    <span className="mt-1 block text-sm text-ink-soft">{IN_FORMULA[p.key]}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 03 THREE-STEP RITUAL — pinned horizontal scroll on desktop, vertical on mobile */}
      <section id="ritual" className="vc-ritual relative overflow-hidden bg-cream" data-hscroll>
        <div className="vc-ritual-track flex flex-col gap-6 px-5 py-20 sm:px-8 lg:h-[100svh] lg:w-max lg:flex-row lg:items-center lg:gap-10 lg:py-0 lg:pl-[max(32px,calc((100vw-1240px)/2))] lg:pr-[20vw]" data-hscroll-track>
          <div className="max-w-md shrink-0 lg:w-[34vw]">
            <p className="eyebrow">The 3-Step Ritual</p>
            <h2 className="h-section mt-4">Cleanse. Mask. Brighten.</h2>
            <p className="mt-5 text-ink-soft">{BRAND.intro.reveal} Use all three together, or start with the step your skin needs most.</p>
            <p className="mt-8 hidden text-[11px] font-semibold uppercase tracking-[0.28em] text-ink-mute lg:block" aria-hidden>
              Scroll →
            </p>
          </div>
          {products.map((p, i) => {
            const s = SCENES[p.key];
            return (
              <article key={p.key} className="vc-ritual-card relative grid shrink-0 overflow-hidden rounded-[32px] bg-ivory p-6 ring-1 ring-ink/5 sm:grid-cols-[0.9fr_1fr] sm:gap-8 sm:p-8 lg:w-[min(64vw,820px)]">
                <span className="relative block aspect-[4/5] overflow-hidden rounded-[24px]">
                  <Image src={p.heroImage || ""} alt={p.name} fill sizes="(max-width:1024px) 80vw, 360px" className="object-cover" />
                </span>
                <div className="mt-6 flex flex-col sm:mt-0">
                  <p className="font-display text-6xl leading-none text-champagne sm:text-7xl" aria-hidden>
                    0{i + 1}
                  </p>
                  <p className="eyebrow mt-4">
                    {s.step} · {s.verb}
                  </p>
                  <h3 className="mt-2 text-3xl leading-tight sm:text-4xl">{p.name}</h3>
                  <p className="mt-2 text-sm text-ink-mute">{p.size}</p>
                  <p className="mt-4 text-ink-soft">{p.howTo.map((h) => h.text).slice(-2).join(" ")}</p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-6">
                    <a href={`#${p.key}`} className="btn-ghost !min-h-[44px] !px-5 !text-[11px]">
                      {s.discover}
                    </a>
                    <BuyButton p={p} location="ritual" label="Shop on Amazon" className="btn-amazon !min-h-[44px] !px-5 !text-[11px]" />
                  </div>
                </div>
                {i < products.length - 1 && <span className="vc-liquid-link hidden lg:block" aria-hidden />}
              </article>
            );
          })}
        </div>
        <div className="vc-ritual-progress hidden lg:block" aria-hidden>
          <span />
        </div>
      </section>

      {/* 04 PRODUCT 01 — ENZYME POWDER WASH: powder meets water, turns into foam */}
      {wash && (
        <section id="wash" data-product-key="wash" className="vc-scene vc-scene-wash relative isolate overflow-hidden">
          <ShaderStage shader="powder" className="-z-10" />
          <div className="container-site grid items-center gap-12 py-24 lg:grid-cols-2 lg:py-32">
            <TiltProduct src={wash.heroImage || ""} alt={wash.name} className="mx-auto w-full max-w-[420px]" glow="rgba(255,255,255,.6)" />
            <ProductCopy p={wash} />
          </div>
        </section>
      )}

      {/* 05 PRODUCT 02 — SUPER BRIGHTENING MASK: essence and sheet texture */}
      {mask && (
        <section id="mask" data-product-key="mask" className="vc-scene vc-scene-mask relative isolate overflow-hidden">
          <ShaderStage shader="essence" className="-z-10" />
          <div className="container-site grid items-center gap-12 py-24 lg:grid-cols-2 lg:py-32">
            <div className="order-2 lg:order-1">
              <ProductCopy p={mask} extra={<WearTime />} />
            </div>
            <TiltProduct src={mask.heroImage || ""} alt={mask.name} className="order-1 mx-auto w-full max-w-[420px] lg:order-2" glow="rgba(246,215,107,.45)" />
          </div>
        </section>
      )}

      {/* 06 PRODUCT 03 — VITA C 13.5 AMPOULE: 13.5 typography and molten gold */}
      {ampoule && (
        <section id="ampoule" data-product-key="ampoule" className="vc-scene relative isolate overflow-hidden bg-night text-ivory">
          <ShaderStage shader="liquid" className="-z-10" />
          <div className="flex justify-center pt-20 [perspective:900px] sm:pt-24" aria-hidden>
            <span className="vc-135" data-zoom>
              13.5
            </span>
          </div>
          <div className="container-site grid items-center gap-12 pb-28 pt-6 lg:grid-cols-2 lg:pb-36">
            <TiltProduct src={ampoule.heroImage || ""} alt={ampoule.name} className="mx-auto w-full max-w-[420px]" glow="rgba(233,185,77,.5)" />
            <ProductCopy p={ampoule} dark />
          </div>
        </section>
      )}

      {/* 07 INGREDIENT STORY */}
      <section className="section bg-ivory">
        <div className="container-site">
          <div className="max-w-2xl">
            <p className="eyebrow">Ingredient Story</p>
            <h2 className="h-section mt-4" data-words>
              <Words text="Every ingredient here is on the US label." />
            </h2>
            <p className="mt-5 text-ink-soft">We only highlight ingredients we can match to each product&apos;s full ingredient list. The full lists are on every product page.</p>
          </div>
          <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ingredients.map((ing, i) => (
              <li key={ing.name} className="vc-ingredient relative overflow-hidden rounded-[28px] bg-cream p-7" data-reveal style={{ ["--reveal-delay" as string]: `${(i % 4) * 90}ms` }}>
                <span className="vc-molecule" aria-hidden />
                <p className="eyebrow !text-champagne">{ing.role}</p>
                <h3 className="mt-3 text-3xl leading-tight">{ing.name}</h3>
                {ing.inci && <p className="mt-1 text-xs italic text-ink-mute">INCI: {ing.inci}</p>}
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">{ing.detail}</p>
                <p className="mt-5 flex flex-wrap gap-1.5">
                  {ing.in.map((n) => (
                    <span key={n} className="rounded-full bg-ivory px-3 py-1 text-[11px] font-medium ring-1 ring-ink/10">
                      {n}
                    </span>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 08 TEXTURE EXPERIENCE */}
      <section className="section bg-obsidian text-ivory">
        <div className="container-site">
          <p className="eyebrow !text-champagne">Texture</p>
          <h2 className="h-section mt-4 max-w-3xl">Powder. Essence. Ampoule.</h2>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {products.map((p) => {
              const film = FILMS[SCENES[p.key].film];
              return (
                <figure key={p.key} className="group relative overflow-hidden rounded-[28px] bg-night ring-1 ring-ivory/10">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {hasFilm(film) ? (
                      <video className="h-full w-full object-cover" autoPlay muted loop playsInline preload="none" poster={film.poster} aria-label={`${p.name} texture film`}>
                        {film.webm && <source src={film.webm} type="video/webm" />}
                        <source src={film.src} type="video/mp4" />
                      </video>
                    ) : (
                      <Image src={p.visualImage || p.heroImage || ""} alt={`${p.name} key visual`} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition duration-[1.6s] group-hover:scale-105" />
                    )}
                  </div>
                  <figcaption className="p-6">
                    <p className="eyebrow !text-champagne">{SCENES[p.key].verb}</p>
                    <p className="mt-2 font-display text-2xl leading-tight">{p.texture.title}</p>
                    <p className="mt-2 text-sm text-ivory/70">{p.texture.text}</p>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      {/* 09 HOW TO USE — exactly as written on the US labels */}
      <section id="how-to-use" className="section bg-ivory">
        <div className="container-site">
          <p className="eyebrow">How to Use</p>
          <h2 className="h-section mt-4">Your ritual, step by step.</h2>
          <ol className="mt-14 grid gap-6 lg:grid-cols-3">
            {products.map((p, i) => (
              <li key={p.key} className="rounded-[28px] border border-ink/10 p-7">
                <p className="flex items-baseline gap-3">
                  <span className="font-display text-5xl text-champagne">0{i + 1}</span>
                  <span className="eyebrow">{SCENES[p.key].verb}</span>
                </p>
                <h3 className="mt-3 text-2xl leading-tight">{p.name}</h3>
                <ol className="mt-5 space-y-3 text-sm text-ink-soft">
                  {p.howTo.map((h, j) => (
                    <li key={h.title} className="grid grid-cols-[22px_1fr] gap-2">
                      <span className="text-champagne">{j + 1}.</span>
                      <span>
                        <b className="font-semibold text-ink">{h.title}.</b> {h.text}
                      </span>
                    </li>
                  ))}
                </ol>
                <Link href={`/products/${p.slug}#how-to-use`} className="mt-6 inline-block text-xs font-semibold uppercase tracking-widest underline underline-offset-4">
                  Full details
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 10 FINAL COLLECTION */}
      <section id="shop" className="relative isolate overflow-hidden bg-night py-24 text-ivory sm:py-32" data-hide-sticky>
        <ShaderStage shader="gold" className="-z-10 opacity-70" />
        <div className="container-site">
          <div className="text-center">
            <p className="eyebrow !text-champagne">The Collection · on Amazon.com</p>
            <h2 className="h-section mx-auto mt-4 max-w-3xl">{BRAND.finale.title}</h2>
            <p className="mx-auto mt-4 max-w-lg font-display text-2xl italic text-ivory/70">{BRAND.finale.sub}</p>
          </div>
          <ul className="mt-16 grid gap-6 md:grid-cols-3">
            {products.map((p) => (
              <li key={p.key} className="flex flex-col rounded-[32px] bg-ivory/[0.04] p-6 ring-1 ring-ivory/10">
                <span className="relative block aspect-[4/5] overflow-hidden rounded-[24px]">
                  <Image src={p.heroImage || ""} alt={p.name} fill sizes="(max-width:768px) 90vw, 360px" className="object-cover" />
                  <PromoBadge promotion={p.promotion} initial={isPromoActive(p.promotion)} className="absolute left-4 top-4 !bg-gold !text-night" />
                </span>
                <p className="mt-6 text-[11px] uppercase tracking-widest text-ivory/50">
                  {SCENES[p.key].step} · {p.size}
                </p>
                <p className="mt-1 font-display text-3xl leading-tight">{p.name}</p>
                <div className="mt-auto grid gap-2 pt-6">
                  <BuyButton p={p} location="collection" label={SCENES[p.key].buy} className="btn-gold !text-[11px]" />
                  <Link href={`/products/${p.slug}`} className="btn-ghost-light !min-h-[44px] !text-[11px]">
                    {SCENES[p.key].discover}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-center">
            <a href="#ritual" className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne underline underline-offset-4">
              Explore all products
            </a>
          </p>
          <p className="mx-auto mt-6 max-w-xl text-center text-xs text-ivory/50">
            Each button opens the official UNI&amp;CORE listing on Amazon.com in a new tab, where you&apos;ll see current pricing, shipping and reviews.
          </p>
        </div>
      </section>

      <HomeStickyCTA products={products.map(toAmazonProduct)} labels={buyLabels} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }])} />
    </>
  );
}

function ProductCopy({ p, dark = false, extra }: { p: ProductContent; dark?: boolean; extra?: React.ReactNode }) {
  const s = SCENES[p.key];
  const mute = dark ? "text-ivory/70" : "text-ink-soft";
  return (
    <div>
      <p className={`eyebrow ${dark ? "!text-champagne" : ""}`}>
        {s.step} · {s.verb} · {s.kicker}
      </p>
      <h2 className="h-section mt-4">{s.headline}</h2>
      <p className={`mt-5 max-w-lg text-lg leading-relaxed ${mute}`}>{s.sub}</p>
      <dl className={`mt-8 grid max-w-lg grid-cols-2 gap-x-6 gap-y-4 border-t pt-6 ${dark ? "border-ivory/15" : "border-ink/10"}`}>
        {p.specs.slice(0, 4).map((sp) => (
          <div key={sp.label}>
            <dt className={`text-[11px] uppercase tracking-widest ${dark ? "text-ivory/50" : "text-ink-mute"}`}>{sp.label}</dt>
            <dd className="mt-1 text-sm font-medium">{sp.value}</dd>
          </div>
        ))}
      </dl>
      {extra}
      <div className="mt-9 flex flex-wrap gap-3">
        <BuyButton p={p} location="scene" label={s.buy} className="btn-gold" />
        <Link href={`/products/${p.slug}`} className={dark ? "btn-ghost-light" : "btn-ghost"}>
          {s.discover}
        </Link>
      </div>
    </div>
  );
}

/** The mask's wear time from its label, drawn as a dial (10–20 of 60 minutes). */
function WearTime() {
  const r = 34;
  const c = 2 * Math.PI * r;
  const from = 10 / 60;
  const to = 20 / 60;
  return (
    <div className="mt-8 flex items-center gap-5">
      <svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label="Wear for 10 to 20 minutes">
        <circle cx="42" cy="42" r={r} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="6" />
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke="#C6A16A"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${c * (to - from)} ${c}`}
          strokeDashoffset={-c * from}
          transform="rotate(-90 42 42)"
        />
        <text x="42" y="47" textAnchor="middle" className="fill-current font-display" fontSize="15">
          10–20
        </text>
      </svg>
      <p className="max-w-[16rem] text-sm text-ink-soft">Minutes on the skin, darker side of the sheet facing out — straight from the label.</p>
    </div>
  );
}

/** Words wrapped for the scroll reveal; the full sentence stays readable to screen readers. */
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} className="vc-word">
          {w}
          {i < text.split(" ").length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}
