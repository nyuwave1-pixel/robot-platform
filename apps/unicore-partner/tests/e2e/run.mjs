/**
 * UNI&CORE PARTNER E2E — 실제 Supabase 프로젝트와 실제 브라우저로 전체 흐름을 검사한다.
 *
 * 필요: 서버(next start -p 3300) 실행 중, 테스트 계정 3개(사업자 A·B, 본사 관리자)
 *   E2E_A_EMAIL / E2E_B_EMAIL / E2E_HQ_EMAIL / E2E_PASSWORD 환경 변수
 * 테스트가 만든 페이지·사진은 끝에서 지운다. 계정 삭제는 DB 관리 도구로 한다.
 *
 *   NODE_PATH=$(npm root -g) E2E_A_EMAIL=… E2E_B_EMAIL=… E2E_HQ_EMAIL=… E2E_PASSWORD=… node tests/e2e/run.mjs [screenshot-dir]
 */
import { createRequire } from "node:module";
const { chromium, devices } = createRequire(import.meta.url)("playwright");
import fs from "node:fs";

const BASE = process.env.BASE ?? "http://127.0.0.1:3300";
const SB = process.env.SUPABASE_URL ?? "https://qeabsjyglethzkwlkmaw.supabase.co";
const KEY = process.env.SUPABASE_KEY ?? "sb_publishable_JfbgxhQtx1cnSIdEmXPDvA_3tg9pk0-";
const { E2E_A_EMAIL: A, E2E_B_EMAIL: B, E2E_HQ_EMAIL: HQ, E2E_PASSWORD: PW } = process.env;
if (!A || !B || !HQ || !PW) throw new Error("test account env missing");
const SHOTS = process.argv[2];
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const rnd = Math.random().toString(36).slice(2, 7);
const SLUG_A = `e2e-a-${rnd}`;
const SLUG_B = `e2e-b-${rnd}`;
const IMG = new URL("../../public/products/cream.webp", import.meta.url).pathname;

const results = [];
async function check(id, name, fn) {
  try {
    const note = await fn();
    results.push({ id, ok: true });
    console.log(`PASS ${id} ${name}${note ? " — " + note : ""}`);
  } catch (e) {
    results.push({ id, ok: false });
    console.log(`FAIL ${id} ${name} — ${e.message.split("\n")[0]}`);
  }
}
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

