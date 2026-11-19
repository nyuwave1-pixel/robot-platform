import type { MetadataRoute } from "next";
import { pageUrl, SITE_URL } from "@/lib/env";
import { listApprovedSlugs } from "@/lib/supabase/public";

// 승인·비공개가 바로 반영되도록 요청 때마다 만든다
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await listApprovedSlugs().catch(() => []);
  return [{ url: SITE_URL, changeFrequency: "weekly", priority: 0.5 }, ...rows.map((r) => ({ url: pageUrl(r.slug), lastModified: r.updated_at, changeFrequency: "weekly" as const, priority: 0.8 }))];
}
