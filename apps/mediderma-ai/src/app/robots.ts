import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mediderma.unincore.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/dev/", "/studio", "/hq", "/login", "/auth/"] }],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/partner/sitemap.xml`],
    host: SITE_URL,
  };
}
