"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { fmt, useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/client/store";
import { track } from "@/lib/client/telemetry";
import { AnalysisError, runFaceAnalysis } from "@/lib/client/runAnalysis";
import { listHistory, type HistoryEntry } from "@/lib/client/history";
import { ALIGN_POINTS, compareResults, similarityTransform, type ChangeVerdict, type CompareResult } from "@/lib/analysis/compare";
import { FACE_ZONES } from "@/lib/analysis/zones";
import type { AnalysisResult, ImageQuality } from "@/lib/analysis/types";
import { validateImageFile } from "./UploadBox";
import CompareSlider from "./report/CompareSlider";

/** 비교에 필요한 최소 데이터: 분석 결과 + 정규화 얼굴 이미지 + 랜드마크 */
interface Side {
  result: AnalysisResult;
  canvas: HTMLCanvasElement;
  landmarks: Float32Array;
}
type SideState = { status: "empty" } | { status: "running" } | { status: "ok"; side: Side } | { status: "failed"; quality: ImageQuality | null; error?: string };

const VERDICT_STYLE: Record<ChangeVerdict, string> = {
  no_change: "border-line text-silver",
  improved: "border-emerald-400/50 text-emerald-300",
  worsened: "border-rose-400/50 text-rose-300",
  not_comparable: "border-amber-400/40 text-amber-200",
};

async function entryToSide(e: HistoryEntry): Promise<Side> {
  const bmp = await createImageBitmap(e.image);
  const c = document.createElement("canvas");
  c.width = e.width;
  c.height = e.height;
  c.getContext("2d")!.drawImage(bmp, 0, 0, e.width, e.height);
  return { result: e.result, canvas: c, landmarks: Float32Array.from(e.landmarks) };
}

