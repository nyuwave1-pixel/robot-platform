import { BACKGROUNDS, PRODUCTS, type AssetResolver, type BgVariant } from "./assets";
import { C, f, goldDefs, particles } from "./effects";
import { fontsFor, FontRegistry } from "./fonts";
import { LOGO } from "./logo";
import { TextEngine, type TextLayout } from "./text";
import type { Archetype, Box, CampaignId, ElementReport, Issue, Lang, RenderReport, RenderResult, RenderSpec, SizeSpec, TextStyle } from "./types";
import { COPY, SHARED, type CampaignCopy, type SharedCopy } from "../localization/copy";

export interface Env { fonts: FontRegistry; resolve: AssetResolver }

export function archetypeOf(w: number, h: number): Archetype {
  const r = w / h;
  if (r >= 3.9) return "ultrawide";
  if (r >= 1.25) return "wide";
  if (r >= 0.85) return "square";
  if (r >= 0.62) return "portrait";
  return "tall";
}

export interface Styles {
  eyebrow: TextStyle; headline: TextStyle; sub: TextStyle; cta: TextStyle; label: TextStyle; desc: TextStyle;
  foot: TextStyle; stat: TextStyle; statUnit: TextStyle; slogan: TextStyle; product: TextStyle; big: TextStyle;
}

/** Typography per language. Sizes are filled in per layout (fractions of the canvas). */
export function baseStyles(lang: Lang): Styles {
  const ivory = C.ivory; const muted = "rgba(244,239,231,0.78)";
  const common = {
    eyebrow: { family: "inter-600", size: 1, tracking: 0.32, upper: true, fill: C.goldHi, lineHeight: 1.2, maxLines: 1 },
    stat: { family: "cormorant-500", size: 1, fill: "url(#gold-v)", lineHeight: 1, tracking: -0.01, maxLines: 1 },
    big: { family: "cormorant-400", size: 1, fill: "url(#gold-v)", lineHeight: 0.9, tracking: -0.03, maxLines: 1 },
    slogan: { family: "cormorant-500i", size: 1, fill: C.goldHi, tracking: 0.12, upper: true, lineHeight: 1.2, maxLines: 1 },
    product: { family: "inter-500", size: 1, fill: "rgba(244,239,231,0.62)", tracking: 0.26, upper: true, lineHeight: 1.2, maxLines: 1 },
  } satisfies Partial<Styles>;
  if (lang === "ko") return {
    ...common,
    headline: { family: "pretendard-300", accentFamily: "pretendard-600", size: 1, fill: ivory, accentFill: "url(#gold-t)", lineHeight: 1.26, tracking: -0.025 },
    sub: { family: "pretendard-300", size: 1, fill: muted, lineHeight: 1.5, tracking: -0.015 },
    cta: { family: "pretendard-600", size: 1, fill: C.luxury, tracking: 0.01, lineHeight: 1, maxLines: 1 },
    label: { family: "pretendard-600", size: 1, fill: ivory, lineHeight: 1.3, tracking: -0.01 },
    desc: { family: "pretendard-400", size: 1, fill: muted, lineHeight: 1.4, tracking: -0.01 },
    foot: { family: "pretendard-400", size: 1, fill: "rgba(244,239,231,0.58)", lineHeight: 1.45, tracking: -0.005 },
    statUnit: { family: "pretendard-500", size: 1, fill: C.goldHi, lineHeight: 1 },
  };
  if (lang === "zh") return {
    ...common,
    headline: { family: "notoserifsc-400", accentFamily: "notoserifsc-600", size: 1, fill: ivory, accentFill: "url(#gold-t)", lineHeight: 1.3, tracking: 0.04 },
    sub: { family: "notosanssc-300", size: 1, fill: muted, lineHeight: 1.55, tracking: 0.03 },
    cta: { family: "notosanssc-500", size: 1, fill: C.luxury, tracking: 0.08, lineHeight: 1, maxLines: 1 },
    label: { family: "notosanssc-500", size: 1, fill: ivory, lineHeight: 1.3, tracking: 0.02 },
    desc: { family: "notosanssc-300", size: 1, fill: muted, lineHeight: 1.45, tracking: 0.02 },
    foot: { family: "notosanssc-400", size: 1, fill: "rgba(244,239,231,0.58)", lineHeight: 1.45, tracking: 0.01 },
    statUnit: { family: "notosanssc-500", size: 1, fill: C.goldHi, lineHeight: 1 },
  };
  return {
    ...common,
    headline: { family: "cormorant-500", accentFamily: "cormorant-500i", size: 1, fill: ivory, accentFill: "url(#gold-t)", lineHeight: 1.04, tracking: 0.01, upper: true },
    sub: { family: "inter-400", size: 1, fill: muted, lineHeight: 1.5, tracking: 0 },
    cta: { family: "inter-600", size: 1, fill: C.luxury, tracking: 0.14, upper: true, lineHeight: 1, maxLines: 1 },
    label: { family: "inter-600", size: 1, fill: ivory, lineHeight: 1.25, tracking: 0 },
    desc: { family: "inter-400", size: 1, fill: muted, lineHeight: 1.4, tracking: 0 },
    foot: { family: "inter-400", size: 1, fill: "rgba(244,239,231,0.58)", lineHeight: 1.4, tracking: 0 },
    statUnit: { family: "cormorant-500", size: 1, fill: C.goldHi, lineHeight: 1 },
  };
}

