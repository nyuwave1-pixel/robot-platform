import type { Config } from "tailwindcss";
import defaults from "tailwindcss/colors";

/** 색은 globals.css 의 CSS 변수(RGB 3값)로 정의 — :root 는 화이트·실버, .theme-dark 영역은 미드나이트 블랙 */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
/** 어두운 배경용 밝은 단계(100~300)를 변수로 돌려 밝은 테마에서는 진한 색으로 보이게 */
const tone = (hue: string, base: Record<string, string>, shades: number[]) => ({
  ...base,
  ...Object.fromEntries(shades.map((s) => [s, v(`${hue}-${s}`)])),
});

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 의미 기반 이름: white = 전경(글자), black = 전경 위의 반전색
        white: v("c-fg"),
        black: v("c-on"),
        ink: v("c-bg"),
        panel: v("c-panel"),
        line: v("c-line"),
        silver: v("c-silver"),
        scan: v("c-scan"),
        scan2: v("c-scan2"),
        // 테마와 무관하게 고정된 색 (사진 위 글자 등)
        pure: "#ffffff",
        abyss: "#101318",
        amber: tone("amber", defaults.amber, [100, 200, 300]),
        rose: tone("rose", defaults.rose, [100, 200, 300]),
        emerald: tone("emerald", defaults.emerald, [100, 200, 300]),
        violet: tone("violet", defaults.violet, [200, 300]),
        sky: tone("sky", defaults.sky, [100, 200]),
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "Apple SD Gothic Neo", "Malgun Gothic", "sans-serif"],
      },
      boxShadow: { glow: "0 0 40px rgb(var(--c-scan) / 0.28)" },
      keyframes: { scan: { "0%,100%": { top: "0%" }, "50%": { top: "88%" } } },
    },
  },
  plugins: [],
};
export default config;
