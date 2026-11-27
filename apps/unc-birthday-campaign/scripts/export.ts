/**
 * Batch export.
 *
 *   tsx scripts/export.ts [--set online|print|all] [--lang ko,en,zh] [--campaign skin-rebirth,...] [--size id,...] [--jobs 3]
 *
 * Online → exports/{lang}/online/{campaign}/UNC_{campaign}_{size}_{WxH}_{lang}.{jpg,png,svg}
 * Print  → exports/{lang}/print/{campaign}/UNC_{campaign}_{size}_{WxHmm}_{lang}_CMYK.pdf  (+ _RGB-preview.jpg, + .svg)
 * Every banner's validation report is collected into exports/manifest.json (read by scripts/qa.ts).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { renderBanner } from "../src/campaigns";
import { allAssetPaths, inlineAssets, nodeEnv, warmAssets } from "../src/export/node-env";
import { buildPrintPdf, CMYK_ICC } from "../src/export/print-pdf";
import { CAMPAIGN_META } from "../src/localization/copy";
import { ONLINE, PRINT } from "../src/templates/sizes";
import type { CampaignId, Lang, SizeSpec } from "../src/rendering/types";

const argv = process.argv.slice(2);
const arg = (k: string, d?: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const set = arg("set", "all")!;
const langs = (arg("lang", "ko,en,zh")!).split(",") as Lang[];
const campaigns = (arg("campaign", Object.keys(CAMPAIGN_META).join(","))!).split(",") as CampaignId[];
const sizeFilter = arg("size")?.split(",");
const jobs = Number(arg("jobs", "1"));
const OUT = path.resolve(arg("out", "exports")!);
const worker = argv.includes("--worker");

const sizes = [...(set !== "print" ? ONLINE : []), ...(set !== "online" ? PRINT : [])].filter((s) => !sizeFilter || sizeFilter.includes(s.id));

/** ---------- parallel fan-out: one worker process per (lang, campaign) chunk ---------- */
if (jobs > 1 && !worker) {
  const tasks = langs.flatMap((l) => campaigns.map((c) => [l, c] as const));
  let next = 0; let failed = 0;
  const run = (): Promise<void> => {
    if (next >= tasks.length) return Promise.resolve();
    const [l, c] = tasks[next++];
    return new Promise<void>((res) => {
      const args = ["tsx", "scripts/export.ts", "--worker", "--set", set, "--lang", l, "--campaign", c, "--out", OUT, ...(sizeFilter ? ["--size", sizeFilter.join(",")] : [])];
      const p = spawn("npx", args, { stdio: "inherit" });
      p.on("exit", (code) => { if (code) failed++; res(); });
    }).then(run);
  };
  await Promise.all(Array.from({ length: Math.min(jobs, tasks.length) }, run));
  mergeManifests();
  process.exit(failed ? 1 : 0);
}

function mergeManifests() {
  const parts = fs.readdirSync(OUT).filter((f) => f.startsWith(".manifest-") && f.endsWith(".json"));
  const prev = fs.existsSync(path.join(OUT, "manifest.json")) ? JSON.parse(fs.readFileSync(path.join(OUT, "manifest.json"), "utf8")).items as Item[] : [];
  const map = new Map(prev.map((i) => [i.key, i]));
  for (const f of parts) { for (const it of JSON.parse(fs.readFileSync(path.join(OUT, f), "utf8")) as Item[]) map.set(it.key, it); fs.unlinkSync(path.join(OUT, f)); }
  const items = [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify({ generated: new Date().toISOString(), cmykProfile: path.basename(CMYK_ICC), count: items.length, items }, null, 1));
  console.log(`manifest: ${items.length} banners`);
}

