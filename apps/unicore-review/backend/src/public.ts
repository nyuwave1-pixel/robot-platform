// 벌스데이 크림 구매 후기 이벤트 — 고객(공개) 측 서비스: 이벤트 설정, 사진 업로드, 접수, 접수 조회, 수정 요청 재제출
import { createHash } from "node:crypto";
import { q, q1, tx, fail, s, int, maskName, hmac, encrypt, decrypt, randomToken, sha256, rateLimit, ipHash, normPhone, PHONE_RE, allowedOrigins, testOrigins } from "./core.ts";
import type { Queryable } from "./platform.ts";
import { sanitizeImage, ImageError } from "./imagesafe.ts";
import { imageStore } from "./storage.ts";

export const EVENT_SLUG = "birthday-review";
export const SKIN_TYPES = ["건성", "지성", "복합성", "민감성", "중성", "잘 모르겠어요"] as const;
export const USAGE_PERIODS = ["1주 미만", "1~2주", "2~4주", "1~2개월", "2개월 이상"] as const;
export const REVIEW_STATUS_LABEL: Record<string, string> = { PENDING: "검토 대기", APPROVED: "승인", REJECTED: "반려", REVISION_REQUESTED: "수정 요청" };
export const REWARD_STATUS_LABEL: Record<string, string> = {
  ELIGIBLE: "지급 대상", PREPARING: "지급 준비", SHIP_READY: "배송 준비", SHIPPING: "배송 중", DELIVERED: "지급 완료", ON_HOLD: "지급 보류", CANCELED: "지급 취소",
};
export const REWARD_TYPE_LABEL: Record<string, string> = { PARTICIPATION: "참가 보상", WINNER: "우수 후기 추가 보상" };

// ---- 이벤트·설정 ----
export type EventSettings = {
  minChars: number; maxChars: number; titleMaxChars: number; requireImages: boolean; requireOrderNumber: boolean; requireAddress: boolean;
  maxImageBytes: number; maxImagePixels: number; winnerCount: number; retentionDays: number; consentVersion: string;
};
export const DEFAULT_SETTINGS: EventSettings = {
  minChars: 30, maxChars: 2000, titleMaxChars: 60, requireImages: true, requireOrderNumber: true, requireAddress: true,
  maxImageBytes: 4 * 1024 * 1024, maxImagePixels: 6000, winnerCount: 3, retentionDays: 180, consentVersion: "2026-11-13",
};
export type RewardPolicy = { participation: { productName: string; quantity: number }; winner: { productName: string; quantity: number }; winnersAlsoGetParticipation: boolean };
export const DEFAULT_POLICY: RewardPolicy = {
  participation: { productName: "프로틴 쉐이크 1박스", quantity: 1 },
  winner: { productName: "UNI&CORE 1ST BIRTHDAY CREAM 50g", quantity: 1 },
  winnersAlsoGetParticipation: true,
};
export type PromoEvent = { id: number; slug: string; event_name: string; event_type: string; start_date: string | null; end_date: string | null; event_status: string; settings: any; reward_policy: any; created_at: string; updated_at: string };

export function settingsOf(ev: PromoEvent): EventSettings { return { ...DEFAULT_SETTINGS, ...(ev.settings || {}) }; }
export function policyOf(ev: PromoEvent): RewardPolicy {
  const p = ev.reward_policy || {};
  return {
    participation: { ...DEFAULT_POLICY.participation, ...(p.participation || {}) },
    winner: { ...DEFAULT_POLICY.winner, ...(p.winner || {}) },
    winnersAlsoGetParticipation: p.winnersAlsoGetParticipation !== false,
  };
}
export async function eventBySlug(slug = EVENT_SLUG, c?: Queryable): Promise<PromoEvent> {
  const ev = await q1<PromoEvent>(`SELECT * FROM promotion_events WHERE slug = $1`, [slug], c);
  if (!ev) fail(404, "NO_EVENT", "이벤트를 찾을 수 없습니다.");
  return { ...ev!, id: Number(ev!.id) };
}
/** 고객에게 보이는 진행 상태: OPEN(접수 중) · UPCOMING(시작 전) · ENDED(기간 종료) · CLOSED(마감·준비 중) */
export function phaseOf(ev: PromoEvent, now = Date.now()): "OPEN" | "UPCOMING" | "ENDED" | "CLOSED" {
  if (ev.event_status !== "OPEN") return "CLOSED";
  if (ev.start_date && now < new Date(ev.start_date).getTime()) return "UPCOMING";
  if (ev.end_date && now > new Date(ev.end_date).getTime()) return "ENDED";
  return "OPEN";
}

