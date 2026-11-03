"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { copy } from "@/data/copy";
import { keyIngredients } from "@/data/ingredients";
import { detail } from "@/data/images";
import s from "./sections.module.css";

/**
 * 표정주름 × 아세틸헥사펩타이드-8 — 모션 타이포그래피 히어로
 * 피부 클로즈업 배경(켄번즈) 위에 "새로 태어날 수 있다면"이 글자 단위로 등장하고,
 * 펩타이드 성분명이 골드 대형 타이포로, 분자 2종이 오빗 링과 함께 팝업됩니다. (문구는 상세페이지 원문)
 */
export default function PeptideHero() {
  const root = useRef<HTMLDivElement>(null);
  const pep = keyIngredients.find((i) => i.id === "peptide");
  const mols = [
    { name: pep?.sub?.[0]?.name ?? "아세틸헥사펩타이드-8", desc: pep?.sub?.[0]?.desc ?? "", img: detail.moleculeA },
    { name: pep?.sub?.[1]?.name ?? "카퍼트라이펩타이드-1", desc: pep?.sub?.[1]?.desc ?? "", img: detail.moleculeB },
  ];

  useEffect(() => {
    const el = root.current; if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.querySelectorAll<HTMLElement>("[data-anim]").forEach((n) => { n.style.opacity = "1"; n.style.transform = "none"; n.style.filter = "none"; });
      return;
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true });
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { tl.play(); io.disconnect(); } }, { threshold: 0.25 });
      io.observe(el);
      tl.fromTo(el.querySelector("[data-bg]"), { scale: 1.2, opacity: 0 }, { scale: 1.06, opacity: 1, duration: 2, ease: "power2.out" }, 0)
        .fromTo(el.querySelector("[data-eyebrow]"), { opacity: 0, letterSpacing: "1em" }, { opacity: 1, letterSpacing: ".42em", duration: 1.1, ease: "power3.out" }, 0.1)
        .fromTo(el.querySelectorAll("[data-q] span"), { opacity: 0, y: 22, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, stagger: 0.025, ease: "power3.out" }, 0.4)
        .fromTo(el.querySelectorAll("[data-big] span"), { opacity: 0, y: 60, scale: 1.4, rotateX: -35, filter: "blur(12px)", transformPerspective: 900 }, { opacity: 1, y: 0, scale: 1, rotateX: 0, filter: "blur(0px)", duration: 0.9, stagger: 0.06, ease: "expo.out" }, 1.0)
        .fromTo(el.querySelector("[data-glow]"), { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 1.4, ease: "power2.out" }, 1.1)
        .fromTo(el.querySelector("[data-rule]"), { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.inOut" }, 1.9)
        .fromTo(el.querySelector("[data-name]"), { opacity: 0, y: 30, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power3.out" }, 2.1)
        .fromTo(el.querySelector("[data-desc]"), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, 2.5)
        .fromTo(el.querySelectorAll("[data-mol]"), { opacity: 0, scale: 0.6, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.9, stagger: 0.18, ease: "back.out(1.7)" }, 2.6)
        .fromTo(el.querySelectorAll("[data-ring]"), { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, stagger: 0.18, ease: "power2.out" }, 2.7);
      gsap.to(el.querySelectorAll("[data-ring]"), { rotate: 360, duration: 28, ease: "none", repeat: -1 });
      gsap.to(el.querySelectorAll("[data-mol] img"), { y: -8, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.6, delay: 3.4 });
    }, el);
    return () => ctx.revert();
  }, []);

  const split = (t: string) => Array.from(t).map((ch, i) => <span key={i} style={{ display: "inline-block", whiteSpace: ch === " " ? "pre" : undefined }}>{ch}</span>);

  return (
    <div ref={root} className={s.pepHero} aria-labelledby="h-pep">
      <div data-bg className={s.pepBg} style={{ backgroundImage: `url(${detail.skinCheek})` }} aria-hidden="true" />
      <div className={s.pepVeil} aria-hidden="true" />
      <div data-glow className={s.pepGlow} aria-hidden="true" />
      <div className={s.pepInner}>
        <div className={s.pepLeft}>
          <span data-eyebrow data-anim className={s.nobelEyebrow}>Expression Lines Care</span>
          <p data-q className={s.pepQ}>{split(`${copy.s08.exp1.text} ${copy.s08.exp2.text}`)}</p>
          <h3 id="h-pep" data-big className={s.pepBig}>{split(copy.s08.exp3.text)}</h3>
          <i data-rule className={s.nobelRule} style={{ margin: "8px 0 0" }} aria-hidden="true" />
          <p data-name className={s.pepName}>{copy.s08.pep.text}</p>
          <p data-desc className={s.pepDesc}>{copy.s08.pepDesc1.text} {copy.s08.pepDesc2.text} <b>{copy.s08.pepDesc3.text}</b></p>
        </div>
        <ul className={s.pepMols} aria-label="핵심 펩타이드 2종">
          {mols.map((m, i) => (
            <li key={m.name} data-mol className={s.pepMol}>
              <i data-ring className={s.pepRing} aria-hidden="true" />
              <img src={m.img} alt="" loading="lazy" />
              <b>{m.name}</b>
              {m.desc && <span>{m.desc}</span>}
              <em aria-hidden="true">0{i + 1}</em>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
