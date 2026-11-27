import { INGREDIENTS, PRODUCTS, type IngredientKey } from "../rendering/assets";
import { C, dataGrid, f, qr, ring28 } from "../rendering/effects";
import { cta, ensureFonts, finish, footnote, hero, logo, makeCtx, minSize, pxPer, record, scrim, sparkle, stack, styled, textAt, type Block, type Ctx, type Env, type Placed } from "../rendering/engine";
import type { Box, RenderResult, RenderSpec } from "../rendering/types";
import { LOGO } from "../rendering/logo";

/**
 * Five independent campaign creatives. Each composer receives the canvas context and decides its own
 * composition per aspect archetype — the system never just rescales one picture.
 */

interface Zones {
  logo: { x: number; y: number; h: number; align: "left" | "center" };
  text: Box; align: "left" | "center"; valign: "top" | "center";
  product: { ph: number; ax: number; ay: number };
  ctaMode: "stack" | "right" | "below-product";
  foot: Box | null;
  head: number; // headline nominal size
  /** lowest y the product may reach (above footnote and the print QR row) */
  floor: number;
}

function zones(ctx: Ctx, o: { prod?: number; textW?: number; foot?: boolean; productKey?: keyof typeof PRODUCTS; textH?: number }): Zones {
  const { frame: T, safe: S, arch, unit } = ctx;
  const pm = PRODUCTS[o.productKey ?? "jar"]; const aspect = pm.w / pm.h;
  const prod = o.prod ?? 1;
  const dx = (ctx.spec.overrides?.text?.dx ?? 0) * unit, dy = (ctx.spec.overrides?.text?.dy ?? 0) * unit;
  const footH = o.foot ? Math.max(minSize(ctx, "foot") * 3.6, S.h * (arch === "tall" ? 0.06 : arch === "ultrawide" ? 0.2 : 0.1)) : 0;
  if (arch === "wide") {
    const short = ctx.r > 2.8; // 1920×500 / 1920×600 type banners: limited height → bigger type, wider column
    const logoH = Math.max(unit * 0.034, short ? S.h * 0.05 : 0, ctx.print ? 9 : 16);
    const tw = S.w * (short ? 0.4 : ctx.r > 2.3 ? 0.43 : 0.5) * (o.textW ?? 1);
    let ph = Math.min(T.h * (short ? 0.66 : 0.56) * prod, S.h * 0.86);
    let ax = S.x + S.w * (ctx.r > 2.3 ? 0.73 : 0.74);
    const pw = ph * aspect;
    if (ax + pw / 2 > S.x + S.w) ax = S.x + S.w - pw / 2;
    if (ax - pw / 2 < S.x + tw + unit * 0.03) { const avail = S.x + S.w - (S.x + tw + unit * 0.03); ph = Math.min(ph, avail / aspect); ax = S.x + S.w - avail / 2; }
    return {
      logo: { x: S.x + dx, y: S.y + dy, h: logoH, align: "left" },
      text: { x: S.x + dx, y: S.y + logoH * 2.4 + dy, w: tw, h: S.h - logoH * 2.4 - footH - (footH ? unit * 0.02 : 0) }, align: "left", valign: "center",
      product: { ph, ax, ay: T.y + T.h * 0.8 }, ctaMode: "stack", foot: footH ? { x: S.x, y: S.y + S.h - footH, w: tw * 1.08, h: footH } : null,
      head: short ? S.h * 0.14 : Math.min(S.h * 0.115, S.w * 0.05), floor: S.y + S.h - footH,
    };
  }
  if (arch === "ultrawide") {
    const logoH = Math.max(S.h * 0.085, ctx.print ? 10 : 13);
    const ph = Math.min(T.h * 0.86 * prod, T.h * 0.92);
    const tw = S.w * 0.4 * (o.textW ?? 1);
    return {
      logo: { x: S.x + dx, y: S.y + dy, h: logoH, align: "left" },
      text: { x: S.x + dx, y: S.y + logoH * 2.0 + dy, w: tw, h: S.h - logoH * 2.0 - footH }, align: "left", valign: "center",
      product: { ph, ax: S.x + S.w * 0.6, ay: T.y + T.h * 0.97 }, ctaMode: "right", foot: footH ? { x: S.x, y: S.y + S.h - footH, w: tw, h: footH } : null,
      head: S.h * 0.3, floor: S.y + S.h - footH,
    };
  }
  const logoH = Math.max(unit * (arch === "tall" ? 0.04 : 0.036), ctx.print ? 8 : 18);
  if (arch === "tall") {
    const textH = S.h * (o.textH ?? 0.3);
    const qrH = qrRowH(ctx);
    const ay = S.y + S.h - footH - (footH ? unit * 0.03 : 0) - qrH - S.h * (qrH ? 0.03 : 0.07);
    const textBottom = S.y + logoH * 2.6 + textH * 0.88;
    let ph = Math.min(T.h * 0.3 * prod, (S.w * 0.84) / aspect, Math.max(unit * 0.2, ay - textBottom - unit * 0.03));
    return {
      logo: { x: T.x + T.w / 2 + dx, y: S.y + dy, h: logoH, align: "center" },
      text: { x: S.x + S.w * 0.04 + dx, y: S.y + logoH * 2.6 + dy, w: S.w * 0.92, h: textH }, align: "center", valign: "top",
      product: { ph, ax: T.x + T.w / 2, ay }, ctaMode: "stack", foot: footH ? { x: S.x, y: S.y + S.h - footH, w: S.w, h: footH } : null,
      head: S.w * 0.088, floor: S.y + S.h - footH - (footH ? unit * 0.03 : 0) - qrH,
    };
  }
  // square / portrait
  const textH = S.h * (o.textH ?? (arch === "portrait" ? 0.38 : 0.4));
  const qrH = qrRowH(ctx);
  const ay = S.y + S.h - footH - (footH ? unit * 0.02 : 0) - qrH - S.h * (qrH ? 0.03 : 0.08);
  const textBottom = S.y + logoH * 2.3 + textH * 0.88;
  const ph = Math.min(T.h * (arch === "portrait" ? 0.4 : 0.37) * prod, (S.w * 0.66) / aspect, Math.max(unit * 0.18, ay - textBottom - unit * 0.025));
  return {
    logo: { x: T.x + T.w / 2 + dx, y: S.y + dy, h: logoH, align: "center" },
    text: { x: S.x + S.w * 0.05 + dx, y: S.y + logoH * 2.3 + dy, w: S.w * 0.9, h: textH }, align: "center", valign: "top",
    product: { ph, ax: T.x + T.w / 2, ay }, ctaMode: "stack", foot: footH ? { x: S.x, y: S.y + S.h - footH, w: S.w, h: footH } : null,
    head: S.w * 0.072, floor: S.y + S.h - footH - (footH ? unit * 0.02 : 0) - qrH,
  };
}

