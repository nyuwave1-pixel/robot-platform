"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion } from "framer-motion";
import { fmt, useI18n } from "@/lib/i18n";
import { useApp, type CurrentAnalysis } from "@/lib/client/store";
import { FACE_ZONES, ZONE_METRICS } from "@/lib/analysis/zones";
import { HIGHER_IS_BETTER, type FaceZoneId, type MetricKey, type ZoneResult } from "@/lib/analysis/types";
import { HEATMAP_METRICS } from "@/lib/client/overlay";
import { canUse3D } from "@/lib/client/device";
import { track } from "@/lib/client/telemetry";
import { getAnonId, hasHistoryConsent, setHistoryConsent } from "@/lib/client/session";
import { addHistory, rgbaToJpeg } from "@/lib/client/history";
import { saveReportImage, saveReportPdf } from "@/lib/client/exportReport";
import FaceMap from "./FaceMap";
import CareView from "./CareView";
import Simulation from "./Simulation";

const Face3D = dynamic(() => import("./Face3D"), { ssr: false });

function Ring({ value, label, sub }: { value: number | null; label: string; sub: string }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  // 카운트업 (최종값은 data-value 에 항상 있다)
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (value === null) return;
    const ctl = animate(0, value, { duration: 1.4, ease: [0.2, 0.75, 0.2, 1], onUpdate: (v) => setShown(Math.round(v)) });
    return () => ctl.stop();
  }, [value]);
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 128 128" className="h-28 w-28 shrink-0 -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#1c232d" strokeWidth="8" />
        {value !== null && <motion.circle cx="64" cy="64" r={r} fill="none" stroke="url(#g)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (c * value) / 100 }} transition={{ duration: 1.4, ease: [0.2, 0.75, 0.2, 1] }} style={{ filter: "drop-shadow(0 0 6px rgba(79,182,255,0.7))" }} />}
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0" stopColor="#4fb6ff" />
            <stop offset="1" stopColor="#ffffff" />
          </linearGradient>
        </defs>
        <text x="64" y="64" transform="rotate(90 64 64)" textAnchor="middle" dominantBaseline="central" className="fill-white font-display text-[34px] font-light" data-testid="overall-score" data-value={value ?? ""}>
          {value === null ? "—" : shown}
        </text>
      </svg>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-silver">{sub}</p>
      </div>
    </div>
  );
}

function Bar({ name, value, better, hint }: { name: string; value: number | null; better: boolean; hint: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span>{name}</span>
        <span className="tabular-nums text-silver">{value ?? "—"}<span className="ml-1 text-[10px] text-silver/50">{hint}</span></span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
        {value !== null && <motion.div className={`h-full rounded-full ${better ? "bg-gradient-to-r from-scan to-white" : "bg-gradient-to-r from-silver/60 to-amber-300"}`} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.9, ease: [0.2, 0.75, 0.2, 1] }} />}
      </div>
    </div>
  );
}

