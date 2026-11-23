/**
 * itch.io "Name your own price"(최소 0원) 팩의 무료 파일을 브라우저로 받는다.
 *   node tools/assets/itch_download.cjs CREATOR GAME_SLUG "파일 이름 일부" OUT_PATH
 * 팩 페이지 → "Download Now" → "No thanks, just take me to the downloads" → 파일의 Download 버튼과 같은 절차다.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
(async () => {
  const [creator, slug, want, out] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true });
  const p = await ctx.newPage();
  await p.goto(`https://${creator}.itch.io/${slug}`, { waitUntil: "domcontentloaded" });
  const url = await p.evaluate(async (base) => {
    const csrf = document.querySelector('meta[name="csrf_token"]')?.content || document.querySelector('input[name="csrf_token"]')?.value;
    const r = await fetch(base + "/download_url", { method: "POST", body: new URLSearchParams({ csrf_token: csrf }), headers: { "X-Requested-With": "XMLHttpRequest" } });
    return (await r.json()).url;
  }, `https://${creator}.itch.io/${slug}`);
  await p.goto(url, { waitUntil: "domcontentloaded" });
  const row = p.locator(".upload", { hasText: want }).first();
  const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 600000 }), row.locator(".download_btn").click()]);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await dl.saveAs(out);
  console.log("saved", out, fs.statSync(out).size);
  await b.close();
})().catch((e) => { console.error(String(e)); process.exit(1); });
