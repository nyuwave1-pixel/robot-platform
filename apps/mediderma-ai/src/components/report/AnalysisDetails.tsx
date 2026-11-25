"use client";
/**
 * 리포트 '분석 내역' — 이 결과를 만든 실제 측정값만 보여 준다.
 * 랜드마크 수 · 분석된 영역 · 계산된 지표 · 분석 시간(이 기기에서 측정) · 촬영 품질 세부 점수 · 얼굴 각도 · 영역별 신뢰도.
 * 화면에 들어오면 숫자가 카운트업되고 막대가 차오른다 (CSS transition, 모션 최소화 설정이면 즉시 표시).
 */
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import DepthText from "../fx/DepthText";
import { FACE_ZONES } from "@/lib/analysis/zones";
import type { AnalysisResult, MetricKey, VisualData } from "@/lib/analysis/types";

function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setOn(true);
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        setOn(true);
        io.disconnect();
      }
    }, { rootMargin: "0px 0px -15% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, on] as const;
}

function CountUp({ value, on, digits = 0 }: { value: number; on: boolean; digits?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!on) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return setV(value);
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / 1100);
      setV(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, value]);
  return <>{v.toFixed(digits)}</>;
}

function Bar({ label, value, on }: { label: string; value: number; on: boolean }) {
  return (
    <li className="text-xs">
      <div className="flex justify-between"><span className="text-silver">{label}</span><span className="tabular-nums font-semibold">{Math.round(value)}</span></div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-gradient-to-r from-scan to-brand transition-[width] duration-1000 ease-out" style={{ width: on ? `${Math.max(2, Math.min(100, value))}%` : "0%" }} />
      </div>
    </li>
  );
}

/** 각도 다이얼: 바늘이 실제 측정 각도만큼 기운다 */
function Dial({ label, deg, on }: { label: string; deg: number; on: boolean }) {
  const clamped = Math.max(-45, Math.min(45, deg));
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 64 40" className="h-12 w-20" aria-hidden>
        <path d="M6 36 A26 26 0 0 1 58 36" fill="none" stroke="rgb(var(--c-line))" strokeWidth="4" strokeLinecap="round" />
        <path d="M26 11 A26 26 0 0 1 38 11" fill="none" stroke="rgb(var(--c-scan))" strokeWidth="4" strokeLinecap="round" />
        <g style={{ transform: `rotate(${on ? clamped * 2 : 0}deg)`, transformOrigin: "32px 36px", transition: "transform 1s cubic-bezier(.2,.75,.2,1)" }}>
          <line x1="32" y1="36" x2="32" y2="12" stroke="rgb(var(--c-brand))" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <circle cx="32" cy="36" r="3" fill="rgb(var(--c-brand))" />
      </svg>
      <p className="text-sm font-semibold tabular-nums">{deg > 0 ? "+" : ""}{deg.toFixed(1)}°</p>
      <p className="text-xs text-silver">{label}</p>
    </div>
  );
}

export default function AnalysisDetails({ result, visual, durationMs }: { result: AnalysisResult; visual: VisualData | null; durationMs?: number | null }) {
  const { t } = useI18n();
  const q = t.quality;
  const iq = t.iq;
  const [ref, on] = useInView<HTMLElement>();
  const a = result.analysis;
  const iqd = result.imageQuality;
  const faceZones = a.zones.filter((z) => z.zone !== "neck");
  const analyzed = faceZones.filter((z) => z.conditionIndex !== null).length;
  const metrics = new Set<MetricKey>();
  for (const z of faceZones) for (const [k, v] of Object.entries(z)) if (typeof v === "number" && k !== "conditionIndex" && k !== "confidence") metrics.add(k as MetricKey);
  const points = visual ? Math.floor(visual.landmarks.length / 3) : 478;
  const excluded = faceZones.filter((z) => z.conditionIndex === null);
  const kpis: { label: string; node: React.ReactNode }[] = [
    { label: iq.landmarks, node: <CountUp value={points} on={on} /> },
    { label: iq.zonesAnalyzed, node: <><CountUp value={analyzed} on={on} /><span className="text-base text-silver">/{FACE_ZONES.length}</span></> },
    { label: iq.metricsComputed, node: <CountUp value={metrics.size} on={on} /> },
    ...(durationMs ? [{ label: iq.duration, node: <><CountUp value={durationMs / 1000} on={on} digits={1} /><span className="text-base text-silver">{iq.sec}</span></> }] : []),
  ];
  return (
    <section ref={ref} className="rounded-2xl border border-line bg-panel p-5 sm:p-7" data-testid="analysis-details">
      <DepthText text={iq.title} size="md" />
      <p className="mt-2 max-w-2xl text-sm text-silver">{iq.sub}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-line bg-ink/40 p-4">
            <p className="font-display text-3xl font-normal tabular-nums text-brand sm:text-4xl">{k.node}</p>
            <p className="mt-1 text-xs text-silver">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_1.2fr]">
        <div>
          <h3 className="text-sm font-semibold">{iq.capture}</h3>
          <ul className="mt-3 space-y-2.5">
            <Bar label={q.score} value={iqd.score} on={on} />
            <Bar label={q.frontal} value={iqd.frontalScore} on={on} />
            <Bar label={q.lighting} value={iqd.lightingScore} on={on} />
            <Bar label={q.sharpness} value={iqd.sharpnessScore} on={on} />
            <Bar label={q.resolution} value={iqd.resolutionScore} on={on} />
          </ul>
          <dl className="mt-4 grid grid-cols-2 gap-y-1 text-xs">
            {iqd.faceWidthPx !== null && (<><dt className="text-silver">{iq.faceSize}</dt><dd className="text-right tabular-nums">{Math.round(iqd.faceWidthPx)} px</dd></>)}
            <dt className="text-silver">{iq.imageSize}</dt><dd className="text-right tabular-nums">{iqd.imageSize.width} × {iqd.imageSize.height}</dd>
          </dl>
        </div>
        {iqd.pose && (
          <div>
            <h3 className="text-sm font-semibold">{iq.pose}</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Dial label={iq.yaw} deg={iqd.pose.yaw} on={on} />
              <Dial label={iq.pitch} deg={iqd.pose.pitch} on={on} />
              <Dial label={iq.roll} deg={iqd.pose.roll} on={on} />
            </div>
            <p className="mt-2 text-center text-xs text-silver">{iq.ideal}</p>
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold">{iq.zoneConf}</h3>
          <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 min-[440px]:grid-cols-2">
            {faceZones.map((z, i) => (
              <li key={z.zone} className="text-xs">
                <div className="flex items-start justify-between gap-2"><span className="leading-snug text-silver">{t.zones[z.zone]}</span><span className="shrink-0 tabular-nums">{z.confidence === null ? "—" : `${Math.round(z.confidence * 100)}%`}</span></div>
                <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out" style={{ width: on && z.confidence !== null ? `${z.confidence * 100}%` : "0%", transitionDelay: `${i * 45}ms` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-silver">
            {iq.excluded}: {excluded.length ? excluded.map((z) => t.zones[z.zone]).join(", ") : iq.none}
          </p>
        </div>
      </div>
    </section>
  );
}
