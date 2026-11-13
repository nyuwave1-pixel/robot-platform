/**
 * E2E 검증 스위트 (실제 브라우저 + 실제 분석 파이프라인).
 * 사용:
 *   ADMIN_PASSWORD=test-admin-pw ENABLE_DEV_HARNESS=1 DATA_DIR=/tmp/md-e2e npm run start &
 *   NODE_PATH=$(npm root -g) ADMIN_PASSWORD=test-admin-pw node tests/e2e/run.mjs <정면 얼굴 사진.jpg> [고개 돌린 사진.jpg]
 * 테스트용 얼굴 사진은 저장소에 포함하지 않는다 (초상권). 변형 이미지는 브라우저 캔버스로 즉석 생성한다.
 */
import { createRequire } from "node:module";
import http from "node:http";
import { mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3200";
const PW = process.env.ADMIN_PASSWORD || "";
const [portrait, turned] = process.argv.slice(2);
if (!portrait) { console.error("usage: run.mjs <frontal-portrait.jpg> [turned.jpg]"); process.exit(2); }
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "out");
mkdirSync(OUT, { recursive: true });

const results = [];
const rec = (id, name, pass, detail = "") => { results.push({ id, name, pass, detail }); console.log(`${pass ? "PASS" : "FAIL"} ${id} ${name}${detail ? " — " + detail : ""}`); };
const check = async (id, name, fn) => { try { const d = await fn(); rec(id, name, true, d ?? ""); } catch (e) { rec(id, name, false, String(e?.message ?? e).split("\n")[0].slice(0, 220)); } };
const assert = (c, m) => { if (!c) throw new Error(m); };

const browser = await chromium.launch();
const requests = [];
async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, ...opts });
  const page = await ctx.newPage();
  page.on("request", (r) => requests.push({ url: r.url(), method: r.method(), size: (r.postData() || "").length, body: (r.postData() || "").slice(0, 300) }));
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  return page;
}
const toDataUrl = (f) => `data:image/${path.extname(f).slice(1).replace("jpg", "jpeg")};base64,${readFileSync(f).toString("base64")}`;

// ── 1. 하네스: 변형 이미지 생성 + 품질 검사 ─────────────────
const H = await newPage();
await H.goto(BASE + "/dev/harness");
await H.waitForFunction(() => typeof window.__analyze === "function", null, { timeout: 120000 });
const src = toDataUrl(portrait);
/** 브라우저 캔버스로 변형 이미지를 만든다 */
const variant = (kind) => H.evaluate(async ([d, kind]) => {
  const img = new Image(); img.src = d; await img.decode();
  const W = img.naturalWidth, Hh = img.naturalHeight;
  const c = document.createElement("canvas"); c.width = W; c.height = Hh;
  const x = c.getContext("2d");
  const face = window.__faceBox;
  switch (kind) {
    case "noface": { for (let i = 0; i < 400; i++) { x.fillStyle = `hsl(${i * 37 % 360} 40% ${30 + (i * 13) % 40}%)`; x.fillRect((i * 97) % W, (i * 53) % Hh, 120, 90); } break; }
    case "two": c.width = W * 2; x.drawImage(img, 0, 0); x.translate(W * 2, 0); x.scale(-1, 1); x.drawImage(img, 0, 0); break;
    case "dark": x.filter = "brightness(0.22)"; x.drawImage(img, 0, 0); break;
    case "bright": x.filter = "brightness(2.4)"; x.drawImage(img, 0, 0); break;
    case "blur": x.filter = `blur(${Math.round(W / 180)}px)`; x.drawImage(img, 0, 0); break;
    case "gray": x.filter = "grayscale(1)"; x.drawImage(img, 0, 0); break;
    case "warm": x.drawImage(img, 0, 0); x.globalCompositeOperation = "multiply"; x.fillStyle = "rgb(255,225,170)"; x.fillRect(0, 0, W, Hh); break;
    case "brighter": x.filter = "brightness(1.45)"; x.drawImage(img, 0, 0); break;
    case "lowres": c.width = Math.round(W / 6); c.height = Math.round(Hh / 6); x.drawImage(img, 0, 0, c.width, c.height); break;
    case "rot": { const a = (30 * Math.PI) / 180; c.width = c.height = Math.ceil(Math.hypot(W, Hh)); x.fillStyle = "#777"; x.fillRect(0, 0, c.width, c.height); x.translate(c.width / 2, c.height / 2); x.rotate(a); x.drawImage(img, -W / 2, -Hh / 2); break; }
    case "mask": x.drawImage(img, 0, 0); x.fillStyle = "#5b8fd9"; x.fillRect(face.x - face.w * 0.05, face.f.nose.y - face.h * 0.04, face.w * 1.1, face.h * 0.7); break;
    case "sunglasses": { x.drawImage(img, 0, 0); x.fillStyle = "#111"; const ey = (face.f.eyeR.y + face.f.eyeL.y) / 2; const hh = face.h * 0.2; x.fillRect(face.x, ey - hh * 0.5, face.w, hh); break; }
    case "sidelight": { x.drawImage(img, 0, 0); const g = x.createLinearGradient(face.x, 0, face.x + face.w, 0); g.addColorStop(0, "rgba(0,0,0,0.72)"); g.addColorStop(0.55, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, W, Hh); break; }
    case "recompress": x.drawImage(img, 0, 0); return c.toDataURL("image/jpeg", 0.6);
    default: x.drawImage(img, 0, 0);
  }
  return c.toDataURL("image/jpeg", 0.92);
}, [src, kind]);

