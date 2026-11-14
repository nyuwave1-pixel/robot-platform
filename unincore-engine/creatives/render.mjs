// Template renderer: official product photo + verified copy → PNG promo images.
// The photo is only scaled to fit (never cropped, recoloured or regenerated).
// Usage: node render.mjs <spec.json> <outDir>   → prints a JSON list of written files.
import { readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error("playwright is not installed");
  process.exit(3);
}

const [specPath, outDir] = process.argv.slice(2);
const spec = JSON.parse(readFileSync(specPath, "utf8"));
mkdirSync(outDir, { recursive: true });

const FORMATS = { pinterest_pin: [1000, 1500], instagram_post: [1080, 1350], story: [1080, 1920] };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Light theme matching the site's product pages: Cloud Dancer base, packaging butter yellow, Amazon-orange button.
function html(p, w, h) {
  const img = `data:image/webp;base64,${readFileSync(p.imagePath).toString("base64")}`;
  const u = w / 100; // layout unit
  const tall = h / w > 1.6;
  const photo = Math.round(Math.min(w * 0.72, h * (tall ? 0.4 : h / w > 1.4 ? 0.4 : 0.36)));
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500&family=Hanken+Grotesk:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:${w}px;height:${h}px;overflow:hidden;color:#16150F;font-family:"Hanken Grotesk",system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;
  background:radial-gradient(60% 38% at 82% 6%,rgba(253,223,54,.55) 0,rgba(253,223,54,0) 70%),radial-gradient(70% 40% at 8% 96%,rgba(244,227,145,.75) 0,rgba(244,227,145,0) 72%),#F0EEE9}
.frame{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;padding:${(tall ? 9 : 6) * u}px ${6.5 * u}px ${(tall ? 8 : 5.2) * u}px}
.brand{font:500 ${4.6 * u}px "Bodoni Moda",Georgia,serif;letter-spacing:.04em}
.photo{margin-top:${(tall ? 5 : 3.4) * u}px;width:${photo}px;height:${photo}px;border-radius:${3.2 * u}px;overflow:hidden;background:#fff;box-shadow:0 0 0 1px rgba(22,21,15,.06),0 ${3 * u}px ${7 * u}px -${3 * u}px rgba(58,47,5,.35)}
.photo img{width:100%;height:100%;object-fit:contain;display:block}
h1{font-weight:800;font-size:${6.6 * u}px;line-height:1.08;letter-spacing:-.035em;margin-top:${(tall ? 5.5 : 4) * u}px;max-width:${84 * u}px}
.sub{display:inline-block;margin-top:${2 * u}px;font-weight:700;font-size:${3.2 * u}px;background:#FDDF36;border-radius:${1.2 * u}px;padding:${0.7 * u}px ${1.8 * u}px}
ul{list-style:none;padding:0;margin-top:${(tall ? 4 : 2.8) * u}px;font-weight:500;font-size:${2.9 * u}px;line-height:1.2;color:#3b3a33}
li{padding:${1.05 * u}px ${2 * u}px}li+li{border-top:1px solid rgba(22,21,15,.12)}
.grow{flex:1}
.cta{margin-top:${2.4 * u}px;background:linear-gradient(180deg,#FFB13D,#FF9900);color:#16150F;font-weight:800;font-size:${3.4 * u}px;padding:${1.9 * u}px ${7 * u}px;border-radius:${1.8 * u}px;box-shadow:0 ${1.2 * u}px ${3 * u}px -${1 * u}px rgba(196,85,0,.55),inset 0 1px 0 rgba(255,255,255,.5)}
.site{margin-top:${1.9 * u}px;font-weight:500;font-size:${2.2 * u}px;letter-spacing:.08em;color:#6b6a62}
</style></head><body><div class="frame">
<div class="brand">UNI&amp;CORE</div>
<div class="photo"><img src="${img}" alt=""></div>
<h1>${esc(p.headline)}</h1><div><span class="sub">${esc(p.sub)}</span></div>
<ul>${p.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
<div class="grow"></div>
<div class="cta">${esc(spec.cta)}</div><div class="site">${esc(spec.site)}</div>
</div></body></html>`;
}

const browser = await chromium.launch();
const written = [];
try {
  for (const p of spec.products) {
    for (const f of spec.formats) {
      const [w, h] = FORMATS[f];
      const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      await page.setContent(html(p, w, h), { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => {
        const fr = document.querySelector(".frame");
        return fr.scrollHeight > fr.clientHeight + 1 || fr.scrollWidth > fr.clientWidth + 1;
      });
      if (overflow) throw new Error(`layout overflow: ${p.slug} ${f}`);
      const file = path.join(outDir, `${p.slug}-${f}.png`);
      await page.screenshot({ path: file });
      await page.close();
      written.push({ product_id: p.product_id, format: f, file, width: w, height: h });
    }
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(written));
