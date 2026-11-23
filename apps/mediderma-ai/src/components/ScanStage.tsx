"use client";
/**
 * 분석 중 화면: "첨단 장비로 정밀 스캔"하는 연출.
 *  - 배경: Higgsfield 로 만든 홀로그램 스캔 루프 영상(/scan/scan-bg.mp4, 없으면 그라디언트)
 *  - 가운데: 고객 사진 + 얼굴 그물망(MediaPipe canonical mesh) 이 그려지고, 레이저 스캔 선이 오가며, HUD 링이 회전
 *  - 아래: 0→100% 진행 막대와 단계별 체크(478 포인트 인식 → … → 맞춤 케어 매칭)
 * 진행률은 실제 분석 단계(stage)와 최소 연출 시간(minMs)을 함께 따른다. 실제 결과보다 앞서 '완료'를 표시하지 않는다.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import facedata from "@/lib/analysis/facedata.json";
import { useI18n } from "@/lib/i18n";
import type { ProgressStage } from "@/lib/analysis/provider";
import type { AnalysisResult, VisualData } from "@/lib/analysis/types";
import AnalysisReveal from "./fx/AnalysisReveal";

const STAGE_FLOOR: Record<ProgressStage, number> = { loading_model: 0.08, detecting: 0.25, quality: 0.4, analyzing: 0.6, done: 1 };

/** canonical 얼굴 메시 → 정규화된 선분 목록 (0~1 좌표) */
function useMeshPath() {
  return useMemo(() => {
    const c = facedata.canonical as number[];
    const tri = facedata.triangles as number[];
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < c.length; i += 3) {
      xs.push(c[i]);
      ys.push(-c[i + 1]);
    }
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const nx = (v: number) => ((v - minX) / (maxX - minX)) * 100;
    const ny = (v: number) => ((v - minY) / (maxY - minY)) * 100;
    const seen = new Set<string>();
    let d = "";
    for (let i = 0; i < tri.length; i += 3) {
      const t = [tri[i], tri[i + 1], tri[i + 2]];
      for (let k = 0; k < 3; k++) {
        const a = t[k], b = t[(k + 1) % 3];
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (seen.has(key)) continue;
        seen.add(key);
        d += `M${nx(xs[a]).toFixed(1)} ${ny(ys[a]).toFixed(1)}L${nx(xs[b]).toFixed(1)} ${ny(ys[b]).toFixed(1)}`;
      }
    }
    const pts = xs.map((x, i) => [nx(x), ny(ys[i])] as const).filter((_, i) => i % 6 === 0);
    return { d, pts };
  }, []);
}

