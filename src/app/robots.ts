import { MetadataRoute } from "next";

const BASE_URL = "https://www.airobotphysical.com/robot-platform";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 경로는 basePath 포함 절대 경로여야 실제로 적용된다 (호스트 루트 기준으로 해석됨)
        disallow: ["/robot-platform/dashboard", "/robot-platform/profile"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