/** REST: 사업자 토큰으로 직접 API 를 호출해 권한 경계를 확인한다 */
async function token(email) {
  const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email, password: PW }) });
  const j = await r.json();
  if (!j.access_token) throw new Error("login failed for test account");
  return { jwt: j.access_token, uid: j.user.id };
}
async function rest(jwt, path, init = {}) {
  const r = await fetch(`${SB}/rest/v1/${path}`, { ...init, headers: { apikey: KEY, Authorization: `Bearer ${jwt ?? KEY}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers ?? {}) } });
  const text = await r.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: r.status, body };
}

const browser = await chromium.launch();
const newCtx = (opts = {}) => browser.newContext({ locale: "ko-KR", viewport: { width: 1440, height: 900 }, ...opts });
async function login(page, email) {
  await page.goto(`${BASE}/login`);
  await page.fill('[data-testid="login-email"]', email);
  await page.fill('[data-testid="login-password"]', PW);
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL(/\/studio/, { timeout: 20000 });
}
const shot = async (page, name, full = false) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: full });

const ctxA = await newCtx();
const pA = await ctxA.newPage();
const errors = [];
pA.on("pageerror", (e) => errors.push(e.message));

try {
  // ── 1. 진입 · 로그인 ───────────────────────
  await check("P01", "첫 화면 → 가입 화면 이동", async () => {
    await pA.goto(BASE);
    await shot(pA, "01-landing");
    await pA.click('[data-testid="cta-start"]');
    await pA.waitForURL(/\/login\?mode=signup/);
  });
  await check("A01", "로그인 없이 스튜디오 접근 → 로그인 화면", async () => {
    await pA.goto(`${BASE}/studio`);
    await pA.waitForURL(/\/login/, { timeout: 15000 });
  });
  await check("A02", "틀린 비밀번호 → 안내 문구", async () => {
    await pA.fill('[data-testid="login-email"]', A);
    await pA.fill('[data-testid="login-password"]', "wrong-password-123");
    await pA.click('[data-testid="login-submit"]');
    const t = await pA.textContent('[data-testid="login-msg"]');
    assert(/맞지 않습니다/.test(t), t);
  });

  // ── 2. 사업자 A: 주소 만들기 · 편집 ───────────
  await check("S01", "사업자 A 로그인 → 주소 만들기 (잘못된·예약 주소 거부)", async () => {
    await login(pA, A);
    await pA.waitForSelector('[data-testid="onboard"]');
    await pA.fill('[data-testid="onboard-name"]', "김유니");
    await pA.fill('[data-testid="onboard-slug"]', "a");
    await pA.click('[data-testid="onboard-submit"]');
    await pA.waitForSelector('[data-testid="onboard"] [role="alert"]');
    await pA.fill('[data-testid="onboard-slug"]', "admin");
    await pA.click('[data-testid="onboard-submit"]');
    assert(/사용할 수 없는/.test(await pA.textContent('[data-testid="onboard"] [role="alert"]')), "reserved slug accepted");
    await pA.fill('[data-testid="onboard-slug"]', SLUG_A);
    await pA.click('[data-testid="onboard-submit"]');
    await pA.waitForSelector('[data-testid="studio"]');
    assert((await pA.getAttribute('[data-testid="status-badge"]', "data-status")) === "pending", "not pending");
    return SLUG_A;
  });
  await check("S02", "정보 입력 · 위험한 링크(javascript:) 거부 · 저장", async () => {
    await pA.fill('[data-testid="f-title"]', "뷰티 컨설턴트");
    await pA.fill('[data-testid="f-business_name"]', "유니 뷰티 라운지");
    await pA.fill('[data-testid="f-seo_description"]', "피부 고민을 함께 해결하는 1:1 홈케어 컨설팅");
    await pA.fill('[data-testid="f-bio"]', "10년 동안 고객의 피부를 함께 고민해 왔습니다.\n더마홈과 메디더마로 집에서도 전문적인 관리를 시작하세요.");
    await pA.fill('[data-testid="f-phone"]', "010-1234-5678");
    await pA.fill('[data-testid="f-email"]', "hello@example.com");
    await pA.fill('[data-testid="f-address"]', "서울특별시 강남구 테헤란로 123");
    await pA.fill('[data-testid="f-sns-instagram"]', "javascript:alert(1)");
    await pA.click('[data-testid="save"]');
    await pA.waitForSelector('[data-testid="toast"]');
    assert(/확인/.test(await pA.textContent('[data-testid="toast"]')), "invalid link saved");
    assert(await pA.$('[role="alert"]:has-text("https://")'), "no field error shown");
    await pA.fill('[data-testid="f-sns-instagram"]', "https://instagram.com/unicore_test");
    await pA.fill('[data-testid="f-sns-kakao_channel"]', "https://pf.kakao.com/_test");
    await pA.click('[data-testid="save"]');
    await pA.waitForSelector('[data-testid="toast"]:has-text("저장했어요")', { timeout: 15000 });
  });
  await check("S03", "사진 업로드: 가짜 이미지 거부 · 실제 이미지 저장", async () => {
    await pA.setInputFiles('[data-testid="photo-input"]', { name: "fake.jpg", mimeType: "image/jpeg", buffer: Buffer.from("this is not an image") });
    await pA.waitForSelector('[data-testid="toast"]:has-text("손상")');
    await pA.setInputFiles('[data-testid="photo-input"]', { name: "me.webp", mimeType: "image/webp", buffer: fs.readFileSync(IMG) });
    await pA.waitForSelector('[data-testid="toast"]:has-text("사진을 올렸어요")', { timeout: 20000 });
    await pA.click('[data-testid="save"]');
    await pA.waitForSelector('[data-testid="toast"]:has-text("저장했어요")', { timeout: 15000 });
  });
  await check("S04", "디자인 변경 → 미리보기에 즉시 반영", async () => {
    await pA.click('[data-testid="tab-design"]');
    await pA.click('[data-testid="design-premium_white"]');
    const f = pA.frameLocator('[data-testid="preview-frame"]');
    await f.locator('[data-testid="site"][data-design="premium_white"]').waitFor({ timeout: 10000 });
    await f.locator("h1", { hasText: "" }).first().waitFor();
    await shot(pA, "02-studio-white");
    await pA.click('[data-testid="design-luxury_black"]');
    await f.locator('[data-testid="site"][data-design="luxury_black"]').waitFor();
  });
  await check("S05", "섹션 숨기기·순서 변경 → 미리보기 반영", async () => {
    await pA.click('[data-testid="tab-sections"]');
    await pA.click('[data-testid="sec-hide-qr"]');
    await pA.click('[data-testid="sec-up-about"]'); // about 를 hero 위로
    const f = pA.frameLocator('[data-testid="preview-frame"]');
    await f.locator('[data-testid="sec-about"]').waitFor();
    assert((await f.locator('[data-testid="sec-qr"]').count()) === 0, "qr still shown");
    const order = await f.locator("main > *").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid") ?? e.querySelector("[data-testid]")?.getAttribute("data-testid")));
    assert(order[0] === "sec-about", "order not applied: " + order.join(","));
    await pA.click('[data-testid="sec-up-hero"]'); // 원래대로
    await pA.click('[data-testid="sec-show-qr"]');
  });
  await check("S06", "공식 제품 2개 선택 → 저장", async () => {
    await pA.click('[data-testid="tab-products"]');
    await pA.click('[data-testid="pick-cream"]');
    await pA.click('[data-testid="pick-device"]');
    await pA.click('[data-testid="save"]');
    await pA.waitForSelector('[data-testid="toast"]:has-text("저장했어요")', { timeout: 15000 });
    const f = pA.frameLocator('[data-testid="preview-frame"]');
    await f.locator('[data-testid="product-cream"]').waitFor();
  });
  await check("S07", "모바일·태블릿·PC 미리보기 전환", async () => {
    for (const d of ["mobile", "tablet", "pc"]) {
      await pA.click(`[data-testid="device-${d}"]`);
      await pA.waitForTimeout(400);
    }
    await pA.click('[data-testid="device-mobile"]');
    await pA.waitForTimeout(1200);
    await shot(pA, "03-studio-pc");
  });
  await check("S08", "공유: QR 이미지 생성 · 저장 링크", async () => {
    await pA.click('[data-testid="tab-share"]');
    await pA.waitForSelector('[data-testid="qr-img"]');
    assert((await pA.textContent('[data-testid="page-url"]')).includes(`/@${SLUG_A}`), "wrong url");
    assert((await pA.getAttribute('[data-testid="qr-download"]', "href")).startsWith("data:image/png"), "no qr png");
  });
  await check("V01", "승인 전 공개 주소 → 페이지 없음", async () => {
    const p = await (await newCtx()).newPage();
    const r = await p.goto(`${BASE}/@${SLUG_A}`);
    assert(r.status() === 404, "status " + r.status());
    await p.waitForSelector('[data-testid="not-found"]');
    await p.context().close();
  });

  // ── 3. 다른 사업자(B)의 침범 시도 ──────────────
  const ta = await token(A);
  const tb = await token(B);
  await check("M01", "사업자 B: 같은 주소 신청 → 거부, 자기 주소 생성", async () => {
    const ctx = await newCtx();
    const p = await ctx.newPage();
    await login(p, B);
    await p.fill('[data-testid="onboard-name"]', "이코어");
    await p.fill('[data-testid="onboard-slug"]', SLUG_A);
    await p.click('[data-testid="onboard-submit"]');
    assert(/이미 사용 중/.test(await p.textContent('[data-testid="onboard"] [role="alert"]', { timeout: 10000 })), "duplicate slug accepted");
    await p.fill('[data-testid="onboard-slug"]', SLUG_B);
    await p.click('[data-testid="onboard-submit"]');
    await p.waitForSelector('[data-testid="studio"]');
    await ctx.close();
  });
  await check("M02", "사업자 B → A 페이지 조회·수정·삭제 불가 (API 직접 호출)", async () => {
    const see = await rest(tb.jwt, `site_profiles?slug=eq.${SLUG_A}&select=id`);
    assert(Array.isArray(see.body) && see.body.length === 0, "B can see A pending page");
    const up = await rest(tb.jwt, `site_profiles?slug=eq.${SLUG_A}`, { method: "PATCH", body: JSON.stringify({ display_name: "HACKED" }) });
    assert(Array.isArray(up.body) && up.body.length === 0, "B updated A: " + JSON.stringify(up.body));
    const del = await rest(tb.jwt, `site_profiles?slug=eq.${SLUG_A}`, { method: "DELETE" });
    assert(Array.isArray(del.body) && del.body.length === 0, "B deleted A");
    const own = await rest(tb.jwt, `site_profiles?owner_id=eq.${ta.uid}&select=id`);
    assert(Array.isArray(own.body) && own.body.length === 0, "B can list A rows");
  });
  await check("M03", "사업자 B: 스스로 승인·소유자 변경 시도 → 무시됨", async () => {
    const r = await rest(tb.jwt, `site_profiles?slug=eq.${SLUG_B}`, { method: "PATCH", body: JSON.stringify({ status: "approved", owner_id: ta.uid }) });
    assert(r.body[0]?.status === "pending", "status changed: " + JSON.stringify(r.body));
    assert(r.body[0]?.owner_id === tb.uid, "owner changed");
  });
  await check("M04", "사업자: 본사 공식 제품 수정·추가 불가", async () => {
    const up = await rest(ta.jwt, "site_hq_products?id=eq.cream", { method: "PATCH", body: JSON.stringify({ name: "HACKED" }) });
    assert(Array.isArray(up.body) && up.body.length === 0, "owner updated product");
    const ins = await rest(ta.jwt, "site_hq_products", { method: "POST", body: JSON.stringify({ id: "hack", name: "x" }) });
    assert(ins.status >= 400, "owner inserted product");
  });
  await check("M05", "사업자 B: A 의 사진 폴더에 업로드 불가", async () => {
    const r = await fetch(`${SB}/storage/v1/object/partner-photos/${ta.uid}/evil.webp`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${tb.jwt}`, "Content-Type": "image/webp" }, body: fs.readFileSync(IMG) });
    assert(r.status >= 400, "upload allowed: " + r.status);
    const html = await fetch(`${SB}/storage/v1/object/partner-photos/${tb.uid}/x.html`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${tb.jwt}`, "Content-Type": "text/html" }, body: "<script>alert(1)</script>" });
    assert(html.status >= 400, "html upload allowed: " + html.status);
    return `타인 폴더 ${r.status}, HTML 파일 ${html.status}`;
  });
  await check("M06", "비로그인: 대기 중 페이지·소유자 정보 비공개", async () => {
    const r = await rest(null, `site_profiles?slug=eq.${SLUG_A}&select=slug`);
    assert(Array.isArray(r.body) && r.body.length === 0, "anon sees pending");
    const o = await rest(null, `site_profiles?select=owner_id&limit=1`);
    assert(o.status === 401 || o.status === 403, "anon reads owner_id: " + o.status);
  });
  await check("H01", "사업자 A 가 본사 화면 접근 → 거부", async () => {
    await pA.goto(`${BASE}/hq`);
    await pA.waitForSelector('[data-testid="hq-denied"]');
  });

  // ── 4. 본사 관리자 ────────────────────────
  const ctxH = await newCtx();
  const pH = await ctxH.newPage();
  await check("H02", "본사: 대기 목록 → A 승인", async () => {
    await login(pH, HQ);
    await pH.waitForSelector('[data-testid="nav-hq"]');
    await pH.click('[data-testid="nav-hq"]');
    await pH.waitForSelector('[data-testid="hq"]');
    await pH.waitForSelector(`[data-testid="hq-row-${SLUG_A}"]`);
    await shot(pH, "04-hq-pending");
    await pH.click(`[data-testid="approve-${SLUG_A}"]`);
    await pH.waitForSelector('[data-testid="hq-msg"]:has-text("공개 중")');
  });
  await check("V02", "승인 후 공개 페이지: 내용·제품·SEO·구조화 데이터", async () => {
    const p = await (await newCtx()).newPage();
    const r = await p.goto(`${BASE}/@${SLUG_A}`);
    assert(r.status() === 200, "status " + r.status());
    await p.waitForSelector('[data-testid="site"][data-design="luxury_black"]');
    assert((await p.textContent("h1")).includes("김유니"), "name missing");
    assert((await p.locator('[data-testid^="product-"]').count()) === 2, "product count");
    const title = await p.title();
    assert(title.includes("김유니") && title.includes("유니 뷰티 라운지"), "title " + title);
    const canonical = await p.getAttribute('link[rel="canonical"]', "href");
    assert(canonical.endsWith(`/@${SLUG_A}`), "canonical " + canonical);
    assert(await p.getAttribute('meta[property="og:image"]', "content"), "og:image missing");
    const ld = JSON.parse(await p.textContent('script[type="application/ld+json"]'));
    const types = ld["@graph"].map((x) => x["@type"]);
    for (const t of ["Person", "LocalBusiness", "Product", "BreadcrumbList"]) assert(types.includes(t), "missing " + t);
    const html = await p.content();
    assert(!/javascript:/i.test(html), "javascript: in page");
    await p.waitForTimeout(2200);
    await shot(p, "05-public-pc");
    await shot(p, "05-public-pc-full", true);
    await p.context().close();
    return `title="${title}", JSON-LD ${types.join("/")}`;
  });
  await check("V03", "/p/아이디 주소 · 사이트맵 포함", async () => {
    const p = await (await newCtx()).newPage();
    const r = await p.goto(`${BASE}/p/${SLUG_A}`);
    assert(r.status() === 200, "p route " + r.status());
    const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
    assert(sm.includes(`/@${SLUG_A}`), "not in sitemap");
    await p.context().close();
  });
  await check("V04", "모바일 공개 페이지: 가로 넘침 없음 · 하단 상담 버튼", async () => {
    const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ko-KR" });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/@${SLUG_A}`);
    await p.waitForSelector('[data-testid="mobile-bar"]');
    await p.waitForTimeout(2200);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(ov <= 0, "overflow " + ov);
    const href = await p.getAttribute('[data-testid="mobile-bar"] a:last-child', "href");
    assert(href === "https://pf.kakao.com/_test", "cta " + href);
    await shot(p, "06-public-mobile");
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
    await p.waitForTimeout(1500);
    await shot(p, "06-public-mobile-2");
    await ctx.close();
  });
  await check("V05", "Premium White 디자인 공개 페이지 (모바일·PC)", async () => {
    await rest(ta.jwt, `site_profiles?slug=eq.${SLUG_A}`, { method: "PATCH", body: JSON.stringify({ design: "premium_white" }) });
    const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ko-KR" });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/@${SLUG_A}`);
    await p.waitForSelector('[data-testid="site"][data-design="premium_white"]');
    await p.waitForTimeout(2000);
    await shot(p, "07-white-mobile");
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(ov <= 0, "overflow " + ov);
    await ctx.close();
    const p2 = await (await newCtx()).newPage();
    await p2.goto(`${BASE}/@${SLUG_A}`);
    await p2.waitForTimeout(2200);
    await shot(p2, "07-white-pc");
    await p2.context().close();
    await rest(ta.jwt, `site_profiles?slug=eq.${SLUG_A}`, { method: "PATCH", body: JSON.stringify({ design: "luxury_black" }) });
  });
  await check("H03", "본사: 제품 설명 수정 → 사업자 공개 페이지 즉시 반영 → 원복", async () => {
    await pH.click('[data-testid="hq-tab-products"]');
    await pH.click('[data-testid="pe-row-cream"]');
    const orig = await pH.inputValue('[data-testid="pe-tagline"]');
    await pH.fill('[data-testid="pe-tagline"]', `${orig} [E2E ${rnd}]`);
    await pH.click('[data-testid="pe-save"]');
    await pH.waitForSelector('[data-testid="hq-msg"]:has-text("저장")');
    const p = await (await newCtx()).newPage();
    await p.goto(`${BASE}/@${SLUG_A}`);
    assert((await p.textContent('[data-testid="product-cream"]')).includes(`[E2E ${rnd}]`), "not reflected");
    await p.context().close();
    await pH.click('[data-testid="pe-row-cream"]');
    await pH.fill('[data-testid="pe-tagline"]', orig);
    await pH.click('[data-testid="pe-save"]');
    await pH.waitForSelector('[data-testid="hq-msg"]:has-text("저장")');
    await shot(pH, "08-hq-products");
  });
  await check("H04", "본사: 비공개 → 공개 주소 즉시 404", async () => {
    await pH.click('[data-testid="hq-tab-partners"]');
    await pH.click('[data-testid="hq-filter-approved"]');
    await pH.click(`[data-testid="suspend-${SLUG_A}"]`);
    await pH.waitForSelector('[data-testid="hq-msg"]:has-text("비공개")');
    const r = await fetch(`${BASE}/@${SLUG_A}`);
    assert(r.status === 404, "still visible " + r.status);
  });
  await check("S09", "사업자 A 스튜디오에 '비공개' 상태 표시", async () => {
    await pA.goto(`${BASE}/studio`);
    await pA.waitForSelector('[data-testid="status-badge"][data-status="suspended"]');
  });
  await check("S10", "모바일 스튜디오: 편집 화면 가로 넘침 없음", async () => {
    const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ko-KR" });
    const p = await ctx.newPage();
    await login(p, A);
    await p.waitForSelector('[data-testid="studio"]');
    await p.waitForTimeout(800);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await shot(p, "09-studio-mobile");
    const wide = await p.evaluate(() => { const W = document.documentElement.clientWidth; return [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > W + 1).slice(0, 4).map((e) => e.tagName + "." + String(e.className).slice(0, 50)); });
    assert(ov <= 0, "overflow " + ov + " " + wide.join(" | "));
    await ctx.close();
  });
  await check("H05", "모바일 본사 화면", async () => {
    const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ko-KR" });
    const p = await ctx.newPage();
    await login(p, HQ);
    await p.goto(`${BASE}/hq`);
    await p.waitForSelector('[data-testid="hq"]');
    await p.click('[data-testid="hq-filter-all"]');
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await shot(p, "10-hq-mobile");
    assert(ov <= 0, "overflow " + ov);
    await ctx.close();
  });
  await check("X01", "페이지 스크립트 오류 없음", async () => {
    assert(errors.length === 0, errors.join(" | "));
  });
} finally {
  // 테스트가 만든 페이지·사진 정리 (계정 자체는 DB 관리 도구로 삭제)
  for (const email of [A, B]) {
    try {
      const t = await token(email);
      const list = await fetch(`${SB}/storage/v1/object/list/partner-photos`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${t.jwt}`, "Content-Type": "application/json" }, body: JSON.stringify({ prefix: t.uid, limit: 100 }) }).then((r) => r.json());
      const names = (Array.isArray(list) ? list : []).map((o) => `${t.uid}/${o.name}`);
      if (names.length) await fetch(`${SB}/storage/v1/object/partner-photos`, { method: "DELETE", headers: { apikey: KEY, Authorization: `Bearer ${t.jwt}`, "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: names }) });
      await rest(t.jwt, `site_profiles?owner_id=eq.${t.uid}`, { method: "DELETE" });
    } catch (e) {
      console.log("cleanup warning:", e.message);
    }
  }
  await browser.close();
}
const ok = results.filter((r) => r.ok).length;
console.log(`\n${ok}/${results.length} passed`);
process.exit(ok === results.length ? 0 : 1);
