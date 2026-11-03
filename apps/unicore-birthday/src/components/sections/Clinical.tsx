"use client";
import { useEffect, useRef, useState } from "react";
import { clinical, trial } from "@/data/clinical";
import { copy } from "@/data/copy";
import { detail, safetyLoop } from "@/data/images";
import Counter from "@/components/Counter";
import Reveal from "@/components/Reveal";
import { useInView } from "@/features/scroll/useSectionProgress";
import s from "./sections.module.css";

function Bars({ before, after, unit, title }: { before: number; after: number; unit: string; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useInView(ref, () => { ref.current?.classList.add("grown"); });
  const ratio = Math.min(1, after / before);
  return (
    <div>
      <p className={s.chartTitle}>{title}</p>
      <div ref={ref} className={s.bars} style={{ ["--ratio" as string]: ratio }}>
        <div className={`${s.bar} ${s.barBefore}`} style={{ height: "100%" }}><em>{before}</em><span>사용 전{unit ? ` (${unit})` : ""}</span></div>
        <div className={`${s.bar} ${s.barAfter}`} style={{ height: `${ratio * 100}%` }}><em>{after}</em><span>4주 후{unit ? ` (${unit})` : ""}</span></div>
      </div>
    </div>
  );
}

function SafetyVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [ok, setOk] = useState(true);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    v.muted = true; v.defaultMuted = true;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.1 });
    io.observe(v); return () => io.disconnect();
  }, [ok]);
  if (!ok) return null;
  return (
    <div className={s.safetyBg} aria-hidden="true">
      <video ref={ref} poster={safetyLoop.poster} playsInline muted loop preload="metadata" onError={() => setOk(false)}>
        <source src={safetyLoop.src} type="video/mp4" />
      </video>
      <div className={s.safetyVeil} />
    </div>
  );
}

export default function Clinical() {
  const cheek = clinical.find((m) => m.id === "cheek-lifting")!;
  const neck = clinical.find((m) => m.id === "neck-wrinkle")!;
  const safe = clinical.find((m) => m.id === "adverse-events")!;
  return (
    <section id="clinical" className={`section`} data-bg="#080706" aria-labelledby="h-clinical">
      <div className="section-inner">
        <div className={s.flow} style={{ paddingBottom: 0 }}>
          <Reveal as="p" mode="words" className="eyebrow">Clinical · 인체적용시험</Reveal>
          <Reveal as="h2" mode="weight" className={`headline-ko ${s.h2}`} id="h-clinical">{copy.s04.concern.text}</Reveal>
        </div>

        {/* 48.33% */}
        <div className={s.metric}>
          <div className={s.bgStill} style={{ backgroundImage: `url(${detail.modelJar})`, backgroundPosition: "right center", opacity: 0.5, maskImage: "linear-gradient(90deg, transparent 25%, #000 65%)", WebkitMaskImage: "linear-gradient(90deg, transparent 25%, #000 65%)" }} aria-hidden="true" />
          <div className={s.metricInner}>
            <div className={s.stack}>
              <span className={s.metricKind}><i /><span className="caption">{trial.instrument} · 기기 측정</span></span>
              <Reveal as="p" mode="weight" className={`headline-ko ${s.lead}`}>{copy.s04.h1a.text} <b>{copy.s04.h1b.text}</b></Reveal>
              {cheek.verified && <div className={`numeral ${s.bigNum}`}><Counter value={cheek.value} /><small>%</small></div>}
              <p className="caption">{cheek.label}</p>
              <p className="body-ko">{copy.s04.cheekLine1.text} <b style={{ color: "var(--ivory)", fontWeight: 500 }}>{copy.s04.cheekLine2.text}</b></p>
              <details className={s.footPanel}><summary>시험 조건 보기</summary><p className="footnote">* {cheek.footnote}</p></details>
            </div>
            {cheek.before && cheek.after && <Bars before={cheek.before} after={cheek.after} unit={cheek.measureUnit || ""} title={`${copy.s04.cheekChart.text}*`} />}
          </div>
        </div>

        {/* 19.06% */}
        <div className={s.metric}>
          <div className={s.bgStill} style={{ backgroundImage: `url(${detail.skinCheek})`, backgroundPosition: "left center", opacity: 0.35, maskImage: "linear-gradient(90deg, #000 30%, transparent 70%)", WebkitMaskImage: "linear-gradient(90deg, #000 30%, transparent 70%)" }} aria-hidden="true" />
          <div className={s.metricInner}>
            {neck.before && neck.after && <Bars before={neck.before} after={neck.after} unit="" title={`${copy.s04.neckChart.text}*`} />}
            <div className={s.stack}>
              <span className={s.metricKind}><i /><span className="caption">{trial.instrument} · 기기 측정</span></span>
              <Reveal as="p" mode="weight" className={`headline-ko ${s.lead}`}>{copy.s04.neckIntro.text}</Reveal>
              {neck.verified && <div className={`numeral ${s.bigNum}`}><Counter value={neck.value} /><small>%</small></div>}
              <p className="caption">{neck.label}</p>
              <p className="body-ko">{copy.s04.neckLine1.text} <b style={{ color: "var(--ivory)", fontWeight: 500 }}>{copy.s04.neckLine2.text}</b></p>
              <details className={s.footPanel}><summary>시험 조건 보기</summary><p className="footnote">* {neck.footnote}</p></details>
            </div>
          </div>
        </div>

        {/* 이상반응 0건 */}
        <div className={`${s.metric} ${s.metricSafe}`} style={{ minHeight: "100svh" }}>
          <SafetyVideo />
          <div className={s.safe} style={{ position: "relative", zIndex: 2 }}>
            <span className="caption">Safety</span>
            <Reveal as="p" mode="weight" className={`headline-ko ${s.lead}`}>{copy.s04.safeH.text.replace(" 0건", "")} <b>{safe.value}{safe.unit}</b></Reveal>
            <div className={`numeral ${s.safeNum}`} aria-hidden="true">0</div>
            <p className="body-ko" style={{ textAlign: "center" }}>{copy.s04.safeSub.text}</p>
            <p className="footnote" style={{ textAlign: "center" }}>* {safe.footnote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
