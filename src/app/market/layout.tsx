import type { Metadata } from "next";

// 페이지별 고유 제목/설명 — 검색엔진 중복 제목 감점 방지.
// (page.tsx가 'use client'라 metadata를 직접 못 내보내므로 통과형 layout에서 부여)
export const metadata: Metadata = {
  title: "마켓플레이스 — 로봇 서비스 & 도구 거래",
  description: "로봇 관련 서비스와 도구를 사고파는 마켓플레이스. 보안 분석·실시간 모니터링·데이터 처리 등.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
