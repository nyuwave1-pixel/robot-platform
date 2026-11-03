"use client";
import { copy } from "@/data/copy";
import { keyIngredients } from "@/data/ingredients";
import { stills } from "@/data/videos";
import Reveal from "@/components/Reveal";
import s from "./sections.module.css";

export default function Moisture() {
  const cica = keyIngredients.find((i) => i.id === "cica");
  return (
    <section id="moisture" className="section" data-bg="#11291D" aria-labelledby="h-moist" style={{ position: "relative", overflow: "hidden" }}>
      <div className={s.bgStill} style={{ backgroundImage: `url(${stills.creamClean})`, opacity: 0.4, maskImage: "linear-gradient(180deg, transparent, #000 30%, #000 80%, transparent)", WebkitMaskImage: "linear-gradient(180deg, transparent, #000 30%, #000 80%, transparent)" }} aria-hidden="true" />
      <div className={`section-inner ${s.flow}`} style={{ position: "relative" }}>
        <div className={s.grid2}>
          <div className={s.stack}>
            <Reveal as="p" mode="words" className="eyebrow">{copy.s09.cica1.text}</Reveal>
            <Reveal as="h2" mode="weight" className={`headline-ko ${s.h2}`} id="h-moist"><b>{copy.s09.cica2.text}</b></Reveal>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
              {cica?.sub?.map((x) => (
                <li key={x.name} style={{ display: "grid", gap: 2, paddingLeft: 14, borderLeft: "1px solid var(--line)" }}>
                  <b style={{ color: "var(--gold-metal)", fontWeight: 500 }}>{x.name}</b>
                  <span className="body-ko">{x.desc}</span>
                </li>
              ))}
            </ul>
            <p className="body-ko">{copy.s09.cicaBridge1.text} <b style={{ color: "var(--ivory)", fontWeight: 500 }}>{copy.s09.cicaBridge2.text}</b></p>
          </div>
          <div className={s.stack}>
            <Reveal as="h3" mode="weight" className={`headline-ko ${s.h3}`}><b>{copy.s09.h.text}</b></Reveal>
            <p className="body-ko">{copy.s09.l1.text} {copy.s09.l2.text}</p>
            <p className={`headline-ko ${s.lead}`}><b>{copy.s09.l3.text}</b></p>
          </div>
        </div>
      </div>
    </section>
  );
}
