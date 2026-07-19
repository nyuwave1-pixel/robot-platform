import type { Metadata } from "next";

// 페이지별 고유 제목/설명 — 검색엔진 중복 제목 감점 방지.
// (page.tsx가 'use client'라 metadata를 직접 못 내보내므로 통과형 layout에서 부여)
export const metadata: Metadata = {
  title: "소개 — 로봇플랫폼이란",
  description: "휴머노이드부터 드론까지 세계 로봇을 한 곳에서 비교·토론하는 로봇 정보 플랫폼 소개.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
