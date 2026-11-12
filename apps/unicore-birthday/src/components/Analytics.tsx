"use client";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/** 방문·클릭 집계: Vercel Web Analytics(대시보드에서 Enable 필요) + GA4(측정 ID 환경변수 설정 시) */
export default function Analytics() {
  return (
    <>
      <VercelAnalytics />
      {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </>
  );
}
