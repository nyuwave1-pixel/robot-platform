#!/usr/bin/env node
/**
 * 스모크 체크: 빌드된 게임을 헤드리스 브라우저로 열어 "열린다 · 반응한다 · 읽힌다"를 확인하고
 * 스크린샷을 qa/evidence/ 에 남긴다. 재미나 난이도를 판정하지 않는다 — 그건 사람이 플레이해서 본다.
 *
 *   npm run build && npm run smoke
 *
 * 결과는 qa/smoke-latest.tsv (행: 이름 · pass/fail/not_assessed · 관찰값). 실패가 있으면 종료 코드 1.
 * Playwright 가 없으면 모든 행을 not_assessed 로 적고 0 으로 끝난다(통과로 치지 않는다).
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const PORT = 4317, URL = `http://localhost:${PORT}/?debug`;
const MIN_TEXT_PX = 12;
const rows = [];
const row = (name, status, note = "") => { rows.push([name, status, String(note)]); console.log(`${status.padEnd(12)} ${name}  ${note}`); };
const finish = (code) => { mkdirSync("qa", { recursive: true }); writeFileSync("qa/smoke-latest.tsv", rows.map((r) => r.join("\t")).join("\n") + "\n"); process.exit(code); };

if (!existsSync("dist/index.html")) { console.error("dist/ 가 없습니다. 먼저 npm run build 를 실행하세요."); process.exit(2); }
let chromium;
// 프로젝트 의존성으로 두지 않는다: 로컬·전역(NODE_PATH) 어디에 설치돼 있든 찾는다
try { ({ chromium } = createRequire(import.meta.url)("playwright")); } catch {
  for (const n of ["boots", "responds", "text", "care", "save"]) row(n, "not_assessed", "playwright 미설치");
  finish(0);
}

const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { stdio: "ignore" });
const stop = () => { try { server.kill(); } catch { /* 이미 종료 */ } };
process.on("exit", stop);
for (let i = 0; i < 50; i++) { try { if ((await fetch(URL)).ok) break; } catch { /* 대기 */ } await new Promise((r) => setTimeout(r, 200)); }

mkdirSync("qa/evidence", { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, locale: "ko-KR" });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("uncaught: " + e.message));
const shot = (n) => page.screenshot({ path: `qa/evidence/${n}.png` });

/** 화면에 보이는 글자 중 기준보다 작거나 창 밖으로 나간 것 */
const measureText = () => page.evaluate((min) => {
  const small = [], off = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const t = n.textContent.trim(); const el = n.parentElement;
    if (!t || !el) continue;
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    if (r.width === 0 || r.height === 0 || cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
    if (parseFloat(cs.fontSize) < min) small.push(`${t.slice(0, 16)}(${cs.fontSize})`);
    if (r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) off.push(t.slice(0, 16));
  }
  return { small, off };
}, MIN_TEXT_PX);
const textIssues = [];
const checkText = async (where) => { const m = await measureText(); for (const s of m.small) textIssues.push(`${where}:${s}`); };

try {
  await page.goto(URL); await page.waitForTimeout(1500);
  await shot("01-splash"); await checkText("splash");
  await page.getByText("새로 시작하기").click();
  await page.getByText("건너뛰기").click(); await page.waitForTimeout(800);
  await page.locator("input").fill("스모크"); await checkText("create");
  await page.getByText("라운지로 들어가기").click(); await page.waitForTimeout(2500);
  await page.evaluate(() => window.__mdl.useGame.getState().setSettings({ quality: "low" }));
  const canvas = await page.locator("canvas").count();
  await shot("02-lounge"); await checkText("lounge");
  row("boots", canvas > 0 && errors.length === 0 ? "pass" : "fail", `canvas=${canvas} errors=${errors.length}${errors[0] ? " " + errors[0].slice(0, 80) : ""}`);

  // 반응: 키를 누르면 캐릭터가 실제로 움직이는가
  const p0 = await page.evaluate(() => ({ ...window.__mdl.input.playerPos }));
  await page.keyboard.down("KeyW"); await page.waitForTimeout(1200); await page.keyboard.up("KeyW");
  const p1 = await page.evaluate(() => ({ ...window.__mdl.input.playerPos }));
  const moved = Math.hypot(p1.x - p0.x, p1.z - p0.z);
  row("responds", moved > 0.2 ? "pass" : "fail", `moved=${moved.toFixed(2)}m`);

  // 케어: 루틴 선택 → 제품 바르기 → 부위 진행 → 결과
  await page.locator("nav button", { hasText: "BEAUTY CARE" }).click(); await page.waitForTimeout(1500);
  await checkText("care-pick");
  await page.getByText("붓기 완화 루틴").click(); await page.waitForTimeout(300);
  for (let i = 0; i < 30; i++) {
    const c = await page.evaluate(() => { const c = window.__mdl.useUI.getState().care; return c && { phase: c.phase, applied: c.applied }; });
    if (!c || c.phase !== "step") break;
    if (!c.applied) { await page.getByRole("button", { name: "바르기" }).first().click(); await page.waitForTimeout(400); if (i === 0) { await shot("03-care"); await checkText("care"); } continue; }
    await page.evaluate(() => window.__mdl.addProgress(1.01)); await page.waitForTimeout(100);
  }
  await page.getByRole("button", { name: "건너뛰기" }).click(); await page.waitForTimeout(500);
  const res = await page.evaluate(() => window.__mdl.useUI.getState().care?.phase);
  await shot("04-care-result"); await checkText("care-result");
  row("care", res === "result" ? "pass" : "fail", `phase=${res}`);
  await page.getByRole("button", { name: "확인" }).click(); await page.waitForTimeout(600);

  await page.locator("nav button", { hasText: "ITEM SHOP" }).click(); await page.waitForTimeout(600);
  await shot("05-shop"); await checkText("shop");

  // 저장: 새로고침 후에도 진행도가 남는가
  const before = await page.evaluate(() => window.__mdl.useGame.getState().stats.care);
  await page.reload(); await page.waitForTimeout(1200);
  const after = await page.evaluate(() => ({ started: window.__mdl.useGame.getState().started, care: window.__mdl.useGame.getState().stats.care }));
  row("save", after.started && after.care === before ? "pass" : "fail", `care ${before} -> ${after.care}`);

  const uniq = [...new Set(textIssues)];
  row("text", uniq.length === 0 ? "pass" : "fail", uniq.length ? `${MIN_TEXT_PX}px 미만 ${uniq.length}건: ${uniq.slice(0, 6).join(", ")}` : `모든 글자 ${MIN_TEXT_PX}px 이상`);
  row("console", errors.length === 0 ? "pass" : "fail", `errors=${errors.length}`);
} catch (e) {
  await shot("99-failure").catch(() => {});
  row("run", "fail", String(e.message).split("\n")[0].slice(0, 160));
}
await browser.close(); stop();
finish(rows.some((r) => r[1] === "fail") ? 1 : 0);
