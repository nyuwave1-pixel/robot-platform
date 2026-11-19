/**
 * 공개 설정. 게시 가능 키(publishable key)는 브라우저에 노출되도록 설계된 키이며,
 * 실제 데이터 보호는 DB 의 행 단위 보안(RLS)·열 권한·트리거가 맡는다.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://qeabsjyglethzkwlkmaw.supabase.co";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_JfbgxhQtx1cnSIdEmXPDvA_3tg9pk0-";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://partner.unincore.com").replace(/\/$/, "");
export const PHOTO_BUCKET = "partner-photos";

export function photoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
export function pageUrl(slug: string): string {
  return `${SITE_URL}/@${slug}`;
}