function hide(ctx: Ctx, id: string) { return ctx.spec.overrides?.hide?.includes(id); }
const overlaps = (a: Box, b: Box) => !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
function isFree(ctx: Ctx, b: Box, pad = 0) { const g = { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 }; return ctx.els.filter((e) => ["text", "cta", "logo", "image"].includes(e.kind)).every((e) => !overlaps(e.box, g)); }

function headBlocks(ctx: Ctx, z: Zones, o: { withSub?: boolean; withCta?: boolean; extra?: Block[]; headScale?: number; slogan?: boolean } = {}): Block[] {
  const S = ctx.S; const H = z.head * (o.headScale ?? 1); const ultra = ctx.arch === "ultrawide";
  const headline = ultra ? ctx.copy.headline.replace(/\n/g, ctx.lang === "zh" ? "" : " ") : ctx.copy.headline;
  const blocks: Block[] = [];
  if (!hide(ctx, "eyebrow") && !ultra) blocks.push({ id: "eyebrow", text: `${ctx.copy.eyebrow}`, style: styled(S.eyebrow, H * 0.26, { minSize: minSize(ctx, "foot") }) });
  if (!hide(ctx, "headline")) blocks.push({ id: "headline", text: headline, style: styled(S.headline, H, { minSize: minSize(ctx, "head") * (ultra ? 0.8 : 1), maxLines: ultra ? 1 : 3 }), gap: H * 0.42 });
  if (o.slogan && ctx.lang !== "en" && !ultra && !hide(ctx, "slogan")) blocks.push({ id: "slogan", text: ctx.shared.slogan, style: styled(S.slogan, H * 0.28, { minSize: minSize(ctx, "foot") }), gap: H * 0.32 });
  if (o.withSub !== false && !hide(ctx, "sub")) {
    const subText = ultra ? ctx.copy.sub.replace(/\n/g, " ") : ctx.copy.sub;
    if (!ultra || ctx.r < 5) blocks.push({ id: "sub", text: subText, style: styled(S.sub, H * (ultra ? 0.28 : 0.34), { minSize: minSize(ctx, "body"), maxLines: ultra ? 1 : 3 }), gap: H * (ultra ? 0.22 : 0.46) });
  }
  if (o.extra) blocks.push(...o.extra);
  if (o.withCta !== false && z.ctaMode === "stack" && !ctx.print && !hide(ctx, "cta")) blocks.push({ id: "cta", text: ctx.copy.cta, kind: "cta", style: styled(S.cta, H * 0.27, { minSize: minSize(ctx, "body") * 0.85 }), gap: H * 0.62 });
  return blocks;
}

function placeLogo(ctx: Ctx, z: Zones) { if (!hide(ctx, "logo")) logo(ctx, z.logo.x, z.logo.y, z.logo.h, z.logo.align, C.ivory); }

/** CTA / QR outside the main text stack. */
function action(ctx: Ctx, z: Zones, prod: Box) {
  if (hide(ctx, "cta")) return;
  if (ctx.print) { printAction(ctx, z, prod); return; }
  const size = z.head * 0.27;
  if (z.ctaMode === "right") {
    const S = ctx.safe; const b0 = cta(ctx, ctx.copy.cta, Math.max(size * 1.15, minSize(ctx, "body")), S.x + S.w, 0, "right", S.w * 0.26);
    // re-centre vertically: cta() drew at y=0 → move by translating the last ui/text entries
    shiftLast(ctx, b0, 0, S.y + S.h / 2 - b0.h / 2);
  } else if (z.ctaMode === "below-product") {
    const y = prod.y + prod.h + ctx.unit * 0.075;
    cta(ctx, ctx.copy.cta, Math.max(size * 1.05, minSize(ctx, "body")), ctx.frame.x + ctx.frame.w / 2, y, "center");
  }
}

