/** LIFE: 뷰티 가든(식물) · 웰니스 피트니스(리듬 운동) · 인테리어 소품 컬렉션 · 친구(선물·도움·초대 보상) */
import { useEffect, useRef, useState } from "react";
import { DEMO_FRIENDS, LOUNGE_LEVELS } from "../data/game";
import {
  BOX_COST, CURIO_SETS, CURIOS, DUP_REFUND, FIT_STEPS, FIT_TITLES_EN, FIT_TITLES_KO, FRIEND_MILESTONES, GIFT_COINS, GIFT_DAILY, HELP_COINS, HELP_DAILY,
  PLANT_MAP, PLANTS, RARITY_ODDS, WATER_EVERY_H, WORKOUT_DAILY, WORKOUTS, fitLevel, growth, potsFor, type Workout, FERTILIZER_COST, goldenChance } from "../data/life";
import { useGame } from "../store/game";
import { lifeDaily, ownedCurios, useLife } from "../store/life";
import { useUI } from "../store/ui";
import { useL, useT } from "../i18n";
import { Icon, Price } from "./Icon";
import { BragButton } from "./Brag";
import { BoxArt, CurioArt, PlantArt, WorkoutArt } from "./LifeArt";
import { Preview } from "./Screens";
import { StyleChallenge } from "./StyleChallenge";

const toast = (s: string, sound?: Parameters<ReturnType<typeof useUI.getState>["toast"]>[1]) => useUI.getState().toast(s, sound);
type Tab = "style" | "garden" | "fit" | "collect" | "friends";

