"use client";
/**
 * 리포트 맨 위 "한눈에 보는 내 피부".
 * 어르신도 바로 이해할 수 있게 큰 글씨·짧은 문장·그림(제품 사진)으로
 *  ① 방사형 그래프: 어디가 부족한지 (바깥쪽 = 좋음)
 *  ② 먼저 관리할 곳 3곳
 *  ③ 언제 · 어떤 제품 · 더마홈 어떤 기능 · 몇 분 · 어디를 어느 방향으로
 *  ④ 결과 확인: 4주 뒤 같은 조건으로 다시 찍어 전후 비교
 * 관리 방법은 모두 공식 CARE GUIDE 루틴(knowledge.ts ROUTINES)의 실제 단계에서 가져온다.
 */
import Link from "next/link";
import { motion } from "framer-motion";
import { fmt, useI18n } from "@/lib/i18n";
import { ROUTINES, PRODUCTS, type ProductId, type RoutineId, type Technology } from "@/lib/care/knowledge";
import type { CarePlan } from "@/lib/care/recommend";
import type { CategoryScores } from "@/lib/analysis/types";

export type AxisId = "texture" | "wrinkle" | "pore" | "tone" | "pigment" | "redness" | "eye" | "jaw";
type Area = "jaw" | "cheek" | "nose" | "forehead" | "eye" | "neck";

/** 축 → 카테고리 지수 (모두 '높을수록 좋음'으로 맞춘다) */
export const AXES: { id: AxisId; value: (c: CategoryScores) => number | null }[] = [
  { id: "texture", value: (c) => c.textureUniformity },
  { id: "wrinkle", value: (c) => (c.wrinkleVisibility === null ? null : 100 - c.wrinkleVisibility) },
  { id: "pore", value: (c) => (c.poreVisibility === null ? null : 100 - c.poreVisibility) },
  { id: "tone", value: (c) => c.toneUniformity },
  { id: "pigment", value: (c) => (c.pigmentVisibility === null ? null : 100 - c.pigmentVisibility) },
  { id: "redness", value: (c) => (c.rednessVisibility === null ? null : 100 - c.rednessVisibility) },
  { id: "eye", value: (c) => c.eyeAreaCondition },
  { id: "jaw", value: (c) => c.jawlineTexture },
];

/** 축 → 공식 루틴의 한 단계 + 문지를 부위 */
const AXIS_CARE: Record<AxisId, { routine: RoutineId; step: number; area: Area }> = {
  texture: { routine: "night_wrinkle", step: 1, area: "cheek" },
  wrinkle: { routine: "night_wrinkle", step: 1, area: "eye" },
  jaw: { routine: "night_wrinkle", step: 1, area: "jaw" },
  pore: { routine: "night_brightening", step: 1, area: "nose" },
  pigment: { routine: "night_brightening", step: 1, area: "cheek" },
  tone: { routine: "night_brightening", step: 0, area: "cheek" },
  redness: { routine: "night_soothing", step: 0, area: "cheek" },
  eye: { routine: "day_depuff", step: 0, area: "eye" },
};

const TECH_STYLE: Record<Technology, string> = {
  rf: "border-amber-300/50 text-amber-200",
  ultrasonic: "border-scan2/50 text-scan2",
  iontophoresis: "border-violet-300/50 text-violet-200",
};

function level(v: number) {
  return v < 40 ? 0 : v < 60 ? 1 : v < 75 ? 2 : 3;
}

