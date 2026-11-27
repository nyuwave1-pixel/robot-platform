import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

// 로그인·개인 화면 — 검색 결과에 노출하지 않는다
export const metadata: Metadata = { title: "로그인", ...NOINDEX };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
