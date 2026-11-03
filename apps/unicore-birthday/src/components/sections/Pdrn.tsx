"use client";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { copy } from "@/data/copy";
import { pdrnGenerations, purityClaim } from "@/data/ingredients";
import { stills } from "@/data/videos";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import { hasWebGL, useReducedMotion } from "@/lib/env";
import Reveal from "@/components/Reveal";
import s from "./sections.module.css";

const PdrnSpheres = dynamic(() => import("@/features/scenes/PdrnSpheres"), { ssr: false });

export default function Pdrn() {
  const pin = useRef<HTMLElement>(null);
  const [focus, setFocus] = useState(0);
  const reduced = useReducedMotion();
  const progress = useSectionProgress(pin, (p) => setFocus(p < 0.33 ? 0 : p < 0.63 ? 1 : 2));
  const webgl = typeof window !== "undefined" ? hasWebGL() : true;
  return (
    <>
      <section className="section" data-bg="#11291D" aria-labelledby="h-pdrn-intro" style={{ background: "linear-gradient(180deg, var(--green-deep), var(--bg-midnight))" }}>
        <div className={`section-inner ${s.flow}`}>
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

      <section id="pdrn" ref={pin} className={s.pin} style={{ height: "300svh" }} data-bg="#080706" aria-labelledby="h-pdrn">
        <div className={s.stage} style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(17,41,29,.95), var(--bg-midnight) 70%)" }}>
          <div className={s.bgStill} style={{ backgroundImage: `url(${stills.ginseng})`, opacity: 0.35, maskImage: "linear-gradient(180deg, transparent, #000 40%, #000 70%, transparent)", WebkitMaskImage: "linear-gradient(180deg, transparent, #000 40%, #000 70%, transparent)" }} aria-hidden="true" />
          {webgl && !reduced && <PdrnSpheres progressRef={progress} />}
          <div style={{ position: "absolute", left: 0, right: 0, top: "clamp(48px, 9vh, 100px)", textAlign: "center", zIndex: 3, display: "grid", gap: 8, padding: "0 20px" }}>
            <h2 id="h-pdrn" className={`headline-ko ${s.h3}`}>{copy.s07.cmp1.text} <b>{copy.s07.cmp2.text}</b></h2>
            <p className="body-ko" style={{ margin: "0 auto", textAlign: "center" }}>{copy.s07.cmpSub.text}</p>
          </div>
          <ol className={s.pdrnLabels} aria-label="PDRN 세대 비교">
            {pdrnGenerations.map((g, i) => (
              <li key={g.gen} className={`${s.pdrnLabel} ${focus === i ? s.pdrnOn : ""}`}>
                <b>{g.name}</b>
                <span>{g.line1} {g.line2}</span>
              </li>
            ))}
          </ol>
          <span className={s.chap}>07 / 13 · PDRN TECHNOLOGY</span>
        </div>
      </section>
    </>
  );
}
