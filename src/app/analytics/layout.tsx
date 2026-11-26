import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

// 아직 실제 데이터가 연결되지 않은 예시 화면 — 실콘텐츠가 들어오면 NOINDEX 를 빼고 사이트맵에 추가할 것
export const metadata: Metadata = { title: "분석", ...NOINDEX };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
