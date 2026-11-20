import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Shell from "@/components/Shell";

// 대표 주소: 후이즈 도메인(mediderma.unincore.com). 다른 주소로 배포하면 NEXT_PUBLIC_SITE_URL 로 바꾼다.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mediderma.unincore.com";
const TITLE = "MEDIDERMA AI SKIN ANALYSIS — Scan your skin. Discover your care.";
const DESCRIPTION = "회원가입 없이 얼굴 사진 한 장으로 피부 상태를 관찰하고, 더마홈 맞춤 케어를 확인하세요. 사진은 기기 안에서만 처리됩니다.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · MEDIDERMA AI" },
  description: DESCRIPTION,
  applicationName: "MEDIDERMA AI",
  keywords: ["AI 피부 분석", "피부 진단", "더마홈", "DERMA HOME", "UNI&CORE", "홈케어 디바이스", "skin analysis"],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "MEDIDERMA AI",
    title: TITLE,
    description: DESCRIPTION,
    locale: "ko_KR",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#05070a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-ink text-white antialiased">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
