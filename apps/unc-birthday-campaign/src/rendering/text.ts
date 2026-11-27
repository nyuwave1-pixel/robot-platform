import type opentype from "opentype.js";
import { FALLBACK, FontRegistry } from "./fonts";
import type { Lang, TextStyle } from "./types";

/**
 * Text layout + outline rendering. Every glyph becomes an SVG path, so banners look identical in
 * every viewer, print RIP and PDF (fonts are "outlined" by construction).
 *
 * Copy markup: "**accent**" switches to the accent font/fill, "\n" forces a line break.
 */

interface Run { text: string; accent: boolean }
interface Token { text: string; accent: boolean; space: boolean; glue: "none" | "before" | "after"; forceBreak?: boolean }

const CJK = /[぀-ヿ㐀-鿿豈-﫿＀-￯　-〿]/;
const HANGUL = /[가-힣㄰-㆏]/;
const NO_START = new Set("，。、！？：；）」』】》〉,.!?:;)]}%’”·…—~～·");
const NO_END = new Set("（「『【《〈([{‘“");

export function parseRich(src: string): Run[][] {
  // returns paragraphs → runs
  return src.split("\n").map((para) => {
    const runs: Run[] = [];
    const parts = para.split("**");
    parts.forEach((p, i) => { if (p) runs.push({ text: p, accent: i % 2 === 1 }); });
    return runs;
  });
}

function tokenize(runs: Run[], lang: Lang): Token[] {
  const out: Token[] = [];
  for (const r of runs) {
    let buf = "";
    const flush = () => { if (buf) { out.push({ text: buf, accent: r.accent, space: false, glue: "none" }); buf = ""; } };
    for (const ch of Array.from(r.text)) {
      if (ch === " ") { flush(); out.push({ text: " ", accent: r.accent, space: true, glue: "none" }); continue; }
      const cjkChar = CJK.test(ch) && !HANGUL.test(ch);
      if (cjkChar || (lang === "zh" && NO_START.has(ch))) {
        flush();
        const glue = NO_START.has(ch) ? "before" : NO_END.has(ch) ? "after" : "none";
        out.push({ text: ch, accent: r.accent, space: false, glue });
        continue;
      }
      if (NO_START.has(ch) && !buf && out.length) { // punctuation glued to the previous token
        out.push({ text: ch, accent: r.accent, space: false, glue: "before" });
        continue;
      }
      buf += ch;
    }
    flush();
  }
  // merge glue tokens into neighbours so they never start/end a line
  const merged: Token[] = [];
  for (let i = 0; i < out.length; i++) {
    const t = out[i];
    if (t.glue === "before" && merged.length && !merged[merged.length - 1].space && merged[merged.length - 1].accent === t.accent) {
      merged[merged.length - 1] = { ...merged[merged.length - 1], text: merged[merged.length - 1].text + t.text };
    } else merged.push({ ...t });
  }
  const res: Token[] = [];
  for (let i = 0; i < merged.length; i++) {
    const t = merged[i];
    if (t.glue === "after" && i + 1 < merged.length && !merged[i + 1].space && merged[i + 1].accent === t.accent) {
      merged[i + 1] = { ...merged[i + 1], text: t.text + merged[i + 1].text };
      continue;
    }
    res.push(t);
  }
  return res;
}

export interface GlyphPos { ch: string; font: opentype.Font; x: number; adv: number; accent: boolean }
export interface Line { tokens: Token[]; width: number; glyphs: GlyphPos[]; paraEnd?: boolean }
export interface TextLayout {
  size: number; lines: Line[]; width: number; height: number; overflow: boolean; capTop: number; lineGap: number;
  minSize: number; text: string;
}

export class TextEngine {
  constructor(private reg: FontRegistry, private lang: Lang) {}

