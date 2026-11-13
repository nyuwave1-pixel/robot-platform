"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fmt, useI18n } from "@/lib/i18n";
import { simulate, type SimPeriod } from "@/lib/analysis/simulate";
import type { VisualData } from "@/lib/analysis/types";
import { simCanvas } from "@/lib/client/overlay";
import { track } from "@/lib/client/telemetry";
import CompareSlider from "./CompareSlider";

const PERIODS: { id: SimPeriod; weeks: number; key: "w4" | "w8" | "w12" }[] = [
  { id: "4weeks", weeks: 4, key: "w4" },
  { id: "8weeks", weeks: 8, key: "w8" },
  { id: "12weeks", weeks: 12, key: "w12" },
];

function Thumb({ canvas, active, onClick, title, sub, virtual }: { canvas: HTMLCanvasElement; active: boolean; onClick: () => void; title: string; sub: string; virtual: boolean }) {
  const url = useMemo(() => canvas.toDataURL("image/jpeg", 0.8), [canvas]);
  return (
    <button onClick={onClick} className={`overflow-hidden rounded-xl border text-left transition ${active ? "border-scan shadow-glow" : "border-line"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={sub} className="block aspect-[4/5] w-full object-cover" />
      <span className="block px-2 py-1.5">
        <span className="block font-display text-[11px] tracking-[0.15em]">{title}</span>
        <span className={`block text-[10px] ${virtual ? "text-scan2" : "text-silver"}`}>{sub}</span>
      </span>
    </button>
  );
}

export default function Simulation({ visual }: { visual: VisualData }) {
  const { t } = useI18n();
  const [sel, setSel] = useState<SimPeriod>("12weeks");
  const [sims, setSims] = useState<Record<SimPeriod, HTMLCanvasElement> | null>(null);
  const original = useMemo(() => simCanvas(visual.rgba, visual.width, visual.height, t.sim.original), [visual, t.sim.original]);
  useEffect(() => {
    let alive = true;
    // 무거운 연산이므로 화면을 먼저 그린 뒤 실행
    const id = setTimeout(() => {
      const out = {} as Record<SimPeriod, HTMLCanvasElement>;
      for (const p of PERIODS) out[p.id] = simCanvas(simulate(visual, p.id), visual.width, visual.height, t.sim.watermark, "right");
      if (alive) {
        setSims(out);
        track("simulation_viewed");
      }
    }, 50);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [visual, t.sim.watermark]);
  return (
    <section className="space-y-4" data-testid="simulation">
      <div>
        <h2 className="font-display text-2xl font-light">{t.sim.title}</h2>
        <p className="mt-1 text-sm text-silver">{t.sim.desc}</p>
      </div>
      <div role="note" className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-100" data-testid="sim-disclaimer">
        <p className="font-semibold">{t.sim.disclaimer}</p>
        <p className="mt-1">{t.sim.notPrediction}</p>
      </div>
      {!sims ? (
        <p className="py-10 text-center text-sm text-silver">{t.common.loading}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid grid-cols-4 gap-2 self-start">
            <Thumb canvas={original} active={false} onClick={() => {}} title={t.sim.current} sub={t.sim.currentLabel} virtual={false} />
            {PERIODS.map((p) => (
              <Thumb key={p.id} canvas={sims[p.id]} active={sel === p.id} onClick={() => setSel(p.id)} title={t.sim[p.key]} sub={fmt(t.sim.simLabel, { n: p.weeks })} virtual />
            ))}
          </div>
          <CompareSlider left={original} right={sims[sel]} leftLabel={t.sim.currentLabel} rightLabel={fmt(t.sim.simLabel, { n: PERIODS.find((p) => p.id === sel)!.weeks })} hint={t.sim.sliderHint} testId="sim-slider" />
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-panel p-4">
          <h3 className="text-sm font-semibold">{t.sim.typeA}</h3>
          <p className="mt-1 text-xs leading-relaxed text-silver">{t.sim.typeADesc}</p>
        </div>
        <div className="rounded-xl border border-line bg-panel p-4">
          <h3 className="text-sm font-semibold">{t.sim.typeB}</h3>
          <p className="mt-1 text-xs leading-relaxed text-silver">{t.sim.typeBDesc}</p>
          <Link href="/compare" className="mt-2 inline-block text-xs text-scan2 underline underline-offset-4">{t.sim.goCompare} →</Link>
        </div>
      </div>
    </section>
  );
}
