"use client";
import { useRef, useState } from "react";
import { clips } from "@/data/images";
import BgVideo from "@/features/video/BgVideo";
import Tagline from "@/components/Tagline";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import Reveal from "@/components/Reveal";
import s from "./sections.module.css";
import { useDict, fmt } from "@/i18n/context";

/** PDRN — 인트로(골드 버블 배경) + 세대 비교(상세페이지 실제 구체 이미지, 아이보리 배경) */
export default function Pdrn() {
  const t = useDict();
  const pin = useRef<HTMLElement>(null);
  const [focus, setFocus] = useState(0);
  useSectionProgress(pin, (p) => setFocus(p < 0.33 ? 0 : p < 0.63 ? 1 : 2));
  return (
    <>
      <section className="section" data-bg="#11291D" aria-labelledby="h-pdrn-intro" style={{ position: "relative", overflow: "hidden", background: "#0b1a12" }}>
        <BgVideo src={clips.pdrnGinseng.src} poster={clips.pdrnGinseng.poster} opacity={0.7} />
        <div className="veil" />
        <div className={`section-inner ${s.flow}`} style={{ position: "relative" }}>
          <div className={s.grid2}>
            <div className={s.stack}>
              <Tagline />
              <Reveal as="p" mode="words" className="body-ko" style={undefined}>{t.copy.s07.q1}</Reveal>
              <Reveal as="h2" mode="weight" className={`headline-ko ${s.h2}`} id="h-pdrn-intro"><b>{t.copy.s07.a1}</b> {t.copy.s07.a2}</Reveal>
            </div>
            <div className={s.stack}>
              <Reveal as="p" mode="weight" className={`headline-ko ${s.h3}`}><b>{t.copy.s07.h1}</b></Reveal>
              <p className="body-ko">{t.copy.s07.h2} <b style={{ color: "var(--ivory)", fontWeight: 500 }}>{t.copy.s07.h3}</b></p>
              <p className="footnote">{t.pdrn.purity} — {t.pdrn.purityNote}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pdrn" ref={pin} className={s.pin} style={{ height: "300svh" }} data-bg="#F4EFE7" aria-labelledby="h-pdrn">
        <div className={`${s.stage} ${s.light}`} style={{ background: "linear-gradient(180deg, #fbfaf7, #efe9df)" }}>
          <div className={s.pdrnHead}>
            <h2 id="h-pdrn" className={`headline-ko ${s.h3}`} style={{ color: "#1a120c" }}>{t.copy.s07.cmp1} <b>{t.copy.s07.cmp2}</b></h2>
            <p className="body-ko" style={{ margin: "0 auto", textAlign: "center", color: "#5a4a3a" }}>{t.copy.s07.cmpSub}</p>
          </div>
          <ol className={s.pdrnBalls} aria-label={t.ui.pdrnCompare}>
            {t.pdrnList.map((g, i) => (
              <li key={g.gen} className={`${s.pdrnBall} ${focus === i ? s.pdrnBallOn : ""}`}>
                <figure>
                  <img src={g.image} alt={fmt(t.ui.pdrnImage, { name: g.name })} loading="lazy" decoding="async" width={500} height={480} />
                </figure>
                <b>{g.name}</b>
                <span>{g.line1} {g.line2}</span>
              </li>
            ))}
          </ol>
          <span className={s.chap} style={{ color: "#8f6b3a" }}>07 / 13 · PDRN TECHNOLOGY</span>
        </div>
      </section>
    </>
  );
}
