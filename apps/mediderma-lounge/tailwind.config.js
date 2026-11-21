/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pink: { soft: "#F9D5DC", deep: "#E79AAE" },
        cream: "#FFF8F0",
        gold: "#C9A66B",
        lav: "#D9CFF2",
        peach: "#F3D9C4",
        ink: "#1B1719",
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', "Pretendard", "system-ui", "-apple-system", '"Apple SD Gothic Neo"', '"Noto Sans KR"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
