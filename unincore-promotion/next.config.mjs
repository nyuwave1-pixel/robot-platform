import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This app lives inside another repo; trace files from this folder only.
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  reactStrictMode: true,
  poweredByHeader: false,
  // Static export served by Cloudflare (Worker static assets). Security headers, redirects and the
  // "/?product=" ad routing live in public/_headers, public/_redirects and worker/index.js.
  output: "export",
  images: {
    // Photos are resized at build time (scripts/build-images.mjs) and served from /_img.
    loader: "custom",
    loaderFile: "./src/lib/imageLoader.ts",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [32, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
