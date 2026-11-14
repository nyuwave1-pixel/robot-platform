import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES, ROUTINE_GUIDE } from "@/content/guides";
import { abs, breadcrumbLd, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";

export const metadata: Metadata = pageMetadata({
  title: "Vitamin C Skincare Guides | UNI&CORE Korean Skincare",
  description: "How to use vitamin C serums, ampoules, sheet masks and enzyme cleansers in a Korean skincare routine — guides from UNI&CORE.",
  path: "/guides",
  keywords: ["vitamin C skincare guide", "Korean skincare guide", "how to use vitamin C serum", "UNI&CORE"],
  ogImage: "/og/home",
  absoluteTitle: true,
});

const ALL = [{ slug: ROUTINE_GUIDE.slug, h1: ROUTINE_GUIDE.h1, description: ROUTINE_GUIDE.description }, ...GUIDES.map((g) => ({ slug: g.slug, h1: g.h1, description: g.description }))];

export default function GuidesIndex() {
  return (
    <div className="guide">
      <section className="bg-cream">
        <div className="container-site max-w-4xl py-16 sm:py-24">
          <p className="eyebrow">Guides</p>
          <h1 className="mt-4 font-display text-[40px] leading-[1.02] sm:text-6xl">Vitamin C Skincare Guides</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Practical, label-based guides to using vitamin C in a Korean skincare routine. Every UNI&amp;CORE product mentioned is available on Amazon.com.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container-site">
          <ul className="grid gap-5 md:grid-cols-2">
            {ALL.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`} className="card block h-full p-7 transition hover:-translate-y-0.5">
                  <h2 className="font-display text-3xl leading-tight">{g.h1}</h2>
                  <p className="mt-3 text-ink-soft">{g.description}</p>
                  <span className="mt-5 inline-block text-xs font-semibold uppercase tracking-widest underline underline-offset-4">Read the guide</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "UNI&CORE vitamin C skincare guides",
            itemListElement: ALL.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/guides/${g.slug}`), name: g.h1 })),
          },
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
          ]),
        ]}
      />
    </div>
  );
}
