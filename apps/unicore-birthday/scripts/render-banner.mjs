// Launch promotion banner for 1ST BIRTHDAY CREAM ("출시기념 4+2").
// Real product photo (cropped only) + text. Usage: node scripts/render-banner.mjs [outDir]
import { readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = process.argv[2] || path.join(root, "promo-banners");
mkdirSync(outDir, { recursive: true });

const COPY = {
  brand: "UNI&CORE",
  product: "1ST BIRTHDAY CREAM",
  productKo: "퍼스트 벌스데이 크림",
  badge: "출시기념",
  offer: "4+2",
  tagline: "피부의 첫 번째 생일",
  button: "출시기념 프로모션 페이지",
};
const photo = `data:image/webp;base64,${readFileSync(path.join(root, "public/media/product/product-open-box.webp")).toString("base64")}`;

const SIZES = [
  { name: "wide-1920x640", w: 1920, h: 640, layout: "row" },
  { name: "mobile-1080x1350", w: 1080, h: 1350, layout: "col" },
  { name: "square-1080x1080", w: 1080, h: 1080, layout: "col" },
];

function html({ w, h, layout }) {
  const row = layout === "row";
  const u = (row ? h : w) / 100;
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Noto+Sans+KR:wght@400;500;700&family=Noto+Serif+KR:wght@500;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{font-variant-numeric:lining-nums;width:${w}px;height:${h}px;overflow:hidden;background:#0b0907;color:#F6EFE2;font-family:"Noto Sans KR",sans-serif;display:flex;flex-direction:${row ? "row" : "column"}}
.photo{position:relative;${row ? `width:52%;height:100%;order:2` : `width:100%;height:${h > w ? 44 : 40}%`};background:url(${photo}) ${row ? "58% 46%/auto 118%" : `50% ${h > w ? 58 : 50}%/${h > w ? 150 : 138}% auto`} no-repeat}
.photo::after{content:"";position:absolute;inset:0;background:${row ? "linear-gradient(90deg,#0b0907 0,rgba(11,9,7,.55) 18%,rgba(11,9,7,0) 45%)" : "linear-gradient(0deg,#0b0907 0,rgba(11,9,7,.5) 16%,rgba(11,9,7,0) 42%)"}}
.text{flex:1;display:flex;flex-direction:column;justify-content:center;${row ? `padding:0 0 0 ${11 * u}px;align-items:flex-start;text-align:left` : `padding:${2 * u}px ${7 * u}px ${6 * u}px;align-items:center;text-align:center`};background:radial-gradient(80% 90% at ${row ? "0 50%" : "50% 100%"},#2a1e0c 0,#0b0907 70%)}
.brand{font:500 ${(row ? 3.4 : 3) * u}px "Cormorant Garamond",serif;letter-spacing:.32em;color:#E9B94D}
.name{font:500 ${(row ? 5.6 : 5) * u}px "Cormorant Garamond",serif;letter-spacing:.06em;margin-top:${1.2 * u}px}
.offer{display:flex;align-items:center;gap:${2.6 * u}px;margin-top:${(row ? 4.5 : 4) * u}px}
.badge{font:700 ${(row ? 5.2 : 4.6) * u}px "Noto Serif KR",serif;color:#17110a;background:linear-gradient(180deg,#f3d27a,#d6a436);padding:${1.2 * u}px ${2.6 * u}px;border-radius:${1.2 * u}px;line-height:1.15}
.num{font:600 ${(row ? 25 : 21) * u}px/0.9 "Cormorant Garamond",serif;background:linear-gradient(180deg,#fbe7a8,#E9B94D 55%,#b98a2a);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:-.01em}
.tag{font:400 ${(row ? 3.5 : 3.1) * u}px "Noto Sans KR",sans-serif;color:#d9d0c0;margin-top:${(row ? 3.4 : 3) * u}px;letter-spacing:.02em}
.tag b{font-weight:500;color:#F6EFE2}
.btn{margin-top:${(row ? 5 : 4.4) * u}px;display:inline-flex;align-items:center;gap:${1.6 * u}px;font:700 ${(row ? 3.9 : 3.5) * u}px "Noto Sans KR",sans-serif;color:#17110a;background:linear-gradient(180deg,#f6dc8f,#dfae3f);padding:${(row ? 2.5 : 2.2) * u}px ${(row ? 5.2 : 4.6) * u}px;border-radius:999px;box-shadow:0 ${1.2 * u}px ${4 * u}px rgba(233,185,77,.35),inset 0 1px 0 rgba(255,255,255,.6)}
.btn i{font-style:normal;display:grid;place-items:center;width:${(row ? 5 : 4.4) * u}px;height:${(row ? 5 : 4.4) * u}px;border-radius:50%;background:#17110a;color:#f6dc8f;font-size:${(row ? 3 : 2.7) * u}px;line-height:1}
</style></head><body>
<div class="photo" role="img" aria-label="UNI&amp;CORE 1ST BIRTHDAY CREAM"></div>
<div class="text">
  <div class="brand">${COPY.brand.replace("&", "&amp;")}</div>
  <div class="name">${COPY.product.replace(/^1/, '<span style="font-family:\'Noto Serif KR\',serif;font-size:.86em">1</span>')}</div>
  <div class="offer"><span class="badge">${COPY.badge}</span><span class="num">${COPY.offer}</span></div>
  <div class="tag"><b>${COPY.productKo}</b> · ${COPY.tagline}</div>
  <div class="btn">${COPY.button}<i>→</i></div>
</div></body></html>`;
}

const browser = await chromium.launch();
try {
  for (const s of SIZES) {
    const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 });
    await page.setContent(html(s), { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const fontsOk = await page.evaluate(() => document.fonts.check('700 20px "Noto Sans KR"', "출시기념") && document.fonts.check('600 20px "Cormorant Garamond"', "4+2"));
    if (!fontsOk) throw new Error("web fonts did not load");
    const file = path.join(outDir, `birthday-launch-4plus2-${s.name}.png`);
    await page.screenshot({ path: file });
    await page.close();
    console.log(file);
  }
} finally {
  await browser.close();
}
