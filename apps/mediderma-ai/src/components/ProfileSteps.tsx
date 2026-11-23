"use client";
/** 촬영 전 간단 정보: 한 화면에 질문 하나, 위쪽 진행 막대, 큰 선택 카드. 언제든 건너뛸 수 있다. */
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { ScanProfile } from "@/lib/client/store";

type Q = "forWhom" | "makeup" | "age" | "skinType";
const ORDER: Q[] = ["forWhom", "makeup", "age", "skinType"];

export default function ProfileSteps({ initial, onDone }: { initial: ScanProfile; onDone: (p: ScanProfile) => void }) {
  const { t } = useI18n();
  const f = t.fit.pf;
  const [p, setP] = useState<ScanProfile>(initial);
  const [i, setI] = useState(0);
  const q = ORDER[i];
  const other = p.forWhom === "other";

  const options: { key: string; label: string; icon?: string; on: boolean; pick: () => void }[] =
    q === "forWhom"
      ? [
          { key: "self", label: f.forWhom.self, icon: "🙋", on: p.forWhom === "self", pick: () => setP({ ...p, forWhom: "self" }) },
          { key: "other", label: f.forWhom.other, icon: "👥", on: p.forWhom === "other", pick: () => setP({ ...p, forWhom: "other" }) },
        ]
      : q === "makeup"
        ? [
            { key: "yes", label: f.makeup.yes, icon: "💄", on: p.makeup === true, pick: () => setP({ ...p, makeup: true }) },
            { key: "no", label: f.makeup.no, icon: "✨", on: p.makeup === false, pick: () => setP({ ...p, makeup: false }) },
          ]
        : q === "age"
          ? f.age.bands.map((b, k) => ({ key: String(k), label: b, on: p.age === k, pick: () => setP({ ...p, age: k }) }))
          : (["dry", "normal", "oily", "combination"] as const).map((k) => ({ key: k, label: f.skin.types[k], on: p.skinType === k, pick: () => setP({ ...p, skinType: k }) }));

  const title =
    q === "forWhom" ? f.forWhom.title : q === "makeup" ? (other ? f.makeup.titleOther : f.makeup.titleSelf) : q === "age" ? (other ? f.age.titleOther : f.age.titleSelf) : other ? f.skin.titleOther : f.skin.titleSelf;
  const sub = q === "forWhom" ? f.forWhom.sub : q === "makeup" ? f.makeup.sub : q === "age" ? f.age.sub : f.skin.sub;
  const answered = q === "forWhom" ? p.forWhom !== null : q === "makeup" ? p.makeup !== null : q === "age" ? p.age !== null : p.skinType !== null;
  const next = () => (i < ORDER.length - 1 ? setI(i + 1) : onDone(p));

  return (
    <div data-testid="profile" data-q={q} className="flex min-h-[70vh] flex-col">
      <div className="flex items-center gap-3">
        <button onClick={() => (i === 0 ? onDone(p) : setI(i - 1))} aria-label={f.back} className="rounded-full border border-line px-3 py-1.5 text-lg leading-none text-silver" disabled={i === 0}>
          ←
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={ORDER.length} aria-valuenow={i + 1}>
          <div className="h-full rounded-full bg-gradient-to-r from-scan to-scan2 transition-all duration-500" style={{ width: `${((i + 1) / ORDER.length) * 100}%` }} />
        </div>
        <button onClick={() => onDone(p)} data-testid="profile-skip" className="text-base text-silver underline underline-offset-4">{f.skip}</button>
      </div>

      <h1 className="mt-7 text-2xl font-bold leading-snug sm:text-3xl">{title}</h1>
      {sub && <p className="mt-2 text-base text-silver">{sub}</p>}

      <div className="mt-6 space-y-3" role="radiogroup" aria-label={title}>
        {options.map((o) => (
          <button
            key={o.key}
            role="radio"
            aria-checked={o.on}
            data-testid={`pf-${q}-${o.key}`}
            onClick={o.pick}
            className={`flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left text-lg transition ${o.on ? "border-scan bg-scan/10 font-semibold" : "border-line bg-panel hover:border-silver/50"}`}
          >
            {o.icon && <span className="text-2xl">{o.icon}</span>}
            <span className="flex-1">{o.label}</span>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${o.on ? "border-scan2" : "border-silver/50"}`}>{o.on && <span className="h-3 w-3 rounded-full bg-scan2" />}</span>
          </button>
        ))}
      </div>
      {q === "makeup" && p.makeup === true && <p className="mt-4 rounded-2xl bg-amber-300/10 p-4 text-base text-amber-100">💡 {f.makeup.note}</p>}

      <div className="mt-auto pt-8">
        <button onClick={next} disabled={!answered} data-testid="profile-next" className="w-full rounded-full bg-white px-8 py-4 text-lg font-bold text-black transition hover:bg-scan2 disabled:bg-line disabled:text-silver">
          {f.next} →
        </button>
      </div>
    </div>
  );
}