export interface Ctx {
  spec: RenderSpec; size: SizeSpec; lang: Lang; campaign: CampaignId; copy: CampaignCopy; shared: SharedCopy;
  te: TextEngine; env: Env; S: Styles;
  CW: number; CH: number; trim: Box; safe: Box; /** layout frame: trim, or the always-visible centre box (YouTube channel art) */ frame: Box; arch: Archetype; r: number; unit: number; print: boolean;
  layers: { bg: string[]; scrim: string[]; fx: string[]; product: string[]; ui: string[]; text: string[]; guides: string[] };
  els: ElementReport[]; issues: Issue[]; report: Partial<RenderReport>; seed: number; occupied: Box[]; textScale: number;
}

const ov = (a: Box, b: Box) => !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
export const inset = (b: Box, d: number): Box => ({ x: b.x + d, y: b.y + d, w: b.w - 2 * d, h: b.h - 2 * d });

function hash(s: string) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

export function makeCtx(spec: RenderSpec, env: Env): Ctx {
  const size = spec.size; const print = size.kind === "print";
  const b = print ? size.bleed ?? 3 : 0;
  const CW = size.w + 2 * b, CH = size.h + 2 * b;
  const trim: Box = { x: b, y: b, w: size.w, h: size.h };
  const unit = Math.min(size.w, size.h);
  const sf = size.safe ?? {};
  let safe: Box;
  let frame = trim; let unit2 = unit; let arch = archetypeOf(size.w, size.h); let r = size.w / size.h;
  if (sf.centerBox) {
    const cb = sf.centerBox; frame = { x: trim.x + (trim.w - cb.w) / 2, y: trim.y + (trim.h - cb.h) / 2, w: cb.w, h: cb.h };
    const m = Math.min(cb.w, cb.h) * 0.05; safe = { x: frame.x + m, y: frame.y + m, w: frame.w - 2 * m, h: frame.h - 2 * m };
    unit2 = Math.min(cb.w, cb.h); arch = archetypeOf(cb.w, cb.h); r = cb.w / cb.h;
  } else {
    const m = (sf.margin ?? 0.06) * unit;
    const l = Math.max(m, (sf.left ?? 0) * size.w), r = Math.max(m, (sf.right ?? 0) * size.w);
    const t = Math.max(m, (sf.top ?? 0) * size.h);
    const bo = Math.max(m, (sf.bottom ?? 0) * size.h, (size.hiddenBottom ?? 0) + m * 0.6);
    safe = { x: trim.x + l, y: trim.y + t, w: size.w - l - r, h: size.h - t - bo };
  }
  const lang = spec.lang; const copy = { ...COPY[spec.campaign][lang] };
  const o = spec.overrides?.copy ?? {};
  for (const k of Object.keys(o)) if (o[k] != null && k in copy) (copy as any)[k] = o[k];
  return {
    spec, size, lang, campaign: spec.campaign, copy, shared: SHARED[lang], te: new TextEngine(env.fonts, lang), env, S: baseStyles(lang),
    CW, CH, trim, safe, frame, arch, r, unit: unit2, print,
    layers: { bg: [], scrim: [], fx: [], product: [], ui: [], text: [], guides: [] },
    els: [], issues: [], report: {}, seed: hash(`${spec.campaign}|${size.id}`), occupied: [], textScale: spec.overrides?.text?.scale ?? 1,
  };
}

