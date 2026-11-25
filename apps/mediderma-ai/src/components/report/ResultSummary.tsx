"use client";
/**
 * 결과 맨 위 요약 (FitLine 스캐너의 장점을 참고):
 *  - SummaryHero: 반원 게이지로 종합 점수 + 피부 타입·연령대(사용자가 고른 값) + 한 줄 문장
 *  - SkinCards: 8개 항목 카드(아이콘·상태 배지·막대). 누르면 아래에서 설명 시트가 올라온다.
 *  - ShareButton: 휴대폰 공유창(카카오톡 등) → 안 되면 복사
 * 점수는 모두 사진 관찰 지수이며, '추정 나이'처럼 검증되지 않은 값은 만들지 않는다.
 */
import Icon, { type IconName } from "@/components/ui/Icon";
import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { fmt, useI18n } from "@/lib/i18n";
import { track } from "@/lib/client/telemetry";
import type { ScanProfile } from "@/lib/client/store";
import type { CategoryScores, MetricKey, ZoneResult } from "@/lib/analysis/types";
import { HIGHER_IS_BETTER } from "@/lib/analysis/types";
import type { CarePlan } from "@/lib/care/recommend";
import { AXES, type AxisId } from "./CareAtAGlance";

const ICON: Record<AxisId, IconName> = { texture: "sparkle", wrinkle: "wave", pore: "search", tone: "contrast", pigment: "spot", redness: "drop", eye: "eye", jaw: "jaw" };
/** 축 → 설명·부위 찾기에 쓸 지표 */
const AXIS_METRIC: Record<AxisId, MetricKey | null> = {
  texture: "texture",
  wrinkle: "wrinkleVisibility",
  pore: "poreVisibility",
  tone: "toneUniformity",
  pigment: "pigmentVisibility",
  redness: "rednessVisibility",
  eye: "underEyeDarkness",
  jaw: null,
};

export function levelOf(v: number): 0 | 1 | 2 | 3 {
  return v < 40 ? 0 : v < 60 ? 1 : v < 75 ? 2 : 3;
}
const BADGE = ["border-rose-400/50 bg-rose-400/15 text-rose-200", "border-amber-400/50 bg-amber-400/15 text-amber-100", "border-sky-400/50 bg-sky-400/15 text-sky-100", "border-emerald-400/50 bg-emerald-400/15 text-emerald-200"];
const BAR = ["from-rose-400 to-rose-300", "from-amber-400 to-amber-200", "from-sky-400 to-sky-200", "from-emerald-400 to-emerald-200"];

/** 가장 약한 축 (공유 문구·요약용) */
export function weakestAxes(c: CategoryScores, n = 2): AxisId[] {
  return AXES.map((a) => ({ id: a.id, v: a.value(c) }))
    .filter((x): x is { id: AxisId; v: number } => x.v !== null && x.v < 60)
    .sort((a, b) => a.v - b.v)
    .slice(0, n)
    .map((x) => x.id);
}