const base = await H.evaluate((d) => window.__analyze(d), src);
assert(base.result.imageQuality.passed, "base portrait must pass quality: " + JSON.stringify(base.result.imageQuality.issues));
// 마스크·선글라스 합성을 위한 얼굴 위치 (원본 px)
await H.evaluate(async (d) => { const f = await window.__facebox(d); const img = new Image(); img.src = d; await img.decode(); const k = img.naturalWidth / f.canvasW; for (const key of Object.keys(f)) if (f[key]?.x !== undefined) { f[key].x *= k; f[key].y *= k; } window.__faceBox = { x: f.left.x, y: f.top.y, w: f.right.x - f.left.x, h: f.chin.y - f.top.y, f }; }, src);

const analyze = async (kind) => (await H.evaluate((d) => window.__analyze(d), await variant(kind))).result;
const codes = (r) => r.imageQuality.issues.map((i) => `${i.code}:${i.severity[0]}`);
const expectBlocked = (id, name, kind, anyOf) => check(id, name, async () => {
  const r = await analyze(kind);
  const got = codes(r);
  assert(!r.imageQuality.passed, `expected rejection, got pass (${got})`);
  assert(anyOf.some((c) => got.includes(c + ":b")), `expected one of [${anyOf}] as blocker, got [${got}]`);
  assert(r.analysis.overallConditionScore === null && r.analysis.zones.length === 0, "rejected photo must not produce scores");
  return got.join(", ");
});
await expectBlocked("Q01", "얼굴이 없는 사진", "noface", ["no_face"]);
await expectBlocked("Q02", "복수 인물 사진", "two", ["multiple_faces"]);
await expectBlocked("Q03", "어두운 사진", "dark", ["too_dark"]);
await expectBlocked("Q04", "과다 노출 사진", "bright", ["too_bright"]);
await expectBlocked("Q05", "흔들린(흐린) 사진", "blur", ["blurry"]);
await expectBlocked("Q06", "기울어진 얼굴(30° roll)", "rot", ["tilted_roll", "no_face"]);
await expectBlocked("Q07", "저해상도 이미지", "lowres", ["low_resolution", "no_face"]);
await expectBlocked("Q08", "흑백 사진", "gray", ["not_color"]);
await expectBlocked("Q09", "마스크(하관 가림)", "mask", ["occlusion_lower_face", "no_face"]);
await expectBlocked("Q10", "한쪽 그림자(조명 불균일)", "sidelight", ["uneven_lighting"]);
await check("Q11", "선글라스(눈 가림)", async () => {
  const r = await analyze("sunglasses");
  const got = codes(r);
  assert(!r.imageQuality.passed && got.some((c) => c === "occlusion_eyes:b" || c === "no_face:b"), `sunglasses not rejected: [${got}] passed=${r.imageQuality.passed}`);
  const ue = r.analysis.zones.filter((z) => z.zone.includes("under_eye"));
  return `[${got}] under-eye zones: ${ue.map((z) => z.conditionIndex).join("/") || "n/a"}`;
});
if (turned) {
  await check("Q12", "얼굴 각도가 큰 사진 (실제 사진)", async () => {
    const r = (await H.evaluate((d) => window.__analyze(d), toDataUrl(turned))).result;
    const got = codes(r);
    assert(!r.imageQuality.passed && got.some((c) => /not_frontal|tilted|no_face/.test(c)), `got [${got}] passed=${r.imageQuality.passed}`);
    return `${got.join(", ")} pose=${JSON.stringify(r.imageQuality.pose)}`;
  });
}
await check("Q13", "동일 이미지 반복 분석 → 동일 결과", async () => {
  const a = (await H.evaluate((d) => window.__analyze(d), src)).result;
  const b = (await H.evaluate((d) => window.__analyze(d), src)).result;
  delete a.analyzedAt; delete b.analyzedAt;
  assert(JSON.stringify(a) === JSON.stringify(b), "results differ between runs");
  return `overall=${a.analysis.overallConditionScore} conf=${a.analysis.confidence} (${base.ms}ms)`;
});
await check("Q14", "JPEG 재압축에도 종합 지수가 잡음 범위 이내", async () => {
  const r = await analyze("recompress");
  const d = Math.abs(r.analysis.overallConditionScore - base.result.analysis.overallConditionScore);
  assert(d <= 6, `delta ${d}`);
  return `Δ=${d}`;
});
await check("S01", "결과 JSON 스키마: 13개 영역, NaN 없음, 측정 불가 항목은 null", async () => {
  const r = base.result;
  assert(r.schemaVersion === "1.0" && r.isMock === false && r.provider.imageLeftDevice === false, "meta");
  assert(r.analysis.zones.length === 13, "zones " + r.analysis.zones.length);
  const txt = JSON.stringify(r);
  assert(!/NaN|Infinity/.test(txt), "NaN in JSON");
  for (const z of r.analysis.zones) for (const k of ["texture", "wrinkleVisibility", "poreVisibility", "toneUniformity", "rednessVisibility", "confidence"]) assert(z[k] === null || (typeof z[k] === "number" && z[k] >= 0 && z[k] <= 100), `${z.zone}.${k}=${z[k]}`);
  assert(r.simulation.periods.join() === "4weeks,8weeks,12weeks" && r.simulation.disclaimer.includes("가상"), "simulation block");
  assert(r.analysis.notMeasurable.includes("hydration") && r.analysis.notMeasurable.includes("skinAge"), "notMeasurable");
  assert(!("skinAge" in r.analysis) && !txt.includes('"hydration":'), "must not output skin age / hydration values");
  return `nullZones=${r.analysis.zones.filter((z) => z.conditionIndex === null).length}`;
});
await H.context().close();

