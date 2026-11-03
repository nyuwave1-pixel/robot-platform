import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#FBF8F3",
        cream: "#F4EDE3",
        sand: "#E7DBCB",
        ink: { DEFAULT: "#1D1B18", soft: "#4A4540", mute: "#7A726A" },
        citrus: { DEFAULT: "#E98A15", deep: "#C4690A", light: "#FBE3C2" },
        sun: { DEFAULT: "#E9B53A", light: "#FBF0CF" },
        peach: { DEFAULT: "#E4936F", light: "#F9E1D5" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: { eyebrow: "0.22em" },
      maxWidth: { site: "1240px" },
      keyframes: {
        floaty: { "0%,100%": { transform: "translateY(0) rotate(-2deg)" }, "50%": { transform: "translateY(-14px) rotate(1deg)" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
      },
      animation: {
        floaty: "floaty 7s ease-in-out infinite",
        marquee: "marquee 38s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
