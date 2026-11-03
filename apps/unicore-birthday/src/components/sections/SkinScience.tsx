"use client";
import { copy } from "@/data/copy";
import { keyIngredients } from "@/data/ingredients";
import { detail } from "@/data/images";
import Reveal from "@/components/Reveal";
import s from "./sections.module.css";

/** 재건(EGF·4GF) + 표정주름(펩타이드) — 상세페이지 실제 비주얼(노벨 메달, 골드 스피어, 분자 구조) */
export default function SkinScience() {
  const pep = keyIngredients.find((i) => i.id === "peptide");
  return (
    <section id="science" className="section" data-bg="#17110F" aria-labelledby="h-sci" style={{ background: "var(--bg-obsidian)", position: "relative", overflow: "hidden" }}>
      <div className={`section-inner ${s.flow}`}>
        <div className={s.grid2}>
          <div className={s.stack}>
            <Reveal as="p" mode="words" className="eyebrow">{copy.s04.bridge1.text}</Reveal>
            <Reveal as="h2" mode="weight" className={`headline-ko ${s.h2}`} id="h-sci"><b>{copy.s04.bridge2.text}</b></Reveal>
            <figure className={`${s.sciBand} ${s.sciBandBig}`}>
              <img src={detail.nobelBand} alt="노벨 메달 부조" loading="lazy" />
              <figcaption>
                <span className="eyebrow" style={{ color: "var(--gold-metal)" }}>Nobel Prize Ingredient</span>
                <span>{copy.s08.nobel1.text}</span>
                <Reveal as="b" mode="weight" className={s.sciNobel}>{copy.s08.nobel2.text}</Reveal>
              </figcaption>
            </figure>
            <p className="display-en" style={{ fontSize: "clamp(26px, 3.4vw, 48px)", fontWeight: 400, letterSpacing: ".04em" }}>{copy.s08.gf.text}</p>
            <p className="body-ko">{copy.s08.gfDesc1.text} {copy.s08.gfDesc2.text} <b style={{ color: "var(--ivory)", fontWeight: 500 }}>{copy.s08.gfDesc3.text}</b></p>
          </div>
          <figure className={s.sciFig}>
            <img src={detail.goldSphere} alt="EGF·IGF·FGF·KGF 황금 성분 스피어" loading="lazy" />
            <figcaption>EGF · IGF · FGF · KGF</figcaption>
          </figure>
        </div>

        <div className={s.grid2} style={{ marginTop: "clamp(80px, 12vh, 160px)" }}>
          <div className={s.stack}>
            <Reveal as="p" mode="words" className="body-ko">{copy.s08.exp1.text} {copy.s08.exp2.text}</Reveal>
            <Reveal as="h3" mode="weight" className={`headline-ko ${s.h3}`}><b>{copy.s08.exp3.text}</b></Reveal>
            <div className={s.sciSkin} aria-hidden="true" style={{ backgroundImage: `url(${detail.skinCheek})` }} />
          </div>
          <div className={s.stack}>
            <p className={`headline-ko ${s.h3}`} style={{ fontWeight: 400 }}>{copy.s08.pep.text}</p>
            <p className="body-ko">{copy.s08.pepDesc1.text} {copy.s08.pepDesc2.text} <b style={{ color: "var(--ivory)", fontWeight: 500 }}>{copy.s08.pepDesc3.text}</b></p>
            <div className={s.sciCircles}>
              <figure><img src={detail.moleculeA} alt="" loading="lazy" /><figcaption>{pep?.sub?.[0]?.name}</figcaption></figure>
              <figure><img src={detail.moleculeB} alt="" loading="lazy" /><figcaption>{pep?.sub?.[1]?.name}</figcaption></figure>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
