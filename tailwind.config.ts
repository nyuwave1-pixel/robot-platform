import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Robot AI Platform Colors
        "robot-dark": "#0f172a",      // 심해검정
        "robot-gold": "#fbbf24",       // AI 황금
        "robot-blue": "#3b82f6",       // 기술 청색
        "robot-text": "#f1f5f9",       // 거의 흰색
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        lexend: ["Lexend", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
      backgroundImage: {
        "robot-gradient": "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-in-out",
        "slide-up": "slideUp 0.8s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(251, 191, 36, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(251, 191, 36, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