  private fontFor(ch: string, family: string): opentype.Font {
    const f = this.reg.get(family);
    if (ch === " " || f.charToGlyph(ch).index !== 0) return f;
    for (const k of FALLBACK[this.lang]) {
      if (!this.reg.has(k)) continue;
      const fb = this.reg.get(k);
      if (fb.charToGlyph(ch).index !== 0) return fb;
    }
    return f;
  }

  /** missing glyphs anywhere in the fallback chain (validation) */
  missingGlyphs(text: string, family: string): string[] {
    const miss = new Set<string>();
    for (const ch of Array.from(text.replace(/\*\*/g, "").replace(/\n/g, ""))) {
      if (ch === " ") continue;
      const f = this.fontFor(ch, family);
      if (f.charToGlyph(ch).index === 0) miss.add(ch);
    }
    return [...miss];
  }

  private measureToken(t: Token, style: TextStyle, size: number): { w: number; glyphs: GlyphPos[] } {
    const fam = t.accent && style.accentFamily ? style.accentFamily : style.family;
    const track = (style.tracking ?? 0) * size;
    let x = 0; const glyphs: GlyphPos[] = [];
    let prev: opentype.Glyph | null = null; let prevFont: opentype.Font | null = null;
    for (const ch of Array.from(t.text)) {
      const font = this.fontFor(ch, fam);
      const g = font.charToGlyph(ch);
      const scale = size / font.unitsPerEm;
      if (prev && prevFont === font) x += font.getKerningValue(prev, g) * scale;
      const adv = (g.advanceWidth ?? font.unitsPerEm * 0.5) * scale;
      glyphs.push({ ch, font, x, adv, accent: t.accent });
      x += adv + track;
      prev = g; prevFont = font;
    }
    return { w: x, glyphs };
  }

  private wrap(tokens: Token[], style: TextStyle, size: number, maxW: number): Line[] {
    const lines: Line[] = [];
    let cur: Token[] = []; let curW = 0;
    const tokW = (t: Token) => this.measureToken(t, style, size).w;
    const push = (paraEnd = false) => {
      while (cur.length && cur[cur.length - 1].space) { curW -= tokW(cur[cur.length - 1]); cur.pop(); }
      lines.push({ ...this.buildLine(cur, style, size), paraEnd });
      cur = []; curW = 0;
    };
    for (const t of tokens) {
      if (t.forceBreak) { push(true); continue; }
      const w = tokW(t);
      if (t.space && !cur.length) continue;
      if (curW + w <= maxW || !cur.length) {
        if (!cur.length && w > maxW && !t.space && Array.from(t.text).length > 1) {
          // split an over-long word by characters
          let piece = "";
          for (const ch of Array.from(t.text)) {
            const tw = tokW({ ...t, text: piece + ch });
            if (tw > maxW && piece) { cur = [{ ...t, text: piece }]; push(); piece = ch; } else piece += ch;
          }
          cur = [{ ...t, text: piece }]; curW = tokW(cur[0]);
          continue;
        }
        cur.push(t); curW += w;
      } else { push(); if (!t.space) { cur.push(t); curW = w; } }
    }
    if (cur.length) push(true);
    if (lines.length) lines[lines.length - 1].paraEnd = true;
    return lines;
  }

  /** a paragraph's last line holding only 1–2 CJK characters (e.g. "光。") — a typographic widow */
  private hasWidow(lines: Line[]): boolean {
    return lines.some((l, i) => {
      if (!l.paraEnd || i === 0 || lines[i - 1].paraEnd) return false;
      const t = l.tokens.map((k) => k.text).join("").replace(/[\s\p{P}]/gu, "");
      return t.length > 0 && t.length <= 2 && (CJK.test(t) || HANGUL.test(t));
    });
  }

  /** same size, same line count, narrower measure → balanced CJK lines without a widow */
  private balance(tokens: Token[], style: TextStyle, size: number, maxW: number, lines: Line[]): Line[] {
    if (!this.hasWidow(lines)) return lines;
    // the narrowest measure that keeps the line count is the most even split (e.g. 5+5 chars, not 6+4)
    let best = lines;
    for (let f = 0.975; f >= 0.4; f -= 0.0125) {
      const alt = this.wrap(tokens, style, size, maxW * f);
      if (alt.length > lines.length) break;
      if (!this.hasWidow(alt)) best = alt;
    }
    return best;
  }

