"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { detail } from "@/data/images";
import s from "./sections.module.css";
import { useDict } from "@/i18n/context";

/**
 * 노벨상 성분 EGF — 모션 타이포그래피 히어로
 * 메달 부조 배경 위에 "노벨상 받은 성분 / EGF를 아시나요?"가 글자 단위로 터져 나오고,
 * 골드 글로우·빛 스윕·4GF 토큰 순차 등장으로 임팩트를 줍니다. (문구는 상세페이지 원문 그대로)
 */
export default function NobelHero() {
  const t = useDict();
  const root = useRef<HTMLDivElement>(null);
  const line2 = t.copy.s08.nobel2; // "노벨상 받은 성분 EGF를 아시나요?"
  const [head, tail] = line2.includes("EGF") ? [line2.slice(0, line2.indexOf("EGF")).trim(), line2.slice(line2.indexOf("EGF"))] : ["", line2];
  const tokens = t.copy.s08.gf.split("·").map((t) => t.trim());

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
      tl.fromTo(el.querySelector("[data-bg]"), { scale: 1.18, opacity: 0 }, { scale: 1.05, opacity: 1, duration: 1.8, ease: "power2.out" }, 0)
        .fromTo(el.querySelector("[data-eyebrow]"), { opacity: 0, letterSpacing: "1.2em" }, { opacity: 1, letterSpacing: ".42em", duration: 1.2, ease: "power3.out" }, 0.1)
        .fromTo(el.querySelectorAll("[data-l1] [data-ch]"), { opacity: 0, y: 30, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.05, ease: "power3.out" }, 0.4)
        .fromTo(el.querySelectorAll("[data-egf] i"), { opacity: 0, scale: 2.2, y: 40, rotateX: -40, filter: "blur(14px)", transformPerspective: 900 }, { opacity: 1, scale: 1, y: 0, rotateX: 0, filter: "blur(0px)", duration: 0.9, stagger: 0.12, ease: "expo.out" }, 0.9)
        .fromTo(el.querySelector("[data-glow]"), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 1.4, ease: "power2.out" }, 1.0)
        .fromTo(el.querySelectorAll("[data-tail] [data-ch]"), { opacity: 0, y: 24, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, stagger: 0.04, ease: "power3.out" }, 1.4)
        .fromTo(el.querySelector("[data-rule]"), { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.inOut" }, 1.7)
        .fromTo(el.querySelectorAll("[data-token]"), { opacity: 0, y: 26, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.14, ease: "back.out(1.6)" }, 1.9)
        .fromTo(el.querySelector("[data-sub]"), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, 2.4);
      // 미세 부유 모션 (등장 후 지속)
      gsap.to(el.querySelector("[data-egf]"), { y: -6, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2.5 });
    }, el);
    return () => ctx.revert();
  }, [t.locale]);

  // 글자 단위 모션 — 단어는 줄바꿈되지 않도록 묶고(영문·한글), 중국어는 글자마다 줄바꿈 허용
  const split = (txt: string) => {
    const ch = (c: string, i: number) => <span key={i} data-ch style={{ display: "inline-block", whiteSpace: c === " " ? "pre" : undefined }}>{c}</span>;
    if (t.locale === "zh") return Array.from(txt).map(ch);
    return txt.split(/(\s+)/).filter(Boolean).map((w, wi) =>
      /^\s+$/.test(w)
        ? <span key={`s${wi}`} data-ch style={{ display: "inline-block", whiteSpace: "pre" }}> </span>
        : <span key={`w${wi}`} style={{ display: "inline-block", whiteSpace: "nowrap" }}>{Array.from(w).map(ch)}</span>,
    );
  };

  return (
    <div ref={root} className={s.nobelHero} aria-labelledby="h-nobel">
      <div data-bg className={s.nobelBg} style={{ backgroundImage: `url(${detail.nobelBand})` }} aria-hidden="true" />
      <div className={s.nobelVeil} aria-hidden="true" />
      <div data-glow className={s.nobelGlow} aria-hidden="true" />
      <div className={s.nobelInner}>
        <span data-eyebrow data-anim className={s.nobelEyebrow}>{t.ui.nobelEyebrow}</span>
        <p data-l1 className={s.nobelL0}>{split(t.copy.s08.nobel1)}</p>
        <h3 id="h-nobel" className={s.nobelH}>
          <span data-l1 className={s.nobelL1}>{split(head)}</span>
          <span className={s.nobelL2}>
            <b data-egf className={s.nobelEgf} aria-label="EGF">{Array.from("EGF").map((c, i) => <i key={i}>{c}</i>)}</b>
            <span data-tail className={s.nobelTail}>{split(tail.replace(/^EGF/, ""))}</span>
          </span>
        </h3>
        <i data-rule className={s.nobelRule} aria-hidden="true" />
        <p className={s.nobelTokens} aria-label={t.copy.s08.gf}>
          {tokens.map((t, i) => (
            <span key={t} data-token className={`${s.nobelToken} ${i === 0 ? s.nobelTokenHi : ""}`}>{t}</span>
          ))}
        </p>
        <p data-sub className={s.nobelSub}>{t.copy.s08.gfDesc1} {t.copy.s08.gfDesc2} <b>{t.copy.s08.gfDesc3}</b></p>
      </div>
    </div>
  );
}
