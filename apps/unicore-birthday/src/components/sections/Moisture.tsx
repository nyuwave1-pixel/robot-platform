"use client";
import Reveal from "@/components/Reveal";
import s from "./sections.module.css";
import { useDict } from "@/i18n/context";

/** 피부장벽 — 레시틴 2.5% · LipoBarrier Complex™ + 우레아·세라마이드 (2026-11-23 교육자료 8·19쪽 수정 반영) */
const LECITHIN_VISUAL = "/media/product/lecithin_barrier.webp";

export default function Moisture() {
  const t = useDict();
  const c = t.copy.s09;
  const points = [c.p1, c.p2, c.p3, c.p4];
  return (
    <section id="moisture" className={`section ${s.barrier}`} data-bg="#1A130E" aria-labelledby="h-moist">
      <div className={`section-inner ${s.flow}`} style={{ position: "relative" }}>
        <div className={s.grid2}>
          <div className={s.stack}>
            <Reveal as="p" mode="words" className="eyebrow">{c.eyebrow}</Reveal>
            <Reveal as="h2" mode="weight" className={`headline-ko ${s.barrierBig}`} id="h-moist"><b>{c.big}</b></Reveal>
            <p className={`body-ko ${s.barrierPair}`}>{c.pair}</p>
            <ul className={s.barrierList}>
              {points.map((x, i) => <li key={i} className={i === 3 ? s.barrierKey : undefined}>{x}</li>)}
            </ul>
            <p className={s.barrierCica}><b>+ {c.cicaLabel}</b> {c.cicaItems}</p>
          </div>
          <div className={s.stack}>
            <figure className={s.lecFig}><img src={LECITHIN_VISUAL} alt={t.ui.moistureAlt} loading="lazy" decoding="async" width={1000} height={600} /></figure>
            <Reveal as="h3" mode="weight" className={`headline-ko ${s.h3}`}><b>{c.h}</b></Reveal>
            <p className={`headline-ko ${s.lead}`}><b>{c.lead1}</b></p>
            <p className="body-ko" style={{ color: "var(--ivory)" }}>{c.lead2}</p>
            <p className="body-ko">{c.l1} {c.l2} <b style={{ color: "var(--gold-metal)", fontWeight: 500 }}>{c.l3}</b></p>
          </div>
        </div>
      </div>
    </section>
  );
}
