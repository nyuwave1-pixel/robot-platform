"use client";
import { useRef } from "react";
import dynamic from "next/dynamic";
import { copy } from "@/data/copy";
import { product } from "@/data/product";
import { detail } from "@/data/images";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import { useQualityTier, useReducedMotion } from "@/lib/env";
import s from "./sections.module.css";

const GoldParticles = dynamic(() => import("@/features/scenes/GoldParticles"), { ssr: false });

/** 피날레 — 상세페이지 '1st Birthday' 케이크 비주얼 + CTA */
export default function Final() {
  const pin = useRef<HTMLElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const bg = useRef<HTMLDivElement>(null);
  const tier = useQualityTier();
  const reduced = useReducedMotion();
  useSectionProgress(pin, (p) => {
    const el = stack.current; if (!el) return;
    const q = Math.min(1, p / 0.45);
    el.style.opacity = String(q); el.style.transform = `translateY(${(1 - q) * 30}px)`;
    if (bg.current) bg.current.style.transform = `scale(${1.15 - p * 0.12})`;
  });
  const purchase = product.urls.purchase || "#how-to-use";
  return (
    <section id="rebirth" ref={pin} className={s.pin} style={{ height: "200svh" }} data-bg="#080706" aria-labelledby="h-final">
      <div className={s.stage}>
        <div ref={bg} className={s.bgStill} style={{ backgroundImage: `url(${detail.cake})`, backgroundPosition: "center 30%", transform: "scale(1.15)" }} aria-hidden="true" />
        <div className="veil" />
        {tier !== "lite" && !reduced && <GoldParticles count={tier === "high" ? 500 : 200} drift={-1} />}
        <div className={s.center}>
          <div ref={stack} className={s.finalStack} style={{ opacity: 0 }}>
            <p className={`display-en ${s.finalEyebrow}`}>{copy.s12.en.text}</p>
            <h2 id="h-final" className={`headline-ko ${s.finalKoBig}`}>
              <span>{copy.s01.ko1.text}</span>
              <b>{copy.s01.ko2.text}</b>
            </h2>
            <p className={`headline-ko ${s.finalKo}`}>{copy.s12.ko.text}</p>
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
