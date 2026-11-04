"use client";
import { detail } from "@/data/images";
import Reveal from "@/components/Reveal";
import BgVideo from "@/features/video/BgVideo";
import Tagline from "@/components/Tagline";
import { clips } from "@/data/images";
import NobelHero from "./NobelHero";
import PeptideHero from "./PeptideHero";
import s from "./sections.module.css";
import { useDict } from "@/i18n/context";

/** 재건(EGF·4GF) + 표정주름(펩타이드) — 상세페이지 실제 비주얼(노벨 메달, 골드 스피어, 분자 구조) */
export default function SkinScience() {
  const t = useDict();
  return (
    <section id="science" className="section" data-bg="#17110F" aria-labelledby="h-sci" style={{ background: "var(--bg-obsidian)", position: "relative", overflow: "hidden" }}>
      <div className={`section-inner ${s.flow}`}>
        <div className={s.stack} style={{ marginBottom: "clamp(32px, 5vh, 56px)" }}>
          <Tagline />
          <Reveal as="p" mode="words" className="eyebrow">{t.copy.s04.bridge1}</Reveal>
          <Reveal as="h2" mode="weight" className={`headline-ko ${s.h2}`} id="h-sci"><b>{t.copy.s04.bridge2}</b></Reveal>
        </div>
        <NobelHero />
        <div className={s.grid2} style={{ marginTop: "clamp(40px, 7vh, 96px)" }}>
          <figure className={s.sciFig} style={{ position: "relative" }}>
            <BgVideo src={clips.goldenRing.src} poster={clips.goldenRing.poster} fallback={detail.goldSphere} />
            <figcaption>THE GOLDEN FORMULA · EGF · IGF · FGF · KGF</figcaption>
          </figure>
          <div className={s.stack}>
            <p className="display-en" style={{ fontSize: "clamp(26px, 3.4vw, 48px)", fontWeight: 400, letterSpacing: ".04em" }}>{t.copy.s08.gf}</p>
            <p className="body-ko">{t.copy.s08.gfDesc1} {t.copy.s08.gfDesc2} <b style={{ color: "var(--ivory)", fontWeight: 500 }}>{t.copy.s08.gfDesc3}</b></p>
          </div>
        </div>

        <div style={{ marginTop: "clamp(40px, 7vh, 96px)" }}>
          <PeptideHero />
        </div>
      </div>
    </section>
  );
}
