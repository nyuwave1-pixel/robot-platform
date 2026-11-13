// 관리자 계정·세션·권한. 모든 권한 검사는 서버에서만 한다.
// 세션은 로그인 응답으로 내려주는 임의 토큰(Authorization: Bearer …)이며 DB 에는 해시만 저장한다. 쿠키를 쓰지 않으므로 CSRF 대상이 아니다.
import {
  q, q1, tx, fail, s, env, normEmail, EMAIL_RE, hashPassword, verifyPassword, passwordProblem, randomToken, sha256, ipHash,
  encrypt, decrypt, newTotpSecret, totpVerify, maskEmail, rateLimit,
} from "./core.ts";
import type { Queryable } from "./platform.ts";

export const ADMIN_ROLES = ["SUPER", "PROMO_MANAGER", "DISTRIBUTOR", "VIEWER"] as const;
export type AdminRole = typeof ADMIN_ROLES[number];
export const ROLE_LABEL: Record<AdminRole, string> = { SUPER: "본사 최고 관리자", PROMO_MANAGER: "프로모션 운영 담당", DISTRIBUTOR: "총판 관리자", VIEWER: "조회 전용" };
const P: Record<string, AdminRole[]> = {
  // 총판 관리자(DISTRIBUTOR)는 promo.read 만 가지며, 서버가 자기 총판 코드의 참여자로 조회 범위를 좁힌다.
  "promo.read":     ["SUPER", "PROMO_MANAGER", "DISTRIBUTOR", "VIEWER"],
  "promo.pii":      ["SUPER", "PROMO_MANAGER"],     // 연락처·주소 원문
  "promo.images":   ["SUPER", "PROMO_MANAGER"],     // 사용 전/후 사진 열람·원본 내려받기
  "promo.review":   ["SUPER", "PROMO_MANAGER"],     // 승인·반려·수정 요청·메모·후보 등록
  "promo.edit":     ["SUPER"],                      // 참여자 정보 수정·재참여 예외 승인
  "promo.winner":   ["SUPER"],                      // 우수 후기 선정·취소·확정
  "promo.reward":   ["SUPER", "PROMO_MANAGER"],     // 사은품 지급·배송 처리
  "promo.export":   ["SUPER"],                      // 개인정보 포함 엑셀
  "promo.settings": ["SUPER"],                      // 이벤트 기간·정책 설정
  "promo.purge":    ["SUPER"],                      // 개인정보 파기
  "promo.logs":     ["SUPER"],
  "admins.manage":  ["SUPER"],                      // 관리자 계정 발급·권한 변경
};
export function can(role: string, perm: string): boolean { return !!P[perm]?.includes(role as AdminRole); }
export const permsOf = (role: string) => Object.keys(P).filter((k) => can(role, k));

const TTL_SEC = 8 * 3600;
export type Admin = { id: number; email: string; name: string; role: AdminRole; mfa_enabled: boolean; mfaPassed: boolean; distributor_code: string | null; sessionId: number };

function bearer(req: Request): string {
  const a = req.headers.get("authorization") || "";
  return a.startsWith("Bearer ") ? a.slice(7).trim() : "";
}
async function alog(c: Queryable | undefined, adminId: number | null, label: string, action: string, targetId: string | number | null, next: unknown, ip: string, reason: string | null = null) {
  await q(`INSERT INTO promotion_admin_logs (actor_type, admin_id, actor_label, action_type, target_type, target_id, new_value, reason, ip_hash) VALUES ('ADMIN',$1,$2,$3,'admin_user',$4,$5,$6,$7)`,
    [adminId, label, action, targetId == null ? null : String(targetId), next == null ? null : JSON.stringify(next), reason, ip || null], c);
}
export async function currentAdmin(req: Request): Promise<Admin | null> {
  const tok = bearer(req);
  if (tok.length < 20) return null;
  const x = await q1<any>(`SELECT s.id AS sid, s.mfa_passed, s.last_seen_at, a.id, a.email, a.name, a.role, a.mfa_enabled, a.distributor_code
      FROM admin_sessions s JOIN admin_users a ON a.id = s.admin_id
      WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now() AND a.active`, [sha256(tok)]);
  if (!x) return null;
  if (Date.now() - new Date(x.last_seen_at).getTime() > 5 * 60e3) await q(`UPDATE admin_sessions SET last_seen_at = now() WHERE id = $1`, [x.sid]);
  return { id: Number(x.id), email: x.email, name: x.name, role: x.role, mfa_enabled: x.mfa_enabled, mfaPassed: !!x.mfa_passed, distributor_code: x.distributor_code, sessionId: Number(x.sid) };
}
/** 관리자: 로그인 + 2단계 인증 통과 + 권한 */
export async function requireAdmin(req: Request, perm: string | null): Promise<Admin> {
  const a = await currentAdmin(req);
  if (!a) fail(401, "ADMIN_LOGIN_REQUIRED", "관리자 로그인이 필요합니다.");
  if (!a!.mfaPassed) fail(401, "MFA_REQUIRED", "2단계 인증을 완료해 주세요.");
  if (perm && !can(a!.role, perm)) fail(403, "FORBIDDEN", "이 작업 권한이 없습니다.");
  return a!;
}
export const meView = (a: Admin) => ({ id: a.id, email: a.email, name: a.name, role: a.role, roleLabel: ROLE_LABEL[a.role], mfaEnabled: a.mfa_enabled, mfaPassed: a.mfaPassed, distributorCode: a.distributor_code, perms: permsOf(a.role) });