/** Minimum legible size for a role (canvas units). */
export function minSize(ctx: Ctx, role: "body" | "foot" | "head"): number {
  if (ctx.print) {
    const base = role === "foot" ? 2.2 : role === "body" ? 3.2 : 5; // mm
    return Math.max(base, ctx.unit * (role === "foot" ? 0.0075 : role === "body" ? 0.012 : 0.02));
  }
  const mobile = ctx.size.w <= 1200 && ctx.size.h >= ctx.size.w * 0.9; // portrait/square social images are seen at ~1/3 scale
  if (ctx.size.safe?.centerBox) return role === "foot" ? 18 : role === "body" ? 26 : 44; // channel art: centre box shown ~1/4 scale on phones
  if (role === "foot") return Math.max(mobile ? 17 : 11, ctx.unit * 0.0135);
  if (role === "body") return Math.max(mobile ? 25 : 14, ctx.unit * 0.022);
  return Math.max(mobile ? 40 : 22, ctx.unit * 0.05);
}

/** ---------- background + product ---------- */
export interface HeroOpts {
  product?: keyof typeof PRODUCTS;
  /** desired product height (canvas units) */
  ph: number;
  /** desired base-centre of the product */
  ax: number; ay: number;
  /** product width as a share of the pedestal width */
  k?: number;
  variant?: BgVariant;
  reflection?: number; glow?: number; shadow?: number;
}

export function hero(ctx: Ctx, o: HeroOpts): Box {
  const ovr = ctx.spec.overrides ?? {};
  const variant: BgVariant = ovr.bg?.variant ?? o.variant ?? (ctx.r >= 1.6 ? "wide" : ctx.r > 0.8 ? "square" : "tall");
  const cb = ovr.bg?.custom;
  const bg = cb ? { file: cb.href, w: cb.w, h: cb.h, anchor: cb.anchor ?? [0.5, 0.78] as [number, number], anchorW: cb.anchorW ?? 0.45, floor: 0.8 }
    : BACKGROUNDS[ovr.bg?.campaign ?? ctx.campaign][variant];
  const pkey = (ovr.product?.asset as keyof typeof PRODUCTS) ?? o.product ?? "jar";
  const cp = ovr.product?.custom;
  const pm = cp ? { file: cp.href, w: cp.w, h: cp.h, label: cp.name ?? "custom product", base: cp.base ?? 0.85 } : PRODUCTS[pkey];
  const aspect = pm.w / pm.h;
  let ph = o.ph * (ovr.product?.scale ?? 1);
  let pw = ph * aspect;
  const k = o.k ?? 0.62;
  const s0 = pw / k / (bg.anchorW * bg.w);
  const sCover = Math.max(ctx.CW / bg.w, ctx.CH / bg.h);
  // zoom the plate (up to 1.8x cover) when needed so the pedestal can land exactly on the requested anchor
  const [aX, aY] = bg.anchor;
  const need = Math.max(
    o.ay / (aY * bg.h), (ctx.CH - o.ay) / ((1 - aY) * bg.h),
    o.ax / (aX * bg.w), (ctx.CW - o.ax) / ((1 - aX) * bg.w),
  );
  const s = Math.max(s0, sCover, Math.min(need, sCover * 1.8));
  let ox = o.ax - bg.anchor[0] * bg.w * s; let oy = o.ay - bg.anchor[1] * bg.h * s;
  ox = Math.min(0, Math.max(ctx.CW - bg.w * s, ox)); oy = Math.min(0, Math.max(ctx.CH - bg.h * s, oy));
  const ax = ox + bg.anchor[0] * bg.w * s + (ovr.product?.dx ?? 0) * ctx.unit;
  const ay = oy + bg.anchor[1] * bg.h * s + (ovr.product?.dy ?? 0) * ctx.unit;
  const bgW = bg.w * s, bgH = bg.h * s;
  if (ovr.bg?.color) ctx.layers.bg.push(`<rect data-el="bg-color" x="0" y="0" width="${f(ctx.CW)}" height="${f(ctx.CH)}" fill="${ovr.bg.color}"/>`);
  ctx.layers.bg.push(`<image data-el="bg" href="${ctx.env.resolve(bg.file, bgW * pxPer(ctx))}" x="${f(ox)}" y="${f(oy)}" width="${f(bgW)}" height="${f(bgH)}" preserveAspectRatio="none"/>`);
  const tint = ovr.bg?.tint; const bri = ovr.bg?.brightness ?? 1;
  if (tint) ctx.layers.bg.push(`<rect x="0" y="0" width="${f(ctx.CW)}" height="${f(ctx.CH)}" fill="${tint}" opacity="0.18"/>`);
  if (bri < 1) ctx.layers.bg.push(`<rect x="0" y="0" width="${f(ctx.CW)}" height="${f(ctx.CH)}" fill="#000" opacity="${f(1 - bri)}"/>`);
  if (bri > 1) ctx.layers.bg.push(`<rect x="0" y="0" width="${f(ctx.CW)}" height="${f(ctx.CH)}" fill="#E5C58D" opacity="${f(Math.min(0.25, (bri - 1) * 0.5))}"/>`);
  ctx.report.background = { asset: bg.file, scale: s, effDpi: ctx.print ? (bg.w / (bgW / 25.4)) : undefined };

  const x = ax - pw / 2, y = ay - ph;
  const box: Box = { x, y, w: pw, h: ph };
  // glow
  const glow = o.glow ?? 0.9;
  if (glow > 0) ctx.layers.fx.push(`<ellipse data-el="glow" cx="${f(ax)}" cy="${f(ay - ph * 0.5)}" rx="${f(pw * 1.05)}" ry="${f(ph * 0.85)}" fill="url(#glow-gold)" opacity="${f(glow)}"/>`);
  // reflection
  const href = ctx.env.resolve(pm.file, pw * pxPer(ctx));
  const refl = o.reflection ?? 0.22;
  const pid = `p${ctx.seed % 100000}`;
  if (refl > 0) {
    ctx.layers.product.push(`<defs><linearGradient id="${pid}-rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${f(refl)}"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="${pid}-rm" maskUnits="userSpaceOnUse" x="${f(x)}" y="${f(ay)}" width="${f(pw)}" height="${f(ph)}"><rect x="${f(x)}" y="${f(ay)}" width="${f(pw)}" height="${f(ph)}" fill="url(#${pid}-rg)"/></mask></defs>
<g mask="url(#${pid}-rm)"><image data-el="reflection" href="${href}" x="${f(x)}" y="${f(ay - ph)}" width="${f(pw)}" height="${f(ph)}" preserveAspectRatio="none" transform="translate(0 ${f(2 * ay)}) scale(1 -1)"/></g>`);
  }
  // contact shadow
  const sh = o.shadow ?? 0.9;
  ctx.layers.product.push(`<ellipse data-el="shadow" cx="${f(ax)}" cy="${f(ay)}" rx="${f(pw * pm.base * 0.56)}" ry="${f(Math.max(pw * 0.045, ctx.unit * 0.004))}" fill="url(#shadow-c)" opacity="${f(sh)}"/>`);
  ctx.layers.product.push(`<image data-el="product" data-asset="${pm.file}" href="${href}" x="${f(x)}" y="${f(y)}" width="${f(pw)}" height="${f(ph)}" preserveAspectRatio="none"/>`);
  const renderAspect = pw / ph;
  ctx.report.product = {
    box, asset: pm.file, aspectOk: Math.abs(renderAspect - aspect) / aspect < 0.001, srcW: pm.w, srcH: pm.h, renderScale: pw / pm.w,
    effDpi: ctx.print ? pm.w / (pw / 25.4) : undefined,
  };
  ctx.occupied.push(box);
  return box;
}

