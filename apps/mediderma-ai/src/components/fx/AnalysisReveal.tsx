"use client";
/**
 * 분석 완료 연출 — 모두 실제 분석 결과로 그린다 (가짜 숫자·가짜 진행 없음).
 *  1) 내 얼굴의 랜드마크 478개가 차례로 켜진다
 *  2) 13개 영역이 하나씩 컨디션 지수 색으로 채워지며 영역 이름과 지수가 뜬다
 *  3) SKIN IQ 종합 지수가 카운트업되며 등장한다
 * 아무 곳이나 누르면 바로 결과로 넘어간다. 모션 최소화 설정이면 마지막 화면만 잠깐 보여 준다.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { FACE_ZONES } from "@/lib/analysis/zones";
import type { AnalysisResult, MetricKey, VisualData } from "@/lib/analysis/types";

const T_POINTS = 900;
const T_ZONE = 150;
const T_ZONES_END = T_POINTS + FACE_ZONES.length * T_ZONE;
const T_SCORE = 1300;
const T_END = T_ZONES_END + T_SCORE + 500;

/** 컨디션 지수 → 색 (높을수록 좋음) */
function tone(v: number | null): [number, number, number] {
  if (v === null) return [120, 130, 140];
  if (v >= 80) return [52, 211, 153];
  if (v >= 60) return [96, 170, 230];
  if (v >= 40) return [251, 191, 36];
  return [251, 113, 133];
}

