import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // backend/ 는 Supabase Edge Function 소스(별도 빌드) — Next 타입 검사 대상이 아니다
  typescript: { tsconfigPath: "tsconfig.json" },
  async rewrites() { return [{ source: "/admin", destination: "/admin/index.html" }]; },
  async headers() {
    return [
      { source: "/media/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
      { source: "/admin", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
      { source: "/:path*", headers: [
        { key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" }, { key: "Permissions-Policy", value: "microphone=(), geolocation=()" },
      ] },
    ];
  },
};
export default nextConfig;
