"use client";
import { useRef } from "react";
import { copy } from "@/data/copy";
import { filmSegments, stills } from "@/data/videos";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import FilmScrub from "@/features/video/FilmScrub";
import s from "./sections.module.css";

/** 선물상자 개봉 — 시네마틱 필름 18.5~26.0초 구간을 스크롤로 스크럽 */
export default function Masterpiece() {
  const pin = useRef<HTMLElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const progress = useSectionProgress(pin, (p) => {
    if (top.current) { top.current.style.opacity = String(Math.min(1, p / 0.2)); top.current.style.transform = `translateY(${(1 - Math.min(1, p / 0.2)) * 20}px)`; }
    if (bottom.current) { const q = Math.max(0, (p - 0.6) / 0.25); bottom.current.style.opacity = String(Math.min(1, q)); bottom.current.style.transform = `translateY(${(1 - Math.min(1, q)) * 20}px)`; }
  });
  return (
    <section id="masterpiece" ref={pin} className={s.pin} style={{ height: "300svh" }} data-bg="#F1EFE9" aria-labelledby="h-mp">
      <div className={s.stage} style={{ background: "#f1efe9" }}>
        <FilmScrub segment={filmSegments.masterpiece} progressRef={progress} poster={stills.boxOpening} className={s.mpVideo} />
        <div ref={top} className={s.mpTitle} style={{ opacity: 0 }}>
          <span className="eyebrow">{copy.s05.eyebrow.text}</span>
          <h2 id="h-mp" className={`headline-ko ${s.mpH}`} style={{ fontWeight: 300 }}>{copy.s05.h.text}</h2>
          <span className={s.mpEn}>{copy.s05.en.text}</span>
        </div>
        <div ref={bottom} className={s.mpBottom} style={{ opacity: 0 }}>
          <p style={{ fontSize: "clamp(13px,1.1vw,15px)", color: "#6b5433" }}>{copy.s05.caption.text}</p>
          <p className="headline-ko" style={{ color: "#1a120c", fontSize: "clamp(16px,1.8vw,24px)" }}>{copy.s05.line1.text} <b>{copy.s05.line2.text}</b></p>
        </div>
        <span className={s.chap} style={{ color: "#8f6b3a" }}>05 / 13 · THE MASTERPIECE</span>
      </div>
    </section>
  );
}
