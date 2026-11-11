import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { ArrowUpRight, Atom, CirclesThree, Drop, Leaf, Plant, Scales, Star } from "@phosphor-icons/react/dist/ssr";
import type { ProductContent } from "@/content/types";
import { LANDING, ROUTINE, TRADEMARK, type LandingContent, type Review } from "@/content/landing";
import type { ProductKey } from "@/content/types";
import { isPromoActive } from "@/lib/promo";
import { toAmazonProduct } from "@/lib/visibility";
import { AmazonButton } from "@/components/site/AmazonButton";
import { PromoStrip } from "@/components/site/PromoBanner";
import { StickyCTA } from "@/components/site/StickyCTA";
import { ProductViewTracker } from "@/components/site/ProductViewTracker";
import { LandingGallery } from "./LandingGallery";
import { ResultMeters } from "./ResultMeters";
import { SavingsBox } from "./SavingsBox";
import { AmazonCta } from "./AmazonCta";
import { Fig } from "./Fig";
import { Slot } from "./Slot";
import { VideoCard } from "./VideoCard";
import { rich } from "./rich";

const ICONS = { atom: Atom, circles: CirclesThree, drop: Drop, scales: Scales, leaf: Leaf, plant: Plant };

/** Showreel-style section headline: heavy sans, one keyword in the accent color. */
function Heading({ title, accent, sub }: { title: string; accent?: string; sub?: string }) {
  return (
    <header>
      <h2 className="font-sans text-[clamp(30px,3.1vw,42px)] font-extrabold leading-[1.12] tracking-[-0.035em] text-body">{rich(title, accent)}</h2>
      {sub && <p className="mt-3 text-[15px] text-body-mute">{rich(sub)}</p>}
    </header>
  );
}

function Block({ children, className = "", id, hideSticky = false }: { children: ReactNode; className?: string; id?: string; hideSticky?: boolean }) {
  return (
    <section id={id} className={`mt-20 sm:mt-24 ${className}`} data-reveal data-hide-sticky={hideSticky || undefined}>
      {children}
    </section>
  );
}

/** The product's own light behind the page: slow light pools, plus the blurred studio photo where it matches. */
function LightField({ src }: { src?: string }) {
  return (
    <div aria-hidden className="lp-field">
      <div className="lp-field-inner">
        {src && <div className="lp-field-photo" style={{ backgroundImage: `url(${src})` }} />}
        <span className="lp-orb lp-orb-a" />
        <span className="lp-orb lp-orb-b" />
        <span className="lp-orb lp-orb-c" />
        <span className="lp-orb lp-orb-d" />
      </div>
    </div>
  );
}

/** The product's Amazon main image (white background), shown whole. */
function ProductShot({ k, className = "", sizes, priority = false }: { k: ProductKey; className?: string; sizes: string; priority?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      <Image src={LANDING[k].shot.src} alt="" fill priority={priority} sizes={sizes} className="object-contain" />
    </div>
  );
}

/** Amazon star rating, partial stars filled to the score. */
function Stars({ score, size = 18 }: { score: number; size?: number }) {
  return (
    <span role="img" className="relative inline-flex" aria-label={`${score} out of 5 stars`}>
      <span className="flex text-body/15">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={size} weight="fill" aria-hidden />
        ))}
      </span>
      <span className="absolute inset-0 flex overflow-hidden text-[#FF9900]" style={{ width: `${(score / 5) * 100}%` }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={size} weight="fill" aria-hidden className="shrink-0" />
        ))}
      </span>
    </span>
  );
}

/**
 * Written Amazon reviews: the reviewers' product photos in a row, then one card per review
 * (stars, name, date, the review in their words). With no reviews filled in yet, the same
 * layout shows labeled slots so nothing is invented.
 */
