"use client";
import { copy } from "@/data/copy";
import { keyIngredients } from "@/data/ingredients";
import { detail } from "@/data/images";
import Reveal from "@/components/Reveal";
import BgVideo from "@/features/video/BgVideo";
import Tagline from "@/components/Tagline";
import { clips } from "@/data/images";
import NobelHero from "./NobelHero";
import PeptideHero from "./PeptideHero";
import s from "./sections.module.css";

/** 재건(EGF·4GF) + 표정주름(펩타이드) — 상세페이지 실제 비주얼(노벨 메달, 골드 스피어, 분자 구조) */
export default function SkinScience() {
  const pep = keyIngredients.find((i) => i.id === "peptide");
  return (
    <section id="science" className="section" data-bg="#17110F" aria-labelledby="h-sci" style={{ background: "var(--bg-obsidian)", position: "relative", overflow: "hidden" }}>
      <div className={`section-inner ${s.flow}`}>
        <div className={s.stack} style={{ marginBottom: "clamp(32px, 5vh, 56px)" }}>
          <Tagline />
          <Reveal as="p" mode="words" className="eyebrow">{copy.s04.bridge1.text}</Reveal>
          <Reveal as="h2" mode="weight" className={`headline-ko ${s.h2}`} id="h-sci"><b>{copy.s04.bridge2.text}</b></Reveal>
        </div>
        <NobelHero />
        <div className={s.grid2} style={{ marginTop: "clamp(40px, 7vh, 96px)" }}>
          <figure className={s.sciFig} style={{ position: "relative" }}>
            <BgVideo src={clips.goldenRing.src} poster={clips.goldenRing.poster} fallback={detail.goldSphere} />
            <figcaption>THE GOLDEN FORMULA · EGF · IGF · FGF · KGF</figcaption>
          </figure>
          <div className={s.stack}>
            <p className="display-en" style={{ fontSize: "clamp(26px, 3.4vw, 48px)", fontWeight: 400, letterSpacing: ".04em" }}>{copy.s08.gf.text}</p>
            <p className="body-ko">{copy.s08.gfDesc1.text} {copy.s08.gfDesc2.text} <b style={{ color: "var(--ivory)", fontWeight: 500 }}>{copy.s08.gfDesc3.text}</b></p>
          </div>
        </div>

        <div style={{ marginTop: "clamp(40px, 7vh, 96px)" }}>
          <PeptideHero />
        </div>
      </div>
    </section>
  );
}
