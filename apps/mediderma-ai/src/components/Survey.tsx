"use client";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { CONTRAINDICATIONS } from "@/lib/care/knowledge";
import type { CareGoal, SurveyAnswers, SurveyLevel } from "@/lib/analysis/types";

const QUESTIONS = ["dryness", "oiliness", "sensitivity", "tightness", "troubleFrequency"] as const;
const GOALS: CareGoal[] = ["brightening", "wrinkle_firming", "soothing", "moisture", "contour", "pore_texture"];
const ROUTINES = ["none", "basic", "regular", "device"] as const;
const PRODUCTS = ["toner", "serum", "cream", "sunscreen", "mask", "retinoid", "acid", "vitaminC"] as const;

export default function Survey({ onSubmit, onSkip }: { onSubmit: (s: SurveyAnswers) => void; onSkip: () => void }) {
  const { t } = useI18n();
  const [s, setS] = useState<SurveyAnswers>({ dryness: null, oiliness: null, sensitivity: null, tightness: null, troubleFrequency: null, goals: [], routineLevel: null, currentProducts: [], deviceContraindication: false });
  const chip = (on: boolean) => `rounded-full border px-3 py-1.5 text-xs transition ${on ? "border-scan bg-scan/15 text-scan2" : "border-line text-silver hover:border-silver/50"}`;
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  return (
    <div className="mx-auto max-w-2xl px-4 py-8" data-testid="survey">
      <h1 className="font-display text-2xl font-light">{t.survey.title}</h1>
      <p className="mt-2 text-sm text-silver">{t.survey.desc}</p>
      <div className="mt-6 space-y-5">
        {QUESTIONS.map((q) => (
          <fieldset key={q}>
            <legend className="text-sm">{t.survey.q[q]}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {t.survey.levels.map((label, i) => (
                <button key={i} type="button" data-testid={`q-${q}-${i}`} aria-pressed={s[q] === i} onClick={() => setS({ ...s, [q]: i as SurveyLevel })} className={chip(s[q] === i)}>{label}</button>
              ))}
            </div>
          </fieldset>
        ))}
        <fieldset>
          <legend className="text-sm">{t.survey.goalsTitle}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button key={g} type="button" data-testid={`goal-${g}`} aria-pressed={s.goals.includes(g)} onClick={() => setS({ ...s, goals: toggle(s.goals, g) })} className={chip(s.goals.includes(g))}>{t.survey.goals[g]}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm">{t.survey.routineTitle}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ROUTINES.map((r) => (
              <button key={r} type="button" aria-pressed={s.routineLevel === r} onClick={() => setS({ ...s, routineLevel: r })} className={chip(s.routineLevel === r)}>{t.survey.routine[r]}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm">{t.survey.productsTitle}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRODUCTS.map((p) => (
              <button key={p} type="button" aria-pressed={s.currentProducts.includes(p)} onClick={() => setS({ ...s, currentProducts: toggle(s.currentProducts, p) })} className={chip(s.currentProducts.includes(p))}>{t.survey.products[p]}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className="rounded-xl border border-amber-400/40 bg-amber-400/5 p-4">
          <legend className="px-1 text-sm font-semibold text-amber-100">{t.survey.contraTitle}</legend>
          <p className="text-xs leading-relaxed text-silver">{t.survey.contraDesc}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-silver">
            {CONTRAINDICATIONS.map((c) => (
              <li key={c}>{t.kb.contra[c]}</li>
            ))}
          </ul>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" data-testid="contra-check" checked={s.deviceContraindication} onChange={(e) => setS({ ...s, deviceContraindication: e.target.checked })} className="h-4 w-4 accent-amber-400" />
            {t.survey.contraCheck}
          </label>
        </fieldset>
      </div>
      <div className="mt-8 flex gap-3">
        <button onClick={() => onSubmit(s)} data-testid="survey-submit" className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black hover:bg-scan2">{t.survey.submit}</button>
        <button onClick={onSkip} data-testid="survey-skip" className="rounded-full border border-silver/40 px-6 py-3 text-sm text-silver">{t.common.skip}</button>
      </div>
    </div>
  );
}
