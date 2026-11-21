"use client";
import { useRef, useState } from "react";
import { fmt, useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/client/store";
import { track } from "@/lib/client/telemetry";
import { COMMON_CAUTIONS, CONTRAINDICATIONS, GUIDE_VIDEO, LINKS, PRODUCTS, ROUTINES, TECH_CHAPTER, TECH_TRACK, type ProductId, type RoutineId, type Technology, type VideoChapter } from "@/lib/care/knowledge";
import type { CategoryScores } from "@/lib/analysis/types";
import GuideVideo, { type GuideVideoHandle } from "./GuideVideo";
import type { CarePlan, ProductReason } from "@/lib/care/recommend";
import type { CareRecommendation } from "@/lib/analysis/types";

const TECH_COLOR = { rf: "text-amber-300 border-amber-300/40", ultrasonic: "text-scan2 border-scan2/40", iontophoresis: "text-violet-300 border-violet-300/40", general: "text-silver border-silver/40" } as const;

function RoutineCard({ id, focus, onWatch }: { id: RoutineId; focus: CarePlan["focusAreas"]; onWatch: (c: VideoChapter) => void }) {
  const { t } = useI18n();
  const r = ROUTINES[id];
  const kb = t.kb.routines[id];
  return (
    <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5" data-testid={`routine-${id}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-base font-semibold">{kb.name}</h4>
        <span className="text-xs text-silver">{fmt(t.care.minutes, { n: r.totalMinutes })}</span>
      </div>
      <ol className="mt-3 space-y-3">
        {r.steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className={`mt-0.5 h-fit shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${TECH_COLOR[s.technology]}`}>{fmt(t.care.step, { n: i + 1 })}</span>
            <div className="min-w-0 text-sm">
              <p className="font-medium">
                {t.care.tech[s.technology].name} · {fmt(t.care.minutes, { n: s.minutes })}
              </p>
              <p className="text-xs text-silver">{t.care.productLabel}: {t.kb.products[s.product].name}</p>
              <p className="mt-1 text-xs leading-relaxed text-silver/90">{kb.steps[i]}</p>
              <button onClick={() => onWatch(TECH_CHAPTER[s.technology])} data-no-export className="mt-1 text-[11px] text-scan2 underline underline-offset-4">▶ {t.care.video.watch}</button>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs font-medium text-scan2">* {t.care.mistFinish}</p>
      <div className="mt-3 border-t border-line pt-3">
        <p className="text-xs font-semibold text-silver">{t.care.directions}</p>
        <ul className="mt-1.5 space-y-1 text-xs text-silver">
          {kb.directions.map((d, i) => {
            const hot = focus.includes(r.directionAreas[i]);
            return (
              <li key={i} className={hot ? "text-white" : ""}>
                {hot && <span className="mr-1.5 rounded bg-scan/20 px-1.5 py-0.5 text-[10px] text-scan2">{t.care.focus}</span>}
                {d}
              </li>
            );
          })}
        </ul>
      </div>
      <p className="mt-3 text-[10px] text-silver/50">{r.source}</p>
    </div>
  );
}

function Reasons({ rec }: { rec: CareRecommendation }) {
  const { t } = useI18n();
  return (
    <ul className="mt-2 space-y-1 text-xs text-silver">
      {rec.reasons.map((r, i) => (
        <li key={i} className="flex gap-1.5">
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${r.type === "observation" ? "bg-scan/15 text-scan2" : "bg-white/10 text-silver"}`}>
            {r.type === "observation" ? t.report.photoBased : t.report.surveyBased}
          </span>
          <span>
            {r.type === "observation" && r.zone && r.metric
              ? fmt(t.care.reasonObservation, { zone: t.zones[r.zone], metric: t.metrics[r.metric].name, value: r.value ?? "-" })
              : r.type === "survey"
                ? fmt(t.care.reasonSurvey, { item: t.care.surveyItems[r.key as keyof typeof t.care.surveyItems] ?? r.key ?? "" })
                : fmt(t.care.reasonGoal, { item: t.survey.goals[r.key as keyof typeof t.survey.goals] ?? r.key ?? "" })}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function CareView({ plan, categories }: { plan: CarePlan; categories: CategoryScores }) {
  const { t } = useI18n();
  const video = useRef<GuideVideoHandle>(null);
  const watch = (c: VideoChapter) => video.current?.play(c);
  const techs = [...new Set(plan.recommendations.map((r) => r.technology).filter((x): x is Technology => x !== "general"))];
  const { config } = useApp();
  const [night, setNight] = useState<RoutineId | null>(plan.night);
  const alt = plan.night && plan.alternativeNight ? (night === plan.night ? plan.alternativeNight : plan.night) : null;
  const cautionKeys = [...new Set([...COMMON_CAUTIONS, ...plan.recommendations.flatMap((r) => r.cautions)])] as (keyof typeof t.kb.cautions)[];
  const usedIn = (p: ProductId) => {
    const names: string[] = [];
    for (const rid of [plan.day, night]) if (rid && ROUTINES[rid].steps.some((s) => s.product === p)) names.push(t.kb.routines[rid].name);
    return names;
  };
  const products = plan.products.filter((p) => config.products[p]?.enabled);
  const reasonText = (r: ProductReason) =>
    r.type === "observation"
      ? fmt(t.care.reasonObservation, { zone: t.zones[r.zone], metric: t.metrics[r.metric].name, value: r.value })
      : r.type === "survey"
        ? fmt(t.care.reasonSurvey, { item: t.care.surveyItems[r.key as keyof typeof t.care.surveyItems] ?? r.key })
        : r.type === "goal"
          ? fmt(t.care.reasonGoal, { item: t.survey.goals[r.key as keyof typeof t.survey.goals] ?? r.key })
          : r.type === "routine"
            ? t.care.reasonRoutine
            : t.care.reasonGuide;
  return (
    <section className="space-y-6" data-testid="care-view">
      <div>
        <h2 className="font-display text-2xl font-light">{t.care.title}</h2>
        <p className="mt-1 text-xs text-silver">{t.care.functionVsFit}</p>
      </div>

      {plan.deviceBlocked && (
        <div role="alert" className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-4 text-sm text-amber-100" data-testid="device-blocked">
          <p className="font-semibold">{t.care.blockedTitle}</p>
          <p className="mt-1 text-xs leading-relaxed">{t.care.blockedDesc}</p>
        </div>
      )}
      {plan.rednessNotice && <p role="note" className="rounded-xl border border-rose-400/40 bg-rose-400/10 p-4 text-xs leading-relaxed text-rose-100">{t.care.rednessNotice}</p>}

      {!plan.deviceBlocked && (
        <div className="rounded-2xl border border-line bg-ink/60 p-5" data-testid="device-how">
          <h3 className="text-sm font-semibold tracking-wide text-silver">{t.care.deviceHowTitle}</h3>
          <p className="mt-1 text-xs text-silver/70">{t.care.deviceHowDesc}</p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-5">
            {t.care.deviceSteps.map((d, i) => (
              <li key={i} className="rounded-xl border border-line p-3 text-xs leading-relaxed text-silver">
                <span className="mb-1 block font-display text-lg text-scan2">{String(i + 1).padStart(2, "0")}</span>
                {d}
              </li>
            ))}
          </ol>
          {techs.length > 0 && (
            <p className="mt-3 text-xs text-silver">
              {t.care.myFunctions}:{" "}
              {techs.map((tech) => (
                <span key={tech} className={`ml-1 inline-block rounded-full border px-2 py-0.5 text-[10px] tracking-widest ${TECH_COLOR[tech]}`}>{t.care.tech[tech].en}</span>
              ))}
            </p>
          )}
        </div>
      )}

      {/* 기능별 추천 */}
      <div>
        <h3 className="text-sm font-semibold tracking-wide text-silver">{t.care.techTitle}</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {plan.recommendations.map((rec) => (
            <div key={rec.id} className="rounded-2xl border border-line bg-panel p-4" data-testid={`rec-${rec.id}`}>
              <p className={`inline-block rounded-full border px-2 py-0.5 text-[10px] tracking-widest ${TECH_COLOR[rec.technology]}`}>{t.care.tech[rec.technology].en}</p>
              <h4 className="mt-2 font-semibold">{t.care.recTitles[rec.id as keyof typeof t.care.recTitles] ?? rec.id}</h4>
              <p className="mt-1 text-xs text-silver">{t.care.tech[rec.technology].desc}</p>
              <p className="mt-3 text-[11px] font-semibold text-silver">{t.care.whyTitle}</p>
              <Reasons rec={rec} />
              {rec.zones.length > 0 && <p className="mt-2 text-[11px] text-silver/70">{rec.zones.map((z) => t.zones[z]).join(" · ")}</p>}
              {rec.technology !== "general" && (
                <button onClick={() => watch(TECH_CHAPTER[rec.technology as Technology])} data-testid={`watch-${rec.id}`} data-no-export className="mt-2 rounded-full border border-scan/40 px-3 py-1 text-[11px] text-scan2 hover:bg-scan/10">▶ {t.care.video.watch}</button>
              )}
              <ul className="mt-2 space-y-1 border-t border-line pt-2 text-[11px] leading-relaxed text-amber-100/80">
                {rec.cautions.map((c) => (
                  <li key={c}>⚠ {t.kb.cautions[c as keyof typeof t.kb.cautions] ?? c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 개인 맞춤 루틴 */}
      {!plan.deviceBlocked && (night || plan.day) && (
        <div>
          <h3 className="font-display text-lg tracking-[0.15em]">{t.care.planTitle}</h3>
          <p className="mt-1 text-xs text-silver">{t.care.planDesc}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-silver">
            <span>{t.care.driversTitle}:</span>
            {(Object.keys(plan.drivers) as (keyof CarePlan["drivers"])[]).map((k) => (
              <span key={k} className="rounded-full bg-white/5 px-2 py-0.5">{t.care.drivers[k]} {plan.drivers[k]}</span>
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {plan.day && (
              <div>
                <p className="mb-2 font-display text-xs tracking-[0.25em] text-scan2">{t.care.day}</p>
                <p className="mb-2 text-xs text-silver">{t.care.dayCheck}</p>
                <RoutineCard id={plan.day} focus={plan.focusAreas} onWatch={watch} />
              </div>
            )}
            {night && (
              <div>
                <p className="mb-2 font-display text-xs tracking-[0.25em] text-scan2">{t.care.night}</p>
                <p className="mb-2 text-xs text-silver">{t.care.nightPrep}</p>
                <RoutineCard id={night} focus={plan.focusAreas} onWatch={watch} />
                {alt && (
                  <button
                    onClick={() => {
                      setNight(alt);
                      track("care_selected", { routine: alt });
                    }}
                    className="mt-2 text-xs text-scan2 underline underline-offset-4"
                    data-testid="alt-routine"
                  >
                    {t.care.alternative}: {t.kb.routines[alt].name} →
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="mt-4 rounded-xl border border-line bg-panel p-4 text-xs leading-relaxed text-silver">
            <p className="font-semibold text-white">{t.care.frequencyTitle}</p>
            <p className="mt-1">{t.care.frequency[plan.frequency]}</p>
          </div>
        </div>
      )}

      {/* 공식 사용법 영상 */}
      {!plan.deviceBlocked && <GuideVideo ref={video} />}

      {/* 사용하면 무엇이 달라지는지 — 공식 관리 포인트 ↔ 내 사진의 추적 지표 */}
      {!plan.deviceBlocked && techs.length > 0 && (
        <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5" data-testid="track-plan">
          <h3 className="text-base font-semibold">{t.care.track.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-silver">{t.care.track.desc}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {techs.map((tech) => (
              <div key={tech} className="rounded-xl border border-line bg-ink/60 p-3">
                <p className={`inline-block rounded-full border px-2 py-0.5 text-[10px] tracking-widest ${TECH_COLOR[tech]}`}>{t.care.tech[tech].en}</p>
                <p className="mt-2 text-[11px] font-semibold text-silver">{t.care.track.points}</p>
                <ul className="mt-1 flex flex-wrap gap-1">
                  {t.care.tech[tech].tags.map((tag) => (
                    <li key={tag} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-silver">{tag}</li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] font-semibold text-silver">{t.care.track.metrics}</p>
                <ul className="mt-1 space-y-1 text-xs">
                  {TECH_TRACK[tech].map((k) => (
                    <li key={k} className="flex items-baseline justify-between gap-2">
                      <span>{t.categories[k]}</span>
                      <span className="tabular-nums text-silver">{t.care.track.now} <b className="text-white">{categories[k] ?? "—"}</b></span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <ol className="mt-4 grid gap-2 text-xs text-silver sm:grid-cols-2 lg:grid-cols-4">
            {t.care.track.steps.map((s, i) => (
              <li key={i} className="flex gap-2 rounded-lg bg-white/5 p-2.5">
                <span className="font-display text-scan2">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex flex-wrap gap-3 text-xs" data-no-export>
            <a href="/compare" className="text-scan2 underline underline-offset-4">{t.sim.goCompare} →</a>
            <button onClick={() => watch("beforeAfter")} className="text-scan2 underline underline-offset-4">▶ {t.care.video.chapters.beforeAfter} (≈ {Math.floor(GUIDE_VIDEO.chapters[4].start / 60)}:{String(GUIDE_VIDEO.chapters[4].start % 60).padStart(2, "0")})</button>
          </div>
        </div>
      )}

      {/* 주의사항 */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-panel p-4">
          <h3 className="text-sm font-semibold">{t.care.cautionsTitle}</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-silver">
            {cautionKeys.map((c) => (t.kb.cautions[c] ? <li key={c}>{t.kb.cautions[c]}</li> : null))}
          </ul>
        </div>
        <div className="rounded-xl border border-line bg-panel p-4">
          <h3 className="text-sm font-semibold">{t.care.contraTitle}</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-silver">
            {CONTRAINDICATIONS.map((c) => (
              <li key={c}>{t.kb.contra[c]}</li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-silver/60">
            {t.care.sourceNote} ·{" "}
            <a href={LINKS.guide} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">{t.care.guideLink}</a> ·{" "}
            <a href={LINKS.guidebookPdf} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">{t.care.guidebookLink}</a>
          </p>
        </div>
      </div>

      {/* 추천 제품 — 공식 스킨케어 가이드 순서 */}
      <div data-testid="products">
        <h3 className="text-sm font-semibold tracking-wide text-silver">{t.care.productsTitle}</h3>
        <p className="mt-1 text-xs text-silver/70">{t.care.productsDesc}</p>
        <div className="mt-3 rounded-xl border border-line bg-ink/60 p-3" data-testid="guide-order">
          <p className="text-[11px] font-semibold tracking-wide text-silver">{t.care.guideOrderTitle}</p>
          <ol className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-silver">
            {products.map((p, i) => (
              <li key={p} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden className="text-silver/40">→</span>}
                <span className="rounded-full border border-line px-2 py-0.5">
                  <span className="text-scan2">{t.care.guideSteps[PRODUCTS[p].step]}</span> · {t.kb.products[p].name}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const kb = t.kb.products[p];
            const reasons = plan.productReasons[p] ?? [];
            return (
              <article key={p} data-testid={`product-card-${p}`} className="flex flex-col rounded-2xl border border-line bg-gradient-to-b from-white/[0.05] to-transparent p-4">
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="rounded-full border border-scan2/40 px-2 py-0.5 tracking-wide text-scan2">{t.care.guideSteps[PRODUCTS[p].step]}</span>
                  <span className="rounded-full border border-line px-2 py-0.5 text-silver">{t.care.when[PRODUCTS[p].when]}</span>
                  {kb.fn && <span className="rounded-full border border-line px-2 py-0.5 text-silver">{kb.fn}</span>}
                </div>
                <p className="mt-2 text-sm font-semibold">{kb.name}</p>
                <p className="mt-0.5 text-xs italic text-silver/80">“{kb.tagline}”</p>
                {reasons.length > 0 && (
                  <div className="mt-3" data-testid={`product-why-${p}`}>
                    <p className="text-[11px] font-semibold text-silver">{t.care.productWhy}</p>
                    <ul className="mt-1 space-y-1 text-xs text-silver">
                      {reasons.map((r, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span aria-hidden className="text-scan2">•</span>
                          <span>{reasonText(r)}{r.type === "routine" && usedIn(p).length > 0 ? ` (${usedIn(p).join(" / ")})` : ""}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-silver">{t.care.productPoints}</p>
                  <ul className="mt-1 space-y-0.5 text-xs leading-relaxed text-silver/90">
                    {kb.points.map((pt, i) => <li key={i}>– {pt}</li>)}
                  </ul>
                </div>
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-silver">{t.care.productHow}</p>
                  <p className="mt-1 text-xs leading-relaxed text-silver/90">{kb.how}</p>
                </div>
                {PRODUCTS[p].hasHumanTest && <p className="mt-3 text-[11px] leading-relaxed text-silver/60">{t.care.humanTest}</p>}
                <a
                  href={config.products[p].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("product_click", { product: p })}
                  data-testid={`product-${p}`}
                  className="mt-auto pt-3 text-xs text-scan2 hover:underline"
                >
                  {t.care.viewProduct} ↗
                </a>
              </article>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-silver/60">{t.care.productSource}</p>
      </div>

      {/* 체험 CTA */}
      <div className="rounded-2xl border border-scan/30 bg-gradient-to-r from-scan/15 to-transparent p-6">
        <h3 className="text-lg font-semibold">{t.care.trialTitle}</h3>
        <p className="mt-1 text-sm text-silver">{t.care.trialDesc}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={config.links.freeTrial} target="_blank" rel="noopener noreferrer" onClick={() => track("trial_click")} data-testid="trial-cta" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-scan2">{t.care.trialCta}</a>
          <a href={config.links.partners} target="_blank" rel="noopener noreferrer" onClick={() => track("partner_click")} className="rounded-full border border-silver/40 px-6 py-3 text-sm hover:border-scan">{t.care.partnerCta}</a>
        </div>
      </div>
    </section>
  );
}
