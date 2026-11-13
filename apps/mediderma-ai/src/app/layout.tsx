import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "MEDIDERMA AI SKIN ANALYSIS — Scan your skin. Discover your care.",
  description: "회원가입 없이 얼굴 사진 한 장으로 피부 상태를 관찰하고, 더마홈 맞춤 케어를 확인하세요. 사진은 기기 안에서만 처리됩니다.",
  robots: { index: true, follow: true },
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
