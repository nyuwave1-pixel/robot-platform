/** 라운지 방명록: 방문한 라운지에 남기기(GuestbookPanel) · 내 방명록 보기(MyGuestbook) */
import { useEffect, useState } from "react";
import { GB_DAILY, GB_MESSAGES, GB_REWARD, GB_STICKERS, loadGuestbook, useGuestbook, writeGuestbook, type Note } from "../net/guestbook";
import { useEvents } from "../store/events";
import { useGame } from "../store/game";
import { useUI } from "../store/ui";
import { useL, useT } from "../i18n";
import { Icon } from "./Icon";
import { Sheet } from "./Panels";

const ago = (iso: string, ko: boolean) => {
  const m = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 60_000));
  if (m < 60) return ko ? `${m}분 전` : `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? (ko ? `${h}시간 전` : `${h}h ago`) : ko ? `${Math.floor(h / 24)}일 전` : `${Math.floor(h / 24)}d ago`;
};

function NoteList({ list, status }: { list: Note[]; status: string }) {
  const t = useT(); const L = useL();
  const ko = useGame((s) => s.settings.lang === "ko");
  const me = useGame((s) => s.friendCode);
  if (status === "loading" && !list.length) return <p className="mt-1 text-[12px] text-ink/50">{t("ev.loading")}</p>;
  if (status === "error") return <p className="mt-1 text-[12px] text-ink/50">{t("gb.error")}</p>;
  if (!list.length) return <p className="mt-1 text-[12px] text-ink/50">{t("gb.empty")}</p>;
  return (
    <div className="mt-2 space-y-1.5" data-testid="gb-list">
      {list.map((n) => {
        const st = GB_STICKERS[n.sticker] ?? GB_STICKERS[0];
        const m = GB_MESSAGES.find((x) => x.id === n.msg);
        return (
          <div key={`${n.writer}-${n.at}`} className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 ${n.writer === me ? "bg-pink-soft" : "bg-white ring-1 ring-ink/5"}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white" style={{ background: st.color }}><Icon n={st.icon} className="!h-5 !w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-ink">{m ? L(m) : ""}</p>
              <p className="text-[12px] font-bold text-ink/45">{n.name} · {ago(n.at, ko)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 방문한 라운지의 방명록 (남기기 + 읽기) */
export function GuestbookPanel() {
  const t = useT(); const L = useL();
  const shop = useUI((s) => s.shop);
  const { owner, list, status } = useGuestbook();
  const me = useGame((s) => s.friendCode);
  const [msg, setMsg] = useState(0);
  const [sticker, setSticker] = useState(0);
  const [busy, setBusy] = useState(false);
  const code = shop?.code ?? "";
  useEffect(() => { if (code) void loadGuestbook(code); }, [code]);
  if (!shop) return null;
  const today = new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);
  const wrote = owner === code && list.some((n) => n.writer === me && new Date(Date.parse(n.at) + 9 * 3_600_000).toISOString().slice(0, 10) === today);
  const send = async () => {
    setBusy(true);
    const r = await writeGuestbook(code, msg, sticker);
    setBusy(false);
    useUI.getState().toast(r === "ok" ? t("gb.sent", { n: GB_REWARD }) : t(`gb.fail.${r}`), r === "ok" ? "reward" : "error");
  };
  return (
    <Sheet title="GUESTBOOK">
      <p className="text-sm font-black text-ink">{t("gb.title", { name: shop.name })}</p>
      <p className="mt-0.5 text-[12px] leading-relaxed text-ink/55">{t("gb.desc", { n: GB_REWARD, max: GB_DAILY })}</p>
      {wrote ? (
        <p className="mt-3 rounded-2xl bg-ink/5 p-3 text-[13px] font-bold text-ink/60" data-testid="gb-done">{t("gb.done")}</p>
      ) : (
        <>
          <p className="mt-3 text-xs font-black text-ink">{t("gb.sticker")}</p>
          <div className="mt-1.5 flex gap-1.5">
            {GB_STICKERS.map((s) => (
              <button key={s.id} aria-label={s.icon} onClick={() => setSticker(s.id)} className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${sticker === s.id ? "ring-4 ring-ink/25" : "opacity-60"}`} style={{ background: s.color }} data-testid={`gb-sticker-${s.id}`}>
                <Icon n={s.icon} className="!h-5 !w-5" />
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs font-black text-ink">{t("gb.message")}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {GB_MESSAGES.map((m) => <button key={m.id} onClick={() => setMsg(m.id)} className={`chip ${msg === m.id ? "chip-on" : ""}`} data-testid={`gb-msg-${m.id}`}>{L(m)}</button>)}
          </div>
          <button disabled={busy || code === me} className="btn-primary mt-3 w-full !py-2.5 text-sm disabled:opacity-40" onClick={send} data-testid="gb-send">{busy ? "..." : t("gb.send")}</button>
        </>
      )}
      <p className="mt-4 text-xs font-black text-ink">{t("gb.recent")}</p>
      <NoteList list={owner === code ? list : []} status={owner === code ? status : "loading"} />
    </Sheet>
  );
}

/** 내 라운지 방명록 (이벤트 패널 탭) */
export function MyGuestbook() {
  const t = useT();
  const me = useGame((s) => s.friendCode);
  const { owner, list, status } = useGuestbook();
  useEffect(() => { void loadGuestbook(me); }, [me]);
  useEffect(() => { if (owner === me && list[0]) useEvents.getState().markGuestbook(list[0].at); }, [owner, me, list]);
  return (
    <>
      <div className="rounded-3xl bg-gradient-to-br from-pink-soft to-[#f6d9a8] p-4">
        <p className="text-[12px] font-bold tracking-[0.2em] text-ink/60">MY GUESTBOOK</p>
        <p className="text-sm font-black text-ink">{t("gb.mine")}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-ink/60">{t("gb.mineDesc")}</p>
      </div>
      <NoteList list={owner === me ? list : []} status={owner === me ? status : "loading"} />
    </>
  );
}

/** 내 방명록에 아직 안 본 새 글이 있는지 (HUD 표시용) */
export function useGuestbookBadge() {
  const me = useGame((s) => s.friendCode);
  const latest = useGuestbook((s) => s.mineLatest);
  const seen = useEvents((s) => s.gbSeen);
  useEffect(() => { void loadGuestbook(me); }, [me]);
  return latest && latest > seen ? 1 : 0;
}
