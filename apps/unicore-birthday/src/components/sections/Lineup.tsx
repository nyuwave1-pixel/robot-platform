"use client";
import { detail } from "@/data/images";
import s from "./sections.module.css";
import { useDict } from "@/i18n/context";

export default function Lineup() {
  const t = useDict();
  const lineup = t.lineupView;
  return (
    <section id="lineup" className={`section ${s.lineup}`} data-bg="#F4EFE7" aria-labelledby="h-lineup">
      <div className={`section-inner ${s.flow}`}>
        <span className="eyebrow">{t.copy.s13.en}</span>
        <h2 id="h-lineup" className={s.h2} style={{ fontWeight: 300, color: "#1a120c", marginTop: 10 }}>{t.copy.s13.h1} <b style={{ fontWeight: 600 }}>{t.copy.s13.h2}</b></h2>
        <div className={s.routine}>
          <span>☀ {t.lineup.day} — STEP 0{lineup.dayRange[0]} → 0{lineup.dayRange[1]}</span>
          <span>☾ {t.lineup.night} — STEP 0{lineup.nightRange[0]} → 0{lineup.nightRange[1]}</span>
        </div>
        {/* 가이드 이미지는 한국어 텍스트가 인쇄되어 있어 한국어 페이지에서만 노출 */}
        {t.locale === "ko" && <img className={s.lineupGuide} src={detail.skincareGuide} alt={t.ui.lineupAlt} loading="lazy" width={1777} height={1283} />}
        <ol className={s.lineupGrid} style={{ listStyle: "none", padding: 0 }}>
          {lineup.steps.map((st) => (
            <li key={st.step} className={`${s.lineupItem} ${st.highlight ? s.lineupHi : ""}`}>
              <b>{st.step}</b>
              <i>[{st.tag}]</i>
              <span>{st.name}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