interface Item {
  key: string; campaign: CampaignId; lang: Lang; size: string; kind: "online" | "print"; group: string; label: string;
  w: number; h: number; unit: "px" | "mm"; files: Record<string, { path: string; bytes: number; px?: [number, number] }>;
  maxKB?: number; jpgQuality?: number; archetype: string; issues: Array<{ level: string; code: string; msg: string }>;
  claims: { clinical: boolean; footnote: boolean; storyDisclaimer: boolean };
  product?: { aspectOk: boolean; effDpi?: number }; background?: { effDpi?: number }; dpi?: number; ms: number;
}

/** JPEG under a size budget: walk quality down from 92 until it fits (never below 62). */
async function jpegUnder(png: Buffer, maxKB?: number) {
  let q = 92; let buf = await sharp(png).jpeg({ quality: q, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
  while (maxKB && buf.length > maxKB * 1024 && q > 62) {
    q -= 4; buf = await sharp(png).jpeg({ quality: q, mozjpeg: true, chromaSubsampling: q >= 80 ? "4:4:4" : "4:2:0" }).toBuffer();
  }
  return { buf, q };
}

const name = (c: string, s: SizeSpec, l: string) => `UNC_${c}_${s.id}_${s.w}x${s.h}${s.kind === "print" ? "mm" : ""}_${l}`;

await warmAssets(allAssetPaths());
const env = nodeEnv();
const items: Item[] = [];
for (const lang of langs) for (const campaign of campaigns) {
  for (const size of sizes) {
    const t0 = Date.now();
    const dir = path.join(OUT, lang, size.kind, campaign); fs.mkdirSync(dir, { recursive: true });
    const base = path.join(dir, name(campaign, size, lang));
    const { svg: raw, report } = await renderBanner({ campaign, lang, size }, env);
    const svg = await inlineAssets(raw);
    const files: Item["files"] = {};
    const put = (ext: string, buf: Buffer | Uint8Array, px?: [number, number]) => { const p = `${base}${ext}`; fs.writeFileSync(p, buf); files[ext.replace(/^[._]/, "")] = { path: path.relative(OUT, p), bytes: buf.length, px }; };
    let jpgQuality: number | undefined;
    if (size.kind === "online") {
      const png = Buffer.from(new Resvg(svg, { fitTo: { mode: "original" }, background: "#080706" }).render().asPng());
      const m = await sharp(png).metadata();
      put(".png", png, [m.width!, m.height!]);
      const j = await jpegUnder(png, size.maxKB); jpgQuality = j.q;
      put(".jpg", j.buf, [m.width!, m.height!]);
      put(".svg", Buffer.from(svg));
    } else {
      const r = await buildPrintPdf(svg, report, { title: `UNI&CORE 1ST BIRTHDAY CREAM — ${CAMPAIGN_META[campaign].name} — ${size.label.en}`, subject: `${size.w}×${size.h} mm + ${size.bleed ?? 3} mm bleed · CMYK · ${size.dpi} dpi · ${lang}` });
      put("_CMYK.pdf", r.pdf, [r.px.w, r.px.h]);
      put("_RGB-preview.jpg", r.rgbPreview);
      put(".svg", Buffer.from(svg));
    }
    const it: Item = {
      key: `${lang}/${size.kind}/${campaign}/${size.id}`, campaign, lang, size: size.id, kind: size.kind, group: size.group, label: size.label.ko,
      w: size.w, h: size.h, unit: size.kind === "print" ? "mm" : "px", files, maxKB: size.maxKB, jpgQuality, archetype: report.archetype,
      issues: report.issues, claims: report.claims, product: report.product ? { aspectOk: report.product.aspectOk, effDpi: report.product.effDpi } : undefined,
      background: { effDpi: report.background?.effDpi }, dpi: size.dpi, ms: Date.now() - t0,
    };
    items.push(it);
    const errs = report.issues.filter((i) => i.level === "error").length;
    console.log(`${it.key} ${it.ms}ms ${errs ? `ERR×${errs}` : "ok"}`);
  }
}
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, `.manifest-${process.pid}.json`), JSON.stringify(items));
if (!worker) mergeManifests();
