"use client";
import { useRef } from "react";
import dynamic from "next/dynamic";
import { copy } from "@/data/copy";
import { product } from "@/data/product";
import { filmSegments, stills } from "@/data/videos";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import { useQualityTier, useReducedMotion } from "@/lib/env";
import FilmScrub from "@/features/video/FilmScrub";
import s from "./sections.module.css";

const GoldParticles = dynamic(() => import("@/features/scenes/GoldParticles"), { ssr: false });

export default function Final() {
  const pin = useRef<HTMLElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const tier = useQualityTier();
  const reduced = useReducedMotion();
  const progress = useSectionProgress(pin, (p) => {
    const el = stack.current; if (!el) return;
    const q = Math.min(1, p / 0.45);
    el.style.opacity = String(q); el.style.transform = `translateY(${(1 - q) * 30}px)`;
  });
  const purchase = product.urls.purchase || "#how-to-use";
  return (
    <section id="rebirth" ref={pin} className={s.pin} style={{ height: "200svh" }} data-bg="#080706" aria-labelledby="h-final">
      <div className={s.stage}>
        <div className="media-bg">
          <FilmScrub segment={filmSegments.ending} progressRef={progress} poster={stills.jarCandleClean} />
        </div>
        {/* 영상 내 용기 라벨 렌더 오류(UNIECORE) 구간 마스킹 */}
        <div className={s.labelMask} aria-hidden="true" />
        <div className="veil" />
        {tier !== "lite" && !reduced && <GoldParticles count={tier === "high" ? 500 : 200} drift={-1} />}
        <div className={s.center}>
          <div ref={stack} className={s.finalStack} style={{ opacity: 0 }}>
            <p className={`headline-ko ${s.finalKo}`}>{copy.s12.ko.text}</p>
            <h2 id="h-final" className={`display-en ${s.finalEn}`}>{copy.s12.en.text}</h2>
            <span className="caption">{copy.s12.name.text}</span>
            <div className={s.ctas}>
              <a className="btn btn-primary" href={purchase} target={product.urls.purchase ? "_blank" : undefined} rel="noopener">{copy.s12.cta1.text}</a>
              <a className="btn btn-ghost" href="#how-to-use">{copy.s12.cta2.text}</a>
              <a className="btn btn-ghost" href={product.urls.brand} target="_blank" rel="noopener">{copy.s12.cta3.text}</a>
            </div>
            {!product.urls.purchase && <p className="footnote" style={{ textAlign: "center" }}>구매 페이지 URL 확정 전 — 임시로 사용법 섹션으로 연결됩니다.</p>}
          </div>
        </div>
        <span className={s.chap}>12 / 13 · YOUR FIRST BIRTHDAY</span>
      </div>
    </section>
  );
}
