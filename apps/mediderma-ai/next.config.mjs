import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["three"],
  // 이 도메인의 관리 화면은 MEDIDERMA 분석 관리자(/admin) 하나다. 흔히 입력하는 관리자 주소를 그쪽으로 보낸다.
  async redirects() {
    return ["/login", "/hq", "/studio", "/partner", "/manager", "/administrator"].map((source) => ({ source, destination: "/admin", permanent: false }));
  },
  async headers() {
    return [
      { source: "/models/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/mediapipe/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          // 카메라는 자체 출처에서만 허용 (촬영 기능). 마이크·위치는 차단.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
export default nextConfig;