export default function AnalysisReveal({ visual, result, onDone }: { visual: VisualData; result: AnalysisResult; onDone: () => void }) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLButtonElement>(null);
  // 얼굴 크롭을 자르지 않고 상자 안에 맞춘 실제 표시 영역 (라벨 위치를 맞추기 위해)
  const [fit, setFit] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const cw = el.clientWidth, ch = el.clientHeight;
      const sc = Math.min(cw / visual.width, ch / visual.height);
      const width = visual.width * sc, height = visual.height * sc;
      setFit({ left: (cw - width) / 2, top: (ch - height) / 2, width, height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [visual.width, visual.height]);
  const [elapsed, setElapsed] = useState(0);
  const doneRef = useRef(false);
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  const a = result.analysis;
  const zoneById = useMemo(() => new Map(a.zones.map((z) => [z.zone, z])), [a.zones]);
  const nPoints = Math.floor(visual.landmarks.length / 3);
  const zonesAnalyzed = a.zones.filter((z) => z.zone !== "neck" && z.conditionIndex !== null).length;
  const metricsComputed = useMemo(() => {
    const keys = new Set<MetricKey>();
    for (const z of a.zones) for (const k of Object.keys(z) as MetricKey[]) if (typeof (z as unknown as Record<string, unknown>)[k] === "number" && k !== ("conditionIndex" as MetricKey) && k !== ("confidence" as MetricKey)) keys.add(k);
    return keys.size;
  }, [a.zones]);
  const score = a.overallConditionScore;

  // 영역별 채색 레이어와 중심점 (한 번만 계산)
  const layers = useMemo(() => {
    const { width: w, height: h, zoneMap } = visual;
    return FACE_ZONES.map((fz, i) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d")!;
      const img = ctx.createImageData(w, h);
      const [r, g, b] = tone(zoneById.get(fz.id)?.conditionIndex ?? null);
      let sx = 0, sy = 0, n = 0;
      for (let p = 0; p < zoneMap.length; p++) {
        if (zoneMap[p] !== i + 1) continue;
        const o = p * 4;
        img.data[o] = r;
        img.data[o + 1] = g;
        img.data[o + 2] = b;
        img.data[o + 3] = 120;
        sx += p % w;
        sy += (p / w) | 0;
        n++;
      }
      ctx.putImageData(img, 0, 0);
      return { canvas: c, cx: n ? sx / n / w : 0.5, cy: n ? sy / n / h : 0.5, id: fz.id, value: zoneById.get(fz.id)?.conditionIndex ?? null };
    });
  }, [visual, zoneById]);

  const base = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = visual.width;
    c.height = visual.height;
    c.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(visual.rgba), visual.width, visual.height), 0, 0);
    return c;
  }, [visual]);

  useEffect(() => {
    const start = performance.now() - (reduce ? T_END - 1200 : 0);
    let raf = 0;
    const loop = () => {
      const e = performance.now() - start;
      setElapsed(e);
      draw(e);
      if (e >= T_END) return finish();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, base]);

  function draw(e: number) {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const { width: w, height: h, landmarks: lm } = visual;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.filter = "brightness(0.72) saturate(0.8)";
    ctx.drawImage(base, 0, 0);
    ctx.filter = "none";
    // 2) 영역 채색 (지나간 영역은 은은하게, 지금 영역은 진하게)
    const zk = e < T_POINTS ? -1 : Math.min(FACE_ZONES.length - 1, Math.floor((e - T_POINTS) / T_ZONE));
    for (let i = 0; i <= zk; i++) {
      ctx.globalAlpha = i === zk && e < T_ZONES_END ? 1 : 0.55;
      ctx.drawImage(layers[i].canvas, 0, 0);
    }
    ctx.globalAlpha = 1;
    // 1) 랜드마크 (등장 후 점점 옅어짐)
    const shown = Math.min(nPoints, Math.floor((e / T_POINTS) * nPoints));
    const dotAlpha = e < T_POINTS ? 0.95 : Math.max(0.25, 0.95 - (e - T_POINTS) / 1500);
    ctx.fillStyle = `rgba(199,232,242,${dotAlpha})`;
    const r = Math.max(1.4, w / 380);
    for (let i = 0; i < shown; i++) {
      ctx.beginPath();
      ctx.arc(lm[3 * i], lm[3 * i + 1], r, 0, Math.PI * 2);
      ctx.fill();
    }
    // 스캔 선
    if (e < T_ZONES_END) {
      const y = ((e % 1400) / 1400) * h;
      const g = ctx.createLinearGradient(0, y - 40, 0, y + 2);
      g.addColorStop(0, "rgba(120,182,236,0)");
      g.addColorStop(1, "rgba(199,232,242,0.85)");
      ctx.fillStyle = g;
      ctx.fillRect(0, y - 40, w, 42);
    }
  }

  const phase = elapsed < T_POINTS ? 0 : elapsed < T_ZONES_END ? 1 : 2;
  const zk = Math.min(FACE_ZONES.length - 1, Math.floor((elapsed - T_POINTS) / T_ZONE));
  const cur = phase === 1 ? layers[zk] : null;
  const shownPts = Math.min(nPoints, Math.floor((elapsed / T_POINTS) * nPoints));
  const sp = Math.min(1, Math.max(0, (elapsed - T_ZONES_END) / T_SCORE));
  const ease = 1 - Math.pow(1 - sp, 3);
  const shownScore = score === null ? null : Math.round(score * ease);
  const zonesLit = phase === 0 ? 0 : phase === 1 ? zk + 1 : FACE_ZONES.length;

  return (
    <button ref={boxRef} type="button" onClick={finish} className="absolute inset-0 block h-full w-full cursor-pointer bg-ink text-left" aria-label={t.iq.skip} data-testid="analysis-reveal" data-phase={phase}>
      <div className="absolute" style={fit ?? { inset: 0 }}>
      <canvas ref={canvasRef} width={visual.width} height={visual.height} className="absolute inset-0 h-full w-full" />
      {/* 실측 카운터 */}
      <div className="pointer-events-none absolute left-3 top-3 space-y-0.5 font-mono text-[10px] leading-tight text-scan2">
        <p>{t.iq.points} {shownPts}/{nPoints}</p>
        <p>{t.iq.zones} {zonesLit}/{FACE_ZONES.length}</p>
        {phase === 2 && <p>{t.iq.metrics} {metricsComputed}</p>}
      </div>
      {/* 현재 영역 라벨 */}
      {cur && (
        <span
          key={cur.id}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/40 bg-ink/75 px-2.5 py-1 text-[11px] font-semibold text-white shadow-glow backdrop-blur [animation:menu-in_.25s_ease-out]"
          style={{ left: `${cur.cx * 100}%`, top: `${cur.cy * 100}%` }}
        >
          {t.zones[cur.id]} <span className="tabular-nums text-scan2">{cur.value ?? "—"}</span>
        </span>
      )}
      </div>
      {/* 종합 지수 */}
      {phase === 2 && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-ink/55 backdrop-blur-[2px]" style={{ opacity: Math.min(1, sp * 3) }}>
          <svg viewBox="0 0 120 120" className="absolute h-[62%] max-h-56 w-[62%] max-w-56 -rotate-90" aria-hidden>
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="url(#iqg)" strokeWidth="5" strokeLinecap="round" strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * (1 - ease * ((score ?? 0) / 100))} />
            <defs>
              <linearGradient id="iqg" x1="0" x2="1">
                <stop offset="0" stopColor="#78b6ec" />
                <stop offset="1" stopColor="#c7e8f2" />
              </linearGradient>
            </defs>
          </svg>
          <p className="relative font-brand text-[11px] font-extrabold tracking-[0.3em] text-scan2">{t.iq.scoreLabel}</p>
          <p className="relative font-display text-6xl font-light tabular-nums text-white [text-shadow:0_0_30px_rgba(120,182,236,0.7)]" data-testid="reveal-score">{shownScore ?? "—"}</p>
          <p className="relative mt-1 text-xs text-silver">{t.iq.zonesAnalyzed} {zonesAnalyzed}/{FACE_ZONES.length}</p>
        </div>
      )}
      <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[10px] text-silver">{t.iq.skip}</p>
    </button>
  );
}
