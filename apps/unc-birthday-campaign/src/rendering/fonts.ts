import opentype from "opentype.js";
import type { Lang } from "./types";

/** Font files shipped in /public/assets/fonts (all SIL OFL). Text is always converted to outlines. */
export const FONT_FILES: Record<string, string> = {
  "cormorant-300": "CormorantGaramond-300.ttf",
  "cormorant-400": "CormorantGaramond-400.ttf",
  "cormorant-500": "CormorantGaramond-500.ttf",
  "cormorant-600": "CormorantGaramond-600.ttf",
  "cormorant-700": "CormorantGaramond-700.ttf",
  "cormorant-400i": "CormorantGaramond-400i.ttf",
  "cormorant-500i": "CormorantGaramond-500i.ttf",
  "inter-400": "Inter-400.ttf",
  "inter-500": "Inter-500.ttf",
  "inter-600": "Inter-600.ttf",
  "inter-700": "Inter-700.ttf",
  "pretendard-200": "Pretendard-ExtraLight.otf",
  "pretendard-300": "Pretendard-Light.otf",
  "pretendard-400": "Pretendard-Regular.otf",
  "pretendard-500": "Pretendard-Medium.otf",
  "pretendard-600": "Pretendard-SemiBold.otf",
  "pretendard-700": "Pretendard-Bold.otf",
  "notoserifsc-300": "NotoSerifSC-Light.otf",
  "notoserifsc-400": "NotoSerifSC-Regular.otf",
  "notoserifsc-600": "NotoSerifSC-SemiBold.otf",
  "notosanssc-300": "NotoSansSC-Light.otf",
  "notosanssc-400": "NotoSansSC-Regular.otf",
  "notosanssc-500": "NotoSansSC-Medium.otf",
  "notosanssc-700": "NotoSansSC-Bold.otf",
};

/** Per-language fallback chain used when the primary font lacks a glyph. */
export const FALLBACK: Record<Lang, string[]> = {
  ko: ["pretendard-400", "notosanssc-400", "inter-400"],
  en: ["inter-400", "pretendard-400", "notosanssc-400"],
  zh: ["notosanssc-400", "pretendard-400", "inter-400"],
};

export type FontLoader = (file: string) => Promise<ArrayBuffer>;

export class FontRegistry {
  private fonts = new Map<string, opentype.Font>();
  private pending = new Map<string, Promise<opentype.Font>>();
  constructor(private loader: FontLoader) {}

  async load(key: string): Promise<opentype.Font> {
    const have = this.fonts.get(key);
    if (have) return have;
    let p = this.pending.get(key);
    if (!p) {
      const file = FONT_FILES[key];
      if (!file) throw new Error(`Unknown font key ${key}`);
      p = this.loader(file).then((buf) => {
        const f = opentype.parse(buf);
        this.fonts.set(key, f);
        return f;
      });
      this.pending.set(key, p);
    }
    return p;
  }

  async loadAll(keys: string[]) { await Promise.all(keys.map((k) => this.load(k))); }

  get(key: string): opentype.Font {
    const f = this.fonts.get(key);
    if (!f) throw new Error(`Font ${key} not loaded`);
    return f;
  }

  has(key: string) { return this.fonts.has(key); }
}

/** Fonts needed to render one language. */
export function fontsFor(lang: Lang): string[] {
  const latin = ["cormorant-400", "cormorant-500", "cormorant-600", "cormorant-500i", "inter-400", "inter-500", "inter-600", "inter-700"];
  if (lang === "ko") return [...latin, "pretendard-200", "pretendard-300", "pretendard-400", "pretendard-500", "pretendard-600", "pretendard-700", "notosanssc-400"];
  if (lang === "zh") return [...latin, "notoserifsc-300", "notoserifsc-400", "notoserifsc-600", "notosanssc-300", "notosanssc-400", "notosanssc-500", "notosanssc-700", "pretendard-400"];
  return [...latin, "pretendard-400", "notosanssc-400"];
}
