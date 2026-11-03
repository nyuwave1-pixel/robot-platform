"use client";
import { useRef } from "react";
import dynamic from "next/dynamic";
import { copy } from "@/data/copy";
import { stills } from "@/data/videos";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import { useQualityTier, useReducedMotion } from "@/lib/env";
import s from "./sections.module.css";

const GoldParticles = dynamic(() => import("@/features/scenes/GoldParticles"), { ssr: false });

export default function Hero() {
  const pin = useRef<HTMLElement>(null);
  const en = useRef<HTMLHeadingElement>(null);
  const ko = useRef<HTMLParagraphElement>(null);
  const tier = useQualityTier();
  const reduced = useReducedMotion();
  useSectionProgress(pin, (p) => {
    if (reduced) return;
    const e = en.current, k = ko.current; if (!e || !k) return;
    // 0~0.5: 서서히 회전·깊이, 0.5~1: 입자화(블러+페이드) → 다음 섹션
    const rot = 14 + p * 26;
    const z = -p * 320;
    const fade = p < 0.55 ? 1 : Math.max(0, 1 - (p - 0.55) / 0.3);
    e.style.transform = `rotateX(${rot}deg) translateZ(${z}px)`;
    e.style.opacity = String(fade);
    e.style.filter = `blur(${(1 - fade) * 10}px)`;
    k.style.opacity = String(fade);
    k.style.transform = `translateY(${p * -40}px)`;
  });
  return (
    <section id="birthday" ref={pin} className={s.pin} style={{ height: "250svh" }} data-bg="#080706" aria-labelledby="h-birthday">
      <div className={`${s.stage} ${s.hero}`}>
        <div className={s.bgStill} style={{ backgroundImage: `url(${stills.candleDark})`, opacity: 0.85 }} aria-hidden="true" />
        <div className="veil-soft" />
        {tier !== "lite" && !reduced && <GoldParticles count={tier === "high" ? 900 : 350} />}
        <div className={s.center}>
          <div className={s.heroText}>
            <h1 id="h-birthday" ref={en} className={`display-en ${s.heroEn}`} style={{ transform: "rotateX(14deg)" }}>{copy.s01.en.text.replace(" HAS", "\nHAS").split("\n").map((l, i) => <span key={i} style={{ display: "block" }}>{l}</span>)}</h1>
            <p ref={ko} className={`headline-ko ${s.heroKo}`}>{copy.s01.ko1.text} <b>{copy.s01.ko2.text}</b></p>
          </div>
        </div>
        <div className={s.heroHint} aria-hidden="true"><span className="caption">Scroll</span><i /></div>
        <span className={s.chap}>01 / 13 · SKIN HAS A BIRTHDAY</span>
      </div>
    </section>
  );
}
