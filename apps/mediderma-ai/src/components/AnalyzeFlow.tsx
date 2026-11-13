"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { fmt, useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/client/store";
import { track } from "@/lib/client/telemetry";
import { hasHistoryConsent, setHistoryConsent } from "@/lib/client/session";
import { AnalysisError, runFaceAnalysis, runNeckAnalysis } from "@/lib/client/runAnalysis";
import { buildCarePlan } from "@/lib/care/recommend";
import type { ProgressStage, ProviderOutput } from "@/lib/analysis/provider";
import type { ImageQuality, SurveyAnswers, ZoneResult } from "@/lib/analysis/types";
import UploadBox from "./UploadBox";
import Survey from "./Survey";
import Report from "./report/Report";

type Step = "consent" | "capture" | "running" | "failed" | "error" | "survey" | "report";
const STAGES: ProgressStage[] = ["loading_model", "detecting", "quality", "analyzing"];

function ReportProblem({ context }: { context: string }) {
  const { t, locale } = useI18n();
  const { sessionId } = useApp();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) return <p className="mt-4 text-xs text-scan2">{t.errors.reportSent}</p>;
  return (
    <div className="mt-6 text-left">
      <button onClick={() => setOpen((v) => !v)} className="text-xs text-silver underline underline-offset-4" data-testid="report-problem">{t.errors.reportTitle}</button>
      {open && (
        <div className="mt-2 rounded-xl border border-line bg-panel p-3">
          <p className="text-[11px] text-silver">{t.errors.reportDesc}</p>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value.slice(0, 1000))} placeholder={t.errors.reportPlaceholder} rows={3} className="mt-2 w-full rounded-lg border border-line bg-black p-2 text-sm focus:outline-none focus:ring-1 focus:ring-scan" />
          <button
            disabled={msg.trim().length < 3}
            onClick={() => fetch("/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sid: sessionId, locale, message: msg, context }) }).then(() => setSent(true)).catch(() => setSent(true))}
            className="mt-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black disabled:opacity-40"
          >
            {t.errors.reportSend}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AnalyzeFlow() {
  const { t } = useI18n();
  const { config, sessionId, pendingFile, setPendingFile, analysis, setAnalysis } = useApp();
  const [step, setStep] = useState<Step>(analysis ? "report" : "consent");
  const [agree, setAgree] = useState(false);
  const [keep, setKeep] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [stage, setStage] = useState<ProgressStage>("loading_model");
  const [quality, setQuality] = useState<ImageQuality | null>(null);
  const [errorCode, setErrorCode] = useState<AnalysisError["code"] | null>(null);
  const [neckFile, setNeckFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const pending = useRef<{ out: ProviderOutput; neck: ZoneResult | null } | null>(null);
  const consented = useRef(false);

  useEffect(() => setKeep(hasHistoryConsent()), []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  // 세션 만료 등으로 결과가 지워지면 처음으로
  useEffect(() => {
    if (!analysis && step === "report") setStep(consented.current ? "capture" : "consent");
  }, [analysis, step]);

  const run = useCallback(
    async (file: File) => {
      setStep("running");
      setStage("loading_model");
      setErrorCode(null);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(file);
      });
      track("analysis_started");
      try {
        const out = await runFaceAnalysis(file, sessionId, config, setStage);
        setQuality(out.result.imageQuality);
        if (!out.result.imageQuality.passed || !out.visual) {
          const first = out.result.imageQuality.issues.find((i) => i.severity === "blocker");
          track("upload_rejected", { reason: first?.code ?? "unknown" });
          setStep("failed");
          return;
        }
        const neck = neckFile ? await runNeckAnalysis(neckFile, config) : null;
        track("analysis_succeeded", { concerns: out.result.analysis.topConcerns.map((c) => c.metric), needsRetake: out.result.analysis.needsRetake });
        pending.current = { out, neck };
        setStep("survey");
      } catch (e) {
        const code = e instanceof AnalysisError ? e.code : "analysisFailed";
        track("analysis_failed", { reason: code });
        setErrorCode(code);
        setStep("error");
      }
    },
    [config, sessionId, neckFile],
  );

  const finish = (survey: SurveyAnswers | null) => {
    const p = pending.current;
    if (!p) return;
    const plan = buildCarePlan(p.out.result, survey, { notice: config.recommendation.noticeThreshold, routinesEnabled: config.routinesEnabled, extraZones: p.neck ? [p.neck] : [] });
    const result = { ...p.out.result, survey: survey ? { ...survey, deviceContraindication: false } : null, careRecommendations: plan.recommendations };
    if (survey) track("survey_submitted");
    track("care_selected", { routine: plan.night ?? "none", tech: plan.recommendations.map((r) => r.technology) });
    setAnalysis({ result, visual: p.out.visual, survey, plan, neck: p.neck });
    pending.current = null;
    setStep("report");
    window.scrollTo({ top: 0 });
  };

  const acceptConsent = () => {
    if (!agree) {
      setConsentError(true);
      return;
    }
    consented.current = true;
    setHistoryConsent(keep);
    if (pendingFile) {
      const f = pendingFile;
      setPendingFile(null);
      run(f);
    } else setStep("capture");
  };
  const restart = () => {
    setAnalysis(null);
    setQuality(null);
    setNeckFile(null);
    setStep(consented.current ? "capture" : "consent");
    window.scrollTo({ top: 0 });
  };

  if (step === "report" && analysis) return <Report data={analysis} onRestart={restart} />;
  if (step === "survey") return <Survey onSubmit={finish} onSkip={() => finish(null)} />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          {step === "consent" && (
            <div data-testid="consent">
              <h1 className="font-display text-2xl font-light">{t.consent.title}</h1>
              <div className="mt-5 space-y-4 rounded-2xl border border-line bg-panel p-5 text-sm">
                <label className="flex gap-3">
                  <input type="checkbox" data-testid="consent-required" checked={agree} onChange={(e) => { setAgree(e.target.checked); setConsentError(false); }} className="mt-1 h-4 w-4 shrink-0 accent-[#4fb6ff]" />
                  <span className="leading-relaxed">{t.consent.processing}</span>
                </label>
                <label className="flex gap-3 text-silver">
                  <input type="checkbox" data-testid="consent-history" checked={keep} onChange={(e) => setKeep(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#4fb6ff]" />
                  <span className="leading-relaxed">{fmt(t.consent.history, { days: config.retention.historyDays })}</span>
                </label>
                <p className="text-xs leading-relaxed text-silver/80">{t.consent.stats}</p>
                <p className="text-xs text-silver/80">{t.consent.age}</p>
                <Link href="/privacy" className="inline-block text-xs text-scan2 underline underline-offset-4">{t.consent.details}</Link>
              </div>
              {consentError && <p role="alert" className="mt-3 text-sm text-rose-300" data-testid="consent-error">{t.consent.required}</p>}
              <button onClick={acceptConsent} data-testid="consent-agree" className="mt-5 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black hover:bg-scan2">{t.consent.agree}</button>
            </div>
          )}

          {step === "capture" && (
            <div data-testid="capture">
              <h1 className="font-display text-2xl font-light">{t.capture.title}</h1>
              <div className="mt-5 grid gap-5 md:grid-cols-[1.3fr_1fr]">
                <div>
                  <UploadBox onFile={run} testId="capture-upload" />
                  <div className="mt-4 rounded-xl border border-line bg-panel p-4">
                    <p className="text-sm font-semibold">{t.capture.neckTitle}</p>
                    <p className="mt-1 text-xs leading-relaxed text-silver">{t.capture.neckDesc}</p>
                    {neckFile ? (
                      <p className="mt-2 text-xs text-scan2">
                        ✓ {t.capture.neckAdded}{" "}
                        <button onClick={() => setNeckFile(null)} className="ml-2 text-silver underline">{t.capture.neckRemove}</button>
                      </p>
                    ) : (
                      <label className="mt-2 inline-block cursor-pointer rounded-full border border-silver/40 px-4 py-1.5 text-xs">
                        {t.capture.neckAdd}
                        <input type="file" data-testid="neck-input" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setNeckFile(e.target.files?.[0] ?? null)} />
                      </label>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-panel p-4">
                  <p className="text-sm font-semibold">{t.capture.guideTitle}</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-silver">
                    {t.capture.guide.map((g, i) => (
                      <li key={i} className="flex gap-2"><span className="text-scan2">✓</span>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {step === "running" && (
            <div className="text-center" data-testid="running">
              <h1 className="font-display text-2xl font-light">{t.progress.title}</h1>
              <div className="relative mx-auto mt-10 w-56 [perspective:800px]">
                <div aria-hidden className="absolute -inset-8 rounded-full border border-scan/40 [transform:rotateX(68deg)]" style={{ animation: "orbit 5s linear infinite" }}>
                  <span className="absolute -top-1 left-1/2 h-2 w-2 rounded-full bg-scan2 shadow-glow" />
                </div>
                <div aria-hidden className="absolute -inset-14 rounded-full border border-dashed border-silver/20 [transform:rotateX(68deg)]" style={{ animation: "orbit 9s linear infinite reverse" }} />
              <div className="relative aspect-[4/5] w-56 overflow-hidden rounded-2xl border border-scan/40 bg-black shadow-glow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {preview && <img src={preview} alt="" className="h-full w-full object-cover opacity-70" />}
                <div className="absolute inset-x-0 h-10 animate-[scan_1.8s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-scan/60 to-transparent" />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(rgba(79,182,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(79,182,255,0.12)_1px,transparent_1px)] bg-[size:22px_22px]" />
              </div>
              </div>
              <ol className="mx-auto mt-6 max-w-xs space-y-2 text-left text-sm">
                {STAGES.map((s) => {
                  const done = STAGES.indexOf(s) < STAGES.indexOf(stage) || stage === "done";
                  const cur = s === stage;
                  return (
                    <li key={s} className={`flex items-center gap-2 ${done ? "text-silver" : cur ? "text-white" : "text-silver/40"}`}>
                      <span className={`h-2 w-2 rounded-full ${done ? "bg-scan2" : cur ? "animate-pulse bg-white" : "bg-line"}`} />
                      {t.progress[s]}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {step === "failed" && quality && (
            <div data-testid="quality-failed">
              <h1 className="font-display text-2xl font-light">{t.quality.failTitle}</h1>
              <p className="mt-2 text-sm text-silver">{t.quality.failDesc}</p>
              <ul className="mt-5 space-y-2">
                {quality.issues.map((i) => (
                  <li key={i.code} data-testid={`issue-${i.code}`} data-severity={i.severity} className={`rounded-xl border p-3 text-sm ${i.severity === "blocker" ? "border-rose-400/50 bg-rose-400/10 text-rose-100" : "border-amber-400/40 bg-amber-400/5 text-amber-100"}`}>
                    {t.quality.issues[i.code]}
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-xl border border-line bg-panel p-4">
                <p className="text-sm font-semibold">{t.capture.guideTitle}</p>
                <ul className="mt-2 grid gap-1 text-xs text-silver sm:grid-cols-2">
                  {t.capture.guide.map((g, i) => (
                    <li key={i}>✓ {g}</li>
                  ))}
                </ul>
              </div>
              <button onClick={() => setStep("capture")} data-testid="retake" className="mt-5 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black hover:bg-scan2">{t.common.retake}</button>
              <ReportProblem context={`quality:${quality.issues.map((i) => i.code).join(",")}`} />
            </div>
          )}

          {step === "error" && (
            <div className="text-center" data-testid="analysis-error">
              <p role="alert" className="rounded-xl border border-rose-400/50 bg-rose-400/10 p-4 text-sm text-rose-100">{t.errors[errorCode ?? "analysisFailed"]}</p>
              <button onClick={() => setStep("capture")} className="mt-5 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black">{t.common.retake}</button>
              <ReportProblem context={`error:${errorCode}`} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
