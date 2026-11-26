import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mediderma.unincore.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/dev/"] },
      // 네이버(Yeti) 명시 — 서치어드바이저 robots.txt 검증에서 바로 확인 가능
      { userAgent: "Yeti", allow: "/", disallow: ["/admin", "/api/", "/dev/"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
