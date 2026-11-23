"use client";
import { useState } from "react";
import { fmt, useI18n } from "@/lib/i18n";
import { CONTRAINDICATIONS } from "@/lib/care/knowledge";
import type { CareGoal, SurveyAnswers, SurveyLevel } from "@/lib/analysis/types";

const QUESTIONS = ["dryness", "oiliness", "sensitivity", "tightness", "troubleFrequency"] as const;
const GOALS: CareGoal[] = ["brightening", "wrinkle_firming", "soothing", "moisture", "contour", "pore_texture"];
const ROUTINES = ["none", "basic", "regular", "device"] as const;
const PRODUCTS = ["toner", "serum", "cream", "sunscreen", "mask", "retinoid", "acid", "vitaminC"] as const;

export default function Survey({ onSubmit, onSkip }: { onSubmit: (s: SurveyAnswers) => void; onSkip: () => void }) {
  const { t } = useI18n();
  const [s, setS] = useState<SurveyAnswers>({ dryness: null, oiliness: null, sensitivity: null, tightness: null, troubleFrequency: null, goals: [], routineLevel: null, currentProducts: [], deviceContraindication: false });
  const chip = (on: boolean) => `rounded-full border-2 px-4 py-2.5 text-base transition ${on ? "border-scan bg-scan/15 text-scan2" : "border-line text-silver hover:border-silver/50"}`;
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  return (
    <div className="mx-auto max-w-2xl px-4 py-8" data-testid="survey">
      <h1 className="text-2xl font-bold sm:text-3xl">{t.survey.title}</h1>
      <p className="mt-2 text-base text-silver">{t.survey.desc}</p>
      <p className="mt-1 text-base text-scan2">{t.survey.optionalNote}</p>
      <div className="mt-6 space-y-4">
        {QUESTIONS.map((q, qi) => (
          <fieldset key={q} className={`rounded-2xl border p-4 ${s[q] !== null ? "border-scan/40 bg-scan/[0.05]" : "border-line bg-panel"}`}>
            <legend className="sr-only">{t.survey.q[q]}</legend>
            <p className="text-lg font-semibold" aria-hidden><span className="mr-2 text-scan2">{qi + 1}.</span>{t.survey.q[q]}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {t.survey.levels.map((label, i) => (
                <button key={i} type="button" data-testid={`q-${q}-${i}`} aria-pressed={s[q] === i} onClick={() => setS({ ...s, [q]: i as SurveyLevel })} className={chip(s[q] === i)}>{label}</button>
              ))}
            </div>
          </fieldset>
        ))}
        <p className="pt-4 text-lg font-semibold text-silver">{t.survey.more}</p>
        <fieldset>
          <legend className="text-base font-semibold">{t.survey.goalsTitle}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button key={g} type="button" data-testid={`goal-${g}`} aria-pressed={s.goals.includes(g)} onClick={() => setS({ ...s, goals: toggle(s.goals, g) })} className={chip(s.goals.includes(g))}>{t.survey.goals[g]}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-base font-semibold">{t.survey.routineTitle}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ROUTINES.map((r) => (
              <button key={r} type="button" aria-pressed={s.routineLevel === r} onClick={() => setS({ ...s, routineLevel: r })} className={chip(s.routineLevel === r)}>{t.survey.routine[r]}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-base font-semibold">{t.survey.productsTitle}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRODUCTS.map((p) => (
              <button key={p} type="button" aria-pressed={s.currentProducts.includes(p)} onClick={() => setS({ ...s, currentProducts: toggle(s.currentProducts, p) })} className={chip(s.currentProducts.includes(p))}>{t.survey.products[p]}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className="rounded-xl border border-amber-400/40 bg-amber-400/5 p-4">
          <legend className="px-1 text-sm font-semibold text-amber-100">{t.survey.contraTitle}</legend>
          <p className="text-xs leading-relaxed text-silver">{t.survey.contraDesc}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-silver">
            {CONTRAINDICATIONS.map((c) => (
              <li key={c}>{t.kb.contra[c]}</li>
            ))}
          </ul>
          <label className="mt-3 flex cursor-pointer items-center gap-3 text-base">
            <input type="checkbox" data-testid="contra-check" checked={s.deviceContraindication} onChange={(e) => setS({ ...s, deviceContraindication: e.target.checked })} className="h-6 w-6 shrink-0 accent-amber-400" />
            {t.survey.contraCheck}
          </label>
        </fieldset>
      </div>
      {/* 휴대폰에서 항상 보이는 하단 버튼 */}
      <div className="sticky bottom-0 -mx-4 mt-8 border-t border-line bg-ink/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
        <p className="mb-2 text-sm text-silver" data-testid="survey-progress">{fmt(t.survey.answered, { n: QUESTIONS.filter((q) => s[q] !== null).length, total: QUESTIONS.length })}</p>
        <div className="flex gap-3">
          <button onClick={() => onSubmit(s)} data-testid="survey-submit" className="min-w-0 flex-1 whitespace-nowrap rounded-full bg-white px-4 py-4 text-[15px] font-bold text-black hover:bg-scan2 min-[400px]:text-lg sm:flex-none sm:px-8">{t.survey.submit} →</button>
          <button onClick={onSkip} data-testid="survey-skip" className="shrink-0 whitespace-nowrap rounded-full border-2 border-silver/40 px-4 py-4 text-sm text-silver min-[400px]:px-6 min-[400px]:text-base">{t.common.skip}</button>
        </div>
      </div>
    </div>
  );
}
