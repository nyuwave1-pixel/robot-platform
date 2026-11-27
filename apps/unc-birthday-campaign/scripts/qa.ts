/**
 * QA over exports/manifest.json — re-opens every file and checks it against the size registry and brand rules.
 *   tsx scripts/qa.ts [exportsDir]
 * Writes exports/QA_REPORT.md and exports/qa-report.json; exits 1 if any check fails.
 */
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, PDFName, PDFRawStream, PDFDict } from "pdf-lib";
import jsQR from "jsqr";
import sharp from "sharp";
import { CAMPAIGN_META } from "../src/localization/copy";
import { sizeById } from "../src/templates/sizes";

const OUT = path.resolve(process.argv[2] ?? "exports");
const man = JSON.parse(fs.readFileSync(path.join(OUT, "manifest.json"), "utf8"));
type Check = { id: string; ok: boolean; detail?: string };
const rows: Array<{ key: string; checks: Check[] }> = [];
const PT = 72 / 25.4;
const near = (a: number, b: number, tol = 0.6) => Math.abs(a - b) <= tol;

for (const it of man.items) {
  const s = sizeById(it.size)!; const checks: Check[] = [];
  const add = (id: string, ok: boolean, detail?: string) => checks.push({ id, ok, detail });
  const errors = it.issues.filter((i: any) => i.level === "error");
  add("layout", errors.length === 0, errors.map((e: any) => e.msg).join("; ") || undefined);
  add("product-aspect", it.product?.aspectOk !== false, it.product?.aspectOk === false ? "product image distorted" : undefined);
  if (it.campaign === "clinical-beauty") add("clinical-footnote", it.claims.footnote, "임상 수치에는 시험 조건 각주 필수");
  if (it.campaign === "28-days") add("story-disclaimer", it.claims.storyDisclaimer, "28일 스토리텔링 고지 필수");
  add("glyphs", !it.issues.some((i: any) => i.code === "missing-glyph"));

  if (it.kind === "online") {
    for (const ext of ["png", "jpg"]) {
      const f = path.join(OUT, it.files[ext].path);
      try { const m = await sharp(f).metadata(); add(`${ext}-pixels`, m.width === s.w && m.height === s.h, `${m.width}×${m.height}`); add(`${ext}-srgb`, m.space === "srgb", m.space); }
      catch (e) { add(`${ext}-opens`, false, String(e)); }
    }
    if (s.maxKB) add("file-size", it.files.jpg.bytes <= s.maxKB * 1024, `${Math.round(it.files.jpg.bytes / 1024)}KB / ≤${s.maxKB}KB (q${it.jpgQuality})`);
    const svg = fs.readFileSync(path.join(OUT, it.files.svg.path), "utf8");
    add("svg-self-contained", svg.startsWith("<svg") && !/href="(?!data:)/.test(svg));
  } else {
    const f = path.join(OUT, it.files["CMYK.pdf"].path);
    try {
      const doc = await PDFDocument.load(fs.readFileSync(f), { updateMetadata: false });
      const pg = doc.getPage(0); const b = (s.bleed ?? 3);
      const mb = pg.getMediaBox(), tb = pg.getTrimBox(), bb = pg.getBleedBox();
      add("media=size+bleed", near(mb.width, (s.w + 2 * b) * PT) && near(mb.height, (s.h + 2 * b) * PT), `${(mb.width / PT).toFixed(1)}×${(mb.height / PT).toFixed(1)}mm`);
      add("trimbox", near(tb.width, s.w * PT) && near(tb.height, s.h * PT) && near(tb.x, b * PT), `${(tb.width / PT).toFixed(1)}×${(tb.height / PT).toFixed(1)}mm @${(tb.x / PT).toFixed(1)}mm`);
      add("bleedbox", near(bb.width, mb.width) && near(bb.height, mb.height));
      // colour: every image XObject must be DeviceCMYK; no fonts (all type outlined)
      let imgs = 0, cmykImgs = 0, fonts = 0, ppi = 0;
      for (const [, obj] of doc.context.enumerateIndirectObjects()) {
        const dict = obj instanceof PDFRawStream ? obj.dict : obj instanceof PDFDict ? obj : null; if (!dict) continue;
        if (dict.get(PDFName.of("Type")) === PDFName.of("Font")) fonts++;
        if (dict.get(PDFName.of("Subtype")) === PDFName.of("Image")) {
          imgs++; if (String(dict.get(PDFName.of("ColorSpace"))) === "/DeviceCMYK") cmykImgs++;
          const w = Number(String(dict.get(PDFName.of("Width")))); ppi = Math.round(w / (mb.width / 72));
        }
      }
      add("cmyk", imgs > 0 && imgs === cmykImgs, `${cmykImgs}/${imgs} images DeviceCMYK`);
      add("fonts-outlined", fonts === 0, `${fonts} fonts`);
      add("raster-ppi", Math.abs(ppi - (s.dpi ?? 150)) <= 2, `${ppi} ppi (spec ${s.dpi})`);
    } catch (e) { add("pdf-opens", false, String(e)); }
    try {
      const prev = path.join(OUT, it.files["RGB-preview.jpg"].path);
      await sharp(prev).metadata(); add("rgb-preview", true);
      if (s.qr) {
        // decode the QR from the rendered artwork → must resolve to the campaign site for this language
        // A phone camera is aimed at the code, so scan the QR card region (located from the SVG, +25% margin
        // of surrounding artwork). Whole-poster search is unreliable on busy backgrounds such as marble veins.
        const svgSrc = fs.readFileSync(path.join(OUT, it.files.svg.path), "utf8");
        const vb = svgSrc.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
        const qm = svgSrc.match(/data-el="qr"><rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)"/);
        const meta = await sharp(prev).metadata();
        let img = sharp(prev);
        if (vb && qm) {
          const k = meta.width! / Number(vb[1]); const [qx, qy, qs] = qm.slice(1, 4).map(Number); const pad = qs * 0.25;
          const left = Math.max(0, Math.floor((qx - pad) * k)), top = Math.max(0, Math.floor((qy - pad) * k));
          const width = Math.min(meta.width! - left, Math.ceil((qs + pad * 2) * k)), height = Math.min(meta.height! - top, Math.ceil((qs + pad * 2) * k));
          img = img.extract({ left, top, width, height });
        }
        const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        const code = jsQR(new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), info.width, info.height);
        const want = `https://birthday.unincore.com${it.lang === "ko" ? "" : `/${it.lang}`}`;
        add("qr-scan", code?.data === want, code ? code.data : "not decoded");
      }
    } catch (e) { add("rgb-preview", false, String(e)); }
    const pd = it.product?.effDpi, bd = it.background?.effDpi;
    // informative: source pixels per inch at final size (large-format is viewed from distance; vendor guidance 60–100 ppi)
    add("source-resolution", true, `product ${pd ? Math.round(pd) : "-"} ppi · background ${bd ? Math.round(bd) : "-"} ppi`);
  }
  rows.push({ key: it.key, checks });
}