/** Output pixels per canvas unit (print canvases are in mm). */
export function pxPer(ctx: Ctx) { return ctx.print ? (ctx.size.dpi ?? 150) / 25.4 : 1; }

/** ---------- text helpers ---------- */
export interface Block { id: string; text: string; style: TextStyle; gap?: number; w?: number; kind?: "text" | "cta" | "rule"; min?: number }

export function styled(base: TextStyle, size: number, extra: Partial<TextStyle> = {}): TextStyle {
  return { ...base, ...extra, size, minSize: extra.minSize ?? size * 0.62 };
}

export interface Placed { id: string; box: Box; layout?: TextLayout; style: TextStyle; kind: string; text: string }

/**
 * Stack blocks vertically inside `box` (top-aligned or centred). If the stack is too tall it is
 * scaled down uniformly; each text block also shrinks to fit its width.
 */
export function stack(ctx: Ctx, box: Box, blocks: Block[], opts: { align?: "left" | "center" | "right"; valign?: "top" | "center" | "bottom" } = {}): Placed[] {
  const align = opts.align ?? "left";
  let scale = ctx.textScale;
  let placed: Placed[] = [];
  for (let iter = 0; iter < 30; iter++) {
    placed = []; let y = 0;
    for (const b of blocks) {
      if (!b.text) continue;
      const st = styled(b.style, b.style.size * scale, { align, minSize: Math.max(b.min ?? 0, b.style.minSize ?? 0) });
      const gap = (b.gap ?? 0) * scale;
      if (b.kind === "cta") {
        const L = ctx.te.layout(b.text, { ...st, maxLines: 1 }, { w: (b.w ?? box.w) - st.size * 2.6, h: st.size * 3 });
        const bw = L.width + L.size * 2.6 + L.size * 1.4, bh = L.size * 2.7;
        y += placed.length ? gap : 0;
        placed.push({ id: b.id, box: { x: 0, y, w: bw, h: bh }, layout: L, style: { ...st, size: L.size }, kind: "cta", text: b.text });
        y += bh; continue;
      }
      if (b.kind === "rule") { y += placed.length ? gap : 0; placed.push({ id: b.id, box: { x: 0, y, w: st.size * 3, h: Math.max(1, st.size * 0.05) }, style: st, kind: "rule", text: "" }); y += st.size * 0.05; continue; }
      const L = ctx.te.layout(b.text, st, { w: b.w ?? box.w, h: box.h });
      y += placed.length ? gap : 0;
      placed.push({ id: b.id, box: { x: 0, y, w: L.width, h: L.height }, layout: L, style: { ...st, size: L.size }, kind: "text", text: b.text });
      y += L.height;
    }
    const tooTall = y > box.h + 0.5;
    const tooSmall = placed.some((p) => p.layout && p.layout.overflow);
    if (!tooTall && !tooSmall) break;
    if (scale < 0.35) break;
    scale *= 0.95;
  }
  const total = placed.length ? placed[placed.length - 1].box.y + placed[placed.length - 1].box.h : 0;
  const oy = opts.valign === "center" ? (box.h - total) / 2 : opts.valign === "bottom" ? box.h - total : 0;
  for (const p of placed) {
    const w = p.kind === "text" ? box.w : p.box.w;
    p.box.x = box.x + (align === "left" ? 0 : align === "center" ? (box.w - (p.kind === "text" ? p.box.w : w)) / 2 : box.w - (p.kind === "text" ? p.box.w : w));
    p.box.y = box.y + oy + p.box.y;
    draw(ctx, p, box, align);
  }
  if (total > box.h + 0.5) ctx.issues.push({ level: "error", code: "text-overflow", msg: `Text stack exceeds its area by ${f(total - box.h)} units` });
  return placed;
}

