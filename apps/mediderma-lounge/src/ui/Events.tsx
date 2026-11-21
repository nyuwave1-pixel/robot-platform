/**
 * 이벤트 · 프로모션 · 오픈 라운지 UI
 *  - EventsPanel: 공식 이벤트 / 열린 라운지(실시간 방문) / 내 라운지(열기·이벤트·공지)
 *  - LiveLoungeSync: 지금 있는 장소에 맞게 라운지 방에 들어가고 나온다
 *  - LiveBar: 라운지 안에서 보이는 실시간 표시줄 (방문객 수 · 진행 중인 이벤트 · 주인 공지)
 */
import { useEffect, useState } from "react";
import { LOUNGE_EVENTS, LOUNGE_EVENT_MAP, NOTICES, isActive, isUpcoming, type OfficialEvent } from "../data/events";
import { activeHosting, loadOfficialEvents, useEvents, useOfficial } from "../store/events";
import { normCode, useGame } from "../store/game";
import { useUI } from "../store/ui";
import { joinRoom, leaveRoom, onRoomNotice, refreshHost, sendNotice, useRoom, watchLobby } from "../net/room";
import { useL, useT } from "../i18n";
import { Icon } from "./Icon";
import { Sheet, Tabs } from "./Panels";

const mmss = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const fmtDate = (iso: string, lang: string) => new Date(iso).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", { month: "short", day: "numeric" });
/** 1초마다 다시 그리기 (남은 시간 표시) */
function useNow(on = true) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!on) return; const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, [on]);
  return now;
}

/** 아직 보지 않았거나 받을 보상이 남은 공식 이벤트 수 (HUD 표시용) */
export function useEventBadge() {
  const list = useOfficial((s) => s.list);
  const seen = useEvents((s) => s.seen);
  const claimed = useEvents((s) => s.claimed);
  useEffect(() => { void loadOfficialEvents(); }, []);
  const now = Date.now();
  return list.filter((e) => isActive(e, now) && (!seen.includes(e.id) || (e.reward && !claimed.includes(e.id)))).length;
}

// ───────────── 장소에 맞는 방 배정 ─────────────
export function LiveLoungeSync() {
  const t = useT();
  const world = useUI((s) => s.world);
  const visiting = useUI((s) => s.visiting);
  const shopCode = useUI((s) => s.shop?.code ?? "");
  const open = useEvents((s) => s.open);
  const code = useGame((s) => s.friendCode);
  const nonce = useRoom((s) => s.nonce);
  const want = world ? null : shopCode ? `guest:${shopCode}` : !visiting && open ? `host:${code}` : null;
  useEffect(() => {
    if (!want) { leaveRoom(); return; }
    const [role, c] = want.split(":") as ["host" | "guest", string];
    joinRoom(c, role);
  }, [want, nonce]);
  useEffect(() => () => leaveRoom(), []);

  // 주인: 꾸밈·홍보·이벤트가 바뀌면 다시 알리고, 이벤트가 끝나는 순간에도 한 번 알린다
  const lounge = useGame((s) => s.lounge);
  const look = useGame((s) => s.look);
  const promo = useGame((s) => s.promo);
  const hosting = useEvents((s) => s.hosting);
  useEffect(() => { refreshHost(); }, [lounge, look, promo, hosting]);
  useEffect(() => {
    if (!hosting) return;
    const left = hosting.until - Date.now();
    if (left <= 0) { useEvents.getState().endLoungeEvent(); return; }
    const id = setTimeout(() => useEvents.getState().endLoungeEvent(), left + 50);
    return () => clearTimeout(id);
  }, [hosting]);

  // 방문 · 공지 · 혜택 알림
  useEffect(() => {
    onRoomNotice((kind, name, extra) => {
      const ui = useUI.getState();
      const lang = useGame.getState().settings.lang;
      if (kind === "join") ui.toast(`${t("live.joined", { name })}${extra ? ` · ${extra}` : ""}`, "reward");
      else if (kind === "perk") ui.toast(`${t("live.perk", { name })} ${extra ?? ""}`, "reward");
      else { const n = NOTICES[Number(extra)]; if (n) ui.toast(`${name}: ${lang === "ko" ? n.ko : n.en}`); }
    });
    return () => onRoomNotice(null);
  }, [t]);
  return null;
}