/** reveal: 실제 분석이 끝나면 넘겨받는 결과 — 스캔 연출 뒤 '분석 완료 연출'(AnalysisReveal)을 보여 준다 */
export default function ScanStage({ preview, stage, minMs = 6000, onVisualDone, reveal = null }: { preview: string | null; stage: ProgressStage; minMs?: number; onVisualDone?: () => void; reveal?: { visual: VisualData; result: AnalysisResult } | null }) {
  const { t } = useI18n();
  const s = t.fit.scan;
  const { d, pts } = useMeshPath();
  const t0 = useRef(performance.now());
  const [now, setNow] = useState(0);
  const [videoOk, setVideoOk] = useState(true);
  const finished = useRef(false);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setNow(performance.now() - t0.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 진행률: 시간 진행(최대 92%)과 실제 단계 하한 중 큰 값. 완료는 실제 분석이 끝나고 최소 시간이 지난 뒤에만.
  const timeP = Math.min(0.92, now / minMs);
  const done = stage === "done" && now >= minMs;
  const progress = done ? 1 : Math.max(timeP, Math.min(STAGE_FLOOR[stage], 0.92));
  const pct = Math.round(progress * 100);
  const stepCount = s.steps.length;
  const activeStep = Math.min(stepCount - 1, Math.floor(progress * stepCount));

  useEffect(() => {
    // 결과 연출이 있으면 그 연출이 끝날 때 넘어간다
    if (done && !finished.current && !reveal) {
      finished.current = true;
      onVisualDone?.();
    }
  }, [done, onVisualDone, reveal]);
  const showReveal = done && !!reveal;
  const revealDone = () => {
    if (finished.current) return;
    finished.current = true;
    onVisualDone?.();
  };

  const meshReveal = Math.min(1, now / 2200);
  const scanY = 50 + 46 * Math.sin(now / 520);

  return (
    <div className="theme-dark relative -mx-4 overflow-hidden rounded-none bg-ink sm:mx-0 sm:rounded-3xl" data-testid="running">
      {/* 배경: 홀로그램 스캔 루프 영상 */}
      {videoOk ? (
        <video className="absolute inset-0 h-full w-full object-cover opacity-55" src="/scan/scan-bg.mp4" autoPlay muted loop playsInline onError={() => setVideoOk(false)} aria-hidden />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(79,182,255,0.25),transparent_60%)]" />
      )}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/20 to-ink/90" />

      <div className="relative px-5 pb-6 pt-6 text-center">
        <p className="font-display text-[11px] tracking-[0.35em] text-scan2">AI DEEP SKIN SCAN</p>
        <h1 className="mt-2 text-[22px] font-bold [word-break:keep-all] sm:text-2xl">{showReveal ? t.iq.complete : s.title}</h1>

        <div className="relative mx-auto mt-6 aspect-[4/5] w-full max-w-[300px]">
          {/* HUD 링 */}
          <svg aria-hidden viewBox="0 0 100 125" className="absolute -inset-6 h-[calc(100%+3rem)] w-[calc(100%+3rem)]">
            <g style={{ transformOrigin: "50px 62px", transform: `rotate(${now / 40}deg)` }}>
              <ellipse cx="50" cy="62" rx="47" ry="58" fill="none" stroke="rgba(125,211,252,0.35)" strokeWidth="0.4" strokeDasharray="1.2 2.4" />
            </g>
            <g style={{ transformOrigin: "50px 62px", transform: `rotate(${-now / 65}deg)` }}>
              <ellipse cx="50" cy="62" rx="44" ry="55" fill="none" stroke="rgba(125,211,252,0.6)" strokeWidth="0.6" strokeDasharray="14 6 3 6" />
            </g>
          </svg>
          <div className="relative h-full w-full overflow-hidden rounded-[2rem] border border-scan/50 bg-black shadow-glow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {preview && <img src={preview} alt="" className="h-full w-full object-cover" style={{ filter: `saturate(${0.6 + progress * 0.4}) brightness(0.85)` }} />}
            {/* 얼굴 그물망 */}
            <svg aria-hidden viewBox="-10 -6 120 112" preserveAspectRatio="xMidYMid meet" className="absolute inset-x-[14%] top-[12%] h-[70%] w-[72%]">
              <defs>
                <clipPath id="meshReveal">
                  <rect x="-10" y="-6" width="120" height={112 * meshReveal} />
                </clipPath>
              </defs>
              <path d={d} clipPath="url(#meshReveal)" fill="none" stroke="rgba(186,230,253,0.55)" strokeWidth="0.18" />
              {pts.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="0.55" fill="#e0f2fe" opacity={((i * 7 + Math.floor(now / 90)) % 23) < 3 ? 1 : 0.35} />
              ))}
            </svg>
            {/* 레이저 스캔 선 */}
            <div aria-hidden className="absolute inset-x-0 h-[3px] bg-scan2 shadow-[0_0_24px_6px_rgba(125,211,252,0.85)]" style={{ top: `${scanY}%` }} />
            <div aria-hidden className="absolute inset-x-0 h-24 bg-gradient-to-b from-scan/25 to-transparent" style={{ top: `${scanY}%` }} />
            {/* 모서리 브래킷 */}
            {["left-3 top-3 border-l-2 border-t-2", "right-3 top-3 border-r-2 border-t-2", "left-3 bottom-3 border-b-2 border-l-2", "right-3 bottom-3 border-b-2 border-r-2"].map((c) => (
              <span key={c} aria-hidden className={`absolute h-6 w-6 border-scan2 ${c}`} />
            ))}
            {/* 실시간 판독 수치(연출) */}
            <div aria-hidden className="absolute left-3 top-10 space-y-0.5 text-left font-mono text-[9px] leading-tight text-scan2/90">
              <p>PTS {Math.min(478, Math.floor(progress * 600))}/478</p>
              <p>ZONE {Math.min(13, Math.floor(progress * 16))}/13</p>
              <p>RGB Δ {(0.12 + 0.05 * Math.sin(now / 300)).toFixed(3)}</p>
            </div>
            {showReveal && reveal && <AnalysisReveal visual={reveal.visual} result={reveal.result} onDone={revealDone} />}
          </div>
        </div>

        {/* 진행률 */}
        <div className="mx-auto mt-6 max-w-sm">
          <div className="flex items-baseline justify-between text-base">
            <span className="font-semibold text-white">{showReveal ? t.iq.decoding : `${s.steps[activeStep]}…`}</span>
            <span className="font-display text-2xl tabular-nums text-scan2" data-testid="scan-pct">{pct}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-scan via-scan2 to-white shadow-[0_0_12px_rgba(125,211,252,0.8)]" style={{ width: `${pct}%` }} />
          </div>
          <ol className="mx-auto mt-4 grid max-w-[16rem] grid-cols-1 gap-y-1.5 text-left text-sm sm:max-w-none sm:grid-cols-2 sm:gap-x-3">
            {s.steps.map((label, i) => (
              <li key={label} className={`flex items-center gap-2 ${i < activeStep ? "text-silver" : i === activeStep ? "text-white" : "text-silver-soft"}`}>
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${i < activeStep ? "bg-scan2 text-ink" : i === activeStep ? "animate-pulse border border-white" : "border border-line"}`}>{i < activeStep ? "✓" : ""}</span>
                {label}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-silver-soft">🔒 {s.privacy}</p>
        </div>
      </div>
    </div>
  );
}
