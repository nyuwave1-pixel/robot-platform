"use client";
import { copy } from "@/data/copy";
import { howto } from "@/data/howto";
import { product } from "@/data/product";
import Reveal from "@/components/Reveal";
import s from "./sections.module.css";

export default function HowToUse() {
  return (
    <section id="how-to-use" className="section" data-bg="#080706" aria-labelledby="h-how" style={{ background: "var(--bg-midnight)" }}>
      <div className={`section-inner ${s.flow}`}>
        <div className={s.grid2} style={{ alignItems: "start" }}>
          <div className={s.stack}>
            <Reveal as="h2" mode="chars" className="display-en" id="h-how" style={undefined}>{copy.s11.h.text}</Reveal>
            <p className="body-ko">{copy.s11.sub.text}</p>
            <img src={product.images.openBox} alt={`${product.brand} ${product.name} 패키지와 용기`} loading="lazy" width={1662} height={946} style={{ borderRadius: 6, opacity: 0.9, maxWidth: 520 }} />
          </div>
          <ol className={s.steps} style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {howto.steps.map((st) => (
              <li key={st.step} className={s.step}>
                <b>{st.step}</b>
                <h4>{st.area}</h4>
                <p>{st.line1}<br />{st.line2}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
