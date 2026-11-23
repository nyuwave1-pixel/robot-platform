"use client";
/** 분석 흐름 단계 표시(동의 → 사진 → 질문 → 결과). 지금 어디쯤인지 한눈에 보이게 큰 숫자로. */
import Icon from "@/components/ui/Icon";
import { useI18n } from "@/lib/i18n";

export default function StepBar({ current }: { current: 0 | 1 | 2 | 3 | 4 }) {
  const { t } = useI18n();
  const steps = t.flow.steps;
  return (
    <nav aria-label={t.flow.label} className="mx-auto max-w-3xl px-4 pt-5" data-testid="step-bar" data-current={current}>
      {/* 칸 너비를 똑같이 나누고 이름은 칸 안에서 줄바꿈: 긴 언어(러시아어·베트남어·스페인어)에서도 눌리거나 겹치지 않는다 */}
      <ol className="grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => {
          const done = i < current;
          const cur = i === current;
          return (
            <li key={s} className="relative flex flex-col items-center gap-1 px-0.5" aria-current={cur ? "step" : undefined}>
              {i > 0 && <span aria-hidden className={`absolute top-[17px] h-0.5 rounded ${i <= current ? "bg-scan/60" : "bg-line"}`} style={{ left: "calc(-50% + 24px)", right: "calc(50% + 24px)" }} />}
              <span
                className={`relative flex h-9 w-9 items-center justify-center rounded-full text-base font-bold transition ${
                  cur ? "bg-scan2 text-ink shadow-glow" : done ? "bg-scan/30 text-scan2" : "border border-line text-silver-soft"
                }`}
              >
                {done ? <Icon name="check" size={16} strokeWidth={2.2} /> : i + 1}
              </span>
              <span className={`text-center text-xs leading-tight [overflow-wrap:anywhere] sm:text-sm ${cur ? "font-semibold text-white" : "text-silver-soft"}`}>{s}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
