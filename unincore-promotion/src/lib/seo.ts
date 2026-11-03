import type { Metadata } from "next";
import { SITE } from "@/content/site";
import type { ProductContent } from "@/content/types";

export const abs = (path: string) => (path.startsWith("http") ? path : `${SITE.url}${path.startsWith("/") ? "" : "/"}${path}`);

export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogImage?: string;
  noindex?: boolean;
  absoluteTitle?: boolean;
}): Metadata {
  const url = abs(opts.path);
  const images = [{ url: abs(opts.ogImage || "/og/home"), width: 1200, height: 630, alt: opts.title }];
  return {
    title: opts.absoluteTitle ? { absolute: opts.title } : opts.title,
    description: opts.description,
    keywords: opts.keywords,
    alternates: {
      canonical: url,
      // hreflang: extend SITE.locales when /ko, /ja, /es go live.
      languages: { "en-US": url, "x-default": url },
    },
    openGraph: {
      type: "website",
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      title: opts.title,
      description: opts.description,
      images,
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, images: images.map((i) => i.url) },
    robots: opts.noindex ? { index: false, follow: false } : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  };
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: abs("/icon.svg"),
    sameAs: [SITE.mainSite, ...SITE.social],
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    name: `${SITE.name} USA`,
    url: SITE.url,
    inLanguage: "en-US",
    publisher: { "@id": `${SITE.url}/#organization` },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

/**
 * Product markup. Offers are only emitted when a verified price is stored
 * in the CMS; ratings/reviews are never emitted because they live on Amazon.
 */
export function productLd(p: ProductContent) {
  const url = abs(`/products/${p.slug}`);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: p.name,
    description: p.seo.description,
    image: [abs(p.heroImage || `/og/${p.slug}`)],
    brand: { "@type": "Brand", name: SITE.name },
    sku: p.asin,
    category: "Beauty > Skin Care",
    url,
  };
  if (p.price) {
    data.offers = {
      "@type": "Offer",
      url: p.amazonUrl,
      price: p.price.amount,
      priceCurrency: p.price.currency,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Amazon.com" },
    };
  }
  return data;
}

export function faqLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function videoLd(p: ProductContent) {
  return p.videos.map((v) => ({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.title,
    description: v.description,
    thumbnailUrl: [abs(v.poster)],
    uploadDate: v.uploadDate,
    contentUrl: abs(v.src),
    ...(v.duration && { duration: v.duration }),
  }));
}
