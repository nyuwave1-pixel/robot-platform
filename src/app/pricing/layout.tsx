import type { Metadata } from "next";

// 페이지별 고유 제목/설명 — 검색엔진 중복 제목 감점 방지.
// (page.tsx가 'use client'라 metadata를 직접 못 내보내므로 통과형 layout에서 부여)
export const metadata: Metadata = {
  title: "요금 안내",
  description: "로봇플랫폼 요금 및 플랜 안내 — 모든 기능 무료.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
