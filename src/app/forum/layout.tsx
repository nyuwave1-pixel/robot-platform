import type { Metadata } from "next";

// 페이지별 고유 제목/설명 — 검색엔진 중복 제목 감점 방지.
// (page.tsx가 'use client'라 metadata를 직접 못 내보내므로 통과형 layout에서 부여)
export const metadata: Metadata = {
  title: "커뮤니티 포럼 — 로봇 토론 & RP 보상",
  description: "로봇 AI에 대해 함께 토론하고 RP 포인트로 보상받는 로봇플랫폼 커뮤니티 포럼.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
