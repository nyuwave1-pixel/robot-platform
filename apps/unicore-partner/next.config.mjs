import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUPABASE_HOST = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname; } catch { return "qeabsjyglethzkwlkmaw.supabase.co"; }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // mediderma.unincore.com 아래(/@아이디, /studio 등)에서 함께 서비스되므로,
  // 정적 파일 경로가 MEDIDERMA AI 앱의 /_next 와 겹치지 않게 따로 둔다.
  assetPrefix: "/partner-static",
  async rewrites() {
    return { beforeFiles: [{ source: "/partner-static/_next/:path+", destination: "/_next/:path+" }] };
  },
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname, "../../"),
  images: { remotePatterns: [{ protocol: "https", hostname: SUPABASE_HOST, pathname: "/storage/v1/object/public/**" }] },
  async headers() {
    return [
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
