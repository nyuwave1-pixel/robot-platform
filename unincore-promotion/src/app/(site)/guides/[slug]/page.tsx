import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, ROUTINE_GUIDE } from "@/content/guides";
import { getProducts } from "@/lib/cms";
import { abs, breadcrumbLd, faqLd, pageMetadata } from "@/lib/seo";
import { toAmazonProduct } from "@/lib/visibility";
import { AmazonButton } from "@/components/site/AmazonButton";
import { JsonLd } from "@/components/site/JsonLd";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) return {};
  return pageMetadata({ title: g.title, description: g.description, path: `/guides/${g.slug}`, keywords: [...g.keywords, "UNI&CORE"], ogImage: "/og/home", absoluteTitle: true });
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) notFound();
  const products = await getProducts();
  const byKey = Object.fromEntries(products.map((p) => [p.key, p]));
  const featured = g.products.map((k) => byKey[k]).filter(Boolean);
  const first = featured[0];
  const path = `/guides/${g.slug}`;
  const others = GUIDES.filter((x) => x.slug !== g.slug);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.h1,
    description: g.description,
    url: abs(path),
    mainEntityOfPage: abs(path),
    datePublished: g.published,
    dateModified: g.updated,
    inLanguage: "en-US",
    image: [abs("/og/home"), ...featured.map((p) => abs(p.heroImage || `/og/${p.slug}`))],
    author: { "@type": "Organization", name: "UNI&CORE", url: abs("/") },
    publisher: { "@id": abs("/#organization") },
    about: featured.map((p) => ({ "@type": "Product", name: `UNI&CORE ${p.name}`, url: abs(`/products/${p.slug}`) })),
  };

  return (
    <>
      <article>
        <header className="bg-cream">
          <div className="container-site max-w-4xl py-16 sm:py-24">
            <nav aria-label="Breadcrumb" className="text-xs text-ink-mute">
              <ol className="flex flex-wrap gap-2">
                <li><Link href="/" className="hover:text-ink">Home</Link></li>
                <li aria-hidden>/</li>
                <li><Link href="/guides" className="hover:text-ink">Guides</Link></li>
                <li aria-hidden>/</li>
                <li aria-current="page">{g.h1}</li>
              </ol>
            </nav>
            <p className="eyebrow mt-8">Guide · Korean skincare</p>
            <h1 className="mt-4 font-display text-[40px] leading-[1.02] sm:text-6xl">{g.h1}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">{g.intro}</p>
            {first && (
              <div className="mt-8">
                <AmazonButton product={toAmazonProduct(first)} location="guide" />
              </div>
            )}
          </div>
        </header>

        <div className="container-site max-w-3xl py-16 sm:py-20">
          {g.sections.map((s) => {
            const p = s.product ? byKey[s.product] : undefined;
            return (
              <section key={s.heading} className="mb-14">
                <h2 className="font-display text-3xl leading-tight sm:text-4xl">{s.heading}</h2>
                {s.paragraphs.map((para) => (
                  <p key={para.slice(0, 40)} className="mt-4 text-lg leading-relaxed text-ink-soft">{para}</p>
                ))}
                {p && (
                  <div className="mt-8 flex flex-col gap-6 rounded-[28px] bg-white p-6 ring-1 ring-ink/5 sm:flex-row sm:items-center">
                    <Link href={`/products/${p.slug}`} className="relative block aspect-[4/5] w-32 shrink-0 overflow-hidden rounded-2xl" aria-label={p.name}>
                      <Image src={p.heroImage || `/og/${p.slug}`} alt={`UNI&CORE ${p.name}, ${p.size}`} fill sizes="128px" className="object-cover" />
                    </Link>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-ink-mute">{p.keyIngredient}</p>
                      <p className="mt-1 font-display text-2xl leading-tight">UNI&amp;CORE {p.name}</p>
                      <p className="mt-1 text-sm text-ink-soft">{p.size}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <AmazonButton product={toAmazonProduct(p)} location="guide" />
                        <Link href={`/products/${p.slug}`} className="text-xs font-semibold uppercase tracking-widest underline underline-offset-4">Details</Link>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          })}

          <section className="mt-6">
            <h2 className="font-display text-3xl sm:text-4xl">FAQ</h2>
            <div className="mt-8 space-y-3">
              {g.faqs.map((f) => (
                <details key={f.q} className="rounded-2xl bg-cream p-5">
                  <summary className="cursor-pointer font-medium">{f.q}</summary>
                  <p className="mt-3 text-ink-soft">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <p className="mt-10 text-xs text-ink-mute">
            Test results are from UNI&amp;CORE&apos;s human application tests and may vary by individual. These products are cosmetics and are not intended to diagnose,
            treat, cure or prevent any disease.
          </p>
        </div>

        <aside className="bg-cream">
          <div className="container-site py-14">
            <h2 className="font-display text-3xl">More guides</h2>
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              <li>
                <Link href={`/guides/${ROUTINE_GUIDE.slug}`} className="block rounded-2xl bg-white p-5 ring-1 ring-ink/5 hover:ring-ink/20">
                  <span className="font-medium">{ROUTINE_GUIDE.h1}</span>
                </Link>
              </li>
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={`/guides/${o.slug}`} className="block rounded-2xl bg-white p-5 ring-1 ring-ink/5 hover:ring-ink/20">
                    <span className="font-medium">{o.h1}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </article>

      <JsonLd
        data={[
          articleLd,
          faqLd(g.faqs),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: g.h1, path },
          ]),
        ]}
      />
    </>
  );
}
