"use client";
import { useRef } from "react";
import { copy } from "@/data/copy";
import { keyIngredients } from "@/data/ingredients";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import { useIsMobile } from "@/lib/env";
import s from "./sections.module.css";

const orb: Record<string, string> = {
  pdrn: "radial-gradient(circle at 35% 30%, #fff3d6, #C6A16A 45%, #5a3f20)",
  gf: "radial-gradient(circle at 35% 30%, #fff, #E5C58D 40%, #8F6B3A)",
  peptide: "radial-gradient(circle at 35% 30%, rgba(255,255,255,.9), rgba(244,239,231,.25) 45%, rgba(244,239,231,.05))",
  cica: "radial-gradient(circle at 35% 30%, #dff5e3, #7fb08a 45%, #11291D)",
};

/** 4대 성분 — 데스크톱: 수평 스크럽 4패널 / 모바일: 세로 카드 */
export default function Ingredients() {
  const pin = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const mobile = useIsMobile();
  useSectionProgress(pin, (p) => {
    const t = track.current; if (!t || mobile) return;
    const max = t.scrollWidth - t.clientWidth;
    t.style.transform = `translateX(${-p * max}px)`;
  });
  return (
    <section id="ingredients" ref={pin} className={s.pin} style={{ height: mobile ? "auto" : "400svh", background: "linear-gradient(180deg, var(--bg-obsidian), var(--green-deep))" }} data-bg="#11291D" aria-labelledby="h-ing">
      <div className={s.stage} style={mobile ? { position: "relative", height: "auto" } : undefined}>
        <div className={s.ingHead}>
          <span className="eyebrow">{copy.s06.eyebrow.text}</span>
          <h2 id="h-ing" className={`headline-ko ${s.h3}`}>{copy.s06.h1.text} <b>{copy.s06.h2.text}</b></h2>
        </div>
        <div ref={track} className={s.ingTrack} style={mobile ? undefined : { paddingLeft: "max(20px, 5vw)", paddingRight: "40vw" }}>
          {!mobile && <div style={{ flex: "0 0 32vw" }} aria-hidden="true" />}
          {keyIngredients.map((ing) => (
            <article key={ing.id} className={s.ingCard}>
              {ing.still && <div className={s.bgStill} style={{ backgroundImage: `url(${ing.still})` }} aria-hidden="true" />}
              <div className={s.ingOrb} style={{ background: orb[ing.id], boxShadow: `0 0 50px ${ing.color}55` }} aria-hidden="true" />
              <span className={s.ingIdx}>{ing.index}</span>
              <h3 className={s.ingName}>{ing.name}</h3>
              <p className={s.ingClaim}>{ing.claim1} <b>{ing.claim2}</b></p>
              {ing.sub && (
                <div className={s.ingSub}>
                  {ing.sub.map((x) => <span key={x.name}><b>{x.name}</b>{x.desc ? ` — ${x.desc}` : ""}</span>)}
                </div>
              )}
            </article>
          ))}
        </div>
        {!mobile && <span className={s.chap}>06 / 13 · 4 KEY INGREDIENTS</span>}
      </div>
    </section>
  );
}
