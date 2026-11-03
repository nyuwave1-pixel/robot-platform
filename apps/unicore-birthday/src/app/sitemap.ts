import type { MetadataRoute } from "next";
import { seo } from "@/data/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: seo.siteUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