const failed = rows.filter((r) => r.checks.some((c) => !c.ok));
const by = (k: string) => rows.filter((r) => r.key.includes(k)).length;
const md: string[] = [];
md.push(`# QA REPORT — UNI&CORE 1ST BIRTHDAY CREAM campaign banners`, ``, `생성: ${man.generated} · 검사: ${new Date().toISOString()} · CMYK 프로파일: ${man.cmykProfile}`, ``);
md.push(`| 항목 | 수량 |`, `|---|---|`, `| 전체 배너 | ${rows.length} |`, `| 온라인 | ${by("/online/")} |`, `| 인쇄 | ${by("/print/")} |`, `| 한국어 / 영어 / 중국어 | ${by("ko/")} / ${by("en/")} / ${by("zh/")} |`, `| **실패** | **${failed.length}** |`, ``);
md.push(`## 체크리스트 (자동)`, ``);
const ids = [...new Set(rows.flatMap((r) => r.checks.map((c) => c.id)))];
md.push(`| 검사 | 통과 | 실패 |`, `|---|---|---|`);
for (const id of ids) { const all = rows.flatMap((r) => r.checks.filter((c) => c.id === id)); md.push(`| ${id} | ${all.filter((c) => c.ok).length} | ${all.filter((c) => !c.ok).length} |`); }
md.push(``, `## 캠페인별`, ``, `| 캠페인 | 배너 | 실패 |`, `|---|---|---|`);
for (const c of Object.keys(CAMPAIGN_META)) md.push(`| ${CAMPAIGN_META[c as keyof typeof CAMPAIGN_META].no} ${CAMPAIGN_META[c as keyof typeof CAMPAIGN_META].name} | ${by(`/${c}/`)} | ${failed.filter((r) => r.key.includes(`/${c}/`)).length} |`);
if (failed.length) { md.push(``, `## 실패 상세`, ``); for (const r of failed) md.push(`- \`${r.key}\`: ${r.checks.filter((c) => !c.ok).map((c) => `${c.id}${c.detail ? ` (${c.detail})` : ""}`).join(", ")}`); }
md.push(``, `## 인쇄 원본 해상도 (최종 크기 기준 ppi)`, ``, `| 파일 | 출력 ppi | 원본 이미지 |`, `|---|---|---|`);
for (const r of rows.filter((r) => r.key.startsWith("ko/print/skin-rebirth/"))) md.push(`| ${r.key.split("/").pop()} | ${r.checks.find((c) => c.id === "raster-ppi")?.detail ?? ""} | ${r.checks.find((c) => c.id === "source-resolution")?.detail ?? ""} |`);
fs.writeFileSync(path.join(OUT, "QA_REPORT.md"), md.join("\n") + "\n");
fs.writeFileSync(path.join(OUT, "qa-report.json"), JSON.stringify({ checked: rows.length, failed: failed.length, rows }, null, 1));
console.log(`QA: ${rows.length} banners, ${failed.length} failed → ${path.join(OUT, "QA_REPORT.md")}`);
process.exit(failed.length ? 1 : 0);
