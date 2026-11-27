import qrcode from "qrcode-generator";
import type { Box } from "./types";

/** Brand palette (official site tokens). */
export const C = {
  black: "#080706", luxury: "#17110F", choco: "#38231C", gold: "#C6A16A", goldHi: "#E5C58D", goldDeep: "#8F6B3A",
  ivory: "#F4EFE7", white: "#FFFFFF", green: "#11291D", muted: "rgba(244,239,231,0.72)",
};

export const f = (n: number) => (Math.round(n * 100) / 100).toString();

/** Seeded PRNG so every export of the same banner is byte-identical. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1_000_000) / 1_000_000; };
}

export function goldDefs(u: number): string {
  // u = canvas unit size used for blur radii
  return `
<linearGradient id="gold-v" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#FFF4DA"/><stop offset="0.38" stop-color="#EBCB92"/><stop offset="0.66" stop-color="#C9A46B"/><stop offset="1" stop-color="#9A773F"/>
</linearGradient>
<linearGradient id="gold-t" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#F2D7A2"/><stop offset="0.55" stop-color="#E2BE83"/><stop offset="1" stop-color="#BF965A"/>
</linearGradient>
<linearGradient id="gold-h" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#F6E2B5"/><stop offset="0.5" stop-color="#E5C58D"/><stop offset="1" stop-color="#B8925A"/>
</linearGradient>
<linearGradient id="gold-btn" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#F3DFB4"/><stop offset="0.55" stop-color="#E5C58D"/><stop offset="1" stop-color="#C6A16A"/>
</linearGradient>
<radialGradient id="glow-gold" cx="0.5" cy="0.5" r="0.5">
  <stop offset="0" stop-color="#F1D29A" stop-opacity="0.55"/><stop offset="0.45" stop-color="#C6A16A" stop-opacity="0.18"/><stop offset="1" stop-color="#C6A16A" stop-opacity="0"/>
</radialGradient>
<radialGradient id="shadow-c" cx="0.5" cy="0.5" r="0.5">
  <stop offset="0" stop-color="#000" stop-opacity="0.85"/><stop offset="0.6" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
</radialGradient>
<radialGradient id="dot" cx="0.5" cy="0.5" r="0.5">
  <stop offset="0" stop-color="#FFF6DF" stop-opacity="1"/><stop offset="0.35" stop-color="#E9CD98" stop-opacity="0.75"/><stop offset="1" stop-color="#C6A16A" stop-opacity="0"/>
</radialGradient>
<linearGradient id="fade-l" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#080706" stop-opacity="0.86"/><stop offset="0.6" stop-color="#080706" stop-opacity="0.45"/><stop offset="1" stop-color="#080706" stop-opacity="0"/>
</linearGradient>
<linearGradient id="fade-t" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#080706" stop-opacity="0.82"/><stop offset="0.65" stop-color="#080706" stop-opacity="0.38"/><stop offset="1" stop-color="#080706" stop-opacity="0"/>
</linearGradient>
<linearGradient id="fade-b" x1="0" y1="1" x2="0" y2="0">
  <stop offset="0" stop-color="#080706" stop-opacity="0.9"/><stop offset="0.6" stop-color="#080706" stop-opacity="0.35"/><stop offset="1" stop-color="#080706" stop-opacity="0"/>
</linearGradient>
<filter id="blur-s" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(u * 0.6)}"/></filter>
<filter id="blur-m" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(u * 2.2)}"/></filter>
<filter id="blur-l" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(u * 7)}"/></filter>`;
}

/** Floating champagne-gold particles + bokeh, denser around `focus`, sparser over `avoid` boxes. */
export function particles(W: number, H: number, focus: { x: number; y: number; r: number }, avoid: Box[], seed: number, density = 1): string {
  const r = rng(seed);
  const unit = Math.min(W, H);
  const n = Math.round(Math.min(420, 90 + (W * H) / (unit * unit) * 60) * density);
  let dots = ""; let bokeh = "";
  const inside = (x: number, y: number) => avoid.some((b) => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h);
  for (let i = 0; i < n; i++) {
    const clustered = r() < 0.62;
    let x: number, y: number;
    if (clustered) {
      const a = r() * Math.PI * 2; const d = Math.pow(r(), 0.7) * focus.r * 1.5;
      x = focus.x + Math.cos(a) * d * 1.25; y = focus.y + Math.sin(a) * d * 0.9 - focus.r * 0.2;
    } else { x = r() * W; y = r() * H; }
    if (x < 0 || y < 0 || x > W || y > H) continue;
    const fade = inside(x, y) ? 0.18 : 1;
    const big = r() < 0.07;
    if (big) {
      const rad = unit * (0.008 + r() * 0.022);
      bokeh += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="url(#dot)" opacity="${f((0.08 + r() * 0.16) * fade)}"/>`;
    } else {
      const rad = unit * (0.0012 + Math.pow(r(), 3) * 0.0042);
      dots += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="url(#dot)" opacity="${f((0.35 + r() * 0.65) * fade)}"/>`;
    }
  }
  return `<g data-el="particles"><g filter="url(#blur-m)">${bokeh}</g>${dots}</g>`;
}

