import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 사업자 화이트라벨 플랫폼(apps/unicore-partner)의 배포 주소. 같은 도메인 아래 아래 경로들을 그 앱으로 넘긴다.
const PARTNER = (process.env.PARTNER_ORIGIN ?? "https://unicore-partner.vercel.app").replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["three"],
  async rewrites() {
    return [
      { source: "/:handle(@[a-z0-9-]{3,30})", destination: `${PARTNER}/:handle` },
      { source: "/p/:slug", destination: `${PARTNER}/p/:slug` },
      { source: "/studio", destination: `${PARTNER}/studio` },
      { source: "/studio/:path*", destination: `${PARTNER}/studio/:path*` },
      { source: "/hq", destination: `${PARTNER}/hq` },
      { source: "/login", destination: `${PARTNER}/login` },
      { source: "/auth/:path*", destination: `${PARTNER}/auth/:path*` },
      { source: "/partner", destination: `${PARTNER}/partner` },
      { source: "/partner/sitemap.xml", destination: `${PARTNER}/sitemap.xml` },
      { source: "/partner-static/:path*", destination: `${PARTNER}/partner-static/:path*` },
    ];
  },
  async headers() {
    return [
      { source: "/models/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/mediapipe/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      // 스튜디오의 실시간 미리보기는 같은 출처의 iframe 으로 열리므로 그 경로만 SAMEORIGIN, 나머지는 DENY
      { source: "/((?!studio/preview).*)", headers: [{ key: "X-Frame-Options", value: "DENY" }] },
      { source: "/studio/preview", headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }] },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // 카메라는 자체 출처에서만 허용 (촬영 기능). 마이크·위치는 차단.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
export default nextConfig;