function shiftLast(ctx: Ctx, b: Box, dx: number, ty: number) {
  const dy = ty - b.y;
  const ui = ctx.layers.ui.pop()!; const t2 = ctx.layers.text.pop()!; const t1 = ctx.layers.text.pop()!;
  ctx.layers.ui.push(`<g transform="translate(${f(dx)} ${f(dy)})">${ui}</g>`);
  ctx.layers.text.push(`<g transform="translate(${f(dx)} ${f(dy)})">${t1}${t2}</g>`);
  const el = ctx.els.find((e) => e.id === "cta"); if (el) { el.box.y += dy; el.box.x += dx; }
  const oc = ctx.occupied.find((o) => o === b); if (oc) oc.y += dy;
}

/** Print: QR code + URL instead of a button. */
function qrSize(ctx: Ctx) { const S = ctx.safe; return Math.max(ctx.arch === "tall" ? Math.min(S.w * 0.22, 70) : Math.min(ctx.unit * 0.16, 60), 22); }
function qrRowH(ctx: Ctx) { return ctx.print && ctx.size.qr && !["wide", "ultrawide"].includes(ctx.arch) ? qrSize(ctx) + ctx.unit * 0.06 : 0; }

function printAction(ctx: Ctx, z: Zones, prod: Box) {
  const S = ctx.safe; const sh = ctx.shared; const u = ctx.unit;
  if (!ctx.size.qr) {
    const st = styled(ctx.S.product, Math.max(minSize(ctx, "body"), u * 0.03), { fill: C.goldHi, tracking: 0.18, upper: false });
    const UL = ctx.te.layout(sh.url, st, { w: S.w * 0.4, h: st.size * 1.6 }); const w = UL.width + 1, h = UL.height + 1;
    const cands: Array<[number, number, "left" | "right"]> = [
      [S.x + S.w - w, S.y + S.h - h, "right"], [S.x + S.w - w, S.y, "right"], [S.x, S.y + S.h - h, "left"],
    ];
    const c = cands.find(([x, y]) => isFree(ctx, { x, y, w, h }, u * 0.01)) ?? cands[0];
    textAt(ctx, "url", sh.url, st, { x: c[0], y: c[1], w, h }, c[2]);
    return;
  }
  const qs = qrSize(ctx);
  const lab = styled(ctx.S.desc, Math.max(minSize(ctx, "body") * 0.9, qs * 0.13), { fill: C.ivory });
  const url = styled(ctx.S.product, Math.max(minSize(ctx, "foot"), qs * 0.1), { fill: C.goldHi, tracking: 0.08, upper: false });
  const target = `https://${sh.url}`;
  const gap = Math.max(qs * 0.14, 3);
  if (ctx.arch === "tall" || ctx.arch === "portrait" || ctx.arch === "square") {
    // centred row under the product: [QR] label / url
    const bottom = z.foot ? z.foot.y - u * 0.025 : S.y + S.h;
    const minY = prod.h ? prod.y + prod.h + u * 0.035 : S.y;
    let q = qs; if (bottom - q < minY) q = Math.max(16, bottom - minY);
    const y = bottom - q;
    const LL = ctx.te.layout(sh.qrLabel, lab, { w: S.w * 0.6, h: lab.size * 1.6 });
    const UL = ctx.te.layout(sh.url, url, { w: S.w * 0.6, h: url.size * 1.6 });
    const tw = Math.max(LL.width, UL.width) + 1;
    const rowW = q + gap + tw; const x0 = ctx.frame.x + ctx.frame.w / 2 - rowW / 2;
    ctx.layers.ui.push(qr(target, x0, y, q)); record(ctx, "qr", "logo", { x: x0, y, w: q, h: q });
    const ty = y + q / 2 - (LL.height + url.size * 0.5 + UL.height) / 2;
    textAt(ctx, "qr-label", sh.qrLabel, lab, { x: x0 + q + gap, y: ty, w: tw, h: LL.height + 1 }, "left");
    textAt(ctx, "url", sh.url, url, { x: x0 + q + gap, y: ty + LL.height + url.size * 0.5, w: tw, h: UL.height + 1 }, "left");
  } else {
    const x = S.x + S.w - qs;
    const footUnder = z.foot && z.foot.x + z.foot.w > x - S.w * 0.25;
    const y = S.y + S.h - qs - (footUnder ? (z.foot!.h + u * 0.02) : 0);
    ctx.layers.ui.push(qr(target, x, y, qs)); record(ctx, "qr", "logo", { x, y, w: qs, h: qs });
    const LL = ctx.te.layout(sh.qrLabel, lab, { w: S.w * 0.3, h: lab.size * 1.6 });
    const UL = ctx.te.layout(sh.url, url, { w: S.w * 0.3, h: url.size * 1.6 });
    const tw = Math.max(LL.width, UL.width) + 1; const th = LL.height + url.size * 0.5 + UL.height;
    // beside the QR if that strip is free, otherwise stacked above it
    let bx = x - gap - tw, by = y + qs - th;
    if (!isFree(ctx, { x: bx, y: by, w: tw, h: th }, u * 0.01)) { bx = x + qs - tw; by = y - gap - th; }
    textAt(ctx, "qr-label", sh.qrLabel, lab, { x: bx, y: by, w: tw, h: LL.height + 1 }, "right");
    textAt(ctx, "url", sh.url, url, { x: bx, y: by + LL.height + url.size * 0.5, w: tw, h: UL.height + 1 }, "right");
  }
}

function productLine(ctx: Ctx, prod: Box) {
  if (true) return;
  const st = styled(ctx.S.product, Math.max(minSize(ctx, "foot"), ctx.unit * 0.016), {});
  const t = `${ctx.shared.product} · ${ctx.shared.size}`;
  const y = prod.y + prod.h + ctx.unit * 0.022;
  if (ctx.arch === "tall") return; // CTA sits under the product
  if (y + st.size * 1.4 > ctx.safe.y + ctx.safe.h) return;
  textAt(ctx, "product-line", t, st, { x: prod.x - prod.w * 0.3, y, w: prod.w * 1.6, h: st.size * 1.5 }, "center");
}