// ---- 최초 설정: 관리자 계정이 하나도 없을 때만, 1회용 설정 코드로 본사 최고 관리자를 만든다 ----
export async function setupStatus() {
  const n = await q1<{ n: string }>(`SELECT count(*) AS n FROM admin_users`);
  return { needsSetup: Number(n?.n || 0) === 0 };
}
export async function bootstrap(req: Request, b: any) {
  await rateLimit("boot:" + ipHash(req), 8, 3600);
  const email = normEmail(b.email), name = s(b.name, 40), pw = String(b.password || ""), code = s(b.setupCode, 80);
  if (!EMAIL_RE.test(email) || !name) fail(400, "VALIDATION", "이메일과 이름을 확인해 주세요.");
  const pp = passwordProblem(pw, email, ""); if (pp) fail(400, "VALIDATION", pp);
  return tx(async (c) => {
    await q(`LOCK TABLE admin_users IN EXCLUSIVE MODE`, [], c);
    if (await q1(`SELECT 1 FROM admin_users LIMIT 1`, [], c)) fail(409, "ALREADY_SET_UP", "이미 관리자 계정이 있습니다. 로그인해 주세요.");
    const cfg = await q1<any>(`SELECT value FROM app_config WHERE key = 'setup_code' FOR UPDATE`, [], c);
    const v = cfg?.value || {};
    if (!v.hash || !code || sha256(code) !== v.hash || (v.expiresAt && new Date(v.expiresAt).getTime() < Date.now())) fail(401, "BAD_SETUP_CODE", "설정 코드가 올바르지 않거나 만료되었습니다.");
    const a = await q1<any>(`INSERT INTO admin_users (email, name, password_hash, role) VALUES ($1,$2,$3,'SUPER') RETURNING id`, [email, name, await hashPassword(pw)], c);
    await q(`DELETE FROM app_config WHERE key = 'setup_code'`, [], c);
    await alog(c, Number(a.id), name, "admin.bootstrap", a.id, { email: maskEmail(email), role: "SUPER" }, ipHash(req));
    return { created: true };
  });
}