function Reviews({ items, photos }: { items: Review[]; photos: { src: string; name: string }[] }) {
  if (!items.length) {
    return (
      <div className="mt-8 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Slot key={i} caption="Amazon review photo" className="aspect-square rounded-[20px]" compact />
          ))}
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="paper rounded-[20px] px-6 py-5">
            <Stars score={5} size={15} />
            <p className="mt-2 text-[14.5px] text-body-mute">Verified Amazon review will appear here.</p>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="mt-8 space-y-3">
      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-3" aria-label="Product photos from Amazon reviewers">
          {photos.slice(0, 3).map((ph) => (
            <li key={ph.src} className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-body/5">
              <Image src={ph.src} alt={`Product photo uploaded by ${ph.name} with their 5-star Amazon review`} fill sizes="(min-width: 1024px) 190px, 33vw" className="object-cover" />
            </li>
          ))}
        </ul>
      )}
      {items.map((r) => (
        <figure key={`${r.name}-${r.date}`} className="paper rounded-[20px] px-6 py-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <Stars score={r.stars} size={15} />
            {r.title && <span className="font-sans text-[15px] font-semibold tracking-[-0.01em] text-body">{r.title}</span>}
          </div>
          <blockquote className="mt-3 text-[15px] leading-relaxed text-body-soft">{r.text}</blockquote>
          <figcaption className="mt-3.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[13px] text-body-mute">
            <span className="font-semibold text-body">{r.name}</span>
            <span>Reviewed on Amazon.com, {r.date}</span>
            <span className={r.badge === "Verified Purchase" ? "font-semibold text-[#B35900]" : ""}>{r.badge}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/**
 * Amazon landing page. Content and section order follow the JYT plan; the
 * look is our own: the product's light behind a few liquid-glass panels that
 * hold the key copy, showreel headlines with one accent keyword, Didone figures
 * that echo the packaging wordmark.
 */
export function LandingPage({ product: p, all }: { product: ProductContent; all: ProductContent[] }) {
  const c: LandingContent = LANDING[p.key];
  const ap = toAmazonProduct(p);
  const promoInitial = isPromoActive(p.promotion);
  const theme = {
    "--acc": c.theme.acc,
    "--acc-ink": c.theme.ink,
    "--acc-tint": c.theme.tint,
    "--acc-deep": c.theme.deep,
    "--acc-glow": c.theme.glow,
    "--acc-bright": c.theme.bright ?? c.theme.acc,
  } as CSSProperties;

  return (
    <div className="lp" style={theme}>
      <LightField src={`/landing/${p.key}-field.webp`} />
      <ProductViewTracker product={ap} />
      <PromoStrip product={ap} initialActive={promoInitial} />

      <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-10">
        <div className="grid items-start gap-8 pb-24 pt-4 sm:pt-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-10 lg:pb-32 lg:pt-8 xl:gap-14">
          <aside id="hero" className="lg:sticky lg:top-[calc(var(--header-h)_+_20px)]">
            <LandingGallery items={c.gallery} product={ap} ctaLabel={c.ctaLabel} />
          </aside>

          <div className="min-w-0 lg:max-w-[580px]">
            {/* Sales proof */}
            <section aria-label={c.lead.eyebrow} className="glass glass-live overflow-hidden rounded-[28px] px-7 pb-7 pt-6 sm:px-9 sm:pb-9 sm:pt-8">
              <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgb(var(--acc-glow)/0.7),transparent)]" />
              <p className="relative text-[14px] font-semibold text-acc-ink">{c.lead.eyebrow}</p>
              <p className="serif serif-xl chrome relative mt-2 pb-1 text-[clamp(68px,8.4vw,116px)] font-semibold leading-[0.92] tracking-[-0.03em]">
                <Fig value={c.lead.big} />
              </p>
              <p className="relative mt-4 max-w-[36ch] text-[17px] leading-snug text-body-soft">{rich(c.lead.text)}</p>
            </section>

            {/* The Amazon listing's key-benefit image, the product name under it in the same glass card */}
            <figure className="glass mt-5 rounded-[28px] p-2.5">
              <div className="relative aspect-square overflow-hidden rounded-[20px] bg-white">
                <Image src={c.hero.src} alt={c.hero.alt} fill priority sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
              </div>
              <figcaption className="relative px-4 pb-4 pt-5 sm:px-5">
                <h1 className="text-[clamp(28px,3vw,40px)] leading-[1.06] text-body">{rich(c.title)}</h1>
              </figcaption>
            </figure>

            {/* Headline result: the showreel line, then the figures beside a real photo */}
            <section className="mt-14" aria-labelledby="result-title">
              <h2 id="result-title" className="font-sans text-[clamp(36px,4.2vw,54px)] font-extrabold leading-[1.06] tracking-[-0.04em] text-body">
                {rich(`${c.result.title} ${c.result.highlight}`, c.result.highlight)}
              </h2>
              <p className="mt-3 text-[15px] text-body-mute">{c.result.sub}</p>
              <div className="glass mt-7 grid overflow-hidden rounded-[28px] p-2.5 sm:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] sm:aspect-auto sm:min-h-[300px]">
                  <Image src={c.result.image} alt={c.result.imageAlt} fill sizes="(min-width: 1024px) 270px, 100vw" className="object-cover" />
                </div>
                <dl className="relative grid grid-cols-3 divide-x divide-body/10 px-1 py-5 sm:grid-cols-1 sm:divide-x-0 sm:divide-y sm:px-6 sm:py-2">
                  {c.result.stats.map((s) => (
                    <div key={s.label} className="flex flex-col-reverse justify-center px-2 text-center sm:flex-row-reverse sm:items-center sm:justify-between sm:gap-4 sm:px-0 sm:py-5 sm:text-left">
                      <dt className="mt-1.5 text-[13.5px] leading-snug text-body-mute sm:mt-0 sm:max-w-[13ch] sm:text-right">{s.label}</dt>
                      <dd className="serif text-[clamp(24px,3.2vw,40px)] font-semibold leading-none tracking-[-0.02em] text-body">
                        <Fig value={s.value} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>

            {/* Skin concerns: one card per concern, each with its own skin close-up */}
            <Block>
              <Heading title="Made for these skin concerns" accent="skin concerns" />
              <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
                {c.concerns.map((x) => (
                  <li key={x.title} className="paper overflow-hidden rounded-[22px] p-2">
                    <div className="relative aspect-[5/4] overflow-hidden rounded-[16px] bg-body/5">
                      <Image src={x.image} alt={x.alt} fill sizes="(min-width: 1024px) 280px, 50vw" className="object-cover" />
                    </div>
                    <div className="px-2.5 pb-3 pt-4 sm:px-3">
                      <h3 className="font-sans text-[17px] font-semibold leading-tight tracking-[-0.015em] text-body">{rich(x.title)}</h3>
                      <p className="mt-1.5 text-[14px] leading-snug text-body-mute">{rich(x.text)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Block>

            {/* UGC: creator videos from the brand's US Amazon listings */}
            <Block>
              <Heading title="See it in real routines" accent="real routines" sub={c.ugcNote} />
              <ul className="lp-hscroll -mx-4 mt-8 flex gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
                {c.ugc.map((u) => (
                  <li key={u.video} className="w-[46%] shrink-0 sm:w-[30%] lg:w-auto">
                    <VideoCard src={u.video} poster={u.poster} caption={u.caption} duration={u.duration} />
                    <p className="mt-3 px-0.5 text-[14px] leading-snug text-body">{rich(u.caption)}</p>
                  </li>
                ))}
              </ul>
            </Block>

            {/* Clinical results (ampoule only) */}
            {c.clinical && (
              <Block>
                <div className="glass rounded-[28px] px-6 py-8 sm:px-9 sm:py-10">
                  <div className="relative">
                    <Heading title={c.clinical.title} accent={c.clinical.accent} sub="Clinical test results" />
                    <div className="mt-9">
                      <ResultMeters rows={c.clinical.rows} />
                    </div>
                    <dl className="mt-9 grid grid-cols-[1fr_1fr_1.4fr] divide-x divide-body/10 border-t border-body/10 pt-6">
                      {c.clinical.facts.map((f) => (
                        <div key={f.big} className="flex flex-col-reverse justify-end px-2 text-center">
                          <dt className="mt-1.5 text-[13px] leading-snug text-body-mute">{f.small}</dt>
                          <dd className="serif text-[clamp(22px,2.4vw,28px)] font-semibold leading-none text-body">{f.big}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-6 text-[13px] leading-relaxed text-body-mute">{c.clinical.note}</p>
                  </div>
                </div>
              </Block>
            )}

            {/* Reviews: real 5-star Amazon reviews, the reviewers' own product photos above them */}
            <Block>
              <Heading title={c.reviews.title} accent="customers" sub={c.reviews.eyebrow} />
              <Reviews items={c.reviews.items} photos={c.reviews.photos} />
              <AmazonButton product={ap} location="reviews" className="group mt-5 inline-flex items-center gap-1.5 text-[15px] font-semibold text-body underline decoration-body/25 underline-offset-[5px] transition hover:decoration-body">
                Read reviews on Amazon
                <ArrowUpRight size={16} weight="bold" className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </AmazonButton>
            </Block>

            {/* What makes it different */}
            <Block>
              <div className="glass rounded-[28px] px-6 py-8 sm:px-9 sm:py-10">
                <div className="relative">
                  <Heading title={c.difference.title} accent={c.difference.accent} sub={c.difference.eyebrow} />
                  <div className="mt-9 grid grid-cols-2 gap-4 sm:gap-6">
                    {[c.difference.typical, c.difference.ours].map((d, i) => (
                      <div key={d.label} className="flex flex-col items-center text-center">
                        <div className="relative grid aspect-square w-[clamp(132px,15vw,164px)] place-items-center rounded-full bg-white/80 shadow-[0_0_0_1px_rgb(22_21_15/0.05),0_16px_30px_-20px_rgb(var(--acc-deep)/0.45)]">
                          <svg viewBox="0 0 120 120" className="absolute inset-[6%] h-[88%] w-[88%] -rotate-90" aria-hidden>
                            <defs>
                              <linearGradient id={`ring-${p.key}-${i}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={i ? "rgb(var(--acc-deep))" : "#C9C3B6"} />
                                <stop offset="60%" stopColor={i ? "rgb(var(--acc-ink))" : "#B5AE9F"} />
                                <stop offset="100%" stopColor={i ? "rgb(var(--iri))" : "#D8D4CB"} />
                              </linearGradient>
                            </defs>
                            <circle cx="60" cy="60" r="50" fill="none" strokeWidth="4" className="stroke-acc-deep/10" />
                            <circle
                              cx="60"
                              cy="60"
                              r="50"
                              fill="none"
                              strokeWidth="4"
                              strokeLinecap="round"
                              className="ring-arc"
                              stroke={`url(#ring-${p.key}-${i})`}
                              style={{ "--level": d.level } as CSSProperties}
                            />
                          </svg>
                          <span className={`relative max-w-[9ch] text-[14px] font-bold leading-tight ${i ? "text-acc-deep" : "text-body-mute"}`}>{d.label}</span>
                        </div>
                        <p className="mt-5 max-w-[26ch] text-[15px] leading-snug text-body-soft">{rich(d.text)}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-8 text-center text-[13px] text-body-mute">{c.difference.note}</p>
                </div>
              </div>
            </Block>

            {/* Key ingredients: one card structure for photo and non-photo items */}
            <Block>
              <Heading title="Key ingredients" accent="ingredients" />
              <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
                {c.ingredients.map((ing) => {
                  const Icon = ing.icon ? ICONS[ing.icon] : null;
                  return (
                    <article key={ing.name} className="paper grid grid-cols-[64px_1fr] items-start gap-x-4 rounded-[20px] p-5 sm:block">
                      {ing.image ? (
                        <div className="relative h-16 w-16 overflow-hidden rounded-full shadow-[0_0_0_3px_#fff,0_8px_18px_-10px_rgb(var(--acc-deep)/0.5)]">
                          <Image src={ing.image} alt={ing.name} fill sizes="64px" className="object-cover" />
                        </div>
                      ) : (
                        <div className="grid h-16 w-16 place-items-center rounded-full bg-acc-tint text-acc-ink shadow-[0_0_0_3px_#fff,0_8px_18px_-10px_rgb(var(--acc-deep)/0.5)]">
                          {Icon && <Icon size={26} weight="duotone" />}
                        </div>
                      )}
                      <div>
                        <p className="text-[13px] font-semibold text-acc-ink sm:mt-5">{rich(ing.tag)}</p>
                        <h3 className="mt-1 font-sans text-[19px] font-semibold leading-tight tracking-[-0.015em] text-body">{rich(ing.name)}</h3>
                        <p className="mt-2 text-[14.5px] leading-snug text-body-mute">{rich(ing.text)}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
              {p.fullIngredients && (
                <details className="mt-6">
                  <summary className="inline-flex cursor-pointer list-none items-center text-[14px] font-semibold text-body underline decoration-body/25 underline-offset-[5px] transition hover:decoration-body [&::-webkit-details-marker]:hidden">
                    Full ingredient list
                  </summary>
                  <p className="mt-3 text-[13px] leading-relaxed text-body-mute">{p.fullIngredients}</p>
                </details>
              )}
            </Block>

            {/* How to use: a real sequence, so it's numbered, each step with its photo */}
            <Block id="how-to-use">
              <Heading title={c.howTo.title} accent={c.howTo.accent} />
              <ol className="mt-8 grid gap-3 sm:grid-cols-3">
                {c.howTo.steps.map((s, i) => (
                  <li key={s} className="paper grid grid-cols-[96px_1fr] items-center gap-4 overflow-hidden rounded-[20px] p-2.5 sm:flex sm:flex-col sm:items-stretch sm:gap-0">
                    <div className="relative aspect-square overflow-hidden rounded-[14px] sm:aspect-[4/3]">
                      <Image src={c.stepImages[i]} alt="" fill sizes="(min-width: 640px) 180px, 96px" className="object-cover" />
                      <span className="serif absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-[rgb(var(--acc))] text-[15px] font-semibold text-[#16150F]">{i + 1}</span>
                    </div>
                    <p className="pr-2 text-[15px] leading-snug text-body sm:px-2 sm:pb-2 sm:pt-4">{rich(s)}</p>
                  </li>
                ))}
              </ol>
            </Block>

            {/* Special savings on Amazon */}
            <div className="lp-offer">
              <SavingsBox product={ap} initialActive={promoInitial} ctaLabel={c.ctaLabel} />
            </div>

            {/* 7-day glow routine, the end card: product name, photo and Amazon button only */}
            <Block hideSticky>
              <Heading title={ROUTINE.title} accent={ROUTINE.accent} />
              <ul className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
                {ROUTINE.items.map((r) => {
                  const prod = all.find((x) => x.key === r.key);
                  if (!prod) return null;
                  const current = r.key === p.key;
                  return (
                    <li
                      key={r.key}
                      className={`paper flex items-center gap-4 rounded-[20px] p-2.5 sm:h-full sm:flex-col sm:items-stretch sm:gap-0 ${current ? "!bg-[rgb(var(--acc-tint)/0.45)] !shadow-[0_0_0_1.5px_rgb(var(--acc-ink)/0.7),0_18px_36px_-24px_rgb(var(--acc-deep)/0.5)]" : ""}`}
                    >
                      <ProductShot k={r.key} sizes="(min-width: 640px) 190px, 96px" className="aspect-square w-24 shrink-0 rounded-[14px] sm:w-full" />
                      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:px-1 sm:pb-1 sm:pt-4">
                        <h3 className="font-sans text-[17px] font-semibold leading-[1.2] tracking-[-0.015em] text-body sm:flex sm:min-h-[2.4em] sm:items-center sm:justify-center sm:text-center">{r.name}</h3>
                        <AmazonCta product={toAmazonProduct(prod)} location={current ? "routine" : "related"} label="Shop on" size="sm" className="w-full sm:mt-auto" />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="glass mt-6 rounded-[28px] p-2.5">
                <ProductShot k={p.key} sizes="(min-width: 1024px) 560px, 100vw" className="aspect-[4/3] rounded-[20px]" />
                <div className="relative p-2 pt-3">
                  <AmazonCta product={ap} location="final" label={c.ctaLabel} className="w-full" />
                </div>
              </div>
            </Block>

            <footer className="mt-16 border-t border-body/10 pt-6 text-[13px] leading-relaxed text-body-mute">
              <p>{c.disclaimer}</p>
              <p className="mt-2.5">{TRADEMARK}</p>
            </footer>
          </div>
        </div>
      </div>

      <StickyCTA product={ap} promoInitial={promoInitial} image={c.shot.src} title={c.shortTitle} />
    </div>
  );
}
