// 사용: node tests/e2e/raw.mjs <mode raw|analyze> <image...>  → 실제 브라우저 파이프라인 실행 결과(JSON)
import { createRequire } from "node:module";
// playwright 는 전역 설치본을 사용한다: NODE_PATH=$(npm root -g) node tests/e2e/…
const { chromium } = createRequire(import.meta.url)("playwright");
import { readFileSync } from "node:fs";
import path from "node:path";
const [mode, ...files] = process.argv.slice(2);
const base = process.env.BASE_URL || "http://localhost:3200";
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("PAGEERROR", e.message));
await page.goto(base + "/dev/harness");
await page.waitForFunction(() => typeof window.__analyze === "function", null, { timeout: 120000 });
const out = {};
for (const f of files) {
  const ext = path.extname(f).slice(1).replace("jpg", "jpeg");
  const dataUrl = `data:image/${ext};base64,` + readFileSync(f).toString("base64");
  try {
    out[path.basename(f)] = await page.evaluate(([m, d]) => (m === "raw" ? window.__raw(d) : window.__analyze(d)), [mode, dataUrl]);
  } catch (e) {
    out[path.basename(f)] = { error: String(e).slice(0, 300) };
  }
}
console.log(JSON.stringify(out));
await browser.close();
