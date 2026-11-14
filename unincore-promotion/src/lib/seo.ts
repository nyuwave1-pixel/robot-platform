import type { Metadata } from "next";
import { SITE } from "@/content/site";
import type { ProductContent } from "@/content/types";
import { LANDING, type LandingContent } from "@/content/landing";

/** Images the product landing page actually shows: the white-background shot, the key-benefit image and the listing gallery. */
export function landingImages(c: LandingContent): string[] {
  const gallery = c.gallery.flatMap((g) => (g.kind === "image" ? [g.src] : g.kind === "beforeAfter" ? [g.before, g.after].filter((x): x is string => Boolean(x)) : []));
  return [...new Set([c.shot.src, c.hero.src, ...gallery])];
}

/** "0:29" → "PT0M29S" */
const isoDuration = (d: string) => {
  const [m, s] = d.split(":").map(Number);
  return `PT${m || 0}M${s || 0}S`;
};

/** Creator videos on a product landing page. They were added to this site on 2026-11-10. */
export function landingVideoLd(c: LandingContent, productName: string) {
  return c.ugc.map((v) => ({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.caption,
    description: `${v.caption}. A creator video about UNI&CORE ${productName}.`,
    thumbnailUrl: [abs(v.poster)],
    contentUrl: abs(v.video),
    uploadDate: "2026-11-10",
    duration: isoDuration(v.duration),
  }));
}

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
    alternateName: SITE.alternateNames,
    legalName: SITE.legalName,
    // Tells search engines which UNI&CORE this is: "uni core" alone also matches a holding company and software projects.
    description: "UNI&CORE is a Korean skincare brand: vitamin C serum, vitamin C sheet mask, enzyme powder cleanser and a hydrating face mist, sold in the US on Amazon and TikTok Shop.",
    url: SITE.url,
    logo: abs("/icon.svg"),
    sameAs: [SITE.mainSite, "https://us.unincore.com", SITE.amazonStore, ...SITE.social],
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    // Google shows this as the site name above each result, so it is the plain brand.
    name: SITE.name,
    alternateName: SITE.alternateNames,
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
    image: landingImages(LANDING[p.key]).slice(0, 10).map(abs),
    // The search phrase the page is built around ("Korean Vitamin C Serum for Face, 13.5% Pure"), from its title.
    alternateName: p.seo.title.split(" | ")[0],
    brand: { "@type": "Brand", name: SITE.name, alternateName: SITE.alternateNames },
    ...(p.asin && { sku: p.asin }),
    category: "Beauty > Skin Care",
    url,
    ...(p.size && { size: p.size }),
    countryOfOrigin: "KR",
    ...(p.keyIngredient && { additionalProperty: [{ "@type": "PropertyValue", name: "Key ingredient", value: p.keyIngredient }] }),
    sameAs: [p.shop?.url ?? p.amazonUrl, ...(p.officialDetail ? [p.officialDetail.sourceUrl] : [])].filter(Boolean),
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

/** Home page: the three products as an ItemList (helps Google tie the landing pages together). */
export function productListLd(products: ProductContent[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "UNI&CORE VITA C Collection",
    itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/products/${p.slug}`), name: p.name })),
  };
}