// ── 2. 사용자 흐름 ─────────────────────────────────────────
async function runFlow(page, file, { survey = true, contra = false, lang = "ko" } = {}) {
  await page.goto(`${BASE}/?lang=${lang}`);
  await page.setInputFiles('[data-testid="hero-upload-input"]', file);
  await page.waitForSelector('[data-testid="consent"]');
  await page.check('[data-testid="consent-required"]');
  await page.click('[data-testid="consent-agree"]');
  await page.waitForSelector('[data-testid="survey"], [data-testid="quality-failed"], [data-testid="analysis-error"]', { timeout: 120000 });
  if (!(await page.$('[data-testid="survey"]'))) return false;
  if (survey) {
    await page.click('[data-testid="q-dryness-2"]');
    await page.click('[data-testid="goal-wrinkle_firming"]');
    if (contra) await page.check('[data-testid="contra-check"]');
    await page.click('[data-testid="survey-submit"]');
  } else await page.click('[data-testid="survey-skip"]');
  await page.waitForSelector('[data-testid="report"]');
  return true;
}
const P = await newPage();
await check("F01", "로그인 없이 분석 시작 + 필수 동의 없이는 진행 불가", async () => {
  await P.goto(BASE + "/analyze");
  await P.waitForSelector('[data-testid="consent"]');
  await P.click('[data-testid="consent-agree"]');
  await P.waitForSelector('[data-testid="consent-error"]');
  assert(!(await P.$('[data-testid="capture"]')), "capture shown without consent");
});
await check("F02", "지원하지 않는 파일 형식 거부", async () => {
  await P.check('[data-testid="consent-required"]');
  await P.click('[data-testid="consent-agree"]');
  await P.waitForSelector('[data-testid="capture"]');
  await P.setInputFiles('[data-testid="capture-upload-input"]', { name: "x.gif", mimeType: "image/gif", buffer: Buffer.from("GIF89a") });
  await P.waitForSelector('[data-testid="capture-upload"] [role="alert"]');
});
await check("F03", "손상된 이미지 → 오류 안내", async () => {
  await P.setInputFiles('[data-testid="capture-upload-input"]', { name: "broken.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not an image at all") });
  await P.waitForSelector('[data-testid="analysis-error"]', { timeout: 30000 });
});
await check("F04", "업로드 → 품질검사 → 설문 → 리포트 (전체 흐름)", async () => {
  requests.length = 0;
  assert(await runFlow(P, portrait), "flow did not reach report");
  const score = await P.getAttribute('[data-testid="overall-score"]', 'data-value');
  await P.waitForSelector('[data-testid="sim-slider"]', { timeout: 60000 });
  assert(P.errors.length === 0, "page errors: " + P.errors.join(" | "));
  return `overall=${score.trim()}`;
});
await check("P01", "분석 중 사진이 네트워크로 전송되지 않음", async () => {
  const posts = requests.filter((r) => r.method !== "GET");
  const bad = posts.filter((r) => !/\/api\/(events|report)$/.test(new URL(r.url).pathname) || r.size > 2000 || /data:image|base64/.test(r.body));
  assert(bad.length === 0, "unexpected upload: " + JSON.stringify(bad.slice(0, 2)));
  const ext = requests.filter((r) => !r.url.startsWith(BASE) && !r.url.startsWith("data:") && !r.url.startsWith("blob:"));
  assert(ext.length === 0, "third-party requests: " + ext.map((r) => r.url).slice(0, 3).join(", "));
  return `POST ${posts.length}건 (모두 /api/events 익명 이벤트 — 본문 내용은 A04 서버 로그에서 검증), 외부 도메인 요청 0건`;
});
await check("F05", "영역 선택 → 상세 분석 / 히트맵 전환", async () => {
  await P.click('[data-testid="zone-btn-forehead"]');
  await P.waitForSelector('[data-testid="zone-detail"]');
  const before = await P.evaluate(() => document.querySelector('[data-testid="face-map"]').toDataURL().length);
  await P.click('[data-testid="heat-rednessVisibility"]');
  await P.waitForTimeout(300);
  const after = await P.evaluate(() => document.querySelector('[data-testid="face-map"]').toDataURL().length);
  assert(before !== after, "heatmap did not change canvas");
  const box = await P.locator('[data-testid="face-map"]').boundingBox();
  await P.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
  const title = await P.textContent('[data-testid="zone-detail"] h4');
  return `클릭한 영역: ${title}`;
});
await check("F06", "3D 얼굴 보기 (WebGL)", async () => {
  if (!(await P.$('[data-testid="view-3d"]'))) return "이 환경은 3D 미지원 → 2D 자동 전환 확인";
  await P.click('[data-testid="view-3d"]');
  await P.waitForSelector('[data-testid="face-3d"] canvas, canvas[data-testid="face-3d"], [data-testid="face-3d"]', { timeout: 20000 });
  await P.waitForTimeout(1500);
  await P.screenshot({ path: path.join(OUT, "report-3d.png") });
  assert(P.errors.length === 0, P.errors.join("|"));
  return "렌더링됨 (screenshot: out/report-3d.png)";
});
await check("C01", "케어 추천: 근거·주의사항·공식 링크", async () => {
  const care = P.locator('[data-testid="care-view"]');
  assert((await care.locator('[data-testid^="rec-"]').count()) >= 1, "no recommendations");
  assert((await care.locator('[data-testid^="routine-"]').count()) >= 1, "no routine");
  const hrefs = await care.locator('a[data-testid^="product-"]').evaluateAll((as) => as.map((a) => a.href));
  assert(hrefs.length >= 3 && hrefs.every((h) => h.startsWith("https://www.unincore.com/shopping/search/view.do?productSeq=")), "product links: " + hrefs.join(","));
  const trial = await P.getAttribute('[data-testid="trial-cta"]', "href");
  assert(trial === "https://dermahome.unincore.com/experience/", "trial " + trial);
  return `추천 ${await care.locator('[data-testid^="rec-"]').count()}개, 제품 링크 ${hrefs.length}개`;
});
await check("C02", "다른 루틴 선택 가능", async () => {
  const first = await P.locator('[data-testid="care-view"] [data-testid^="routine-night"]').getAttribute("data-testid");
  await P.click('[data-testid="alt-routine"]');
  const second = await P.locator('[data-testid="care-view"] [data-testid^="routine-night"]').getAttribute("data-testid");
  assert(first !== second, "routine did not switch");
  return `${first} → ${second}`;
});
await check("M01", "시뮬레이션: 가상 고지 상시 표시 + 4·8·12주", async () => {
  const txt = await P.textContent('[data-testid="simulation"]');
  assert(txt.includes("가상 시뮬레이션이며 실제 개선 결과를 보장하지 않습니다"), "disclaimer missing");
  for (const w of ["4 WEEKS", "8 WEEKS", "12 WEEKS", "CURRENT SKIN"]) assert(txt.includes(w), w + " missing");
});
await check("R01", "리포트 PDF 저장", async () => {
  const [dl] = await Promise.all([P.waitForEvent("download", { timeout: 120000 }), P.click('[data-testid="save-pdf"]')]);
  const f = path.join(OUT, "report.pdf");
  await dl.saveAs(f);
  const buf = readFileSync(f);
  assert(buf.subarray(0, 5).toString() === "%PDF-", "not a PDF");
  assert(buf.length > 100_000, "PDF too small: " + buf.length);
  const pages = (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  return `${Math.round(buf.length / 1024)}KB, ${pages}쪽`;
});
await check("R02", "리포트 이미지 저장", async () => {
  const [dl] = await Promise.all([P.waitForEvent("download", { timeout: 120000 }), P.click('[data-testid="save-image"]')]);
  const f = path.join(OUT, "report.png");
  await dl.saveAs(f);
  assert(readFileSync(f).subarray(1, 4).toString() === "PNG", "not PNG");
  return `${Math.round(statSync(f).size / 1024)}KB`;
});
const idbCount = (page) => page.evaluate(() => new Promise((res) => { const r = indexedDB.open("mediderma"); r.onupgradeneeded = () => { r.transaction.abort(); res(0); }; r.onerror = () => res(0); r.onsuccess = () => { const db = r.result; if (!db.objectStoreNames.contains("history")) { db.close(); return res(0); } const q = db.transaction("history").objectStore("history").count(); q.onsuccess = () => { db.close(); res(q.result); }; }; }));
await check("P02", "동의하지 않으면 기기에 아무것도 저장되지 않음", async () => {
  const n = await idbCount(P);
  const ls = await P.evaluate(() => ({ consent: localStorage.getItem("md_consent_history"), anon: localStorage.getItem("md_anon_id"), keys: Object.keys(localStorage), ss: Object.keys(sessionStorage) }));
  assert(n === 0 && !ls.consent && !ls.anon, JSON.stringify({ n, ls }));
  assert(!(await P.$('[data-testid="save-history"]')), "save button visible without consent");
  const ssVal = await P.evaluate(() => JSON.stringify(sessionStorage));
  assert(!/data:image|landmark|overallConditionScore/.test(ssVal), "sessionStorage holds analysis data");
  return `localStorage=[${ls.keys}] sessionStorage=[${ls.ss}] (세션 ID만)`;
});
await check("P03", "동의 후 기록 저장 → 조회 → 전체 삭제 → 동의 철회", async () => {
  await P.click('[data-testid="enable-history"]');
  await P.click('[data-testid="save-history"]');
  await P.waitForFunction(() => document.querySelector('[data-testid="save-history"]')?.disabled);
  assert((await idbCount(P)) === 1, "not saved");
  const P2 = await P.context().newPage();
  await P2.goto(BASE + "/history");
  await P2.waitForSelector('[data-testid="history-item"]');
  const anon = await P2.textContent('[data-testid="anon-id"]');
  assert(/^anon-/.test(anon), "anon id " + anon);
  P2.on("dialog", (d) => d.accept());
  await P2.click('[data-testid="history-withdraw"]');
  await P2.waitForSelector('[data-testid="history-empty"]');
  assert((await idbCount(P2)) === 0, "not deleted");
  const ls = await P2.evaluate(() => [localStorage.getItem("md_consent_history"), localStorage.getItem("md_anon_id")]);
  assert(ls.every((v) => v === null), "consent not withdrawn");
  await P2.close();
  return `익명 ID ${anon} 발급 → 삭제·철회 후 IndexedDB 0건`;
});
await check("P04", "사진·결과 지금 삭제", async () => {
  await P.click('[data-testid="delete-now"]');
  await P.waitForSelector('[data-testid="capture"], [data-testid="consent"]');
  assert(!(await P.$('[data-testid="report"]')), "report still visible");
});
await check("P05", "비회원 세션 만료 → 사진·결과 자동 삭제", async () => {
  assert(await runFlow(P, portrait, { survey: false }), "flow");
  await P.evaluate(() => { const s = JSON.parse(sessionStorage.getItem("md_session")); s.lastActive = Date.now() - 61 * 60 * 1000; sessionStorage.setItem("md_session", JSON.stringify(s)); });
  await P.waitForSelector('[role="alert"]:has-text("세션이 만료")', { timeout: 25000 });
  assert(!(await P.$('[data-testid="report"]')), "report still visible after expiry");
  return "60분 경과 시뮬레이션 → 15초 이내 삭제 + 안내";
});
await check("C03", "'사용하면 안 되는 경우' 체크 → 기기 루틴 미추천", async () => {
  await P.evaluate(() => sessionStorage.clear());
  assert(await runFlow(P, portrait, { contra: true }), "flow");
  await P.waitForSelector('[data-testid="device-blocked"]');
  assert((await P.locator('[data-testid^="routine-"]').count()) === 0, "routine shown");
  assert(!(await P.$('[data-testid="product-device"]')), "device product shown");
  const json = await P.evaluate(() => { document.querySelector('[data-testid="toggle-json"]').click(); return new Promise((r) => setTimeout(() => r(document.querySelector('[data-testid="json"]').textContent), 200)); });
  assert(JSON.parse(json).survey.deviceContraindication === false, "contraindication answer leaked into result JSON");
});
await P.context().close();

// ── 3. 장애 상황 ───────────────────────────────────────────
await check("E01", "AI 모델 로드 장애 → 오류 안내 (가짜 결과 없음)", async () => {
  const page = await newPage();
  await page.route("**/models/face_landmarker.task", (r) => r.abort());
  await page.goto(BASE + "/analyze");
  await page.check('[data-testid="consent-required"]');
  await page.click('[data-testid="consent-agree"]');
  await page.setInputFiles('[data-testid="capture-upload-input"]', portrait);
  await page.waitForSelector('[data-testid="analysis-error"]', { timeout: 60000 });
  assert(!(await page.$('[data-testid="report"]')), "report shown");
  const t = await page.textContent('[data-testid="analysis-error"]');
  await page.context().close();
  return t.trim().slice(0, 40);
});
await check("E02", "통계 API 장애 시에도 분석은 정상 동작", async () => {
  const page = await newPage();
  await page.route("**/api/events", (r) => r.abort());
  await page.route("**/api/config", (r) => r.fulfill({ status: 500, body: "x" }));
  assert(await runFlow(page, portrait, { survey: false }), "flow failed when APIs are down");
  await page.context().close();
});

// ── 4. 전후 비교 ───────────────────────────────────────────
const tmp = (name, dataUrl) => { const f = path.join(OUT, name); writeFileSync(f, Buffer.from(dataUrl.split(",")[1], "base64")); return f; };
const H2 = await newPage();
await H2.goto(BASE + "/dev/harness");
await H2.waitForFunction(() => typeof window.__analyze === "function", null, { timeout: 120000 });
const mk = (kind) => H2.evaluate(async ([d, kind]) => { const img = new Image(); img.src = d; await img.decode(); const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext("2d"); if (kind === "warm") { x.drawImage(img, 0, 0); x.globalCompositeOperation = "multiply"; x.fillStyle = "rgb(255,215,150)"; x.fillRect(0, 0, c.width, c.height); } else if (kind === "blur") { x.filter = "blur(2px)"; x.drawImage(img, 0, 0); } else { c.width = Math.round(c.width * 0.93); c.height = Math.round(c.height * 0.93); x.drawImage(img, 0, 0, c.width, c.height); } return c.toDataURL("image/jpeg", 0.9); }, [src, kind]);
const fWarm = tmp("after-warm.jpg", await mk("warm"));
const fBlur = tmp("after-blur.jpg", await mk("blur"));
const fSame = tmp("after-same.jpg", await mk("same"));
await H2.context().close();
const C = await newPage();
const runCompare = async (b, a) => {
  await C.goto(BASE + "/compare");
  await C.setInputFiles('[data-testid="before-input"]', b);
  await C.waitForSelector('[data-testid="side-before"][data-status="ok"], [data-testid="side-before-failed"]', { timeout: 120000 });
  await C.setInputFiles('[data-testid="after-input"]', a);
  await C.waitForSelector('[data-testid="side-after"][data-status="ok"], [data-testid="side-after-failed"]', { timeout: 120000 });
  if (!(await C.$('[data-testid="compare-result"]'))) return null;
  return { issues: (await C.getAttribute('[data-testid="condition"]', "data-issues")).split(",").filter(Boolean), verdicts: Object.fromEntries(await C.locator('[data-testid^="cat-"]').evaluateAll((els) => els.map((e) => [e.dataset.testid.slice(4), e.dataset.verdict]))) };
};
await check("B01", "같은 조건의 전후 사진(리사이즈·재압축만 다름) → '변화 없음' (개선으로 표시하지 않음)", async () => {
  const r = await runCompare(portrait, fSame);
  assert(r, "no result");
  assert(r.issues.length === 0, "condition issues: " + r.issues);
  const vs = Object.values(r.verdicts);
  assert(vs.every((v) => v === "no_change"), JSON.stringify(r.verdicts));
  await C.click('[data-testid="cz-left_cheek"]');
  await C.waitForSelector('[data-testid="zone-change"]');
  await C.waitForSelector('[data-testid="compare-slider"]');
  await C.screenshot({ path: path.join(OUT, "compare.png"), fullPage: true });
});
await check("B02", "다른 조명(색온도)에서 촬영한 전후 사진 → 색 지표 '비교 불가'", async () => {
  const r = await runCompare(portrait, fWarm);
  assert(r, "no result");
  assert(r.issues.includes("white_balance") || r.issues.includes("lighting_level"), "issues: " + r.issues);
  for (const m of ["toneUniformity", "pigmentVisibility", "rednessVisibility"]) assert(r.verdicts[m] === "not_comparable", `${m}=${r.verdicts[m]}`);
  return `조건 차이: ${r.issues.join(", ")}`;
});
await check("B03", "선명도가 다른 전후 사진 → 결·모공·주름 '비교 불가' (흐려서 좋아진 것을 개선으로 표시하지 않음)", async () => {
  const r = await runCompare(portrait, fBlur);
  assert(r, "no result");
  assert(r.issues.includes("sharpness"), "issues: " + r.issues);
  for (const m of ["texture", "poreVisibility", "wrinkleVisibility"]) assert(r.verdicts[m] === "not_comparable", `${m}=${r.verdicts[m]}`);
});
await C.context().close();

// ── 5. 다국어 · 모바일 ─────────────────────────────────────
const TITLES = { ko: "피부 분석 시작", en: "Start", ja: "肌", zh: "皮肤", es: "piel", vi: "da", ru: "кож" };
for (const [lang, needle] of Object.entries(TITLES)) {
  await check(`L-${lang}`, `다국어: ${lang}`, async () => {
    const page = await newPage();
    await page.goto(`${BASE}/?lang=${lang}`);
    await page.waitForFunction((l) => document.documentElement.lang.startsWith(l), lang, { timeout: 15000 });
    const body = (await page.textContent("main")).toLowerCase();
    assert(body.includes(needle.toLowerCase()), `"${needle}" not found`);
    if (lang !== "ko") assert(!/[가-힣]/.test(body), "untranslated Korean text remains: " + (body.match(/[가-힣][가-힣 ]{2,20}/) || [""])[0]);
    await page.context().close();
  });
}
await check("L-report", "분석 결과·케어 가이드가 선택 언어로 출력 (en)", async () => {
  const page = await newPage();
  assert(await runFlow(page, portrait, { lang: "en" }), "flow");
  await page.waitForSelector('[data-testid="sim-slider"]', { timeout: 60000 });
  const txt = await page.textContent('[data-testid="report"]');
  const ko = txt.match(/[가-힣][가-힣 ]{2,30}/g) || [];
  assert(ko.length === 0, "Korean left in EN report: " + ko.slice(0, 3).join(" / "));
  await page.screenshot({ path: path.join(OUT, "report-en.png"), fullPage: true });
  await page.context().close();
});
for (const [id, name, ua] of [["MB1", "모바일 Chrome 에뮬레이션 (Pixel 7)", "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36"], ["MB2", "모바일 Safari UA 에뮬레이션 (iPhone, Chromium 엔진)", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"]]) {
  await check(id, name, async () => {
    const page = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: ua, deviceScaleFactor: 2 });
    assert(await runFlow(page, portrait), "flow");
    await page.tap('[data-testid="zone-btn-chin"]');
    await page.waitForSelector('[data-testid="zone-detail"]');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 1, `horizontal overflow ${overflow}px`);
    await page.waitForSelector('[data-testid="sim-slider"]', { timeout: 60000 });
    const sb = await page.locator('[data-testid="sim-slider"]').boundingBox();
    await page.touchscreen.tap(sb.x + sb.width * 0.2, sb.y + sb.height / 2);
    if (id === "MB1") await page.screenshot({ path: path.join(OUT, "report-mobile.png"), fullPage: true });
    assert(page.errors.length === 0, page.errors.join("|"));
    await page.context().close();
  });
}
await check("MB3", "저사양 기기 → 3D 대신 2D 자동 전환", async () => {
  const page = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.addInitScript(() => { Object.defineProperty(navigator, "deviceMemory", { get: () => 1 }); Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 2 }); });
  assert(await runFlow(page, portrait, { survey: false }), "flow");
  assert(!(await page.$('[data-testid="view-3d"]')), "3D toggle shown on low-end device");
  assert(await page.$('[data-testid="face-map"]'), "2D map missing");
  await page.goto(BASE + "/");
  await page.waitForTimeout(800);
  assert((await page.locator("main canvas").count()) === 0, "WebGL canvas created on low-end device");
  // 3D 대신 Blender 로 미리 렌더링한 이미지 시퀀스가 표시된다
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-testid="face-sequence"]')).backgroundImage.includes("face-sequence.webp"), null, { timeout: 15000 });
  await page.context().close();
});

