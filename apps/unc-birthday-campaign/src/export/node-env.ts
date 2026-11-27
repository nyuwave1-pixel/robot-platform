import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { FontRegistry } from "../rendering/fonts";
import type { Env } from "../rendering/engine";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const ASSET_DIR = path.join(ROOT, "public/assets");
const CACHE_DIR = path.join(ROOT, ".cache/assets");

/** Width buckets: an asset is embedded at the smallest bucket ≥ 1.15× its drawn width (never upscaled). */
const BUCKETS = [256, 384, 512, 768, 1024, 1280, 1600, 2048, 2560, 3200, 4096, 5120, 6400, 8192];
const TOKEN = "asset://";

const meta = new Map<string, { w: number; h: number }>();
export async function warmAssets(paths: string[]) {
  for (const p of paths) if (!meta.has(p)) { const m = await sharp(path.join(ASSET_DIR, p)).metadata(); meta.set(p, { w: m.width!, h: m.height! }); }
}

function bucketFor(p: string, px?: number): number {
  const full = meta.get(p)?.w ?? 0;
  if (!px || !full) return full;
  const want = px * 1.15;
  const b = BUCKETS.find((x) => x >= want) ?? full;
  return Math.min(b, full);
}

/** Node env: the engine emits `asset://path@width` tokens; `inlineAssets` swaps them for data URIs. */
export function nodeEnv(): Env {
  const fonts = new FontRegistry(async (file) => { const b = fs.readFileSync(path.join(ASSET_DIR, "fonts", file)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer; });
  return { fonts, resolve: (p, px) => { if (/^(data:|blob:|https?:)/.test(p)) return p; if (!meta.has(p)) throw new Error(`asset not warmed: ${p}`); return `${TOKEN}${p}@${bucketFor(p, px)}`; } };
}

const memo = new Map<string, string>();
async function variant(p: string, w: number): Promise<string> {
  const key = `${p}@${w}`; const hit = memo.get(key); if (hit) return hit;
  const alpha = p.endsWith(".webp") || p.endsWith(".png");
  const ext = alpha ? "png" : "jpg";
  const file = path.join(CACHE_DIR, `${p.replace(/[\/.]/g, "_")}_${w}.${ext}`);
  let buf: Buffer;
  if (fs.existsSync(file)) buf = fs.readFileSync(file);
  else {
    const full = meta.get(p)!.w;
    let img = sharp(path.join(ASSET_DIR, p));
    if (w < full) img = img.resize({ width: w, kernel: "lanczos3" });
    buf = alpha ? await img.png({ compressionLevel: 8, effort: 7 }).toBuffer() : await img.jpeg({ quality: 90, chromaSubsampling: "4:4:4", progressive: false, optimiseCoding: true }).toBuffer();
    fs.mkdirSync(CACHE_DIR, { recursive: true }); fs.writeFileSync(file, buf);
  }
  const uri = `data:image/${alpha ? "png" : "jpeg"};base64,${buf.toString("base64")}`;
  memo.set(key, uri); return uri;
}

/**
 * Backgrounds are usually drawn much larger than the canvas (cover + zoom). Crop each one to the part
 * that is actually visible (+2% margin) so files stay small and resvg never samples huge off-canvas plates.
 */
async function cropBackgrounds(svg: string): Promise<string> {
  const vb = /viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg);
  const pxPer = Number(/data-px-per="([\d.]+)"/.exec(svg)?.[1] ?? 0);
  if (!vb || !pxPer) return svg;
  const [VX, VY, VW, VH] = vb.slice(1).map(Number);
  const re = /<image data-el="bg" href="asset:\/\/([^"@]+)@\d+" x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"/g;
  const jobs: Array<{ tag: string; rep: Promise<string> }> = []; let m: RegExpExecArray | null;
  while ((m = re.exec(svg))) {
    const [tag, p, xs, ys, ws, hs] = m; const [x, y, w, h] = [xs, ys, ws, hs].map(Number);
    const mx = VW * 0.02, my = VH * 0.02;
    const x0 = Math.max(x, VX - mx), y0 = Math.max(y, VY - my), x1 = Math.min(x + w, VX + VW + mx), y1 = Math.min(y + h, VY + VH + my);
    const { w: SW, h: SH } = meta.get(p)!;
    const left = Math.floor(((x0 - x) / w) * SW), top = Math.floor(((y0 - y) / h) * SH);
    const cw = Math.min(SW - left, Math.ceil(((x1 - x0) / w) * SW)), ch = Math.min(SH - top, Math.ceil(((y1 - y0) / h) * SH));
    const dx = x + (left / SW) * w, dy = y + (top / SH) * h, dw = (cw / SW) * w, dh = (ch / SH) * h;
    const target = Math.min(cw, Math.ceil(dw * pxPer * 1.1));
    jobs.push({ tag, rep: (async () => {
      const key = `${p}|${left},${top},${cw},${ch}|${target}`;
      let uri = memo.get(key);
      if (!uri) {
        let img = sharp(path.join(ASSET_DIR, p)).extract({ left, top, width: cw, height: ch });
        if (target < cw) img = img.resize({ width: target, kernel: "lanczos3" });
        const buf = await img.jpeg({ quality: 90, chromaSubsampling: "4:4:4", optimiseCoding: true }).toBuffer();
        uri = `data:image/jpeg;base64,${buf.toString("base64")}`; memo.set(key, uri);
      }
      return `<image data-el="bg" data-asset="${p}" href="${uri}" x="${dx.toFixed(2)}" y="${dy.toFixed(2)}" width="${dw.toFixed(2)}" height="${dh.toFixed(2)}"`;
    })() });
  }
  for (const j of jobs) svg = svg.replace(j.tag, await j.rep);
  return svg;
}

export async function inlineAssets(svg: string): Promise<string> {
  svg = await cropBackgrounds(svg);
  const re = /asset:\/\/([^"@]+)@(\d+)/g;
  const keys = new Set<string>(); let m: RegExpExecArray | null;
  while ((m = re.exec(svg))) keys.add(`${m[1]}@${m[2]}`);
  const map = new Map<string, string>();
  for (const k of keys) { const [p, w] = k.split("@"); map.set(k, await variant(p, Number(w))); }
  return svg.replace(re, (_, p, w) => map.get(`${p}@${w}`)!);
}

export function allAssetPaths(): string[] {
  const out: string[] = [];
  for (const d of ["backgrounds", "products", "ingredients"]) for (const f of fs.readdirSync(path.join(ASSET_DIR, d))) out.push(`${d}/${f}`);
  return out;
}
