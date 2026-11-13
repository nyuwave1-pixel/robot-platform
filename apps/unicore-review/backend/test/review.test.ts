// 프로모션(벌스데이 크림 후기 이벤트) 통합 테스트 — 고객 접수부터 관리자 검토·우수 후기 선정·사은품 지급 완료까지
// (실행 방법은 아래 PROMO_TEST_PG_URL 설명 참고)
// 동시성(동시 접수·동시 선정·동시 지급) 검증은 연결마다 트랜잭션이 분리되는 실제 PostgreSQL 이 필요하다:
//   PROMO_TEST_PG_URL=postgres://user:pw@127.0.0.1:5432/postgres npm run test:promo
//   (시험용 데이터베이스를 새로 만들어 쓰고 끝나면 지운다. 메모리 DB 에서는 같은 시나리오를 차례로 실행한다)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import pg from "pg";

// 실행: PROMO_TEST_PG_URL=postgres://user:pw@127.0.0.1:5432/postgres npm test
// 시험용 데이터베이스를 새로 만들어 쓰고 끝나면 지운다(운영 DB 와 무관). 동시성 시나리오는 요청을 실제로 동시에 보낸다.
const REAL_PG = process.env.PROMO_TEST_PG_URL || "";
if (!REAL_PG) throw new Error("PROMO_TEST_PG_URL 을 지정해 주세요 (시험용 PostgreSQL)");
const TEST_DB = "review_test_" + process.pid;
const together = async <T,>(jobs: (() => Promise<T>)[]): Promise<T[]> => Promise.all(jobs.map((j) => j()));
async function adminPg(fn: (c: any) => Promise<void>) { const c = new pg.Client({ connectionString: REAL_PG }); await c.connect(); try { await fn(c); } finally { await c.end(); } }
let handle: (req: Request, base?: string) => Promise<Response>;
let core: any, imagesafe: any, pool: any;
let files: Map<string, Uint8Array>;
const SITE = "https://unipromotion.unincore.com";
const SETUP_CODE = "setup-code-for-tests-0001";
const pub = (req: Request) => handle(req, "/birthday-review");
const admin = (req: Request) => handle(req, "/birthday-review");

