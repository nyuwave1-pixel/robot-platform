import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/studio", "/hq", "/login", "/auth"] }], sitemap: `${SITE_URL}/partner/sitemap.xml` };
}
