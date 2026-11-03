import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_PRODUCTS } from "@/content/products";
import { getProductBySlug, getProducts } from "@/lib/cms";
import { breadcrumbLd, faqLd, pageMetadata, productLd, videoLd } from "@/lib/seo";
import { publicView } from "@/lib/visibility";
import { ProductLanding } from "@/components/product/ProductLanding";
import { JsonLd } from "@/components/site/JsonLd";

export const revalidate = 300;
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
  const related = (await getProducts()).filter((p) => p.slug !== slug).sort((a, b) => a.routineStep - b.routineStep);

  const ld: unknown[] = [
    productLd(product),
    breadcrumbLd([
      { name: "Home", path: "/" },
      { name: product.shortName, path: `/products/${product.slug}` },
    ]),
    ...videoLd(product),
  ];
  if (product.faqs.length) ld.push(faqLd(product.faqs));

  return (
    <>
      <ProductLanding product={product} related={related} />
      <JsonLd data={ld} />
    </>
  );
}
