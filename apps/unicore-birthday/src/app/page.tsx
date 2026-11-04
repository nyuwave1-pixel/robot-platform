import Experience from "@/components/Experience";
import { product } from "@/data/product";
import { seo } from "@/data/seo";
import { clinical, trial } from "@/data/clinical";
import { howto } from "@/data/howto";
import { keyIngredients } from "@/data/ingredients";
import { copy } from "@/data/copy";

export default function Page() {
  const site = seo.siteUrl;
  const org = { "@type": "Organization", "@id": `${site}/#organization`, name: product.brand, alternateName: product.brandKo, url: product.urls.brand, logo: { "@type": "ImageObject", url: `${site}/icon.png`, width: 512, height: 512 }, sameAs: [product.urls.brand] };
  const verified = clinical.filter((c) => c.verified);
  const jsonLd = [
    { "@context": "https://schema.org", ...org },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${site}/#website`,
      url: site,
      name: seo.siteName,
      alternateName: `${product.brandKo} ${product.nameKo}`,
      inLanguage: "ko-KR",
      publisher: { "@id": `${site}/#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${site}/#webpage`,
      url: site,
      name: seo.title,
      description: seo.description,
      inLanguage: "ko-KR",
      isPartOf: { "@id": `${site}/#website` },
      about: { "@id": `${site}/#product` },
      primaryImageOfPage: { "@type": "ImageObject", url: `${site}${seo.ogImage}`, width: 1200, height: 630 },
      datePublished: seo.publishedAt,
      dateModified: new Date().toISOString().slice(0, 10),
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${site}/#product`,
      name: `${product.brand} ${product.name}`,
      alternateName: [`${product.brandKo} ${product.nameKo}`, `${product.brandKo} 버스데이 크림`, product.subtitle],
      description: seo.description,
      slogan: `${copy.s01.ko1.text} ${copy.s01.ko2.text}`,
      brand: { "@type": "Brand", name: product.brand, alternateName: product.brandKo },
      manufacturer: { "@id": `${site}/#organization` },
      category: "Beauty & Personal Care > Skin Care > Face Cream",
      image: [`${site}${seo.ogImage}`, `${site}${seo.ogImageSquare}`, `${site}${product.images.openBox}`],
      size: `${product.volume.g} g / ${product.volume.oz} oz`,
      audience: { "@type": "PeopleAudience", suggestedGender: "unisex", suggestedMinAge: 20 },
      additionalProperty: [
        ...keyIngredients.map((i) => ({ "@type": "PropertyValue", name: "핵심 성분", value: i.name })),
        ...verified.map((c) => ({ "@type": "PropertyValue", name: c.label, value: `${c.value}${c.unit}`, description: c.footnote })),
        { "@type": "PropertyValue", name: "인체적용시험", value: `${trial.institute} ${trial.code}` },
      ],
      ...(product.urls.purchase ? { offers: { "@type": "Offer", url: product.urls.purchase, availability: "https://schema.org/InStock", priceCurrency: "KRW" } } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: `${product.brand} ${product.name} — 임상 강조 필름`,
      description: `4주 인체적용시험 결과를 담은 ${product.brandKo} ${product.nameKo} 세로 필름 (60초)`,
      thumbnailUrl: [`${site}/media/posters/film_portrait_poster.webp`],
      contentUrl: `${site}/media/film/film_portrait_1080.mp4`,
      uploadDate: seo.publishedAt,
      duration: "PT1M3S",
      inLanguage: "ko-KR",
      publisher: { "@id": `${site}/#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: `${product.brand} ${product.name} — 시네마틱 필름`,
      description: `피부의 첫 번째 생일, ${product.subtitle}. ${product.brandKo} ${product.nameKo} 브랜드 필름 (62초)`,
      thumbnailUrl: [`${site}/media/posters/film_poster.webp`],
      contentUrl: `${site}/media/film/film_1080.mp4`,
      uploadDate: seo.publishedAt,
      duration: "PT1M2S",
      inLanguage: "ko-KR",
      publisher: { "@id": `${site}/#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: product.brandKo, item: product.urls.brand },
        { "@type": "ListItem", position: 2, name: `${product.nameKo} (${product.name})`, item: site },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "1ST BIRTHDAY CREAM은 어떻게 사용하나요?", acceptedAnswer: { "@type": "Answer", text: `${howto.intro}. ${howto.steps.map((s) => `${s.step} ${s.area}: ${s.line1} ${s.line2}`).join(" ")}` } },
        { "@type": "Question", name: "인체적용시험 결과는 무엇인가요?", acceptedAnswer: { "@type": "Answer", text: verified.map((c) => `${c.label} ${c.value}${c.unit}`).join(", ") + ". " + clinical[0].footnote } },
        { "@type": "Question", name: "핵심 성분은 무엇인가요?", acceptedAnswer: { "@type": "Answer", text: keyIngredients.map((i) => `${i.name}: ${i.claim1} ${i.claim2}`).join(" / ") } },
        { "@type": "Question", name: "용량과 라인업 내 사용 순서는?", acceptedAnswer: { "@type": "Answer", text: `${product.volume.g} g (${product.volume.oz} oz). 세안 후 스킨케어 마지막 단계(크림 단계)에 사용합니다.` } },
      ],
    },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Experience />
    </>
  );
}
