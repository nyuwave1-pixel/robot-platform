/**
 * Print PDF builder (Node).
 *
 *  • art layers (background, scrim, effects, product, cards, orbs) → rasterised at the size's print dpi with resvg,
 *    converted to CMYK by libvips/LittleCMS (sharp) and embedded as a DeviceCMYK JPEG;
 *  • type, logo and QR → drawn as vector paths in DeviceCMYK on top (text is already outlined, so the PDF
 *    contains no fonts at all);
 *  • MediaBox = BleedBox = trim + 3 mm bleed on every side, TrimBox = finished size.
 */
import { Resvg } from "@resvg/resvg-js";
import { PDFDocument, cmyk, type PDFPage } from "pdf-lib";
import sharp from "sharp";
import type { RenderReport } from "../rendering/types";
import { splitLayers } from "./layers";
export { splitLayers };

const PT = 72 / 25.4; // pt per mm

/**
 * CMYK output profile. Ghostscript's default CMYK (coated, SWOP-class, TAC ≈ 300%) is what ships on every Linux box;
 * set UNC_CMYK_ICC to a vendor profile (e.g. Japan Color 2001 Coated / FOGRA39 / FOGRA51) to separate for a specific press.
 */
export const CMYK_ICC = process.env.UNC_CMYK_ICC ?? "/usr/share/color/icc/ghostscript/default_cmyk.icc";

const cmykCache = new Map<string, ReturnType<typeof cmyk>>();
/** sRGB hex → CMYK through the same ICC transform as the raster art, so type and image separate consistently. */
async function toCmyk(hex: string) {
  const hit = cmykCache.get(hex); if (hit) return hit;
  const n = hex.replace("#", "");
  const raw = Buffer.from([0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)));
  const r = await sharp(raw, { raw: { width: 1, height: 1, channels: 3 } }).withIccProfile(CMYK_ICC).raw().toBuffer();
  const c = cmyk(r[0] / 255, r[1] / 255, r[2] / 255, r[3] / 255); cmykCache.set(hex, c); return c;
}
/** Vector paint: url(#gold-*) gradients become a solid champagne gold in print. */
async function paint(fill: string): Promise<{ color: ReturnType<typeof cmyk>; opacity: number }> {
  if (fill.startsWith("url(")) return { color: await toCmyk("#DDB77C"), opacity: 1 };
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(fill);
  if (m) {
    const hex = "#" + [m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, "0")).join("");
    return { color: await toCmyk(hex), opacity: m[4] != null ? Number(m[4]) : 1 };
  }
  return { color: await toCmyk(fill), opacity: 1 };
}

export interface PrintPdfResult { pdf: Uint8Array; px: { w: number; h: number }; rgbPreview: Buffer }

export async function buildPrintPdf(svg: string, report: RenderReport, meta: { title: string; subject: string }): Promise<PrintPdfResult> {
  const size = report.size; const dpi = size.dpi ?? 150;
  const CW = report.canvas.w, CH = report.canvas.h; // mm incl. bleed
  const { art, text, logos, qrs } = splitLayers(svg);

  // 1) raster art at print resolution → CMYK JPEG
  const pxW = Math.round((CW / 25.4) * dpi);
  const rgba = new Resvg(art, { fitTo: { mode: "width", value: pxW }, background: "#080706" }).render();
  const pxH = rgba.height;
  // feed resvg's pixel buffer straight into sharp (no extra copy) — wall-size art is 80+ Mpx
  const rgb = sharp(rgba.pixels, { raw: { width: rgba.width, height: rgba.height, channels: 4 }, limitInputPixels: false }).removeAlpha();
  const jpg = await rgb.withIccProfile(CMYK_ICC).jpeg({ quality: 90, chromaSubsampling: "4:4:4" }).toBuffer();
  // RGB preview of the *full* design (art + type) for review/web
  const prevW = Math.min(2400, pxW);
  const rgbPreview = await sharp(Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: prevW }, background: "#080706" }).render().asPng()))
    .jpeg({ quality: 88, chromaSubsampling: "4:4:4" }).toBuffer();

  // 2) PDF
  const doc = await PDFDocument.create();
  doc.setTitle(meta.title); doc.setSubject(meta.subject); doc.setAuthor("UNI&CORE"); doc.setCreator("UNI&CORE Birthday Campaign Banner System");
  doc.setProducer("pdf-lib"); doc.setKeywords(["UNI&CORE", "1ST BIRTHDAY CREAM", size.id, "CMYK", `${dpi}dpi`, "bleed 3mm"]);
  const W = CW * PT, H = CH * PT;
  const page: PDFPage = doc.addPage([W, H]);
  const img = await doc.embedJpg(jpg);
  page.drawImage(img, { x: 0, y: 0, width: W, height: H });

  for (const m of text) {
    const [, , fill, op, d] = m; if (!d) continue;
    const p = await paint(fill);
    page.drawSvgPath(d, { x: 0, y: H, scale: PT, color: p.color, opacity: p.opacity * (op ? Number(op) : 1), borderWidth: 0 });
  }
  for (const m of logos) {
    const [, tx, ty, sc, fill, d] = m; const p = await paint(fill);
    page.drawSvgPath(d, { x: Number(tx) * PT, y: H - Number(ty) * PT, scale: Number(sc) * PT, color: p.color, opacity: p.opacity, borderWidth: 0 });
  }
  for (const m of qrs) {
    const [, x, y, w, h, tile, d, ink] = m;
    page.drawRectangle({ x: Number(x) * PT, y: H - (Number(y) + Number(h)) * PT, width: Number(w) * PT, height: Number(h) * PT, color: (await paint(tile)).color });
    // QR modules in rich black-free 100K for a sharp, scannable print
    page.drawSvgPath(d, { x: 0, y: H, scale: PT, color: ink === "#17110F" ? cmyk(0, 0, 0, 1) : (await paint(ink)).color, borderWidth: 0 });
  }

  const b = (size.bleed ?? 3) * PT;
  page.setBleedBox(0, 0, W, H);
  page.setTrimBox(b, b, W - 2 * b, H - 2 * b);
  page.setArtBox(b, b, W - 2 * b, H - 2 * b);
  const pdf = await doc.save({ useObjectStreams: true });
  return { pdf, px: { w: pxW, h: pxH }, rgbPreview };
}
