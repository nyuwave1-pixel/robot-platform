"use client";
import { useEffect, useRef, useState } from "react";
import { detail, skinLoop } from "@/data/images";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import Reveal from "@/components/Reveal";
import s from "./sections.module.css";
import { useDict } from "@/i18n/context";

/** 28일 — 배경은 피부 질감 루프(텍스트 없는 구간, 무음), 실패 시 상세페이지 피부 스틸 */
export default function TwentyEight() {
  const t = useDict();
  const pin = useRef<HTMLElement>(null);
  const num = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState(0);
  const [videoOk, setVideoOk] = useState(true);
  useSectionProgress(pin, (p) => {
    const n = num.current; if (!n) return;
    const tilt = -14 + p * 28;
    const scale = 0.72 + Math.min(p, 0.5) * 0.6;
    n.style.transform = `perspective(1200px) rotateY(${tilt}deg) scale(${scale})`;
    n.style.opacity = String(p > 0.9 ? 1 - (p - 0.9) / 0.1 : 1);
    setPhase(p < 0.33 ? 0 : p < 0.66 ? 1 : 2);
  });
  useEffect(() => {
    const v = video.current; if (!v) return;
    v.muted = true;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.1 });
    io.observe(v); return () => io.disconnect();
  }, [videoOk]);
  return (
    <section id="28days" ref={pin} className={s.pin} style={{ height: "300svh" }} data-bg="#17110F" aria-labelledby="h-28">
      <div className={s.stage}>
        <div className="media-bg">
          {videoOk ? (
            <video ref={video} className={s.skinVideo} poster={skinLoop.poster} playsInline muted loop preload="metadata" onError={() => setVideoOk(false)} aria-hidden="true">
              <source src={skinLoop.src} type="video/mp4" />
            </video>
          ) : (
            <div className={`${s.bgStill} ${s.kenburns}`} style={{ backgroundImage: `url(${detail.skinCheek})` }} aria-hidden="true" />
          )}
        </div>
        <div className="veil" />
        <div className={s.center}>
          <div style={{ display: "grid", gap: "clamp(10px, 2vh, 24px)", justifyItems: "center" }}>
            <h2 id="h-28" className="sr-only">{t.copy.s02.total}</h2>
            <div ref={num} className={`numeral ${s.n28}`} aria-hidden="true">28</div>
            <div className={s.days} aria-live="polite">
              <div className={`${s.day} ${phase >= 0 ? s.dayOn : ""}`}><b>{t.copy.s02.days[0]}</b><span>{t.copy.s02.d1}</span></div>
              <div className={`${s.day} ${phase >= 1 ? s.dayOn : ""}`}><b>{t.copy.s02.days[1]}</b><span>{t.copy.s02.d2}</span></div>
              <div className={`${s.day} ${phase >= 2 ? s.dayOn : ""}`}><b>{t.copy.s02.days[2]}</b><span>{t.copy.s02.total}</span></div>
            </div>
            <Reveal mode="weight" as="p" className={`headline-ko ${s.lead}`}>{t.copy.s02.line1} <b>{t.copy.s02.line2}</b></Reveal>
            <p className="footnote" style={{ textAlign: "center" }}>{t.copy.s02.footnote}</p>
          </div>
        </div>
        <span className={s.chap}>02 / 13 · THE 28 DAYS</span>
      </div>
    </section>
  );
}
