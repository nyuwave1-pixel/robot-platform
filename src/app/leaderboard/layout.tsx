import type { Metadata } from "next";

// 페이지별 고유 제목/설명 — 검색엔진 중복 제목 감점 방지.
// (page.tsx가 'use client'라 metadata를 직접 못 내보내므로 통과형 layout에서 부여)
export const metadata: Metadata = {
  title: "리더보드 — 로봇 & 커뮤니티 랭킹",
  description: "로봇 신뢰도 랭킹과 커뮤니티 기여 순위를 한눈에. 로봇플랫폼 리더보드.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
