/** 메인 HUD: 상단 프로필·재화, 하단 내비게이션, 상호작용 버튼, 조이스틱, 모드별 툴바 */
import { useEffect, useRef, useState } from "react";
import { DEMO_FRIENDS, INTERIOR_MAP, POSES, QUESTS, STAGES } from "../data/game";
import { claimableCount, earnedStage, levelOf, questClaimed, questValue, totalExp, useGame } from "../store/game";
import { input, useUI, type ZoneKey } from "../store/ui";
import { openCare } from "../store/care";
import { useL, useT } from "../i18n";

export const Coin = ({ n, icon, title }: { n: number; icon: string; title: string }) => (
  <span title={title} className="flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-xs font-bold text-ink shadow-sm backdrop-blur">
    <span>{icon}</span>{n.toLocaleString()}
  </span>
);

function doAction() {
  const ui = useUI.getState();
  if (ui.mode !== "explore" || ui.panel || ui.consult) return;
  if (ui.nearCustomer) return ui.set({ consult: ui.nearCustomer });
  const z = ui.near;
  if (!z) return;
  if (z === "device") openCare("player");
  else if (z === "shelf") ui.set({ panel: "shop", shopTab: "product" });
  else if (z === "reception") ui.set({ panel: "customers" });
  else if (z === "vanity") ui.set({ panel: "character" });
  else if (z === "photo") ui.set({ mode: "photo", near: null });
}

