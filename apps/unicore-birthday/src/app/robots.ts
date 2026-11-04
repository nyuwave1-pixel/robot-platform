import type { MetadataRoute } from "next";
import { seo } from "@/data/seo";

/** 구글(Googlebot)·네이버(Yeti)·빙 등 모든 크롤러 허용. JS/CSS 청크는 렌더링에 필요하므로 반드시 허용 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/_next/static/", "/_next/image"], disallow: ["/api/"] },
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "Yeti", allow: "/" },
      { userAgent: "Bingbot", allow: "/" },
      { userAgent: "Daum", allow: "/" },
    ],
    sitemap: `${seo.siteUrl}/sitemap.xml`,
    host: seo.siteUrl,
  };
}
