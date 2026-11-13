// 후기 사진 비공개 저장소 + 서명 URL. 사진은 권한 검사를 거친 관리자 API 가 발급하는 5분짜리 서명 URL 로만 열린다.
import { hmac } from "./core.ts";
import { platform } from "./platform.ts";

export const imageStore = {
  put: (key: string, data: Uint8Array, meta: Record<string, string>) => platform().storage.put(key, data, meta.mime || "application/octet-stream"),
  get: (key: string) => platform().storage.get(key),
  del: (key: string) => platform().storage.del(key),
};
export const SIGNED_URL_TTL_SEC = 300;
const sigOf = (imageId: number, exp: number, download: boolean) => hmac("promo-image-url", `${imageId}.${exp}.${download ? 1 : 0}`).slice(0, 43);
/** API 기준 상대 경로 — 화면에서 API 주소를 앞에 붙여 쓴다 */
export function signedImagePath(imageId: number, download = false, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + SIGNED_URL_TTL_SEC;
  return `/admin/promo/images/${imageId}/file?exp=${exp}${download ? "&dl=1" : ""}&sig=${sigOf(imageId, exp, download)}`;
}
export function verifyImageSignature(imageId: number, exp: number, download: boolean, sig: string, now = Date.now()): boolean {
  if (!Number.isInteger(exp) || exp < Math.floor(now / 1000) || exp > Math.floor(now / 1000) + SIGNED_URL_TTL_SEC + 5) return false;
  const want = sigOf(imageId, exp, download);
  if (typeof sig !== "string" || sig.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
