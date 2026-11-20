"use client";
/**
 * 스튜디오 미리보기 전용 화면 (iframe 안에서 열림).
 * 같은 출처의 부모 창이 보내는 작성 중 데이터를 받아 실제 공개 페이지와 같은 렌더러로 그린다.
 * iframe 폭이 곧 화면 폭이므로 모바일·태블릿·PC 반응형 규칙이 실제와 똑같이 적용된다.
 */
import { useEffect, useState } from "react";
import SiteRenderer, { type SiteProfile } from "@/components/site/SiteRenderer";
import type { HqProduct } from "@/lib/types";

export default function PreviewFrame() {
  const [data, setData] = useState<{ profile: SiteProfile; products: HqProduct[] } | null>(null);
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "draft") setData({ profile: e.data.profile, products: e.data.products });
    };
    window.addEventListener("message", on);
    window.parent?.postMessage({ type: "preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", on);
  }, []);
  if (!data) return <div className="min-h-screen bg-onyx" />;
  return <SiteRenderer profile={data.profile} products={data.products} />;
}
