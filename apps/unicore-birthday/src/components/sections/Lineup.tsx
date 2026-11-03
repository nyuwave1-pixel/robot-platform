import { copy } from "@/data/copy";
import { lineup } from "@/data/howto";
import s from "./sections.module.css";

export default function Lineup() {
  return (
    <section id="lineup" className={`section ${s.lineup}`} data-bg="#F4EFE7" aria-labelledby="h-lineup">
      <div className={`section-inner ${s.flow}`}>
        <span className="eyebrow">{copy.s13.en.text}</span>
        <h2 id="h-lineup" className={s.h2} style={{ fontWeight: 300, color: "#1a120c", marginTop: 10 }}>{copy.s13.h1.text} <b style={{ fontWeight: 600 }}>{copy.s13.h2.text}</b></h2>
        <div className={s.routine}>
          <span>☀ DAY — STEP 0{lineup.dayRange[0]} → 0{lineup.dayRange[1]}</span>
          <span>☾ NIGHT — STEP 0{lineup.nightRange[0]} → 0{lineup.nightRange[1]}</span>
        </div>
        <ol className={s.lineupGrid} style={{ listStyle: "none", padding: 0 }}>
          {lineup.steps.map((st) => (
            <li key={st.step} className={`${s.lineupItem} ${"highlight" in st && st.highlight ? s.lineupHi : ""}`}>
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
