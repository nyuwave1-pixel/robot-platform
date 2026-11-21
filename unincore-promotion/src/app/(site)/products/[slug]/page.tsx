import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_PRODUCTS } from "@/content/products";
import { getProductBySlug, getProducts } from "@/lib/cms";
import { breadcrumbLd, landingVideoLd, pageMetadata, productLd } from "@/lib/seo";
import { LANDING } from "@/content/landing";
import { publicView } from "@/lib/visibility";
import { LandingPage } from "@/components/landing/LandingPage";
import { JsonLd } from "@/components/site/JsonLd";

// Note: no `dynamicParams = false` — in Next 15.5 it breaks on-demand revalidation (NoFallbackError).
// Unknown slugs still 404 via notFound().

export function generateStaticParams() {
  return DEFAULT_PRODUCTS.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found", robots: { index: false } };
  return pageMetadata({
    title: p.seo.title,
    description: p.seo.description,
    keywords: p.seo.keywords,
    path: `/products/${p.slug}`,
    ogImage: p.seo.ogImage || `/og/${p.slug}`,
    absoluteTitle: true,
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const raw = await getProductBySlug(slug);
  if (!raw) notFound();
  const product = publicView(raw);
  const all = await getProducts();

  // No FAQ section on these pages (client plan), so no FAQPage. The creator videos get VideoObject data.
  const ld: unknown[] = [
    productLd(product),
    breadcrumbLd([
      { name: "Home", path: "/" },
      { name: product.shortName, path: `/products/${product.slug}` },
    ]),
    ...landingVideoLd(LANDING[product.key], product.name),
  ];

  return (
    <>
      <LandingPage product={product} all={all} />
      <JsonLd data={ld} />
    </>
  );
}
