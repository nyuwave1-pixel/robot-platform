import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteRenderer from "@/components/site/SiteRenderer";
import { pageUrl, photoUrl, SITE_URL } from "@/lib/env";
import { getProducts, getPublicProfile } from "@/lib/supabase/public";

// 본사가 비공개로 바꾸면 즉시 내려가야 하므로 매 요청마다 확인한다
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublicProfile(slug);
  if (!p) return { title: "페이지를 찾을 수 없습니다", robots: { index: false } };
  const title = [p.display_name, p.business_name].filter(Boolean).join(" · ") + " | UNI&CORE";
  const description = (p.seo_description || p.bio || `${p.display_name} — UNI&CORE 공식 사업자`).slice(0, 160);
  const img = photoUrl(p.photo_path);
  return {
    title,
    description,
    alternates: { canonical: pageUrl(p.slug) },
    openGraph: { type: "profile", title, description, url: pageUrl(p.slug), siteName: "UNI&CORE PARTNER", locale: "ko_KR", images: img ? [{ url: img, alt: p.display_name }] : undefined },
    twitter: { card: img ? "summary_large_image" : "summary", title, description, images: img ? [img] : undefined },
  };
}

/** JSON-LD 문자열에서 </script> 탈출을 막는다 */
function ld(obj: unknown) {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export default async function PartnerPage({ params }: { params: Params }) {
  const { slug } = await params;
  const p = await getPublicProfile(slug);
  if (!p) notFound();
  const products = await getProducts(p.product_ids);
  const url = pageUrl(p.slug);
  const img = photoUrl(p.photo_path);
  const sameAs = Object.values(p.sns).filter(Boolean);
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${url}#person`,
        name: p.display_name,
        jobTitle: p.title || undefined,
        image: img || undefined,
        url,
        sameAs: sameAs.length ? sameAs : undefined,
        worksFor: p.business_name ? { "@id": `${url}#business` } : undefined,
      },
      p.business_name
        ? {
            "@type": "LocalBusiness",
            "@id": `${url}#business`,
            name: p.business_name,
            url,
            image: img || undefined,
            telephone: p.phone || undefined,
            email: p.email || undefined,
            address: p.address ? { "@type": "PostalAddress", streetAddress: p.address, addressCountry: "KR" } : undefined,
            description: p.seo_description || undefined,
          }
        : null,
      ...products.map((pr) => ({
        "@type": "Product",
        name: pr.name,
        description: pr.tagline || undefined,
        image: pr.image_url ? new URL(pr.image_url, SITE_URL).toString() : undefined,
        brand: { "@type": "Brand", name: "UNI&CORE" },
        url: pr.shop_url || undefined,
      })),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "UNI&CORE PARTNER", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: p.display_name, item: url },
        ],
      },
    ].filter(Boolean),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(graph) }} />
      <SiteRenderer profile={p} products={products} />
    </>
  );
}
