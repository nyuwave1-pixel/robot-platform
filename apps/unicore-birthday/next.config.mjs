import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["three"],
  images: { formats: ["image/avif", "image/webp"] },
  experimental: { optimizePackageImports: ["@react-three/drei"] },
  // 한국어는 경로 없이(/) 서비스하고 내부적으로 /ko 로 리라이트, /en · /zh 는 그대로
  async rewrites() {
    return [{ source: "/", destination: "/ko" }];
  },
  async redirects() {
    return [{ source: "/ko", destination: "/", permanent: true }];
  },
  async headers() {
    return [
      { source: "/media/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/audio/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800" }] },
      { source: "/og/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400" }] },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
export default nextConfig;
