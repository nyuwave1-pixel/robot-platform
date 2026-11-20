import { SECTIONS, SNS_KEYS, DESIGNS, type EditableProfile } from "./types";

/** DB 제약(site_profiles CHECK)과 같은 기준. 화면에서 먼저 알려 주고, 최종 방어는 DB 가 한다. */
export const RESERVED = ["admin", "hq", "studio", "login", "logout", "api", "p", "www", "unicore", "unincore", "help", "about", "terms", "privacy"];
const SLUG = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
const HTTPS = /^https:\/\/[^\s<>"'`]{3,}$/;
const PHONE = /^[0-9+() -]*$/;
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export type FieldErrors = Partial<Record<string, string>>;

export function validateProfile(p: EditableProfile): FieldErrors {
  const e: FieldErrors = {};
  if (!SLUG.test(p.slug)) e.slug = "영문 소문자·숫자·하이픈 3~30자 (처음과 끝은 영문/숫자)";
  else if (RESERVED.includes(p.slug)) e.slug = "사용할 수 없는 주소입니다";
  if (!p.display_name.trim()) e.display_name = "이름을 입력하세요";
  else if (p.display_name.length > 60) e.display_name = "60자 이내";
  if ((p.title ?? "").length > 80) e.title = "80자 이내";
  if ((p.business_name ?? "").length > 100) e.business_name = "100자 이내";
  if ((p.bio ?? "").length > 1500) e.bio = "1500자 이내";
  if ((p.phone ?? "").length > 30 || !PHONE.test(p.phone ?? "")) e.phone = "숫자와 + ( ) - 만 입력 (30자 이내)";
  if (p.email && (p.email.length > 120 || !EMAIL.test(p.email))) e.email = "이메일 형식이 아닙니다";
  if ((p.address ?? "").length > 200) e.address = "200자 이내";
  if ((p.seo_description ?? "").length > 200) e.seo_description = "200자 이내";
  for (const [k, v] of Object.entries(p.sns)) {
    if (!SNS_KEYS.includes(k as never)) e[`sns.${k}`] = "지원하지 않는 항목";
    else if (v && (v.length > 300 || !HTTPS.test(v))) e[`sns.${k}`] = "https:// 로 시작하는 주소만 가능합니다";
  }
  if (!DESIGNS.includes(p.design)) e.design = "디자인을 선택하세요";
  if (p.sections.some((s) => !SECTIONS.includes(s)) || p.sections.length > 8) e.sections = "섹션 구성이 올바르지 않습니다";
  if (p.product_ids.length > 12) e.product_ids = "제품은 12개까지";
  return e;
}

/** 빈 SNS 값은 저장하지 않는다 */
export function cleanSns(sns: EditableProfile["sns"]): EditableProfile["sns"] {
  return Object.fromEntries(Object.entries(sns).filter(([, v]) => !!v && v.trim()).map(([k, v]) => [k, v!.trim()]));
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_MAX = 5 * 1024 * 1024;

/** 파일 앞부분(매직 넘버)까지 확인해 확장자만 바꾼 파일을 거른다 */
export async function checkImage(file: File): Promise<string | null> {
  if (!IMAGE_TYPES.includes(file.type)) return "JPG·PNG·WEBP 이미지만 올릴 수 있어요";
  if (file.size > IMAGE_MAX) return "5MB 이하 이미지만 올릴 수 있어요";
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const webp = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  if (!(jpg || png || webp)) return "이미지 파일이 손상되었거나 형식이 다릅니다";
  return null;
}
