"use client";
import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { fmt, useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/client/store";
import { track } from "@/lib/client/telemetry";
import { hasHistoryConsent, setHistoryConsent } from "@/lib/client/session";
import { AnalysisError, runFaceAnalysis, runNeckAnalysis } from "@/lib/client/runAnalysis";
import { buildCarePlan } from "@/lib/care/recommend";
import type { ProgressStage, ProviderOutput } from "@/lib/analysis/provider";
import type { AnalysisResult, ImageQuality, SurveyAnswers, VisualData, ZoneResult } from "@/lib/analysis/types";
import UploadBox from "./UploadBox";
import Survey from "./Survey";
import Report from "./report/Report";
import StepBar from "./StepBar";
import ProfileSteps from "./ProfileSteps";
import ScanStage from "./ScanStage";
import { EMPTY_PROFILE, type ScanProfile } from "@/lib/client/store";

type Step = "consent" | "profile" | "capture" | "confirm" | "running" | "failed" | "error" | "survey" | "report";
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
          <p className="text-xs text-silver">{t.errors.reportDesc}</p>
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
  const [profile, setProfile] = useState<ScanProfile>(EMPTY_PROFILE);
  const [chosen, setChosen] = useState<File | null>(null);
  const visualDone = useRef<(() => void) | null>(null);
  const visualFinished = useRef(false);
  const [reveal, setReveal] = useState<{ visual: VisualData; result: AnalysisResult } | null>(null);
  const startedAt = useRef(0);
  /** 사용자가 기다리다 취소하면 늦게 끝난 분석 결과는 버린다 */
  const cancelled = useRef(false);
  const durationMs = useRef<number | null>(null);
  // 단계가 바뀌면 화면 맨 위(단계 표시·제목)부터 보이게
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);
  const onVisualDone = useCallback(() => {
    visualFinished.current = true;
    visualDone.current?.();
  }, []);
  const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const consented = useRef(false);

  useEffect(() => setKeep(hasHistoryConsent()), []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  // 세션 만료 등으로 결과가 지워지면 처음으로
  useEffect(() => {
    if (!analysis && step === "report") setStep(consented.current ? "capture" : "consent");
  }, [analysis, step]);

  const run = useCallback(
    async (file: File) => {
      visualFinished.current = false;
      visualDone.current = null;
      setReveal(null);
      cancelled.current = false;
      setStep("running");
      setStage("loading_model");
      setErrorCode(null);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(file);
      });
      track("analysis_started");
      try {
        startedAt.current = performance.now();
        const out = await runFaceAnalysis(file, sessionId, config, setStage);
        durationMs.current = performance.now() - startedAt.current;
        if (cancelled.current) return;
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
        // 스캔 연출이 끝나면 실제 결과로 '분석 완료 연출'을 보여 준다
        setReveal({ visual: out.visual, result: out.result });
        // 스캔 연출이 100% 를 채운 뒤 넘어간다
        await new Promise<void>((resolve) => {
          if (visualFinished.current) return resolve();
          visualDone.current = resolve;
          setStage("done");
        });
        setStep("survey");
      } catch (e) {
        if (cancelled.current) return;
        const code = e instanceof AnalysisError ? e.code : "analysisFailed";
        track("analysis_failed", { reason: e instanceof AnalysisError && e.detail ? `${code}:${e.detail}` : code });
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
    setAnalysis({ result, visual: p.out.visual, survey, plan, neck: p.neck, profile, durationMs: durationMs.current });
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
    track("consent_given", { history: keep });
    setStep("profile");
  };
  const choose = (f: File) => {
    setChosen(f);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(f);
    });
    setStep("confirm");
  };
  const afterProfile = (p: ScanProfile) => {
    setProfile(p);
    track("profile_done", {
      ...(p.forWhom ? { who: p.forWhom } : {}),
      ...(p.makeup !== null ? { makeup: p.makeup } : {}),
      ...(p.age !== null ? { age: String(p.age) } : {}),
      ...(p.skinType ? { skin: p.skinType } : {}),
    });
    if (pendingFile) {
      const f = pendingFile;
      setPendingFile(null);
      choose(f);
    } else setStep("capture");
    window.scrollTo({ top: 0 });
  };
  const restart = () => {
    setAnalysis(null);
    setQuality(null);
    setNeckFile(null);
    setChosen(null);
    setStep(consented.current ? "capture" : "consent");
    window.scrollTo({ top: 0 });
  };

  if (step === "report" && analysis)
    return (
      <>
        <StepBar current={4} />
        <Report data={analysis} onRestart={restart} />
      </>
    );
  if (step === "survey")
    return (
      <>
        <StepBar current={3} />
        <Survey onSubmit={finish} onSkip={() => finish(null)} />
      </>
    );

  return (
    <>
    <StepBar current={step === "consent" ? 0 : step === "profile" ? 1 : 2} />
    <div className="mx-auto max-w-3xl px-4 py-6">
      <AnimatePresence mode="wait">
        <m.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          {step === "consent" && (
            <div data-testid="consent">
              <h1 className="text-2xl font-bold sm:text-3xl">{t.consent.title}</h1>
              <label
                className={`mt-5 flex cursor-pointer gap-4 rounded-2xl border-2 p-5 transition ${agree ? "border-scan bg-scan/10" : consentError ? "border-rose-400/70 bg-rose-400/5" : "border-line bg-panel hover:border-silver/50"}`}
              >
                <input type="checkbox" data-testid="consent-required" checked={agree} onChange={(e) => { setAgree(e.target.checked); setConsentError(false); }} className="mt-1 h-7 w-7 shrink-0 accent-[#3b8fb8]" />
                <span className="text-base leading-relaxed">
                  {t.consent.processing}
                  {!agree && <span className="mt-2 block text-sm font-semibold text-scan2"><Icon name="tap" size={18} className="mr-1" />{t.consent.tapHint}</span>}
                  {config.aiInsight.available && <span className="mt-1 block text-sm text-silver">{t.ai.exception}</span>}
                </span>
              </label>
              <label className="mt-3 flex cursor-pointer gap-4 rounded-2xl border border-line bg-panel p-5 text-silver">
                <input type="checkbox" data-testid="consent-history" checked={keep} onChange={(e) => setKeep(e.target.checked)} className="mt-1 h-6 w-6 shrink-0 accent-[#3b8fb8]" />
                <span className="text-base leading-relaxed">{fmt(t.consent.history, { days: config.retention.historyDays })}</span>
              </label>
              <div className="mt-3 space-y-1 px-1 text-sm leading-relaxed text-silver">
                <p>{t.consent.stats}</p>
                <p>{t.consent.age}</p>
                <Link href="/privacy" className="inline-block text-scan2 underline underline-offset-4">{t.consent.details}</Link>
              </div>
              {consentError && <p role="alert" className="mt-3 text-base text-rose-300" data-testid="consent-error">{t.consent.required}</p>}
              <button onClick={acceptConsent} data-testid="consent-agree" className={`mt-5 w-full rounded-full px-8 py-4 text-lg font-bold transition sm:w-auto ${agree ? "bg-white text-black hover:bg-scan2" : "bg-line text-silver"}`}>{t.consent.agree} →</button>
            </div>
          )}

          {step === "profile" && <ProfileSteps initial={profile} onDone={afterProfile} />}

          {step === "confirm" && chosen && (
            <div data-testid="photo-confirm-step">
              <h1 className="text-2xl font-bold sm:text-3xl">{t.fit.confirm.title}</h1>
              <p className="mt-2 text-base text-silver">{t.fit.confirm.desc}</p>
              <div className="mx-auto mt-5 aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl border border-line bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {preview && <img src={preview} alt="" className="h-full w-full object-cover" />}
              </div>
              {profile.makeup && <p className="mx-auto mt-3 max-w-sm rounded-2xl bg-amber-300/10 p-3 text-base text-amber-100"><Icon name="bulb" size={18} className="mr-1.5" />{t.fit.pf.makeup.note}</p>}
              <div className="mx-auto mt-5 grid max-w-sm gap-3">
                <button onClick={() => run(chosen)} data-testid="photo-confirm" className="rounded-full bg-white px-8 py-4 text-lg font-bold text-black hover:bg-scan2"><Icon name="check" size={20} strokeWidth={2} className="mr-1.5" />{t.fit.confirm.ok}</button>
                <button onClick={() => { setChosen(null); setStep("capture"); }} data-testid="photo-again" className="rounded-full border-2 border-silver/40 px-8 py-4 text-lg text-white"><Icon name="refresh" size={20} className="mr-1.5" />{t.fit.confirm.again}</button>
              </div>
            </div>
          )}

          {step === "capture" && (
            <div data-testid="capture">
              <h1 className="text-2xl font-bold sm:text-3xl">{t.capture.easyTitle}</h1>
              <p className="mt-2 text-base text-silver">{t.capture.easyDesc}</p>
              <ul className="mt-4 grid grid-cols-3 gap-2" data-testid="capture-tips">
                {t.capture.tips.map(([, label], ti) => (
                  <li key={label} className="rounded-2xl border border-line bg-panel px-2 py-3 text-center">
                    <Icon name={(["sun", "face", "glasses"] as const)[ti] ?? "sparkle"} size={30} strokeWidth={1.3} className="mx-auto block text-brand" />
                    <span className="mt-1 block text-sm font-semibold leading-tight">{label}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <UploadBox onFile={choose} testId="capture-upload" large />
              </div>
              <details className="mt-4 rounded-2xl border border-line bg-panel p-4">
                <summary className="cursor-pointer text-base font-semibold">{t.capture.moreTips}</summary>
                <ul className="mt-2 space-y-1.5 text-sm text-silver">
                  {t.capture.guide.map((g, i) => (
                    <li key={i} className="flex gap-2"><Icon name="check" size={18} strokeWidth={2} className="mt-0.5 text-scan2" />{g}</li>
                  ))}
                </ul>
              </details>
              <details className="mt-3 rounded-2xl border border-line bg-panel p-4" open={!!neckFile}>
                <summary className="cursor-pointer text-base font-semibold">{t.capture.neckToggle}</summary>
                <p className="mt-2 text-sm leading-relaxed text-silver">{t.capture.neckDesc}</p>
                {neckFile ? (
                  <p className="mt-2 text-sm text-scan2">
                    <Icon name="checkCircle" size={18} className="mr-1 text-scan2" />{t.capture.neckAdded}{" "}
                    <button onClick={() => setNeckFile(null)} className="ml-2 text-silver underline">{t.capture.neckRemove}</button>
                  </p>
                ) : (
                  <label className="mt-2 inline-block cursor-pointer rounded-full border border-silver/40 px-5 py-2.5 text-sm">
                    {t.capture.neckAdd}
                    <input type="file" data-testid="neck-input" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setNeckFile(e.target.files?.[0] ?? null)} />
                  </label>
                )}
              </details>
            </div>
          )}

          {step === "running" && <ScanStage preview={preview} stage={stage} minMs={reduceMotion ? 1500 : 6500} onVisualDone={onVisualDone} reveal={reveal} onCancel={() => { cancelled.current = true; setStep("capture"); }} />}

          {step === "failed" && quality && (
            <div data-testid="quality-failed">
              <h1 className="text-2xl font-bold">{t.quality.failTitle}</h1>
              <p className="mt-2 text-base text-silver">{t.quality.failDesc}</p>
              <ul className="mt-5 space-y-2">
                {quality.issues.map((i) => (
                  <li key={i.code} data-testid={`issue-${i.code}`} data-severity={i.severity} className={`rounded-xl border p-4 text-base ${i.severity === "blocker" ? "border-rose-400/50 bg-rose-400/10 text-rose-100" : "border-amber-400/40 bg-amber-400/5 text-amber-100"}`}>
                    {t.quality.issues[i.code]}
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-xl border border-line bg-panel p-4">
                <p className="text-sm font-semibold">{t.capture.guideTitle}</p>
                <ul className="mt-2 grid gap-1 text-xs text-silver sm:grid-cols-2">
                  {t.capture.guide.map((g, i) => (
                    <li key={i} className="flex gap-2"><Icon name="check" size={16} strokeWidth={2} className="mt-0.5 shrink-0" />{g}</li>
                  ))}
                </ul>
              </div>
              <button onClick={() => setStep("capture")} data-testid="retake" className="mt-5 w-full rounded-full bg-white px-8 py-4 text-lg font-bold text-black hover:bg-scan2 sm:w-auto">{t.common.retake}</button>
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
        </m.div>
      </AnimatePresence>
    </div>
    </>
  );
}
