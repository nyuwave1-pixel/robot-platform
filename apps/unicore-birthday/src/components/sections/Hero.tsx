"use client";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { sourcesFor, videos } from "@/data/videos";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import { useIntroClosed, useIsMobile, useQualityTier, useReducedMotion } from "@/lib/env";
import s from "./sections.module.css";
import { useDict } from "@/i18n/context";

const GoldParticles = dynamic(() => import("@/features/scenes/GoldParticles"), { ssr: false });

/** 히어로: 상세페이지 '1st' 캔들 비주얼 + 임상강조 세로 필름(메인 플레이어, 무음 루프) */
export default function Hero() {
  const t = useDict();
  const pin = useRef<HTMLElement>(null);
  const en = useRef<HTMLHeadingElement>(null);
  const ko = useRef<HTMLParagraphElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const tier = useQualityTier();
  const reduced = useReducedMotion();
  const film = videos.filmPortrait;
  const mobile = useIsMobile();
  const introClosed = useIntroClosed();

  useSectionProgress(pin, (p) => {
    if (reduced) return;
    const e = en.current, k = ko.current, f = frame.current; if (!e || !k) return;
    const fade = p < 0.55 ? 1 : Math.max(0, 1 - (p - 0.55) / 0.3);
    e.style.transform = `rotateX(${3 + p * 14}deg) translateZ(${-p * 220}px)`;
    e.style.opacity = String(fade);
    k.style.opacity = String(fade);
    k.style.transform = `translateY(${p * -30}px)`;
    if (f) { f.style.transform = `translateY(${p * -40}px) scale(${1 - p * 0.06})`; f.style.opacity = String(fade); }
  });

  // 뷰포트 안에서만 재생 (항상 음소거 — 사이트 사운드는 BGM 단일)
  useEffect(() => {
    const v = video.current; if (!v || !introClosed) return;
    v.muted = true; v.defaultMuted = true;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.2 });
    io.observe(v); return () => io.disconnect();
  }, [introClosed]);

  return (
    <section id="birthday" ref={pin} className={s.pin} style={{ height: "250svh" }} data-bg="#080706" aria-labelledby="h-birthday">
      <div className={`${s.stage} ${s.hero}`}>
        <div className={`${s.bgStill} ${s.heroBg}`} aria-hidden="true" />
        <div className="veil-soft" />
        {/* 파티클(three.js)은 인트로가 닫힌 뒤 로드 — 인트로 중 메인스레드 부담 제거 */}
        {introClosed && tier !== "lite" && !reduced && <GoldParticles count={tier === "high" ? 700 : 300} />}
        <div className={`${s.center} ${s.heroGrid}`}>
          <div className={s.heroText}>
            <p ref={ko} className={`display-en ${s.heroEyebrow}`}>{t.copy.s01.en}</p>
            <h1 id="h-birthday" ref={en} className={`headline-ko ${s.heroKoBig}`} style={{ transform: "rotateX(3deg)" }}>
              <span className={s.heroKoLine}>{t.copy.s01.ko1}</span>
              <b className={s.heroKoEm}>{t.copy.s01.ko2}</b>
            </h1>
          </div>
          <div ref={frame} className={s.heroFrame} aria-label={t.ui.heroFilm}>
            {/* 인트로가 닫힌 뒤에만 소스를 붙여 인트로 필름과 동시 다운로드를 피함 (포스터가 LCP) */}
            <video ref={video} poster={film.poster} playsInline muted loop preload={introClosed ? "auto" : "none"} aria-hidden="true">
              {introClosed && sourcesFor(film, mobile).map((src) => <source key={src.src} src={src.src} type={src.type} />)}
            </video>
            <span className={s.heroFrameCap}>CLINICAL FILM · 60s</span>
          </div>
        </div>
        <div className={s.heroHint} aria-hidden="true"><span className="caption">Scroll</span><i /></div>
        <span className={s.chap}>01 / 13 · SKIN HAS A BIRTHDAY</span>
      </div>
    </section>
  );
}