// ───────────── 라운지 안 실시간 표시줄 ─────────────
export function LiveBar() {
  const t = useT(); const L = useL();
  const st = useRoom();
  const hosting = useEvents((s) => s.hosting);
  const now = useNow(st.status === "online");
  if (st.status !== "online" && st.status !== "connecting") return null;
  const ev = st.role === "host" ? activeHosting(hosting, now) : st.host?.ev && st.host.ev.until > now ? st.host.ev : null;
  const type = ev ? LOUNGE_EVENT_MAP[ev.id] : null;
  const visitors = st.ids.filter((id) => id).length;
  const notice = st.notice && now - st.notice.at < 12000 ? NOTICES[st.notice.id] : null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-[152px] z-20 flex w-[min(92%,420px)] -translate-x-1/2 flex-col items-center gap-1.5 sm:top-[104px]" data-testid="live-bar">
      <button onClick={() => useUI.setState({ panel: "events" })} className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full bg-ink/80 py-1.5 pl-3 pr-1.5 text-[12px] font-bold text-cream shadow-lg backdrop-blur">
        <span className={`h-2 w-2 shrink-0 rounded-full ${st.status === "online" ? "bg-emerald-400" : "bg-amber-300"}`} />
        <span className="min-w-0 truncate">
          {st.role === "host" ? t("live.hosting", { n: visitors }) : st.host ? t("live.visiting", { name: st.host.name, n: Math.max(0, visitors - 1) }) : t("live.visitingSnap")}
        </span>
        <span className="shrink-0 whitespace-nowrap rounded-full bg-pink-deep px-2.5 py-1 text-[12px] text-white">{st.role === "host" ? t("live.manage") : t("live.events")}</span>
      </button>
      {type && ev && (
        <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-2xl px-3 py-1.5 text-[12px] font-bold text-white shadow-lg" style={{ background: type.color }} data-testid="live-event">
          <Icon n="party" className="!h-4 !w-4 shrink-0" />
          <span className="min-w-0 truncate">{L(type)} · {t("live.left", { t: mmss(ev.until - now) })}</span>
        </div>
      )}
      {notice && st.notice && (
        <div className="max-w-full truncate rounded-2xl bg-white/95 px-3 py-1.5 text-[12px] font-bold text-ink shadow-lg" data-testid="live-notice">
          <Icon n="bell" className="!h-4 !w-4 text-pink-deep" /> {st.notice.name}: {L(notice)}
        </div>
      )}
    </div>
  );
}

// ───────────── 코드로 방문 ─────────────
/** 주인이 라운지를 열어 둔 경우에만 들어갈 수 있다 (6초 동안 주인을 찾는다) */
export async function visitByCode(raw: string): Promise<"ok" | "closed" | "self" | "bad"> {
  const code = normCode(raw);
  if (!code) return "bad";
  if (code === useGame.getState().friendCode) return "self";
  joinRoom(code, "guest");
  const host = await new Promise<ReturnType<typeof useRoom.getState>["host"]>((resolve) => {
    const done = (h: ReturnType<typeof useRoom.getState>["host"]) => { clearTimeout(to); unsub(); resolve(h); };
    const unsub = useRoom.subscribe((s) => { if (s.code === code && s.host) done(s.host); else if (s.code !== code) done(null); });
    const to = setTimeout(() => done(null), 6000);
    const cur = useRoom.getState();
    if (cur.code === code && cur.host) done(cur.host);
  });
  if (!host) {
    if (useRoom.getState().code === code && useRoom.getState().role === "guest") { leaveRoom(); useRoom.setState((s) => ({ nonce: s.nonce + 1 })); }
    return "closed";
  }
  useUI.setState({ shop: { name: host.name, code, look: host.look, stage: host.stage, rank: host.rank, lounge: host.lounge }, visiting: "shop", world: null, customers: [], near: null, nearCustomer: null, nearPet: null, panel: null, mode: "explore" });
  return "ok";
}

// ───────────── 패널 ─────────────
export function EventsPanel() {
  const t = useT();
  const [tab, setTab] = useState<"news" | "open" | "mine">("news");
  return (
    <Sheet title="EVENT & OPEN LOUNGE">
      <Tabs tabs={[["news", t("ev.tabNews")], ["open", t("ev.tabOpen")], ["mine", t("ev.tabMine")]]} value={tab} onPick={setTab} />
      {tab === "news" && <News />}
      {tab === "open" && <OpenLounges />}
      {tab === "mine" && <MyLounge />}
    </Sheet>
  );
}

