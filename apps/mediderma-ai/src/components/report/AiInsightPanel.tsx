"use client";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useApp, type CurrentAnalysis } from "@/lib/client/store";
import { rgbaToJpeg } from "@/lib/client/history";
import { track } from "@/lib/client/telemetry";
import type { AiInsight, AiInsightRequest } from "@/lib/aiInsight";

const VIEW_STYLE = { agree: "border-emerald-400/50 text-emerald-300", differs: "border-amber-400/50 text-amber-200", unsure: "border-line text-silver" } as const;

/**
 * Gemini AI 해설 (선택). 사용자가 이 자리에서 따로 동의하고 버튼을 눌렀을 때만 축소 사진이 서버를 거쳐 Google Gemini API 로 전송된다.
 * 결과는 서술형 의견이며 기기 내 엔진의 점수를 바꾸지 않는다.
 */
export default function AiInsightPanel({ data }: { data: CurrentAnalysis }) {
  const { t, locale } = useI18n();
  const { config, sessionId } = useApp();
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState<"idle" | "running" | "error">("idle");
  const [insight, setInsight] = useState<AiInsight | null>(null);
  if (!config.aiInsight.available || !data.visual) return null;
  const run = async () => {
    const v = data.visual;
    if (!v || !agree) return;
    setState("running");
    try {
      const { blob } = await rgbaToJpeg(v.rgba, v.width, v.height, 640, 0.82);
      const b64 = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result).split(",")[1] ?? "");
        fr.onerror = () => reject(fr.error);
        fr.readAsDataURL(blob);
      });
      const a = data.result.analysis;
      const body: AiInsightRequest = {
        consent: true,
        locale,
        sid: sessionId,
        imageBase64: b64,
        indices: {
          categories: a.categories as unknown as Record<string, number | null>,
          topConcerns: a.topConcerns,
          zones: a.zones.map((z) => ({ zone: z.zone, conditionIndex: z.conditionIndex })),
        },
        routines: [data.plan?.night, data.plan?.day].filter(Boolean) as string[],
      };
      const res = await fetch("/api/ai/insight", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(String(res.status));
      setInsight(((await res.json()) as { insight: AiInsight }).insight);
      setState("idle");
      track("ai_insight");
    } catch {
      setState("error");
    }
  };
  return (
    <section className="rounded-2xl border border-violet-300/30 bg-gradient-to-b from-violet-400/[0.07] to-transparent p-5" data-testid="ai-insight">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-xl font-light">{t.ai.title}</h2>
        <span className="rounded-full border border-violet-300/40 px-2 py-0.5 text-[10px] text-violet-200">{t.ai.badge}</span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-silver">{t.ai.desc}</p>
      {!insight ? (
        <div className="mt-4" data-no-export>
          <label className="flex gap-3 text-xs leading-relaxed text-silver">
            <input type="checkbox" data-testid="ai-consent" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-violet-400" />
            <span>{t.ai.consent}</span>
          </label>
          <button onClick={run} disabled={!agree || state === "running"} data-testid="ai-run" className="mt-3 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition disabled:opacity-40">
            {state === "running" ? t.ai.running : t.ai.run}
          </button>
          {state === "error" && <p role="alert" className="mt-2 text-sm text-rose-300" data-testid="ai-error">{t.ai.error}</p>}
        </div>
      ) : (
        <div className="mt-4 space-y-4 text-sm" data-testid="ai-result">
          <div>
            <h3 className="text-xs font-semibold text-violet-200">{t.ai.summary}</h3>
            <p className="mt-1 leading-relaxed">{insight.summary}</p>
          </div>
          {insight.observations.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-violet-200">{t.ai.observations}</h3>
              <ul className="mt-1.5 space-y-1.5">
                {insight.observations.map((o, i) => (
                  <li key={i} className="flex gap-2 text-xs leading-relaxed">
                    <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-silver">{t.zones[o.zone]}</span>
                    <span className="text-silver">{o.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {insight.agreement.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-violet-200">{t.ai.agreement}</h3>
              <ul className="mt-1.5 space-y-1.5">
                {insight.agreement.map((o, i) => (
                  <li key={i} className="flex flex-wrap items-baseline gap-2 text-xs leading-relaxed">
                    <span>{t.metrics[o.metric].name}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] ${VIEW_STYLE[o.view]}`}>{t.ai[o.view]}</span>
                    <span className="text-silver">{o.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {insight.careExplanation && (
            <div>
              <h3 className="text-xs font-semibold text-violet-200">{t.ai.care}</h3>
              <p className="mt-1 text-xs leading-relaxed text-silver">{insight.careExplanation}</p>
            </div>
          )}
          <p className="border-t border-line pt-2 text-[10px] text-silver/60">{t.ai.badge} · {t.ai.limits} · {insight.model}</p>
        </div>
      )}
    </section>
  );
}