// ---- 동의 문서 (서버가 원문·버전을 관리하고 동의 시점의 버전을 기록한다) ----
export const CONSENT_TYPES = ["PRIVACY_COLLECT", "EVENT_PROCESSING", "GIFT_SHIPPING", "MARKETING_USE"] as const;
export function consentDocs(st: EventSettings) {
  const keep = `이벤트 종료 후 ${st.retentionDays}일까지 보관 후 지체 없이 파기`;
  const refuse = "동의를 거부할 수 있으며, 거부하시면 이벤트에 참여하실 수 없습니다.";
  return [
    { type: "PRIVACY_COLLECT", required: true, title: "이벤트 참여를 위한 개인정보 수집 및 이용 동의",
      purpose: "구매 후기 이벤트 참여 접수, 본인 확인, 중복 참여 확인",
      items: "이름, 휴대폰 번호, 유니앤코어 회원번호, 후기 내용, 사용 전·후 사진",
      retention: keep, refusal: refuse },
    { type: "EVENT_PROCESSING", required: true, title: "이벤트 운영 및 당첨자 확인을 위한 개인정보 처리 동의",
      purpose: "후기 검토, 우수 후기 선정, 당첨자 확인 및 개별 연락",
      items: "이름, 휴대폰 번호, 후기 내용, 사용 전·후 사진, 접수 번호",
      retention: keep, refusal: refuse },
    { type: "GIFT_SHIPPING", required: true, title: "사은품 배송을 위한 개인정보 이용 동의",
      purpose: "참가 보상(프로틴 쉐이크) 및 우수 후기 보상(퍼스트 벌스데이 크림) 배송, 배송 안내 연락",
      items: "수령인 이름, 휴대폰 번호, 배송지 주소(우편번호 포함)",
      retention: `${keep} (배송을 맡긴 택배사에는 배송에 필요한 범위에서만 제공)`, refusal: refuse },
    { type: "MARKETING_USE", required: false, title: "후기 및 사진의 마케팅 활용 동의 (선택)",
      purpose: "유니앤코어 공식몰·SNS·광고 등 홍보 콘텐츠에 후기 내용과 사용 전·후 사진을 게시",
      items: "후기 제목·내용, 별점, 사용 전·후 사진 (이름은 일부만 표시)",
      retention: "동의 철회 시 또는 동의일로부터 2년까지",
      refusal: "선택 항목입니다. 동의하지 않아도 이벤트 참여와 사은품 지급에 아무런 불이익이 없습니다. 동의하지 않으면 사진과 후기는 이벤트 심사 목적으로만 관리자에게 보이며 외부에 공개되지 않습니다." },
  ] as const;
}

export function publicConfig(ev: PromoEvent) {
  const st = settingsOf(ev), pol = policyOf(ev);
  return {
    eventName: ev.event_name, phase: phaseOf(ev), startDate: ev.start_date, endDate: ev.end_date,
    minChars: st.minChars, maxChars: st.maxChars, titleMaxChars: st.titleMaxChars,
    requireImages: st.requireImages, requireOrderNumber: st.requireOrderNumber, requireAddress: st.requireAddress,
    maxImageBytes: st.maxImageBytes, maxImagePixels: st.maxImagePixels, winnerCount: st.winnerCount,
    rewards: { participation: pol.participation, winner: pol.winner, winnersAlsoGetParticipation: pol.winnersAlsoGetParticipation },
    skinTypes: SKIN_TYPES, usagePeriods: USAGE_PERIODS,
    consentVersion: st.consentVersion, consents: consentDocs(st),
  };
}