export function LifeBody() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("style");
  return (
    <>
      <div className="sticky top-0 z-10 -mx-1 mb-2 flex gap-1 overflow-x-auto bg-white/95 px-1 py-1">
        {([["style", t("life.style")], ["garden", t("life.garden")], ["fit", t("life.fit")], ["collect", t("life.collect")], ["friends", t("life.friends")]] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${tab === id ? "bg-ink text-cream" : "bg-ink/5 text-ink/60"}`}>{label}</button>
        ))}
      </div>
      {tab === "style" && <StyleChallenge />}
      {tab === "garden" && <Garden />}
      {tab === "fit" && <Fitness />}
      {tab === "collect" && <Collection />}
      {tab === "friends" && <Friends />}
    </>
  );
}

/** 1초마다 다시 그려 남은 시간·성장 단계를 갱신 */
function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(id); }, [ms]);
  return now;
}
const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

// ───────────── 가든 ─────────────
function Garden() {
  const t = useT(); const L = useL();
  const life = useLife(); const lv = useGame((s) => s.lounge.level);
  const now = useNow();
  const pots = potsFor(lv);
  return (
    <>
      <p className="text-[13px] leading-relaxed text-ink/60">{t("garden.desc")}</p>
      <p className="mt-3 text-[13px] font-black tracking-wide text-pink-deep">{t("garden.pots")} ({life.garden.length}/{pots})</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        {life.garden.map((slot) => {
          const p = PLANT_MAP[slot.type]; if (!p) return null;
          const g = growth(slot, p, now);
          const canWater = now - slot.lastWater >= WATER_EVERY_H * 3_600_000 && g.stage < 3;
          return (
            <div key={slot.id} className="card !p-2.5" data-testid="plant">
              <div className="flex items-center gap-2">
                <PlantArt color={p.color} stage={g.stage} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-ink">{L(p)}</p>
                  <p className="text-[12px] font-semibold text-ink/50">{g.stage >= 3 ? t("garden.ready") : `${t(`garden.stage${g.stage}`)} · ${fmtMin(g.leftMin)}`}</p>
                </div>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full" style={{ width: `${g.ratio * 100}%`, background: p.color }} /></div>
              {g.stage >= 3 ? (
                <button className="btn-primary mt-2 w-full !py-1.5 text-xs" data-testid="harvest" onClick={() => { const r = life.harvest(slot.id); if (r) toast(`${r.golden ? `✨ ${t("garden.golden")} ` : ""}${t("garden.harvested")} ${r.ingredient} · +${r.coins} COIN`, "reward"); }}>{t("garden.harvest")}</button>
              ) : (
                <div className="mt-2 flex gap-1.5">
                  <button disabled={!canWater} className="btn-ghost min-w-0 flex-1 !px-2 !py-1.5 text-xs disabled:opacity-40" onClick={() => { if (life.water(slot.id)) toast(t("garden.watered"), "pickup"); }}>
                    <Icon n="drop" /> {canWater ? t("garden.water") : t("garden.wait")}
                  </button>
                  {!slot.fert && (
                    <button className="btn-ghost shrink-0 !px-2 !py-1.5 text-[12px]" data-testid="fertilize" title={t("garden.fertHint")} onClick={() => { const r = life.fertilize(slot.id); toast(r === "ok" ? t("garden.fertDone") : r === "money" ? t("shop.noMoney") : t("garden.fertUsed"), r === "ok" ? "pickup" : "error"); }}>
                      {t("garden.fert")} <Price c="coin" n={FERTILIZER_COST} />
                    </button>
                  )}
                </div>
              )}
              <p className="mt-1 text-[12px] font-semibold text-gold">✨ {t("garden.goldenOdds", { n: Math.round(goldenChance(slot) * 100) })}{slot.fert ? ` · ${t("garden.fertOn")}` : ""}</p>
            </div>
          );
        })}
        {Array.from({ length: Math.max(0, pots - life.garden.length) }).map((_, i) => (
          <div key={`e${i}`} className="flex min-h-[92px] items-center justify-center rounded-2xl border-2 border-dashed border-pink-soft text-[12px] font-semibold text-ink/40">{t("garden.empty")}</div>
        ))}
      </div>
      <p className="mt-4 text-[13px] font-black tracking-wide text-pink-deep">{t("garden.seeds")}</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        {PLANTS.map((p) => {
          const locked = lv < p.minLevel;
          return (
            <button key={p.id} disabled={locked || life.garden.length >= pots} className="card !p-2 text-left disabled:opacity-50"
              onClick={() => { const r = life.plant(p.id); toast(r === "ok" ? `${L(p)} ${t("garden.planted")}` : r === "money" ? t("shop.noMoney") : r === "full" ? t("garden.full") : t("garden.locked"), r === "ok" ? "pickup" : "error"); }}>
              <span className="flex items-center gap-2"><PlantArt color={p.color} stage={3} size={28} /><span className="min-w-0 truncate text-xs font-bold text-ink">{L(p)}</span></span>
              <span className="mt-1 block text-[12px] font-semibold text-ink/50">
                {locked ? <><Icon n="lock" /> LOUNGE LV.{p.minLevel}</> : <><Price c="coin" n={p.seed} /> → {p.coins} · {fmtMin(p.hours * 60)}</>}
              </span>
            </button>
          );
        })}
      </div>
      {Object.keys(life.harvested).length > 0 && (
        <>
          <div className="mt-4 flex items-center justify-between gap-2"><p className="text-[13px] font-black tracking-wide text-pink-deep">{t("garden.book")}</p><BragButton kind="plant" /></div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {PLANTS.filter((p) => life.harvested[p.id]).map((p) => <span key={p.id} className="chip inline-flex items-center gap-1"><PlantArt color={p.color} stage={3} size={18} /> {p.ingredient} ×{life.harvested[p.id]}{(life.golden ?? {})[p.id] ? <b className="text-gold"> ✨{life.golden[p.id]}</b> : null}</span>)}
          </div>
        </>
      )}
      <p className="mt-3 text-[12px] leading-relaxed text-ink/45">{t("garden.note").replace("{n}", String(potsFor(Math.min(lv + 1, LOUNGE_LEVELS.length))))}</p>
    </>
  );
}

// ───────────── 피트니스 ─────────────
function Fitness() {
  const t = useT(); const L = useL();
  const life = useLife(); const lang = useGame((s) => s.settings.lang);
  const [playing, setPlaying] = useState<Workout | null>(null);
  const lvl = fitLevel(life.fit);
  const next = FIT_STEPS[lvl] ?? null;
  const d = lifeDaily(life);
  if (playing) return <WorkoutGame w={playing} onDone={() => setPlaying(null)} />;
  return (
    <>
      <p className="text-[13px] leading-relaxed text-ink/60">{t("fit.desc")}</p>
      <div className="card mt-3 !p-3">
        <p className="text-[12px] font-bold text-ink/50">WELLNESS LV.{lvl}</p>
        <p className="text-base font-black text-ink">{(lang === "ko" ? FIT_TITLES_KO : FIT_TITLES_EN)[lvl - 1]}</p>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-gradient-to-r from-[#7fc8a9] to-pink-deep" style={{ width: `${next ? ((life.fit - FIT_STEPS[lvl - 1]) / (next - FIT_STEPS[lvl - 1])) * 100 : 100}%` }} /></div>
        <p className="mt-1 text-[12px] font-semibold text-ink/50">{life.fit}{next ? ` / ${next}` : " MAX"} · {t("fit.today")} {Math.min(d.workouts, WORKOUT_DAILY)}/{WORKOUT_DAILY}</p>
      </div>
      <div className="mt-3 space-y-2">
        {WORKOUTS.map((w) => {
          const locked = lvl < w.minFit;
          return (
            <button key={w.id} disabled={locked} onClick={() => setPlaying(w)} className="card flex w-full items-center gap-3 !p-3 text-left disabled:opacity-50" data-testid="workout">
              <WorkoutArt id={w.id} size={42} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-ink">{L(w)}</span>
                <span className="block truncate text-[12px] font-semibold text-ink/50">{locked ? <><Icon n="lock" /> WELLNESS LV.{w.minFit}</> : lang === "ko" ? w.descKo : w.descEn}</span>
              </span>
              <span className="shrink-0 text-right text-[12px] font-bold text-ink/50">+{w.fit} FIT<br /><Price c="coin" n={w.coins} /></span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-ink/45">{t("fit.note")}</p>
    </>
  );
}

/** 리듬 운동: 움직이는 마커가 분홍 구간에 들어왔을 때 탭 */
function WorkoutGame({ w, onDone }: { w: Workout; onDone: () => void }) {
  const t = useT(); const L = useL();
  const g = useGame();
  const [beat, setBeat] = useState(0);
  const [hits, setHits] = useState(0);
  const [zoneAt, setZoneAt] = useState(0.5);
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);
  const [result, setResult] = useState<{ fit: number; coins: number; rewarded: boolean } | null>(null);
  const marker = useRef<HTMLDivElement>(null);
  const pos = useRef(0);
  useEffect(() => {
    if (result) return;
    let raf = 0; const t0 = performance.now();
    const loop = (now: number) => {
      const ph = ((now - t0) / 1000) * w.speed;
      pos.current = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2); // 0→1→0 왕복
      if (marker.current) marker.current.style.left = `${pos.current * 100}%`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [w.speed, result]);
  const tap = () => {
    if (result) return;
    const hit = Math.abs(pos.current - zoneAt) <= w.zone / 2;
    const nh = hits + (hit ? 1 : 0); const nb = beat + 1;
    setHits(nh); setBeat(nb); setFlash(hit ? "hit" : "miss");
    useUI.getState().toast(hit ? "PERFECT!" : "MISS", hit ? "pickup" : false);
    setZoneAt(0.15 + Math.random() * 0.7);
    if (nb >= w.beats) setResult(useLife.getState().finishWorkout(w.id, nh));
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); tap(); } };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  });
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-black text-ink"><WorkoutArt id={w.id} size={28} /> {L(w)}</p>
        <button className="btn-ghost !px-3 !py-1 text-xs" onClick={onDone}>{t("common.exit")}</button>
      </div>
      <div className="relative mt-2 h-48 overflow-hidden rounded-3xl bg-gradient-to-b from-[#fde7ee] to-[#e9f6f1]">
        <Preview look={g.look} growth={g.stage || 1} anim={result ? "wave" : "pose"} />
      </div>
      {!result ? (
        <>
          <p className="mt-2 text-center text-[12px] font-bold text-ink/50">{t("fit.howto")} · {beat}/{w.beats} · ✓{hits}</p>
          <div className={`relative mt-2 h-10 rounded-full bg-ink/10 transition-colors ${flash === "hit" ? "ring-2 ring-[#7fc8a9]" : flash === "miss" ? "ring-2 ring-ink/20" : ""}`}>
            <div className="absolute top-0 h-full rounded-full bg-pink-soft" style={{ left: `${(zoneAt - w.zone / 2) * 100}%`, width: `${w.zone * 100}%` }} />
            <div ref={marker} className="absolute top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-pink-deep shadow" />
          </div>
          <button className="btn-primary mt-3 w-full" onClick={tap} data-testid="beat">{t("fit.tap")}</button>
        </>
      ) : (
        <div className="mt-3 text-center">
          <p className="text-lg font-black text-ink">{hits}/{w.beats} {hits === w.beats ? "PERFECT!" : t("fit.done")}</p>
          <p className="mt-1 text-sm font-bold text-ink/60">+{result.fit} FIT{result.rewarded ? ` · +${result.coins} COIN` : ` · ${t("fit.noReward")}`}</p>
          <button className="btn-primary mt-3 w-full" onClick={onDone}>{t("common.ok")}</button>
        </div>
      )}
    </div>
  );
}

// ───────────── 소품 컬렉션 ─────────────
function Collection() {
  const t = useT(); const L = useL();
  const life = useLife();
  const [last, setLast] = useState<{ id: string; dup: boolean } | null>(null);
  const open = () => {
    const r = life.openBox();
    if (r === "money") { toast(t("shop.noMoney"), "error"); return; }
    setLast({ id: r.curio.id, dup: r.dup });
    toast(`${L(r.curio)}${r.dup ? ` · +${DUP_REFUND} COIN` : " NEW!"}`, "reward");
  };
  const lastC = last ? CURIOS.find((c) => c.id === last.id) : null;
  return (
    <>
      <p className="text-[13px] leading-relaxed text-ink/60">{t("col.desc")}</p>
      <div className="card mt-3 flex items-center gap-3 !p-3">
        {lastC ? <CurioArt id={lastC.id} size={48} /> : <BoxArt size={48} />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-ink">{t("col.box")}</p>
          <p className="text-[12px] font-semibold text-ink/50">{t("col.odds")} R1 {Math.round(RARITY_ODDS[1] * 100)}% · R2 {Math.round(RARITY_ODDS[2] * 100)}% · R3 {Math.round(RARITY_ODDS[3] * 100)}%</p>
        </div>
        <button className="btn-primary shrink-0 !px-3 !py-2 text-xs" onClick={open} data-testid="open-box"><Price c="coin" n={BOX_COST} /></button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2"><p className="text-[13px] font-black tracking-wide text-pink-deep">{t("col.album")} ({ownedCurios(life)}/{CURIOS.length})</p>{ownedCurios(life) > 0 && <BragButton kind="collection" />}</div>
      {CURIO_SETS.map((st) => {
        const items = CURIOS.filter((c) => c.set === st.id);
        const have = items.filter((c) => (life.curios[c.id] ?? 0) > 0).length;
        const done = have === items.length; const claimed = life.setsClaimed.includes(st.id);
        return (
          <div key={st.id} className="card mt-2 !p-3" style={{ borderColor: st.color }}>
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs font-black text-ink">{L(st)} <span className="text-ink/45">{have}/{items.length}</span></p>
              <button disabled={!done || claimed} className="btn-ghost shrink-0 !px-2.5 !py-1 text-[12px] disabled:opacity-40"
                onClick={() => { if (life.claimSet(st.id)) toast(`${L(st)} ${t("col.complete")} +${st.gems} GEM`, "reward"); }}>
                {claimed ? "✓" : <><Icon n="gift" /> {st.gems} GEM</>}
              </button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {items.map((c) => {
                const n = life.curios[c.id] ?? 0;
                return (
                  <div key={c.id} title={L(c)} className={`flex flex-col items-center rounded-xl py-1.5 ${n ? "bg-cream" : "bg-ink/5"}`}>
                    <CurioArt id={c.id} size={34} owned={n > 0} />
                    <span className="mt-0.5 flex">{Array.from({ length: c.rarity }).map((_, i) => <Icon key={i} n="star" className="!h-3 !w-3" />)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="mt-3 text-[12px] leading-relaxed text-ink/45">{t("col.note")}</p>
    </>
  );
}

// ───────────── 친구 ─────────────
function Friends() {
  const t = useT();
  const life = useLife(); const friends = useGame((s) => s.friends);
  const d = lifeDaily(life);
  const list = [
    ...friends.map((f) => ({ id: f.code, name: f.name, demo: false })),
    ...DEMO_FRIENDS.map((f) => ({ id: f.id, name: f.name, demo: true })),
  ];
  const real = friends.length;
  return (
    <>
      <p className="text-[13px] leading-relaxed text-ink/60">{t("lf.desc")}</p>
      <p className="mt-3 text-[13px] font-black tracking-wide text-pink-deep">{t("lf.invite")} ({real})</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        {FRIEND_MILESTONES.map((m) => {
          const claimed = life.milestones.includes(m.n);
          return (
            <button key={m.n} disabled={claimed || real < m.n} className="card !p-2 text-left disabled:opacity-50"
              onClick={() => { if (life.claimMilestone(m.n, real)) toast(`+${m.gems} GEM · +${m.coins} COIN`, "reward"); }}>
              <span className="block text-xs font-black text-ink">{t("lf.friendsN").replace("{n}", String(m.n))} {claimed ? "✓" : ""}</span>
              <span className="block text-[12px] font-semibold text-ink/50">{m.gems} GEM · {m.coins} COIN</span>
            </button>
          );
        })}
      </div>
      <button className="btn-ghost mt-2 w-full text-xs" onClick={() => useUI.setState({ panel: "social" })}>{t("lf.goInvite")}</button>
      <p className="mt-4 text-[13px] font-black tracking-wide text-pink-deep">{t("lf.today")} · <Icon n="gift" /> {d.gifts.length}/{GIFT_DAILY} · <Icon n="drop" /> {d.helps.length}/{HELP_DAILY}</p>
      <div className="mt-1.5 space-y-2">
        {list.map((f) => (
          <div key={f.id} className="card flex items-center gap-2 !p-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-soft text-sm font-black text-ink">{f.name.slice(0, 1)}</span>
            <p className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{f.name}{f.demo && <span className="ml-1 text-[12px] font-semibold text-ink/40">{t("lf.demo")}</span>}</p>
            <button disabled={d.gifts.includes(f.id) || d.gifts.length >= GIFT_DAILY} className="btn-ghost shrink-0 !px-2.5 !py-1 text-[12px] disabled:opacity-40"
              onClick={() => { if (life.sendGift(f.id)) toast(`${f.name} · +${GIFT_COINS} COIN`, "reward"); }}><Icon n="gift" /> {t("lf.gift")}</button>
            <button disabled={d.helps.includes(f.id) || d.helps.length >= HELP_DAILY} className="btn-ghost shrink-0 !px-2.5 !py-1 text-[12px] disabled:opacity-40"
              onClick={() => { if (life.helpFriend(f.id)) toast(`${f.name} · +${HELP_COINS} COIN`, "pickup"); }}><Icon n="drop" /> {t("lf.help")}</button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-ink/45">{t("lf.note")}</p>
    </>
  );
}
