"use client";
import { useRef } from "react";
import { copy } from "@/data/copy";
import { detail } from "@/data/images";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import ScrubVideo from "@/features/video/ScrubVideo";
import s from "./sections.module.css";

/** 더 마스터피스 — 선물상자 개봉 영상(실제 제품, 텍스트 없음)을 스크롤로 스크럽, 폴백은 상세페이지 박스 사진 */
export default function Masterpiece() {
  const pin = useRef<HTMLElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const progress = useSectionProgress(pin, (p) => {
    if (top.current) { top.current.style.opacity = String(Math.min(1, p / 0.2)); top.current.style.transform = `translateY(${(1 - Math.min(1, p / 0.2)) * 20}px)`; }
    if (bottom.current) { const q = Math.max(0, (p - 0.6) / 0.25); bottom.current.style.opacity = String(Math.min(1, q)); bottom.current.style.transform = `translateY(${(1 - Math.min(1, q)) * 20}px)`; }
  });
  return (
    <section id="masterpiece" ref={pin} className={s.pin} style={{ height: "300svh" }} data-bg="#080706" aria-labelledby="h-mp">
      <div className={s.stage} style={{ background: "#050403" }}>
        <ScrubVideo src="/media/product/jar_reveal_720.mp4" poster="/media/product/jar_reveal_poster.webp" fallback={detail.masterpieceBox} progressRef={progress} className={s.mpVideo} />
        <div className={s.mpVeil} aria-hidden="true" />
        <div ref={top} className={s.mpTitle} style={{ opacity: 0 }}>
          <span className="eyebrow">{copy.s05.eyebrow.text}</span>
          <h2 id="h-mp" className={`headline-ko ${s.mpH}`} style={{ fontWeight: 300 }}>{copy.s05.h.text}</h2>
          <span className={s.mpEn}>{copy.s05.en.text}</span>
        </div>
        <div ref={bottom} className={s.mpBottom} style={{ opacity: 0 }}>
          <p style={{ fontSize: "clamp(13px,1.1vw,15px)", color: "var(--gold)" }}>{copy.s05.caption.text}</p>
          <p className="headline-ko" style={{ color: "var(--ivory)", fontSize: "clamp(16px,1.8vw,24px)" }}>{copy.s05.line1.text} <b>{copy.s05.line2.text}</b></p>
        </div>
        <span className={s.chap}>05 / 13 · THE MASTERPIECE</span>
      </div>
    </section>
  );
}
