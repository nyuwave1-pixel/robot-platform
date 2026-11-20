import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "../env";
import { PUBLIC_PROFILE_COLUMNS, type HqProduct, type Profile } from "../types";

/** 공개 페이지용: 로그인 정보 없이(비로그인 권한) 읽는다 → 승인된 페이지와 공개 열만 보인다. */
const anon = () => createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

export async function getPublicProfile(slug: string): Promise<Profile | null> {
  if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug)) return null;
  const { data, error } = await anon().from("site_profiles").select(PUBLIC_PROFILE_COLUMNS).eq("slug", slug).eq("status", "approved").maybeSingle();
  if (error) throw new Error(`profile load failed: ${error.message}`);
  return (data as unknown as Profile) ?? null;
}

export async function getProducts(ids?: string[]): Promise<HqProduct[]> {
  let q = anon().from("site_hq_products").select("*").eq("published", true).order("sort");
  if (ids) {
    if (ids.length === 0) return [];
    q = q.in("id", ids);
  }
  const { data, error } = await q;
  if (error) throw new Error(`products load failed: ${error.message}`);
  return (data ?? []) as HqProduct[];
}

export async function listApprovedSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const { data } = await anon().from("site_profiles").select("slug,updated_at").eq("status", "approved").limit(5000);
  return (data ?? []) as { slug: string; updated_at: string }[];
}