  private buildLine(tokens: Token[], style: TextStyle, size: number): Line {
    let x = 0; const glyphs: GlyphPos[] = [];
    const track = (style.tracking ?? 0) * size;
    tokens.forEach((t) => {
      const m = this.measureToken(t, style, size);
      m.glyphs.forEach((g) => glyphs.push({ ...g, x: x + g.x }));
      x += m.w;
    });
    return { tokens, width: Math.max(0, x - (glyphs.length ? track : 0)), glyphs };
  }

  private capHeight(style: TextStyle, size: number, hasCJK: boolean): number {
    const f = this.reg.get(style.family);
    const os2 = (f.tables as any).os2;
    const cap = os2?.sCapHeight ? os2.sCapHeight / f.unitsPerEm : 0.7;
    return size * (hasCJK ? Math.max(cap, 0.8) : cap);
  }

  /** Lay out text inside a box, shrinking from style.size down to style.minSize until it fits. */
  layout(src: string, style: TextStyle, box: { w: number; h: number }): TextLayout {
    const text = style.upper ? src.toUpperCase().replace(/\*\*([^*]+)\*\*/g, (_, s) => `**${s}**`) : src;
    const paras = parseRich(text);
    const tokens: Token[] = [];
    paras.forEach((runs, i) => { if (i) tokens.push({ text: "", accent: false, space: false, glue: "none", forceBreak: true }); tokens.push(...tokenize(runs, this.lang)); });
    const hasCJK = CJK.test(text) || HANGUL.test(text);
    const lh = style.lineHeight ?? 1.25;
    const minSize = style.minSize ?? style.size * 0.55;
    let size = style.size;
    let best: TextLayout | null = null;
    for (let i = 0; i < 60; i++) {
      const lines = this.balance(tokens, style, size, box.w, this.wrap(tokens, style, size, box.w));
      const width = Math.max(0, ...lines.map((l) => l.width));
      const cap = this.capHeight(style, size, hasCJK);
      const height = cap + (lines.length - 1) * size * lh + size * 0.22;
      const fits = width <= box.w + 0.5 && height <= box.h + 0.5 && (!style.maxLines || lines.length <= style.maxLines);
      best = { size, lines, width, height, overflow: !fits, capTop: cap, lineGap: size * lh, minSize, text: src };
      if (fits) return best;
      if (size <= minSize) break;
      size = Math.max(minSize, size * 0.965);
    }
    return best!;
  }

  /** SVG for a laid-out block whose top-left visual corner is (x, y) inside a box of width w. */
  toSvg(L: TextLayout, style: TextStyle, x: number, y: number, w: number, id = "t"): string {
    const align = style.align ?? "left";
    const groups: Record<"n" | "a", string[]> = { n: [], a: [] };
    L.lines.forEach((line, i) => {
      const base = y + L.capTop + i * L.lineGap;
      const lx = align === "left" ? x : align === "center" ? x + (w - line.width) / 2 : x + w - line.width;
      for (const g of line.glyphs) {
        if (g.ch === " ") continue;
        const p = g.font.charToGlyph(g.ch).getPath(lx + g.x, base, L.size).toPathData(2);
        if (p) groups[g.accent ? "a" : "n"].push(p);
      }
    });
    const op = style.opacity != null && style.opacity < 1 ? ` opacity="${style.opacity}"` : "";
    let s = "";
    if (groups.n.length) s += `<path data-el="${id}" fill="${style.fill ?? "#F4EFE7"}"${op} d="${groups.n.join("")}"/>`;
    if (groups.a.length) s += `<path data-el="${id}-accent" fill="${style.accentFill ?? style.fill ?? "#E5C58D"}"${op} d="${groups.a.join("")}"/>`;
    return s;
  }
}
