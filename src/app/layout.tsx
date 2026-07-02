import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "로봇플랫폼",
  description: "무료 개발 환경에서 구축한 로봇 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-[#060608] text-white">
        {children}
      </body>
    </html>
  );
}