/** ===== Campaign 01 — SKIN RE:BIRTH ===== */
function skinRebirth(ctx: Ctx) {
  const z = zones(ctx, { prod: 1.0 });
  if (ctx.arch === "wide" || ctx.arch === "ultrawide") scrim(ctx, "left", ctx.arch === "ultrawide" ? 0.55 : 0.6, 0.9); else scrim(ctx, "top", 0.55, 0.85);
  const prod = hero(ctx, { ...z.product, k: 0.6, reflection: 0.24, glow: 1 });
  placeLogo(ctx, z);
  stack(ctx, z.text, headBlocks(ctx, z, { slogan: true }), { align: z.align, valign: z.valign });
  productLine(ctx, prod);
  action(ctx, z, prod);
  sparkle(ctx, prod, 1.1);
}

/** ===== Campaign 02 — THE 28 DAYS ===== */
function days28(ctx: Ctx) {
  const z = zones(ctx, { prod: ctx.arch === "ultrawide" ? 0.95 : 0.82, foot: true });
  if (ctx.arch === "wide" || ctx.arch === "ultrawide") scrim(ctx, "left", 0.55, 0.85); else scrim(ctx, "top", 0.5, 0.8);
  const prod = hero(ctx, { ...z.product, k: 0.5, reflection: 0.3, glow: 0.8 });
  const cx = prod.x + prod.w / 2, cy = prod.y + prod.h * 0.5;
  const R = Math.max(prod.w, prod.h) * (ctx.arch === "ultrawide" ? 0.64 : ctx.arch === "wide" ? 0.8 : 0.72);
  if (!hide(ctx, "ring")) {
    ctx.layers.fx.push(ring28(cx, cy, R, ctx.unit));
  }
  function ringLabels() {
    if (!hide(ctx, "ring") && ctx.arch !== "ultrawide") {
      const st = styled(ctx.S.eyebrow, Math.max(minSize(ctx, "foot"), ctx.unit * 0.016), { tracking: 0.2, fill: C.goldHi });
      const lab = (t: string, a: number, al: "left" | "right" | "center") => {
        const x = cx + Math.cos(a) * R * 1.2, y = cy + Math.sin(a) * R * 1.2;
        const w = ctx.unit * 0.2;
        const b = { x: al === "left" ? x : al === "right" ? x - w : x - w / 2, y: y - st.size * 0.7, w, h: st.size * 1.5 };
        if (b.y < ctx.safe.y || b.y + b.h > ctx.safe.y + ctx.safe.h) return;
        if (isFree(ctx, b, ctx.unit * 0.04)) textAt(ctx, `day-${t}`, t, st, b, al);
      };
      lab("DAY 01", -Math.PI / 2, "center"); lab("DAY 14", Math.PI / 2 - 0.0001, "center"); lab("DAY 28", -Math.PI / 2 + 0.35, "left");
    }
  }
  placeLogo(ctx, z);
  stack(ctx, z.text, headBlocks(ctx, z, {}), { align: z.align, valign: z.valign });
  if (z.foot) {
    const side = ctx.arch === "wide" || ctx.arch === "ultrawide";
    footnote(ctx, "story", side ? { ...z.foot, w: Math.max(z.foot.w, prod.x - z.foot.x - ctx.unit * 0.03) } : z.foot, z.align === "center" ? "center" : "left");
  }
  action(ctx, z, prod);
  ringLabels();
  sparkle(ctx, prod, 0.8);
}

/** ===== Campaign 03 — THE GOLDEN FORMULA ===== */
function orb(ctx: Ctx, key: IngredientKey, cx: number, cy: number, r: number, id: string) {
  const href = ctx.env.resolve(INGREDIENTS[key], r * 2 * pxPer(ctx));
  const cid = `${id}-c`;
  ctx.layers.ui.push(`<defs><clipPath id="${cid}"><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"/></clipPath></defs>
<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 1.18)}" fill="url(#glow-gold)" opacity="0.7"/>
<image data-el="${id}" href="${href}" x="${f(cx - r)}" y="${f(cy - r)}" width="${f(r * 2)}" height="${f(r * 2)}" clip-path="url(#${cid})" preserveAspectRatio="xMidYMid slice"/>
<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="url(#gold-h)" stroke-width="${f(Math.max(r * 0.035, 0.6))}"/>`);
  const b = { x: cx - r, y: cy - r, w: r * 2, h: r * 2 }; record(ctx, id, "image", b); ctx.occupied.push(b);
}