// ---- 로그인·세션 ----
export async function login(req: Request, b: any) {
  const email = normEmail(b.email), pw = String(b.password || "");
  await rateLimit("alogin-ip:" + ipHash(req), 20, 900);
  await rateLimit("alogin-id:" + email.slice(0, 80), 8, 900);
  const a = await q1<any>(`SELECT * FROM admin_users WHERE lower(email) = $1`, [email]);
  const bad = () => fail(401, "BAD_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.");
  if (!a || !a.active) { await hashPassword("x".repeat(12)); return bad(); }   // 계정 유무에 따른 응답 시간 차이를 줄인다
  if (a.locked_until && new Date(a.locked_until).getTime() > Date.now()) fail(423, "LOCKED", "로그인 시도가 많아 잠시 잠겼습니다. 15분 뒤 다시 시도해 주세요.");
  if (!(await verifyPassword(pw, a.password_hash))) {
    await q(`UPDATE admin_users SET failed_logins = failed_logins + 1, locked_until = CASE WHEN failed_logins + 1 >= 5 THEN now() + interval '15 minutes' ELSE locked_until END WHERE id = $1`, [a.id]);
    return bad();
  }
  await q(`UPDATE admin_users SET failed_logins = 0, locked_until = NULL, last_login_at = now() WHERE id = $1`, [a.id]);
  const token = randomToken(32);
  await q(`INSERT INTO admin_sessions (token_hash, admin_id, ip_hash, user_agent, expires_at) VALUES ($1,$2,$3,$4, now() + make_interval(secs => $5))`,
    [sha256(token), a.id, ipHash(req) || null, String(req.headers.get("user-agent") || "").slice(0, 160), TTL_SEC]);
  await alog(undefined, Number(a.id), a.name, "admin.login", a.id, null, ipHash(req));
  if (Math.random() < 0.05) await q(`DELETE FROM admin_sessions WHERE expires_at < now() - interval '7 days'`);
  return { token, expiresIn: TTL_SEC, mfaEnabled: !!a.mfa_enabled };
}
export async function logout(req: Request) {
  const tok = bearer(req);
  if (tok) await q(`UPDATE admin_sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`, [sha256(tok)]);
  return { loggedOut: true };
}
async function revokeAll(adminId: number, c?: Queryable) { await q(`UPDATE admin_sessions SET revoked_at = now() WHERE admin_id = $1 AND revoked_at IS NULL`, [adminId], c); }
async function sessionAdmin(req: Request): Promise<Admin> { const a = await currentAdmin(req); if (!a) fail(401, "ADMIN_LOGIN_REQUIRED", "관리자 로그인이 필요합니다."); return a!; }

// ---- 2단계 인증 (TOTP) ----
export async function mfaSetup(req: Request) {
  const a = await sessionAdmin(req);
  if (a.mfa_enabled) fail(409, "MFA_ALREADY", "이미 2단계 인증이 설정되어 있습니다.");
  const secret = newTotpSecret();
  await q(`UPDATE admin_users SET totp_secret_enc = $2 WHERE id = $1`, [a.id, encrypt(secret)]);
  const issuer = encodeURIComponent(env("BR_MFA_ISSUER") || "UNI&CORE Promotion");
  return { secret, otpauth: `otpauth://totp/${issuer}:${encodeURIComponent(a.email)}?secret=${secret}&issuer=${issuer}&digits=6&period=30` };
}
export async function mfaConfirm(req: Request, b: any, enable: boolean) {
  const a = await sessionAdmin(req);
  await rateLimit("mfa:" + a.id, 10, 900);
  const row = await q1<any>(`SELECT totp_secret_enc, mfa_enabled FROM admin_users WHERE id = $1`, [a.id]);
  if (!row?.totp_secret_enc) fail(409, "MFA_NOT_SET", "2단계 인증이 설정되지 않았습니다.");
  if (!enable && !row.mfa_enabled) fail(409, "MFA_NOT_SET", "2단계 인증 설정을 먼저 마쳐 주세요.");
  if (!totpVerify(decrypt(row.totp_secret_enc), String(b.code || ""))) fail(401, "MFA_BAD_CODE", "인증 코드가 올바르지 않습니다.");
  if (enable) await q(`UPDATE admin_users SET mfa_enabled = true WHERE id = $1`, [a.id]);
  await q(`UPDATE admin_sessions SET mfa_passed = true WHERE id = $1`, [a.sessionId]);
  return { mfaPassed: true };
}
export async function changeOwnPassword(req: Request, b: any) {
  const me = await requireAdmin(req, null);
  const a = await q1<any>(`SELECT password_hash, email FROM admin_users WHERE id = $1`, [me.id]);
  if (!(await verifyPassword(String(b.currentPassword || ""), a.password_hash))) fail(401, "BAD_CREDENTIALS", "현재 비밀번호가 올바르지 않습니다.");
  const np = String(b.newPassword || ""); const pp = passwordProblem(np, a.email, ""); if (pp) fail(400, "VALIDATION", pp);
  await q(`UPDATE admin_users SET password_hash = $2 WHERE id = $1`, [me.id, await hashPassword(np)]);
  await q(`UPDATE admin_sessions SET revoked_at = now() WHERE admin_id = $1 AND id <> $2 AND revoked_at IS NULL`, [me.id, me.sessionId]);
  return { changed: true };
}

