import type { Metadata } from "next";

// 페이지별 고유 제목/설명 — 검색엔진 중복 제목 감점 방지.
// (page.tsx가 'use client'라 metadata를 직접 못 내보내므로 통과형 layout에서 부여)
export const metadata: Metadata = {
  title: "문서 — 이용 가이드",
  description: "로봇플랫폼 이용 방법과 개발 문서 안내.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
