"use client";
/**
 * 전후 비교 결과 맨 위 "한눈에 보는 변화" — 어르신도 바로 알 수 있게 큰 글씨로.
 *  - 방사형 그래프: 이전(회색 점선) vs 지금(파란색)
 *  - 좋아짐 / 그대로 / 나빠짐 / 비교 어려움 개수와 한 줄 요약
 *  - 항목별 큰 표시
 * 판정은 compareResults() 의 결과(촬영 조건 차이·잡음 범위 반영)를 그대로 쓴다. 숫자 차이만으로 '좋아짐'을 만들지 않는다.
 */
import { fmt, useI18n } from "@/lib/i18n";
import type { ChangeVerdict, CompareResult } from "@/lib/analysis/compare";
import type { AnalysisResult, MetricKey, ZoneId } from "@/lib/analysis/types";
import { AXES, Radar, type AxisId } from "./report/CareAtAGlance";

/** 축 → 비교 판정에 쓸 지표 (턱선은 턱선 영역 판정으로) */
const AXIS_METRIC: Partial<Record<AxisId, MetricKey>> = {
  texture: "texture",
  wrinkle: "wrinkleVisibility",
  pore: "poreVisibility",
  tone: "toneUniformity",
  pigment: "pigmentVisibility",
  redness: "rednessVisibility",
  eye: "underEyeDarkness",
};
const JAW_ZONES: ZoneId[] = ["left_jawline", "right_jawline"];

const STYLE: Record<ChangeVerdict, { icon: string; cls: string }> = {
  improved: { icon: "👍", cls: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200" },
  no_change: { icon: "➖", cls: "border-line bg-white/5 text-silver" },
  worsened: { icon: "👎", cls: "border-rose-400/50 bg-rose-400/10 text-rose-200" },
  not_comparable: { icon: "⚠️", cls: "border-amber-400/50 bg-amber-400/10 text-amber-200" },
};

function axisVerdict(cmp: CompareResult, id: AxisId): ChangeVerdict {
  const m = AXIS_METRIC[id];
  if (m) return cmp.categories.find((c) => c.metric === m)?.verdict ?? "not_comparable";
  const vs = cmp.zones.filter((z) => JAW_ZONES.includes(z.zone)).map((z) => z.verdict);
  if (vs.length === 0) return "not_comparable";
  if (vs.includes("worsened")) return "worsened";
  if (vs.includes("improved")) return "improved";
  if (vs.every((v) => v === "not_comparable")) return "not_comparable";
  return "no_change";
}

export default function CompareGlance({ cmp, before, after }: { cmp: CompareResult; before: AnalysisResult; after: AnalysisResult }) {
  const { t } = useI18n();
  const g = t.compareGlance;
  const labels = AXES.map((a) => t.glance.axes[a.id]);
  const bv = AXES.map((a) => a.value(before.analysis.categories));
  const av = AXES.map((a) => a.value(after.analysis.categories));
  const verdicts = AXES.map((a) => axisVerdict(cmp, a.id));
  const count = (v: ChangeVerdict) => verdicts.filter((x) => x === v).length;
  const improved = count("improved");
  const headline = cmp.conditionIssues.length > 0 && improved === 0 ? g.headlineCondition : improved > 0 ? fmt(g.headlineImproved, { n: improved }) : g.headlineSame;

  return (
    <section className="rounded-3xl border border-scan/30 bg-gradient-to-b from-scan/[0.07] to-panel p-5 sm:p-7" data-testid="compare-glance">
      <h2 className="text-2xl font-bold sm:text-3xl">{g.title}</h2>
      <p className="mt-3 text-xl font-semibold leading-snug sm:text-2xl" data-testid="compare-headline">{headline}</p>
      {cmp.conditionIssues.length > 0 && <p className="mt-2 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3 text-base text-amber-100">⚠️ {g.conditionWarn}</p>}

      <div className="mt-5 grid items-center gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <Radar values={av} before={bv} weak={new Set()} labels={labels} testId="compare-radar" />
          <div className="mt-2 flex justify-center gap-5 text-base text-silver">
            <span className="flex items-center gap-2"><span className="inline-block h-0 w-6 border-t-2 border-dashed border-slate-400" />{g.legendBefore}</span>
            <span className="flex items-center gap-2"><span className="inline-block h-0 w-6 border-t-2 border-scan2" />{g.legendAfter}</span>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["improved", "no_change", "worsened", "not_comparable"] as const).map((v) => (
              <div key={v} className={`rounded-2xl border px-3 py-3 text-center ${STYLE[v].cls}`} data-testid={`cg-count-${v}`}>
                <p className="text-2xl">{STYLE[v].icon}</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">{count(v)}</p>
                <p className="text-sm">{g.verdict[v]}</p>
              </div>
            ))}
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {AXES.map((a, i) => (
              <li key={a.id} className={`flex items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 ${STYLE[verdicts[i]].cls}`}>
                <span className="text-lg font-semibold">
                  {STYLE[verdicts[i]].icon} {labels[i]}
                </span>
                <span className="text-base tabular-nums">
                  {bv[i] ?? "—"} → <b>{av[i] ?? "—"}</b>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-4 text-sm text-silver-soft">{g.note}</p>
    </section>
  );
}
