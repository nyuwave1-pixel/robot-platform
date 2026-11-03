"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { copy } from "@/data/copy";
import { satisfaction } from "@/data/reviews";
import Reveal from "@/components/Reveal";
import BgVideo from "@/features/video/BgVideo";
import Tagline from "@/components/Tagline";
import { clips } from "@/data/images";
import s from "./sections.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function Satisfaction() {
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = list.current; if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tl = gsap.fromTo(el.children, { z: -260, opacity: 0, rotateX: -12, transformPerspective: 1200 }, { z: 0, opacity: 1, rotateX: 0, duration: 1.1, ease: "power3.out", stagger: 0.16, scrollTrigger: { trigger: el, start: "top 80%", once: true } });
    return () => { tl.scrollTrigger?.kill(); tl.kill(); };
  }, []);
  return (
    <section id="reviews" className="section" data-bg="#38231C" aria-labelledby="h-rev" style={{ position: "relative", overflow: "hidden", background: "linear-gradient(180deg, var(--bg-obsidian), var(--bg-bronze))" }}>
      <BgVideo src={clips.boxOpenGreen.src} poster={clips.boxOpenGreen.poster} opacity={0.5} />
      <div className="veil" />
      <div className={`section-inner ${s.flow}`} style={{ position: "relative" }}>
        <div className={s.grid2} style={{ alignItems: "start" }}>
          <div className={s.stack}>
            <Tagline />
            <span className={s.surveyTag}><i /> 주관적 설문 · n={satisfaction.n}</span>
            <Reveal as="h2" mode="weight" className={`headline-ko ${s.h2}`} id="h-rev">{copy.s10.h1.text} <b>{copy.s10.h2.text}</b></Reveal>
            <p className="footnote">* {satisfaction.footnote}</p>
          </div>
          <div ref={list} className={s.cards}>
            {satisfaction.items.map((it) => (
              <div key={it.text} className={s.card}>
                <p><small>{it.when}</small>{it.text}</p>
                <span className={`numeral ${s.cardNum}`}><data value={it.value}>{it.value}</data><small>%</small></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
