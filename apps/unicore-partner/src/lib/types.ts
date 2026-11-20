/** DB 스키마(public.site_*)와 1:1 로 맞춘 타입. 검증 규칙은 DB 제약과 lib/validate.ts 가 같은 기준을 쓴다. */
export const DESIGNS = ["luxury_black", "premium_white"] as const;
export type Design = (typeof DESIGNS)[number];

export const SECTIONS = ["hero", "about", "products", "sns", "contact", "qr"] as const;
export type Section = (typeof SECTIONS)[number];

export const SNS_KEYS = ["instagram", "youtube", "blog", "facebook", "tiktok", "kakao_channel", "website"] as const;
export type SnsKey = (typeof SNS_KEYS)[number];

export type Status = "pending" | "approved" | "suspended";

export interface Profile {
  id: string;
  owner_id?: string;
  slug: string;
  status: Status;
  display_name: string;
  title: string | null;
  business_name: string | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  photo_path: string | null;
  sns: Partial<Record<SnsKey, string>>;
  design: Design;
  sections: Section[];
  product_ids: string[];
  seo_description: string | null;
  created_at?: string;
  updated_at: string;
  approved_at: string | null;
}

/** 비로그인 방문자가 읽을 수 있는 열 (DB 열 권한과 같아야 한다) */
export const PUBLIC_PROFILE_COLUMNS =
  "id,slug,status,display_name,title,business_name,bio,phone,email,address,photo_path,sns,design,sections,product_ids,seo_description,updated_at,approved_at";

export interface HqProduct {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  image_url: string | null;
  shop_url: string | null;
  certifications: string | null;
  clinical_note: string | null;
  sort: number;
  published: boolean;
  updated_at: string;
}

export type EditableProfile = Pick<
  Profile,
  "slug" | "display_name" | "title" | "business_name" | "bio" | "phone" | "email" | "address" | "photo_path" | "sns" | "design" | "sections" | "product_ids" | "seo_description"
>;
