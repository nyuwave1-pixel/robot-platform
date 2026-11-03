"use client";
import { useRef } from "react";
import { copy } from "@/data/copy";
import { keyIngredients } from "@/data/ingredients";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import Reveal from "@/components/Reveal";
import s from "./sections.module.css";

const LAYERS = [
  { k: "각질층", d: "표면을 정돈하고 수분 증발을 막는 층", bg: "linear-gradient(180deg, rgba(244,239,231,.14), rgba(244,239,231,.04))" },
  { k: "표피", d: "약 14일 단위로 새 세포가 차오르는 층", bg: "linear-gradient(180deg, rgba(229,197,141,.16), rgba(229,197,141,.04))" },
  { k: "진피", d: "탄력과 볼륨을 받치는 층", bg: "linear-gradient(180deg, rgba(198,161,106,.16), rgba(143,107,58,.05))" },
];

export default function SkinScience() {
  const wrap = useRef<HTMLElement>(null);
  const layers = useRef<HTMLDivElement>(null);
  const pep = keyIngredients.find((i) => i.id === "peptide");
  useSectionProgress(wrap, (p) => {
    const el = layers.current; if (!el) return;
    const q = Math.min(1, Math.max(0, (p - 0.1) / 0.6));
    Array.from(el.children).forEach((c, i) => {
      (c as HTMLElement).style.transform = `rotateX(58deg) translateZ(${(1 - i) * (20 + q * 90)}px) translateY(${(i - 1) * 8}px)`;
    });
  });
  return (
    <section id="science" ref={wrap} className="section" data-bg="#17110F" aria-labelledby="h-sci" style={{ background: "var(--bg-obsidian)" }}>
      <div className={`section-inner ${s.flow}`}>
        <div className={s.grid2}>
          <div className={s.stack}>
            <Reveal as="p" mode="words" className="eyebrow">{copy.s04.bridge1.text}</Reveal>
            <Reveal as="h2" mode="weight" className={`headline-ko ${s.h2}`} id="h-sci"><b>{copy.s04.bridge2.text}</b></Reveal>
            <p className="body-ko">{copy.s08.nobel1.text}</p>
            <p className={`headline-ko ${s.lead}`}><b>{copy.s08.nobel2.text}</b></p>
            <p className="display-en" style={{ fontSize: "clamp(26px, 3.4vw, 48px)", fontWeight: 400, letterSpacing: ".04em" }}>{copy.s08.gf.text}</p>
            <p className="body-ko">{copy.s08.gfDesc1.text} {copy.s08.gfDesc2.text} <b style={{ color: "var(--ivory)", fontWeight: 500 }}>{copy.s08.gfDesc3.text}</b></p>
          </div>
          <div className={s.stack}>
            <span className={s.conceptTag}>{copy.s08.conceptLabel.text}</span>
            <div ref={layers} className={s.layers} aria-hidden="true">
              {LAYERS.map((l) => (
                <div key={l.k} className={s.layer} style={{ background: l.bg, transform: "rotateX(58deg)" }}><b>{l.k}</b><span>{l.d}</span></div>
              ))}
            </div>
            <p className="footnote">피부 구조를 설명하기 위한 교육적 개념 시각화이며, 성분의 침투 경로나 작용 부위를 나타내지 않습니다.</p>
          </div>
        </div>

        <div className={s.grid2} style={{ marginTop: "clamp(80px, 12vh, 160px)" }}>
          <div className={s.stack}>
            <Reveal as="p" mode="words" className="body-ko">{copy.s08.exp1.text} {copy.s08.exp2.text}</Reveal>
            <Reveal as="h3" mode="weight" className={`headline-ko ${s.h3}`}><b>{copy.s08.exp3.text}</b></Reveal>
          </div>
          <div className={s.stack}>
            <p className={`headline-ko ${s.h3}`} style={{ fontWeight: 400 }}>{copy.s08.pep.text}</p>
            <p className="body-ko">{copy.s08.pepDesc1.text} {copy.s08.pepDesc2.text} <b style={{ color: "var(--ivory)", fontWeight: 500 }}>{copy.s08.pepDesc3.text}</b></p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {pep?.sub?.map((x) => <span key={x.name} className={s.conceptTag} style={{ color: "var(--gold-metal)" }}>{x.name}</span>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
