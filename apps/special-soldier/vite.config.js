import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
// css.postcss is set inline so Vite does not pick up the parent repository's PostCSS/Tailwind config.
// SINGLE=1 → one self-contained dist-single/index.html that opens from disk by double-click
// (Chrome refuses module scripts and fetch() on file://, so the normal build needs a web server).
const single = !!process.env.SINGLE;
export default defineConfig({
  base: './', css: { postcss: { plugins: [] } }, assetsInclude: ['**/*.glb'], plugins: single ? [viteSingleFile()] : [],
  build: { target: 'es2022', chunkSizeWarningLimit: 8000, assetsInlineLimit: 16 * 1024 * 1024, outDir: single ? 'dist-single' : 'dist' },
});