export default function CompareFlow() {
  const { t } = useI18n();
  const { config, sessionId } = useApp();
  const params = useSearchParams();
  const [before, setBefore] = useState<SideState>({ status: "empty" });
  const [after, setAfter] = useState<SideState>({ status: "empty" });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [weeks, setWeeks] = useState("");
  const [count, setCount] = useState("");
  const [zone, setZone] = useState<number | null>(null);
  const tracked = useRef(false);

  useEffect(() => {
    listHistory(config.retention.historyDays)
      .then(async (h) => {
        setHistory(h);
        const b = h.find((e) => e.id === params.get("before"));
        const a = h.find((e) => e.id === params.get("after"));
        if (b) setBefore({ status: "ok", side: await entryToSide(b) });
        if (a) setAfter({ status: "ok", side: await entryToSide(a) });
      })
      .catch(() => {});
  }, [config.retention.historyDays, params]);

  const load = async (file: File | undefined, set: (s: SideState) => void) => {
    if (!file) return;
    const err = validateImageFile(file);
    if (err) return set({ status: "failed", quality: null, error: t.errors[err] });
    set({ status: "running" });
    tracked.current = false;
    try {
      const out = await runFaceAnalysis(file, sessionId, config);
      if (!out.result.imageQuality.passed || !out.visual) return set({ status: "failed", quality: out.result.imageQuality });
      const v = out.visual;
      const c = document.createElement("canvas");
      c.width = v.width;
      c.height = v.height;
      c.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(v.rgba), v.width, v.height), 0, 0);
      set({ status: "ok", side: { result: out.result, canvas: c, landmarks: v.landmarks } });
    } catch (e) {
      set({ status: "failed", quality: null, error: t.errors[e instanceof AnalysisError ? e.code : "analysisFailed"] });
    }
  };

  const cmp: CompareResult | null = useMemo(() => {
    if (before.status !== "ok" || after.status !== "ok") return null;
    return compareResults(before.side.result, after.side.result, config.calibration);
  }, [before, after, config.calibration]);

  // AFTER 를 BEFORE 좌표계로 정렬 (얼굴 랜드마크 닮음 변환)
  const aligned = useMemo(() => {
    if (before.status !== "ok" || after.status !== "ok") return null;
    const b = before.side;
    const a = after.side;
    const m = similarityTransform(a.landmarks, b.landmarks, ALIGN_POINTS);
    const c = document.createElement("canvas");
    c.width = b.canvas.width;
    c.height = b.canvas.height;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.setTransform(m.a, m.b, -m.b, m.a, m.tx, m.ty);
    ctx.drawImage(a.canvas, 0, 0);
    return c;
  }, [before, after]);

  useEffect(() => {
    if (cmp && !tracked.current) {
      tracked.current = true;
      track("compare_run", { verdicts: cmp.categories.map((c) => c.verdict[0]).join("") });
    }
  }, [cmp]);

  const picker = (label: string, title: string, state: SideState, set: (s: SideState) => void, id: string) => (
    <div className="rounded-2xl border border-line bg-panel p-4" data-testid={`side-${id}`} data-status={state.status}>
      <p className="font-display text-xs tracking-[0.25em] text-scan2">{title}</p>
      <p className="text-sm">{label}</p>
      <div className="mt-3 flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl border border-dashed border-silver/30 bg-black/40">
        {state.status === "ok" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={state.side.canvas.toDataURL("image/jpeg", 0.8)} alt={label} className="h-full w-full object-cover" />
        ) : state.status === "running" ? (
          <p className="animate-pulse text-sm text-silver">{t.progress.title}</p>
        ) : (
          <p className="px-4 text-center text-xs text-silver">{id === "before" ? t.compare.pickBefore : t.compare.pickAfter}</p>
        )}
      </div>
      {state.status === "failed" && (
        <div role="alert" className="mt-2 rounded-lg border border-rose-400/50 bg-rose-400/10 p-2 text-xs text-rose-100" data-testid={`side-${id}-failed`}>
          <p className="font-semibold">{fmt(t.compare.failed, { which: label })}</p>
          {state.error && <p>{state.error}</p>}
          {state.quality?.issues.filter((i) => i.severity === "blocker").map((i) => <p key={i.code}>· {t.quality.issues[i.code]}</p>)}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="cursor-pointer rounded-full bg-white px-4 py-2 text-xs font-semibold text-black">
          {id === "before" ? t.compare.pickBefore : t.compare.pickAfter}
          <input type="file" data-testid={`${id}-input`} accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { load(e.target.files?.[0], set); e.target.value = ""; }} />
        </label>
        {history.length > 0 && (
          <select aria-label={t.compare.fromHistory} className="rounded-full border border-line bg-panel px-3 py-2 text-xs text-silver" value="" onChange={async (e) => { const h = history.find((x) => x.id === e.target.value); if (h) set({ status: "ok", side: await entryToSide(h) }); }}>
            <option value="">{t.compare.fromHistory}</option>
            {history.map((h) => (
              <option key={h.id} value={h.id}>{new Date(h.savedAt).toLocaleString()}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );

  const zc = cmp && zone !== null ? cmp.zones.find((z) => z.zone === FACE_ZONES[zone].id) ?? null : null;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8" data-testid="compare">
      <h1 className="font-display text-3xl font-light">{t.compare.title}</h1>
      <p className="mt-2 text-sm text-silver">{t.compare.desc}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {picker(t.compare.beforeLabel, t.compare.before, before, setBefore, "before")}
        {picker(t.compare.afterLabel, t.compare.after, after, setAfter, "after")}
      </div>
      <fieldset className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-panel p-3 text-xs text-silver">
        <legend className="px-1">{t.compare.usage}</legend>
        <label>{t.compare.usageWeeks} <input inputMode="numeric" value={weeks} onChange={(e) => setWeeks(e.target.value.replace(/\D/g, "").slice(0, 3))} className="ml-1 w-14 rounded border border-line bg-black px-2 py-1 text-white" /></label>
        <label>{t.compare.usageCount} <input inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value.replace(/\D/g, "").slice(0, 4))} className="ml-1 w-14 rounded border border-line bg-black px-2 py-1 text-white" /></label>
      </fieldset>

      {cmp && aligned && before.status === "ok" && (
        <div className="mt-8 space-y-6" data-testid="compare-result">
          <div className={`rounded-xl border p-4 text-sm ${cmp.conditionIssues.length ? "border-amber-400/50 bg-amber-400/10 text-amber-100" : "border-emerald-400/40 bg-emerald-400/5 text-emerald-200"}`} data-testid="condition" data-issues={cmp.conditionIssues.join(",")}>
            <p className="font-semibold">{t.compare.conditionTitle}</p>
            <p className="mt-1 text-xs">{cmp.conditionIssues.length ? t.compare.conditionBad : t.compare.conditionOk}</p>
            {cmp.conditionIssues.length > 0 && (
              <ul className="mt-1 list-disc pl-4 text-xs">
                {cmp.conditionIssues.map((c) => (
                  <li key={c}>{t.compare.conditions[c]}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <CompareSlider left={before.side.canvas} right={aligned} leftLabel={t.compare.before} rightLabel={t.compare.after} hint={t.compare.sliderHint} testId="compare-slider" />
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-panel p-4">
                <h2 className="text-sm font-semibold">{t.compare.byCategory}</h2>
                <ul className="mt-3 space-y-2">
                  {cmp.categories.map((c) => (
                    <li key={c.metric} className="flex items-center justify-between gap-2 text-sm" data-testid={`cat-${c.metric}`} data-verdict={c.verdict}>
                      <span>{t.metrics[c.metric].name}</span>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums text-xs text-silver">{c.before ?? "—"} → {c.after ?? "—"}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${VERDICT_STYLE[c.verdict]}`}>{t.compare.verdictShort[c.verdict]}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-line bg-panel p-4">
                <h2 className="text-sm font-semibold">{t.compare.byZone}</h2>
                <p className="text-[11px] text-silver">{t.compare.zoneHint}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cmp.zones.map((z, i) => (
                    <button key={z.zone} onClick={() => setZone(i)} data-testid={`cz-${z.zone}`} className={`rounded-full border px-2.5 py-1 text-[11px] ${zone === i ? "bg-white/10" : ""} ${VERDICT_STYLE[z.verdict]}`}>{t.zones[z.zone]}</button>
                  ))}
                </div>
                {zc && (
                  <div className="mt-3 border-t border-line pt-3" data-testid="zone-change">
                    <p className="text-sm font-semibold">{t.zones[zc.zone]} — {t.compare.verdict[zc.verdict]}</p>
                    <ul className="mt-2 space-y-1.5 text-xs">
                      {zc.metrics.map((m) => (
                        <li key={m.metric} className="flex items-center justify-between gap-2">
                          <span className="text-silver">{t.metrics[m.metric].name}</span>
                          <span className="flex items-center gap-2">
                            <span className="tabular-nums">{m.before ?? "—"} → {m.after ?? "—"}</span>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] ${VERDICT_STYLE[m.verdict]}`}>{t.compare.verdictShort[m.verdict]}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-1 text-xs text-silver">
            {(weeks || count) && <p>{t.compare.usage}: {weeks && `${t.compare.usageWeeks} ${weeks}`} {count && `· ${t.compare.usageCount} ${count}`}</p>}
            <p>{fmt(t.compare.noiseNote, { n: cmp.noiseBand })}</p>
            <p>{t.compare.honesty}</p>
            <p>{t.common.footerDisclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
}