/** 28-day ring: champagne-gold halo with 28 ticks (14 + 14) and a progress arc. */
export function ring28(cx: number, cy: number, R: number, unit: number): string {
  let ticks = "";
  for (let i = 0; i < 28; i++) {
    const a = -Math.PI / 2 + (i / 28) * Math.PI * 2;
    const major = i % 7 === 0;
    const r1 = R * (major ? 1.045 : 1.03); const r2 = R * (major ? 1.1 : 1.07);
    ticks += `<line x1="${f(cx + Math.cos(a) * r1)}" y1="${f(cy + Math.sin(a) * r1)}" x2="${f(cx + Math.cos(a) * r2)}" y2="${f(cy + Math.sin(a) * r2)}" stroke="${i < 14 ? "#C6A16A" : "#F1D7A6"}" stroke-width="${f(unit * (major ? 0.0032 : 0.0018))}" stroke-linecap="round" opacity="${major ? 0.95 : 0.7}"/>`;
  }
  const arc = (from: number, to: number, rr: number) => {
    const a0 = -Math.PI / 2 + from * Math.PI * 2, a1 = -Math.PI / 2 + to * Math.PI * 2;
    const large = to - from > 0.5 ? 1 : 0;
    return `M${f(cx + Math.cos(a0) * rr)} ${f(cy + Math.sin(a0) * rr)} A${f(rr)} ${f(rr)} 0 ${large} 1 ${f(cx + Math.cos(a1) * rr)} ${f(cy + Math.sin(a1) * rr)}`;
  };
  return `<g data-el="ring28">
  <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R * 1.02)}" fill="none" stroke="#E5C58D" stroke-width="${f(unit * 0.012)}" opacity="0.22" filter="url(#blur-m)"/>
  <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R)}" fill="none" stroke="url(#gold-h)" stroke-width="${f(unit * 0.0026)}" opacity="0.9"/>
  <path d="${arc(0, 0.5, R * 1.16)}" fill="none" stroke="#C6A16A" stroke-width="${f(unit * 0.0016)}" opacity="0.55"/>
  <path d="${arc(0.5, 0.995, R * 1.16)}" fill="none" stroke="#F1D7A6" stroke-width="${f(unit * 0.0016)}" opacity="0.55" stroke-dasharray="${f(unit * 0.004)} ${f(unit * 0.006)}"/>
  ${ticks}</g>`;
}

/** Fine gold data grid for the clinical campaign. */
export function dataGrid(b: Box, unit: number): string {
  let s = ""; const step = unit * 0.06;
  for (let x = b.x; x <= b.x + b.w; x += step) s += `<line x1="${f(x)}" y1="${f(b.y)}" x2="${f(x)}" y2="${f(b.y + b.h)}"/>`;
  for (let y = b.y; y <= b.y + b.h; y += step) s += `<line x1="${f(b.x)}" y1="${f(y)}" x2="${f(b.x + b.w)}" y2="${f(y)}"/>`;
  return `<g data-el="grid" stroke="#C6A16A" stroke-width="${f(unit * 0.0007)}" opacity="0.07">${s}</g>`;
}

/** Vector QR code (dark modules on an ivory tile) — scannable on print. */
export function qr(text: string, x: number, y: number, size: number): string {
  const q = qrcode(0, "M"); q.addData(text); q.make();
  const n = q.getModuleCount(); const quiet = 2; const m = size / (n + quiet * 2);
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${f(x + (c + quiet) * m)} ${f(y + (r + quiet) * m)}h${f(m)}v${f(m)}h${f(-m)}z`;
  return `<g data-el="qr"><rect x="${f(x)}" y="${f(y)}" width="${f(size)}" height="${f(size)}" rx="${f(size * 0.04)}" fill="#F4EFE7"/><path d="${d}" fill="#17110F"/></g>`;
}
