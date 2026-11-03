import Link from "next/link";
import type { ProductContent, VerificationStatus } from "@/content/types";
import { ACCENT } from "@/lib/accent";
import { isPromoActive } from "@/lib/promo";
import { toAmazonProduct } from "@/lib/visibility";
import { Packshot } from "@/components/site/Packshot";
import { AmazonButton } from "@/components/site/AmazonButton";
import { PromoOffer, PromoStrip } from "@/components/site/PromoBanner";
import { StickyCTA } from "@/components/site/StickyCTA";
import { FaqList } from "@/components/site/FaqList";
import { VideoGallery } from "@/components/site/VideoGallery";
import { BeforeAfterSlider } from "@/components/site/BeforeAfterSlider";
import { ProductViewTracker } from "@/components/site/ProductViewTracker";

function Pending({ status, preview }: { status: VerificationStatus; preview: boolean }) {
  if (!preview || status === "verified") return null;
  return <span className="ml-2 inline-block rounded bg-red-600 px-1.5 py-0.5 align-middle font-sans text-[10px] font-bold uppercase tracking-wider text-white">Pending verification</span>;
}

function SectionHead({ eyebrow, title, sub, center = false }: { eyebrow: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} data-reveal>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="h-section mt-4">{title}</h2>
      {sub && <p className="mt-5 text-lg leading-relaxed text-ink-soft">{sub}</p>}
    </div>
  );
}

/**
 * The 13-section product landing page.
 * `product` must already be filtered with publicView() for public routes;
 * the admin preview passes the full product with `preview` on.
 */