function goldenFormula(ctx: Ctx) {
  const items = ctx.copy.items ?? [];
  const z = zones(ctx, { prod: ctx.arch === "wide" ? 0.95 : 0.78, textW: ctx.arch === "wide" ? 1.04 : 1, textH: ctx.arch === "tall" ? 0.27 : 0.32 });
  if (ctx.arch === "wide" || ctx.arch === "ultrawide") scrim(ctx, "left", 0.58, 0.88); else scrim(ctx, "top", 0.5, 0.85);
  let prod: Box = (ctx.arch === "wide" || ctx.arch === "ultrawide") ? hero(ctx, { ...z.product, k: 0.58, reflection: 0.12, glow: 1.1 }) : { x: 0, y: 0, w: 0, h: 0 };
  placeLogo(ctx, z);
  const u = ctx.unit;
  if (ctx.arch === "ultrawide") {
    stack(ctx, z.text, headBlocks(ctx, z, {}), { align: "left", valign: "center" });
    action(ctx, z, prod); sparkle(ctx, prod, 0.9); return;
  }
  if (ctx.arch === "wide" && ctx.unit < 420) {
    // small wide (750×300, 800×400): orbs would be illegible → ingredient line as the sub copy
    stack(ctx, z.text, headBlocks(ctx, z, { withSub: true }), { align: "left", valign: "center" });
    action(ctx, z, prod); sparkle(ctx, prod, 0.9); return;
  }
  if (ctx.arch === "wide") {
    // text on top part of the column, ingredient row underneath
    const orbArea = Math.min(z.text.h * 0.42, z.text.w / 4.2 * 1.9);
    const textBox = { ...z.text, h: z.text.h - orbArea };
    const placed = stack(ctx, textBox, headBlocks(ctx, z, { withSub: false }), { align: "left", valign: "center" });
    const bottom = Math.max(...placed.map((p) => p.box.y + p.box.h));
    let r = Math.min(z.text.w / 4 * 0.3, orbArea * 0.28);
    const colW = z.text.w / 4;
    const avail = ctx.safe.y + ctx.safe.h - bottom - u * 0.05;
    for (let k = 0; k < 4; k++) { const ts = Math.max(minSize(ctx, "foot") * 1.05, r * 0.42); r = Math.min(r, (avail - ts * 2.75) / 2.3); }
    r = Math.max(r, u * 0.03);
    const y0 = bottom + u * 0.05 + r;
    const title = styled(ctx.S.label, Math.max(minSize(ctx, "foot") * 1.05, r * 0.42), { minSize: minSize(ctx, "foot"), maxLines: 2, lineHeight: 1.2 });
    items.forEach((it, i) => {
      const cx = z.text.x + colW * i + colW / 2;
      orb(ctx, it.key as IngredientKey, cx, y0, r, `orb-${it.key}`);
      textAt(ctx, `orb-${it.key}-t`, it.title, title, { x: cx - colW / 2 + 2, y: y0 + r * 1.3, w: colW - 4, h: title.size * 2.6 }, "center");
    });
  } else {
    // ingredient row under the headline, product below it
    const placed = stack(ctx, z.text, headBlocks(ctx, z, { withSub: false }), { align: "center", valign: "top" });
    const S = ctx.safe;
    const top = Math.max(...placed.map((p) => p.box.y + p.box.h)) + u * 0.05;
    const colW = S.w / 4;
    const r = Math.min(colW * 0.3, u * (ctx.arch === "tall" ? 0.085 : ctx.arch === "square" ? 0.058 : 0.07));
    const title = styled(ctx.S.label, Math.max(minSize(ctx, "foot") * 1.1, r * 0.4), { minSize: minSize(ctx, "foot"), maxLines: 2, lineHeight: 1.2 });
    const desc = styled(ctx.S.desc, Math.max(minSize(ctx, "foot"), r * 0.3), { minSize: minSize(ctx, "foot"), maxLines: 3, lineHeight: 1.3 });
    const withDesc = ctx.arch !== "square";
    let rowBottom = top;
    items.forEach((it, i) => {
      const cx = S.x + colW * i + colW / 2, cy = top + r;
      orb(ctx, it.key as IngredientKey, cx, cy, r, `orb-${it.key}`);
      const tb = { x: cx - colW / 2 + u * 0.006, y: cy + r * 1.28, w: colW - u * 0.012, h: title.size * 2.7 };
      const tp = textAt(ctx, `orb-${it.key}-t`, it.title, title, tb, "center");
      let yb = tp ? tp.box.y + tp.box.h : tb.y;
      if (withDesc) { const dp = textAt(ctx, `orb-${it.key}-d`, it.desc, desc, { ...tb, y: yb + desc.size * 0.4, h: desc.size * 4.2 }, "center"); if (dp) yb = dp.box.y + dp.box.h; }
      rowBottom = Math.max(rowBottom, yb);
    });
    // dark glass panel behind the ingredient row for legibility over the liquid gold
    const pad = u * 0.025;
    ctx.layers.scrim.push(`<rect data-el="orb-panel" x="${f(S.x - pad)}" y="${f(top - pad)}" width="${f(S.w + pad * 2)}" height="${f(rowBottom - top + pad * 2)}" rx="${f(u * 0.025)}" fill="#0B0807" fill-opacity="0.62" stroke="#C6A16A" stroke-opacity="0.35" stroke-width="${f(Math.max(u * 0.0012, 0.4))}"/>`);
    const ay = z.floor - (qrRowH(ctx) ? u * 0.02 : S.h * 0.02);
    const ph = Math.max(u * 0.12, Math.min(z.product.ph * 1.25, ay - rowBottom - u * 0.07));
    prod = hero(ctx, { ...z.product, ph, ay, k: 0.58, reflection: 0.12, glow: 1.1 });
  }
  productLine(ctx, prod);
  action(ctx, z, prod);
  sparkle(ctx, prod, 0.9);
}

