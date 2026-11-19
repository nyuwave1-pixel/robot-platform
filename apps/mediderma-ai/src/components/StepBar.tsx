"use client";
/** 분석 흐름 단계 표시(동의 → 사진 → 질문 → 결과). 지금 어디쯤인지 한눈에 보이게 큰 숫자로. */
import { useI18n } from "@/lib/i18n";

export default function StepBar({ current }: { current: 0 | 1 | 2 | 3 }) {
  const { t } = useI18n();
  const steps = t.flow.steps;
  return (
    <nav aria-label={t.flow.label} className="mx-auto max-w-3xl px-4 pt-5" data-testid="step-bar" data-current={current}>
      <ol className="flex items-center">
        {steps.map((s, i) => {
          const done = i < current;
          const cur = i === current;
          return (
            <li key={s} className="flex flex-1 items-center last:flex-none" aria-current={cur ? "step" : undefined}>
              <span className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-base font-bold transition ${
                    cur ? "bg-scan2 text-ink shadow-glow" : done ? "bg-scan/30 text-scan2" : "border border-line text-silver/60"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className={`whitespace-nowrap text-xs sm:text-sm ${cur ? "font-semibold text-white" : "text-silver/70"}`}>{s}</span>
              </span>
              {i < steps.length - 1 && <span className={`mx-1.5 mb-5 h-0.5 flex-1 rounded ${i < current ? "bg-scan/60" : "bg-line"}`} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