export function ProductLanding({ product: p, related, preview = false }: { product: ProductContent; related: ProductContent[]; preview?: boolean }) {
  const a = ACCENT[p.accent];
  const ap = toAmazonProduct(p);
  const promoInitial = isPromoActive(p.promotion);
  const pct = p.heroEyebrow.match(/\d+(\.\d+)?%/)?.[0];

  return (
    <>
      <ProductViewTracker product={ap} />
      <PromoStrip product={ap} initialActive={promoInitial} />

      {/* 1. HERO */}
      <section id="hero" className={`grain relative overflow-hidden bg-gradient-to-b ${a.gradient}`}>
        <div className="container-site relative grid items-center gap-8 pb-16 pt-8 md:grid-cols-2 md:pb-24 md:pt-16">
          <nav aria-label="Breadcrumb" className="text-xs text-ink-mute md:col-span-2">
            <ol className="flex gap-2">
              <li><Link href="/" className="hover:text-ink">Home</Link></li>
              <li aria-hidden>/</li>
              <li aria-current="page">{p.shortName}</li>
            </ol>
          </nav>
          <div className="order-2 md:order-1">
            <p className={`eyebrow ${a.text}`}>{p.heroEyebrow}</p>
            <h1 className="mt-5 font-display text-[42px] leading-[1] sm:text-6xl lg:text-7xl">{p.heroHeadline}</h1>
            <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-ink-soft">
              UNI&amp;CORE {p.name} · {p.size}
            </p>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft">{p.heroSub}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {p.highlights.map((h) => (
                <li key={h} className="rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-medium ring-1 ring-ink/10">{h}</li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <AmazonButton product={ap} location="hero" />
              <Link href="#how-to-use" className="text-xs font-semibold uppercase tracking-widest underline underline-offset-4">How to use</Link>
            </div>
            <p className="mt-4 text-xs text-ink-mute">Sold on Amazon.com · Prices and availability shown on Amazon</p>
          </div>
          <div className="relative order-1 md:order-2">
            <div className={`absolute inset-[12%] rounded-full ${a.bg} opacity-20 blur-3xl`} aria-hidden />
            {pct && (
              <p className="pointer-events-none absolute -left-2 top-4 select-none font-display text-[110px] italic leading-none text-ink/[0.06] sm:text-[180px]" aria-hidden>
                {pct}
              </p>
            )}
            <Packshot kind={p.key} image={p.heroImage} alt={`UNI&CORE ${p.name}, ${p.size}`} priority className="relative mx-auto max-w-[420px] animate-floaty" sizes="(max-width: 768px) 80vw, 420px" />
          </div>
        </div>
      </section>

      {/* Skin concerns */}
      <section className="section">
        <div className="container-site">
          <SectionHead eyebrow="Sound familiar?" title="When skin needs a reset" />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {p.concerns.map((c, i) => (
              <div key={c.title} className="card p-7" data-reveal style={{ ["--reveal-delay" as string]: `${i * 100}ms` }}>
                <p className={`font-display text-5xl ${a.text}`}>0{i + 1}</p>
                <h3 className="mt-4 text-2xl">{c.title}</h3>
                <p className="mt-2 text-ink-soft">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. BEFORE & AFTER (verified photos only) */}
      {p.beforeAfter.length > 0 && (
        <section className="section bg-cream">
          <div className="container-site">
            <SectionHead eyebrow="Before & After" title="See the difference" sub="Drag the slider to compare. Photos are unretouched images from product testing." />
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {p.beforeAfter.map((b) => (
                <div key={b.id} data-reveal>
                  <BeforeAfterSlider item={b} />
                  <Pending status={b.status} preview={preview} />
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-ink-mute">{p.claimsNote}</p>
          </div>
        </section>
      )}

      {/* 3. KEY BENEFITS */}
      <section className="section">
        <div className="container-site grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div data-reveal>
            <p className="eyebrow">Key Benefits</p>
            <h2 className="h-section mt-4">What it does for your skin</h2>
            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-ink/10 pt-8">
              {p.specs.map((s) => (
                <div key={s.label}>
                  <dt className="text-[11px] uppercase tracking-widest text-ink-mute">{s.label}</dt>
                  <dd className="mt-1 font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <ul className="space-y-4">
            {p.benefits.map((b, i) => (
              <li key={b.title} className="flex gap-6 rounded-3xl bg-white/70 p-7 ring-1 ring-ink/5" data-reveal style={{ ["--reveal-delay" as string]: `${i * 100}ms` }}>
                <span className={`mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full ${a.bgLight} font-display text-xl ${a.text}`}>✦</span>
                <div>
                  <h3 className="text-2xl">{b.title}</h3>
                  <p className="mt-1 text-ink-soft">{b.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. UGC VIDEO */}
      {p.videos.length > 0 && (
        <section className="section bg-cream">
          <div className="container-site">
            <SectionHead eyebrow="Real Routines" title="See it in action" sub="Real people, real routines — watch how they use it." />
            <div className="mt-12">
              <VideoGallery videos={p.videos} product={ap} />
            </div>
          </div>
        </section>
      )}

      {/* 5. CLINICAL & CONSUMER RESULTS (verified claims only) */}
      {p.claims.length > 0 && (
        <section className="section">
          <div className="container-site">
            <SectionHead eyebrow="Tested Results" title="The numbers behind the glow" center />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {p.claims.map((c, i) => (
                <div key={c.id} className="card p-8 text-center" data-reveal style={{ ["--reveal-delay" as string]: `${i * 100}ms` }}>
                  <p className={`font-display text-6xl ${a.text}`}>{c.value}</p>
                  <p className="mt-3 text-sm font-medium">{c.label}</p>
                  {c.detail && <p className="mt-2 text-xs text-ink-mute">{c.detail}</p>}
                  <Pending status={c.status} preview={preview} />
                  {preview && c.source && <p className="mt-2 text-[11px] text-red-700">Source: {c.source}</p>}
                </div>
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-ink-mute">
              {p.claims.filter((c) => c.source && c.status === "verified").map((c, i) => (
                <span key={c.id} className="block">{i + 1}. {c.source}</span>
              ))}
              {p.claimsNote}
            </p>
          </div>
        </section>
      )}

      {/* 6. DIFFERENTIATION */}
      <section className="section bg-ink text-ivory">
        <div className="container-site">
          <div className="max-w-2xl" data-reveal>
            <p className="eyebrow !text-ivory/50">Why UNI&amp;CORE</p>
            <h2 className="h-section mt-4">What makes it different</h2>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-ivory/10 md:grid-cols-3">
            {p.differentiators.map((d, i) => (
              <div key={d.title} className="bg-ink p-8" data-reveal style={{ ["--reveal-delay" as string]: `${i * 100}ms` }}>
                <p className="font-display text-xl italic text-citrus">0{i + 1}</p>
                <h3 className="mt-4 text-3xl leading-tight">{d.title}</h3>
                <p className="mt-3 text-ivory/70">{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. KEY INGREDIENTS */}
      {p.ingredients.length > 0 && (
        <section className="section">
          <div className="container-site">
            <SectionHead eyebrow="Key Ingredients" title="Built around one hero" />
            <div className={`mt-12 grid gap-6 ${p.ingredients.length > 1 ? "md:grid-cols-2" : ""}`}>
              {p.ingredients.map((ing) => (
                <article key={ing.name} className={`relative overflow-hidden rounded-[32px] ${a.bgLight} p-9`} data-reveal>
                  <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full ${a.bg} opacity-30 blur-2xl`} aria-hidden />
                  <p className="eyebrow">{ing.role}</p>
                  <h3 className="mt-3 text-4xl">
                    {ing.name}
                    <Pending status={ing.status} preview={preview} />
                  </h3>
                  {ing.inci && <p className="mt-1 text-sm italic text-ink-mute">INCI: {ing.inci}</p>}
                  <p className="mt-4 max-w-md leading-relaxed text-ink-soft">{ing.detail}</p>
                </article>
              ))}
            </div>
            <p className="mt-6 text-xs text-ink-mute">For the full ingredient list, see the product packaging or the Amazon listing.</p>
          </div>
        </section>
      )}

      {/* 8. TEXTURE */}
      <section className="section bg-cream">
        <div className="container-site grid items-center gap-12 md:grid-cols-2">
          <div className={`relative aspect-square overflow-hidden rounded-[36px] bg-gradient-to-br ${a.texture}`} data-reveal aria-hidden>
            <div className={`absolute left-1/2 top-1/2 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full ${a.bg} opacity-40 blur-2xl`} />
            <div className="absolute left-[28%] top-[30%] h-24 w-24 rounded-full bg-white/80 shadow-inner" />
            <div className="absolute left-[52%] top-[48%] h-14 w-14 rounded-full bg-white/70 shadow-inner" />
            <div className="absolute left-[38%] top-[62%] h-9 w-9 rounded-full bg-white/60 shadow-inner" />
          </div>
          <div data-reveal>
            <p className="eyebrow">Texture &amp; Application</p>
            <h2 className="h-section mt-4">{p.texture.title}</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">{p.texture.text}</p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {p.texture.notes.map((n) => (
                <li key={n} className="rounded-full border border-ink/15 px-4 py-2 text-sm">{n}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 9. HOW TO USE */}
      <section id="how-to-use" className="section">
        <div className="container-site">
          <SectionHead eyebrow="How to Use" title="Your routine, step by step" />
          <ol className={`mt-12 grid gap-5 ${p.howTo.length > 3 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
            {p.howTo.map((s, i) => (
              <li key={s.title} className="relative rounded-3xl border border-ink/10 p-7" data-reveal style={{ ["--reveal-delay" as string]: `${i * 100}ms` }}>
                <span className={`grid h-11 w-11 place-items-center rounded-full ${a.bg} font-display text-xl text-white`}>{i + 1}</span>
                <h3 className="mt-5 text-2xl">{s.title}</h3>
                <p className="mt-2 text-ink-soft">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 10. AMAZON OFFER */}
      <section className="pb-20 sm:pb-28">
        <div className="container-site" data-reveal>
          <PromoOffer
            product={ap}
            initialActive={promoInitial}
            fallback={
              <div className={`relative overflow-hidden rounded-[32px] ${a.bgLight} px-6 py-14 text-center sm:px-14`}>
                <p className="eyebrow">Available on Amazon</p>
                <p className="mx-auto mt-4 max-w-xl font-display text-4xl leading-tight sm:text-5xl">Fast, trusted checkout on Amazon.com</p>
                <p className="mx-auto mt-4 max-w-lg text-ink-soft">See today's price, Prime eligibility and customer reviews on the official listing.</p>
                <div className="mt-8 flex justify-center">
                  <AmazonButton product={ap} location="offer" />
                </div>
              </div>
            }
          />
        </div>
      </section>

      {/* 11. FAQ */}
      {p.faqs.length > 0 && (
        <section className="section bg-cream">
          <div className="container-site grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHead eyebrow="FAQ" title="Questions, answered" />
            <FaqList faqs={p.faqs} product={ap} />
          </div>
        </section>
      )}

      {/* 12. RELATED / ROUTINE */}
      <section className="section">
        <div className="container-site">
          <SectionHead eyebrow="Complete the Routine" title="Better together" sub="Our 3-step vitamin C routine: cleanse, mask, then lock it in with the ampoule." />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {related.map((r) => (
              <article key={r.slug} className="card flex items-center gap-6 p-6" data-reveal>
                <Link href={`/products/${r.slug}`} className={`w-28 shrink-0 rounded-2xl ${ACCENT[r.accent].bgLight} p-3`} aria-label={r.name}>
                  <Packshot kind={r.key} image={r.heroImage} alt="" sizes="112px" />
                </Link>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-widest text-ink-mute">Step 0{r.routineStep}</p>
                  <h3 className="mt-1 text-2xl leading-tight">
                    <Link href={`/products/${r.slug}`}>{r.name}</Link>
                  </h3>
                  <p className="mt-1 text-sm text-ink-soft">{r.tagline}</p>
                  <div className="mt-3 flex flex-wrap gap-4">
                    <Link href={`/products/${r.slug}`} className="text-xs font-semibold uppercase tracking-widest underline underline-offset-4">Discover</Link>
                    <AmazonButton product={toAmazonProduct(r)} location="related" className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold uppercase tracking-widest underline underline-offset-4">Shop on Amazon</AmazonButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 13. FINAL CTA */}
      <section data-hide-sticky className={`grain relative overflow-hidden bg-gradient-to-t ${a.gradient}`}>
        <div className="container-site grid items-center gap-8 py-20 md:grid-cols-[1fr_auto] md:py-28">
          <div data-reveal>
            <p className={`eyebrow ${a.text}`}>{p.keyIngredient}</p>
            <h2 className="h-section mt-4 max-w-2xl">{p.tagline}</h2>
            <div className="mt-8">
              <AmazonButton product={ap} location="final" />
            </div>
          </div>
          <Packshot kind={p.key} image={p.heroImage} alt="" className="mx-auto w-56 md:w-72" sizes="288px" />
        </div>
      </section>

      <StickyCTA product={ap} promoInitial={promoInitial} />
    </>
  );
}
