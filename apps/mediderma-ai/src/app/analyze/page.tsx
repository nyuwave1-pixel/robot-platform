import type { Metadata } from "next";
import AnalyzeFlow from "@/components/AnalyzeFlow";
export const metadata: Metadata = {
  title: "AI 피부 분석 시작 — 사진 한 장으로 피부 측정",
  description: "얼굴 사진 한 장으로 주름·모공·색소·피부톤·피부결 등 피부 상태를 관찰합니다. 회원가입 없이, 사진은 기기 안에서만 처리됩니다.",
  alternates: { canonical: "/analyze" },
  openGraph: { siteName: "MEDIDERMA SKIN IQ", locale: "ko_KR", type: "website", title: "AI 피부 분석 시작 — 사진 한 장으로 피부 측정", description: "얼굴 사진 한 장으로 주름·모공·색소·피부톤·피부결 등 피부 상태를 관찰합니다. 회원가입 없이, 사진은 기기 안에서만 처리됩니다.", url: "/analyze" },
};

export default function Page() {
  return <AnalyzeFlow />;
}
