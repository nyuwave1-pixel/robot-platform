import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/cms";
import { abs, landingImages } from "@/lib/seo";
import { GUIDES } from "@/content/guides";
import { LANDING } from "@/content/landing";


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
      images: [...landingImages(LANDING[p.key]), `/og/${p.slug}`].map(abs),
    })),
    { url: abs("/guides"), lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 },
    { url: abs("/guides/korean-vitamin-c-skincare-routine"), lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 },
    ...GUIDES.map((g) => ({
      url: abs(`/guides/${g.slug}`),
      lastModified: new Date(g.updated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: [`/og/${g.slug}`, ...g.products.map((k) => LANDING[k].shot.src)].map(abs),
    })),
    ...["/contact", "/privacy", "/terms", "/disclaimer"].map((path) => ({ url: abs(path), lastModified: now, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
