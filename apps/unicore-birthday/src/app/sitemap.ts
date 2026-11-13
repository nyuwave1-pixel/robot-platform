import type { MetadataRoute } from "next";
import { seo } from "@/data/seo";
import { hreflangMap, localeMeta, locales } from "@/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const languages = hreflangMap(seo.siteUrl);
  const pages = locales.map((l) => ({
    url: `${seo.siteUrl}${localeMeta[l].path === "/" ? "" : localeMeta[l].path}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: l === "ko" ? 1 : 0.8,
    images: [`${seo.siteUrl}${seo.ogImage}`, `${seo.siteUrl}${seo.ogImageSquare}`],
    alternates: { languages },
  }));
  // 구매 후기 이벤트 (한국어 전용)
  return [...pages, { url: `${seo.siteUrl}/review`, lastModified, changeFrequency: "weekly" as const, priority: 0.7 }];
}