// ── 5.5 공식 영상 · Gemini 해설 ───────────────────────────
await check("V01", "공식 영상: 누르기 전에는 YouTube 요청 없음 → 구간 버튼으로 해당 시각부터 재생", async () => {
  const page = await newPage();
  const yt = [];
  await page.route(/youtube|ytimg|googlevideo/, (r) => { yt.push(r.request().url()); r.abort(); });
  assert(await runFlow(page, portrait), "flow");
  await page.waitForSelector('[data-testid="guide-video"]');
  assert(yt.length === 0, "YouTube requested before click: " + yt[0]);
  assert(await page.$('[data-testid="track-plan"]'), "tracking plan missing");
  await page.click('[data-testid="chapter-faceRf"]');
  const src = await page.getAttribute('[data-testid="video-frame"]', "src");
  assert(src.startsWith("https://www.youtube-nocookie.com/embed/iRa1JqPJznk?start=1631"), src);
  await page.locator('[data-testid^="watch-"]').first().click();
  const src2 = await page.getAttribute('[data-testid="video-frame"]', "src");
  assert(/start=(820|1324|1631)/.test(src2), src2);
  await page.context().close();
  return src.split("?")[1];
});
const MOCK_PORT = Number(process.env.GEMINI_MOCK_PORT || 0);
if (MOCK_PORT && PW) {
  // 모의 Gemini 서버: 실제 Google 로는 아무것도 보내지 않는다
  const seen = [];
  let failNext = false;
  const mock = http.createServer((req, res) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => {
      const j = JSON.parse(b || "{}");
      seen.push({ url: req.url, key: req.headers["x-goog-api-key"], hasImage: Boolean(j.contents?.[0]?.parts?.some((p) => p.inlineData?.data?.length > 2000)), schema: Boolean(j.generationConfig?.responseSchema), system: j.systemInstruction?.parts?.[0]?.text ?? "" });
      if (failNext) { failNext = false; res.writeHead(500); return res.end("{}"); }
      const out = { summary: "MOCK 요약: 볼 부위 톤이 비교적 고르게 보입니다.", observations: [{ zone: "left_cheek", note: "작은 점들이 보입니다." }, { zone: "not_a_zone", note: "버려져야 함" }], agreement: [{ metric: "toneUniformity", view: "agree", note: "지수와 비슷합니다." }], careExplanation: "MOCK 케어 설명.", skinAge: 27, score: 99 };
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(out) }] }, finishReason: "STOP" }] }));
    });
  });
  await new Promise((r) => mock.listen(MOCK_PORT, "127.0.0.1", r));
  const adm = await (await browser.newContext()).newPage();
  const acall = (url, init) => adm.evaluate(async ([u, i]) => { const r = await fetch(u, i); let body = null; try { body = await r.json(); } catch {} return { status: r.status, body }; }, [BASE + url, init]);
  await adm.goto(BASE + "/privacy");
  await acall("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: PW }) });
  const setAi = async (enabled, paid) => { const cur = (await acall("/api/admin/config")).body.config; await acall("/api/admin/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...cur, aiInsight: { enabled, paidTierConfirmed: paid } }) }); await adm.waitForTimeout(300); };
  const jpeg = "/9j/" + "A".repeat(3000);
  const post = (b) => acall("/api/ai/insight", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
  await check("G01", "Gemini 해설: 기본은 꺼짐 (패널 없음 · API 503) / 유료 등급 미확인 시에도 꺼짐", async () => {
    await setAi(false, false);
    assert((await post({ consent: true, imageBase64: jpeg, indices: {}, locale: "ko", sid: "x" })).status === 503, "API not disabled");
    await setAi(true, false);
    assert((await post({ consent: true, imageBase64: jpeg, indices: {}, locale: "ko", sid: "x" })).status === 503, "enabled without paid-tier confirmation");
    assert((await acall("/api/config?t=" + Date.now(), { cache: "no-store" })).body.aiInsight.available !== true, "available flag");
    assert(seen.length === 0, "upstream called while disabled");
  });
  await check("G02", "Gemini 해설: 동의 없는 요청·잘못된 이미지 거부", async () => {
    await setAi(true, true);
    assert((await post({ imageBase64: jpeg, indices: {}, locale: "ko", sid: "x" })).status === 400, "no consent accepted");
    assert((await post({ consent: true, imageBase64: "hello", indices: {}, locale: "ko", sid: "x" })).status === 400, "bad image accepted");
    assert(seen.length === 0, "upstream called for rejected request");
  });
  await check("G03", "Gemini 해설: 동의 → 축소 사진 전송 → 결과 표시 (허용 스키마만, 점수·피부 나이 없음)", async () => {
    const page = await newPage();
    requests.length = 0;
    assert(await runFlow(page, portrait), "flow");
    await page.waitForSelector('[data-testid="ai-insight"]');
    assert(!requests.some((r) => r.url.includes("/api/ai/insight")), "sent before consent");
    assert(await page.isDisabled('[data-testid="ai-run"]'), "run enabled without consent");
    await page.check('[data-testid="ai-consent"]');
    await page.click('[data-testid="ai-run"]');
    await page.waitForSelector('[data-testid="ai-result"]', { timeout: 30000 });
    const txt = await page.textContent('[data-testid="ai-result"]');
    assert(txt.includes("MOCK 요약") && txt.includes("MOCK 케어 설명"), "result not shown");
    assert(!txt.includes("버려져야") && !/27|99/.test(txt.replace(/gemini[\w.-]*/g, "")), "unvalidated fields leaked: " + txt.slice(0, 200));
    const s = seen.at(-1);
    assert(s.key === "e2e-test-key" && s.hasImage && s.schema && /Never give a medical diagnosis/.test(s.system), "upstream request shape: " + JSON.stringify({ ...s, system: s.system.slice(0, 30) }));
    const overall = await page.getAttribute('[data-testid="overall-score"]', "data-value");
    assert(overall === String(base.result.analysis.overallConditionScore), "score changed by Gemini");
    await page.screenshot({ path: path.join(OUT, "ai-insight.png"), fullPage: true });
    await page.context().close();
    return `upstream ${s.url}`;
  });
  await check("G04", "Gemini 장애 → 오류 안내, 분석 결과는 그대로", async () => {
    const page = await newPage();
    assert(await runFlow(page, portrait, { survey: false }), "flow");
    failNext = true;
    await page.check('[data-testid="ai-consent"]');
    await page.click('[data-testid="ai-run"]');
    await page.waitForSelector('[data-testid="ai-error"]', { timeout: 30000 });
    assert(await page.$('[data-testid="report"]'), "report gone");
    await page.context().close();
    await setAi(false, false);
  });
  mock.close();
} else rec("G01", "Gemini 해설 (GEMINI_MOCK_PORT 미지정으로 건너뜀)", false, "skipped");

// ── 6. 관리자 · 통계 ───────────────────────────────────────
const api = await (await browser.newContext()).newPage();
const call = (url, init) => api.evaluate(async ([u, i]) => { const r = await fetch(u, i); let body = null; try { body = await r.json(); } catch {} return { status: r.status, body }; }, [BASE + url, init]);
await api.goto(BASE + "/privacy");
await check("A01", "관리자 API: 미인증 차단", async () => {
  for (const u of ["/api/admin/stats", "/api/admin/config", "/api/admin/reports", "/api/admin/logs"]) assert((await call(u)).status === 401, u);
  assert((await call("/api/admin/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: "{}" })).status === 401, "PUT");
  assert((await call("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "wrong-password" }) })).status === 401, "wrong pw");
});
await check("A02", "통계 수집 API: 잘못된 이벤트·이미지 포함 페이로드 거부", async () => {
  const post = (b) => call("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: typeof b === "string" ? b : JSON.stringify(b) });
  assert((await post({ type: "nope", sid: "x" })).status === 400, "bad type");
  assert((await post("{bad json")).status === 400, "bad json");
  assert((await post({ type: "visit", sid: "x", props: { reason: "data:image/jpeg;base64," + "A".repeat(5000) } })).status === 413, "oversize");
});
if (PW) {
  await check("A03", "관리자 로그인 → 대시보드 통계", async () => {
    await api.goto(BASE + "/admin");
    await api.fill('[data-testid="admin-password"]', PW);
    await api.click('[data-testid="admin-submit"]');
    await api.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 20000 });
    const s = (await call("/api/admin/stats?days=1")).body.stats;
    assert(s.totals.started >= 5 && s.totals.succeeded >= 4, "totals " + JSON.stringify(s.totals));
    assert(s.totals.reportSaved >= 2 && s.totals.productClicks >= 0 && s.totals.compares >= 3, "saved/compare " + JSON.stringify(s.totals));
    assert(s.failReasons.length >= 1 && s.concerns.length >= 1 && s.techs.length >= 1, "breakdowns");
    await api.screenshot({ path: path.join(OUT, "admin.png"), fullPage: true });
    return `분석 ${s.totals.started}회, 업로드 성공률 ${s.rates.uploadSuccess}%, 분석 성공률 ${s.rates.analysisSuccess}%, 리포트 저장 ${s.totals.reportSaved}`;
  });
  await check("A04", "분석 로그·신고에 사진/점수 없음", async () => {
    await call("/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sid: "e2e", locale: "ko", message: "E2E 테스트 신고입니다", context: "e2e" }) });
    const logs = JSON.stringify((await call("/api/admin/logs")).body);
    assert(!/data:image|landmark|overallConditionScore|"ip"/i.test(logs), "sensitive data in logs");
    const reports = (await call("/api/admin/reports")).body.reports;
    assert(reports.some((r) => r.message.includes("E2E")), "report missing");
    return `로그 ${JSON.parse(logs).events.length}건, 신고 ${reports.length}건`;
  });
  await check("A05", "설정 변경(점수 기준 버전·보관 기간) → 이용자 설정에 반영, 비공식 URL 거부", async () => {
    const cur = (await call("/api/admin/config")).body.config;
    const next = { ...cur, calibration: { ...cur.calibration, version: "cal-e2e" }, retention: { sessionMinutes: 30, historyDays: 30 }, products: { ...cur.products, cream: { enabled: true, url: "https://evil.example.com/" } } };
    const saved = (await call("/api/admin/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) })).body.config;
    assert(saved.calibration.version === "cal-e2e" && saved.retention.historyDays === 30, "not saved");
    assert(saved.products.cream.url.startsWith("https://www.unincore.com/"), "non-official URL accepted");
    const pub = (await call("/api/config?t=" + Date.now(), { cache: "no-store" })).body;
    assert(pub.calibration.version === "cal-e2e", "public config not updated");
    await call("/api/admin/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }); // 기본값 복원
    assert((await call("/api/config?t=" + Date.now(), { cache: "no-store" })).body.calibration.version !== "cal-e2e", "restore failed");
  });
} else rec("A03", "관리자 로그인 (ADMIN_PASSWORD 미지정으로 건너뜀)", false, "skipped");

await browser.close();
const failed = results.filter((r) => !r.pass);
writeFileSync(path.join(OUT, "results.json"), JSON.stringify({ at: new Date().toISOString(), base: BASE, results }, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