// ---- 관리자 계정 관리 (본사 최고 관리자) ----
export async function listAdmins() {
  const rows = await q<any>(`SELECT id, email, name, role, active, mfa_enabled, last_login_at, created_at, distributor_code FROM admin_users ORDER BY id`);
  return rows.map((r) => ({ id: Number(r.id), email: r.email, name: r.name, role: r.role, roleLabel: ROLE_LABEL[r.role as AdminRole], active: r.active, mfaEnabled: r.mfa_enabled, lastLoginAt: r.last_login_at, createdAt: r.created_at, distributorCode: r.distributor_code }));
}
const tempPassword = () => "Uc!" + randomToken(9) + "7";
const distCode = (v: unknown) => s(v, 40).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
export async function createAdmin(req: Request, b: any) {
  const me = await requireAdmin(req, "admins.manage");
  const email = normEmail(b.email), name = s(b.name, 40), role = String(b.role || "");
  if (!EMAIL_RE.test(email) || !name) fail(400, "VALIDATION", "이메일과 이름을 확인해 주세요.");
  if (!ADMIN_ROLES.includes(role as AdminRole)) fail(400, "VALIDATION", "역할을 선택해 주세요.");
  const dist = role === "DISTRIBUTOR" ? distCode(b.distributorCode) : "";
  if (role === "DISTRIBUTOR" && !dist) fail(400, "VALIDATION", "총판 관리자는 총판 코드를 입력해 주세요.");
  const temp = tempPassword();
  const r = await tx(async (c) => {
    const x = await q1<any>(`INSERT INTO admin_users (email, name, password_hash, role, created_by, distributor_code) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, [email, name, await hashPassword(temp), role, me.id, dist || null], c);
    await alog(c, me.id, me.name, "admin.create", x.id, { email: maskEmail(email), role, distributorCode: dist || undefined }, ipHash(req));
    return x;
  });
  return { id: Number(r.id), tempPassword: temp };   // 한 번만 표시
}
export async function updateAdmin(req: Request, id: number, b: any) {
  const me = await requireAdmin(req, "admins.manage");
  if (id === me.id && (b.active === false || (b.role && b.role !== "SUPER"))) fail(409, "SELF", "본인 계정의 권한을 낮추거나 비활성화할 수 없습니다.");
  return tx(async (c) => {
    const a = await q1<any>(`SELECT id, role, active, distributor_code FROM admin_users WHERE id = $1 FOR UPDATE`, [id], c);
    if (!a) fail(404, "NOT_FOUND", "관리자를 찾을 수 없습니다.");
    const role = b.role ? String(b.role) : a.role;
    if (!ADMIN_ROLES.includes(role as AdminRole)) fail(400, "VALIDATION", "역할이 올바르지 않습니다.");
    const dist = role === "DISTRIBUTOR" ? (b.distributorCode !== undefined ? distCode(b.distributorCode) : a.distributor_code || "") : "";
    if (role === "DISTRIBUTOR" && !dist) fail(400, "VALIDATION", "총판 관리자는 총판 코드가 필요합니다.");
    const active = typeof b.active === "boolean" ? b.active : a.active;
    const temp = b.resetPassword ? tempPassword() : null;
    await q(`UPDATE admin_users SET role = $2, active = $3, distributor_code = $4, mfa_enabled = CASE WHEN $5 THEN false ELSE mfa_enabled END,
               totp_secret_enc = CASE WHEN $5 THEN NULL ELSE totp_secret_enc END, password_hash = COALESCE($6, password_hash), failed_logins = 0, locked_until = NULL WHERE id = $1`,
      [id, role, active, dist || null, !!b.resetMfa, temp ? await hashPassword(temp) : null], c);
    if (!active || b.resetMfa || temp || role !== a.role || (dist || null) !== (a.distributor_code || null)) await revokeAll(id, c);
    await alog(c, me.id, me.name, "admin.update", id, { role, active, distributorCode: dist || undefined, resetMfa: !!b.resetMfa, resetPassword: !!temp }, ipHash(req), s(b.reason, 300) || null);
    return { tempPassword: temp };
  });
}