export function draw(ctx: Ctx, p: Placed, area: Box, align: "left" | "center" | "right") {
  if (p.kind === "rule") { ctx.layers.text.push(`<rect data-el="${p.id}" x="${f(p.box.x)}" y="${f(p.box.y)}" width="${f(p.box.w)}" height="${f(p.box.h)}" fill="url(#gold-h)"/>`); return; }
  if (!p.layout) return;
  const L = p.layout;
  if (p.kind === "cta") {
    const b = p.box; const r = b.h / 2;
    ctx.layers.ui.push(`<g data-el="${p.id}"><rect x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" rx="${f(r)}" fill="url(#gold-btn)"/>
<rect x="${f(b.x + b.h * 0.04)}" y="${f(b.y + b.h * 0.04)}" width="${f(b.w - b.h * 0.08)}" height="${f(b.h * 0.92)}" rx="${f(r * 0.96)}" fill="none" stroke="#FFF6E0" stroke-opacity="0.45" stroke-width="${f(b.h * 0.018)}"/></g>`);
    const tx = b.x + L.size * 1.3; const ty = b.y + (b.h - (L.capTop)) / 2;
    ctx.layers.text.push(ctx.te.toSvg(L, { ...p.style, align: "left" }, tx, ty, L.width, p.id));
    // arrow
    const ax = tx + L.width + L.size * 0.75, ay = b.y + b.h / 2, s = L.size * 0.42;
    ctx.layers.text.push(`<path data-el="${p.id}-arrow" d="M${f(ax)} ${f(ay)}h${f(s * 1.5)}M${f(ax + s * 1.5 - s * 0.55)} ${f(ay - s * 0.55)}L${f(ax + s * 1.5)} ${f(ay)}L${f(ax + s * 1.5 - s * 0.55)} ${f(ay + s * 0.55)}" fill="none" stroke="${C.luxury}" stroke-width="${f(L.size * 0.09)}" stroke-linecap="round" stroke-linejoin="round"/>`);
    record(ctx, p.id, "cta", b, L, p.text); ctx.occupied.push(b); return;
  }
  const tx = align === "left" ? area.x : align === "center" ? area.x : area.x;
  ctx.layers.text.push(ctx.te.toSvg(L, p.style, tx, p.box.y, area.w, p.id));
  const realBox: Box = { x: align === "left" ? area.x : align === "center" ? area.x + (area.w - L.width) / 2 : area.x + area.w - L.width, y: p.box.y, w: L.width, h: L.height };
  record(ctx, p.id, "text", realBox, L, p.text);
  ctx.occupied.push(realBox);
}

