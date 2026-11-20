import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Luxury Black
        onyx: "#07070a",
        coal: "#111116",
        gold: "#d8b878",
        gold2: "#f3e2b8",
        // Premium White
        bone: "#f7f5f1",
        stone: "#e6e1d8",
        graphite: "#1d1d1f",
        // Studio (admin)
        canvas: "#0b0d12",
        panel: "#12151c",
        line: "#232836",
        muted: "#8b93a7",
        accent: "#7c9cff",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        display: ["var(--font-display)"],
      },
    },
  },
  plugins: [],
};
export default config;
