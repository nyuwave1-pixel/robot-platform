import type { MetadataRoute } from "next";
import { seo } from "@/data/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: seo.siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      images: [`${seo.siteUrl}${seo.ogImage}`, `${seo.siteUrl}${seo.ogImageSquare}`],
      alternates: { languages: { "ko-KR": seo.siteUrl } },
    },
  ];
}
