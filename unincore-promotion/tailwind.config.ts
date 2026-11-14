import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#F7F2EA",
        cream: "#F4EDE3",
        sand: "#E7DBCB",
        ink: { DEFAULT: "#1D1B18", soft: "#4A4540", mute: "#6B635C" },
        // VITA C Collection palette (luxury K-beauty: ivory base, champagne/citrus gold accents)
        citrus: { DEFAULT: "#C6A16A", deep: "#94713F", light: "#F1E6D2" },
        sun: { DEFAULT: "#E9B94D", light: "#FBF0CF" },
        peach: { DEFAULT: "#D7B48C", light: "#F3E8DA" },
        night: "#080706",
        obsidian: "#17110F",
        champagne: "#C6A16A",
        gold: { DEFAULT: "#E9B94D", fresh: "#F6D76B" },
        beige: "#E7D9C5",
        // Product landing pages (JYT plan). Product colors come from CSS variables set per page.
        paper: "#FFFFFF",
        band: "#F5F5F1",
        line: "#E6E5DF",
        body: { DEFAULT: "#191A17", soft: "#3F413B", mute: "#5C5F58" },
        acc: {
          DEFAULT: "rgb(var(--acc) / <alpha-value>)",
          ink: "rgb(var(--acc-ink) / <alpha-value>)",
          tint: "rgb(var(--acc-tint) / <alpha-value>)",
          deep: "rgb(var(--acc-deep) / <alpha-value>)",
          bright: "rgb(var(--acc-bright) / <alpha-value>)",
          glow: "rgb(var(--acc-glow) / <alpha-value>)",
        },
        amazon: { DEFAULT: "#FF9900", hover: "#FFA826", ink: "#131921" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: { out: "cubic-bezier(0.23, 1, 0.32, 1)" },
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
