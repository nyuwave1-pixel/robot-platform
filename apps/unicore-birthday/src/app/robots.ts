import type { MetadataRoute } from "next";
import { seo } from "@/data/seo";

/** 구글(Googlebot)·네이버(Yeti)·빙 등 모든 크롤러 허용, 빌드 산출물만 제외 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/_next/static/chunks/", "/api/"] },
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "Yeti", allow: "/" },
      { userAgent: "Bingbot", allow: "/" },
      { userAgent: "Daum", allow: "/" },
    ],
    sitemap: `${seo.siteUrl}/sitemap.xml`,
    host: seo.siteUrl,
  };
}
