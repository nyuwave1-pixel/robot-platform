import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mediderma.unincore.com";

// 공개 페이지만 싣는다(관리자·API·개발용 페이지 제외).
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [["/", 1], ["/analyze", 0.9], ["/compare", 0.7], ["/history", 0.4], ["/privacy", 0.3]];
  return pages.map(([path, priority]) => ({ url: `${SITE_URL}${path}`, changeFrequency: "weekly", priority }));
}
