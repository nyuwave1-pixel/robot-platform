import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdSenseLoader from "@/components/AdSenseLoader";
import "./globals.css";

const SITE_URL = "https://www.airobotphysical.com/robot-platform";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "로봇플랫폼 — 세계의 로봇을 한 곳에서",
    template: "%s | 로봇플랫폼",
  },
  description:
    "휴머노이드·산업·의료·드론 등 세계 48종 로봇의 스펙과 신뢰도를 비교하고, 커뮤니티에서 토론하세요. 로봇 갤러리·포럼·마켓플레이스를 갖춘 로봇 정보 플랫폼.",
  keywords: [
    "로봇",
    "휴머노이드",
    "로봇 비교",
    "로봇 스펙",
    "Boston Dynamics",
    "Unitree",
    "Tesla Optimus",
    "로봇 커뮤니티",
    "산업용 로봇",
    "의료 로봇",
  ],
  openGraph: {
    title: "로봇플랫폼 — 세계의 로봇을 한 곳에서",
    description:
      "휴머노이드부터 드론까지 48종 로봇의 스펙·신뢰도 비교와 커뮤니티 토론.",
    url: SITE_URL,
    siteName: "로봇플랫폼",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "로봇플랫폼 — 세계의 로봇을 한 곳에서",
    description:
      "휴머노이드부터 드론까지 48종 로봇의 스펙·신뢰도 비교와 커뮤니티 토론.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-slate-900 text-white">
        <AdSenseLoader />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
