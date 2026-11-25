"use client";
import { useRef } from "react";
import { detail, boxOpen } from "@/data/images";
import { useDict } from "@/i18n/context";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import ScrubVideo from "@/features/video/ScrubVideo";
import s from "./sections.module.css";

/** 더 마스터피스 — 선물상자 속 제품 영상(사용자 제공 261104, 실제 제품·텍스트 없음·무음)을 스크롤로 스크럽, 폴백은 상세페이지 박스 사진 */
export default function Masterpiece() {
  const t = useDict();
  const pin = useRef<HTMLElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const progress = useSectionProgress(pin, (p) => {
    if (top.current) { top.current.style.opacity = String(Math.min(1, p / 0.2)); top.current.style.transform = `translateY(${(1 - Math.min(1, p / 0.2)) * 20}px)`; }
    if (bottom.current) { const q = Math.max(0, (p - 0.6) / 0.25); bottom.current.style.opacity = String(Math.min(1, q)); bottom.current.style.transform = `translateY(${(1 - Math.min(1, q)) * 20}px)`; }
  });
  return (
    <section id="masterpiece" ref={pin} className={s.pin} style={{ height: "300svh" }} data-bg="#080706" aria-labelledby="h-mp">
      <div className={s.stage} style={{ background: "#efece6" }}>
        <ScrubVideo src={boxOpen.src} poster={boxOpen.poster} fallback={detail.masterpieceBox} progressRef={progress} className={s.mpVideo} />
        <div className={s.mpVeil} aria-hidden="true" />
        <div ref={top} className={s.mpTitle} style={{ opacity: 0 }}>
          <span className="eyebrow">{t.copy.s05.eyebrow}</span>
          <h2 id="h-mp" className={`headline-ko ${s.mpH}`} style={{ fontWeight: 300 }}>{t.copy.s05.h}</h2>
          <span className={s.mpEn}>{t.copy.s05.en}</span>
        </div>
        <div ref={bottom} className={s.mpBottom} style={{ opacity: 0 }}>
          <p className={s.mpCap} style={{ fontSize: "clamp(13px,1.1vw,15px)" }}>{t.copy.s05.caption}</p>
          <p className="headline-ko" style={{ fontSize: "clamp(16px,1.8vw,24px)" }}>{t.copy.s05.line1} <b>{t.copy.s05.line2}</b></p>
        </div>
        <span className={`${s.chap} ${s.mpChap}`}>05 / 13 · THE MASTERPIECE</span>
      </div>
    </section>
  );
}
