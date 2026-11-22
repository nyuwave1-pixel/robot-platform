/** 주간 라운지 꾸미기 콘테스트 탭: 이번 주 출품·투표·순위, 지난 주 결과·보상 */
import { useEffect, useState } from "react";
import { VOTES_PER_WEEK, contestReward, enterContest, refreshContest, useContest, voteContest, weekEndsAt, type Entry } from "../net/contest";
import { useEvents } from "../store/events";
import { useGame } from "../store/game";
import { useUI } from "../store/ui";
import { useT } from "../i18n";
import { Icon } from "./Icon";

const left = (ms: number, ko: boolean) => {
  const h = Math.max(0, Math.floor(ms / 3_600_000));
  return h >= 24 ? (ko ? `${Math.floor(h / 24)}일 ${h % 24}시간` : `${Math.floor(h / 24)}d ${h % 24}h`) : ko ? `${h}시간` : `${h}h`;
};
const MEDAL = ["#c9a66b", "#a9b4c2", "#c58b62"];

/** 출품작 구경: 그 라운지의 출품 사진으로 들어간다 (주인이 접속해 있으면 실시간) */
export function viewEntry(e: Entry) {
  useUI.setState({ shop: { name: e.name, code: e.code, look: e.look, stage: e.stage, rank: 0, lounge: e.lounge }, visiting: "shop", world: null, customers: [], near: null, nearCustomer: null, nearPet: null, panel: null, mode: "explore" });
}

export async function castVote(code: string, t: (k: string, v?: Record<string, string | number>) => string) {
  const r = await voteContest(code);
  useUI.getState().toast(t(`contest.vote.${r}`), r === "ok" ? "heart" : "error");
  return r;
}

export function ContestTab() {
  const t = useT();
  const ko = useGame((s) => s.settings.lang === "ko");
  const code = useGame((s) => s.friendCode);
  const lounge = useGame((s) => s.lounge);
  const { status, me, board, prevBoard } = useContest();
  const claimed = useEvents((s) => s.contestClaimed);
  const [busy, setBusy] = useState(false);
  useEffect(() => { void refreshContest(); }, []);
  const used = me?.used ?? 0;
  const reward = me && me.prevRank ? contestReward(me.prevRank) : null;
  const canClaim = !!(me && reward && !claimed.includes(me.prev));
  const enter = async () => {
    setBusy(true);
    const r = await enterContest();
    setBusy(false);
    useUI.getState().toast(t(`contest.enter.${r}`), r === "ok" ? "reward" : "error");
  };
  const vote = async (c: string) => { setBusy(true); await castVote(c, t); setBusy(false); };
  return (
    <>
      <div className="rounded-3xl bg-gradient-to-br from-[#f6d9a8] to-pink-soft p-4">
        <p className="text-[12px] font-bold tracking-[0.2em] text-ink/60">WEEKLY LOUNGE CONTEST · {me?.week ?? ""}</p>
        <p className="text-base font-black text-ink">{t("contest.title")}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-ink/65">{t("contest.desc", { n: VOTES_PER_WEEK })}</p>
        <p className="mt-1.5 text-[12px] font-bold text-ink/70">{t("contest.ends", { t: left(weekEndsAt() - Date.now(), ko) })}</p>
      </div>

      {status === "error" && <p className="mt-3 text-[13px] text-ink/55">{t("contest.error")}</p>}
      {status === "loading" && <p className="mt-3 text-[13px] text-ink/55">{t("ev.loading")}</p>}

      {canClaim && reward && me && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-gold/15 p-3" data-testid="contest-claim">
          <Icon n="gift" className="!h-6 !w-6 text-gold" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-ink">{t("contest.prevRank", { n: me.prevRank ?? 0 })} · {reward.title}</p>
            <p className="text-[12px] font-bold text-ink/60">{reward.coins} COIN{reward.gems ? ` · ${reward.gems} GEM` : ""}</p>
          </div>
          <button className="btn-primary shrink-0 !px-4 !py-2 text-xs" onClick={() => { if (useEvents.getState().claimContest(me.prev, reward)) useUI.getState().toast(t("contest.claimed"), "reward"); }}>{t("ev.claim")}</button>
        </div>
      )}

      <div className="mt-3 rounded-2xl bg-ink/5 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-black text-ink">{t("contest.myEntry")} · LV.{lounge.level}</p>
            <p className="text-[12px] text-ink/60">{me?.entered ? t("contest.entered", { n: me.received }) : t("contest.notEntered")}</p>
          </div>
          <button disabled={busy || status !== "ok"} className="btn-primary shrink-0 !px-4 !py-2 text-xs disabled:opacity-40" onClick={enter} data-testid="contest-enter">{me?.entered ? t("contest.update") : t("contest.enter")}</button>
        </div>
        <p className="mt-1.5 text-[12px] font-bold text-pink-deep">{t("contest.votesLeft", { n: Math.max(0, VOTES_PER_WEEK - used), max: VOTES_PER_WEEK })}</p>
      </div>

      <p className="mt-4 text-xs font-black text-ink">{t("contest.board")} ({board.length})</p>
      {status === "ok" && board.length === 0 && <p className="mt-1 text-[12px] text-ink/50">{t("contest.empty")}</p>}
      <div className="mt-2 space-y-1.5" data-testid="contest-board">
        {board.map((e) => {
          const mine = e.code === code;
          const voted = me?.votedFor.includes(e.code);
          return (
            <div key={e.code} className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${mine ? "bg-pink-soft" : "bg-white ring-1 ring-ink/5"}`}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-black text-white" style={{ background: MEDAL[e.rank - 1] ?? "#cbbfc4" }}>{e.rank}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-ink">{e.name}{mine && <span className="ml-1 text-[12px] text-pink-deep">ME</span>}</p>
                <p className="text-[12px] font-bold text-ink/45">LV.{e.level} · {t("contest.furniture", { n: e.lounge.furniture.length })} · ♥ {e.votes}</p>
              </div>
              <button className="btn-ghost shrink-0 !px-2.5 !py-1.5 text-xs" onClick={() => viewEntry(e)}>{t("contest.view")}</button>
              {!mine && <button disabled={busy || voted || used >= VOTES_PER_WEEK} className="btn-primary shrink-0 !px-2.5 !py-1.5 text-xs disabled:opacity-40" onClick={() => vote(e.code)} data-testid={`vote-${e.code}`}>{voted ? "♥" : t("contest.voteBtn")}</button>}
            </div>
          );
        })}
      </div>

      {prevBoard.length > 0 && (
        <>
          <p className="mt-4 text-xs font-black text-ink">{t("contest.prevBoard", { w: me?.prev ?? "" })}</p>
          <div className="mt-1.5 grid grid-cols-1 gap-1">
            {prevBoard.slice(0, 3).map((e) => <p key={e.code} className="truncate text-[12px] font-bold text-ink/65"><span style={{ color: MEDAL[e.rank - 1] }}>#{e.rank}</span> {e.name} · ♥ {e.votes}</p>)}
          </div>
        </>
      )}
      <p className="mt-3 text-[12px] leading-relaxed text-ink/45">{t("contest.note")}</p>
    </>
  );
}