export function record(ctx: Ctx, id: string, kind: string, box: Box, L?: TextLayout, text?: string) {
  ctx.els.push({ id, kind, box: { ...box }, fontSize: L?.size, minSize: L?.minSize, lines: L?.lines.length, overflow: L?.overflow, text });
  if (L?.overflow) ctx.issues.push({ level: "error", code: "text-fit", msg: `"${id}" does not fit at its minimum size` });
}

/** Single text element at an explicit position (no stacking). */
export function textAt(ctx: Ctx, id: string, text: string, style: TextStyle, box: Box, align: "left" | "center" | "right" = "left", valign: "top" | "center" | "bottom" = "top"): Placed | null {
  if (!text) return null;
  const st = { ...style, align };
  const L = ctx.te.layout(text, st, { w: box.w, h: box.h });
  const y = valign === "top" ? box.y : valign === "center" ? box.y + (box.h - L.height) / 2 : box.y + box.h - L.height;
  const p: Placed = { id, box: { x: box.x, y, w: L.width, h: L.height }, layout: L, style: { ...st, size: L.size }, kind: "text", text };
  draw(ctx, p, { ...box, y }, align);
  return p;
}

export function cta(ctx: Ctx, label: string, size: number, x: number, y: number, align: "left" | "center" | "right" = "left", maxW?: number): Box {
  const st = styled(ctx.S.cta, size, { minSize: minSize(ctx, "body") * 0.9 });
  const box = { w: (maxW ?? ctx.safe.w) - size * 2.7, h: size * 3 };
  let L = ctx.te.layout(label, { ...st, maxLines: 1 }, box);
  if (L.overflow && label === ctx.copy.cta && ctx.copy.ctaShort) { label = ctx.copy.ctaShort; L = ctx.te.layout(label, { ...st, maxLines: 1 }, box); }
  const bw = L.width + L.size * 2.6 + L.size * 1.4, bh = L.size * 2.7;
  const bx = align === "left" ? x : align === "center" ? x - bw / 2 : x - bw;
  const p: Placed = { id: "cta", box: { x: bx, y, w: bw, h: bh }, layout: L, style: { ...st, size: L.size }, kind: "cta", text: label };
  draw(ctx, p, p.box, "left");
  return p.box;
}

export function logo(ctx: Ctx, x: number, y: number, h: number, align: "left" | "center" | "right" = "left", fill = C.ivory): Box {
  const cl = ctx.spec.overrides?.logo;
  if (cl) {
    // custom artwork keeps the wordmark's optical height × 1.25 (marks with symbols are usually taller)
    const hh = h * 1.25, w = (cl.w / cl.h) * hh;
    const lx = align === "left" ? x : align === "center" ? x - w / 2 : x - w;
    ctx.layers.ui.push(`<image data-el="logo-custom" href="${ctx.env.resolve(cl.href, w * pxPer(ctx))}" x="${f(lx)}" y="${f(y - (hh - h) / 2)}" width="${f(w)}" height="${f(hh)}" preserveAspectRatio="xMidYMid meet"/>`);
    const b = { x: lx, y: y - (hh - h) / 2, w, h: hh }; record(ctx, "logo", "logo", b); ctx.occupied.push(b); return b;
  }
  const s = h / LOGO.h; const w = LOGO.w * s;
  const lx = align === "left" ? x : align === "center" ? x - w / 2 : x - w;
  ctx.layers.ui.push(`<path data-el="logo" transform="translate(${f(lx)} ${f(y)}) scale(${Math.round(s * 100000) / 100000})" fill="${fill}" d="${LOGO.d}"/>`);
  const b = { x: lx, y, w, h };
  record(ctx, "logo", "logo", b); ctx.occupied.push(b);
  return b;
}

