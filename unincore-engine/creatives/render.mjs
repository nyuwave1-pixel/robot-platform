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

function html(p, w, h) {
  const img = `data:image/webp;base64,${readFileSync(p.imagePath).toString("base64")}`;
  const u = w / 100; // layout unit
  const photoH = Math.round(h * (h / w > 1.6 ? 0.44 : h / w > 1.4 ? 0.42 : 0.35));
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
body{width:${w}px;height:${h}px;background:radial-gradient(70% 45% at 75% 0,#2a1e0c 0,#0b0907 62%);color:#F6EFE2;font-family:Georgia,"Times New Roman",serif;display:flex}
.frame{margin:${3.2 * u}px;border:1px solid rgba(233,185,77,.55);border-radius:${2.4 * u}px;flex:1;display:flex;flex-direction:column;align-items:center;padding:${4.4 * u}px ${5.5 * u}px ${3.6 * u}px;text-align:center}
.brand{font-size:${3.5 * u}px;letter-spacing:.3em;color:#E9B94D}
.photo{margin-top:${3.4 * u}px;height:${photoH}px;border-radius:${2 * u}px;overflow:hidden;display:flex}
.photo img{height:100%;width:auto;display:block}
h1{font-weight:500;font-size:${6.4 * u}px;line-height:1.1;margin-top:${4 * u}px}
.sub{font-style:italic;color:#E9B94D;font-size:${3.3 * u}px;margin-top:${1.6 * u}px}
ul{list-style:none;padding:0;margin-top:${3 * u}px;font:400 ${2.8 * u}px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;color:#d9d0c0}
li{padding:${1.05 * u}px 0}li+li{border-top:1px solid rgba(233,185,77,.2)}
.grow{flex:1}
.cta{margin-top:${2.4 * u}px;background:linear-gradient(180deg,#f0c860,#d6a436);color:#17110a;font:600 ${3.2 * u}px system-ui,-apple-system,"Segoe UI",sans-serif;padding:${1.7 * u}px ${6 * u}px;border-radius:99px}
.site{margin-top:${2 * u}px;font:400 ${2.2 * u}px system-ui,sans-serif;letter-spacing:.12em;color:#a59c8d}
</style></head><body><div class="frame">
<div class="brand">UNI&amp;CORE</div>
<div class="photo"><img src="${img}" alt=""></div>
<h1>${esc(p.headline)}</h1><div class="sub">${esc(p.sub)}</div>
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
      await page.setContent(html(p, w, h), { waitUntil: "load" });
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
