"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import SmoothScroll from "@/features/scroll/SmoothScroll";
import Chrome from "@/components/Chrome";
import Hero from "@/components/sections/Hero";
import TwentyEight from "@/components/sections/TwentyEight";
import ProductReveal from "@/components/sections/ProductReveal";
import Clinical from "@/components/sections/Clinical";
import Masterpiece from "@/components/sections/Masterpiece";
import Ingredients from "@/components/sections/Ingredients";
import Pdrn from "@/components/sections/Pdrn";
import SkinScience from "@/components/sections/SkinScience";
import Moisture from "@/components/sections/Moisture";
import Satisfaction from "@/components/sections/Satisfaction";
import HowToUse from "@/components/sections/HowToUse";
import Final from "@/components/sections/Final";
import Lineup from "@/components/sections/Lineup";
import Footer from "@/components/Footer";
import SoundToggle from "@/components/SoundToggle";
import LangSwitch from "@/components/LangSwitch";
import { audio } from "@/features/audio/audio";

/** 인트로 종료를 문서에 기록하고 알림 — 히어로 영상 등이 이 시점부터 로드 */
function markIntroClosed() {
  document.documentElement.dataset.intro = "closed";
  window.dispatchEvent(new Event("uc:intro-closed"));
}

const IntroOverlay = dynamic(() => import("@/features/intro/IntroOverlay"), { ssr: false });

export default function Experience() {
  // 'pending' 동안은 인트로를 열지 않고 로컬 저장값을 확인 (SSR 콘텐츠는 그대로 렌더)
  const [intro, setIntro] = useState<"pending" | "open" | "closed">("pending");
  // 진입 시 항상 맨 위(히어로)에서 시작 — 브라우저의 스크롤 위치 복원 차단
  useEffect(() => {
    try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch {}
    const toTop = () => { window.scrollTo(0, 0); (window as unknown as { __lenis?: { scrollTo?: (y: number, o?: object) => void } }).__lenis?.scrollTo?.(0, { immediate: true }); };
    toTop();
    const t = window.setTimeout(toTop, 50);
    window.addEventListener("pageshow", toTop);
    return () => { window.clearTimeout(t); window.removeEventListener("pageshow", toTop); };
  }, []);
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem("uc.introSeen") === "1"; } catch {}
    const params = new URLSearchParams(window.location.search);
    if (params.get("intro") === "1") seen = false;
    if (params.get("intro") === "0") seen = true;
    setIntro(seen ? "closed" : "open");
    if (seen) markIntroClosed();
    // 사이트 진입 시 BGM 자동재생 시도 (차단되면 첫 제스처에서 시작)
    void audio.autoplay();
  }, []);
  return (
    <>
      <SmoothScroll locked={intro === "open"} />
      {/* SSR 시점부터 화면을 덮는 커버 — 하이드레이션 전 히어로가 먼저 보이는 플래시 방지 */}
      {intro !== "closed" && <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 999, background: "var(--bg-midnight)" }} />}
      {intro === "open" && <IntroOverlay onDone={() => { setIntro("closed"); markIntroClosed(); }} />}
      <main id="main">
        <Hero />
        <TwentyEight />
        <ProductReveal />
        <Clinical />
        <Masterpiece />
        <Ingredients />
        <Pdrn />
        <SkinScience />
        <Moisture />
        <Satisfaction />
        <HowToUse />
        <Lineup />
        <Final />
      </main>
      <Footer />
      <Chrome />
      {intro === "closed" && <LangSwitch />}
      {intro === "closed" && <SoundToggle />}
    </>
  );
}