/** Footnote at the bottom of the safe area: full text if it fits at a legible size, otherwise the short version. */
export function footnote(ctx: Ctx, kind: "clinical" | "story", box: Box, align: "left" | "center" = "left"): Placed | null {
  const min = minSize(ctx, "foot");
  const size = Math.max(min, ctx.unit * (ctx.print ? 0.011 : 0.017));
  const texts = kind === "clinical" ? [ctx.shared.footClinicalFull, ctx.shared.footClinicalShort, ctx.shared.footClinicalMini] : [ctx.shared.footStory];
  for (let i = 0; i < texts.length; i++) {
    const st = styled(ctx.S.foot, size, { minSize: min, align });
    const L = ctx.te.layout(texts[i], st, { w: box.w, h: box.h });
    if (!L.overflow || i === texts.length - 1) {
      const y = box.y + box.h - L.height;
      const p: Placed = { id: `footnote-${kind}`, box: { x: box.x, y, w: L.width, h: L.height }, layout: L, style: { ...st, size: L.size }, kind: "text", text: texts[i] };
      draw(ctx, p, { ...box, y }, align);
      ctx.report.claims = { ...(ctx.report.claims ?? { clinical: false, footnote: false, storyDisclaimer: false }), footnote: kind === "clinical" ? true : ctx.report.claims?.footnote ?? false, storyDisclaimer: kind === "story" ? true : ctx.report.claims?.storyDisclaimer ?? false };
      return p;
    }
  }
  return null;
}

export function scrim(ctx: Ctx, kind: "left" | "top" | "bottom", amount: number, opacity = 1) {
  const { CW, CH } = ctx;
  opacity = Math.min(1, opacity * (ctx.spec.overrides?.bg?.scrim ?? 1)); if (opacity <= 0) return;
  if (kind === "left") ctx.layers.scrim.push(`<rect data-el="scrim" x="0" y="0" width="${f(CW * amount)}" height="${f(CH)}" fill="url(#fade-l)" opacity="${f(opacity)}"/>`);
  if (kind === "top") ctx.layers.scrim.push(`<rect data-el="scrim" x="0" y="0" width="${f(CW)}" height="${f(CH * amount)}" fill="url(#fade-t)" opacity="${f(opacity)}"/>`);
  if (kind === "bottom") ctx.layers.scrim.push(`<rect data-el="scrim" x="0" y="${f(CH * (1 - amount))}" width="${f(CW)}" height="${f(CH * amount)}" fill="url(#fade-b)" opacity="${f(opacity)}"/>`);
}

/** Feathered dark pad behind small text sitting on bright artwork (invisible on dark plates, restores contrast on liquid gold). */
export function pad(ctx: Ctx, b: Box, strength = 1) {
  const o = Math.min(1, strength * (ctx.spec.overrides?.bg?.scrim ?? 1)); if (o <= 0) return;
  const m = Math.max(b.h * 0.9, ctx.unit * 0.02);
  ctx.layers.scrim.push(`<ellipse data-el="pad" cx="${f(b.x + b.w / 2)}" cy="${f(b.y + b.h / 2)}" rx="${f(b.w / 2 * 1.2 + m)}" ry="${f(b.h / 2 * 1.3 + m)}" fill="url(#pad-r)" opacity="${f(o)}"/>`);
}

export function sparkle(ctx: Ctx, focus: Box, density = 1) {
  const d = density * (ctx.spec.overrides?.bg?.effects ?? 1);
  if (d <= 0) return;
  const textBoxes = ctx.els.filter((e) => e.kind === "text" || e.kind === "cta").map((e) => e.box);
  ctx.layers.fx.push(particles(ctx.CW, ctx.CH, { x: focus.x + focus.w / 2, y: focus.y + focus.h * 0.45, r: Math.max(focus.w, focus.h) * 0.75 }, textBoxes, ctx.seed, d));
}

