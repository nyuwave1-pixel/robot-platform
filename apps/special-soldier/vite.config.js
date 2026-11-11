import { defineConfig } from 'vite';
// css.postcss is set inline so Vite does not pick up the parent repository's PostCSS/Tailwind config.
export default defineConfig({ base: './', css: { postcss: { plugins: [] } }, assetsInclude: ['**/*.glb'], build: { target: 'es2022', chunkSizeWarningLimit: 6000, assetsInlineLimit: 16 * 1024 * 1024 } });
