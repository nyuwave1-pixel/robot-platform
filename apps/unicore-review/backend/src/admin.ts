// 프로모션 관리(벌스데이 크림 후기 이벤트) — 관리자 서비스
// 권한: 개인 관리자 계정(2단계 인증)의 역할 권한.
// 총판 관리자(DISTRIBUTOR)는 자기 총판 코드로 유입된 참여자만, 연락처는 가려진 채로 본다. 모든 검사는 서버에서 한다.
import { q, q1, tx, fail, s, int, decrypt, encrypt, ipHash, normPhone, PHONE_RE, maskName, fmtPhone, isDate } from "./core.ts";
import type { Queryable } from "./platform.ts";
import { can, requireAdmin, ROLE_LABEL, type AdminRole } from "./auth.ts";
import { imageStore, signedImagePath, verifyImageSignature } from "./storage.ts";
import {
  eventBySlug, settingsOf, policyOf, phaseOf, phoneHash, normOrder, charCount, purgeStaleUploads,
  REVIEW_STATUS_LABEL, REWARD_STATUS_LABEL, REWARD_TYPE_LABEL, SKIN_TYPES, USAGE_PERIODS, DEFAULT_SETTINGS, type PromoEvent,
} from "./public.ts";

// ===== 행위자·권한 =====
export type PromoActor = { type: "ADMIN"; id: number | null; role: AdminRole; label: string; distributorCode: string | null; ip: string };
const PROMO_PERMS = ["promo.read", "promo.pii", "promo.images", "promo.review", "promo.edit", "promo.winner", "promo.reward", "promo.export", "promo.settings", "promo.purge", "promo.logs"];
export const pcan = (a: PromoActor, perm: string) => can(a.role, perm);

