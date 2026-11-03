"use client";
import { useRef, useState } from "react";
import { copy } from "@/data/copy";
import { filmSegments, stills } from "@/data/videos";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import FilmScrub from "@/features/video/FilmScrub";
import Reveal from "@/components/Reveal";
import s from "./sections.module.css";

export default function TwentyEight() {
  const pin = useRef<HTMLElement>(null);
  const num = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);
  const progress = useSectionProgress(pin, (p) => {
    const n = num.current; if (!n) return;
    const rotY = p * 180;
    const scale = 0.7 + Math.min(p, 0.5) * 0.7;
    n.style.transform = `perspective(1200px) rotateY(${rotY}deg) scale(${scale})`;
    n.style.opacity = String(p > 0.9 ? 1 - (p - 0.9) / 0.1 : 1);
    setPhase(p < 0.33 ? 0 : p < 0.66 ? 1 : 2);
  });
  return (
    <section id="28days" ref={pin} className={s.pin} style={{ height: "300svh" }} data-bg="#17110F" aria-labelledby="h-28">
      <div className={s.stage}>
        <div className="media-bg">
          <FilmScrub segment={filmSegments.twentyEight} progressRef={progress} poster={stills.creamClean} />
        </div>
        <div className="veil-soft" />
        <div className={s.center}>
          <div style={{ display: "grid", gap: "clamp(10px, 2vh, 24px)", justifyItems: "center" }}>
            <h2 id="h-28" className="sr-only">{copy.s02.total.text}</h2>
            <div ref={num} className={`numeral ${s.n28}`} aria-hidden="true">28</div>
            <div className={s.days} aria-live="polite">
              <div className={`${s.day} ${phase >= 0 ? s.dayOn : ""}`}><b>{copy.s02.days[0].text}</b><span>{copy.s02.d1.text}</span></div>
              <div className={`${s.day} ${phase >= 1 ? s.dayOn : ""}`}><b>{copy.s02.days[1].text}</b><span>{copy.s02.d2.text}</span></div>
              <div className={`${s.day} ${phase >= 2 ? s.dayOn : ""}`}><b>{copy.s02.days[2].text}</b><span>{copy.s02.total.text}</span></div>
            </div>
            <Reveal mode="weight" as="p" className={`headline-ko ${s.lead}`}>{copy.s02.line1.text} <b>{copy.s02.line2.text}</b></Reveal>
            <p className="footnote" style={{ textAlign: "center" }}>{copy.s02.footnote.text}</p>
          </div>
        </div>
        <span className={s.chap}>02 / 13 · THE 28 DAYS</span>
      </div>
    </section>
  );
}