export function SummaryHero({ score, profile }: { score: number | null; profile?: ScanProfile | null }) {
  const { t } = useI18n();
  useEffect(() => track("report_viewed"), []);
  const h = t.fit.hero;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (score === null) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1300);
      setShown(Math.round(score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);
  // 반원 게이지: 왼쪽(0) → 오른쪽(100)
  const r = 80;
  const len = Math.PI * r;
  const frac = score === null ? 0 : shown / 100;
  return (
    <section className="rounded-3xl border border-scan/30 bg-gradient-to-b from-scan/[0.10] to-panel p-5 text-center sm:p-7" data-testid="summary-hero">
      <div className="relative mx-auto w-full max-w-[280px]">
        <svg viewBox="0 0 200 112" className="w-full" aria-hidden>
          <defs>
            <linearGradient id="hg" x1="0" x2="1">
              <stop offset="0" stopColor="#fb7185" />
              <stop offset="0.45" stopColor="#fbbf24" />
              <stop offset="1" stopColor="#34d399" />
            </linearGradient>
          </defs>
          <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#dce1e5" strokeWidth="14" strokeLinecap="round" />
          {score !== null && <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#hg)" strokeWidth="14" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - frac)} />}
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <p className="font-display text-5xl font-normal tabular-nums text-white" data-testid="hero-score" data-value={score ?? ""}>
            {score === null ? "—" : shown}
            <span className="ml-1 text-lg text-silver">/100</span>
          </p>
          <p className="text-sm text-silver">{h.scoreLabel}</p>
        </div>
      </div>
      {score !== null && <p className="mx-auto mt-4 max-w-md text-xl font-semibold leading-snug">{fmt(h.sentence, { n: score })}</p>}
      {(profile?.skinType || profile?.age !== null) && profile && (
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-base">
          {profile.skinType && (
            <span className="rounded-full border border-line bg-white/5 px-4 py-1.5" data-testid="hero-skin">
              {h.skinType} · <b>{h.types[profile.skinType]}</b>
            </span>
          )}
          {profile.age !== null && (
            <span className="rounded-full border border-line bg-white/5 px-4 py-1.5" data-testid="hero-age">
              {h.age} · <b>{t.fit.pf.age.bands[profile.age]}</b>
            </span>
          )}
        </div>
      )}
      {profile?.makeup && <p className="mx-auto mt-3 max-w-md rounded-2xl bg-amber-300/10 p-3 text-base text-amber-100"><Icon name="bulb" size={18} className="mr-1.5" />{h.makeupWarn}</p>}
      <p className="mt-3 text-xs text-silver-soft">{h.note}</p>
    </section>
  );
}

export function SkinCards({ categories, zones }: { categories: CategoryScores; zones: ZoneResult[] }) {
  const { t } = useI18n();
  const c = t.fit.cards;
  const [open, setOpen] = useState<AxisId | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /** 그 지표가 가장 두드러진(나쁜 쪽) 부위 */
  const worstZone = (id: AxisId): string | null => {
    const m = AXIS_METRIC[id];
    const pool = zones.filter((z) => z.zone !== "neck");
    if (!m) {
      const jaw = pool.filter((z) => z.zone === "left_jawline" || z.zone === "right_jawline" || z.zone === "chin").filter((z) => z.conditionIndex !== null);
      jaw.sort((a, b) => (a.conditionIndex ?? 0) - (b.conditionIndex ?? 0));
      return jaw[0] ? t.zones[jaw[0].zone] : null;
    }
    const withV = pool.filter((z) => z[m] !== null);
    if (withV.length === 0) return null;
    withV.sort((a, b) => (HIGHER_IS_BETTER[m] ? (a[m] as number) - (b[m] as number) : (b[m] as number) - (a[m] as number)));
    return t.zones[withV[0].zone];
  };

  const item = open ? AXES.find((a) => a.id === open)! : null;
  const itemV = item ? item.value(categories) : null;
  const itemMetric = open ? AXIS_METRIC[open] : null;

  return (
    <section className="rounded-3xl border border-line bg-panel p-5 sm:p-7" data-testid="skin-cards">
      <h2 className="text-2xl font-bold">{c.title}</h2>
      <p className="mt-1 text-base text-silver">{c.tapHint}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {AXES.map((a) => {
          const v = a.value(categories);
          const lv = v === null ? null : levelOf(v);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setOpen(a.id)}
              disabled={v === null}
              className="rounded-2xl border border-line bg-white/[0.03] p-3 text-left transition hover:border-scan/60 disabled:opacity-50"
              data-testid={`skin-card-${a.id}`}
            >
              <div className="flex items-center justify-between gap-1">
                <Icon name={ICON[a.id]} size={26} strokeWidth={1.4} className="text-brand" />
                <span className="font-display text-2xl tabular-nums">{v ?? "—"}</span>
              </div>
              <p className="mt-1 text-lg font-semibold">{t.glance.axes[a.id]}</p>
              {lv !== null && <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs ${BADGE[lv]}`}>{c.badges[lv]}</span>}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                {v !== null && lv !== null && <div className={`h-full rounded-full bg-gradient-to-r ${BAR[lv]}`} style={{ width: `${v}%` }} />}
              </div>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {open && item && (
          <m.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <m.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="sheet-title"
              className="w-full max-w-lg rounded-t-3xl border border-line bg-ink p-6 pb-8 sm:rounded-3xl"
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              data-testid="skin-sheet"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line sm:hidden" />
              <div className="flex items-center gap-3">
                <Icon name={ICON[open]} size={32} strokeWidth={1.4} className="text-brand" />
                <h3 id="sheet-title" className="text-2xl font-bold">{t.glance.axes[open]}</h3>
                <span className="ml-auto font-display text-3xl tabular-nums">{itemV ?? "—"}</span>
              </div>
              {itemV !== null && <span className={`mt-2 inline-block rounded-full border px-3 py-1 text-sm ${BADGE[levelOf(itemV)]}`}>{c.badges[levelOf(itemV)]}</span>}
              {itemMetric && <p className="mt-4 text-lg leading-relaxed">{t.metrics[itemMetric].desc}</p>}
              {worstZone(open) && (
                <p className="mt-3 rounded-2xl bg-white/5 p-3 text-base">
                  <Icon name="pin" size={16} className="mr-1" />{c.whereLabel}: <b>{worstZone(open)}</b>
                </p>
              )}
              <p className="mt-3 text-sm text-silver-soft">{t.glance.scaleNote}</p>
              <button onClick={() => setOpen(null)} className="mt-5 w-full rounded-full bg-white py-3.5 text-lg font-bold text-black" data-testid="skin-sheet-close">
                {c.close}
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function ShareButton({ score, categories, plan }: { score: number | null; categories: CategoryScores; plan: CarePlan | null }) {
  const { t } = useI18n();
  const s = t.fit.share;
  const [toast, setToast] = useState(false);
  const share = async () => {
    track("share_click");
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const weak = weakestAxes(categories).map((id) => t.glance.axes[id]).join(", ") || "—";
    const products = (plan?.products ?? []).filter((p) => p !== "device").slice(0, 2).map((p) => t.kb.products[p].name).join(", ") || "—";
    const text = fmt(s.text, { score: score ?? "—", weak, products, url });
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* 복사 불가 환경 */
    }
    setToast(true);
    setTimeout(() => setToast(false), 3500);
  };
  return (
    <div className="relative">
      <button onClick={share} className="w-full rounded-full bg-[#FEE500] px-6 py-4 text-lg font-bold text-[#191600] hover:brightness-95" data-testid="share-result">
        <Icon name="chat" size={20} className="mr-1.5" />{s.button}
      </button>
      {toast && (
        <p role="status" className="mt-2 rounded-2xl bg-white/10 p-3 text-center text-base" data-testid="share-toast">
          {s.copied}
        </p>
      )}
    </div>
  );
}
