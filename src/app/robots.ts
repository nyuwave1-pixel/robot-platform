import { MetadataRoute } from "next";

const BASE_URL = "https://robot-platform-parkjong-s-projects.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/profile", "/settings"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
