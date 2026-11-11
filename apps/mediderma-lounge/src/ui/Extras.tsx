/** 펫 · 라운지 맵과 스테이션 증설 · 친구 초대 · 미니게임(카드 짝 맞추기) */
import { useMemo, useState } from "react";
import { tune } from "../data/config";
import { LOUNGE_LEVELS, MAX_PETS, PET_MAP, PET_TYPES, STATION_COSTS } from "../data/game";
import { PRODUCTS, productImage } from "../data/products";
import { useGame } from "../store/game";
import { inviteLink } from "../store/invite";
import { useUI } from "../store/ui";
import { layout } from "../three/layout";
import { useL, useT } from "../i18n";
import { Icon, Price } from "./Icon";

const toast = (s: string) => useUI.getState().toast(s);

// ───────────── 펫 ─────────────
export function PetsBody() {
  const t = useT();
  const L = useL();
  const g = useGame();
  const [name, setName] = useState("");
  return (
    <>
      <p className="text-[13px] leading-relaxed text-ink/60">{t("pet.desc")}</p>
      <p className="mt-3 text-[13px] font-black tracking-wide text-pink-deep">{t("pet.mine")} ({g.pets.length}/{MAX_PETS})</p>
      <div className="mt-1.5 space-y-2">
        {g.pets.length === 0 && <p className="rounded-2xl bg-cream p-3 text-xs text-ink/50">{t("pet.none")}</p>}
        {g.pets.map((p) => {
          const ty = PET_MAP[p.type];
          return (
            <div key={p.id} className="card !p-3">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 shrink-0 rounded-full border-2 border-white shadow" style={{ background: `linear-gradient(135deg, ${ty?.color}, ${ty?.accent})` }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-ink">{p.name} <span className="text-[12px] font-semibold text-ink/50">· {ty ? L(ty) : ""}</span></p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-pink-deep" style={{ width: `${p.affection}%` }} /></div>
                    <span className="text-[12px] font-bold text-ink/50">♥ {p.affection}</span>
                  </div>
                </div>
                <button className="btn-ghost shrink-0 !px-3 !py-2 text-xs" onClick={() => toast(g.feedPet(p.id) ? t("pet.fed") : t("shop.noMoney"))}>{t("pet.feed")} <Price c="coin" n={tune("pet.feed_cost")} /></button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[13px] font-black tracking-wide text-pink-deep">{t("pet.adopt")}</p>
      <input value={name} maxLength={10} onChange={(e) => setName(e.target.value)} placeholder={t("pet.namePh")} className="mt-1.5 w-full rounded-full border border-pink-soft px-4 py-2 text-sm outline-none focus:border-pink-deep" />
      <div className="mt-2 grid grid-cols-2 gap-2">
        {PET_TYPES.map((ty) => (
          <button key={ty.id} disabled={g.pets.length >= MAX_PETS} className="card !p-2 text-left disabled:opacity-50"
            onClick={() => { if (g.adoptPet(ty.id, name)) { setName(""); toast(t("pet.adopted")); } else toast(t("shop.noMoney")); }}>
            <span className="flex items-center gap-2">
              <span className="h-7 w-7 shrink-0 rounded-full border border-white shadow" style={{ background: `linear-gradient(135deg, ${ty.color}, ${ty.accent})` }} />
              <span className="min-w-0 truncate text-xs font-bold text-ink">{L(ty)}</span>
            </span>
            <span className="mt-1 block text-[12px] font-semibold text-ink/50"><Price c="coin" n={ty.price} /></span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-ink/45">{t("pet.note")}</p>
    </>
  );
}

// ───────────── 라운지 맵 + 스테이션 증설 ─────────────
export function LoungeMap() {
  const t = useT();
  const g = useGame();
  const [lv, setLv] = useState(g.lounge.level);
  const own = lv === g.lounge.level;
  const L = useMemo(() => layout(lv, own ? g.lounge.stations : 0), [lv, own, g.lounge.stations]);
  const locked = lv > g.lounge.level;
  const cur = layout(g.lounge.level, g.lounge.stations);
  const max = cur.stationSpots.length;
  const cost = STATION_COSTS[g.lounge.stations];
  const X = (x: number) => x + L.w / 2, Z = (z: number) => z + L.d / 2;
  // 글자는 방 크기와 무관하게 화면에서 같은 크기로 보이게 (맵 너비의 3.3%)
  const fs = L.w * 0.033;
  const Zone = ({ x, z, w, d, label, on = true, round }: { x: number; z: number; w: number; d: number; label: string; on?: boolean; round?: boolean }) => (
    <g opacity={on ? 1 : 0.35}>
      {round ? <ellipse cx={X(x)} cy={Z(z)} rx={w / 2} ry={d / 2} fill="#f9d5dc" stroke="#e79aae" strokeWidth={0.06} /> : <rect x={X(x) - w / 2} y={Z(z) - d / 2} width={w} height={d} rx={0.2} fill="#f9d5dc" stroke="#e79aae" strokeWidth={0.06} />}
      <text x={X(x)} y={Z(z) + fs * 0.35} textAnchor="middle" fontSize={fs} fontWeight={800} fill="#1b1719">{label}</text>
    </g>
  );
  return (
    <>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {LOUNGE_LEVELS.map((l) => <button key={l.n} onClick={() => setLv(l.n)} className={`chip shrink-0 ${lv === l.n ? "chip-on" : ""}`}>LV.{l.n}{l.n > g.lounge.level ? " ·" : ""}{l.n > g.lounge.level && <Icon n="lock" />}</button>)}
      </div>
      <p className="mt-1 text-[13px] font-black text-ink">{LOUNGE_LEVELS[lv - 1].name} <span className="font-semibold text-ink/50">· {L.w}m × {L.d}m</span></p>
      <svg viewBox={`-0.3 -0.3 ${L.w + 0.6} ${L.d + 0.6}`} className={`mt-2 w-full rounded-2xl bg-cream ${locked ? "opacity-60" : ""}`} role="img" aria-label="lounge map">
        <rect x={0} y={0} width={L.w} height={L.d} rx={0.3} fill="#fffaf5" stroke="#c9a66b" strokeWidth={0.12} />
        <rect x={L.w / 2 - 1.4} y={L.d - 0.12} width={2.8} height={0.24} fill="#c9a66b" />
        <text x={L.w / 2} y={L.d - fs * 0.9} textAnchor="middle" fontSize={fs} fontWeight={800} fill="#b98a4a">ENTRANCE</text>
        <Zone x={L.shelf.x} z={L.shelf.z + 0.1} w={4.4} d={0.9} label="PRODUCT DISPLAY" />
        <Zone x={L.bed.x} z={L.bed.z + 0.2} w={4.4} d={3.4} label="DERMA HOME" round />
        <Zone x={L.reception.x} z={L.reception.z} w={2.6} d={1.6} label="RECEPTION" />
        <Zone x={L.sofa.x - 0.4} z={L.sofa.z - 0.3} w={3.2} d={2.2} label="CONSULTING" />
        <Zone x={L.vanity.x + 0.4} z={L.vanity.z} w={1.5} d={1.6} label="VANITY" />
        <Zone x={L.game.x} z={L.game.z - 0.1} w={1.9} d={1.3} label="GAME" />
        {lv >= 2 && <Zone x={L.photo.x + 0.2} z={L.photo.z} w={2.4} d={2.4} label="PHOTO" round />}
        {lv >= 2 && <Zone x={L.bed.x - 4.4} z={-L.d / 2 + 1.1} w={1.6} d={2} label="HEAD SPA" />}
        {lv >= 3 && <Zone x={-L.w / 2 + 7.6} z={-L.d / 2 + 1.5} w={2.6} d={1.3} label="BODY CARE" />}
        {lv >= 4 && <Zone x={-L.w / 2 + 2.6} z={-L.d / 2 + 5.2} w={4.4} d={3.6} label="VIP ROOM" />}
        {lv >= 5 && <Zone x={2.5} z={1.5} w={4.4} d={4.4} label="SOCIAL LOUNGE" round />}
        {L.stationSpots.map((s, i) => {
          const has = own && i < g.lounge.stations;
          return (
            <g key={i}>
              <rect x={X(s.x) - 1.15} y={Z(s.z) - 0.45} width={2.3} height={0.9} rx={0.15} fill={has ? "#d9cff2" : "none"} stroke="#a78be6" strokeWidth={0.07} strokeDasharray={has ? undefined : "0.2 0.15"} />
              <text x={X(s.x)} y={Z(s.z) + fs * 0.32} textAnchor="middle" fontSize={fs * 0.9} fontWeight={800} fill="#5b46a0">{has ? `STATION ${i + 2}` : "+ STATION"}</text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-[12px] text-ink/50">{locked ? t("map.locked", { n: lv }) : t("map.legend")}</p>

      <div className="card mt-3">
        <p className="text-[12px] font-bold tracking-[0.2em] text-gold">DERMA HOME STATION</p>
        <p className="text-sm font-black text-ink">{t("station.title", { n: g.lounge.stations + 1, max: max + 1 })}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink/55">{t("station.desc")}</p>
        {g.lounge.stations < max && cost !== undefined ? (
          <button className="btn-primary mt-2 w-full" onClick={() => toast(g.buyStation(max) ? t("station.bought") : t("shop.noMoney"))}>{t("station.buy")} <Price c="coin" n={cost} /></button>
        ) : (
          <p className="mt-2 rounded-2xl bg-cream p-2 text-center text-[13px] font-bold text-ink/60">{t("station.max")}</p>
        )}
      </div>
    </>
  );
}

// ───────────── 친구 초대 ─────────────
export function InviteBody() {
  const t = useT();
  const g = useGame();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const share = async () => {
    const url = inviteLink();
    const text = t("invite.shareText", { name: g.name });
    try {
      if (navigator.share) { await navigator.share({ title: "MEDIDERMA LOUNGE", text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast(t("invite.copied"));
    } catch { /* 공유를 취소했거나 클립보드 권한이 없음 */ toast(url); }
  };
  const add = () => {
    const r = g.addFriend(code, name);
    toast(t(`invite.${r}`));
    if (r === "ok") { setCode(""); setName(""); }
  };
  return (
    <>
      <div className="rounded-3xl bg-gradient-to-br from-pink-soft to-lav/70 p-4 text-center">
        <p className="text-[12px] font-bold tracking-[0.25em] text-ink/60">{t("invite.myCode")}</p>
        <p className="mt-1 select-all text-3xl font-black tracking-[0.3em] text-ink">{g.friendCode}</p>
        <button className="btn-primary mt-3 w-full" onClick={share}><Icon n="gift" /> {t("invite.share")}</button>
        <p className="mt-2 text-[12px] text-ink/55">{t("invite.reward", { g: tune("social.invite_gems") })}</p>
      </div>
      {g.invitedBy && <p className="mt-2 rounded-2xl bg-cream p-2 text-center text-[13px] font-bold text-ink/70">{t("invite.by", { name: g.invitedBy.name })}</p>}
      <p className="mt-4 text-xs font-bold text-ink/70">{t("invite.enter")}</p>
      <div className="mt-1.5 flex gap-2">
        <input value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABC123" className="w-28 rounded-full border border-pink-soft px-3 py-2 text-center text-sm font-bold tracking-widest outline-none focus:border-pink-deep" />
        <input value={name} maxLength={12} onChange={(e) => setName(e.target.value)} placeholder={t("invite.namePh")} className="min-w-0 flex-1 rounded-full border border-pink-soft px-3 py-2 text-sm outline-none focus:border-pink-deep" />
        <button disabled={code.length !== 6} className="btn-dark !px-4 !py-2 text-xs disabled:opacity-40" onClick={add}>{t("invite.add")}</button>
      </div>
      <p className="mt-3 text-xs font-bold text-ink/70">{t("invite.list")} ({g.friends.length})</p>
      <div className="mt-1.5 space-y-1.5">
        {g.friends.length === 0 && <p className="rounded-2xl bg-cream p-3 text-xs text-ink/50">{t("invite.empty")}</p>}
        {g.friends.map((f) => (
          <div key={f.code} className="flex items-center justify-between rounded-2xl bg-cream px-3 py-2 text-xs">
            <span className="font-bold text-ink">{f.name}</span><span className="font-bold tracking-widest text-ink/45">{f.code}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-ink/45">{t("invite.note")}</p>
    </>
  );
}

// ───────────── 미니게임: 뷰티 카드 짝 맞추기 ─────────────
const CARD_PRODUCTS = PRODUCTS.filter((p) => p.modes.length > 0 || p.finisher).slice(0, 6);
function deal() {
  const cards = [...CARD_PRODUCTS, ...CARD_PRODUCTS].map((p, i) => ({ key: i, id: p.id }));
  for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  return cards;
}
export function MiniGameBody() {
  const t = useT();
  const g = useGame();
  const [cards, setCards] = useState(deal);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const left = Math.max(0, tune("minigame.daily_rewards") - (g.daily.stats.mini ?? 0));
  const flip = (i: number) => {
    if (busy || open.includes(i) || matched.includes(cards[i].id) || won !== null) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length < 2) return;
    const m = moves + 1; setMoves(m);
    const [a, b] = next;
    if (cards[a].id === cards[b].id) {
      const done = [...matched, cards[a].id];
      setMatched(done); setOpen([]);
      if (done.length === CARD_PRODUCTS.length) setWon(useGame.getState().miniReward(m));
    } else {
      setBusy(true);
      setTimeout(() => { setOpen([]); setBusy(false); }, 750);
    }
  };
  const restart = () => { setCards(deal()); setOpen([]); setMatched([]); setMoves(0); setWon(null); };
  return (
    <>
      <div className="flex items-center justify-between text-[13px] font-bold text-ink/70">
        <span>{t("mini.moves", { n: moves })}</span><span>{t("mini.left", { n: left })}</span>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {cards.map((c, i) => {
          const up = open.includes(i) || matched.includes(c.id);
          const p = CARD_PRODUCTS.find((x) => x.id === c.id)!;
          return (
            <button key={c.key} aria-label={up ? p.name : "card"} onClick={() => flip(i)}
              className={`aspect-[3/4] rounded-2xl border-2 p-1 transition-all ${up ? "border-pink-deep bg-white" : "border-pink-soft bg-gradient-to-br from-pink-soft to-lav"} ${matched.includes(c.id) ? "opacity-60" : ""}`}>
              {up ? <img src={productImage(p)} alt="" className="h-full w-full rounded-xl object-contain" /> : <span className="text-2xl font-black text-white/90">M</span>}
            </button>
          );
        })}
      </div>
      {won !== null && (
        <div className="mt-3 rounded-2xl bg-cream p-3 text-center">
          <p className="text-sm font-black text-ink"><Icon n="party" /> {t("mini.clear", { n: moves })}</p>
          <p className="mt-1 text-lg font-black text-ink">{won > 0 ? <>+<Price c="coin" n={won} /></> : t("mini.noReward")}</p>
        </div>
      )}
      <button className="btn-ghost mt-3 w-full" onClick={restart}>{t("mini.restart")}</button>
      <p className="mt-2 text-[12px] leading-relaxed text-ink/45">{t("mini.note")}</p>
    </>
  );
}
