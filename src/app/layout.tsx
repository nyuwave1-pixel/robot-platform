import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdSenseLoader from "@/components/AdSenseLoader";
import "./globals.css";

export const metadata: Metadata = {
  title: "로봇플랫폼 - Zero Budget Development",
  description: "무료로 만드는 로봇 플랫폼. Firebase + Vercel + Next.js",
  keywords: ["로봇", "플랫폼", "개발", "무료", "오픈소스"],
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
