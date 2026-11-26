/** 스타일 챌린지 탭: 오늘의 테마·트렌드 → 지금 룩 점수표 → 스타일리스트 팁 → 출전·심사 결과 */
import { useState } from "react";
import { FASHION_MAP } from "../data/game";
import { CHALLENGE_DAILY, PLACE_REWARD, SLOTS, STYLE_META, STYLES, scoreFit, streakBonus, stylistTip, themeOfDay, trendOfDay, TREND_BOOST, type Fit } from "../data/style";
import { useGame } from "../store/game";
import { useLife, type ChallengeResult } from "../store/life";
import { useUI } from "../store/ui";
import { useL, useT } from "../i18n";
import { Icon } from "./Icon";
import { Preview } from "./Screens";
import { reportPlay } from "../platform";

const today = () => new Date().toISOString().slice(0, 10);
const GRADE_COLOR: Record<string, string> = { S: "#c9a66b", A: "#e2718d", B: "#b9a2e8", C: "#7fc8a9", D: "#9a9095" };

export function StyleChallenge() {
  const t = useT(); const L = useL();
  const g = useGame(); const life = useLife();
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const d = today();
  const theme = themeOfDay(d); const trend = trendOfDay(d);
  const fit = g.look as unknown as Fit;
  const sc = scoreFit(fit, theme, trend);
  const tip = stylistTip(fit, g.ownedFashion, theme, trend);
  const st = life.style.date === d ? life.style : { ...life.style, entries: 0, best: 0 };
  const left = CHALLENGE_DAILY - st.entries;
  const maxStyle = Math.max(1, ...STYLES.map((s) => sc.byStyle[s]));
  const nextStreak = st.entries === 0 ? (life.style.lastDay === new Date(Date.now() - 86_400_000).toISOString().slice(0, 10) ? life.style.streak + 1 : 1) : life.style.streak;

  if (result) {
    const board = [...result.rivals, { name: g.name || "ME", score: result.score.total, me: true }].sort((a, b) => b.score - a.score);
    return (
      <div data-testid="challenge-result">
        <div className="card !p-3 text-center">
          <p className="text-[12px] font-bold text-ink/50">{L(theme)}</p>
          <p className="mt-1 text-4xl font-black" style={{ color: GRADE_COLOR[result.score.grade] }}>{result.score.grade}</p>
          <p className="text-sm font-black text-ink">{result.score.total} / 100 · {t("sc.place").replace("{n}", String(result.place + 1))}</p>
          <p className="mt-1 text-[12px] font-bold text-ink/60">+{result.coins} COIN · +{result.followers} {t("sc.followers")}{result.gems ? ` · +${result.gems} GEM` : ""}</p>
          {result.streak > 1 && <p className="mt-1 text-[12px] font-bold text-pink-deep">{t("sc.streak").replace("{n}", String(result.streak))}</p>}
        </div>
        <p className="mt-3 text-[13px] font-black tracking-wide text-pink-deep">{t("sc.board")}</p>
        <div className="mt-1.5 space-y-1.5">
          {board.map((r, i) => (
            <div key={r.name + i} className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${"me" in r ? "bg-pink-soft" : "bg-ink/5"}`}>
              <span className="w-5 text-center text-sm font-black text-ink">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{r.name}{!("me" in r) && <span className="ml-1 text-[12px] text-ink/40">{t("sc.rival")}</span>}</span>
              <span className="text-sm font-black text-ink">{r.score}</span>
            </div>
          ))}
        </div>
        <button className="btn-primary mt-3 w-full" onClick={() => setResult(null)}>{t("common.ok")}</button>
      </div>
    );
  }

  return (
    <>
      <p className="text-[13px] leading-relaxed text-ink/60">{t("sc.desc")}</p>
      <div className="card mt-3 !p-3">
        <p className="text-[12px] font-bold tracking-wide text-ink/50">{t("sc.theme")}</p>
        <p className="text-base font-black text-ink">{L(theme)}</p>
        <p className="text-[12px] text-ink/60">{g.settings.lang === "ko" ? theme.descKo : theme.descEn}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {STYLES.map((s, i) => theme.w[i] > 0 && (
            <span key={s} className="rounded-full px-2 py-0.5 text-[12px] font-bold text-white" style={{ background: STYLE_META[s].color, opacity: 0.45 + theme.w[i] }}>{L(STYLE_META[s])} {Math.round(theme.w[i] * 100)}%</span>
          ))}
          <span className="rounded-full border border-pink-deep px-2 py-0.5 text-[12px] font-bold text-pink-deep">{t("sc.trend")} {L(STYLE_META[trend])} ×{TREND_BOOST}</span>
        </div>
      </div>

      <div className="mt-3 flex gap-3">
        <div className="relative h-40 w-28 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-b from-[#fde7ee] to-cream">
          <Preview look={g.look} growth={g.stage || 1} anim="pose" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-ink/50">{t("sc.now")}</p>
          <p className="text-3xl font-black leading-none" style={{ color: GRADE_COLOR[sc.grade] }} data-testid="style-score">{sc.grade} <span className="text-lg text-ink">{sc.total}</span></p>
          <div className="mt-2 space-y-1">
            {STYLES.map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className="w-14 shrink-0 text-[12px] font-bold text-ink/60">{L(STYLE_META[s])}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full" style={{ width: `${(sc.byStyle[s] / maxStyle) * 100}%`, background: STYLE_META[s].color }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tip ? (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-cream p-2.5">
          <Icon n="sparkle" className="!h-5 !w-5 text-pink-deep" />
          <p className="min-w-0 flex-1 text-[12px] font-semibold text-ink/70">{t("sc.tip").replace("{item}", L(FASHION_MAP[tip.id])).replace("{n}", String(tip.gain))}</p>
          <button className="btn-ghost shrink-0 !px-2.5 !py-1 text-[12px]" data-testid="apply-tip" onClick={() => g.equip(tip.slot, tip.id)}>{t("sc.apply")}</button>
        </div>
      ) : (
        <p className="mt-3 rounded-2xl bg-cream p-2.5 text-[12px] font-semibold text-ink/60">{t("sc.tipNone")}</p>
      )}

      <details className="mt-2">
        <summary className="cursor-pointer text-[12px] font-bold text-ink/50">{t("sc.breakdown")}</summary>
        <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
          {SLOTS.map((slot) => {
            const id = fit[slot];
            return <p key={slot} className="flex justify-between text-[12px] text-ink/60"><span className="truncate">{id && FASHION_MAP[id] ? L(FASHION_MAP[id]) : `— (${t(`slot.${slot}`)})`}</span><span className="font-bold">{(sc.bySlot[slot] ?? 0).toFixed(1)}</span></p>;
          })}
        </div>
      </details>

      <button disabled={left <= 0} className="btn-primary mt-3 w-full disabled:opacity-50" data-testid="enter-challenge"
        onClick={() => { const r = life.enterChallenge(fit); if (r) { setResult(r); reportPlay("style", r.score.total); useUI.getState().toast(`${r.score.grade} · ${t("sc.place").replace("{n}", String(r.place + 1))}`, r.place === 0 ? "reward" : "pickup"); } }}>
        {left > 0 ? `${t("sc.enter")} (${left}/${CHALLENGE_DAILY})` : t("sc.doneToday")}
      </button>
      <p className="mt-2 text-[12px] font-semibold text-ink/50">
        {t("sc.best")} {st.best} · {t("sc.wins")} {life.style.wins} · {t("sc.streakNow").replace("{n}", String(life.style.streak))}
        {st.entries === 0 && ` · ${t("sc.streakNext").replace("{n}", String(nextStreak)).replace("{c}", String(streakBonus(nextStreak).coins))}`}
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-ink/45">{t("sc.note").replace("{c}", String(PLACE_REWARD[0].coins))}</p>
    </>
  );
}
