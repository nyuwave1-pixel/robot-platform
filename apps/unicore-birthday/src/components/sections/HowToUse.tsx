"use client";
import { useEffect, useRef, useState } from "react";
import { product } from "@/data/product";
import { detail, howtoLoop } from "@/data/images";
import Reveal from "@/components/Reveal";
import Tagline from "@/components/Tagline";
import s from "./sections.module.css";
import { useDict } from "@/i18n/context";

/** HOW TO USE — 배경: 골든 파티클 분자 영상(무음 루프), 실패 시 상세페이지 골드 스피어 스틸 */
export default function HowToUse() {
  const t = useDict();
  const video = useRef<HTMLVideoElement>(null);
  const [videoOk, setVideoOk] = useState(true);
  useEffect(() => {
    const v = video.current; if (!v) return;
    v.muted = true; v.defaultMuted = true;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.1 });
    io.observe(v); return () => io.disconnect();
  }, [videoOk]);
  return (
    <section id="how-to-use" className="section" data-bg="#080706" aria-labelledby="h-how" style={{ position: "relative", overflow: "hidden", background: "var(--bg-midnight)" }}>
      <div className="media-bg" aria-hidden="true">
        {videoOk ? (
          <video ref={video} className={s.howtoVideo} poster={howtoLoop.poster} playsInline muted loop preload="metadata" onError={() => setVideoOk(false)}>
            <source src={howtoLoop.src} type="video/mp4" />
          </video>
        ) : (
          <div className={`${s.bgStill} ${s.kenburns}`} style={{ backgroundImage: `url(${detail.goldSphere})` }} />
        )}
      </div>
      <div className={s.howtoVeil} aria-hidden="true" />
      <div className={`section-inner ${s.flow}`} style={{ position: "relative" }}>
        <div className={s.grid2} style={{ alignItems: "start" }}>
          <div className={s.stack}>
            <Tagline />
            <Reveal as="h2" mode="weight" className="display-en" id="h-how" style={{ fontSize: "clamp(34px, 5vw, 72px)", margin: 0, letterSpacing: ".08em" }}>{t.copy.s11.h}</Reveal>
            <p className="body-ko">{t.copy.s11.sub}</p>
            <p className="caption" style={{ color: "var(--gold)" }}>{product.brand} · {product.name} · {product.volume.g} g</p>
          </div>
          <ol className={s.steps} style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {t.howto.steps.map((st) => (
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