function ZoneDetail({ zone }: { zone: ZoneResult }) {
  const { t } = useI18n();
  const { config } = useApp();
  const keys = zone.zone === "neck" ? (["wrinkleVisibility"] as MetricKey[]) : (Object.keys(ZONE_METRICS[zone.zone as FaceZoneId]) as MetricKey[]);
  return (
    <div data-testid="zone-detail">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-lg font-semibold">{t.zones[zone.zone]}</h4>
        <p className="text-xs text-silver">
          {t.report.zoneCondition} <b className="text-white">{zone.conditionIndex ?? "—"}</b> · {t.report.zoneConfidence} {zone.confidence !== null ? Math.round(zone.confidence * 100) : "—"}%
        </p>
      </div>
      {zone.conditionIndex === null ? (
        <p className="mt-3 rounded-lg bg-white/5 p-3 text-sm text-silver">{t.report.zoneNull[zone.nullReason ?? "low_confidence"]}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {keys.filter((k) => config.enabledMetrics.includes(k)).map((k) => (
            <div key={k}>
              <Bar name={t.metrics[k].name} value={zone[k]} better={HIGHER_IS_BETTER[k]} hint={HIGHER_IS_BETTER[k] ? t.metrics.higherBetter : t.metrics.higherVisible} />
              <p className="mt-0.5 text-[10px] text-silver/60">{t.metrics[k].desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Report({ data, onRestart }: { data: CurrentAnalysis; onRestart: () => void }) {
  const { t, locale } = useI18n();
  const { config, wipe } = useApp();
  const { result, visual, plan, survey, neck } = data;
  const a = result.analysis;
  const [heatmap, setHeatmap] = useState<MetricKey | null>(null);
  const [showZones, setShowZones] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [can3d, setCan3d] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [consent, setConsent] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setCan3d(canUse3D());
    setConsent(hasHistoryConsent());
  }, []);
  const zones = useMemo(() => (neck ? [...a.zones, neck] : a.zones), [a.zones, neck]);
  const selectedZone = selected !== null ? a.zones.find((z) => z.zone === FACE_ZONES[selected].id) ?? null : null;
  const [neckOpen, setNeckOpen] = useState(false);
  const dt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.analyzedAt));
  const cats = a.categories;
  const catRows: { key: keyof typeof cats; better: boolean }[] = [
    { key: "textureUniformity", better: true },
    { key: "wrinkleVisibility", better: false },
    { key: "poreVisibility", better: false },
    { key: "toneUniformity", better: true },
    { key: "pigmentVisibility", better: false },
    { key: "rednessVisibility", better: false },
    { key: "eyeAreaCondition", better: true },
    { key: "cheekTexture", better: true },
    { key: "jawlineTexture", better: true },
  ];

  const exportAs = async (format: "pdf" | "image") => {
    if (!ref.current) return;
    setBusy(format);
    const prev = view;
    setView("2d"); // WebGL 캔버스 대신 2D 맵을 캡처
    await new Promise((r) => setTimeout(r, 150));
    try {
      const name = `mediderma-ai-report-${result.analyzedAt.slice(0, 10)}`;
      if (format === "pdf") await saveReportPdf(ref.current, name);
      else await saveReportImage(ref.current, name);
      track("report_saved", { format });
    } finally {
      setView(prev);
      setBusy(null);
    }
  };
  const saveHistory = async () => {
    if (!visual) return;
    if (!hasHistoryConsent()) return;
    const { blob, scale } = await rgbaToJpeg(visual.rgba, visual.width, visual.height);
    await addHistory({
      id: `${Date.now()}`,
      anonId: getAnonId() ?? "anon",
      savedAt: Date.now(),
      result,
      image: blob,
      width: Math.round(visual.width * scale),
      height: Math.round(visual.height * scale),
      landmarks: Array.from(visual.landmarks, (v) => Math.round(v * scale * 10) / 10),
    });
    setSaved(true);
    track("history_saved");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div ref={ref} className="space-y-8 bg-ink" data-testid="report">
        {/* 헤더 · 메타 */}
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="font-display text-xs tracking-[0.3em] text-scan2">MEDIDERMA AI</p>
            <h1 className="mt-1 font-display text-3xl font-light">{t.report.title}</h1>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-silver">
            <dt>{t.report.analyzedAt}</dt><dd className="text-white">{dt}</dd>
            <dt>{t.report.imageQuality}</dt><dd className="text-white">{result.imageQuality.score} / 100</dd>
            <dt>{t.report.confidence}</dt><dd className="text-white" data-testid="confidence">{a.confidence !== null ? `${Math.round(a.confidence * 100)}%` : "—"}</dd>
            <dt>{t.report.processedOn}</dt><dd className="text-white">{result.provider.imageLeftDevice ? result.provider.id : t.report.onDevice}</dd>
            <dt>{t.report.modelVersion}</dt><dd className="col-span-1 break-all text-white/80">{result.modelVersion}</dd>
          </dl>
        </header>

        {/* 종합 + 세부 */}
        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-line bg-panel p-5">
            <Ring value={a.overallConditionScore} label={t.report.overall} sub={t.report.overallDesc} />
            <p className="mt-3 inline-block rounded-full border border-amber-300/40 px-2.5 py-1 text-[10px] text-amber-200">{t.report.indexNote}</p>
            {a.needsRetake && (
              <div role="alert" className="mt-3 rounded-lg border border-amber-400/50 bg-amber-400/10 p-3 text-xs text-amber-100" data-testid="needs-retake">
                <p className="font-semibold">{t.quality.needRetake}</p>
                <p className="mt-1">{t.quality.needRetakeDesc}</p>
              </div>
            )}
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px] text-silver">
              {([["frontal", result.imageQuality.frontalScore], ["lighting", result.imageQuality.lightingScore], ["sharpness", result.imageQuality.sharpnessScore], ["resolution", result.imageQuality.resolutionScore]] as const).map(([k, v]) => (
                <div key={k} className="rounded-lg bg-white/5 py-2">
                  <p className="text-base text-white">{v}</p>
                  <p>{t.quality[k]}</p>
                </div>
              ))}
            </div>
            {result.imageQuality.issues.length > 0 && (
              <ul className="mt-3 space-y-1 text-[11px] text-amber-100/80">
                {result.imageQuality.issues.map((i) => (
                  <li key={i.code}>⚠ {t.quality.issues[i.code]}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-line bg-panel p-5">
            <h2 className="text-sm font-semibold">{t.report.categoriesTitle}</h2>
            <div className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {catRows.map(({ key, better }) => (
                <Bar key={key} name={t.categories[key]} value={cats[key]} better={better} hint={better ? t.metrics.higherBetter : t.metrics.higherVisible} />
              ))}
            </div>
          </div>
        </section>

        {/* 얼굴 맵 */}
        {visual && (
          <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-2xl font-light">{t.report.mapTitle}</h2>
                <div className="flex gap-1 rounded-full border border-line p-0.5 text-xs" data-no-export>
                  <button onClick={() => setView("2d")} className={`rounded-full px-3 py-1 ${view === "2d" ? "bg-white text-black" : "text-silver"}`}>{t.report.view2d}</button>
                  {can3d && <button onClick={() => setView("3d")} data-testid="view-3d" className={`rounded-full px-3 py-1 ${view === "3d" ? "bg-white text-black" : "text-silver"}`}>{t.report.view3d}</button>}
                </div>
              </div>
              <p className="mt-1 text-xs text-silver">{view === "3d" ? t.report.view3dHint : t.report.mapHint}</p>
              {!can3d && <p className="mt-1 text-[11px] text-silver/60" data-no-export>{t.report.fallback2d}</p>}
              <div className="mt-3 overflow-hidden rounded-xl border border-line bg-black">
                {view === "3d" && can3d ? (
                  <div className="aspect-[4/5] w-full"><Face3D visual={visual} heatmap={heatmap} selected={selected} showZones={showZones} /></div>
                ) : (
                  <FaceMap visual={visual} heatmap={heatmap} selected={selected} showZones={showZones} onSelect={setSelected} label={t.report.mapTitle} />
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs" data-no-export>
                <span className="mr-1 text-silver">{t.report.heatmap}</span>
                <button onClick={() => setHeatmap(null)} className={`rounded-full border px-2.5 py-1 ${heatmap === null ? "border-white text-white" : "border-line text-silver"}`}>{t.report.heatmapOff}</button>
                {HEATMAP_METRICS.filter((m) => config.enabledMetrics.includes(m)).map((m) => (
                  <button key={m} data-testid={`heat-${m}`} onClick={() => setHeatmap(m)} className={`rounded-full border px-2.5 py-1 ${heatmap === m ? "border-scan bg-scan/15 text-scan2" : "border-line text-silver"}`}>{t.metrics[m].name}</button>
                ))}
                <label className="ml-auto flex items-center gap-1.5 text-silver">
                  <input type="checkbox" checked={showZones} onChange={(e) => setShowZones(e.target.checked)} className="accent-[#4fb6ff]" />
                  {t.report.zonesLayer}
                </label>
              </div>
              <p className="mt-2 text-[10px] text-silver/60">{t.zones.sideNote}</p>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-panel p-5">
                <h3 className="text-sm font-semibold">{t.report.topConcerns}</h3>
                {a.topConcerns.length === 0 ? (
                  <p className="mt-2 text-sm text-silver">{t.report.noConcerns}</p>
                ) : (
                  <ol className="mt-3 space-y-2" data-testid="top-concerns">
                    {a.topConcerns.map((c, i) => (
                      <li key={i}>
                        <button
                          onClick={() => {
                            const idx = FACE_ZONES.findIndex((z) => z.id === c.zone);
                            setSelected(idx >= 0 ? idx : null);
                            if (HEATMAP_METRICS.includes(c.metric)) setHeatmap(c.metric);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-left text-sm hover:bg-white/10"
                        >
                          <span className="font-display text-lg font-light text-scan">{i + 1}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{t.metrics[c.metric].name}</span>
                            <span className="block text-[11px] text-silver">{t.zones[c.zone]}</span>
                          </span>
                          <span className="tabular-nums text-silver">{c.severity}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              <div className="rounded-2xl border border-line bg-panel p-5">
                <h3 className="text-sm font-semibold">{t.report.zoneDetail}</h3>
                <div className="mt-2 flex flex-wrap gap-1.5" data-no-export>
                  {FACE_ZONES.map((z, i) => {
                    const zr = a.zones.find((x) => x.zone === z.id);
                    return (
                      <button key={z.id} data-testid={`zone-btn-${z.id}`} onClick={() => { setSelected(i); setNeckOpen(false); }} className={`rounded-full border px-2.5 py-1 text-[11px] ${selected === i && !neckOpen ? "border-scan bg-scan/15 text-scan2" : "border-line text-silver"}`}>
                        {t.zones[z.id]} {zr?.conditionIndex ?? "—"}
                      </button>
                    );
                  })}
                  {neck && (
                    <button onClick={() => setNeckOpen(true)} className={`rounded-full border px-2.5 py-1 text-[11px] ${neckOpen ? "border-scan bg-scan/15 text-scan2" : "border-line text-silver"}`}>
                      {t.zones.neck} {neck.conditionIndex ?? "—"}
                    </button>
                  )}
                </div>
                <div className="mt-4">
                  {neckOpen && neck ? <ZoneDetail zone={neck} /> : selectedZone ? <ZoneDetail zone={selectedZone} /> : <p className="text-sm text-silver">{t.report.selectZone}</p>}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 사진 기반 vs 설문 기반 · 측정 가능/불가 */}
        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-line bg-panel p-4">
            <h3 className="text-sm font-semibold">{t.report.measurable} <span className="ml-1 rounded bg-scan/15 px-1.5 py-0.5 text-[10px] font-normal text-scan2">{t.report.photoBased}</span></h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {a.measurable.filter((m) => config.enabledMetrics.includes(m)).map((m) => (
                <li key={m} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-silver">{t.metrics[m].name}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4">
            <h3 className="text-sm font-semibold">{t.report.notMeasurable}</h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {a.notMeasurable.map((m) => (
                <li key={m} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-silver/70 line-through decoration-silver/30">{t.notMeasurable[m as keyof typeof t.notMeasurable] ?? m}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4" data-testid="survey-summary">
            <h3 className="text-sm font-semibold">{t.report.surveyBased}</h3>
            {!survey ? (
              <p className="mt-2 text-xs text-silver">{t.report.surveyNone}</p>
            ) : (
              <ul className="mt-2 space-y-1 text-[11px] text-silver">
                {(["dryness", "oiliness", "sensitivity", "tightness", "troubleFrequency"] as const).map((k) => (survey[k] !== null ? <li key={k}>{t.survey.q[k]} — <b className="text-white">{t.survey.levels[survey[k] as number]}</b></li> : null))}
                {survey.goals.length > 0 && <li>{t.survey.goalsTitle}: <b className="text-white">{survey.goals.map((g) => t.survey.goals[g]).join(", ")}</b></li>}
              </ul>
            )}
          </div>
        </section>

        {plan && <CareView plan={plan} />}
        {visual && <Simulation visual={visual} />}

        <section className="rounded-xl border border-line bg-panel p-4">
          <h3 className="text-sm font-semibold">{t.report.limits}</h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-silver">
            {t.report.limitsList.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-silver/60">{t.common.footerDisclaimer}</p>
        </section>
      </div>

      {/* 액션 */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-5">
        <button onClick={() => exportAs("pdf")} disabled={!!busy} data-testid="save-pdf" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50">{busy === "pdf" ? t.report.saving : t.report.savePdf}</button>
        <button onClick={() => exportAs("image")} disabled={!!busy} data-testid="save-image" className="rounded-full border border-silver/40 px-5 py-2.5 text-sm disabled:opacity-50">{busy === "image" ? t.report.saving : t.report.saveImage}</button>
        {visual &&
          (consent ? (
            <button onClick={saveHistory} disabled={saved} data-testid="save-history" className="rounded-full border border-silver/40 px-5 py-2.5 text-sm disabled:opacity-60">{saved ? t.report.savedHistory : t.report.saveHistory}</button>
          ) : (
            <button onClick={() => { setHistoryConsent(true); setConsent(true); }} data-testid="enable-history" title={fmt(t.consent.history, { days: config.retention.historyDays })} className="rounded-full border border-line px-5 py-2.5 text-sm text-silver">{t.report.enableHistory}</button>
          ))}
        <Link href="/compare" className="rounded-full border border-silver/40 px-5 py-2.5 text-sm">{t.nav.compare}</Link>
        <button onClick={onRestart} data-testid="reanalyze" className="rounded-full border border-silver/40 px-5 py-2.5 text-sm">{t.common.reanalyze}</button>
        <button onClick={() => { wipe(); onRestart(); }} data-testid="delete-now" className="ml-auto rounded-full border border-rose-400/50 px-5 py-2.5 text-sm text-rose-200">{t.report.deleteNow}</button>
      </div>
      {!consent && visual && <p className="mt-2 text-[11px] text-silver/60">{t.report.historyNeedConsent} {fmt(t.consent.history, { days: config.retention.historyDays })}</p>}
      <button onClick={() => setShowJson((v) => !v)} className="mt-4 text-xs text-silver underline underline-offset-4" data-testid="toggle-json">{t.report.json}</button>
      {showJson && <pre className="mt-2 max-h-96 overflow-auto rounded-lg border border-line bg-black p-3 text-[10px] leading-relaxed text-silver" data-testid="json">{JSON.stringify({ ...result, analysis: { ...a, zones } }, null, 2)}</pre>}
    </div>
  );
}