before(async () => {
  await adminPg(async (c) => { await c.query(`CREATE DATABASE ${TEST_DB}`); });
  const u = new URL(REAL_PG); u.pathname = "/" + TEST_DB;
  const c = new pg.Client({ connectionString: u.toString() }); await c.connect();
  await c.query("CREATE ROLE anon NOLOGIN").catch(() => {}); await c.query("CREATE ROLE authenticated NOLOGIN").catch(() => {});
  await c.query(fs.readFileSync("./sql/001_init.sql", "utf8"));
  await c.end();
  process.env.BR_TEST_ORIGINS = "http://localhost:3100";
  const node = await import("../platform/node.ts");
  pool = node.startNodePlatform(u.toString()); files = node.files;
  core = await import("../src/core.ts");
  imagesafe = await import("../src/imagesafe.ts");
  handle = (await import("../src/app.ts")).handle;
  await core.q(`UPDATE promotion_events SET event_status = 'OPEN'`);
  await core.q(`INSERT INTO app_config (key, value) VALUES ('setup_code', $1)`, [JSON.stringify({ hash: core.sha256(SETUP_CODE), expiresAt: new Date(Date.now() + 3600e3).toISOString() })]);
});
after(async () => {
  try { await pool.end(); } catch {}
  await adminPg(async (c) => { await c.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`); });
});

const sql = (t: string, p: unknown[] = []) => core.q(t, p);

// ---- 시험용 이미지 (구조만 올바른 최소 파일. EXIF·GPS 흔적 포함) ----
const be16 = (n: number) => [n >> 8, n & 255];
const be32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
function jpeg(w = 800, h = 600, salt = 0): Uint8Array {
  const seg = (m: number, d: number[]) => [0xff, m, ...be16(d.length + 2), ...d];
  const exif = [...Buffer.from("Exif\0\0MM\0*GPSLatitude 37.5665 GPSLongitude 126.9780")];
  return new Uint8Array([0xff, 0xd8,
    ...seg(0xe0, [...Buffer.from("JFIF\0"), 1, 1, 0, 0, 1, 0, 1, 0, 0]),
    ...seg(0xe1, exif),
    ...seg(0xfe, [...Buffer.from("shot at home")]),
    ...seg(0xc0, [8, ...be16(h), ...be16(w), 1, 1, 0x11, 0]),
    ...seg(0xda, [1, 1, 0, 0, 63, 0]), 0x12, 0x34, 0x56, salt & 255, (salt >> 8) & 255, 0xff, 0xd9]);
}
function png(w = 640, h = 480): Uint8Array {
  const chunk = (t: string, d: number[]) => [...be32(d.length), ...Buffer.from(t), ...d, 0, 0, 0, 0];
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ...chunk("IHDR", [...be32(w), ...be32(h), 8, 2, 0, 0, 0]), ...chunk("tEXt", [...Buffer.from("Location\0Seoul")]), ...chunk("eXIf", [1, 2, 3, 4]),
    ...chunk("IDAT", [1, 2, 3]), ...chunk("IEND", [])]);
}
function webp(w = 500, h = 400): Uint8Array {
  const le32 = (n: number) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
  const le24 = (n: number) => [n & 255, (n >> 8) & 255, (n >> 16) & 255];
  const chunk = (t: string, d: number[]) => [...Buffer.from(t), ...le32(d.length), ...d, ...(d.length & 1 ? [0] : [])];
  const body = [...chunk("VP8X", [0x08, 0, 0, 0, ...le24(w - 1), ...le24(h - 1)]), ...chunk("VP8 ", [0, 0, 0, 0x9d, 0x01, 0x2a, ...[w & 255, w >> 8], ...[h & 255, h >> 8], 0, 0]), ...chunk("EXIF", [...Buffer.from("GPS 37.5")])];
  return new Uint8Array([...Buffer.from("RIFF"), ...le32(body.length + 4), ...Buffer.from("WEBP"), ...body]);
}

// ---- HTTP 도우미 ----
let ipSeq = 10;
class Visitor {
  ip = "10.1." + Math.floor(ipSeq / 250) + "." + (ipSeq++ % 250);
  origin = SITE;
  async call(method: string, path: string, body?: unknown, extra: Record<string, string> = {}) {
    const headers: Record<string, string> = { origin: this.origin, "x-forwarded-for": this.ip, ...extra };
    if (method !== "GET") headers["x-br-csrf"] = extra["x-br-csrf"] ?? "1";
    let payload: any = undefined;
    if (body instanceof Uint8Array) payload = body; else if (body !== undefined) { headers["content-type"] = "application/json"; payload = JSON.stringify(body); }
    const res = await pub(new Request("https://api.example.test/birthday-review/public" + path, { method, headers, body: payload }));
    const text = await res.text(); let json: any = null; try { json = JSON.parse(text); } catch {}
    return { status: res.status, json, data: json?.data, error: json?.error, headers: res.headers };
  }
  async upload(type: "BEFORE" | "AFTER", bytes: Uint8Array, name = "사진.jpg") {
    const r = await this.call("POST", "/uploads?type=" + type, bytes, { "content-type": "image/jpeg", "x-br-filename": encodeURIComponent(name) });
    assert.equal(r.status, 201, JSON.stringify(r.json));
    return { uploadId: r.data.uploadId as number, token: r.data.token as string };
  }
}
let phoneSeq = 1000;
const nextPhone = () => "0105555" + String(phoneSeq++).padStart(4, "0");
const CONTENT = "벌스데이 크림을 4주 동안 아침저녁으로 사용했습니다. 피부가 한결 촉촉해지고 화장이 잘 받아서 만족합니다.";
async function payload(v: Visitor, over: Record<string, unknown> = {}, withImages = true) {
  const cfg = (await v.call("GET", "/config")).data;
  const images = withImages ? { before: await v.upload("BEFORE", jpeg(800, 600, phoneSeq)), after: await v.upload("AFTER", jpeg(900, 700, phoneSeq + 7000)) } : {};
  return { name: "김유니", phone: nextPhone(), memberClaimed: true, memberLoginId: "uni" + phoneSeq, orderNumber: "ORD-2026-" + phoneSeq, title: "피부가 달라졌어요", content: CONTENT,
    rating: 5, ratingExperience: 4, skinType: "건성", usagePeriod: "2~4주", recommendReason: "보습감이 좋아서", postalCode: "06774", address1: "서울 서초구 양재대로2길 100-30", address2: "2층",
    consents: { PRIVACY_COLLECT: true, EVENT_PROCESSING: true, GIFT_SHIPPING: true, MARKETING_USE: false }, consentVersion: cfg.consentVersion, images, ...over };
}
async function submit(over: Record<string, unknown> = {}, v = new Visitor()) {
  const p = await payload(v, over);
  const r = await v.call("POST", "/submit", p);
  assert.equal(r.status, 201, JSON.stringify(r.json));
  const row = (await sql(`SELECT id FROM birthday_reviews WHERE application_number = $1`, [r.data.applicationNumber]))[0];
  return { id: Number(row.id), no: r.data.applicationNumber as string, phone: p.phone as string, v, p };
}

class Admin {
  bearer?: string;
  constructor(bearer?: string) { this.bearer = bearer; }
  async call(method: string, path: string, body?: unknown, extra: Record<string, string> = {}) {
    const headers: Record<string, string> = { origin: SITE, "x-forwarded-for": "10.9.9.9", ...extra };
    if (method !== "GET") headers["x-br-csrf"] = "1";
    if (this.bearer) headers.authorization = "Bearer " + this.bearer;
    if (body !== undefined) headers["content-type"] = "application/json";
    const res = await admin(new Request("https://api.example.test/birthday-review/admin" + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }));
    const buf = new Uint8Array(await res.arrayBuffer());
    let json: any = null; try { json = JSON.parse(Buffer.from(buf).toString("utf8")); } catch {}
    return { status: res.status, json, data: json?.data, error: json?.error, headers: res.headers, bytes: buf };
  }
  p(method: string, path: string, body?: unknown) { return this.call(method, "/promo" + path, body); }
}
const HQ = new Admin();   // 본사 최고 관리자 — 첫 테스트에서 최초 설정으로 만든다
async function signIn(a: Admin, email: string, password: string) {
  const l = await a.call("POST", "/login", { email, password });
  assert.equal(l.status, 200, JSON.stringify(l.json));
  a.bearer = l.data.token;
  return a;
}
async function roleAdmin(email: string, name: string, role: string, distributorCode?: string) {
  const c = await HQ.call("POST", "/admins", { email, name, role, distributorCode });
  assert.equal(c.status, 201, JSON.stringify(c.json));
  return signIn(new Admin(), email, c.data.tempPassword);
}
let OPS: Admin, DIST: Admin, VIEWER: Admin;

// =====================================================================================================
test("최초 설정·로그인: 설정 코드 1회용, 비밀번호 기준, 2단계 인증은 선택(설정한 계정만 요구), 로그인 잠금", async () => {
  const anon = new Admin();
  assert.equal((await anon.call("GET", "/setup")).data.needsSetup, true);
  const acct = { email: "hq@test.example", name: "본사관리자", password: "HeadOffice2026x!" };
  assert.equal((await anon.call("POST", "/bootstrap", { ...acct, setupCode: "wrong" })).error.code, "BAD_SETUP_CODE");
  assert.equal((await anon.call("POST", "/bootstrap", { ...acct, password: "short1", setupCode: SETUP_CODE })).status, 400);
  assert.equal((await anon.call("POST", "/bootstrap", { ...acct, setupCode: SETUP_CODE })).status, 201);
  assert.equal((await anon.call("POST", "/bootstrap", { ...acct, email: "x@test.example", setupCode: SETUP_CODE })).error.code, "ALREADY_SET_UP");
  assert.equal((await anon.call("GET", "/setup")).data.needsSetup, false);
  assert.equal((await anon.call("POST", "/login", { email: acct.email, password: "nope" })).status, 401);
  const l = await HQ.call("POST", "/login", { email: acct.email, password: acct.password });
  assert.equal(l.status, 200); HQ.bearer = l.data.token; assert.equal(l.data.mfaEnabled, false);
  assert.equal((await HQ.p("GET", "/reviews")).status, 200, "2단계 인증을 설정하지 않은 계정은 로그인만으로 사용");
  const s = await HQ.call("POST", "/mfa/setup");
  assert.match(s.data.otpauth, /^otpauth:\/\/totp\//);
  assert.equal((await HQ.call("POST", "/mfa/enable", { code: "000000" })).status, 401);
  assert.equal((await HQ.call("POST", "/mfa/enable", { code: core.totpCode(s.data.secret) })).status, 200);
  const me = (await HQ.call("GET", "/me")).data;
  assert.equal(me.role, "SUPER"); assert.ok(me.perms.includes("promo.winner") && me.perms.includes("admins.manage"));
  assert.equal((await HQ.p("GET", "/dashboard")).status, 200);
  const row = (await sql(`SELECT password_hash, totp_secret_enc FROM admin_users WHERE email = $1`, [acct.email]))[0];
  assert.ok(row.password_hash.startsWith("scrypt$") && row.totp_secret_enc.startsWith("v1."), "비밀번호는 해시, TOTP 비밀값은 암호화 저장");
  const tok = (await sql(`SELECT token_hash FROM admin_sessions LIMIT 1`))[0].token_hash;
  assert.notEqual(tok, HQ.bearer, "세션 토큰은 해시로만 저장");
  // 다음 로그인은 2단계 코드 확인(verify)
  const again = new Admin(); const l2 = await again.call("POST", "/login", { email: acct.email, password: acct.password }); again.bearer = l2.data.token;
  assert.equal(l2.data.mfaEnabled, true);
  assert.equal((await again.p("GET", "/dashboard")).error.code, "MFA_REQUIRED", "2단계 인증을 설정한 계정은 코드 확인 전 접근 불가");
  assert.equal((await again.call("POST", "/mfa/verify", { code: core.totpCode(s.data.secret) })).status, 200);
  assert.equal((await again.p("GET", "/dashboard")).status, 200);
  assert.equal((await again.call("POST", "/logout")).status, 200);
  assert.equal((await again.p("GET", "/dashboard")).status, 401, "로그아웃한 토큰은 무효");
  // 5회 연속 실패 → 잠금
  await HQ.call("POST", "/admins", { email: "lock@test.example", name: "잠금시험", role: "VIEWER" });
  for (let i = 0; i < 5; i++) await new Admin().call("POST", "/login", { email: "lock@test.example", password: "wrong-password-1" });
  assert.equal((await new Admin().call("POST", "/login", { email: "lock@test.example", password: "wrong-password-1" })).status, 423);
});

test("이미지 검증: 형식 위장 차단, 해상도 확인, EXIF·위치정보 제거", () => {
  const j = imagesafe.sanitizeImage(jpeg(), { maxBytes: 1e6, maxPixels: 6000 });
  assert.equal(j.mime, "image/jpeg"); assert.equal(j.width, 800); assert.equal(j.height, 600);
  assert.ok(!Buffer.from(j.bytes).includes("GPSLatitude"), "EXIF(GPS)가 남아 있으면 안 됨");
  assert.ok(!Buffer.from(j.bytes).includes("shot at home"), "주석이 남아 있으면 안 됨");
  assert.ok(Buffer.from(j.bytes).includes("JFIF"));
  const p = imagesafe.sanitizeImage(png(), { maxBytes: 1e6, maxPixels: 6000 });
  assert.equal(p.width, 640); assert.ok(!Buffer.from(p.bytes).includes("Seoul")); assert.ok(!Buffer.from(p.bytes).includes("eXIf"));
  const w = imagesafe.sanitizeImage(webp(), { maxBytes: 1e6, maxPixels: 6000 });
  assert.equal(w.width, 500); assert.equal(w.height, 400); assert.ok(!Buffer.from(w.bytes).includes("GPS"));
  assert.equal(w.bytes[20] & 0x08, 0, "VP8X 의 EXIF 플래그 해제");
  assert.equal(new DataView(w.bytes.buffer, w.bytes.byteOffset).getUint32(4, true), w.bytes.length - 8, "RIFF 길이 재계산");
  const bad = (b: Uint8Array, code: string, lim = { maxBytes: 1e6, maxPixels: 6000 }) => assert.throws(() => imagesafe.sanitizeImage(b, lim), (e: any) => e.code === code, code);
  bad(new Uint8Array(Buffer.from("<?php echo 1; ?>")), "BAD_TYPE");
  bad(new Uint8Array(Buffer.from("%PDF-1.4 fake")), "BAD_TYPE");
  bad(new Uint8Array(Buffer.from("<svg onload=alert(1)>")), "BAD_TYPE");
  bad(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 4, 1, 2]), "CORRUPT");           // 머리만 JPEG
  bad(jpeg(9000, 600), "TOO_BIG_DIMENSION");
  bad(jpeg(50, 50), "TOO_SMALL");
  bad(jpeg(), "TOO_LARGE", { maxBytes: 20, maxPixels: 6000 });
  // JPEG 뒤에 스크립트를 이어 붙인 파일 — 끝 표시 뒤는 잘려 나간다
  const poly = new Uint8Array([...jpeg(), ...Buffer.from("<script>alert(1)</script>")]);
  assert.ok(!Buffer.from(imagesafe.sanitizeImage(poly, { maxBytes: 1e6, maxPixels: 6000 }).bytes).includes("script"));
});

test("공개 설정: 이벤트 상태·작성 기준·동의 문서(목적·항목·보유 기간·거부 권리)", async () => {
  const r = await new Visitor().call("GET", "/config");
  assert.equal(r.status, 200);
  assert.equal(r.data.phase, "OPEN"); assert.equal(r.data.minChars, 30); assert.equal(r.data.winnerCount, 3);
  assert.equal(r.data.rewards.participation.productName, "프로틴 쉐이크 1박스");
  assert.equal(r.data.consents.length, 4);
  assert.deepEqual(r.data.consents.map((c: any) => c.required), [true, true, true, false]);
  for (const c of r.data.consents) for (const k of ["purpose", "items", "retention", "refusal"]) assert.ok(c[k], `${c.type}.${k}`);
  assert.equal(r.headers.get("access-control-allow-origin"), SITE);
});

test("CORS·CSRF: 허용하지 않은 출처와 전용 헤더 없는 요청은 거절", async () => {
  const evil = new Visitor(); evil.origin = "https://evil.example";
  const r1 = await evil.call("POST", "/submit", { name: "x" });
  assert.equal(r1.status, 403); assert.equal(r1.error.code, "ORIGIN"); assert.equal(r1.headers.get("access-control-allow-origin"), null);
  const v = new Visitor();
  const r2 = await v.call("POST", "/submit", { name: "x" }, { "x-br-csrf": "0" });
  assert.equal(r2.status, 403); assert.equal(r2.error.code, "CSRF");
  const pre = await pub(new Request("https://api.example.test/birthday-review/public/submit", { method: "OPTIONS", headers: { origin: SITE } }));
  assert.equal(pre.status, 204); assert.match(pre.headers.get("access-control-allow-headers") || "", /x-br-csrf/);
  const pre2 = await pub(new Request("https://api.example.test/birthday-review/public/submit", { method: "OPTIONS", headers: { origin: "https://evil.example" } }));
  assert.equal(pre2.status, 403);
});

test("사진 업로드: 저장 전 검증·메타데이터 제거, 교체·삭제, 잘못된 파일 거절", async () => {
  const v = new Visitor();
  const up = await v.call("POST", "/uploads?type=BEFORE", jpeg(), { "x-br-filename": encodeURIComponent("내 얼굴.jpg") });
  assert.equal(up.status, 201); assert.equal(up.data.width, 800); assert.equal(up.data.metadataRemoved, true);
  const row = (await sql(`SELECT * FROM birthday_review_images WHERE id = $1`, [up.data.uploadId]))[0];
  assert.equal(row.review_id, null); assert.equal(row.original_filename, "내 얼굴.jpg");
  assert.ok(!Buffer.from(files.get(row.storage_path)!).includes("GPSLatitude"), "저장된 파일에 위치정보가 없어야 함");
  assert.doesNotMatch(row.storage_path, /얼굴|jpg\.|\.\./, "저장 경로는 추측할 수 없는 임의 값");
  // 남의 토큰으로는 삭제 불가
  assert.equal((await v.call("DELETE", "/uploads/" + up.data.uploadId, undefined, { "x-br-upload-token": "wrong-token-wrong-token-wrong" })).data.deleted, false);
  assert.equal((await v.call("DELETE", "/uploads/" + up.data.uploadId, undefined, { "x-br-upload-token": up.data.token })).data.deleted, true);
  assert.equal(files.has(row.storage_path), false);
  const exe = await v.call("POST", "/uploads?type=BEFORE", new Uint8Array(Buffer.from("MZ\x90\0 this is not an image at all")), { "content-type": "image/jpeg" });
  assert.equal(exe.status, 400); assert.equal(exe.error.code, "IMAGE_BAD_TYPE");
  assert.equal((await v.call("POST", "/uploads?type=SIDE", jpeg())).status, 400);
  const huge = new Uint8Array(4.5 * 1024 * 1024); huge.set([0xff, 0xd8, 0xff]);
  const big = await v.call("POST", "/uploads?type=AFTER", huge);
  assert.equal(big.status, 413); assert.equal(big.error.code, "IMAGE_TOO_LARGE");
});

test("접수: 필수 항목·동의·글자 수·사진 검증 후 접수 번호 발급, 개인정보는 암호화 저장", async () => {
  const v = new Visitor();
  const base = await payload(v);
  const fail = async (over: any, code: string, field?: string) => {
    const r = await v.call("POST", "/submit", { ...base, ...over });
    assert.equal(r.error?.code, code, JSON.stringify(r.json)); if (field) assert.ok(r.error.fields?.[field], field);
  };
  await fail({ name: "김" }, "VALIDATION", "name");
  await fail({ phone: "02-123-4567" }, "VALIDATION", "phone");
  await fail({ memberClaimed: undefined }, "VALIDATION", "memberClaimed");
  await fail({ orderNumber: "" }, "VALIDATION", "orderNumber");
  await fail({ content: "너무 짧아요" }, "VALIDATION", "content");
  await fail({ content: "가".repeat(2001) }, "VALIDATION", "content");
  await fail({ rating: 0 }, "VALIDATION", "rating");
  await fail({ postalCode: "123" }, "VALIDATION", "postalCode");
  await fail({ consents: { PRIVACY_COLLECT: true, EVENT_PROCESSING: true, GIFT_SHIPPING: false } }, "CONSENT_REQUIRED", "consent_GIFT_SHIPPING");
  await fail({ consentVersion: "old" }, "CONSENT_VERSION");
  await fail({ images: { before: base.images.before } }, "IMAGES_REQUIRED", "imageAfter");
  await fail({ images: { before: base.images.before, after: { uploadId: base.images.after.uploadId, token: "x".repeat(32) } } }, "IMAGE_EXPIRED");
  await fail({ website: "http://spam" }, "VALIDATION");
  assert.equal(Number((await sql(`SELECT count(*) AS n FROM birthday_reviews`))[0].n), 0, "검증 실패 시 아무것도 저장되지 않아야 함");

  const ok = await v.call("POST", "/submit", { ...base, title: "<script>alert(1)</script> 좋아요", consents: { ...base.consents, MARKETING_USE: true } });
  assert.equal(ok.status, 201, JSON.stringify(ok.json));
  assert.match(ok.data.applicationNumber, /^BD\d{6}-\d{5}$/);
  assert.equal(ok.data.name, "김유니"); assert.equal(ok.data.rewards.participation.productName, "프로틴 쉐이크 1박스");
  const row = (await sql(`SELECT * FROM birthday_reviews WHERE application_number = $1`, [ok.data.applicationNumber]))[0];
  assert.equal(row.review_status, "PENDING"); assert.equal(row.is_test, false); assert.equal(row.image_marketing_consent, true);
  assert.equal(row.review_title, "<script>alert(1)</script> 좋아요", "입력값은 그대로 저장하고 화면에서 이스케이프한다");
  assert.ok(String(row.phone_enc).startsWith("v1.") && !String(row.phone_enc).includes(base.phone), "휴대폰 암호화");
  assert.ok(String(row.address_enc).startsWith("v1."), "주소 암호화");
  assert.equal(core.decrypt(row.phone_enc), base.phone); assert.equal(row.phone_last4, base.phone.slice(-4));
  assert.notEqual(row.phone_hash, base.phone); assert.ok(row.retention_until);
  const cons = await sql(`SELECT consent_type, agreed, version, agreed_at FROM birthday_review_consents WHERE review_id = $1 ORDER BY id`, [row.id]);
  assert.equal(cons.length, 4); assert.ok(cons.every((c: any) => c.agreed && c.version === base.consentVersion && c.agreed_at));
  const imgs = await sql(`SELECT image_type, upload_token_hash FROM birthday_review_images WHERE review_id = $1 ORDER BY image_type`, [row.id]);
  assert.deepEqual(imgs.map((i: any) => i.image_type), ["AFTER", "BEFORE"]); assert.ok(imgs.every((i: any) => i.upload_token_hash === null));
  // 같은 업로드를 다른 접수에 다시 쓸 수 없다
  const reuse = await v.call("POST", "/submit", { ...base, phone: nextPhone() });
  assert.equal(reuse.error.code, "IMAGE_EXPIRED");
});

test("중복 접수 방지: 같은 휴대폰(표기 달라도)·동시 요청 차단, 같은 주문번호는 관리자 확인 대상", async () => {
  const a = await submit();
  const v = new Visitor();
  const again = await v.call("POST", "/submit", await payload(v, { phone: a.phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3"), name: "다른이름" }));
  assert.equal(again.status, 409); assert.equal(again.error.code, "DUPLICATE");
  // 동시 접수 5건 → 1건만 성공
  const phone = nextPhone();
  const vs = await Promise.all(Array.from({ length: 5 }, async () => { const x = new Visitor(); return { x, p: await payload(x, { phone }) }; }));
  const rs = await together(vs.map(({ x, p }) => () => x.call("POST", "/submit", p)));
  assert.equal(rs.filter((r) => r.status === 201).length, 1, JSON.stringify(rs.map((r) => r.status)));
  assert.equal(rs.filter((r) => r.status === 409 && r.error.code === "DUPLICATE").length, 4);
  assert.equal(Number((await sql(`SELECT count(*) AS n FROM birthday_reviews WHERE phone_last4 = $1`, [phone.slice(-4)]))[0].n), 1);
  // 같은 주문번호·다른 번호 → 접수는 되지만 확인 대상
  const b = await submit({ orderNumber: a.p.orderNumber, memberLoginId: "other-id" });
  const fb = (await sql(`SELECT duplicate_flag, duplicate_reason FROM birthday_reviews WHERE id = $1`, [b.id]))[0];
  assert.equal(fb.duplicate_flag, true); assert.match(fb.duplicate_reason, /같은 주문번호/);
  assert.equal((await sql(`SELECT duplicate_flag FROM birthday_reviews WHERE id = $1`, [a.id]))[0].duplicate_flag, false);
});

test("사진 없이 참여: 기본은 불가, 관리자 설정으로 허용하면 가능", async () => {
  const v = new Visitor();
  const p = await payload(v, {}, false);
  assert.equal((await v.call("POST", "/submit", p)).error.code, "IMAGES_REQUIRED");
  assert.equal((await HQ.p("PATCH", "/event", { settings: { requireImages: false } })).status, 200);
  assert.equal((await v.call("GET", "/config")).data.requireImages, false);
  const ok = await v.call("POST", "/submit", p);
  assert.equal(ok.status, 201, JSON.stringify(ok.json));
  const list = await HQ.p("GET", "/reviews?photos=NONE");
  assert.ok(list.data.items.some((x: any) => x.applicationNumber === ok.data.applicationNumber && !x.hasBefore && !x.hasAfter));
  assert.equal((await HQ.p("PATCH", "/event", { settings: { requireImages: true } })).status, 200);
});

test("이벤트 기간·상태: 시작 전·종료·마감에는 접수 불가, 테스트 출처 접수는 운영 통계와 분리", async () => {
  const v = new Visitor();
  const p = await payload(v);
  await HQ.p("PATCH", "/event", { eventStatus: "CLOSED" });
  assert.equal((await v.call("POST", "/submit", p)).error.code, "EVENT_CLOSED");
  await HQ.p("PATCH", "/event", { eventStatus: "OPEN", startDate: new Date(Date.now() + 864e5).toISOString() });
  assert.equal((await v.call("GET", "/config")).data.phase, "UPCOMING");
  assert.equal((await v.call("POST", "/submit", p)).error.code, "EVENT_NOT_STARTED");
  await HQ.p("PATCH", "/event", { startDate: new Date(Date.now() - 2 * 864e5).toISOString(), endDate: new Date(Date.now() - 864e5).toISOString() });
  assert.equal((await v.call("POST", "/submit", p)).error.code, "EVENT_ENDED");
  assert.equal((await HQ.p("PATCH", "/event", { startDate: null, endDate: null })).data.phase, "OPEN");
  assert.equal((await HQ.p("PATCH", "/event", { settings: { minChars: 3000 } })).status, 400);

  const before = (await HQ.p("GET", "/dashboard")).data.cards.total;
  const t = new Visitor(); t.origin = "http://localhost:3100";
  const tr = await t.call("POST", "/submit", await payload(t));
  assert.equal(tr.status, 201, JSON.stringify(tr.json));
  const trow = (await sql(`SELECT id, is_test FROM birthday_reviews WHERE application_number = $1`, [tr.data.applicationNumber]))[0];
  assert.equal(trow.is_test, true);
  assert.equal((await HQ.p("GET", "/dashboard")).data.cards.total, before, "테스트 접수는 통계에 포함되지 않음");
  assert.ok(!(await HQ.p("GET", "/reviews")).data.items.some((x: any) => x.id === Number(trow.id)));
  assert.ok((await HQ.p("GET", "/reviews?test=only")).data.items.some((x: any) => x.id === Number(trow.id)));
  assert.equal((await HQ.p("POST", `/reviews/${trow.id}/status`, { status: "APPROVED" })).status, 200);
  assert.equal(Number((await sql(`SELECT count(*) AS n FROM birthday_review_rewards WHERE review_id = $1`, [trow.id]))[0].n), 0, "테스트 접수는 지급 대상이 되지 않음");
});

test("관리자 인증·권한: 미인증 거절, 역할별 접근 제어를 서버에서 검사, 총판은 자기 참여자만", async () => {
  const anon = new Admin();
  for (const path of ["/dashboard", "/reviews", "/rewards", "/winners", "/stats", "/reviews.xlsx", "/logs", "/event"]) assert.equal((await anon.p("GET", path)).status, 401, path);
  assert.equal((await new Admin("wrong-token-wrong-token-wrong-token").p("GET", "/reviews")).status, 401);
  assert.equal((await anon.p("POST", "/reviews/1/status", { status: "APPROVED" })).status, 401);
  assert.equal((await HQ.call("POST", "/admins", { email: "d0@test.example", name: "총판", role: "DISTRIBUTOR" })).status, 400, "총판 관리자는 총판 코드 필수");
  OPS = await roleAdmin("ops@test.example", "운영담당", "PROMO_MANAGER");
  DIST = await roleAdmin("dist@test.example", "서울총판", "DISTRIBUTOR", "seoul-01");
  VIEWER = await roleAdmin("viewer@test.example", "조회전용", "VIEWER");
  assert.equal((await HQ.call("POST", "/admins", { email: "x@test.example", name: "x", role: "SEMINAR_MANAGER" })).status, 400, "없는 역할");

  const mine = await submit({ distributorCode: "seoul-01", name: "총판고객" });
  const other = await submit({ distributorCode: "BUSAN-02", name: "타총판고객" });
  const direct = await submit({ name: "직접유입" });

  assert.equal((await OPS.call("GET", "/admins")).status, 403, "계정 관리는 본사 최고 관리자만");
  assert.equal((await DIST.call("POST", "/admins", { email: "y@test.example", name: "y", role: "SUPER" })).status, 403);

  const me = (await DIST.p("GET", "/me")).data;
  assert.equal(me.distributorCode, "SEOUL-01"); assert.deepEqual(me.perms, ["promo.read"]);
  const dl = (await DIST.p("GET", "/reviews")).data;
  assert.equal(dl.total, 1); assert.equal(dl.items[0].id, mine.id);
  assert.equal(dl.items[0].name, "총**객", "총판에게 이름은 가려서 표시"); assert.match(dl.items[0].phone, /^010-\*\*\*\*-\d{4}$/);
  assert.equal((await DIST.p("GET", "/reviews?distributor=BUSAN-02")).data.total, 1, "필터를 바꿔도 자기 총판 범위를 벗어나지 못함");
  assert.equal((await DIST.p("GET", "/reviews?distributor=BUSAN-02")).data.items[0].id, mine.id);
  assert.equal((await DIST.p("GET", `/reviews/${other.id}`)).status, 404, "URL 로 다른 총판 참여자 직접 접근 불가");
  assert.equal((await DIST.p("GET", `/reviews/${direct.id}`)).status, 404);
  const dd = (await DIST.p("GET", `/reviews/${mine.id}`)).data;
  assert.equal(dd.customer.address, "(권한 없음)"); assert.equal(dd.imagesHidden, true); assert.ok(dd.images.every((i: any) => i.url === null));
  assert.equal(dd.review.content, CONTENT);
  assert.equal((await DIST.p("GET", "/dashboard")).data.cards.total, 1);
  assert.deepEqual((await DIST.p("GET", "/stats")).data.byDistributor.map((x: any) => x.code), ["SEOUL-01"]);
  for (const [m, p, b] of [["POST", `/reviews/${mine.id}/status`, { status: "APPROVED" }], ["POST", "/winners", { reviewId: mine.id, note: "x" }], ["GET", "/reviews.xlsx", undefined],
    ["PATCH", "/event", { eventStatus: "CLOSED" }], ["POST", `/reviews/${mine.id}/purge`, { reason: "x" }], ["GET", "/logs", undefined], ["POST", "/rewards/issue-participation", {}]] as const)
    assert.equal((await DIST.p(m, p, b)).status, 403, `총판 ${m} ${p}`);

  assert.equal((await VIEWER.p("GET", "/reviews")).data.total >= 3, true);
  assert.equal((await VIEWER.p("POST", `/reviews/${mine.id}/status`, { status: "APPROVED" })).status, 403);
  assert.equal((await VIEWER.p("GET", `/reviews/${mine.id}`)).data.customer.phone.includes("****"), true);

  const od = (await OPS.p("GET", `/reviews/${mine.id}`)).data;
  assert.equal(od.customer.name, "총판고객"); assert.equal(od.customer.phone.replace(/-/g, ""), mine.phone); assert.match(od.customer.address, /양재대로/);
  assert.equal((await OPS.p("POST", `/reviews/${mine.id}/status`, { status: "APPROVED" })).status, 200);
  for (const [m, p, b] of [["POST", "/winners", { reviewId: mine.id, note: "x" }], ["GET", "/reviews.xlsx", undefined], ["PATCH", "/event", { eventStatus: "CLOSED" }],
    ["PATCH", `/reviews/${mine.id}`, { name: "바꿈", reason: "x" }], ["POST", `/reviews/${mine.id}/purge`, { reason: "x" }]] as const)
    assert.equal((await OPS.p(m, p, b)).status, 403, `운영 ${m} ${p}`);
  // 변경 요청에 CSRF 헤더가 없으면 거절
  const noCsrf = await admin(new Request(`https://api.example.test/birthday-review/admin/promo/reviews/${mine.id}/status`, { method: "POST", headers: { origin: SITE, authorization: "Bearer " + HQ.bearer, "content-type": "application/json" }, body: "{}" }));
  assert.equal(noCsrf.status, 403);
  const badOrigin = await admin(new Request(`https://api.example.test/birthday-review/admin/promo/reviews/${mine.id}/status`, { method: "POST", headers: { origin: "https://evil.example", authorization: "Bearer " + HQ.bearer, "x-br-csrf": "1", "content-type": "application/json" }, body: "{}" }));
  assert.equal(badOrigin.status, 403); assert.equal(badOrigin.headers.get("access-control-allow-origin"), null);
  assert.ok((await sql(`SELECT 1 FROM promotion_admin_logs WHERE action_type = 'review.view_pii' AND target_id = $1 AND admin_id IS NOT NULL`, [String(mine.id)])).length, "개인정보 열람 기록");
});

test("사진 접근: 비공개 저장, 서명 URL 로만 열람(위조·만료·변조 거절), 원본 내려받기", async () => {
  const a = await submit();
  const d = (await HQ.p("GET", `/reviews/${a.id}`)).data;
  assert.equal(d.images.length, 2);
  const before = d.images.find((i: any) => i.type === "BEFORE");
  const path = before.url.replace(/^\/admin/, "");
  const anon = new Admin();
  const got = await anon.call("GET", path);      // 서명만으로 열림(img 태그용) — 로그인 쿠키·키 없이도
  assert.equal(got.status, 200); assert.equal(got.headers.get("content-type"), "image/jpeg");
  assert.match(got.headers.get("cache-control") || "", /no-store/); assert.equal(got.headers.get("x-content-type-options"), "nosniff");
  assert.ok(got.bytes[0] === 0xff && got.bytes[1] === 0xd8);
  assert.match(got.headers.get("content-disposition") || "", new RegExp(`inline; filename="${a.no}_BEFORE.jpg"`));
  const dl = await anon.call("GET", before.downloadUrl.replace(/^\/admin/, ""));
  assert.match(dl.headers.get("content-disposition") || "", /^attachment/);
  const id = before.id;
  assert.equal((await anon.call("GET", `/promo/images/${id}/file`)).status, 403, "서명 없이 접근 불가");
  assert.equal((await anon.call("GET", path.replace(/sig=.{6}/, "sig=AAAAAA"))).status, 403, "서명 위조");
  assert.equal((await anon.call("GET", path.replace(`/images/${id}/`, `/images/${id + 1}/`))).status, 403, "다른 사진 번호에 서명 재사용");
  assert.equal((await anon.call("GET", path + "&dl=1")).status, 403, "옵션 변조");
  const exp = Number(new URL("https://x" + path).searchParams.get("exp"));
  assert.equal((await anon.call("GET", path.replace("exp=" + exp, "exp=" + (exp + 9999)))).status, 403, "유효기간 변조");
  const st = await import("../src/storage.ts");
  const old = st.signedImagePath(id, false, Date.now() - 6 * 60e3).replace(/^\/admin/, "");
  assert.equal((await anon.call("GET", old)).status, 403, "만료된 링크");
  assert.equal((await pub(new Request("https://api.example.test/birthday-review/public/uploads/" + id, { headers: { origin: SITE } }))).status, 404, "공개 API 로는 사진을 볼 수 없음");
});

let W: { id: number; no: string; phone: string }[] = [];
test("후기 검토: 승인 시 참가 보상(프로틴 쉐이크) 자동 등록(1건만), 반려·수정 요청, 변경 이력·담당자 기록", async () => {
  const a = await submit();
  assert.equal((await HQ.p("POST", `/reviews/${a.id}/status`, { status: "REJECTED" })).status, 400, "반려 사유 필수");
  const ap = await HQ.p("POST", `/reviews/${a.id}/status`, { status: "APPROVED" });
  assert.equal(ap.status, 200);
  assert.equal((await HQ.p("POST", `/reviews/${a.id}/status`, { status: "REJECTED", reason: "x", version: 1 })).status, 409, "오래된 화면에서의 변경은 거절");
  let rw = await sql(`SELECT * FROM birthday_review_rewards WHERE review_id = $1`, [a.id]);
  assert.equal(rw.length, 1); assert.equal(rw[0].reward_type, "PARTICIPATION"); assert.equal(rw[0].reward_status, "ELIGIBLE");
  assert.equal(rw[0].product_name, "프로틴 쉐이크 1박스"); assert.equal(rw[0].recipient_name, "김유니"); assert.equal(core.decrypt(rw[0].recipient_phone_enc), a.phone);
  // 승인 반복·일괄 지급 등록을 여러 번 해도 1건
  await HQ.p("POST", `/reviews/${a.id}/status`, { status: "APPROVED" });
  await HQ.p("POST", "/rewards/issue-participation", {}); await HQ.p("POST", "/rewards/issue-participation", {});
  assert.equal(Number((await sql(`SELECT count(*) AS n FROM birthday_review_rewards WHERE review_id = $1`, [a.id]))[0].n), 1);
  // 반려 → 보상 취소, 재승인 → 다시 지급 대상
  assert.equal((await OPS.p("POST", `/reviews/${a.id}/status`, { status: "REJECTED", reason: "타 제품 사진" })).status, 200);
  assert.equal((await sql(`SELECT reward_status FROM birthday_review_rewards WHERE review_id = $1`, [a.id]))[0].reward_status, "CANCELED");
  assert.equal((await HQ.p("POST", `/reviews/${a.id}/status`, { status: "APPROVED" })).status, 200);
  rw = await sql(`SELECT reward_status FROM birthday_review_rewards WHERE review_id = $1`, [a.id]);
  assert.equal(rw.length, 1); assert.equal(rw[0].reward_status, "ELIGIBLE");
  const d = (await HQ.p("GET", `/reviews/${a.id}`)).data;
  const hist = d.logs.filter((l: any) => l.action === "review.status");
  assert.equal(hist.length, 3); assert.equal(hist[1].reason, "타 제품 사진"); assert.equal(hist[1].actor, "운영담당 (프로모션 운영 담당)");
  assert.deepEqual([hist[1].previous.status, hist[1].next.status], ["APPROVED", "REJECTED"]);

  // 수정 요청 → 참여자가 다시 제출 → 검토 대기
  const b = await submit();
  assert.equal((await HQ.p("POST", `/reviews/${b.id}/status`, { status: "REVISION_REQUESTED", reason: "사용 후 사진이 흐립니다. 다시 올려 주세요." })).status, 200);
  const look = await b.v.call("POST", "/lookup", { applicationNumber: b.no, phone: b.phone });
  assert.equal(look.data.canRevise, true); assert.match(look.data.statusReason, /흐립니다/); assert.equal(look.data.review.title, "피부가 달라졌어요");
  assert.equal((await b.v.call("POST", "/lookup", { applicationNumber: b.no, phone: "01099998888" })).status, 404, "휴대폰 번호가 다르면 조회 불가");
  const newAfter = await b.v.upload("AFTER", jpeg(1000, 800, 4242));
  const rev = await b.v.call("POST", "/revise", { applicationNumber: b.no, phone: b.phone, title: "다시 씁니다", content: CONTENT + " 사진을 다시 찍어 올립니다.", rating: 4, images: { after: newAfter } });
  assert.equal(rev.status, 200, JSON.stringify(rev.json)); assert.equal(rev.data.reviewStatus, "PENDING");
  assert.equal(Number((await sql(`SELECT count(*) AS n FROM birthday_review_images WHERE review_id = $1 AND deleted_at IS NULL`, [b.id]))[0].n), 2);
  assert.equal((await sql(`SELECT width FROM birthday_review_images WHERE review_id = $1 AND image_type = 'AFTER' AND deleted_at IS NULL`, [b.id]))[0].width, 1000);
  assert.equal((await b.v.call("POST", "/revise", { applicationNumber: b.no, phone: b.phone, title: "또 수정", content: CONTENT, rating: 4 })).error.code, "NOT_REVISABLE");

  // 메모·후보
  assert.equal((await OPS.p("POST", `/reviews/${a.id}/memo`, { memo: "사진 선명, 후보 검토" })).status, 200);
  assert.equal((await HQ.p("GET", `/reviews/${a.id}`)).data.adminMemo, "사진 선명, 후보 검토");
  assert.equal((await OPS.p("POST", `/reviews/${b.id}/candidate`, { on: true })).status, 409, "승인 전에는 후보 등록 불가");
  assert.equal((await OPS.p("POST", `/reviews/${a.id}/candidate`, { on: true })).status, 200);
  assert.ok((await HQ.p("GET", "/winners")).data.candidates.some((x: any) => x.id === a.id));
});

test("우수 후기 3명 선정: 인원·순위 제한, 동시 선정에도 3명 초과 불가, 추가 보상(벌스데이 크림) 자동 부여, 취소·확정", async () => {
  const list = [];
  for (let i = 0; i < 5; i++) { const x = await submit({ name: "우수후기" + (i + 1), rating: 5 }); assert.equal((await HQ.p("POST", `/reviews/${x.id}/status`, { status: "APPROVED" })).status, 200); list.push(x); }
  const pending = await submit();
  assert.equal((await HQ.p("POST", "/winners", { reviewId: pending.id, note: "좋음" })).error.code, "NOT_APPROVED");
  assert.equal((await HQ.p("POST", "/winners", { reviewId: list[0].id })).status, 400, "선정 사유 필수");
  // 확인 대상(중복 의심)은 확인 전 선정 불가
  await sql(`UPDATE birthday_reviews SET duplicate_flag = true, duplicate_reason = '시험' WHERE id = $1`, [list[4].id]);
  assert.equal((await HQ.p("POST", "/winners", { reviewId: list[4].id, note: "좋음" })).error.code, "FLAGGED");
  assert.equal((await OPS.p("POST", `/reviews/${list[4].id}/flag`, { action: "CLEAR", reason: "가족 구매로 확인" })).status, 200);

  const w1 = await HQ.p("POST", "/winners", { reviewId: list[0].id, note: "변화 과정이 구체적" });
  assert.equal(w1.status, 201); assert.equal(w1.data.rank, 1);
  assert.equal((await HQ.p("POST", "/winners", { reviewId: list[0].id, note: "중복" })).error.code, "DUPLICATE");
  assert.equal((await HQ.p("POST", "/winners", { reviewId: list[1].id, note: "x", rank: 1 })).error.code, "RANK_TAKEN");
  assert.equal((await HQ.p("POST", "/winners", { reviewId: list[1].id, note: "x", rank: 9 })).status, 400);
  // 남은 2자리를 4건이 동시에 노림 → 정확히 2건만 성공
  const race = await together([list[1], list[2], list[3], list[4]].map((x) => () => HQ.p("POST", "/winners", { reviewId: x.id, note: "동시 선정" })));
  assert.equal(race.filter((r) => r.status === 201).length, 2, JSON.stringify(race.map((r) => r.error?.code || r.status)));
  assert.equal(race.filter((r) => r.error?.code === "FULL").length, 2);
  const ws = (await HQ.p("GET", "/winners")).data;
  assert.equal(ws.selected, 3); assert.deepEqual(ws.winners.map((x: any) => x.winner.rank), [1, 2, 3]);
  // 선정자: 프로틴 쉐이크 + 벌스데이 크림
  for (const x of ws.winners) {
    const rw = await sql(`SELECT reward_type, reward_status, product_name FROM birthday_review_rewards WHERE review_id = $1 ORDER BY reward_type`, [x.id]);
    assert.deepEqual(rw.map((r: any) => [r.reward_type, r.reward_status]), [["PARTICIPATION", "ELIGIBLE"], ["WINNER", "ELIGIBLE"]]);
    assert.equal(rw[1].product_name, "UNI&CORE 1ST BIRTHDAY CREAM 50g");
  }
  // 순위 바꾸기
  assert.equal((await HQ.p("POST", `/winners/${ws.winners[2].winner.id}/rank`, { rank: 1 })).status, 200);
  const ws2 = (await HQ.p("GET", "/winners")).data;
  assert.equal(ws2.winners[0].id, ws.winners[2].id); assert.equal(ws2.winners[2].id, ws.winners[0].id);
  // 선정된 후기는 반려 불가
  assert.equal((await HQ.p("POST", `/reviews/${ws2.winners[0].id}/status`, { status: "REJECTED", reason: "x" })).error.code, "IS_WINNER");
  // 취소 → 크림 보상 취소, 프로틴 쉐이크는 유지 → 다른 후기 선정
  const out = ws2.winners[1];
  assert.equal((await HQ.p("POST", `/winners/${out.winner.id}/cancel`, {})).status, 400, "취소 사유 필수");
  assert.equal((await HQ.p("POST", "/winners/confirm", {})).status === 200, true);
  assert.equal((await HQ.p("POST", `/winners/${out.winner.id}/cancel`, { reason: "본인 요청" })).error.code, "CONFIRMED", "확정 후에는 변경 불가");
  assert.equal((await HQ.p("POST", "/winners/confirm", { undo: true, reason: "재심사" })).data.confirmed, false);
  assert.equal((await HQ.p("POST", `/winners/${out.winner.id}/cancel`, { reason: "본인 요청" })).status, 200);
  const rwOut = await sql(`SELECT reward_type, reward_status FROM birthday_review_rewards WHERE review_id = $1 ORDER BY reward_type`, [out.id]);
  assert.deepEqual(rwOut.map((r: any) => [r.reward_type, r.reward_status]), [["PARTICIPATION", "ELIGIBLE"], ["WINNER", "CANCELED"]]);
  assert.equal((await HQ.p("POST", "/winners/confirm", {})).error.code, "COUNT", "3명이 차야 확정 가능");
  const rest = list.find((x) => !ws.winners.some((w: any) => w.id === x.id) )!;
  assert.equal((await HQ.p("POST", "/winners", { reviewId: rest.id, note: "보결 선정" })).status, 201);
  assert.equal((await HQ.p("POST", "/winners/confirm", {})).data.confirmed, true);
  const fin = (await HQ.p("GET", "/winners")).data;
  assert.equal(fin.confirmed, true); assert.equal(fin.winners.length, 3);
  W = fin.winners.map((x: any) => ({ id: x.id, no: x.applicationNumber, phone: list.find((l) => l.id === x.id)!.phone }));
  // 참여자 조회: 확정 후에만 당첨 사실이 보인다
  const lk = await new Visitor().call("POST", "/lookup", { applicationNumber: W[0].no, phone: W[0].phone });
  assert.equal(lk.data.isWinner, true); assert.equal(lk.data.rewards.length, 2);
  // 설정: 이미 3명 선정된 상태에서 인원을 2로 줄일 수 없다
  assert.equal((await HQ.p("PATCH", "/event", { settings: { winnerCount: 2 } })).error.code, "WINNERS_EXCEED");
});

test("사은품 지급: 상태 흐름·배송 정보·운송장 필수, 같은 처리 반복·동시 처리에도 중복 지급 없음", async () => {
  const all = (await HQ.p("GET", "/rewards?limit=500")).data;
  const shake = all.items.find((x: any) => x.reviewId === W[0].id && x.type === "PARTICIPATION");
  const cream = all.items.find((x: any) => x.reviewId === W[0].id && x.type === "WINNER");
  assert.ok(shake && cream); assert.equal(shake.recipientName, "우수후기" + shake.recipientName.slice(-1));
  assert.match(shake.address, /양재대로/); assert.deepEqual(shake.nextStatuses.slice(0, 2), ["PREPARING", "SHIP_READY"]);
  const step = (id: number, status: string, extra: any = {}) => OPS.p("POST", `/rewards/${id}/status`, { status, ...extra });
  assert.equal((await step(shake.id, "DELIVERED")).error.code, "BAD_TRANSITION", "단계를 건너뛸 수 없음");
  assert.equal((await step(shake.id, "PREPARING")).status, 200);
  assert.equal((await step(shake.id, "SHIP_READY")).status, 200);
  assert.equal((await step(shake.id, "SHIPPING")).error.code, "NO_TRACKING");
  assert.equal((await OPS.p("PATCH", `/rewards/${shake.id}`, { carrier: "CJ대한통운", trackingNumber: "6123-4567-8901", note: "문 앞" })).status, 200);
  const sh = await step(shake.id, "SHIPPING");
  assert.equal(sh.status, 200); assert.ok(sh.data.shippedAt); assert.equal(sh.data.trackingNumber, "6123-4567-8901");
  // 지급 완료를 동시에 5번 누름 → 1번만 처리
  const dup = await together(Array.from({ length: 5 }, () => () => step(shake.id, "DELIVERED")));
  assert.equal(dup.filter((r) => r.status === 200).length, 1, JSON.stringify(dup.map((r) => r.error?.code || r.status)));
  assert.ok(dup.filter((r) => r.status !== 200).every((r) => ["SAME_STATUS", "BAD_TRANSITION"].includes(r.error.code)));
  assert.equal(Number((await sql(`SELECT count(*) AS n FROM promotion_admin_logs WHERE action_type = 'reward.status' AND target_id = $1 AND new_value->>'status' = 'DELIVERED'`, [String(shake.id)]))[0].n), 1);
  const done = (await sql(`SELECT * FROM birthday_review_rewards WHERE id = $1`, [shake.id]))[0];
  assert.equal(done.reward_status, "DELIVERED"); assert.ok(done.delivered_at);
  assert.equal((await OPS.p("PATCH", `/rewards/${shake.id}`, { note: "수정" })).error.code, "LOCKED");
  assert.equal((await step(shake.id, "SHIPPING", { reason: "오입력" })).error.code, "BAD_TRANSITION", "지급 완료 되돌리기는 본사만");
  // DB 차원: 후기 1건에 같은 보상 2행 불가
  await assert.rejects(sql(`INSERT INTO birthday_review_rewards (event_id, review_id, reward_type, product_name) SELECT event_id, review_id, reward_type, product_name FROM birthday_review_rewards WHERE id = $1`, [shake.id]), /duplicate key/);
  // 벌스데이 크림: 일괄 처리(선택 3건) → 배송 준비까지
  const creams = all.items.filter((x: any) => x.type === "WINNER" && W.some((w) => w.id === x.reviewId));
  assert.equal(creams.length, 3);
  const bulk = await OPS.p("POST", "/rewards/bulk-status", { ids: [...creams.map((x: any) => x.id), shake.id], status: "PREPARING" });
  assert.equal(bulk.data.done, 3); assert.equal(bulk.data.failed, 1, "이미 완료된 건은 건너뜀");
  assert.equal((await step(cream.id, "SHIP_READY")).status, 200);
  assert.equal((await step(cream.id, "SHIPPING", { carrier: "한진택배", trackingNumber: "5550001111" })).status, 200);
  // 발송된 사은품이 있으면 후기 반려·선정 취소가 막힌다
  await HQ.p("POST", "/winners/confirm", { undo: true, reason: "시험" });
  const wid = (await HQ.p("GET", "/winners")).data.winners.find((x: any) => x.id === W[0].id).winner.id;
  assert.equal((await HQ.p("POST", `/winners/${wid}/cancel`, { reason: "시험" })).error.code, "REWARD_SHIPPED");
  await HQ.p("POST", "/winners/confirm", {});
  assert.equal((await step(cream.id, "DELIVERED")).status, 200);
  // 보류·취소는 사유 필수, 취소 되돌리기는 본사만
  const other = creams.find((x: any) => x.id !== cream.id);
  assert.equal((await step(other.id, "ON_HOLD")).status, 400);
  assert.equal((await step(other.id, "ON_HOLD", { reason: "주소 확인 중" })).status, 200);
  assert.equal((await step(other.id, "PREPARING")).status, 200);
  // 대시보드 카드
  const c = (await HQ.p("GET", "/dashboard")).data.cards;
  assert.equal(c.winners, 3); assert.equal(c.winnersConfirmed, true); assert.equal(c.creamDelivered, 1); assert.equal(c.creamWaiting, 2);
  assert.equal(c.shakeDelivered, 1); assert.ok(c.shakeWaiting >= 3); assert.ok(c.total >= c.photosDone); assert.ok(c.today >= 1);
  const lk = await new Visitor().call("POST", "/lookup", { applicationNumber: W[0].no, phone: W[0].phone });
  assert.deepEqual(lk.data.rewards.map((r: any) => r.status), ["DELIVERED", "DELIVERED"]); assert.equal(lk.data.rewards[0].trackingNumber, "6123-4567-8901");
});

test("검색·필터·엑셀: 이름·휴대폰·접수번호·주문번호·날짜·상태·사진·지급 상태, 엑셀은 권한자만", async () => {
  const a = await submit({ name: "홍길순", orderNumber: "UNI-778899-AB", memberClaimed: false, rating: 3 });
  const find = async (qs: string) => (await HQ.p("GET", "/reviews?" + qs)).data;
  assert.equal((await find("q=" + encodeURIComponent("홍길순"))).items[0].id, a.id);
  assert.equal((await find("q=" + a.phone)).total, 1);
  assert.equal((await find("q=" + encodeURIComponent(a.phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")))).total, 1);
  assert.equal((await find("q=" + a.no)).total, 1);
  assert.equal((await find("q=778899")).items[0].id, a.id);
  assert.equal((await find("q=" + encodeURIComponent("%"))).total, 0, "와일드카드 문자는 글자 그대로 검색");
  assert.equal((await find("q=" + encodeURIComponent("' OR 1=1 --"))).total, 0, "SQL 주입 무해화");
  const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  assert.ok((await find(`from=${today}&to=${today}`)).total >= 1); assert.equal((await find("from=2030-01-01")).total, 0);
  assert.ok((await find("member=N")).items.every((x: any) => !x.memberClaimed));
  assert.ok((await find("status=PENDING")).items.every((x: any) => x.reviewStatus === "PENDING"));
  assert.equal((await find("winner=Y")).total, 3);
  assert.ok((await find("photos=BOTH")).items.every((x: any) => x.hasBefore && x.hasAfter));
  assert.ok((await find("rewardStatus=DELIVERED")).total >= 1);
  assert.equal((await find("rewardStatus=DELIVERED&rewardType=WINNER")).total, 1);
  assert.ok((await find("flag=Y")).items.every((x: any) => x.flagged));
  assert.equal((await find("rating=3")).items[0].id, a.id);
  assert.equal((await find("limit=2")).items.length, 2);
  const x = await HQ.p("GET", "/reviews.xlsx?q=" + encodeURIComponent("홍길순"));
  assert.equal(x.status, 200); assert.match(x.headers.get("content-type") || "", /spreadsheetml/); assert.match(x.headers.get("content-disposition") || "", /birthday-review-.*\.xlsx/);
  const XLSX = await import("xlsx");
  const rows: any[] = XLSX.utils.sheet_to_json(XLSX.read(x.bytes, { type: "buffer" }).Sheets["후기 이벤트 참여자"]);
  assert.equal(rows.length, 1); assert.equal(rows[0]["이름"], "홍길순"); assert.equal(String(rows[0]["휴대폰"]).replace(/-/g, ""), a.phone); assert.equal(rows[0]["주문번호·구매정보"], "UNI-778899-AB");
  assert.equal(rows[0]["검토 상태"], "검토 대기"); assert.equal(rows[0]["사용 전 사진"], "제출");
  assert.ok((await sql(`SELECT 1 FROM promotion_admin_logs WHERE action_type = 'export.reviews'`)).length, "내보내기 기록");
  // 수식 주입 방지
  await sql(`UPDATE birthday_reviews SET review_title = '=HYPERLINK("http://evil","x")' WHERE id = $1`, [a.id]);
  const x2 = await HQ.p("GET", "/reviews.xlsx?q=" + a.no);
  const r2: any[] = XLSX.utils.sheet_to_json(XLSX.read(x2.bytes, { type: "buffer" }).Sheets["후기 이벤트 참여자"]);
  assert.ok(String(r2[0]["후기 제목"]).startsWith("'="));
  const st = (await HQ.p("GET", "/stats")).data;
  assert.ok(st.totals.total >= 10); assert.ok(st.daily.length >= 1); assert.ok(st.byRating.some((r: any) => r.key === "5"));
  assert.ok(st.byDistributor.some((d: any) => d.code === "SEOUL-01") && st.byDistributor.some((d: any) => d.code === "(직접 유입)"));
});

test("참여자 정보 수정·재참여 예외 승인·개인정보 파기", async () => {
  const a = await submit({ name: "수정대상" });
  await HQ.p("POST", `/reviews/${a.id}/status`, { status: "APPROVED" });
  assert.equal((await HQ.p("PATCH", `/reviews/${a.id}`, { name: "수정완료" })).status, 400, "수정 사유 필수");
  const newPhone = nextPhone();
  assert.equal((await HQ.p("PATCH", `/reviews/${a.id}`, { name: "수정완료", phone: newPhone, address: "부산 해운대구 센텀로 1\n101호", postalCode: "48058", reason: "고객 요청(번호 변경)" })).status, 200);
  const d = (await HQ.p("GET", `/reviews/${a.id}`)).data;
  assert.equal(d.customer.name, "수정완료"); assert.equal(d.customer.phone.replace(/-/g, ""), newPhone); assert.match(d.customer.address, /센텀로/);
  assert.match(d.rewards[0].address, /센텀로/, "발송 전 사은품의 수령 정보도 함께 갱신"); assert.equal(d.rewards[0].recipientName, "수정완료");
  assert.ok(d.logs.some((l: any) => l.action === "review.edit" && l.reason === "고객 요청(번호 변경)"));
  const b = await submit();
  assert.equal((await HQ.p("PATCH", `/reviews/${a.id}`, { phone: b.phone, reason: "x" })).error.code, "DUPLICATE");

  // 재참여 예외 승인
  const v = new Visitor();
  const again = await payload(v, { phone: b.phone });
  assert.equal((await v.call("POST", "/submit", again)).error.code, "DUPLICATE");
  assert.equal((await OPS.p("POST", "/reentries", { phone: b.phone, reason: "x" })).status, 403);
  assert.equal((await HQ.p("POST", "/reentries", { phone: nextPhone(), reason: "x" })).error.code, "NO_PRIOR");
  assert.equal((await HQ.p("POST", "/reentries", { phone: b.phone, reason: "1차 접수 사진 오류로 재참여 허용" })).status, 201);
  const re = await v.call("POST", "/submit", again);
  assert.equal(re.status, 201, JSON.stringify(re.json));
  const rr = (await sql(`SELECT entry_no, duplicate_flag, duplicate_reason FROM birthday_reviews WHERE application_number = $1`, [re.data.applicationNumber]))[0];
  assert.equal(rr.entry_no, 2); assert.equal(rr.duplicate_flag, true); assert.match(rr.duplicate_reason, /예외 승인/);
  const v3 = new Visitor();
  assert.equal((await v3.call("POST", "/submit", await payload(v3, { phone: b.phone }))).error.code, "DUPLICATE", "예외 승인은 1회용");
  assert.ok((await HQ.p("GET", "/reentries")).data[0].usedApplicationNumber);
  assert.ok((await HQ.p("GET", `/reviews/${b.id}`)).data.related.some((x: any) => x.samePhone));

  // 개별 파기
  const paths = (await sql(`SELECT storage_path FROM birthday_review_images WHERE review_id = $1`, [b.id])).map((x: any) => x.storage_path);
  assert.ok(paths.every((p: string) => files.has(p)));
  assert.equal((await HQ.p("POST", `/reviews/${b.id}/purge`, {})).status, 400);
  assert.equal((await HQ.p("POST", `/reviews/${b.id}/purge`, { reason: "본인 삭제 요청" })).status, 200);
  const pr = (await sql(`SELECT * FROM birthday_reviews WHERE id = $1`, [b.id]))[0];
  for (const k of ["applicant_name", "phone_enc", "phone_hash", "phone_last4", "order_number", "address_enc", "member_login_id", "ip_hash"]) assert.equal(pr[k], null, k);
  assert.equal(pr.review_content, "(파기됨)"); assert.ok(pr.purged_at);
  assert.ok(paths.every((p: string) => !files.has(p)), "사진 파일도 삭제");
  assert.equal((await HQ.p("GET", `/reviews/${b.id}`)).data.images.length, 0);
  assert.equal((await b.v.call("POST", "/lookup", { applicationNumber: b.no, phone: b.phone })).status, 404);
  assert.ok(!(await HQ.p("GET", "/reviews?limit=200")).data.items.some((x: any) => x.id === b.id), "기본 목록에서 제외");
  // 지급 진행 중이면 파기 불가
  const rid = (await sql(`SELECT id FROM birthday_review_rewards WHERE review_id = $1`, [a.id]))[0].id;
  await OPS.p("POST", `/rewards/${rid}/status`, { status: "PREPARING" });
  assert.equal((await HQ.p("POST", `/reviews/${a.id}/purge`, { reason: "x" })).error.code, "REWARD_IN_PROGRESS");
  assert.equal((await HQ.p("POST", `/reviews/${W[0].id}/purge`, { reason: "x" })).error.code, "IS_WINNER");
  // 보유 기간 만료 일괄 파기
  const c = await submit({ name: "만료대상" });
  await sql(`UPDATE birthday_reviews SET retention_until = '2020-01-01' WHERE id = $1`, [c.id]);
  assert.equal((await HQ.p("GET", "/retention")).data.expired, 1);
  assert.deepEqual((await HQ.p("POST", "/retention/purge-expired", { dryRun: true })).data, { expired: 1, purged: 0 });
  assert.equal((await HQ.p("POST", "/retention/purge-expired", {})).data.purged, 1);
  assert.ok((await sql(`SELECT purged_at FROM birthday_reviews WHERE id = $1`, [c.id]))[0].purged_at);
  const logs = (await HQ.p("GET", "/logs?action=review.purge")).data;
  assert.ok(logs.length >= 2 && logs.some((l: any) => l.reason === "보유 기간 만료"));
});

test("관리자 계정 관리: 역할 변경·비활성화 시 세션 무효, 본인 권한 하향 불가, 비밀번호 변경", async () => {
  const admins = (await HQ.call("GET", "/admins")).data;
  const dist = admins.find((a: any) => a.role === "DISTRIBUTOR");
  assert.equal(dist.distributorCode, "SEOUL-01"); assert.equal(dist.roleLabel, "총판 관리자");
  assert.ok(admins.every((a: any) => a.password_hash === undefined && a.totp_secret_enc === undefined), "목록에 비밀값 없음");
  const meId = admins.find((a: any) => a.role === "SUPER").id;
  assert.equal((await HQ.call("PATCH", "/admins/" + meId, { role: "VIEWER" })).error.code, "SELF");
  assert.equal((await DIST.p("GET", "/reviews")).status, 200);
  assert.equal((await HQ.call("PATCH", "/admins/" + dist.id, { active: false, reason: "계약 종료" })).status, 200);
  assert.equal((await DIST.p("GET", "/reviews")).status, 401, "비활성화 즉시 세션 무효");
  const viewer = admins.find((a: any) => a.email === "viewer@test.example");
  assert.equal((await HQ.call("PATCH", "/admins/" + viewer.id, { role: "PROMO_MANAGER" })).status, 200);
  assert.equal((await VIEWER.p("GET", "/reviews")).status, 401, "역할이 바뀌면 다시 로그인");
  assert.equal((await OPS.call("POST", "/password", { currentPassword: "wrong", newPassword: "NewPassword2026x!" })).status, 401);
  assert.equal((await OPS.call("POST", "/password", { currentPassword: "x", newPassword: "short" })).status, 401);
});