// ---- 공통 ----
export const phoneHash = (digits: string) => hmac("promo-phone", digits);
/** 회원번호: 공백·하이픈을 빼고 영문 대문자·숫자만 남긴다 (표기가 달라도 같은 번호로 본다) */
export const normMember = (v: unknown) => String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 30);
export const normOrder = (v: string) => v.toUpperCase().replace(/[^A-Z0-9가-힣]/g, "");
export const charCount = (v: string) => [...v].length;
const cleanText = (v: unknown, max: number) => String(v ?? "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max * 4);
const kstYmd = (d = new Date()) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(2, 10).replace(/-/g, "");

function requireOpen(ev: PromoEvent) {
  const p = phaseOf(ev);
  if (p === "UPCOMING") fail(409, "EVENT_NOT_STARTED", "아직 이벤트 시작 전입니다.");
  if (p === "ENDED") fail(409, "EVENT_ENDED", "이벤트 참여 기간이 종료되었습니다.");
  if (p === "CLOSED") fail(409, "EVENT_CLOSED", "지금은 이벤트 참여를 받고 있지 않습니다.");
}

// ---- 사진 업로드 (접수 전 임시 보관 → 접수 시 묶음) ----
export async function saveUpload(req: Request, type: string, bytes: Uint8Array, filename: string) {
  const ev = await eventBySlug();
  requireOpen(ev);
  if (type !== "BEFORE" && type !== "AFTER") fail(400, "VALIDATION", "사진 구분(사용 전/사용 후)이 올바르지 않습니다.");
  await rateLimit("br-up:" + ipHash(req), 40, 3600);
  const st = settingsOf(ev);
  let img;
  try { img = sanitizeImage(bytes, { maxBytes: st.maxImageBytes, maxPixels: st.maxImagePixels }); }
  catch (e) { if (e instanceof ImageError) return fail(e.code === "TOO_LARGE" ? 413 : 400, "IMAGE_" + e.code, e.message); throw e; }
  const token = randomToken(24);
  const key = `ev${ev.id}/${kstYmd()}/${randomToken(18)}.${img.ext}`;
  await imageStore.put(key, img.bytes, { mime: img.mime, type });
  const row = await q1<{ id: string }>(
    `INSERT INTO birthday_review_images (event_id, image_type, storage_path, original_filename, file_size, mime_type, width, height, sha256, upload_token_hash, ip_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [ev.id, type, key, s(filename, 120).replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_") || null, img.bytes.length, img.mime, img.width, img.height,
     createHash("sha256").update(img.bytes).digest("hex"), sha256(token), ipHash(req)]);
  if (Math.random() < 0.1) await purgeStaleUploads().catch(() => {});
  return { uploadId: Number(row!.id), token, type, mime: img.mime, size: img.bytes.length, width: img.width, height: img.height, metadataRemoved: img.stripped > 0 };
}
export async function deleteUpload(id: number, token: string) {
  const row = await q1<any>(`DELETE FROM birthday_review_images WHERE id = $1 AND review_id IS NULL AND upload_token_hash = $2 RETURNING storage_path`, [id, sha256(String(token || ""))]);
  if (row) await imageStore.del(row.storage_path).catch(() => {});
  return { deleted: !!row };
}
/** 접수에 묶이지 않고 24시간 지난 임시 업로드 정리 */
export async function purgeStaleUploads(limit = 50) {
  const rows = await q<any>(`DELETE FROM birthday_review_images WHERE id IN (
      SELECT id FROM birthday_review_images WHERE review_id IS NULL AND created_at < now() - interval '24 hours' ORDER BY id LIMIT ${limit}) RETURNING storage_path`);
  for (const r of rows) await imageStore.del(r.storage_path).catch(() => {});
  return rows.length;
}

// ---- 입력값 검증 ----
type ReviewInput = {
  name: string; phone: string; memberClaimed: boolean; memberLoginId: string; orderNumber: string; title: string; content: string;
  rating: number; ratingExperience: number | null; skinType: string; usagePeriod: string; recommendReason: string;
  postalCode: string; address1: string; address2: string;
};
function validateReviewText(b: any, st: EventSettings, fields: Record<string, string>) {
  const title = cleanText(b.title, st.titleMaxChars), content = cleanText(b.content, st.maxChars);
  if (charCount(title) < 2) fields.title = "후기 제목을 2자 이상 입력해 주세요.";
  else if (charCount(title) > st.titleMaxChars) fields.title = `후기 제목은 ${st.titleMaxChars}자까지 입력할 수 있습니다.`;
  const n = charCount(content);
  if (n < st.minChars) fields.content = `후기 내용을 ${st.minChars}자 이상 작성해 주세요. (현재 ${n}자)`;
  else if (n > st.maxChars) fields.content = `후기 내용은 ${st.maxChars}자까지 작성할 수 있습니다. (현재 ${n}자)`;
  const rating = int(b.rating, 0);
  if (rating < 1 || rating > 5) fields.rating = "제품 만족도 별점을 선택해 주세요.";
  const re = b.ratingExperience == null || b.ratingExperience === "" ? null : int(b.ratingExperience, 0);
  if (re !== null && (re < 1 || re > 5)) fields.ratingExperience = "사용 경험 별점이 올바르지 않습니다.";
  return { title, content, rating, ratingExperience: re };
}
function validateInput(b: any, st: EventSettings): ReviewInput {
  const fields: Record<string, string> = {};
  const name = cleanText(b.name, 40).replace(/\s+/g, " ");
  if (charCount(name) < 2 || charCount(name) > 40) fields.name = "이름을 2자 이상 입력해 주세요.";
  const phone = normPhone(b.phone);
  if (!PHONE_RE.test(phone)) fields.phone = "휴대폰 번호를 정확히 입력해 주세요. (예: 010-1234-5678)";
  // 유니앤코어 회원만 참여 — 회원번호 필수. (공식몰 회원 DB 와 자동 대조는 하지 않으며, 관리자가 회원번호로 확인한다)
  const memberClaimed = true;
  const memberLoginId = normMember(b.memberNumber ?? b.memberLoginId);
  if (memberLoginId.length < 4) fields.memberNumber = "유니앤코어 회원번호를 정확히 입력해 주세요.";
  const orderNumber = "";
  const t = validateReviewText(b, st, fields);
  const skinType = (SKIN_TYPES as readonly string[]).includes(String(b.skinType)) ? String(b.skinType) : "";
  const usagePeriod = (USAGE_PERIODS as readonly string[]).includes(String(b.usagePeriod)) ? String(b.usagePeriod) : "";
  const recommendReason = cleanText(b.recommendReason, 300).slice(0, 300);
  const postalCode = String(b.postalCode ?? "").replace(/\D/g, "").slice(0, 5);
  const address1 = cleanText(b.address1, 120).slice(0, 120), address2 = cleanText(b.address2, 80).slice(0, 80);
  if (st.requireAddress) {
    if (postalCode.length !== 5) fields.postalCode = "우편번호 5자리를 입력해 주세요.";
    if (charCount(address1) < 5) fields.address1 = "사은품을 받으실 주소를 입력해 주세요.";
  } else if (postalCode && postalCode.length !== 5) fields.postalCode = "우편번호 5자리를 입력해 주세요.";
  if (Object.keys(fields).length) fail(400, "VALIDATION", Object.values(fields)[0], fields);
  return { name, phone, memberClaimed, memberLoginId, orderNumber, ...t, skinType, usagePeriod, recommendReason, postalCode, address1, address2 };
}
type ImageRef = { id: number; token: string };
function imageRefs(b: any): { BEFORE?: ImageRef; AFTER?: ImageRef } {
  const out: any = {};
  for (const [k, t] of [["before", "BEFORE"], ["after", "AFTER"]] as const) {
    const v = b?.images?.[k];
    if (v && Number.isInteger(Number(v.uploadId)) && typeof v.token === "string" && v.token.length >= 20) out[t] = { id: Number(v.uploadId), token: v.token };
  }
  return out;
}
async function bindImages(c: Queryable, eventId: number, reviewId: number, refs: { BEFORE?: ImageRef; AFTER?: ImageRef }) {
  const hashes: string[] = [];
  for (const type of ["BEFORE", "AFTER"] as const) {
    const ref = refs[type];
    if (!ref) continue;
    const row = await q1<any>(
      `UPDATE birthday_review_images SET review_id = $1, upload_token_hash = NULL
       WHERE id = $2 AND event_id = $3 AND image_type = $4 AND review_id IS NULL AND upload_token_hash = $5 RETURNING sha256`,
      [reviewId, ref.id, eventId, type, sha256(ref.token)], c);
    if (!row) fail(409, "IMAGE_EXPIRED", `${type === "BEFORE" ? "사용 전" : "사용 후"} 사진을 다시 올려 주세요. (업로드 정보가 만료되었습니다)`, { [type === "BEFORE" ? "imageBefore" : "imageAfter"]: "expired" });
    if (row.sha256) hashes.push(row.sha256);
  }
  return hashes;
}

// ---- 접수 ----
export async function submitReview(req: Request, b: any, isTest: boolean) {
  if (s(b.website, 10)) fail(400, "VALIDATION", "요청을 처리할 수 없습니다."); // 자동 등록 방지용 숨김 칸
  const ev = await eventBySlug();
  requireOpen(ev);
  await rateLimit("br-sub:" + ipHash(req), 30, 3600);
  const st = settingsOf(ev), pol = policyOf(ev);
  const cs = b.consents || {};
  if (s(b.consentVersion, 40) !== st.consentVersion) fail(409, "CONSENT_VERSION", "동의 내용이 변경되었습니다. 페이지를 새로고침한 뒤 다시 확인해 주세요.");
  const missing = (["PRIVACY_COLLECT", "EVENT_PROCESSING", "GIFT_SHIPPING"] as const).filter((k) => cs[k] !== true);
  if (missing.length) fail(400, "CONSENT_REQUIRED", "필수 동의 항목에 모두 동의해 주세요.", Object.fromEntries(missing.map((k) => ["consent_" + k, "required"])));
  const v = validateInput(b, st);
  const refs = imageRefs(b);
  if (st.requireImages && (!refs.BEFORE || !refs.AFTER)) {
    fail(400, "IMAGES_REQUIRED", "사용 전·사용 후 사진을 각각 1장씩 올려 주세요.", { ...(refs.BEFORE ? {} : { imageBefore: "required" }), ...(refs.AFTER ? {} : { imageAfter: "required" }) });
  }
  const ph = phoneHash(v.phone), orderNorm = normOrder(v.orderNumber);
  const dist = s(b.distributorCode, 40).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  const ip = ipHash(req);
  const marketing = cs.MARKETING_USE === true;

  return tx(async (c) => {
    // 같은 번호의 동시 접수를 한 줄로 세운다 (유일 인덱스가 최종 방어선)
    await q(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`br:${ev.id}:${ph}`], c);
    const prev = await q1<{ n: string; mx: number | null }>(`SELECT count(*) AS n, max(entry_no) AS mx FROM birthday_reviews WHERE event_id = $1 AND phone_hash = $2`, [ev.id, ph], c);
    let entryNo = 1, reentryId: number | null = null;
    if (Number(prev?.n || 0) > 0) {
      const allow = await q1<{ id: string }>(`SELECT id FROM birthday_review_reentries WHERE event_id = $1 AND phone_hash = $2 AND used_at IS NULL ORDER BY id LIMIT 1 FOR UPDATE`, [ev.id, ph], c);
      if (!allow) fail(409, "DUPLICATE", "이 휴대폰 번호로 이미 접수된 후기가 있습니다. 접수 내용은 '내 접수 확인'에서 확인하실 수 있습니다.");
      reentryId = Number(allow!.id); entryNo = Number(prev!.mx || 1) + 1;
    }
    // 관리자 확인 대상(중복·부정 참여 의심) 판별 — 접수는 받되 표시해 둔다
    const reasons: string[] = [];
    if (reentryId) reasons.push("관리자 예외 승인으로 재참여");
    if (orderNorm.length >= 6) {
      const o = await q1<{ n: string }>(`SELECT count(*) AS n FROM birthday_reviews WHERE event_id = $1 AND order_number_norm = $2 AND purged_at IS NULL`, [ev.id, orderNorm], c);
      if (Number(o?.n || 0) > 0) reasons.push(`같은 주문번호로 접수된 후기 ${o!.n}건`);
    }
    if (v.memberLoginId) {
      const m = await q1<{ n: string }>(`SELECT count(*) AS n FROM birthday_reviews WHERE event_id = $1 AND lower(member_login_id) = lower($2) AND purged_at IS NULL`, [ev.id, v.memberLoginId], c);
      if (Number(m?.n || 0) > 0) reasons.push(`같은 회원번호로 접수된 후기 ${m!.n}건`);
    }
    if (ip) {
      const i = await q1<{ n: string }>(`SELECT count(*) AS n FROM birthday_reviews WHERE event_id = $1 AND ip_hash = $2 AND submitted_at > now() - interval '7 days'`, [ev.id, ip], c);
      if (Number(i?.n || 0) >= 3) reasons.push(`같은 접속 환경에서 7일 내 ${i!.n}건 접수`);
    }
    const seq = await q1<{ n: string }>(`SELECT nextval('birthday_review_no_seq') AS n`, [], c);
    const applicationNumber = `BD${kstYmd()}-${String(seq!.n).padStart(5, "0")}`;
    const address = [v.address1, v.address2].filter(Boolean).join("\n");
    const row = await q1<any>(
      `INSERT INTO birthday_reviews (event_id, application_number, entry_no, member_claimed, member_login_id, distributor_code, applicant_name, phone_enc, phone_hash, phone_last4,
         order_number, order_number_norm, postal_code, address_enc, review_title, review_content, rating, rating_experience, skin_type, usage_period, recommend_reason,
         privacy_consent, image_marketing_consent, is_test, ip_hash, user_agent, retention_until)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,true,$22,$23,$24,$25,
         ((COALESCE($26::timestamptz, now()) AT TIME ZONE 'Asia/Seoul')::date + $27::int))
       RETURNING id, submitted_at`,
      [ev.id, applicationNumber, entryNo, v.memberClaimed, v.memberLoginId || null, dist || null, v.name, encrypt(v.phone), ph, v.phone.slice(-4),
       v.orderNumber || null, orderNorm.length >= 6 ? orderNorm : null, v.postalCode || null, address ? encrypt(address) : null, v.title, v.content, v.rating, v.ratingExperience,
       v.skinType || null, v.usagePeriod || null, v.recommendReason || null, marketing, isTest, ip || null, String(req.headers.get("user-agent") || "").slice(0, 200),
       ev.end_date, st.retentionDays], c);
    const reviewId = Number(row.id);
    for (const d of consentDocs(st)) {
      await q(`INSERT INTO birthday_review_consents (review_id, consent_type, required, agreed, version) VALUES ($1,$2,$3,$4,$5)`,
        [reviewId, d.type, d.required, d.required ? true : marketing, st.consentVersion], c);
    }
    const hashes = await bindImages(c, ev.id, reviewId, refs);
    if (hashes.length) {
      const same = await q1<{ n: string }>(`SELECT count(*) AS n FROM birthday_review_images WHERE event_id = $1 AND review_id IS NOT NULL AND review_id <> $2 AND deleted_at IS NULL AND sha256 = ANY($3::text[])`, [ev.id, reviewId, hashes], c);
      if (Number(same?.n || 0) > 0) reasons.push("다른 접수와 동일한 사진 사용");
      if (hashes.length === 2 && hashes[0] === hashes[1]) reasons.push("사용 전·후 사진이 동일한 파일");
    }
    if (reasons.length) await q(`UPDATE birthday_reviews SET duplicate_flag = true, duplicate_reason = $2 WHERE id = $1`, [reviewId, reasons.join(" · ").slice(0, 400)], c);
    if (reentryId) await q(`UPDATE birthday_review_reentries SET used_at = now(), used_review_id = $2 WHERE id = $1`, [reentryId, reviewId], c);
    await q(`INSERT INTO promotion_admin_logs (event_id, actor_type, actor_label, action_type, target_type, target_id, new_value, ip_hash)
             VALUES ($1,'PARTICIPANT','참여자','review.submit','review',$2,$3,$4)`,
      [ev.id, String(reviewId), JSON.stringify({ applicationNumber, photos: Object.keys(refs).length, flagged: reasons.length > 0, isTest }), ip || null], c);
    return {
      applicationNumber, name: v.name, submittedAt: row.submitted_at,
      rewards: { participation: pol.participation, winner: pol.winner, winnerCount: st.winnerCount },
    };
  });
}

// ---- 접수 조회 (접수 번호 + 휴대폰 번호가 모두 맞을 때만) ----
/** 내 접수 찾기 — 휴대폰 번호로 조회(같은 번호의 가장 최근 접수). needMember=true 면 회원번호도 일치해야 한다 */
async function findOwn(b: any, c?: Queryable, lock = false, needMember = false) {
  const phone = normPhone(b.phone);
  if (!PHONE_RE.test(phone)) fail(400, "VALIDATION", "휴대폰 번호를 정확히 입력해 주세요.");
  const ev = await eventBySlug(EVENT_SLUG, c);
  const r = await q1<any>(`SELECT * FROM birthday_reviews WHERE event_id = $1 AND phone_hash = $2 AND purged_at IS NULL ORDER BY entry_no DESC LIMIT 1${lock ? " FOR UPDATE" : ""}`, [ev.id, phoneHash(phone)], c);
  if (!r) fail(404, "NOT_FOUND", "이 휴대폰 번호로 접수된 내역이 없습니다. 번호를 다시 확인해 주세요.");
  if (needMember && normMember(b.memberNumber) !== String(r.member_login_id || "")) fail(403, "MEMBER_MISMATCH", "회원번호가 접수 내용과 일치하지 않습니다.");
  return r;
}
export async function lookup(req: Request, b: any) {
  await rateLimit("br-look:" + ipHash(req), 12, 900);
  const r = await findOwn(b);
  const rewards = await q<any>(`SELECT reward_type, product_name, quantity, reward_status, carrier, tracking_number, shipped_at, delivered_at FROM birthday_review_rewards WHERE review_id = $1 ORDER BY reward_type`, [r.id]);
  const win = await q1<any>(`SELECT status FROM birthday_review_winners WHERE review_id = $1`, [r.id]);
  const imgs = await q<any>(`SELECT image_type FROM birthday_review_images WHERE review_id = $1 AND deleted_at IS NULL`, [r.id]);
  const showReason = ["REJECTED", "REVISION_REQUESTED"].includes(r.review_status);
  return {
    applicationNumber: r.application_number, name: maskName(r.applicant_name || ""), submittedAt: r.submitted_at,
    reviewStatus: r.review_status, reviewStatusLabel: REVIEW_STATUS_LABEL[r.review_status],
    statusReason: showReason ? r.status_reason || "" : "",
    canRevise: r.review_status === "REVISION_REQUESTED",
    review: r.review_status === "REVISION_REQUESTED" ? { title: r.review_title, content: r.review_content, rating: r.rating, ratingExperience: r.rating_experience } : null,
    photos: { before: imgs.some((i) => i.image_type === "BEFORE"), after: imgs.some((i) => i.image_type === "AFTER") },
    isWinner: win?.status === "CONFIRMED",   // 최종 확정 전에는 알리지 않는다
    rewards: rewards.filter((x) => x.reward_status !== "CANCELED" && (x.reward_type !== "WINNER" || win?.status === "CONFIRMED")).map((x) => ({
      type: x.reward_type, typeLabel: REWARD_TYPE_LABEL[x.reward_type], productName: x.product_name, quantity: x.quantity,
      status: x.reward_status, statusLabel: REWARD_STATUS_LABEL[x.reward_status],
      carrier: ["SHIPPING", "DELIVERED"].includes(x.reward_status) ? x.carrier : null,
      trackingNumber: ["SHIPPING", "DELIVERED"].includes(x.reward_status) ? x.tracking_number : null,
    })),
  };
}

// ---- 수정 요청을 받은 후기 다시 제출 ----
export async function revise(req: Request, b: any) {
  await rateLimit("br-rev:" + ipHash(req), 10, 3600);
  const ev = await eventBySlug();
  const st = settingsOf(ev);
  const fields: Record<string, string> = {};
  const t = validateReviewText(b, st, fields);
  if (Object.keys(fields).length) fail(400, "VALIDATION", Object.values(fields)[0], fields);
  const refs = imageRefs(b);
  const replaced: string[] = [];
  const out = await tx(async (c) => {
    const r = await findOwn(b, c, true, true);
    if (Number(r.event_id) !== ev.id) fail(404, "NOT_FOUND", "일치하는 접수 내역이 없습니다.");
    if (r.review_status !== "REVISION_REQUESTED") fail(409, "NOT_REVISABLE", "수정 요청을 받은 후기만 다시 제출할 수 있습니다.");
    for (const type of ["BEFORE", "AFTER"] as const) {
      if (!refs[type]) continue;
      const old = await q<any>(`UPDATE birthday_review_images SET deleted_at = now() WHERE review_id = $1 AND image_type = $2 AND deleted_at IS NULL RETURNING storage_path`, [r.id, type], c);
      for (const o of old) replaced.push(o.storage_path);
    }
    await bindImages(c, ev.id, Number(r.id), refs);
    if (st.requireImages) {
      const n = await q1<{ n: string }>(`SELECT count(DISTINCT image_type) AS n FROM birthday_review_images WHERE review_id = $1 AND deleted_at IS NULL`, [r.id], c);
      if (Number(n?.n || 0) < 2) fail(400, "IMAGES_REQUIRED", "사용 전·사용 후 사진을 각각 1장씩 올려 주세요.");
    }
    await q(`UPDATE birthday_reviews SET review_title = $2, review_content = $3, rating = $4, rating_experience = $5, review_status = 'PENDING', status_reason = NULL, version = version + 1 WHERE id = $1`,
      [r.id, t.title, t.content, t.rating, t.ratingExperience], c);
    await q(`INSERT INTO promotion_admin_logs (event_id, actor_type, actor_label, action_type, target_type, target_id, previous_value, new_value, ip_hash)
             VALUES ($1,'PARTICIPANT','참여자','review.revise','review',$2,$3,$4,$5)`,
      [ev.id, String(r.id), JSON.stringify({ status: "REVISION_REQUESTED" }), JSON.stringify({ status: "PENDING", photosReplaced: Object.keys(refs) }), ipHash(req) || null], c);
    return { applicationNumber: r.application_number, reviewStatus: "PENDING", reviewStatusLabel: REVIEW_STATUS_LABEL.PENDING };
  });
  for (const p of replaced) await imageStore.del(p).catch(() => {});   // 저장이 확정된 뒤에 이전 사진 파일 삭제
  return out;
}

// ---- 출처(Origin) 구분: 운영 출처 / 테스트 출처(접수는 받되 is_test 로 분리) ----
export function originKind(origin: string | null): "PROD" | "TEST" | "DENY" {
  if (!origin) return "DENY";
  if (allowedOrigins().includes(origin)) return "PROD";
  return testOrigins().includes(origin) ? "TEST" : "DENY";
}
export { decrypt };
