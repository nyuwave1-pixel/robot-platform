import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#05070a",
        panel: "#0c1016",
        line: "#1c232d",
        silver: "#c9d1d9",
        scan: "#4fb6ff",
        scan2: "#7fe0ff",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "Apple SD Gothic Neo", "Malgun Gothic", "sans-serif"],
      },
      boxShadow: { glow: "0 0 40px rgba(79,182,255,0.25)" },
      keyframes: { scan: { "0%,100%": { top: "0%" }, "50%": { top: "88%" } } },
    },
  },
  plugins: [],
};
export default config;