/** ---------- assembly ---------- */
export function finish(ctx: Ctx): RenderResult {
  const { CW, CH, size } = ctx;
  const unitBlur = ctx.unit / 400;
  // overlap QA between text-ish elements and the product
  const prod = ctx.report.product?.box;
  const textEls = ctx.els.filter((e) => ["text", "cta", "logo"].includes(e.kind));
  if (prod) for (const e of textEls) {
    const shrink = inset(prod, Math.min(prod.w, prod.h) * 0.08); // allow soft edges / glow
    if (ov(e.box, shrink)) ctx.issues.push({ level: "error", code: "overlap-product", msg: `"${e.id}" overlaps the product` });
  }
  for (let i = 0; i < textEls.length; i++) for (let j = i + 1; j < textEls.length; j++) {
    const a = textEls[i], b = textEls[j];
    if (a.id.startsWith(b.id) || b.id.startsWith(a.id)) continue;
    if (ov(inset(a.box, 0.5), inset(b.box, 0.5))) ctx.issues.push({ level: "error", code: "overlap-text", msg: `"${a.id}" overlaps "${b.id}"` });
  }
  const safeEls = textEls.filter((e) => !e.id.startsWith("footnote"));
  for (const e of safeEls) {
    const sb = ctx.safe; const tol = 1;
    if (e.box.x < sb.x - tol || e.box.y < sb.y - tol || e.box.x + e.box.w > sb.x + sb.w + tol || e.box.y + e.box.h > sb.y + sb.h + tol) ctx.issues.push({ level: size.safe?.centerBox ? "error" : "warn", code: "outside-safe", msg: `"${e.id}" is outside the safe area` });
  }
  for (const e of textEls) {
    const tb = ctx.trim;
    if (e.box.x < tb.x || e.box.y < tb.y || e.box.x + e.box.w > tb.x + tb.w || e.box.y + e.box.h > tb.y + tb.h) ctx.issues.push({ level: "error", code: "outside-trim", msg: `"${e.id}" is cut by the edge` });
  }
  if (prod && ctx.report.product && !ctx.report.product.aspectOk) ctx.issues.push({ level: "error", code: "product-distorted", msg: "Product aspect ratio changed" });
  if (ctx.print && ctx.report.product?.effDpi && ctx.report.product.effDpi < (size.dpi ?? 150) * 0.5) ctx.issues.push({ level: "warn", code: "product-dpi", msg: `Product image is ${Math.round(ctx.report.product.effDpi)} dpi at print size` });

  const guides = ctx.spec.guides ? `<g data-el="guides" fill="none" stroke-width="${f(ctx.unit * 0.002)}">
<rect x="${f(ctx.safe.x)}" y="${f(ctx.safe.y)}" width="${f(ctx.safe.w)}" height="${f(ctx.safe.h)}" stroke="#4FD1C5" stroke-dasharray="${f(ctx.unit * 0.01)} ${f(ctx.unit * 0.008)}"/>
${ctx.print ? `<rect x="${f(ctx.trim.x)}" y="${f(ctx.trim.y)}" width="${f(ctx.trim.w)}" height="${f(ctx.trim.h)}" stroke="#FF4D6D"/>` : ""}
${ctx.size.hiddenBottom ? `<rect x="${f(ctx.trim.x)}" y="${f(ctx.trim.y + ctx.trim.h - ctx.size.hiddenBottom)}" width="${f(ctx.trim.w)}" height="${f(ctx.size.hiddenBottom)}" fill="#FF4D6D" fill-opacity="0.15" stroke="#FF4D6D"/>` : ""}</g>` : "";
  const wAttr = ctx.print ? `${f(CW)}mm` : `${CW}`; const hAttr = ctx.print ? `${f(CH)}mm` : `${CH}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${wAttr}" height="${hAttr}" viewBox="0 0 ${f(CW)} ${f(CH)}" data-campaign="${ctx.campaign}" data-lang="${ctx.lang}" data-size="${size.id}" data-px-per="${f(pxPer(ctx))}">
<title>UNI&amp;CORE 1ST BIRTHDAY CREAM — ${ctx.campaign} — ${size.id} — ${ctx.lang}</title>
<defs>${goldDefs(unitBlur)}<clipPath id="canvas"><rect x="0" y="0" width="${f(CW)}" height="${f(CH)}"/></clipPath></defs>
<g clip-path="url(#canvas)">
<rect x="0" y="0" width="${f(CW)}" height="${f(CH)}" fill="${C.black}"/>
<g data-layer="background">${ctx.layers.bg.join("")}</g>
<g data-layer="scrim">${ctx.layers.scrim.join("")}</g>
<g data-layer="effects">${ctx.layers.fx.join("")}</g>
<g data-layer="product">${ctx.layers.product.join("")}</g>
<g data-layer="ui">${ctx.layers.ui.join("")}</g>
<g data-layer="text">${ctx.layers.text.join("")}</g>
${guides}
</g></svg>`;
  const report: RenderReport = {
    size, archetype: ctx.arch, canvas: { w: CW, h: CH, unit: ctx.print ? "mm" : "px", scale: 1 }, trim: ctx.trim, safe: ctx.safe,
    elements: ctx.els, product: ctx.report.product, background: ctx.report.background, issues: ctx.issues,
    claims: ctx.report.claims ?? { clinical: false, footnote: false, storyDisclaimer: false },
  };
  return { svg, report };
}

export async function ensureFonts(env: Env, lang: Lang) { await env.fonts.loadAll(fontsFor(lang)); }