export async function promoActor(req: Request, perm: string): Promise<PromoActor> {
  const a = await requireAdmin(req, perm);
  const dist = a.role === "DISTRIBUTOR" ? String(a.distributor_code || "").toUpperCase() : null;
  if (a.role === "DISTRIBUTOR" && !dist) fail(403, "FORBIDDEN", "총판 코드가 지정되지 않은 계정입니다. 본사 관리자에게 문의해 주세요.");
  return { type: "ADMIN", id: a.id, role: a.role, label: `${a.name} (${ROLE_LABEL[a.role]})`, distributorCode: dist, ip: ipHash(req) };
}
export function me(a: PromoActor) {
  return { type: a.type, role: a.role, roleLabel: ROLE_LABEL[a.role], label: a.label, distributorCode: a.distributorCode,
    perms: PROMO_PERMS.filter((p) => pcan(a, p)) };
}
async function log(c: Queryable | undefined, a: PromoActor, eventId: number | null, action: string, targetType: string | null, targetId: string | number | null,
  prev: unknown = null, next: unknown = null, reason: string | null = null) {
  await q(`INSERT INTO promotion_admin_logs (event_id, actor_type, admin_id, actor_label, action_type, target_type, target_id, previous_value, new_value, reason, ip_hash)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [eventId, a.type, a.id, a.label, action, targetType, targetId == null ? null : String(targetId),
     prev == null ? null : JSON.stringify(prev), next == null ? null : JSON.stringify(next), reason, a.ip || null], c);
}
const reasonOf = (v: unknown) => s(v, 400);
const tryDecrypt = (v: string | null) => { if (!v) return ""; try { return decrypt(v); } catch { return ""; } };
const maskedPhone = (last4: string | null) => (last4 ? `010-****-${last4}` : "—");

// ===== 이벤트 =====
function eventView(ev: PromoEvent) {
  return { id: ev.id, slug: ev.slug, eventName: ev.event_name, eventType: ev.event_type, startDate: ev.start_date, endDate: ev.end_date,
    eventStatus: ev.event_status, phase: phaseOf(ev), settings: settingsOf(ev), rewardPolicy: policyOf(ev), createdAt: ev.created_at, updatedAt: ev.updated_at };
}
export async function getEvent() { return eventView(await eventBySlug()); }
export async function listEvents() {
  const rows = await q<PromoEvent>(`SELECT * FROM promotion_events ORDER BY id`);
  return rows.map((r) => eventView({ ...r, id: Number(r.id) }));
}
export async function updateEvent(a: PromoActor, b: any) {
  return tx(async (c) => {
    const ev0 = await q1<PromoEvent>(`SELECT * FROM promotion_events WHERE slug = 'birthday-review' FOR UPDATE`, [], c);
    if (!ev0) fail(404, "NO_EVENT", "이벤트를 찾을 수 없습니다.");
    const ev = { ...ev0!, id: Number(ev0!.id) };
    const st = { ...settingsOf(ev) }, pol = policyOf(ev);
    const num = (v: unknown, lo: number, hi: number, name: string) => { const n = Number(v); if (!Number.isFinite(n) || n < lo || n > hi) fail(400, "VALIDATION", `${name} 값은 ${lo}~${hi} 사이여야 합니다.`); return Math.trunc(n); };
    const x = b.settings || {};
    if (x.minChars !== undefined) st.minChars = num(x.minChars, 0, 1000, "최소 글자 수");
    if (x.maxChars !== undefined) st.maxChars = num(x.maxChars, 50, 5000, "최대 글자 수");
    if (st.minChars >= st.maxChars) fail(400, "VALIDATION", "최소 글자 수는 최대 글자 수보다 작아야 합니다.");
    if (x.titleMaxChars !== undefined) st.titleMaxChars = num(x.titleMaxChars, 10, 120, "제목 최대 글자 수");
    for (const k of ["requireImages", "requireOrderNumber", "requireAddress"] as const) if (typeof x[k] === "boolean") st[k] = x[k];
    if (x.maxImageMb !== undefined) st.maxImageBytes = Math.round(Math.min(5, Math.max(0.5, Number(x.maxImageMb) || 4)) * 1024 * 1024);
    if (x.maxImagePixels !== undefined) st.maxImagePixels = num(x.maxImagePixels, 800, 12000, "이미지 최대 해상도");
    if (x.winnerCount !== undefined) {
      st.winnerCount = num(x.winnerCount, 1, 50, "우수 후기 선정 인원");
      const w = await q1<{ n: string }>(`SELECT count(*) AS n FROM birthday_review_winners WHERE event_id = $1`, [ev.id], c);
      if (Number(w?.n || 0) > st.winnerCount) fail(409, "WINNERS_EXCEED", `이미 ${w!.n}명이 선정되어 있습니다. 선정을 먼저 취소해 주세요.`);
    }
    if (x.retentionDays !== undefined) st.retentionDays = num(x.retentionDays, 30, 1825, "개인정보 보유 기간(일)");
    if (x.consentVersion !== undefined) { const v = s(x.consentVersion, 40); if (!v) fail(400, "VALIDATION", "동의 문서 버전을 입력해 주세요."); st.consentVersion = v; }
    const p = b.rewardPolicy || {};
    for (const k of ["participation", "winner"] as const) {
      if (!p[k]) continue;
      if (p[k].productName !== undefined) { const v = s(p[k].productName, 80); if (!v) fail(400, "VALIDATION", "상품명을 입력해 주세요."); pol[k].productName = v; }
      if (p[k].quantity !== undefined) pol[k].quantity = num(p[k].quantity, 1, 99, "수량");
    }
    if (typeof p.winnersAlsoGetParticipation === "boolean") pol.winnersAlsoGetParticipation = p.winnersAlsoGetParticipation;
    const name = b.eventName !== undefined ? s(b.eventName, 120) : ev.event_name;
    if (!name) fail(400, "VALIDATION", "이벤트 이름을 입력해 주세요.");
    const status = b.eventStatus !== undefined ? String(b.eventStatus) : ev.event_status;
    if (!["DRAFT", "OPEN", "CLOSED"].includes(status)) fail(400, "VALIDATION", "이벤트 상태가 올바르지 않습니다.");
    const dt = (v: unknown, cur: string | null) => { if (v === undefined) return cur; if (v === null || v === "") return null; const d = new Date(String(v)); if (isNaN(d.getTime())) fail(400, "VALIDATION", "날짜 형식이 올바르지 않습니다."); return d.toISOString(); };
    const start = dt(b.startDate, ev.start_date), end = dt(b.endDate, ev.end_date);
    if (start && end && new Date(start) >= new Date(end)) fail(400, "VALIDATION", "종료 일시는 시작 일시보다 뒤여야 합니다.");
    await q(`UPDATE promotion_events SET event_name = $2, event_status = $3, start_date = $4, end_date = $5, settings = $6, reward_policy = $7 WHERE id = $1`,
      [ev.id, name, status, start, end, JSON.stringify(st), JSON.stringify(pol)], c);
    // 보유 기한 다시 계산 (이벤트 종료일 또는 접수일 + 보유 기간)
    await q(`UPDATE birthday_reviews SET retention_until = ((COALESCE($2::timestamptz, submitted_at) AT TIME ZONE 'Asia/Seoul')::date + $3::int) WHERE event_id = $1 AND purged_at IS NULL`, [ev.id, end, st.retentionDays], c);
    await log(c, a, ev.id, "event.update", "event", ev.id,
      { eventName: ev.event_name, eventStatus: ev.event_status, startDate: ev.start_date, endDate: ev.end_date, settings: settingsOf(ev), rewardPolicy: policyOf(ev) },
      { eventName: name, eventStatus: status, startDate: start, endDate: end, settings: st, rewardPolicy: pol }, reasonOf(b.reason) || null);
    return eventView({ ...ev, event_name: name, event_status: status, start_date: start, end_date: end, settings: st, reward_policy: pol });
  });
}

// ===== 목록 조건 =====
type Where = { sql: string; params: unknown[] };
function reviewWhere(a: PromoActor, eventId: number, f: URLSearchParams): Where {
  const params: unknown[] = [eventId];
  const w: string[] = ["r.event_id = $1"];
  const add = (cond: string, v: unknown) => { params.push(v); w.push(cond.replace("?", "$" + params.length)); };
  if (a.distributorCode) add("r.distributor_code = ?", a.distributorCode);          // 총판 관리자: 자기 총판만
  else if (f.get("distributor")) add("r.distributor_code = ?", s(f.get("distributor"), 40).toUpperCase());
  if (f.get("test") === "only") w.push("r.is_test"); else if (f.get("test") !== "all") w.push("NOT r.is_test");
  if (f.get("purged") === "only") w.push("r.purged_at IS NOT NULL"); else if (f.get("purged") !== "all") w.push("r.purged_at IS NULL");
  const term = s(f.get("q"), 60);
  if (term) {
    const digits = term.replace(/\D/g, "");
    const ors: string[] = [];
    params.push("%" + term.replace(/[%_\\]/g, "\\$&") + "%"); const like = "$" + params.length;
    ors.push(`r.applicant_name ILIKE ${like}`, `r.application_number ILIKE ${like}`, `r.order_number ILIKE ${like}`, `r.review_title ILIKE ${like}`, `r.member_login_id ILIKE ${like}`);
    if (PHONE_RE.test(digits)) { params.push(phoneHash(digits)); ors.push(`r.phone_hash = $${params.length}`); }
    else if (digits.length === 4) { params.push(digits); ors.push(`r.phone_last4 = $${params.length}`); }
    w.push("(" + ors.join(" OR ") + ")");
  }
  if (isDate(f.get("from"))) add("(r.submitted_at AT TIME ZONE 'Asia/Seoul')::date >= ?::date", f.get("from"));
  if (isDate(f.get("to"))) add("(r.submitted_at AT TIME ZONE 'Asia/Seoul')::date <= ?::date", f.get("to"));
  if (f.get("member") === "Y") w.push("r.member_claimed"); else if (f.get("member") === "N") w.push("NOT r.member_claimed");
  if (f.get("status") && REVIEW_STATUS_LABEL[f.get("status")!]) add("r.review_status = ?", f.get("status"));
  if (f.get("winner") === "Y") w.push("w.id IS NOT NULL"); else if (f.get("winner") === "N") w.push("w.id IS NULL");
  if (f.get("candidate") === "Y") w.push("r.is_candidate");
  if (f.get("flag") === "Y") w.push("r.duplicate_flag AND r.duplicate_cleared_at IS NULL");
  const photos = f.get("photos");
  if (photos === "BOTH") w.push("COALESCE(im.n, 0) = 2"); else if (photos === "PARTIAL") w.push("COALESCE(im.n, 0) = 1"); else if (photos === "NONE") w.push("COALESCE(im.n, 0) = 0");
  const rs = f.get("rewardStatus"), rt = f.get("rewardType");
  if (rs && (REWARD_STATUS_LABEL[rs] || rs === "NONE")) {
    const col = rt === "WINNER" ? "rw.reward_status" : "rp.reward_status";
    if (rs === "NONE") w.push(`${col} IS NULL`); else add(`${col} = ?`, rs);
  }
  if (f.get("rating") && /^[1-5]$/.test(f.get("rating")!)) add("r.rating = ?", Number(f.get("rating")));
  return { sql: w.join(" AND "), params };
}
const REVIEW_FROM = `FROM birthday_reviews r
  LEFT JOIN birthday_review_winners w ON w.review_id = r.id
  LEFT JOIN birthday_review_rewards rp ON rp.review_id = r.id AND rp.reward_type = 'PARTICIPATION'
  LEFT JOIN birthday_review_rewards rw ON rw.review_id = r.id AND rw.reward_type = 'WINNER'
  LEFT JOIN LATERAL (SELECT count(DISTINCT image_type) AS n, bool_or(image_type = 'BEFORE') AS has_before, bool_or(image_type = 'AFTER') AS has_after
                     FROM birthday_review_images i WHERE i.review_id = r.id AND i.deleted_at IS NULL) im ON true`;
const REVIEW_COLS = `r.id, r.application_number, r.submitted_at, r.applicant_name, r.phone_enc, r.phone_last4, r.member_claimed, r.member_login_id, r.order_number,
  r.review_title, r.rating, r.rating_experience, r.review_status, r.is_candidate, r.duplicate_flag, r.duplicate_cleared_at, r.duplicate_reason, r.distributor_code,
  r.is_test, r.purged_at, r.image_marketing_consent, r.skin_type, r.usage_period, r.version,
  COALESCE(im.has_before, false) AS has_before, COALESCE(im.has_after, false) AS has_after,
  w.id AS winner_id, w.winner_rank, w.status AS winner_status,
  rp.id AS rp_id, rp.reward_status AS rp_status, rw.id AS rw_id, rw.reward_status AS rw_status`;
function listRow(a: PromoActor, r: any) {
  const pii = pcan(a, "promo.pii");
  return {
    id: Number(r.id), applicationNumber: r.application_number, submittedAt: r.submitted_at,
    name: r.purged_at ? "(파기됨)" : pii ? r.applicant_name : maskName(r.applicant_name || ""),
    phone: r.purged_at ? "—" : pii ? fmtPhone(tryDecrypt(r.phone_enc)) : maskedPhone(r.phone_last4),
    memberClaimed: r.member_claimed, memberLoginId: pii ? r.member_login_id : r.member_login_id ? "****" : null,
    orderNumber: r.order_number, title: r.review_title, rating: r.rating, ratingExperience: r.rating_experience,
    reviewStatus: r.review_status, reviewStatusLabel: REVIEW_STATUS_LABEL[r.review_status],
    isCandidate: r.is_candidate, flagged: r.duplicate_flag && !r.duplicate_cleared_at, flagReason: r.duplicate_reason,
    distributorCode: r.distributor_code, isTest: r.is_test, purged: !!r.purged_at, marketingConsent: r.image_marketing_consent,
    skinType: r.skin_type, usagePeriod: r.usage_period, version: r.version,
    hasBefore: r.has_before, hasAfter: r.has_after,
    winner: r.winner_id ? { id: Number(r.winner_id), rank: r.winner_rank, status: r.winner_status } : null,
    participationReward: r.rp_id ? { id: Number(r.rp_id), status: r.rp_status, statusLabel: REWARD_STATUS_LABEL[r.rp_status] } : null,
    winnerReward: r.rw_id ? { id: Number(r.rw_id), status: r.rw_status, statusLabel: REWARD_STATUS_LABEL[r.rw_status] } : null,
  };
}
export async function listReviews(a: PromoActor, f: URLSearchParams) {
  const ev = await eventBySlug();
  const wh = reviewWhere(a, ev.id, f);
  const limit = Math.min(200, Math.max(1, int(f.get("limit"), 50))), offset = Math.max(0, int(f.get("offset"), 0));
  const sort = f.get("sort") === "rating" ? "r.rating DESC, r.id DESC" : f.get("sort") === "oldest" ? "r.id ASC" : "r.id DESC";
  const total = await q1<{ n: string }>(`SELECT count(*) AS n ${REVIEW_FROM} WHERE ${wh.sql}`, wh.params);
  const rows = await q<any>(`SELECT ${REVIEW_COLS} ${REVIEW_FROM} WHERE ${wh.sql} ORDER BY ${sort} LIMIT ${limit} OFFSET ${offset}`, wh.params);
  const items: any[] = rows.map((r) => listRow(a, r));
  // 후기·사진 관리 화면: 사진 열람 권한이 있을 때만 서명 URL 을 함께 내려준다
  if (f.get("withImages") === "1" && pcan(a, "promo.images") && items.length) {
    const imgs = await q<any>(`SELECT id, review_id, image_type FROM birthday_review_images WHERE review_id = ANY($1::bigint[]) AND deleted_at IS NULL`, [items.map((x) => x.id)]);
    const content = await q<any>(`SELECT id, review_content FROM birthday_reviews WHERE id = ANY($1::bigint[])`, [items.map((x) => x.id)]);
    for (const it of items) {
      it.content = content.find((x) => Number(x.id) === it.id)?.review_content || "";
      it.images = imgs.filter((x) => Number(x.review_id) === it.id).map((x) => ({ id: Number(x.id), type: x.image_type, url: signedImagePath(Number(x.id)) }));
    }
    if (imgs.length) await log(undefined, a, ev.id, "image.list", "event", ev.id, null, { reviews: items.length, images: imgs.length });
  }
  return { total: Number(total?.n || 0), limit, offset, items };
}

// ===== 대시보드 =====
export async function dashboard(a: PromoActor) {
  const ev = await eventBySlug();
  const st = settingsOf(ev);
  const p: unknown[] = [ev.id]; let scope = "";
  if (a.distributorCode) { p.push(a.distributorCode); scope = " AND r.distributor_code = $2"; }
  const base = `FROM birthday_reviews r WHERE r.event_id = $1 AND NOT r.is_test AND r.purged_at IS NULL${scope}`;
  const k = await q1<any>(`SELECT count(*) AS total,
      count(*) FILTER (WHERE (r.submitted_at AT TIME ZONE 'Asia/Seoul')::date = (now() AT TIME ZONE 'Asia/Seoul')::date) AS today,
      count(*) FILTER (WHERE r.review_status = 'PENDING') AS pending,
      count(*) FILTER (WHERE r.review_status = 'APPROVED') AS approved,
      count(*) FILTER (WHERE r.review_status = 'REJECTED') AS rejected,
      count(*) FILTER (WHERE r.review_status = 'REVISION_REQUESTED') AS revision,
      count(*) FILTER (WHERE r.is_candidate) AS candidates,
      count(*) FILTER (WHERE r.duplicate_flag AND r.duplicate_cleared_at IS NULL) AS flagged,
      count(*) FILTER (WHERE (SELECT count(DISTINCT image_type) FROM birthday_review_images i WHERE i.review_id = r.id AND i.deleted_at IS NULL) = 2) AS photos_done,
      round(avg(r.rating)::numeric, 2) AS avg_rating ${base}`, p);
  const rw = await q<any>(`SELECT x.reward_type, x.reward_status, count(*) AS n FROM birthday_review_rewards x JOIN birthday_reviews r ON r.id = x.review_id
      WHERE r.event_id = $1 AND NOT r.is_test${scope} GROUP BY 1, 2`, p);
  const cnt = (type: string, list: string[]) => rw.filter((x) => x.reward_type === type && list.includes(x.reward_status)).reduce((n, x) => n + Number(x.n), 0);
  const WAIT = ["ELIGIBLE", "PREPARING", "SHIP_READY", "SHIPPING", "ON_HOLD"];
  const winners = await q1<{ n: string; confirmed: string }>(`SELECT count(*) AS n, count(*) FILTER (WHERE w.status = 'CONFIRMED') AS confirmed
      FROM birthday_review_winners w JOIN birthday_reviews r ON r.id = w.review_id WHERE w.event_id = $1${scope}`, p);
  const recent = await q<any>(`SELECT ${REVIEW_COLS} ${REVIEW_FROM} WHERE r.event_id = $1 AND NOT r.is_test AND r.purged_at IS NULL${scope} ORDER BY r.id DESC LIMIT 8`, p);
  return {
    event: eventView(ev), asOf: new Date().toISOString(),
    cards: {
      total: Number(k.total), today: Number(k.today), photosDone: Number(k.photos_done), pendingReview: Number(k.pending),
      winners: Number(winners?.n || 0), winnerTarget: st.winnerCount, winnersConfirmed: Number(winners?.confirmed || 0) > 0,
      shakeWaiting: cnt("PARTICIPATION", WAIT), shakeDelivered: cnt("PARTICIPATION", ["DELIVERED"]),
      creamWaiting: cnt("WINNER", WAIT), creamDelivered: cnt("WINNER", ["DELIVERED"]),
    },
    extra: { approved: Number(k.approved), rejected: Number(k.rejected), revision: Number(k.revision), candidates: Number(k.candidates), flagged: Number(k.flagged), avgRating: k.avg_rating == null ? null : Number(k.avg_rating) },
    recent: recent.map((r) => listRow(a, r)),
  };
}

// ===== 상세 =====
async function loadReview(a: PromoActor, id: number, c?: Queryable, lock = false) {
  const r = await q1<any>(`SELECT * FROM birthday_reviews WHERE id = $1${lock ? " FOR UPDATE" : ""}`, [id], c);
  if (!r || (a.distributorCode && String(r.distributor_code || "") !== a.distributorCode)) fail(404, "NOT_FOUND", "참여 내역을 찾을 수 없습니다.");
  return r;
}
function rewardView(a: PromoActor, x: any) {
  const pii = pcan(a, "promo.pii");
  const phone = tryDecrypt(x.recipient_phone_enc), addr = tryDecrypt(x.shipping_address_enc);
  return {
    id: Number(x.id), reviewId: Number(x.review_id), type: x.reward_type, typeLabel: REWARD_TYPE_LABEL[x.reward_type], productName: x.product_name, quantity: x.quantity,
    status: x.reward_status, statusLabel: REWARD_STATUS_LABEL[x.reward_status], nextStatuses: nextRewardStatuses(a, x.reward_status),
    recipientName: pii ? x.recipient_name : maskName(x.recipient_name || ""), recipientPhone: pii ? fmtPhone(phone) : phone ? maskedPhone(phone.slice(-4)) : "—",
    postalCode: pii ? x.postal_code : x.postal_code ? "*****" : null, address: pii ? addr : addr ? "(권한 없음)" : "",
    carrier: x.carrier, trackingNumber: x.tracking_number, shippedAt: x.shipped_at, deliveredAt: x.delivered_at, note: x.note, version: x.version, updatedAt: x.updated_at,
  };
}
export async function reviewDetail(a: PromoActor, id: number) {
  const r = await loadReview(a, id);
  const pii = pcan(a, "promo.pii"), canImg = pcan(a, "promo.images");
  const imgs = await q<any>(`SELECT id, image_type, original_filename, file_size, mime_type, width, height, created_at FROM birthday_review_images WHERE review_id = $1 AND deleted_at IS NULL ORDER BY image_type DESC`, [id]);
  const consents = await q<any>(`SELECT consent_type, required, agreed, version, agreed_at FROM birthday_review_consents WHERE review_id = $1 ORDER BY id`, [id]);
  const rewards = await q<any>(`SELECT * FROM birthday_review_rewards WHERE review_id = $1 ORDER BY reward_type`, [id]);
  const win = await q1<any>(`SELECT * FROM birthday_review_winners WHERE review_id = $1`, [id]);
  const logs = await q<any>(`SELECT id, actor_type, actor_label, action_type, previous_value, new_value, reason, created_at FROM promotion_admin_logs WHERE target_type = 'review' AND target_id = $1 ORDER BY id DESC LIMIT 100`, [String(id)]);
  const related = r.purged_at ? [] : await q<any>(
    `SELECT id, application_number, applicant_name, review_status, submitted_at,
       (phone_hash = $2) AS same_phone, (order_number_norm IS NOT NULL AND order_number_norm = $3) AS same_order
     FROM birthday_reviews WHERE event_id = $4 AND id <> $1 AND purged_at IS NULL AND (phone_hash = $2 OR (order_number_norm IS NOT NULL AND order_number_norm = $3)) ORDER BY id LIMIT 20`,
    [id, r.phone_hash, r.order_number_norm, r.event_id]);
  if (pii && !r.purged_at) await log(undefined, a, Number(r.event_id), "review.view_pii", "review", id);
  if (canImg && imgs.length) await log(undefined, a, Number(r.event_id), "image.view", "review", id, null, { images: imgs.map((i) => Number(i.id)) });
  const address = tryDecrypt(r.address_enc);
  return {
    id: Number(r.id), applicationNumber: r.application_number, entryNo: r.entry_no, submittedAt: r.submitted_at, updatedAt: r.updated_at, version: r.version,
    purged: !!r.purged_at, purgedAt: r.purged_at, retentionUntil: r.retention_until, isTest: r.is_test,
    customer: {
      name: r.purged_at ? "(파기됨)" : pii ? r.applicant_name : maskName(r.applicant_name || ""),
      phone: r.purged_at ? "—" : pii ? fmtPhone(tryDecrypt(r.phone_enc)) : maskedPhone(r.phone_last4),
      memberClaimed: r.member_claimed, memberLoginId: pii ? r.member_login_id : r.member_login_id ? "****" : null, memberVerified: r.member_id != null,
      orderNumber: r.order_number, postalCode: pii ? r.postal_code : r.postal_code ? "*****" : null, address: pii ? address : address ? "(권한 없음)" : "",
      distributorCode: r.distributor_code,
    },
    review: { title: r.review_title, content: r.review_content, rating: r.rating, ratingExperience: r.rating_experience, skinType: r.skin_type, usagePeriod: r.usage_period, recommendReason: r.recommend_reason },
    status: { reviewStatus: r.review_status, reviewStatusLabel: REVIEW_STATUS_LABEL[r.review_status], reason: r.status_reason, isCandidate: r.is_candidate,
      flagged: r.duplicate_flag && !r.duplicate_cleared_at, flagReason: r.duplicate_reason, flagClearedAt: r.duplicate_cleared_at },
    adminMemo: pcan(a, "promo.review") ? r.admin_memo || "" : null,
    consents: consents.map((x) => ({ type: x.consent_type, required: x.required, agreed: x.agreed, version: x.version, agreedAt: x.agreed_at })),
    images: imgs.map((i) => ({ id: Number(i.id), type: i.image_type, filename: i.original_filename, size: i.file_size, mime: i.mime_type, width: i.width, height: i.height,
      url: canImg ? signedImagePath(Number(i.id)) : null, downloadUrl: canImg ? signedImagePath(Number(i.id), true) : null })),
    imagesHidden: !canImg && imgs.length > 0,
    winner: win ? { id: Number(win.id), rank: win.winner_rank, status: win.status, note: win.selection_note, selectedBy: win.selected_label, selectedAt: win.selected_at, confirmedAt: win.confirmed_at } : null,
    rewards: rewards.map((x) => rewardView(a, x)),
    related: related.map((x) => ({ id: Number(x.id), applicationNumber: x.application_number, name: pii ? x.applicant_name : maskName(x.applicant_name || ""), reviewStatus: x.review_status,
      reviewStatusLabel: REVIEW_STATUS_LABEL[x.review_status], submittedAt: x.submitted_at, samePhone: x.same_phone, sameOrder: x.same_order })),
    logs: logs.map((l) => ({ id: Number(l.id), actorType: l.actor_type, actor: l.actor_label, action: l.action_type, previous: l.previous_value, next: l.new_value, reason: l.reason, at: l.created_at })),
  };
}

// ===== 사은품 생성·상태 규칙 =====
const REWARD_FLOW: Record<string, string[]> = {
  ELIGIBLE: ["PREPARING", "SHIP_READY", "ON_HOLD", "CANCELED"],
  PREPARING: ["SHIP_READY", "ELIGIBLE", "ON_HOLD", "CANCELED"],
  SHIP_READY: ["SHIPPING", "PREPARING", "ON_HOLD", "CANCELED"],
  SHIPPING: ["DELIVERED", "ON_HOLD"],
  DELIVERED: [],
  ON_HOLD: ["ELIGIBLE", "PREPARING", "SHIP_READY", "CANCELED"],
  CANCELED: [],
};
// 지급 완료·취소를 되돌리는 것은 본사 최고 관리자만 (사유 필수)
const REWARD_SUPER_FLOW: Record<string, string[]> = { DELIVERED: ["SHIPPING"], CANCELED: ["ELIGIBLE"] };
function nextRewardStatuses(a: PromoActor, cur: string): string[] {
  return [...(REWARD_FLOW[cur] || []), ...(pcan(a, "promo.winner") ? REWARD_SUPER_FLOW[cur] || [] : [])];
}
/** 후기 1건당 보상 종류별 1행. 이미 있으면 만들지 않는다(UNIQUE). 취소돼 있던 건은 다시 지급 대상으로 되돌린다 */
async function ensureReward(c: Queryable, a: PromoActor, ev: PromoEvent, r: any, type: "PARTICIPATION" | "WINNER") {
  const pol = policyOf(ev)[type === "PARTICIPATION" ? "participation" : "winner"];
  const ins = await q1<any>(
    `INSERT INTO birthday_review_rewards (event_id, review_id, reward_type, product_name, quantity, recipient_name, recipient_phone_enc, postal_code, shipping_address_enc)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (review_id, reward_type) DO NOTHING RETURNING id`,
    [ev.id, r.id, type, pol.productName, pol.quantity, r.applicant_name, r.phone_enc, r.postal_code, r.address_enc], c);
  if (ins) { await log(c, a, ev.id, "reward.create", "reward", ins.id, null, { reviewId: Number(r.id), type, productName: pol.productName, status: "ELIGIBLE" }); return; }
  const back = await q1<any>(`UPDATE birthday_review_rewards SET reward_status = 'ELIGIBLE', version = version + 1 WHERE review_id = $1 AND reward_type = $2 AND reward_status IN ('CANCELED','ON_HOLD') RETURNING id`, [r.id, type], c);
  if (back) await log(c, a, ev.id, "reward.reopen", "reward", back.id, null, { reviewId: Number(r.id), type, status: "ELIGIBLE" });
}
/** 승인이 풀리거나 선정이 취소될 때 보상을 멈춘다. 이미 발송된 보상이 있으면 막는다 */
async function stopReward(c: Queryable, a: PromoActor, ev: PromoEvent, reviewId: number, type: "PARTICIPATION" | "WINNER", to: "CANCELED" | "ON_HOLD", why: string) {
  const x = await q1<any>(`SELECT id, reward_status FROM birthday_review_rewards WHERE review_id = $1 AND reward_type = $2 FOR UPDATE`, [reviewId, type], c);
  if (!x || x.reward_status === "CANCELED" || x.reward_status === to) return;
  if (["SHIPPING", "DELIVERED"].includes(x.reward_status)) fail(409, "REWARD_SHIPPED", `${REWARD_TYPE_LABEL[type]}이(가) 이미 ${REWARD_STATUS_LABEL[x.reward_status]} 상태입니다. 사은품 지급 관리에서 먼저 처리해 주세요.`);
  await q(`UPDATE birthday_review_rewards SET reward_status = $2, version = version + 1 WHERE id = $1`, [x.id, to], c);
  await log(c, a, ev.id, "reward.status", "reward", x.id, { status: x.reward_status }, { status: to }, why);
}

// ===== 후기 검토 =====
export async function setReviewStatus(a: PromoActor, id: number, b: any) {
  const to = String(b.status || "");
  if (!REVIEW_STATUS_LABEL[to]) fail(400, "VALIDATION", "검토 상태가 올바르지 않습니다.");
  const reason = reasonOf(b.reason);
  if (["REJECTED", "REVISION_REQUESTED"].includes(to) && !reason) fail(400, "VALIDATION", to === "REJECTED" ? "반려 사유를 입력해 주세요." : "수정 요청 내용을 입력해 주세요.");
  const ev = await eventBySlug();
  return tx(async (c) => {
    const r = await loadReview(a, id, c, true);
    if (r.purged_at) fail(409, "PURGED", "개인정보가 파기된 접수입니다.");
    if (b.version != null && int(b.version) !== r.version) fail(409, "STALE", "다른 관리자가 먼저 변경했습니다. 새로고침 후 다시 시도해 주세요.");
    if (r.review_status === to) return { reviewStatus: to, version: r.version, unchanged: true };
    if (to !== "APPROVED") {
      if (await q1(`SELECT 1 FROM birthday_review_winners WHERE review_id = $1`, [id], c)) fail(409, "IS_WINNER", "우수 후기로 선정된 후기입니다. 선정을 먼저 취소해 주세요.");
      await stopReward(c, a, ev, id, "PARTICIPATION", to === "REJECTED" ? "CANCELED" : "ON_HOLD", `후기 ${REVIEW_STATUS_LABEL[to]} 처리`);
    }
    await q(`UPDATE birthday_reviews SET review_status = $2, status_reason = $3, version = version + 1 WHERE id = $1`, [id, to, to === "APPROVED" || to === "PENDING" ? null : reason], c);
    // 유효 참여(승인) → 참가 보상 지급 대상 자동 등록. 테스트 접수는 지급 대상에서 제외
    if (to === "APPROVED" && !r.is_test) await ensureReward(c, a, ev, r, "PARTICIPATION");
    await log(c, a, ev.id, "review.status", "review", id, { status: r.review_status }, { status: to }, reason || null);
    return { reviewStatus: to, reviewStatusLabel: REVIEW_STATUS_LABEL[to], version: r.version + 1 };
  });
}
export async function bulkReviewStatus(a: PromoActor, b: any) {
  const ids: number[] = Array.isArray(b.ids) ? [...new Set(b.ids.map(Number).filter((x: number) => Number.isInteger(x) && x > 0))].slice(0, 200) as number[] : [];
  if (!ids.length) fail(400, "VALIDATION", "대상을 선택해 주세요.");
  const out: any[] = [];
  for (const id of ids) {
    try { out.push({ id, ok: true, ...(await setReviewStatus(a, id, { status: b.status, reason: b.reason })) }); }
    catch (e: any) { out.push({ id, ok: false, error: e?.message || "처리하지 못했습니다." }); }
  }
  return { done: out.filter((x) => x.ok).length, failed: out.filter((x) => !x.ok).length, results: out };
}
export async function setCandidate(a: PromoActor, id: number, b: any) {
  const on = b.on === true;
  const r = await loadReview(a, id);
  if (r.purged_at) fail(409, "PURGED", "개인정보가 파기된 접수입니다.");
  if (on && r.review_status !== "APPROVED") fail(409, "NOT_APPROVED", "승인된 후기만 우수 후기 후보로 등록할 수 있습니다.");
  await q(`UPDATE birthday_reviews SET is_candidate = $2 WHERE id = $1`, [id, on]);
  await log(undefined, a, Number(r.event_id), on ? "candidate.add" : "candidate.remove", "review", id, { isCandidate: r.is_candidate }, { isCandidate: on }, reasonOf(b.reason) || null);
  return { isCandidate: on };
}
export async function setMemo(a: PromoActor, id: number, b: any) {
  const r = await loadReview(a, id);
  const memo = String(b.memo ?? "").trim().slice(0, 2000);
  await q(`UPDATE birthday_reviews SET admin_memo = $2 WHERE id = $1`, [id, memo || null]);
  await log(undefined, a, Number(r.event_id), "review.memo", "review", id, null, { length: memo.length });
  return { saved: true };
}
/** 중복·부정 참여 표시: 확인 완료(해제) 또는 수동 표시 */
export async function setFlag(a: PromoActor, id: number, b: any) {
  const r = await loadReview(a, id);
  const reason = reasonOf(b.reason);
  if (!reason) fail(400, "VALIDATION", "확인 내용을 입력해 주세요.");
  if (b.action === "CLEAR") {
    await q(`UPDATE birthday_reviews SET duplicate_cleared_at = now() WHERE id = $1`, [id]);
    await log(undefined, a, Number(r.event_id), "flag.clear", "review", id, { flagged: true, flagReason: r.duplicate_reason }, { flagged: false }, reason);
  } else if (b.action === "FLAG") {
    await q(`UPDATE birthday_reviews SET duplicate_flag = true, duplicate_cleared_at = NULL, duplicate_reason = $2 WHERE id = $1`, [id, reason]);
    await log(undefined, a, Number(r.event_id), "flag.set", "review", id, null, { flagged: true }, reason);
  } else fail(400, "VALIDATION", "처리 구분이 올바르지 않습니다.");
  return { saved: true };
}
/** 참여자 정보 수정 (본사 최고 관리자) */
export async function editReview(a: PromoActor, id: number, b: any) {
  const ev = await eventBySlug();
  const reason = reasonOf(b.reason);
  if (!reason) fail(400, "VALIDATION", "수정 사유를 입력해 주세요.");
  return tx(async (c) => {
    const r = await loadReview(a, id, c, true);
    if (r.purged_at) fail(409, "PURGED", "개인정보가 파기된 접수입니다.");
    const set: string[] = [], vals: unknown[] = [id], changed: string[] = [];
    const put = (col: string, v: unknown, label: string) => { vals.push(v); set.push(`${col} = $${vals.length}`); changed.push(label); };
    if (b.name !== undefined) { const v = s(b.name, 40); if (charCount(v) < 2) fail(400, "VALIDATION", "이름을 확인해 주세요."); put("applicant_name", v, "이름"); }
    if (b.phone !== undefined) {
      const v = normPhone(b.phone); if (!PHONE_RE.test(v)) fail(400, "VALIDATION", "휴대폰 번호를 확인해 주세요.");
      const h = phoneHash(v);
      if (h !== r.phone_hash && await q1(`SELECT 1 FROM birthday_reviews WHERE event_id = $1 AND phone_hash = $2 AND entry_no = $3 AND id <> $4`, [r.event_id, h, r.entry_no, id], c)) fail(409, "DUPLICATE", "같은 휴대폰 번호의 접수가 이미 있습니다.");
      put("phone_enc", encrypt(v), "휴대폰"); put("phone_hash", h, "휴대폰해시"); put("phone_last4", v.slice(-4), "휴대폰끝자리");
    }
    if (b.orderNumber !== undefined) { const v = s(b.orderNumber, 80); const n = normOrder(v); put("order_number", v || null, "주문번호"); put("order_number_norm", n.length >= 6 ? n : null, "주문번호정규화"); }
    if (typeof b.memberClaimed === "boolean") put("member_claimed", b.memberClaimed, "회원 여부");
    if (b.memberLoginId !== undefined) put("member_login_id", s(b.memberLoginId, 60) || null, "회원 아이디");
    if (b.distributorCode !== undefined) put("distributor_code", s(b.distributorCode, 40).toUpperCase().replace(/[^A-Z0-9_-]/g, "") || null, "총판 코드");
    if (b.postalCode !== undefined) { const v = String(b.postalCode || "").replace(/\D/g, "").slice(0, 5); if (v && v.length !== 5) fail(400, "VALIDATION", "우편번호 5자리를 확인해 주세요."); put("postal_code", v || null, "우편번호"); }
    if (b.address !== undefined) { const v = String(b.address || "").trim().slice(0, 220); put("address_enc", v ? encrypt(v) : null, "주소"); }
    if (typeof b.isTest === "boolean") put("is_test", b.isTest, "테스트 표시");
    if (!set.length) fail(400, "VALIDATION", "수정할 항목이 없습니다.");
    await q(`UPDATE birthday_reviews SET ${set.join(", ")}, version = version + 1 WHERE id = $1`, vals, c);
    // 아직 발송 전인 사은품의 수령 정보도 함께 맞춘다
    if (b.syncRewards !== false) {
      const nr = await q1<any>(`SELECT applicant_name, phone_enc, postal_code, address_enc FROM birthday_reviews WHERE id = $1`, [id], c);
      await q(`UPDATE birthday_review_rewards SET recipient_name = $2, recipient_phone_enc = $3, postal_code = $4, shipping_address_enc = $5
               WHERE review_id = $1 AND reward_status NOT IN ('SHIPPING','DELIVERED','CANCELED')`, [id, nr.applicant_name, nr.phone_enc, nr.postal_code, nr.address_enc], c);
    }
    const labels = [...new Set(changed.filter((x) => !/해시|끝자리|정규화/.test(x)))];
    await log(c, a, ev.id, "review.edit", "review", id, null, { fields: labels }, reason);
    return { saved: true, fields: labels };
  });
}

// ===== 재참여 예외 승인 =====
export async function grantReentry(a: PromoActor, b: any) {
  const ev = await eventBySlug();
  const phone = normPhone(b.phone), reason = reasonOf(b.reason);
  if (!PHONE_RE.test(phone)) fail(400, "VALIDATION", "휴대폰 번호를 확인해 주세요.");
  if (!reason) fail(400, "VALIDATION", "예외 승인 사유를 입력해 주세요.");
  const h = phoneHash(phone);
  if (!(await q1(`SELECT 1 FROM birthday_reviews WHERE event_id = $1 AND phone_hash = $2`, [ev.id, h]))) fail(409, "NO_PRIOR", "이 번호로 접수된 내역이 없습니다. 예외 승인 없이 참여할 수 있습니다.");
  if (await q1(`SELECT 1 FROM birthday_review_reentries WHERE event_id = $1 AND phone_hash = $2 AND used_at IS NULL`, [ev.id, h])) fail(409, "DUPLICATE", "이미 사용 전인 예외 승인이 있습니다.");
  const row = await q1<any>(`INSERT INTO birthday_review_reentries (event_id, phone_hash, phone_last4, reason, granted_by, granted_label) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [ev.id, h, phone.slice(-4), reason, a.id, a.label]);
  await log(undefined, a, ev.id, "reentry.grant", "reentry", row.id, null, { phoneLast4: phone.slice(-4) }, reason);
  return { id: Number(row.id) };
}
export async function listReentries() {
  const ev = await eventBySlug();
  const rows = await q<any>(`SELECT e.*, r.application_number FROM birthday_review_reentries e LEFT JOIN birthday_reviews r ON r.id = e.used_review_id WHERE e.event_id = $1 ORDER BY e.id DESC LIMIT 200`, [ev.id]);
  return rows.map((x) => ({ id: Number(x.id), phone: maskedPhone(x.phone_last4), reason: x.reason, grantedBy: x.granted_label, createdAt: x.created_at, usedAt: x.used_at, usedApplicationNumber: x.application_number }));
}
export async function revokeReentry(a: PromoActor, id: number) {
  const row = await q1<any>(`DELETE FROM birthday_review_reentries WHERE id = $1 AND used_at IS NULL RETURNING event_id, phone_last4`, [id]);
  if (!row) fail(409, "USED", "이미 사용되었거나 없는 예외 승인입니다.");
  await log(undefined, a, Number(row.event_id), "reentry.revoke", "reentry", id, { phoneLast4: row.phone_last4 }, null);
  return { revoked: true };
}

