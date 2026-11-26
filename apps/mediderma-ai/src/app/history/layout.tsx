import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 분석 기록",
  description: "이 기기에 저장된 나의 피부 분석 기록입니다.",
  alternates: { canonical: "/history" },
  openGraph: { siteName: "MEDIDERMA SKIN IQ", locale: "ko_KR", type: "website", title: "내 분석 기록", description: "이 기기에 저장된 나의 피부 분석 기록입니다.", url: "/history" },
  // 기기별 개인 기록 화면 — 검색 결과에 노출하지 않는다
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