/** ===== Campaign 04 — CLINICAL BEAUTY ===== */
function statCard(ctx: Ctx, s: { value: string; unit: string; label: string; detail: string }, b: Box, id: string, align: "left" | "center") {
  const u = ctx.unit;
  ctx.layers.ui.push(`<rect data-el="${id}-card" x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" rx="${f(Math.min(b.w, b.h) * 0.06)}" fill="#17110F" fill-opacity="0.62" stroke="#C6A16A" stroke-opacity="0.45" stroke-width="${f(Math.max(u * 0.0015, 0.4))}"/>`);
  record(ctx, `${id}-card`, "image", b); ctx.occupied.push(b);
  const pad = Math.min(b.w, b.h) * 0.1;
  const inner = { x: b.x + pad, y: b.y + pad, w: b.w - pad * 2, h: b.h - pad * 2 };
  const numSize = Math.min(inner.h * 0.42, inner.w / ((s.value.length + 1) * 0.52));
  const num = styled(ctx.S.stat, numSize, { minSize: minSize(ctx, "body") * 1.2 });
  const L = ctx.te.layout(s.value, num, { w: inner.w * 0.86, h: inner.h * 0.5 });
  const unitSt = styled(ctx.S.statUnit, L.size * 0.42, { minSize: minSize(ctx, "foot") });
  const UL = s.unit ? ctx.te.layout(s.unit, unitSt, { w: inner.w * 0.3, h: L.size }) : null;
  const totalW = L.width + (UL ? UL.width + L.size * 0.06 : 0);
  const nx = align === "center" ? inner.x + (inner.w - totalW) / 2 : inner.x;
  ctx.layers.text.push(ctx.te.toSvg(L, { ...num, size: L.size }, nx, inner.y, L.width, `${id}-num`));
  if (UL) ctx.layers.text.push(ctx.te.toSvg(UL, { ...unitSt, size: UL.size }, nx + L.width + L.size * 0.06, inner.y + L.capTop - UL.capTop, UL.width, `${id}-unit`));
  record(ctx, `${id}-num`, "text", { x: nx, y: inner.y, w: totalW, h: L.height }, L, s.value);
  const lab = styled(ctx.S.label, Math.max(minSize(ctx, "foot") * 1.05, L.size * 0.2), { minSize: minSize(ctx, "foot"), maxLines: 3, lineHeight: 1.25 });
  const lp = textAt(ctx, `${id}-label`, s.label, lab, { x: inner.x, y: inner.y + L.height + inner.h * 0.04, w: inner.w, h: Math.max(inner.h * 0.34, inner.y + inner.h - (inner.y + L.height + inner.h * 0.04)) }, align);
  let det = styled(ctx.S.desc, Math.max(minSize(ctx, "foot"), lab.size * 0.78), { minSize: minSize(ctx, "foot"), maxLines: 1, fill: C.gold });
  let dtext = s.detail;
  if (ctx.te.layout(dtext, det, { w: inner.w, h: det.size * 1.5 }).overflow && dtext.includes(" · ")) {
    dtext = dtext.replace(" · ", "\n"); det = { ...det, maxLines: 2, lineHeight: 1.2 };
  }
  const yb = lp ? lp.box.y + lp.box.h + det.size * 0.4 : inner.y + inner.h * 0.8;
  const dh = det.size * (det.maxLines === 2 ? 2.7 : 1.5);
  if (yb + dh - det.size * 0.1 <= b.y + b.h - pad * 0.3) textAt(ctx, `${id}-detail`, dtext, det, { x: inner.x, y: yb, w: inner.w, h: dh }, align);
}

function statRow(ctx: Ctx, s: { value: string; unit: string; label: string; detail: string }, b: Box, id: string) {
  const u = ctx.unit;
  ctx.layers.ui.push(`<rect data-el="${id}-card" x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" rx="${f(b.h * 0.18)}" fill="#17110F" fill-opacity="0.62" stroke="#C6A16A" stroke-opacity="0.45" stroke-width="${f(Math.max(u * 0.0015, 0.4))}"/>`);
  record(ctx, `${id}-card`, "image", b); ctx.occupied.push(b);
  const pad = b.h * 0.18;
  const num = styled(ctx.S.stat, b.h * 0.56, { minSize: minSize(ctx, "body") * 1.2 });
  const L = ctx.te.layout(s.value, num, { w: b.w * 0.36, h: b.h - pad * 2 });
  const unitSt = styled(ctx.S.statUnit, L.size * 0.42, { minSize: minSize(ctx, "foot") });
  const UL = s.unit ? ctx.te.layout(s.unit, unitSt, { w: b.w * 0.1, h: L.size }) : null;
  const ny = b.y + (b.h - L.capTop) / 2 - L.capTop * 0.02;
  ctx.layers.text.push(ctx.te.toSvg(L, { ...num, size: L.size }, b.x + pad, ny, L.width, `${id}-num`));
  if (UL) ctx.layers.text.push(ctx.te.toSvg(UL, { ...unitSt, size: UL.size }, b.x + pad + L.width + L.size * 0.06, ny + L.capTop - UL.capTop, UL.width, `${id}-unit`));
  const nw = L.width + (UL ? UL.width + L.size * 0.06 : 0);
  record(ctx, `${id}-num`, "text", { x: b.x + pad, y: ny, w: nw, h: L.capTop }, L, s.value);
  const tx = b.x + pad + Math.max(nw, b.w * 0.3) + pad * 0.8; const tw = b.x + b.w - pad - tx;
  const lab = styled(ctx.S.label, Math.max(minSize(ctx, "body") * 0.95, b.h * 0.2), { minSize: minSize(ctx, "foot") * 1.1, maxLines: 2, lineHeight: 1.2 });
  const det = styled(ctx.S.desc, Math.max(minSize(ctx, "foot"), lab.size * 0.72), { minSize: minSize(ctx, "foot"), maxLines: 1, fill: C.gold });
  const LL = ctx.te.layout(s.label, lab, { w: tw, h: b.h * 0.6 }); const DL = ctx.te.layout(s.detail, det, { w: tw, h: det.size * 1.5 });
  const blockH = LL.height + det.size * 0.35 + DL.height; const y0 = b.y + (b.h - blockH) / 2;
  textAt(ctx, `${id}-label`, s.label, lab, { x: tx, y: y0, w: tw, h: LL.height + 1 }, "left");
  textAt(ctx, `${id}-detail`, s.detail, det, { x: tx, y: y0 + LL.height + det.size * 0.35, w: tw, h: DL.height + 1 }, "left");
}

