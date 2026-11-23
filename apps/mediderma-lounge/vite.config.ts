import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" 로 빌드해 어떤 하위 경로(Netlify/Vercel/GitHub Pages)에서도 동작하게 한다.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          r3f: ["@react-three/fiber", "@react-three/drei", "@react-three/postprocessing"],
        },
      },
    },
  },
});