function News() {
  const t = useT(); const L = useL();
  const lang = useGame((s) => s.settings.lang);
  const { list, status } = useOfficial();
  const claimed = useEvents((s) => s.claimed);
  const now = Date.now();
  const active = list.filter((e) => isActive(e, now));
  const soon = list.filter((e) => isUpcoming(e, now));
  useEffect(() => { void loadOfficialEvents(); }, []);
  useEffect(() => { if (active.length) useEvents.getState().markSeen(active.map((e) => e.id)); }, [active.length]);
  const go = (e: OfficialEvent) => {
    const ui = useUI.getState();
    if (e.cta === "plaza") ui.set({ panel: null, world: "plaza", visiting: null, shop: null, customers: [], mode: "explore", near: null, nearCustomer: null, nearPet: null });
    else if (e.cta === "lounge") ui.set({ panel: "lounge" });
    else if (e.cta === "life") ui.set({ panel: "life" });
    else if (e.cta === "shop") ui.set({ panel: "shop", shopTab: "product" });
    else if (e.cta === "care") ui.set({ panel: "care" });
  };
  const card = (e: OfficialEvent, live: boolean) => {
    const got = claimed.includes(e.id);
    const r = e.reward;
    return (
      <div key={e.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-ink/5" data-testid={`event-${e.id}`}>
        <div className="px-4 py-3 text-white" style={{ background: `linear-gradient(135deg, ${e.color}, ${e.color}bb)` }}>
          <p className="text-[12px] font-bold tracking-[0.2em] opacity-90">{live ? "NOW ON" : "COMING SOON"} · {fmtDate(e.start, lang)} – {fmtDate(e.end, lang)}</p>
          <p className="text-base font-black">{L(e)}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[13px] leading-relaxed text-ink/70">{lang === "ko" ? e.descKo : e.descEn}</p>
          {r && <p className="mt-1.5 text-[12px] font-bold text-gold">{t("ev.reward")}: {[r.coins ? `${r.coins} COIN` : "", r.gems ? `${r.gems} GEM` : "", r.stars ? `${r.stars} STAR` : ""].filter(Boolean).join(" · ")}</p>}
          {live && (
            <div className="mt-2 flex gap-2">
              {r && <button disabled={got} className="btn-primary flex-1 !py-2 text-xs disabled:opacity-40" data-testid={`claim-${e.id}`}
                onClick={() => { const x = useEvents.getState().claimOfficial(e); if (x) useUI.getState().toast(`${L(e)} · ${t("ev.claimed")}`, "reward"); }}>{got ? t("ev.claimedDone") : t("ev.claim")}</button>}
              {e.cta && <button className="btn-ghost flex-1 !py-2 text-xs" onClick={() => go(e)}>{t("ev.go")}</button>}
            </div>
          )}
        </div>
      </div>
    );
  };
  return (
    <div className="space-y-3">
      {status === "loading" && list.length === 0 && <p className="text-[13px] text-ink/50">{t("ev.loading")}</p>}
      {status === "error" && <p className="text-[13px] text-ink/50">{t("ev.error")}</p>}
      {status === "ok" && active.length === 0 && soon.length === 0 && <p className="text-[13px] text-ink/50">{t("ev.none")}</p>}
      {active.map((e) => card(e, true))}
      {soon.map((e) => card(e, false))}
      <p className="text-[12px] leading-relaxed text-ink/45">{t("ev.note")}</p>
    </div>
  );
}

function OpenLounges() {
  const t = useT(); const L = useL();
  const { lobby, lobbyStatus } = useRoom();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const now = useNow();
  useEffect(() => { watchLobby(true); return () => watchLobby(false); }, []);
  const visit = async (c: string) => {
    setBusy(true);
    const r = await visitByCode(c);
    setBusy(false);
    if (r !== "ok") useUI.getState().toast(t(`live.visit.${r}`), "error");
  };
  return (
    <>
      <p className="text-[13px] leading-relaxed text-ink/60">{t("live.openDesc")}</p>
      <div className="mt-3 flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))} placeholder={t("live.codePh")} className="min-w-0 flex-1 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-bold tracking-widest text-ink outline-none focus:border-pink-deep" data-testid="visit-code" />
        <button disabled={busy || !normCode(code)} className="btn-primary !px-4 !py-2 text-xs disabled:opacity-40" onClick={() => visit(code)} data-testid="visit-go">{busy ? "..." : t("live.visitBtn")}</button>
      </div>
      <p className="mt-4 text-xs font-black text-ink">{t("live.nowOpen")} {lobbyStatus === "online" ? `(${lobby.length})` : ""}</p>
      {lobbyStatus === "connecting" && <p className="mt-1 text-[12px] text-ink/50">{t("live.connecting")}</p>}
      {lobbyStatus === "offline" && <p className="mt-1 text-[12px] text-ink/50">{t("live.offline")}</p>}
      {lobbyStatus === "online" && lobby.length === 0 && <p className="mt-1 text-[12px] text-ink/50">{t("live.emptyLobby")}</p>}
      <div className="mt-2 space-y-1.5">
        {lobby.map((o) => {
          const ev = o.ev && o.ev.until > now ? LOUNGE_EVENT_MAP[o.ev.id] : null;
          return (
            <div key={o.code} className="flex items-center gap-2 rounded-2xl bg-ink/5 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-ink">{o.name} <span className="text-[12px] font-bold text-ink/40">LV.{o.level} · {t("live.guestsN", { n: o.guests })}</span></p>
                {ev && o.ev && <p className="truncate text-[12px] font-bold" style={{ color: ev.color }}>{L(ev)} · {t("live.left", { t: mmss(o.ev.until - now) })}</p>}
              </div>
              <button disabled={busy} className="btn-primary shrink-0 !px-3 !py-1.5 text-xs disabled:opacity-40" onClick={() => visit(o.code)}>{t("live.visitBtn")}</button>
            </div>
          );
        })}
      </div>
    </>
  );
}

function MyLounge() {
  const t = useT(); const L = useL();
  const g = useGame();
  const ev = useEvents();
  const room = useRoom();
  const world = useUI((s) => s.world);
  const away = useUI((s) => !!s.visiting);
  const now = useNow();
  const live = activeHosting(ev.hosting, now);
  const type = live ? LOUNGE_EVENT_MAP[live.id] : null;
  const hostingNow = room.role === "host" && room.status === "online";
  const start = (id: number) => {
    const r = ev.startLoungeEvent(id);
    if (r === "ok") useUI.getState().toast(t("live.evStarted", { name: L(LOUNGE_EVENT_MAP[id]) }), "reward");
    else useUI.getState().toast(t(`live.evFail.${r}`), "error");
  };
  return (
    <>
      <div className="rounded-3xl bg-gradient-to-br from-pink-soft to-lav/70 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[12px] font-bold tracking-[0.2em] text-ink/60">OPEN LOUNGE</p>
            <p className="text-sm font-black text-ink">{t("live.myCode")} <span className="select-all tracking-widest text-pink-deep" data-testid="my-code">{g.friendCode}</span></p>
          </div>
          <button className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${ev.open ? "bg-ink text-cream" : "bg-white text-ink/60"}`} onClick={() => ev.setOpen(!ev.open)} data-testid="open-toggle">{ev.open ? t("live.isOpen") : t("live.isClosed")}</button>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-ink/60">
          {!ev.open ? t("live.closedDesc") : world || away ? t("live.notHome") : hostingNow ? t("live.hosting", { n: room.ids.length }) : t("live.connecting")}
        </p>
      </div>

      <p className="mt-4 text-xs font-black text-ink">{t("live.evTitle")}</p>
      <p className="mt-0.5 text-[12px] leading-relaxed text-ink/55">{t("live.evDesc")}</p>
      {live && type ? (
        <div className="mt-2 rounded-2xl p-3 text-white" style={{ background: type.color }} data-testid="hosting-event">
          <p className="text-sm font-black">{L(type)} · {t("live.left", { t: mmss(live.until - now) })}</p>
          <p className="text-[12px] opacity-90">{g.settings.lang === "ko" ? type.descKo : type.descEn}</p>
          <button className="mt-2 rounded-full bg-white/25 px-3 py-1 text-[12px] font-bold" onClick={() => ev.endLoungeEvent()}>{t("live.evEnd")}</button>
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {LOUNGE_EVENTS.map((e) => (
            <button key={e.id} className="rounded-2xl border border-ink/10 bg-white p-2.5 text-left" onClick={() => start(e.id)} data-testid={`start-ev-${e.id}`}>
              <p className="text-[13px] font-black" style={{ color: e.color }}>{L(e)}</p>
              <p className="mt-0.5 text-[12px] leading-snug text-ink/55">{g.settings.lang === "ko" ? e.descKo : e.descEn}</p>
              <p className="mt-1 text-[12px] font-bold text-ink/70">{e.minutes}{t("live.min")} · {e.cost} COIN</p>
            </button>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs font-black text-ink">{t("live.noticeTitle")}</p>
      <p className="mt-0.5 text-[12px] leading-relaxed text-ink/55">{hostingNow ? t("live.noticeDesc") : t("live.noticeOff")}</p>
      <div className="mt-2 flex flex-col gap-1.5">
        {NOTICES.map((n) => (
          <button key={n.id} disabled={!hostingNow} className="chip text-left disabled:opacity-40" onClick={() => { if (sendNotice(n.id)) useUI.getState().toast(t("live.noticeSent")); }}>{L(n)}</button>
        ))}
      </div>
    </>
  );
}