function clinicalBeauty(ctx: Ctx) {
  const stats = ctx.copy.stats ?? [];
  ctx.report.claims = { clinical: true, footnote: false, storyDisclaimer: false };
  const shortWide = ctx.arch === "wide" && ctx.r > 2.8;
  const z = zones(ctx, { prod: ctx.arch === "wide" ? 0.82 : ctx.arch === "ultrawide" ? 0.9 : 0.56, foot: true, textW: shortWide ? 0.9 : ctx.arch === "wide" ? 1.08 : 1, textH: ctx.arch === "tall" ? 0.26 : 0.3 });
  if (ctx.arch === "wide" || ctx.arch === "ultrawide") scrim(ctx, "left", 0.62, 0.9); else scrim(ctx, "top", 0.55, 0.85);
  ctx.layers.fx.push(dataGrid({ x: 0, y: 0, w: ctx.CW, h: ctx.CH }, ctx.unit));
  const side = ctx.arch === "wide" || ctx.arch === "ultrawide";
  const pz = shortWide ? { ...z.product, ax: Math.min(ctx.safe.x + ctx.safe.w * 0.84, ctx.safe.x + ctx.safe.w - z.product.ph * 0.62) } : z.product;
  let prod: Box = side ? hero(ctx, { ...pz, k: 0.55, reflection: 0.26, glow: 0.7 }) : { x: 0, y: 0, w: 0, h: 0 };
  placeLogo(ctx, z);
  const u = ctx.unit;
  if (ctx.arch === "ultrawide") {
    // headline + the lead number inline
    const tw = z.text.w;
    stack(ctx, { ...z.text, w: tw * 0.62 }, headBlocks(ctx, z, { withSub: false }), { align: "left", valign: "center" });
    const sb: Box = { x: z.text.x + tw * 0.66, y: z.text.y, w: tw * 0.6, h: z.text.h };
    statCard(ctx, stats[0], { x: sb.x, y: sb.y + sb.h * 0.05, w: Math.min(sb.w, (prod.x - sb.x) - u * 0.04), h: sb.h * 0.9 }, "stat-0", "left");
    if (z.foot) footnote(ctx, "clinical", z.foot, "left");
    action(ctx, z, prod); sparkle(ctx, prod, 0.5); return;
  }
  const midX = z.text.x + z.text.w + u * 0.06, midW = prod.x - u * 0.06 - midX;
  if (shortWide && midW > u * 0.6) {
    // short wide (1920×500/600): copy on the left, the three results as stacked rows in the middle column
    stack(ctx, z.text, headBlocks(ctx, z, { withSub: true }), { align: "left", valign: "center" });
    const gap = u * 0.03; const rh = Math.min((z.text.h - gap * 2) / 3, u * 0.2);
    const y0 = z.text.y + (z.text.h - (rh * 3 + gap * 2)) / 2;
    stats.forEach((s, i) => statRow(ctx, s, { x: midX, y: y0 + i * (rh + gap), w: Math.min(midW, u * 1.25), h: rh }, `stat-${i}`));
  } else if (ctx.arch === "wide" && ctx.unit < 420) {
    // small wide (750×300, 800×400): headline + the lead result only
    const rh = Math.max(z.text.h * 0.26, minSize(ctx, "body") * 2.6);
    const ctaH = Math.max(z.head * 0.27, minSize(ctx, "body") * 0.85) * 2.4;
    const placed = stack(ctx, { ...z.text, h: z.text.h - rh - ctaH - u * 0.08 }, headBlocks(ctx, z, { withSub: false, withCta: false }), { align: "left", valign: "top" });
    const bottom = Math.max(...placed.map((p) => p.box.y + p.box.h));
    statRow(ctx, stats[0], { x: z.text.x, y: bottom + u * 0.04, w: Math.min(z.text.w * 1.05, prod.x - z.text.x - u * 0.03), h: rh }, "stat-0");
    if (!ctx.print && !hide(ctx, "cta")) cta(ctx, ctx.copy.cta, Math.max(z.head * 0.27, minSize(ctx, "body") * 0.85), z.text.x, bottom + u * 0.04 + rh + u * 0.04, "left");
  } else if (ctx.arch === "wide") {
    const gap = u * 0.02; const cw = (z.text.w - gap * 2) / 3;
    const cardsH = Math.min(z.text.h * 0.32, cw * 0.78);
    const ctaH = z.head * 0.27 * 2.7;
    const placed = stack(ctx, { ...z.text, h: z.text.h - cardsH - ctaH - u * 0.1 }, headBlocks(ctx, z, { withSub: true, withCta: false }), { align: "left", valign: "top" });
    const bottom = Math.max(...placed.map((p) => p.box.y + p.box.h));
    stats.forEach((s, i) => statCard(ctx, s, { x: z.text.x + i * (cw + gap), y: bottom + u * 0.045, w: cw, h: cardsH }, `stat-${i}`, "left"));
    if (!ctx.print && !hide(ctx, "cta")) cta(ctx, ctx.copy.cta, Math.max(z.head * 0.27, minSize(ctx, "body") * 0.85), z.text.x, bottom + u * 0.045 + cardsH + u * 0.045, "left");
  } else {
    const placed = stack(ctx, z.text, headBlocks(ctx, z, { withSub: true }), { align: "center", valign: "top" });
    const bottom = Math.max(...placed.map((p) => p.box.y + p.box.h));
    const S = ctx.safe; let yb = bottom + u * 0.045;
    if (ctx.arch === "tall") {
      const rh = Math.min(u * 0.17, S.h * 0.085), gap = u * 0.022;
      stats.forEach((s, i) => statRow(ctx, s, { x: S.x + S.w * 0.04, y: yb + i * (rh + gap), w: S.w * 0.92, h: rh }, `stat-${i}`));
      yb += stats.length * (rh + gap) - gap;
    } else {
      const gap = u * 0.022; const cw = (S.w - gap * 2) / 3; const ch = cw * (ctx.arch === "portrait" ? 0.78 : 0.62);
      stats.forEach((s, i) => statCard(ctx, s, { x: S.x + i * (cw + gap), y: yb, w: cw, h: ch }, `stat-${i}`, "center"));
      yb += ch;
    }
    const ay = z.floor - u * 0.03;
    const ph = Math.max(u * 0.12, Math.min(z.product.ph * 1.2, ay - yb - u * 0.06));
    prod = hero(ctx, { ...z.product, ph, ay, k: 0.55, reflection: 0.26, glow: 0.7 });
  }
  if (z.foot) {
    // on side layouts the note may run under the text + stats, up to the product
    const fb = side ? { ...z.foot, w: Math.max(z.foot.w, prod.x - z.foot.x - u * 0.03) } : z.foot;
    footnote(ctx, "clinical", fb, z.align === "center" ? "center" : "left");
  }
  action(ctx, z, prod);
  sparkle(ctx, prod, 0.55);
}