export function Hud() {
  const t = useT();
  const L = useL();
  const g = useGame();
  const mode = useUI((s) => s.mode);
  const panel = useUI((s) => s.panel);
  const near = useUI((s) => s.near);
  const nearCustomer = useUI((s) => s.nearCustomer);
  const visiting = useUI((s) => s.visiting);
  const set = useUI((s) => s.set);
  const open = useUI((s) => s.open);
  const total = totalExp(g);
  const stage = STAGES[g.stage - 1];
  const next = STAGES[g.stage];
  const pct = next ? Math.min(100, ((total - stage.need) / (next.need - stage.need)) * 100) : 100;
  const claimable = claimableCount(g);
  const daily = QUESTS.find((q) => q.daily && !questClaimed(g, q));

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.code === "KeyE" || e.code === "Space" || e.code === "Enter") { e.preventDefault(); doAction(); }
      if (e.code === "Escape") useUI.setState({ panel: null, consult: null });
    };
    window.addEventListener("keydown", kd);
    return () => window.removeEventListener("keydown", kd);
  }, []);

  const explore = mode === "explore";
  const zoneLabel: Record<ZoneKey, string> = { shelf: t("zone.shelf"), device: t("zone.device"), reception: t("zone.reception"), vanity: t("zone.vanity"), photo: t("zone.photo") };
  const action = nearCustomer ? t("action.consult") : near ? zoneLabel[near] : null;

  return (
    <>
      {/* 상단 */}
      {(explore || mode === "edit") && (
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex flex-col gap-2 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:p-3">
          <div className="flex items-start justify-between gap-2">
            <button onClick={() => open("growth")} className="pointer-events-auto flex min-w-0 items-center gap-2 rounded-full bg-white/85 py-1 pl-1 pr-3 shadow-sm backdrop-blur">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-deep to-lav text-sm font-black text-white">{g.name.slice(0, 1).toUpperCase()}</span>
              <span className="min-w-0 text-left">
                <span className="block truncate text-xs font-black text-ink">{g.name} <span className="font-semibold text-pink-deep">Lv.{levelOf(total)}</span></span>
                <span className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-[9px] font-bold tracking-wider text-gold">STAGE {g.stage}</span>
                  <span className="block h-1.5 w-16 overflow-hidden rounded-full bg-pink-soft sm:w-24"><span className="block h-full rounded-full bg-gradient-to-r from-pink-deep to-gold transition-all" style={{ width: `${pct}%` }} /></span>
                </span>
              </span>
            </button>
            <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5">
              <Coin n={g.coins} icon="🪙" title="BEAUTY COIN" />
              <Coin n={g.gems} icon="💎" title="BEAUTY GEM" />
              <Coin n={g.stars} icon="⭐" title="SOCIAL STAR" />
              <Coin n={g.lp} icon="🏛️" title="LOUNGE POINT" />
              <button onClick={() => open("quests")} className="relative rounded-full bg-white/85 px-2.5 py-1 text-xs shadow-sm backdrop-blur" aria-label="quests">
                📋{claimable > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-deep text-[9px] font-bold text-white">{claimable}</span>}
              </button>
              <button onClick={() => open("profile")} className="rounded-full bg-white/85 px-2.5 py-1 text-xs shadow-sm backdrop-blur" aria-label="profile">👤</button>
              <button onClick={() => open("settings")} className="rounded-full bg-white/85 px-2.5 py-1 text-xs shadow-sm backdrop-blur" aria-label="settings">⚙️</button>
            </div>
          </div>
          {explore && !panel && !visiting && daily && (
            <button onClick={() => open("quests")} className="pointer-events-auto mx-auto max-w-[92%] truncate rounded-full bg-ink/75 px-3 py-1 text-[11px] font-semibold text-cream backdrop-blur">
              🎯 {t("hud.today")} · {L(daily)} ({Math.min(daily.goal, questValue(g, daily))}/{daily.goal})
            </button>
          )}
        </div>
      )}

      {/* 친구 라운지 방문 중 */}
      {visiting && explore && <VisitBanner />}

      {/* 상호작용 버튼 */}
      {explore && !panel && action && (
        <button onClick={doAction} className="absolute bottom-[104px] left-1/2 z-20 -translate-x-1/2 animate-bounce rounded-full bg-pink-deep px-6 py-3 text-sm font-black text-white shadow-lg shadow-pink-deep/40">
          {action} <span className="ml-1 hidden rounded bg-white/25 px-1.5 text-[10px] sm:inline">E</span>
        </button>
      )}
      {explore && !panel && !action && !visiting && (
        <p className="pointer-events-none absolute bottom-[100px] left-1/2 z-10 hidden -translate-x-1/2 rounded-full bg-white/70 px-3 py-1 text-[11px] text-ink/60 backdrop-blur md:block">{t("hud.hint")}</p>
      )}

      {explore && !panel && <Joystick />}
      {mode === "edit" && <EditBar />}
      {mode === "photo" && <PhotoBar />}

      {/* 하단 내비게이션 */}
      {explore && !visiting && (
        <nav className="absolute bottom-0 left-0 right-0 z-30 flex justify-center px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="flex w-full max-w-xl items-stretch justify-between gap-1 rounded-3xl bg-white/90 p-1.5 shadow-[0_8px_30px_rgba(231,154,174,0.35)] backdrop-blur">
            {([
              ["character", "👧", "nav.character"], ["lounge", "🏛️", "nav.lounge"], ["care", "✨", "nav.care"], ["shop", "🧴", "nav.shop"], ["social", "💬", "nav.social"],
            ] as const).map(([id, icon, key]) => (
              <button key={id} onClick={() => (id === "care" ? openCare("player") : open(id))}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[10px] font-bold transition-colors ${id === "care" ? "bg-gradient-to-b from-pink-deep to-[#d9799a] text-white shadow" : panel === id ? "bg-pink-soft text-ink" : "text-ink/70"}`}>
                <span className="text-xl leading-none">{icon}</span>{t(key)}
              </button>
            ))}
          </div>
        </nav>
      )}
      <Overlays />
    </>
  );
}

function VisitBanner() {
  const t = useT();
  const visiting = useUI((s) => s.visiting);
  const f = DEMO_FRIENDS.find((x) => x.id === visiting);
  const [liked, setLiked] = useState(false);
  if (!f) return null;
  return (
    <div className="absolute bottom-6 left-1/2 z-30 flex w-[92%] max-w-md -translate-x-1/2 items-center gap-2 rounded-3xl bg-white/90 p-3 shadow-xl backdrop-blur">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-ink">{f.country} {t("visit.title", { name: f.name })}</p>
        <p className="text-[10px] text-ink/50">{t("visit.demo")}</p>
      </div>
      <button className={`chip ${liked ? "chip-on" : ""}`} onClick={() => { if (!liked) { setLiked(true); useGame.getState().bump("like", 1, true); useUI.getState().toast("💗 +1"); } }}>♥</button>
      <button className="btn-primary !px-4 !py-2 text-xs" onClick={() => useUI.setState({ visiting: null })}>{t("visit.back")}</button>
    </div>
  );
}

function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const id = useRef<number | null>(null);
  const upd = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    input.joy.x = x; input.joy.y = -y; setKnob({ x, y });
  };
  const end = () => { id.current = null; input.joy.x = 0; input.joy.y = 0; setKnob({ x: 0, y: 0 }); };
  return (
    <div ref={base} className="joystick absolute bottom-[112px] left-5 z-20 h-28 w-28 touch-none rounded-full border-2 border-white/80 bg-white/35 backdrop-blur"
      onPointerDown={(e) => { e.stopPropagation(); id.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); upd(e); }}
      onPointerMove={(e) => { if (id.current === e.pointerId) { e.stopPropagation(); upd(e); } }}
      onPointerUp={end} onPointerCancel={end}>
      <div className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full bg-pink-deep/90 shadow-lg" style={{ transform: `translate(calc(-50% + ${knob.x * 34}px), calc(-50% + ${knob.y * 34}px))` }} />
    </div>
  );
}

function EditBar() {
  const t = useT();
  const L = useL();
  const g = useGame();
  const selected = useUI((s) => s.selected);
  const stored = Object.entries(g.storage).filter(([, n]) => n > 0);
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(231,154,174,0.35)] backdrop-blur">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-black text-ink">🛋️ {t("edit.title")}</p>
          <div className="flex gap-2">
            <button disabled={!selected} className="chip disabled:opacity-40" onClick={() => selected && g.rotateFurniture(selected)}>↻ {t("edit.rotate")}</button>
            <button disabled={!selected} className="chip disabled:opacity-40" onClick={() => { if (selected) { g.storeFurniture(selected); useUI.setState({ selected: null }); } }}>📦 {t("edit.store")}</button>
            <button className="btn-primary !px-4 !py-1.5 text-xs" onClick={() => useUI.setState({ mode: "explore", selected: null })}>{t("common.done")}</button>
          </div>
        </div>
        <p className="mt-1 text-[11px] text-ink/55">{selected ? t("edit.hintMove") : t("edit.hintSelect")}</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {stored.length === 0 && <p className="py-2 text-xs text-ink/50">{t("edit.empty")}</p>}
          {stored.map(([id, n]) => (
            <button key={id} className="chip shrink-0" onClick={() => { const uid = g.place(id); if (uid) useUI.setState({ selected: uid }); }}>
              + {INTERIOR_MAP[id] ? L(INTERIOR_MAP[id]) : id} ×{n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const TAGS = ["#BeautyRoutine", "#OOTD", "#LoungeStory", "#BeautyChallenge", "#GrowthDiary"];
function PhotoBar() {
  const t = useT();
  const look = useGame((s) => s.look);
  const [tag, setTag] = useState(TAGS[0]);
  const [text, setText] = useState("");
  const [shot, setShot] = useState<string | null>(null);
  const snap = () => {
    try {
      const cv = document.querySelector("canvas") as HTMLCanvasElement | null;
      if (!cv) return;
      const s = Math.min(cv.width, cv.height);
      const out = document.createElement("canvas"); out.width = out.height = 360;
      out.getContext("2d")!.drawImage(cv, (cv.width - s) / 2, (cv.height - s) / 2, s, s, 0, 0, 360, 360);
      setShot(out.toDataURL("image/jpeg", 0.72));
      useUI.setState({ flash: 0.9 });
      setTimeout(() => useUI.setState({ flash: 0 }), 160);
    } catch { useUI.getState().toast(t("photo.fail")); }
  };
  const post = () => {
    if (!shot) return;
    useGame.getState().addPost({ text: text.trim() || t("photo.defaultText"), tag, img: shot });
    useUI.getState().toast(t("photo.posted"));
    useUI.setState({ mode: "explore", panel: "social" });
  };
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(231,154,174,0.35)] backdrop-blur">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-ink">📸 {t("photo.title")}</p>
          <button className="chip" onClick={() => useUI.setState({ mode: "explore" })}>{t("common.close")}</button>
        </div>
        {!shot ? (
          <>
            <div className="mt-2 flex flex-wrap gap-2">
              {POSES.map((p) => <button key={p} className={`chip ${look.pose === p ? "chip-on" : ""}`} onClick={() => useGame.getState().setLook({ pose: p })}>{t(`pose.${p}`)}</button>)}
            </div>
            <p className="mt-2 text-[11px] text-ink/50">{t("photo.hint")}</p>
            <button className="btn-primary mt-2 w-full" onClick={snap}>● {t("photo.shoot")}</button>
          </>
        ) : (
          <div className="mt-2 flex gap-3">
            <img src={shot} alt="" className="h-28 w-28 rounded-2xl object-cover shadow" />
            <div className="min-w-0 flex-1">
              <input value={text} maxLength={60} onChange={(e) => setText(e.target.value)} placeholder={t("photo.caption")} className="w-full rounded-xl border border-pink-soft px-3 py-2 text-sm outline-none focus:border-pink-deep" />
              <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1">{TAGS.map((x) => <button key={x} className={`chip shrink-0 !text-[10px] ${tag === x ? "chip-on" : ""}`} onClick={() => setTag(x)}>{x}</button>)}</div>
              <div className="mt-1.5 flex gap-2">
                <button className="btn-ghost flex-1 !py-2 text-xs" onClick={() => setShot(null)}>{t("photo.retake")}</button>
                <button className="btn-primary flex-1 !py-2 text-xs" onClick={post}>{t("photo.post")}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Overlays() {
  const toasts = useUI((s) => s.toasts);
  const flash = useUI((s) => s.flash);
  const cine = useUI((s) => s.cine);
  const st = cine ? STAGES[cine.to - 1] : null;
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-40 bg-white" style={{ opacity: flash * 0.9 }} />
      {st && (
        <div className="pointer-events-none absolute inset-x-0 top-[14%] z-50 text-center">
          <p className="text-xs font-bold tracking-[0.4em] text-gold drop-shadow">CHARACTER EVOLUTION</p>
          <p className="mt-2 text-4xl font-black text-ink drop-shadow-[0_2px_12px_rgba(255,255,255,0.9)] sm:text-6xl">STAGE {st.n}</p>
          <p className="mt-1 text-xl font-black tracking-wider text-pink-deep drop-shadow-[0_2px_10px_rgba(255,255,255,0.9)] sm:text-3xl">{st.name}</p>
        </div>
      )}
      <div className="pointer-events-none absolute left-1/2 top-24 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((x) => <div key={x.id} className="toast rounded-full bg-ink/105 px-4 py-2 text-xs font-semibold text-cream shadow-lg">{x.text}</div>)}
      </div>
    </>
  );
}

/** 저장된 단계보다 달성 단계가 높으면 안내 (연출 대기) */
export function usePendingEvolution() {
  return useGame((s) => earnedStage(s) > s.stage);
}
