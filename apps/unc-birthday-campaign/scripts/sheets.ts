/**
 * Contact sheets for review: one sheet per language × campaign × kind, every size labelled.
 *   tsx scripts/sheets.ts [exportsDir]   → exports/_sheets/{lang}_{campaign}_{online|print}.jpg
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { CAMPAIGN_META } from "../src/localization/copy";
import { sizeById } from "../src/templates/sizes";

const OUT = path.resolve(process.argv[2] ?? "exports");
const man = JSON.parse(fs.readFileSync(path.join(OUT, "manifest.json"), "utf8"));
const dir = path.join(OUT, "_sheets"); fs.mkdirSync(dir, { recursive: true });
const W = 2400, ROW_H = 300, GAP = 24, LABEL = 34, PAD = 40, HEAD = 120;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const groups = new Map<string, any[]>();
for (const it of man.items) { const k = `${it.lang}_${it.campaign}_${it.kind}`; (groups.get(k) ?? groups.set(k, []).get(k)!).push(it); }

for (const [k, items] of groups) {
  const [lang, campaign, kind] = k.split("_");
  const tiles: Array<{ buf: Buffer; w: number; h: number; label: string }> = [];
  for (const it of items) {
    const s = sizeById(it.size)!;
    const src = path.join(OUT, kind === "online" ? it.files.jpg.path : it.files["RGB-preview.jpg"].path);
    const rh = s.h / s.w > 2.5 ? ROW_H * 1.6 : ROW_H;
    const img = sharp(src).resize({ height: Math.round(rh), width: W - PAD * 2, fit: "inside" });
    const buf = await img.toBuffer(); const m = await sharp(buf).metadata();
    const errs = it.issues.filter((i: any) => i.level === "error").length;
    tiles.push({ buf, w: m.width!, h: m.height!, label: `${s.label.ko} · ${s.w}×${s.h}${kind === "print" ? "mm" : ""}${errs ? `  ⚠ ${errs}` : "  ✓"}` });
  }
  // flow layout
  const rows: Array<typeof tiles> = []; let row: typeof tiles = []; let x = 0;
  for (const t of tiles) { if (row.length && x + t.w > W - PAD * 2) { rows.push(row); row = []; x = 0; } row.push(t); x += t.w + GAP; }
  if (row.length) rows.push(row);
  const H = HEAD + rows.reduce((a, r) => a + Math.max(...r.map((t) => t.h)) + LABEL + GAP, 0) + PAD;
  const comps: sharp.OverlayOptions[] = []; let y = HEAD; let labels = "";
  for (const r of rows) {
    let cx = PAD; const rh = Math.max(...r.map((t) => t.h));
    for (const t of r) { comps.push({ input: t.buf, left: cx, top: y }); labels += `<text x="${cx}" y="${y + rh + 24}" font-size="17" fill="#b7ab9c">${esc(t.label)}</text>`; cx += t.w + GAP; }
    y += rh + LABEL + GAP;
  }
  const meta = CAMPAIGN_META[campaign as keyof typeof CAMPAIGN_META];
  const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#0b0908"/>
<text x="${PAD}" y="62" font-size="38" fill="#f4efe7" font-family="Georgia, serif" letter-spacing="2">UNI&amp;CORE · ${meta.no} ${esc(meta.name)}</text>
<text x="${PAD}" y="96" font-size="20" fill="#c6a16a">${kind === "online" ? "ONLINE" : "PRINT (RGB preview of CMYK PDF)"} · ${lang.toUpperCase()} · ${items.length} sizes</text>${labels}</svg>`;
  await sharp(Buffer.from(head)).composite(comps).jpeg({ quality: 84 }).toFile(path.join(dir, `${k}.jpg`));
  console.log(`${k}.jpg ${items.length} tiles`);
}
