"use client";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { copy } from "@/data/copy";
import { detail } from "@/data/images";
import { videos } from "@/data/videos";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import { useQualityTier, useReducedMotion } from "@/lib/env";
import s from "./sections.module.css";

const GoldParticles = dynamic(() => import("@/features/scenes/GoldParticles"), { ssr: false });

/** 히어로: 상세페이지 '1st' 캔들 비주얼 + 임상강조 세로 필름(메인 플레이어, 무음 루프) */
export default function Hero() {
  const pin = useRef<HTMLElement>(null);
  const en = useRef<HTMLHeadingElement>(null);
  const ko = useRef<HTMLParagraphElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const tier = useQualityTier();
  const reduced = useReducedMotion();
  const film = videos.filmPortrait;

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
    const v = video.current; if (!v) return;
    v.muted = true; v.defaultMuted = true;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.2 });
    io.observe(v); return () => io.disconnect();
  }, []);

  return (
    <section id="birthday" ref={pin} className={s.pin} style={{ height: "250svh" }} data-bg="#080706" aria-labelledby="h-birthday">
      <div className={`${s.stage} ${s.hero}`}>
        <div className={`${s.bgStill} ${s.heroBg}`} style={{ backgroundImage: `url(${detail.candle})` }} aria-hidden="true" />
        <div className="veil-soft" />
        {tier !== "lite" && !reduced && <GoldParticles count={tier === "high" ? 700 : 300} />}
        <div className={`${s.center} ${s.heroGrid}`}>
          <div className={s.heroText}>
            <p ref={ko} className={`display-en ${s.heroEyebrow}`}>{copy.s01.en.text}</p>
            <h1 id="h-birthday" ref={en} className={`headline-ko ${s.heroKoBig}`} style={{ transform: "rotateX(3deg)" }}>
              <span className={s.heroKoLine}>{copy.s01.ko1.text}</span>
              <b className={s.heroKoEm}>{copy.s01.ko2.text}</b>
            </h1>
          </div>
          <div ref={frame} className={s.heroFrame} aria-label="임상 강조 필름">
            <video ref={video} poster={film.poster} playsInline muted loop preload="metadata" aria-hidden="true">
              {film.sources.map((src) => <source key={src.src} src={src.src} type={src.type} />)}
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
