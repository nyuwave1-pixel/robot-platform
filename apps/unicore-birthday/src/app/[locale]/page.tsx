import { notFound } from "next/navigation";
import Experience from "@/components/Experience";
import { product } from "@/data/product";
import { seo } from "@/data/seo";
import { isLocale, localeMeta } from "@/i18n/config";
import { getDict } from "@/i18n/dict";
import { LocaleProvider } from "@/i18n/context";

type Params = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Params) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  const lang = localeMeta[locale].hreflang;
  const site = seo.siteUrl;
  const pageUrl = `${site}${d.seoView.path === "/" ? "" : d.seoView.path}`;
  const idBase = `${site}/`;
  const org = { "@type": "Organization", "@id": `${idBase}#organization`, name: product.brand, alternateName: d.product.brandLocal, url: product.urls.brand, logo: { "@type": "ImageObject", url: `${site}/icon.png`, width: 512, height: 512 }, sameAs: [product.urls.brand] };
  const verified = d.clinicalList.filter((c) => c.verified);
  const howto = d.howto;
  const faq = d.jsonld.faq;
  const jsonLd = [
    { "@context": "https://schema.org", ...org },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${idBase}#website`,
      url: site,
      name: seo.siteName,
      alternateName: `${d.product.brandLocal} ${d.product.nameLocal}`,
      inLanguage: lang,
      publisher: { "@id": `${idBase}#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: d.seoView.title,
      description: d.seoView.description,
      inLanguage: lang,
      isPartOf: { "@id": `${idBase}#website` },
      about: { "@id": `${idBase}#product` },
      primaryImageOfPage: { "@type": "ImageObject", url: `${site}${seo.ogImage}`, width: 1200, height: 630 },
      datePublished: seo.publishedAt,
      dateModified: new Date().toISOString().slice(0, 10),
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${idBase}#product`,
      name: `${product.brand} ${product.name}`,
      alternateName: [`${d.product.brandLocal} ${d.product.nameLocal}`, d.jsonld.birthdayAlias, product.subtitle],
      description: d.seoView.description,
      slogan: `${d.copy.s01.ko1} ${d.copy.s01.ko2}`,
      brand: { "@type": "Brand", name: product.brand, alternateName: d.product.brandLocal },
      manufacturer: { "@id": `${idBase}#organization` },
      category: "Beauty & Personal Care > Skin Care > Face Cream",
      image: [`${site}${seo.ogImage}`, `${site}${seo.ogImageSquare}`, `${site}${product.images.openBox}`],
      size: `${product.volume.g} g / ${product.volume.oz} oz`,
      audience: { "@type": "PeopleAudience", suggestedGender: "unisex", suggestedMinAge: 20 },
      additionalProperty: [
        ...d.ingredientsList.map((i) => ({ "@type": "PropertyValue", name: d.jsonld.keyIngredient, value: i.name })),
        ...verified.map((c) => ({ "@type": "PropertyValue", name: c.label, value: `${c.value}${c.unitLabel}`, description: c.footnote })),
        { "@type": "PropertyValue", name: d.jsonld.trialProp, value: `${d.trialInfo.institute} ${d.trialInfo.code}` },
      ],
      ...(product.urls.purchase ? { offers: { "@type": "Offer", url: product.urls.purchase, availability: "https://schema.org/InStock", priceCurrency: "KRW" } } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: `${product.brand} ${product.name} — ${d.jsonld.videoClinicalName}`,
      description: d.jsonld.videoClinicalDesc,
      thumbnailUrl: [`${site}/media/posters/film_portrait_poster.webp`],
      contentUrl: `${site}/media/film/film_portrait_1080.mp4`,
      uploadDate: seo.publishedAt,
      duration: "PT1M3S",
      inLanguage: "ko-KR",
      publisher: { "@id": `${idBase}#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: `${product.brand} ${product.name} — ${d.jsonld.videoCinematicName}`,
      description: d.jsonld.videoCinematicDesc,
      thumbnailUrl: [`${site}/media/posters/film_poster.webp`],
      contentUrl: `${site}/media/film/film_1080.mp4`,
      uploadDate: seo.publishedAt,
      duration: "PT1M2S",
      inLanguage: "ko-KR",
      publisher: { "@id": `${idBase}#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: d.product.brandLocal, item: product.urls.brand },
        { "@type": "ListItem", position: 2, name: `${d.product.nameLocal} (${product.name})`, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: lang,
      mainEntity: [
        { "@type": "Question", name: faq[0].q, acceptedAnswer: { "@type": "Answer", text: `${howto.intro}. ${howto.steps.map((s) => `${s.step} ${s.area}: ${s.line1} ${s.line2}`).join(" ")}` } },
        { "@type": "Question", name: faq[1].q, acceptedAnswer: { "@type": "Answer", text: verified.map((c) => `${c.label} ${c.value}${c.unitLabel}`).join(", ") + ". " + d.clinicalList[0].footnote } },
        { "@type": "Question", name: faq[2].q, acceptedAnswer: { "@type": "Answer", text: d.ingredientsList.map((i) => `${i.name}: ${i.claim1} ${i.claim2}`).join(" / ") } },
        { "@type": "Question", name: faq[3].q, acceptedAnswer: { "@type": "Answer", text: `${product.volume.g} g (${product.volume.oz} oz). ${d.jsonld.howtoAnswerTail}` } },
      ],
    },
  ];
  return (
    <LocaleProvider locale={locale}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Experience />
    </LocaleProvider>
  );
}