/** 방사형 그래프. before 를 주면 이전 값을 점선 회색으로 함께 그린다(전후 비교용). */
export function Radar({ values, weak, labels, before, testId = "glance-radar" }: { values: (number | null)[]; weak: Set<number>; labels: string[]; before?: (number | null)[]; testId?: string }) {
  const N = values.length;
  const C = 160;
  const R = 100;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    return [C + Math.cos(a) * R * (v / 100), C + Math.sin(a) * R * (v / 100)] as const;
  };
  const poly = values.map((v, i) => pt(i, v ?? 0).join(",")).join(" ");
  return (
    <svg viewBox="0 0 320 320" className="mx-auto w-full max-w-[380px]" role="img" aria-label={labels.join(", ")} data-testid={testId}>
      {[25, 50, 75, 100].map((r) => (
        <polygon key={r} points={values.map((_, i) => pt(i, r).join(",")).join(" ")} fill="none" stroke="#1f2a36" strokeWidth={r === 100 ? 1.4 : 1} />
      ))}
      {values.map((_, i) => {
        const [x, y] = pt(i, 100);
        return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="#1f2a36" />;
      })}
      {before && <polygon points={before.map((v, i) => pt(i, v ?? 0).join(",")).join(" ")} fill="rgba(148,163,184,0.10)" stroke="#94a3b8" strokeWidth={1.8} strokeDasharray="5 4" />}
      <motion.polygon
        points={poly}
        fill="rgba(79,182,255,0.22)"
        stroke="#7dd3fc"
        strokeWidth={2.2}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: [0.2, 0.75, 0.2, 1] }}
        style={{ transformOrigin: `${C}px ${C}px`, filter: "drop-shadow(0 0 8px rgba(79,182,255,0.5))" }}
      />
      {values.map((v, i) => {
        if (v === null) return null;
        const [x, y] = pt(i, v);
        return <circle key={i} cx={x} cy={y} r={weak.has(i) ? 6 : 3.5} fill={weak.has(i) ? "#fcd34d" : "#e0f2fe"} stroke={weak.has(i) ? "#05070a" : "none"} strokeWidth={1.5} />;
      })}
      {labels.map((l, i) => {
        const [x, y] = pt(i, 128);
        const v = values[i];
        const b = before?.[i];
        // 정확히 좌우에 놓이는 이름은 길면 그래프 밖으로 잘린다(베트남어·러시아어 등) → 가운데에 가까운 빈칸에서 두 줄로 나눈다
        const side = Math.abs(Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / N)) > 0.9;
        let lines = [l];
        if (side && l.length > 7 && l.includes(" ")) {
          const cuts = [...l].map((ch, k) => (ch === " " ? k : -1)).filter((k) => k > 0);
          const cut = cuts.reduce((best, k) => (Math.abs(k - l.length / 2) < Math.abs(best - l.length / 2) ? k : best), cuts[0]);
          lines = [l.slice(0, cut), l.slice(cut + 1)];
        }
        return (
          <text key={i} x={x} y={y - (lines.length - 1) * 8} textAnchor="middle" dominantBaseline="middle" fill={weak.has(i) ? "#fde68a" : "#f1f5f9"} style={{ fontSize: 15, fontWeight: weak.has(i) ? 800 : 600 }}>
            {lines.map((line, k) => (
              <tspan key={k} x={x} dy={k === 0 ? 0 : 16}>
                {line}
              </tspan>
            ))}
            <tspan x={x} dy={17} style={{ fontSize: 14, fontWeight: 500 }} fill={weak.has(i) ? "#fde68a" : "#7dd3fc"}>
              {before ? `${b ?? "—"}→${v ?? "—"}` : (v ?? "—")}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}

export default function CareAtAGlance({ categories, plan }: { categories: CategoryScores; plan: CarePlan | null }) {
  const { t } = useI18n();
  const g = t.glance;
  const values = AXES.map((a) => a.value(categories));
  const order = values.map((v, i) => ({ v, i })).filter((x): x is { v: number; i: number } => x.v !== null).sort((a, b) => a.v - b.v);
  const weakList = order.filter((x) => x.v < 75).slice(0, 3);
  const weak = new Set(weakList.map((x) => x.i));
  const blocked = plan?.deviceBlocked ?? false;
  const freq = plan?.frequency === "gentle" ? g.freq.gentle : g.freq.standard;

  // 같은 관리 단계로 묶이는 축은 한 카드로 합친다
  const cards: { key: string; axes: AxisId[]; routine: RoutineId; step: number; area: Area }[] = [];
  for (const { i } of weakList) {
    const id = AXES[i].id;
    const care = AXIS_CARE[id];
    const key = `${care.routine}:${care.step}`;
    const found = cards.find((c) => c.key === key);
    if (found) found.axes.push(id);
    else cards.push({ key, axes: [id], ...care });
  }

  return (
    <section className="rounded-3xl border border-scan/30 bg-gradient-to-b from-scan/[0.07] to-panel p-5 sm:p-7" data-testid="care-glance">
      <h2 className="text-2xl font-bold sm:text-3xl">{g.title}</h2>
      <p className="mt-2 text-base leading-relaxed text-silver sm:text-lg">{g.sub}</p>

      <div className="mt-5 grid items-center gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Radar values={values} weak={weak} labels={AXES.map((a) => g.axes[a.id])} />

        <div>
          <h3 className="text-xl font-bold">{g.weakTitle}</h3>
          {weakList.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white/5 p-4 text-lg">{g.noWeak}</p>
          ) : (
            <ol className="mt-3 space-y-2.5" data-testid="glance-weak">
              {weakList.map(({ v, i }, n) => (
                <li key={i} className="flex items-center gap-4 rounded-2xl border border-amber-300/30 bg-amber-300/[0.06] px-4 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xl font-bold text-ink">{n + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xl font-bold">{g.axes[AXES[i].id]}</span>
                    <span className="block text-base text-amber-100/90">{g.levels[level(v)]}</span>
                  </span>
                  <span className="text-3xl font-light tabular-nums">{v}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-sm text-silver/70">{g.scaleNote}</p>
        </div>
      </div>

      {cards.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold sm:text-2xl">{g.planTitle}</h3>
          {blocked && <p className="mt-2 rounded-2xl border border-rose-300/40 bg-rose-300/10 p-4 text-base text-rose-100">{g.blocked}</p>}
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="glance-plan">
            {cards.map((c) => {
              const r = ROUTINES[c.routine];
              const s = r.steps[c.step];
              const kb = t.kb.routines[c.routine];
              const dirIdx = Math.max(0, r.directionAreas.indexOf(c.area));
              const product: ProductId = s.product;
              return (
                <article key={c.key} className="flex flex-col rounded-3xl border border-line bg-ink/60 p-5" data-testid="glance-card">
                  <p className="text-lg font-bold text-amber-200">{c.axes.map((a) => g.axes[a]).join(" · ")}</p>
                  <p className="mt-1 text-lg">
                    <span className="mr-1">{r.time === "night" ? "🌙" : "☀️"}</span>
                    <b>{g.when[r.time]}</b> · {freq}
                  </p>

                  <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/products/${product}.webp`} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-2xl bg-white object-contain p-1" />
                      <div className="min-w-0">
                        <p className="text-sm text-silver">{g.step1}</p>
                        <p className="text-lg font-semibold leading-snug">{t.kb.products[product].name}</p>
                      </div>
                    </div>
                    {!blocked && (
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/products/device.webp" alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-2xl bg-white object-contain p-1" />
                        <div className="min-w-0">
                          <p className="text-sm text-silver">{g.step2}</p>
                          <p className="text-lg font-semibold">
                            <span className={`mr-1.5 inline-block rounded-full border px-2.5 py-0.5 text-base ${TECH_STYLE[s.technology]}`}>{t.care.tech[s.technology].name}</span>
                            {fmt(g.minutes, { n: s.minutes })}
                          </p>
                        </div>
                      </div>
                    )}
                    {!blocked && (
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-sm text-silver">{g.step3}</p>
                        <p className="mt-0.5 text-lg leading-snug">👉 {kb.directions[dirIdx]}</p>
                      </div>
                    )}
                  </div>
                  <a href={PRODUCTS[product].url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-fit items-center rounded-full border border-silver/40 px-4 py-2 text-base">{g.shop} →</a>
                </article>
              );
            })}
          </div>
          <p className="mt-3 text-base text-scan2">✓ {g.finish}</p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-line bg-ink/60 p-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h3 className="text-xl font-bold">{g.checkTitle}</h3>
          <ol className="mt-2 space-y-1 text-lg text-silver">
            {g.checkSteps.map((s, i) => (
              <li key={i}>
                <b className="mr-1 text-white">{i + 1}.</b>
                {s}
              </li>
            ))}
          </ol>
        </div>
        <Link href="/compare" className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-lg font-bold text-black" data-testid="glance-compare">
          {g.checkBtn}
        </Link>
      </div>
    </section>
  );
}
