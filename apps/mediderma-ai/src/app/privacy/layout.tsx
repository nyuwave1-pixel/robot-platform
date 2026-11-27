import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보 처리 안내 — 사진은 기기 안에서만",
  description: "MEDIDERMA SKIN IQ 는 얼굴 사진을 서버로 보내지 않고 기기 안에서만 처리합니다. 수집 항목과 보관 방식을 안내합니다.",
  alternates: { canonical: "/privacy" },
  openGraph: { siteName: "MEDIDERMA SKIN IQ", locale: "ko_KR", type: "website", title: "개인정보 처리 안내 — 사진은 기기 안에서만", description: "MEDIDERMA SKIN IQ 는 얼굴 사진을 서버로 보내지 않고 기기 안에서만 처리합니다. 수집 항목과 보관 방식을 안내합니다.", url: "/privacy" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