// ===== 우수 후기 선정 =====
export async function listWinners(a: PromoActor) {
  const ev = await eventBySlug();
  const st = settingsOf(ev);
  const p: unknown[] = [ev.id]; let scope = "";
  if (a.distributorCode) { p.push(a.distributorCode); scope = " AND r.distributor_code = $2"; }
  const winners = await q<any>(`SELECT ${REVIEW_COLS}, w.selection_note, w.selected_label, w.selected_at, w.confirmed_at, r.review_content ${REVIEW_FROM}
                                WHERE r.event_id = $1 AND w.id IS NOT NULL${scope} ORDER BY w.winner_rank`, p);
  const candidates = await q<any>(`SELECT ${REVIEW_COLS}, r.review_content ${REVIEW_FROM}
                                   WHERE r.event_id = $1 AND r.is_candidate AND w.id IS NULL AND r.purged_at IS NULL AND NOT r.is_test${scope} ORDER BY r.rating DESC, r.id`, p);
  const all = await q1<{ n: string; confirmed: string }>(`SELECT count(*) AS n, count(*) FILTER (WHERE status = 'CONFIRMED') AS confirmed FROM birthday_review_winners WHERE event_id = $1`, [ev.id]);
  const mapW = (r: any) => ({ ...listRow(a, r), content: r.review_content, note: r.selection_note, selectedBy: r.selected_label, selectedAt: r.selected_at, confirmedAt: r.confirmed_at });
  return { winnerCount: st.winnerCount, selected: Number(all?.n || 0), confirmed: Number(all?.confirmed || 0) > 0 && Number(all?.confirmed) === Number(all?.n),
    winners: winners.map(mapW), candidates: candidates.map((r) => ({ ...listRow(a, r), content: r.review_content })) };
}
async function lockEvent(c: Queryable) {
  const ev = await q1<PromoEvent>(`SELECT * FROM promotion_events WHERE slug = 'birthday-review' FOR UPDATE`, [], c);
  if (!ev) fail(404, "NO_EVENT", "이벤트를 찾을 수 없습니다.");
  return { ...ev!, id: Number(ev!.id) } as PromoEvent;
}
export async function selectWinner(a: PromoActor, b: any) {
  const reviewId = int(b.reviewId), note = reasonOf(b.note);
  if (!note) fail(400, "VALIDATION", "선정 사유를 입력해 주세요.");
  return tx(async (c) => {
    const ev = await lockEvent(c);                      // 이벤트 행 잠금 — 동시에 선정해도 인원을 넘기지 않는다
    const st = settingsOf(ev), pol = policyOf(ev);
    const r = await loadReview(a, reviewId, c, true);
    if (r.purged_at) fail(409, "PURGED", "개인정보가 파기된 접수입니다.");
    if (r.is_test) fail(409, "TEST", "테스트 접수는 선정할 수 없습니다.");
    if (r.review_status !== "APPROVED") fail(409, "NOT_APPROVED", "승인된 후기만 우수 후기로 선정할 수 있습니다.");
    if (r.duplicate_flag && !r.duplicate_cleared_at) fail(409, "FLAGGED", "중복·부정 참여 확인 대상입니다. 확인을 마친 뒤 선정해 주세요.");
    const cur = await q<any>(`SELECT review_id, winner_rank, status FROM birthday_review_winners WHERE event_id = $1 ORDER BY winner_rank`, [ev.id], c);
    if (cur.some((x) => x.status === "CONFIRMED")) fail(409, "CONFIRMED", "최종 확정된 상태입니다. 확정을 해제한 뒤 변경해 주세요.");
    if (cur.some((x) => Number(x.review_id) === reviewId)) fail(409, "DUPLICATE", "이미 우수 후기로 선정된 후기입니다.");
    if (cur.length >= st.winnerCount) fail(409, "FULL", `우수 후기는 ${st.winnerCount}명까지 선정할 수 있습니다.`);
    const used = new Set(cur.map((x) => Number(x.winner_rank)));
    let rank = int(b.rank, 0);
    if (rank) { if (rank < 1 || rank > st.winnerCount) fail(400, "VALIDATION", `순위는 1~${st.winnerCount} 사이여야 합니다.`); if (used.has(rank)) fail(409, "RANK_TAKEN", `${rank}위는 이미 선정되어 있습니다.`); }
    else { rank = 1; while (used.has(rank)) rank++; }
    const w = await q1<any>(`INSERT INTO birthday_review_winners (event_id, review_id, winner_rank, selection_note, selected_by, selected_label) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [ev.id, reviewId, rank, note, a.id, a.label], c);
    await q(`UPDATE birthday_reviews SET is_candidate = true WHERE id = $1`, [reviewId], c);
    await ensureReward(c, a, ev, r, "WINNER");                                  // 추가 보상: 벌스데이 크림
    if (pol.winnersAlsoGetParticipation) await ensureReward(c, a, ev, r, "PARTICIPATION"); // 기본 참가 보상도 유지
    else await stopReward(c, a, ev, reviewId, "PARTICIPATION", "CANCELED", "우수 후기 선정(중복 지급 안 함 정책)");
    await log(c, a, ev.id, "winner.select", "review", reviewId, null, { winnerId: Number(w.id), rank }, note);
    return { winnerId: Number(w.id), rank };
  });
}
export async function cancelWinner(a: PromoActor, winnerId: number, b: any) {
  const reason = reasonOf(b.reason);
  if (!reason) fail(400, "VALIDATION", "선정 취소 사유를 입력해 주세요.");
  return tx(async (c) => {
    const ev = await lockEvent(c);
    const w = await q1<any>(`SELECT * FROM birthday_review_winners WHERE id = $1 AND event_id = $2 FOR UPDATE`, [winnerId, ev.id], c);
    if (!w) fail(404, "NOT_FOUND", "선정 내역을 찾을 수 없습니다.");
    if (w.status === "CONFIRMED") fail(409, "CONFIRMED", "최종 확정된 상태입니다. 확정을 해제한 뒤 취소해 주세요.");
    await stopReward(c, a, ev, Number(w.review_id), "WINNER", "CANCELED", "우수 후기 선정 취소");
    // 중복 지급 안 함 정책으로 참가 보상이 취소돼 있었다면 되살린다
    if (!policyOf(ev).winnersAlsoGetParticipation) {
      const r = await q1<any>(`SELECT * FROM birthday_reviews WHERE id = $1`, [w.review_id], c);
      if (r && r.review_status === "APPROVED" && !r.is_test) await ensureReward(c, a, ev, r, "PARTICIPATION");
    }
    await q(`DELETE FROM birthday_review_winners WHERE id = $1`, [winnerId], c);
    await log(c, a, ev.id, "winner.cancel", "review", w.review_id, { winnerId, rank: w.winner_rank }, null, reason);
    return { canceled: true };
  });
}
export async function setWinnerRank(a: PromoActor, winnerId: number, b: any) {
  return tx(async (c) => {
    const ev = await lockEvent(c);
    const st = settingsOf(ev);
    const rank = int(b.rank, 0);
    if (rank < 1 || rank > st.winnerCount) fail(400, "VALIDATION", `순위는 1~${st.winnerCount} 사이여야 합니다.`);
    const w = await q1<any>(`SELECT * FROM birthday_review_winners WHERE id = $1 AND event_id = $2`, [winnerId, ev.id], c);
    if (!w) fail(404, "NOT_FOUND", "선정 내역을 찾을 수 없습니다.");
    if (w.status === "CONFIRMED") fail(409, "CONFIRMED", "최종 확정된 상태입니다.");
    if (w.winner_rank === rank) return { rank };
    const other = await q1<any>(`SELECT id FROM birthday_review_winners WHERE event_id = $1 AND winner_rank = $2`, [ev.id, rank], c);
    await q(`UPDATE birthday_review_winners SET winner_rank = 100000 + id WHERE id = $1`, [winnerId], c);   // 유일 조건을 피해 자리 바꾸기
    if (other) await q(`UPDATE birthday_review_winners SET winner_rank = $2 WHERE id = $1`, [other.id, w.winner_rank], c);
    await q(`UPDATE birthday_review_winners SET winner_rank = $2 WHERE id = $1`, [winnerId, rank], c);
    await log(c, a, ev.id, "winner.rank", "review", w.review_id, { rank: w.winner_rank }, { rank, swappedWith: other ? Number(other.id) : null });
    return { rank };
  });
}
export async function confirmWinners(a: PromoActor, b: any) {
  return tx(async (c) => {
    const ev = await lockEvent(c);
    const st = settingsOf(ev);
    const cur = await q<any>(`SELECT id, review_id, status FROM birthday_review_winners WHERE event_id = $1`, [ev.id], c);
    if (b.undo === true) {
      const reason = reasonOf(b.reason);
      if (!reason) fail(400, "VALIDATION", "확정 해제 사유를 입력해 주세요.");
      await q(`UPDATE birthday_review_winners SET status = 'SELECTED', confirmed_at = NULL WHERE event_id = $1`, [ev.id], c);
      await log(c, a, ev.id, "winner.unconfirm", "event", ev.id, { confirmed: true }, { confirmed: false }, reason);
      return { confirmed: false };
    }
    if (cur.length !== st.winnerCount) fail(409, "COUNT", `우수 후기 ${st.winnerCount}명을 모두 선정한 뒤 확정할 수 있습니다. (현재 ${cur.length}명)`);
    await q(`UPDATE birthday_review_winners SET status = 'CONFIRMED', confirmed_at = now() WHERE event_id = $1`, [ev.id], c);
    await log(c, a, ev.id, "winner.confirm", "event", ev.id, null, { confirmed: true, winners: cur.map((x) => Number(x.review_id)) }, reasonOf(b.reason) || null);
    return { confirmed: true, count: cur.length };
  });
}

// ===== 사은품 지급 =====
export async function listRewards(a: PromoActor, f: URLSearchParams) {
  const ev = await eventBySlug();
  const p: unknown[] = [ev.id]; const w = ["x.event_id = $1", "NOT r.is_test"];
  const add = (cond: string, v: unknown) => { p.push(v); w.push(cond.replace("?", "$" + p.length)); };
  if (a.distributorCode) add("r.distributor_code = ?", a.distributorCode);
  if (f.get("type") === "PARTICIPATION" || f.get("type") === "WINNER") add("x.reward_type = ?", f.get("type"));
  if (f.get("status") && REWARD_STATUS_LABEL[f.get("status")!]) add("x.reward_status = ?", f.get("status"));
  const term = s(f.get("q"), 60);
  if (term) { p.push("%" + term.replace(/[%_\\]/g, "\\$&") + "%"); const i = "$" + p.length; w.push(`(x.recipient_name ILIKE ${i} OR r.application_number ILIKE ${i} OR x.tracking_number ILIKE ${i})`); }
  const limit = Math.min(500, Math.max(1, int(f.get("limit"), 100))), offset = Math.max(0, int(f.get("offset"), 0));
  const from = `FROM birthday_review_rewards x JOIN birthday_reviews r ON r.id = x.review_id LEFT JOIN birthday_review_winners wn ON wn.review_id = r.id WHERE ${w.join(" AND ")}`;
  const total = await q1<{ n: string }>(`SELECT count(*) AS n ${from}`, p);
  const rows = await q<any>(`SELECT x.*, r.application_number, r.review_status, wn.winner_rank ${from} ORDER BY x.reward_type DESC, x.id DESC LIMIT ${limit} OFFSET ${offset}`, p);
  const sum = await q<any>(`SELECT x.reward_type, x.reward_status, count(*) AS n FROM birthday_review_rewards x JOIN birthday_reviews r ON r.id = x.review_id
                            WHERE x.event_id = $1 AND NOT r.is_test${a.distributorCode ? " AND r.distributor_code = $2" : ""} GROUP BY 1, 2`, a.distributorCode ? [ev.id, a.distributorCode] : [ev.id]);
  return { total: Number(total?.n || 0), limit, offset, policy: policyOf(ev),
    summary: sum.map((x) => ({ type: x.reward_type, status: x.reward_status, count: Number(x.n) })),
    items: rows.map((x) => ({ ...rewardView(a, x), applicationNumber: x.application_number, reviewStatus: x.review_status, winnerRank: x.winner_rank })) };
}
export async function updateReward(a: PromoActor, id: number, b: any) {
  return tx(async (c) => {
    const x = await q1<any>(`SELECT x.*, r.distributor_code FROM birthday_review_rewards x JOIN birthday_reviews r ON r.id = x.review_id WHERE x.id = $1 FOR UPDATE OF x`, [id], c);
    if (!x || (a.distributorCode && x.distributor_code !== a.distributorCode)) fail(404, "NOT_FOUND", "사은품 지급 내역을 찾을 수 없습니다.");
    if (b.version != null && int(b.version) !== x.version) fail(409, "STALE", "다른 관리자가 먼저 변경했습니다. 새로고침 후 다시 시도해 주세요.");
    if (["DELIVERED", "CANCELED"].includes(x.reward_status)) fail(409, "LOCKED", `${REWARD_STATUS_LABEL[x.reward_status]} 상태에서는 수정할 수 없습니다.`);
    const set: string[] = [], vals: unknown[] = [id], changed: string[] = [];
    const put = (col: string, v: unknown, label: string) => { vals.push(v); set.push(`${col} = $${vals.length}`); changed.push(label); };
    if (b.recipientName !== undefined) { const v = s(b.recipientName, 40); if (!v) fail(400, "VALIDATION", "수령인을 입력해 주세요."); put("recipient_name", v, "수령인"); }
    if (b.recipientPhone !== undefined) { const v = normPhone(b.recipientPhone); if (!PHONE_RE.test(v)) fail(400, "VALIDATION", "연락처를 확인해 주세요."); put("recipient_phone_enc", encrypt(v), "연락처"); }
    if (b.postalCode !== undefined) { const v = String(b.postalCode || "").replace(/\D/g, "").slice(0, 5); if (v.length !== 5) fail(400, "VALIDATION", "우편번호 5자리를 확인해 주세요."); put("postal_code", v, "우편번호"); }
    if (b.address !== undefined) { const v = String(b.address || "").trim().slice(0, 220); if (v.length < 5) fail(400, "VALIDATION", "배송 주소를 입력해 주세요."); put("shipping_address_enc", encrypt(v), "배송 주소"); }
    if (b.carrier !== undefined) put("carrier", s(b.carrier, 30) || null, "택배사");
    if (b.trackingNumber !== undefined) put("tracking_number", s(b.trackingNumber, 40).replace(/[^0-9A-Za-z-]/g, "") || null, "운송장 번호");
    if (b.note !== undefined) put("note", String(b.note || "").trim().slice(0, 500) || null, "메모");
    if (b.quantity !== undefined && pcan(a, "promo.winner")) { const n = int(b.quantity, 0); if (n < 1 || n > 99) fail(400, "VALIDATION", "수량을 확인해 주세요."); put("quantity", n, "수량"); }
    if (b.productName !== undefined && pcan(a, "promo.winner")) { const v = s(b.productName, 80); if (!v) fail(400, "VALIDATION", "상품명을 입력해 주세요."); put("product_name", v, "상품명"); }
    if (!set.length) fail(400, "VALIDATION", "수정할 항목이 없습니다.");
    const row = await q1<any>(`UPDATE birthday_review_rewards SET ${set.join(", ")}, version = version + 1 WHERE id = $1 RETURNING *`, vals, c);
    await log(c, a, Number(x.event_id), "reward.edit", "reward", id, null, { fields: changed, reviewId: Number(x.review_id) }, reasonOf(b.reason) || null);
    return rewardView(a, row);
  });
}
export async function setRewardStatus(a: PromoActor, id: number, b: any) {
  const to = String(b.status || "");
  if (!REWARD_STATUS_LABEL[to]) fail(400, "VALIDATION", "지급 상태가 올바르지 않습니다.");
  const reason = reasonOf(b.reason);
  return tx(async (c) => {
    const x = await q1<any>(`SELECT x.*, r.distributor_code, r.review_status, r.purged_at FROM birthday_review_rewards x JOIN birthday_reviews r ON r.id = x.review_id WHERE x.id = $1 FOR UPDATE OF x`, [id], c);
    if (!x || (a.distributorCode && x.distributor_code !== a.distributorCode)) fail(404, "NOT_FOUND", "사은품 지급 내역을 찾을 수 없습니다.");
    if (b.version != null && int(b.version) !== x.version) fail(409, "STALE", "다른 관리자가 먼저 변경했습니다. 새로고침 후 다시 시도해 주세요.");
    if (x.reward_status === to) fail(409, "SAME_STATUS", `이미 ${REWARD_STATUS_LABEL[to]} 상태입니다.`);   // 같은 처리를 두 번 누른 경우(중복 지급 방지)
    const normal = (REWARD_FLOW[x.reward_status] || []).includes(to);
    const superOnly = (REWARD_SUPER_FLOW[x.reward_status] || []).includes(to);
    if (!normal && !(superOnly && pcan(a, "promo.winner"))) fail(409, "BAD_TRANSITION", `${REWARD_STATUS_LABEL[x.reward_status]} → ${REWARD_STATUS_LABEL[to]} (으)로는 바꿀 수 없습니다.`);
    if ((superOnly || to === "CANCELED" || to === "ON_HOLD") && !reason) fail(400, "VALIDATION", "사유를 입력해 주세요.");
    if (!["CANCELED", "ON_HOLD"].includes(to)) {
      if (x.review_status !== "APPROVED") fail(409, "NOT_APPROVED", "승인된 후기의 사은품만 지급을 진행할 수 있습니다.");
      if (x.reward_type === "WINNER" && !(await q1(`SELECT 1 FROM birthday_review_winners WHERE review_id = $1`, [x.review_id], c))) fail(409, "NOT_WINNER", "우수 후기 선정이 취소된 건입니다.");
    }
    if (["SHIP_READY", "SHIPPING", "DELIVERED"].includes(to) && (!x.recipient_name || !x.recipient_phone_enc || !x.postal_code || !x.shipping_address_enc)) fail(409, "NO_ADDRESS", "수령인·연락처·배송 주소를 먼저 입력해 주세요.");
    const carrier = b.carrier !== undefined ? s(b.carrier, 30) : x.carrier, tracking = b.trackingNumber !== undefined ? s(b.trackingNumber, 40).replace(/[^0-9A-Za-z-]/g, "") : x.tracking_number;
    if (["SHIPPING", "DELIVERED"].includes(to) && (!carrier || !tracking)) fail(409, "NO_TRACKING", "택배사와 운송장 번호를 입력해 주세요.");
    const row = await q1<any>(
      `UPDATE birthday_review_rewards SET reward_status = $2, carrier = $3, tracking_number = $4,
         shipped_at = CASE WHEN $2 = 'SHIPPING' AND shipped_at IS NULL THEN now() WHEN $2 IN ('ELIGIBLE','PREPARING','SHIP_READY') THEN NULL ELSE shipped_at END,
         delivered_at = CASE WHEN $2 = 'DELIVERED' THEN now() ELSE NULL END, version = version + 1
       WHERE id = $1 RETURNING *`, [id, to, carrier || null, tracking || null], c);
    await log(c, a, Number(x.event_id), "reward.status", "reward", id, { status: x.reward_status }, { status: to, reviewId: Number(x.review_id), type: x.reward_type, carrier: carrier || undefined, trackingNumber: tracking || undefined }, reason || null);
    return rewardView(a, row);
  });
}
export async function bulkRewardStatus(a: PromoActor, b: any) {
  const ids: number[] = Array.isArray(b.ids) ? [...new Set(b.ids.map(Number).filter((x: number) => Number.isInteger(x) && x > 0))].slice(0, 300) as number[] : [];
  if (!ids.length) fail(400, "VALIDATION", "대상을 선택해 주세요.");
  const out: any[] = [];
  for (const id of ids) {
    try { const r = await setRewardStatus(a, id, { status: b.status, reason: b.reason }); out.push({ id, ok: true, status: r.status }); }
    catch (e: any) { out.push({ id, ok: false, error: e?.message || "처리하지 못했습니다." }); }
  }
  return { done: out.filter((x) => x.ok).length, failed: out.filter((x) => !x.ok).length, results: out };
}
/** 승인된 유효 참여자 중 참가 보상이 아직 없는 건을 한 번에 지급 대상으로 등록 (여러 번 눌러도 1건씩만 생성) */
export async function issueParticipation(a: PromoActor) {
  return tx(async (c) => {
    const ev = await lockEvent(c);
    const pol = policyOf(ev);
    const rows = await q<any>(`SELECT r.* FROM birthday_reviews r WHERE r.event_id = $1 AND r.review_status = 'APPROVED' AND NOT r.is_test AND r.purged_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM birthday_review_rewards x WHERE x.review_id = r.id AND x.reward_type = 'PARTICIPATION')
        AND ($2 OR NOT EXISTS (SELECT 1 FROM birthday_review_winners w WHERE w.review_id = r.id)) ORDER BY r.id`, [ev.id, pol.winnersAlsoGetParticipation], c);
    for (const r of rows) await ensureReward(c, a, ev, r, "PARTICIPATION");
    return { created: rows.length };
  });
}

// ===== 통계 =====
export async function stats(a: PromoActor) {
  const ev = await eventBySlug();
  const p: unknown[] = [ev.id]; let scope = "";
  if (a.distributorCode) { p.push(a.distributorCode); scope = " AND r.distributor_code = $2"; }
  const base = `FROM birthday_reviews r WHERE r.event_id = $1 AND NOT r.is_test AND r.purged_at IS NULL${scope}`;
  const daily = await q<any>(`SELECT to_char((r.submitted_at AT TIME ZONE 'Asia/Seoul')::date, 'YYYY-MM-DD') AS d, count(*) AS n ${base} GROUP BY 1 ORDER BY 1 DESC LIMIT 90`, p);
  const grp = async (col: string) => (await q<any>(`SELECT COALESCE(${col}::text, '미입력') AS k, count(*) AS n ${base} GROUP BY 1 ORDER BY 2 DESC`, p)).map((x) => ({ key: x.k, count: Number(x.n) }));
  const tot = await q1<any>(`SELECT count(*) AS total, round(avg(r.rating)::numeric, 2) AS avg_rating, round(avg(r.rating_experience)::numeric, 2) AS avg_exp,
      count(*) FILTER (WHERE r.member_claimed) AS members, count(*) FILTER (WHERE r.image_marketing_consent) AS marketing,
      round(avg(char_length(r.review_content))) AS avg_len ${base}`, p);
  const byDist = await q<any>(`SELECT COALESCE(r.distributor_code, '(직접 유입)') AS code, count(*) AS total,
      count(*) FILTER (WHERE r.review_status = 'APPROVED') AS approved, count(*) FILTER (WHERE r.review_status = 'PENDING') AS pending,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM birthday_review_winners w WHERE w.review_id = r.id)) AS winners,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM birthday_review_rewards x WHERE x.review_id = r.id AND x.reward_type = 'PARTICIPATION' AND x.reward_status = 'DELIVERED')) AS delivered,
      round(avg(r.rating)::numeric, 2) AS avg_rating ${base} GROUP BY 1 ORDER BY 2 DESC LIMIT 200`, p);
  const excluded = await q1<any>(`SELECT count(*) FILTER (WHERE r.is_test) AS test, count(*) FILTER (WHERE r.purged_at IS NOT NULL) AS purged FROM birthday_reviews r WHERE r.event_id = $1${scope}`, p);
  return {
    event: eventView(ev), asOf: new Date().toISOString(),
    totals: { total: Number(tot.total), avgRating: tot.avg_rating == null ? null : Number(tot.avg_rating), avgExperience: tot.avg_exp == null ? null : Number(tot.avg_exp),
      members: Number(tot.members), marketingConsent: Number(tot.marketing), avgLength: tot.avg_len == null ? null : Number(tot.avg_len),
      excludedTest: Number(excluded.test), purged: Number(excluded.purged) },
    daily: daily.map((x) => ({ date: x.d, count: Number(x.n) })).reverse(),
    byStatus: (await grp("r.review_status")).map((x) => ({ ...x, label: REVIEW_STATUS_LABEL[x.key] || x.key })),
    byRating: await grp("r.rating"), bySkinType: await grp("r.skin_type"), byUsagePeriod: await grp("r.usage_period"),
    byDistributor: byDist.map((x) => ({ code: x.code, total: Number(x.total), approved: Number(x.approved), pending: Number(x.pending), winners: Number(x.winners), delivered: Number(x.delivered), avgRating: x.avg_rating == null ? null : Number(x.avg_rating) })),
  };
}

// ===== 엑셀 =====
export async function exportRows(a: PromoActor, f: URLSearchParams) {
  const ev = await eventBySlug();
  const wh = reviewWhere(a, ev.id, f);
  const rows = await q<any>(`SELECT r.*, COALESCE(im.has_before, false) AS has_before, COALESCE(im.has_after, false) AS has_after, w.winner_rank, w.status AS winner_status,
      rp.reward_status AS rp_status, rp.carrier AS rp_carrier, rp.tracking_number AS rp_tracking, rp.delivered_at AS rp_delivered,
      rw.reward_status AS rw_status, rw.carrier AS rw_carrier, rw.tracking_number AS rw_tracking, rw.delivered_at AS rw_delivered
      ${REVIEW_FROM} WHERE ${wh.sql} ORDER BY r.id DESC LIMIT 5000`, wh.params);
  const kst = (v: any) => v ? new Date(new Date(v).getTime() + 9 * 3600e3).toISOString().slice(0, 16).replace("T", " ") : "";
  const header = ["접수번호", "접수일시", "이름", "휴대폰", "회원 여부", "회원 아이디", "주문번호·구매정보", "우편번호", "주소", "후기 제목", "후기 내용", "제품 만족도", "사용 경험", "피부 타입", "사용 기간", "추천 이유",
    "사용 전 사진", "사용 후 사진", "검토 상태", "검토 사유", "우수 후기 순위", "우수 후기 확정", "참가 보상(프로틴 쉐이크)", "참가 보상 택배사", "참가 보상 운송장", "참가 보상 완료일",
    "추가 보상(벌스데이 크림)", "추가 보상 택배사", "추가 보상 운송장", "추가 보상 완료일", "마케팅 활용 동의", "총판 코드", "확인 대상", "확인 사유", "테스트", "관리자 메모"];
  const data = rows.map((r) => [r.application_number, kst(r.submitted_at), r.purged_at ? "(파기됨)" : r.applicant_name, r.purged_at ? "" : fmtPhone(tryDecrypt(r.phone_enc)),
    r.member_claimed ? "회원" : "비회원", r.member_login_id || "", r.order_number || "", r.postal_code || "", tryDecrypt(r.address_enc).replace(/\n/g, " "),
    r.review_title, r.review_content, r.rating, r.rating_experience ?? "", r.skin_type || "", r.usage_period || "", r.recommend_reason || "",
    r.has_before ? "제출" : "미제출", r.has_after ? "제출" : "미제출", REVIEW_STATUS_LABEL[r.review_status], r.status_reason || "", r.winner_rank ?? "", r.winner_status === "CONFIRMED" ? "확정" : r.winner_rank ? "선정" : "",
    r.rp_status ? REWARD_STATUS_LABEL[r.rp_status] : "", r.rp_carrier || "", r.rp_tracking || "", kst(r.rp_delivered),
    r.rw_status ? REWARD_STATUS_LABEL[r.rw_status] : "", r.rw_carrier || "", r.rw_tracking || "", kst(r.rw_delivered),
    r.image_marketing_consent ? "동의" : "미동의", r.distributor_code || "", r.duplicate_flag && !r.duplicate_cleared_at ? "확인 필요" : "", r.duplicate_reason || "", r.is_test ? "테스트" : "", r.admin_memo || ""]);
  await log(undefined, a, ev.id, "export.reviews", "event", ev.id, null, { rows: rows.length, filters: Object.fromEntries(f) });
  // 수식 주입 방지: =,+,-,@ 로 시작하는 문자열은 앞에 작은따옴표를 붙여 글자로만 읽히게 한다
  const safe = (v: unknown) => (typeof v === "string" && /^[=+\-@\t\r]/.test(v) ? "'" + v : v);
  return { header, data: data.map((row) => row.map(safe)), eventName: ev.event_name };
}

// ===== 개인정보 파기 =====
async function purgeOne(c: Queryable, a: PromoActor, r: any, reason: string) {
  const busy = await q1<any>(`SELECT 1 FROM birthday_review_rewards WHERE review_id = $1 AND reward_status IN ('PREPARING','SHIP_READY','SHIPPING')`, [r.id], c);
  if (busy) fail(409, "REWARD_IN_PROGRESS", "사은품 지급이 진행 중입니다. 지급을 마치거나 취소한 뒤 파기해 주세요.");
  const imgs = await q<any>(`UPDATE birthday_review_images SET deleted_at = now(), original_filename = NULL WHERE review_id = $1 AND deleted_at IS NULL RETURNING storage_path`, [r.id], c);
  await q(`UPDATE birthday_reviews SET applicant_name = NULL, phone_enc = NULL, phone_hash = NULL, phone_last4 = NULL, member_login_id = NULL, order_number = NULL, order_number_norm = NULL,
             postal_code = NULL, address_enc = NULL, review_title = '(파기됨)', review_content = '(파기됨)', recommend_reason = NULL, admin_memo = NULL, ip_hash = NULL, user_agent = NULL,
             is_candidate = false, purged_at = now(), version = version + 1 WHERE id = $1`, [r.id], c);
  await q(`UPDATE birthday_review_rewards SET recipient_name = NULL, recipient_phone_enc = NULL, postal_code = NULL, shipping_address_enc = NULL, note = NULL WHERE review_id = $1`, [r.id], c);
  await q(`UPDATE birthday_review_rewards SET reward_status = 'CANCELED' WHERE review_id = $1 AND reward_status IN ('ELIGIBLE','ON_HOLD')`, [r.id], c);
  await log(c, a, Number(r.event_id), "review.purge", "review", r.id, { applicationNumber: r.application_number }, { images: imgs.length }, reason);
  return imgs.map((i) => i.storage_path as string);
}
export async function purgeReview(a: PromoActor, id: number, b: any) {
  const reason = reasonOf(b.reason);
  if (!reason) fail(400, "VALIDATION", "파기 사유를 입력해 주세요.");
  const paths = await tx(async (c) => {
    const r = await loadReview(a, id, c, true);
    if (r.purged_at) fail(409, "PURGED", "이미 파기된 접수입니다.");
    if (await q1(`SELECT 1 FROM birthday_review_winners WHERE review_id = $1 AND status = 'CONFIRMED'`, [id], c)) fail(409, "IS_WINNER", "최종 확정된 우수 후기입니다. 확정을 해제하고 선정을 취소한 뒤 파기해 주세요.");
    await q(`DELETE FROM birthday_review_winners WHERE review_id = $1`, [id], c);
    return purgeOne(c, a, r, reason);
  });
  for (const p of paths) await imageStore.del(p).catch(() => {});   // 커밋된 뒤에 실제 파일 삭제
  return { purged: true, imagesDeleted: paths.length };
}
/** 보유 기한이 지난 접수 일괄 파기 (당첨자·지급 진행 건은 건너뜀) */
export async function purgeExpired(a: PromoActor, b: any) {
  const ev = await eventBySlug();
  const rows = await q<any>(`SELECT r.id FROM birthday_reviews r WHERE r.event_id = $1 AND r.purged_at IS NULL AND r.retention_until < (now() AT TIME ZONE 'Asia/Seoul')::date
      AND NOT EXISTS (SELECT 1 FROM birthday_review_winners w WHERE w.review_id = r.id)
      AND NOT EXISTS (SELECT 1 FROM birthday_review_rewards x WHERE x.review_id = r.id AND x.reward_status IN ('PREPARING','SHIP_READY','SHIPPING')) ORDER BY r.id LIMIT 500`, [ev.id]);
  if (b.dryRun === true) return { expired: rows.length, purged: 0 };
  let purged = 0;
  for (const row of rows) {
    const paths = await tx(async (c) => { const r = await q1<any>(`SELECT * FROM birthday_reviews WHERE id = $1 AND purged_at IS NULL FOR UPDATE`, [row.id], c); return r ? purgeOne(c, a, r, "보유 기간 만료") : null; });
    if (paths) { purged++; for (const p of paths) await imageStore.del(p).catch(() => {}); }
  }
  const stale = await purgeStaleUploads(500);
  return { expired: rows.length, purged, staleUploadsRemoved: stale };
}
export async function retentionSummary() {
  const ev = await eventBySlug();
  const r = await q1<any>(`SELECT count(*) FILTER (WHERE purged_at IS NULL AND retention_until < (now() AT TIME ZONE 'Asia/Seoul')::date) AS expired,
      count(*) FILTER (WHERE purged_at IS NOT NULL) AS purged, min(retention_until) FILTER (WHERE purged_at IS NULL) AS next_due FROM birthday_reviews WHERE event_id = $1`, [ev.id]);
  return { expired: Number(r.expired), purged: Number(r.purged), nextDue: r.next_due };
}

// ===== 활동 로그 =====
export async function listLogs(f: URLSearchParams) {
  const limit = Math.min(300, Math.max(1, int(f.get("limit"), 100))), offset = Math.max(0, int(f.get("offset"), 0));
  const rows = await q<any>(`SELECT l.* FROM promotion_admin_logs l
      WHERE ($1::text IS NULL OR l.action_type LIKE $1 || '%') AND ($2::text IS NULL OR l.target_type = $2) AND ($3::text IS NULL OR l.target_id = $3)
        AND ($4::boolean OR l.action_type NOT IN ('review.view_pii','image.view','image.list'))
      ORDER BY l.id DESC LIMIT ${limit} OFFSET ${offset}`, [f.get("action") || null, f.get("targetType") || null, f.get("targetId") || null, f.get("views") === "1"]);
  return rows.map((l) => ({ id: Number(l.id), actorType: l.actor_type, actor: l.actor_label, action: l.action_type, targetType: l.target_type, targetId: l.target_id, previous: l.previous_value, next: l.new_value, reason: l.reason, at: l.created_at }));
}

// ===== 사진 파일 (서명 URL) =====
export async function imageFile(imageId: number, f: URLSearchParams) {
  const dl = f.get("dl") === "1";
  if (!verifyImageSignature(imageId, Number(f.get("exp")), dl, String(f.get("sig") || ""))) fail(403, "LINK_EXPIRED", "사진 링크가 만료되었습니다. 화면을 새로고침해 주세요.");
  const img = await q1<any>(`SELECT i.storage_path, i.mime_type, i.image_type, r.application_number FROM birthday_review_images i JOIN birthday_reviews r ON r.id = i.review_id WHERE i.id = $1 AND i.deleted_at IS NULL`, [imageId]);
  if (!img) fail(404, "NOT_FOUND", "사진을 찾을 수 없습니다.");
  const bytes = await imageStore.get(img.storage_path);
  if (!bytes) fail(404, "NOT_FOUND", "사진 파일을 찾을 수 없습니다.");
  const ext = img.mime_type === "image/jpeg" ? "jpg" : img.mime_type === "image/png" ? "png" : "webp";
  return { bytes: bytes!, mime: img.mime_type as string, filename: `${img.application_number}_${img.image_type}.${ext}`, download: dl };
}
export const META = { REVIEW_STATUS_LABEL, REWARD_STATUS_LABEL, REWARD_TYPE_LABEL, SKIN_TYPES, USAGE_PERIODS, DEFAULT_SETTINGS };
