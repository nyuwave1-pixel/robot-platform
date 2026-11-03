import type { MetadataRoute } from "next";
import { seo } from "@/data/seo";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${seo.siteUrl}/sitemap.xml` };
}
