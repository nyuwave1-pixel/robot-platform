import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    // The brand's US store sitemap is listed too, so crawlers find both US sites from either one.
    sitemap: [abs("/sitemap.xml"), "https://us.unincore.com/sitemap.xml"],
    host: abs("/"),
  };
}
