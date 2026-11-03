import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/cms";
import { abs } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const now = new Date();
  return [
    { url: abs("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...products.map((p) => ({
      url: abs(`/products/${p.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: [abs(p.heroImage || `/og/${p.slug}`)],
    })),
    ...["/contact", "/privacy", "/terms", "/disclaimer"].map((path) => ({ url: abs(path), lastModified: now, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
