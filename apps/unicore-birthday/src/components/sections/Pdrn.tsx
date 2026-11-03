"use client";
import { useRef, useState } from "react";
import { copy } from "@/data/copy";
import { pdrnGenerations, purityClaim } from "@/data/ingredients";
import { detail } from "@/data/images";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import Reveal from "@/components/Reveal";
import s from "./sections.module.css";

/** PDRN — 인트로(골드 버블 배경) + 세대 비교(상세페이지 실제 구체 이미지, 아이보리 배경) */
export default function Pdrn() {
  const pin = useRef<HTMLElement>(null);
  const [focus, setFocus] = useState(0);
  useSectionProgress(pin, (p) => setFocus(p < 0.33 ? 0 : p < 0.63 ? 1 : 2));
  return (
    <>
      <section className="section" data-bg="#11291D" aria-labelledby="h-pdrn-intro" style={{ position: "relative", overflow: "hidden", background: "#0b1a12" }}>
        <div className={s.bgStill} style={{ backgroundImage: `url(${detail.goldBubbles})`, opacity: 0.75, maskImage: "linear-gradient(180deg, transparent, #000 25%, #000 85%, transparent)", WebkitMaskImage: "linear-gradient(180deg, transparent, #000 25%, #000 85%, transparent)" }} aria-hidden="true" />
        <div className="veil-soft" />
        <div className={`section-inner ${s.flow}`} style={{ position: "relative" }}>
          <div className={s.grid2}>
            <div className={s.stack}>
              <Reveal as="p" mode="words" className="body-ko" style={undefined}>{copy.s07.q1.text}</Reveal>
              <Reveal as="h2" mode="weight" className={`headline-ko ${s.h2}`} id="h-pdrn-intro"><b>{copy.s07.a1.text}</b> {copy.s07.a2.text}</Reveal>
            </div>
            <div className={s.stack}>
              <Reveal as="p" mode="weight" className={`headline-ko ${s.h3}`}><b>{copy.s07.h1.text}</b></Reveal>
              <p className="body-ko">{copy.s07.h2.text} <b style={{ color: "var(--ivory)", fontWeight: 500 }}>{copy.s07.h3.text}</b></p>
              <p className="footnote">{purityClaim.text} — 원료 순도 표기는 원료사 자료 기준이며, 제품 처방 근거는 검토 중입니다.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pdrn" ref={pin} className={s.pin} style={{ height: "300svh" }} data-bg="#F4EFE7" aria-labelledby="h-pdrn">
        <div className={`${s.stage} ${s.light}`} style={{ background: "linear-gradient(180deg, #fbfaf7, #efe9df)" }}>
          <div className={s.pdrnHead}>
            <h2 id="h-pdrn" className={`headline-ko ${s.h3}`} style={{ color: "#1a120c" }}>{copy.s07.cmp1.text} <b>{copy.s07.cmp2.text}</b></h2>
            <p className="body-ko" style={{ margin: "0 auto", textAlign: "center", color: "#5a4a3a" }}>{copy.s07.cmpSub.text}</p>
          </div>
          <ol className={s.pdrnBalls} aria-label="PDRN 세대 비교">
            {pdrnGenerations.map((g, i) => (
              <li key={g.gen} className={`${s.pdrnBall} ${focus === i ? s.pdrnBallOn : ""}`}>
                <figure>
                  <img src={g.image} alt={`${g.name} 이미지`} loading="lazy" />
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