/** ===== Campaign 05 — THE MASTERPIECE ===== */
function masterpiece(ctx: Ctx) {
  const key = "boxOpenJar" as const;
  const z = zones(ctx, { prod: ctx.arch === "wide" ? 0.78 : ctx.arch === "ultrawide" ? 0.82 : 1.0, productKey: key });
  if (ctx.arch === "wide" || ctx.arch === "ultrawide") scrim(ctx, "left", 0.55, 0.85); else scrim(ctx, "top", 0.5, 0.8);
  const prod = hero(ctx, { ...z.product, product: key, k: 0.82, reflection: 0.18, glow: 0.7 });
  placeLogo(ctx, z);
  const S = ctx.S; const H = z.head;
  const extra: Block[] = ctx.arch === "ultrawide" ? [] : [{ id: "product-name", text: `${ctx.shared.product}  ·  ${ctx.shared.size}`, style: styled(S.product, H * 0.2, { minSize: minSize(ctx, "foot"), fill: C.goldHi }), gap: H * 0.5 }];
  stack(ctx, z.text, headBlocks(ctx, z, { extra }), { align: z.align, valign: z.valign });
  action(ctx, z, prod);
  sparkle(ctx, prod, 0.6);
}

/** Exhibition photo wall: add a quiet step-and-repeat logo pattern behind the hero. */
function photoWallPattern(ctx: Ctx) {
  if (ctx.size.id !== "p-photowall") return;
  const h = ctx.unit * 0.035; const s = h / LOGO.h; const w = LOGO.w * s;
  let g = ""; const gx = w * 2.4, gy = h * 5;
  for (let row = 0, y = ctx.trim.y + gy * 0.5; y < ctx.CH; y += gy, row++) for (let x = ctx.trim.x + (row % 2 ? gx / 2 : 0) - w; x < ctx.CW; x += gx) g += `<path transform="translate(${f(x)} ${f(y)}) scale(${Math.round(s * 100000) / 100000})" d="${LOGO.d}"/>`;
  ctx.layers.scrim.push(`<g data-el="pattern" fill="#C6A16A" opacity="0.13">${g}</g>`);
}

const COMPOSERS = { "skin-rebirth": skinRebirth, "28-days": days28, "golden-formula": goldenFormula, "clinical-beauty": clinicalBeauty, masterpiece } as const;

export async function renderBanner(spec: RenderSpec, env: Env): Promise<RenderResult> {
  await ensureFonts(env, spec.lang);
  const ctx = makeCtx(spec, env);
  photoWallPattern(ctx);
  COMPOSERS[spec.campaign](ctx);
  const res = finish(ctx);
  // language / glyph checks
  for (const e of res.report.elements) {
    if (!e.text) continue;
    const fam = e.id.startsWith("headline") ? ctx.S.headline.family : ctx.S.sub.family;
    const miss = ctx.te.missingGlyphs(e.text, fam);
    if (miss.length) res.report.issues.push({ level: "error", code: "missing-glyph", msg: `Missing glyphs in "${e.id}": ${miss.join(" ")}` });
  }
  if (res.report.claims.clinical && !res.report.claims.footnote) res.report.issues.push({ level: "error", code: "claim-footnote", msg: "Clinical figures shown without the test footnote" });
  if (spec.campaign === "28-days" && !res.report.claims.storyDisclaimer) res.report.issues.push({ level: "error", code: "story-disclaimer", msg: "28-day storytelling disclaimer missing" });
  return res;
}

export type { Placed };
