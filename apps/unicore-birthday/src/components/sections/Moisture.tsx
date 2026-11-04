"use client";
import { clips, detail } from "@/data/images";
import BgVideo from "@/features/video/BgVideo";
import Reveal from "@/components/Reveal";
import s from "./sections.module.css";
import { useDict } from "@/i18n/context";

/** 시카 카밍 + 우레아·세라마이드 — 상세페이지 '열린 용기와 크림' 비주얼 */
export default function Moisture() {
  const t = useDict();
  const cica = t.ingredientsList.find((i) => i.id === "cica");
  return (
    <section id="moisture" className="section" data-bg="#11291D" aria-labelledby="h-moist" style={{ position: "relative", overflow: "hidden", background: "#0f1a14" }}>
      <BgVideo src={clips.cicaLeaves.src} poster={clips.cicaLeaves.poster} fallback={detail.jarOpenCream} opacity={0.9} />
      <div className="veil" />
      <div className={`section-inner ${s.flow}`} style={{ position: "relative" }}>
        <div className={s.grid2}>
          <div className={s.stack}>
            <Reveal as="p" mode="words" className="eyebrow">{t.copy.s09.cica1}</Reveal>
            <Reveal as="h2" mode="weight" className={`headline-ko ${s.h2}`} id="h-moist"><b>{t.copy.s09.cica2}</b></Reveal>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
              {cica?.sub?.map((x) => (
                <li key={x.name} style={{ display: "grid", gap: 2, paddingLeft: 14, borderLeft: "1px solid var(--line)" }}>
                  <b style={{ color: "var(--gold-metal)", fontWeight: 500 }}>{x.name}</b>
                  <span className="body-ko">{x.desc}</span>
                </li>
              ))}
            </ul>
            <p className="body-ko">{t.copy.s09.cicaBridge1} <b style={{ color: "var(--ivory)", fontWeight: 500 }}>{t.copy.s09.cicaBridge2}</b></p>
          </div>
          <div className={s.stack}>
            <figure className={s.moistFig}><img src={detail.ingCica} alt={t.ui.moistureAlt} loading="lazy" decoding="async" width={476} height={444} /></figure>
            <Reveal as="h3" mode="weight" className={`headline-ko ${s.h3}`}><b>{t.copy.s09.h}</b></Reveal>
            <p className="body-ko">{t.copy.s09.l1} {t.copy.s09.l2}</p>
            <p className={`headline-ko ${s.lead}`}><b>{t.copy.s09.l3}</b></p>
          </div>
        </div>
      </div>
    </section>
  );
}
