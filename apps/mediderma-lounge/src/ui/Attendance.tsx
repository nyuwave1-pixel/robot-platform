/**
 * 7일 출석부: 그날 처음 게임에 들어오면 한 번 뜬다 (닫아도 퀘스트 패널에서 다시 열 수 있다)
 * 날짜가 이어지지 않아도 출석한 날만큼 칸이 차고, 7칸을 채우면 처음부터 다시
 */
import { useEffect, useState } from "react";
import { create } from "zustand";
import { ATTEND_REWARDS, useGame, type AttendReward } from "../store/game";
import { useUI } from "../store/ui";
import { useT } from "../i18n";
import { Price } from "./Icon";

export const useAttendOpen = create<{ open: boolean }>(() => ({ open: false }));
const today = () => new Date().toISOString().slice(0, 10);

function RewardLine({ r }: { r: AttendReward }) {
  return (
    <span className="flex flex-col items-center gap-0.5 text-[12px] font-black text-ink">
      {r.coins ? <Price c="coin" n={r.coins} /> : null}
      {r.gems ? <Price c="gem" n={r.gems} /> : null}
      {r.stars ? <Price c="star" n={r.stars} /> : null}
    </span>
  );
}

export function Attendance() {
  const t = useT();
  const screen = useUI((s) => s.screen);
  const started = useGame((s) => s.started);
  const attend = useGame((s) => s.attend ?? { day: "", count: 0 });
  const open = useAttendOpen((s) => s.open);
  const [shownToday, setShownToday] = useState("");
  // 그날 처음 들어오면 한 번 (튜토리얼 · 다른 창이 없을 때)
  useEffect(() => {
    if (screen !== "game" || !started || attend.day === today() || shownToday === today()) return;
    const id = setTimeout(() => { if (!useUI.getState().panel && !useUI.getState().care) { useAttendOpen.setState({ open: true }); setShownToday(today()); } }, 2500);
    return () => clearTimeout(id);
  }, [screen, started, attend.day, shownToday]);
  if (!open) return null;
  const claimed = attend.day === today();
  const filled = claimed ? attend.count : attend.count % ATTEND_REWARDS.length;
  const next = filled % ATTEND_REWARDS.length;
  const claim = () => {
    const r = useGame.getState().claimAttendance();
    if (r) useUI.getState().toast(t("att.got", { n: r.slot + 1 }), "reward");
  };
  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true" data-testid="attendance">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl">
        <p className="text-center text-[13px] font-bold tracking-[0.3em] text-gold">DAILY CHECK-IN</p>
        <p className="mt-1 text-center text-lg font-black text-ink">{t("att.title")}</p>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {ATTEND_REWARDS.map((r, i) => {
            const done = i < filled || (claimed && i < attend.count);
            const today = !claimed && i === next;
            return (
              <div key={i} className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2 ${i === 6 ? "col-span-2" : ""} ${done ? "border-gold/40 bg-gold/10 opacity-60" : today ? "border-pink-deep bg-pink-soft/40" : "border-ink/5 bg-cream"}`}>
                <span className="text-[12px] font-bold text-ink/50">{t("att.day", { n: i + 1 })}</span>
                <RewardLine r={r} />
                {done && <span className="text-[12px] font-black text-gold">✓</span>}
              </div>
            );
          })}
        </div>
        {claimed
          ? <p className="mt-3 text-center text-[13px] font-bold text-ink/60">{t("att.doneToday")}</p>
          : <button className="btn-primary mt-3 w-full" onClick={claim} data-testid="attend-claim">{t("att.claim", { n: next + 1 })}</button>}
        <button className="btn-ghost mt-2 w-full !py-2 text-xs" onClick={() => useAttendOpen.setState({ open: false })}>{t("att.close")}</button>
        <p className="mt-2 text-center text-[12px] text-ink/45">{t("att.note")}</p>
      </div>
    </div>
  );
}
