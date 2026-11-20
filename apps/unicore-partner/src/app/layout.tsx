import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Noto_Serif_KR } from "next/font/google";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-cormorant", display: "swap" });
const serifKr = Noto_Serif_KR({ weight: ["300", "400", "600"], variable: "--font-serif-kr", display: "swap", preload: false });
const inter = Inter({ subsets: ["latin"], weight: ["200", "300", "400", "600"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "UNI&CORE PARTNER", template: "%s" },
  description: "UNI&CORE 사업자를 위한 프리미엄 개인 브랜드 홈페이지 플랫폼",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${cormorant.variable} ${serifKr.variable} ${inter.variable}`}>
      <body style={{ ["--font-serif" as string]: "var(--font-cormorant), var(--font-serif-kr), serif", ["--font-display" as string]: "var(--font-inter), var(--font-sans)" }}>{children}</body>
    </html>
  );
}
