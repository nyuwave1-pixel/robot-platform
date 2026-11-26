import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Shell from "@/components/Shell";

// 대표 주소: 후이즈 도메인(mediderma.unincore.com). 다른 주소로 배포하면 NEXT_PUBLIC_SITE_URL 로 바꾼다.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mediderma.unincore.com";
// 검색 결과 제목 — 브랜드명 + 한국어 검색어("AI 피부 분석")를 함께 담는다. 영문 슬로건은 OG 설명·화면에서 유지.
const TITLE = "MEDIDERMA SKIN IQ — AI 피부 분석 · 사진 한 장으로 피부 상태 확인";
const DESCRIPTION = "회원가입 없이 얼굴 사진 한 장으로 피부 상태를 관찰하고, 더마홈 맞춤 케어를 확인하세요. 사진은 기기 안에서만 처리됩니다.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · MEDIDERMA SKIN IQ" },
  description: DESCRIPTION,
  applicationName: "MEDIDERMA SKIN IQ",
  keywords: ["AI 피부 분석", "피부 진단", "더마홈", "DERMA HOME", "UNI&CORE", "홈케어 디바이스", "skin analysis", "SKIN IQ", "스킨 IQ", "MEDIDERMA SKIN IQ", "skin score"],
  // 홈의 canonical. 하위 페이지는 각자 layout 에서 선언한다(여기 값이 상속되면 전부 홈의 중복본이 된다)
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  // 구글 서치콘솔 · 네이버 서치어드바이저 소유확인 (공개값, Vercel 환경변수로 주입)
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ? { other: { "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION } } : {}),
  },
  openGraph: {
    type: "website",
    siteName: "MEDIDERMA SKIN IQ",
    title: TITLE,
    description: DESCRIPTION,
    locale: "ko_KR",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#F6F7F8" };

// 구조화 데이터 — 네이버(SoftwareApplication: name + applicationCategory 필수)·구글 공통.
// 평점·리뷰는 실제 데이터가 없으므로 넣지 않는다.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "MEDIDERMA SKIN IQ",
      alternateName: ["메디더마 스킨 IQ", "SKIN IQ"],
      inLanguage: "ko",
    },
    {
      "@type": ["SoftwareApplication", "WebApplication"],
      name: "MEDIDERMA SKIN IQ",
      url: SITE_URL,
      description: DESCRIPTION,
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      inLanguage: ["ko", "en"],
      publisher: { "@type": "Organization", name: "UNI&CORE" },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-ink text-white">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
