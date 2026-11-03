import Experience from "@/components/Experience";
import { product } from "@/data/product";
import { seo } from "@/data/seo";
import { clinical } from "@/data/clinical";
import { howto } from "@/data/howto";

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${product.brand} ${product.name}`,
      alternateName: `${product.brandKo} ${product.nameKo}`,
      description: seo.description,
      brand: { "@type": "Brand", name: product.brand },
      image: [`${seo.siteUrl}${seo.ogImage}`, `${seo.siteUrl}${product.images.openBox}`],
      size: `${product.volume.g} g`,
      ...(product.urls.purchase ? { offers: { "@type": "Offer", url: product.urls.purchase, availability: "https://schema.org/InStock" } } : {}),
    },
    { "@context": "https://schema.org", "@type": "Organization", name: product.brand, alternateName: product.brandKo, url: product.urls.brand },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "1ST BIRTHDAY CREAM은 어떻게 사용하나요?", acceptedAnswer: { "@type": "Answer", text: `${howto.intro}. ${howto.steps.map((s) => `${s.step} ${s.area}: ${s.line1} ${s.line2}`).join(" ")}` } },
        { "@type": "Question", name: "인체적용시험 결과는 무엇인가요?", acceptedAnswer: { "@type": "Answer", text: clinical.filter((c) => c.verified).map((c) => `${c.label} ${c.value}${c.unit}`).join(", ") + ". " + clinical[0].footnote } },
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
