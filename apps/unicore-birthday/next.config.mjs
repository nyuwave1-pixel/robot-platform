/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    ];
  },
};
export default nextConfig;
