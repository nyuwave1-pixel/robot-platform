import type { Metadata } from "next";
import { Suspense } from "react";
import CompareFlow from "@/components/CompareFlow";
export const metadata: Metadata = {
  title: "피부 변화 비교 — 이전 결과와 나란히 보기",
  description: "이전 분석 결과와 현재 피부 상태를 나란히 비교해 케어 전후 변화를 확인하세요.",
  alternates: { canonical: "/compare" },
  openGraph: { siteName: "MEDIDERMA SKIN IQ", locale: "ko_KR", type: "website", title: "피부 변화 비교 — 이전 결과와 나란히 보기", description: "이전 분석 결과와 현재 피부 상태를 나란히 비교해 케어 전후 변화를 확인하세요.", url: "/compare" },
};

export default function Page() {
  return (
    <Suspense>
      <CompareFlow />
    </Suspense>
  );
}
