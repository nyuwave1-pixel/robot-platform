/** 메뉴 패널: 캐릭터 · 라운지 · 상점/도감 · 소셜 · 퀘스트 · 프로필 · 성장 · 고객 · 설정 · 상담 */
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { MODES, ROUTINES } from "../data/devices";
import {
  BROWS, CUSTOMER_TYPES, DEMO_FRIENDS, EXP_KEYS, EXP_META, EYE_COLORS, EYE_SHAPES, FACE_SHAPES, FASHION, FASHION_MAP, HAIR_COLORS, INTERIOR, LIP_COLORS,
  LOUNGE_LEVELS, POSES, QUESTS, RANKS, SKIN_TONES, STAGES, type Slot,
} from "../data/game";
import { MALL_URL, PRODUCTS, PRODUCT_MAP, RARITY_COLOR, productImage, usesOf, type Product } from "../data/products";
import { levelOf, questClaimed, questValue, saveStatus, totalExp, useGame } from "../store/game";
import { useUI } from "../store/ui";
import { beginRoutine, openCare, routineUnlocked } from "../store/care";
import { LANGS, useL, useT } from "../i18n";
import { Chips, Swatches } from "./Screens";
import { Icon, Price } from "./Icon";
import { InviteBody, LoungeMap, MiniGameBody, PetsBody, RankBody } from "./Extras";


export function Sheet({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`absolute bottom-0 left-0 right-0 z-40 flex max-h-[62vh] flex-col rounded-t-3xl bg-white/95 shadow-[0_-8px_40px_rgba(27,23,25,0.18)] backdrop-blur md:bottom-3 md:left-auto md:right-3 md:top-16 md:max-h-none ${wide ? "md:w-[520px]" : "md:w-[430px]"} md:rounded-3xl`}>
      <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
        <h2 className="text-base font-black tracking-wide text-ink">{title}</h2>
        <button aria-label="close" className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-sm text-ink" onClick={() => useUI.setState({ panel: null })}>✕</button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
    </div>
  );
}
const Tabs = <T extends string>({ tabs, value, onPick }: { tabs: [T, string][]; value: T; onPick: (v: T) => void }) => (
  <div className="sticky top-0 z-10 -mx-1 mb-2 flex gap-1 overflow-x-auto bg-white/95 px-1 py-1">
    {tabs.map(([id, label]) => <button key={id} onClick={() => onPick(id)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${value === id ? "bg-ink text-cream" : "bg-ink/5 text-ink/60"}`}>{label}</button>)}
  </div>
);
const Bar = ({ v, max, color }: { v: number; max: number; color: string }) => (
  <div className="h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full" style={{ width: `${Math.min(100, (v / Math.max(1, max)) * 100)}%`, background: color }} /></div>
);

export function PanelHost() {
  const panel = useUI((s) => s.panel);
  const consult = useUI((s) => s.consult);
  return (
    <>
      {panel === "character" && <CharacterPanel />}
      {panel === "lounge" && <LoungePanel />}
      {panel === "shop" && <ShopPanel />}
      {panel === "social" && <SocialPanel />}
      {panel === "quests" && <QuestsPanel />}
      {panel === "profile" && <ProfilePanel />}
      {panel === "growth" && <GrowthPanel />}
      {panel === "customers" && <CustomersPanel />}
      {panel === "settings" && <SettingsPanel />}
      {panel === "pets" && <Sheet title="LOUNGE PETS"><PetsBody /></Sheet>}
      {panel === "rank" && <Sheet title="LOUNGE RANK"><RankBody /></Sheet>}
      {panel === "minigame" && <Sheet title="BEAUTY CARD MATCH"><MiniGameBody /></Sheet>}
      {consult && <ConsultModal id={consult} />}
    </>
  );
}

// ───────────── MY BEAUTY CHARACTER ─────────────
const SLOT_TABS: [Slot, string][] = [["outfit", "look.outfit"], ["accessory", "look.accessory"], ["earring", "look.earring"], ["necklace", "look.necklace"], ["bag", "look.bag"], ["shoes", "look.shoes"], ["makeup", "look.makeup"], ["nail", "look.nail"]];
function CharacterPanel() {
  const t = useT();
  const L = useL();
  const g = useGame();
  const [tab, setTab] = useState<"face" | "hair" | "style" | "pose">("face");
  const [slot, setSlot] = useState<Slot>("outfit");
  const look = g.look;
  const wear = (s: Slot) => FASHION.filter((f) => f.slot === s);
  const Item = ({ id, s }: { id: string; s: Slot }) => {
    const f = FASHION_MAP[id];
    const owned = g.ownedFashion.includes(id);
    const on = look[s as keyof typeof look] === id;
    return (
      <button
        onClick={() => {
          if (owned) return g.equip(s, on && s !== "hair" && s !== "outfit" ? null : id);
          if (g.stage < f.minStage) return useUI.getState().toast(t("shop.needStage", { n: f.minStage }));
          if (g.buyFashion(id)) { g.equip(s, id); useUI.getState().toast(t("shop.bought")); } else useUI.getState().toast(t("shop.noMoney"));
        }}
        className={`card !p-2 text-left ${on ? "!border-pink-deep !bg-pink-soft/60" : ""}`}>
        <span className="flex items-center gap-2">
          <span className="h-6 w-6 shrink-0 rounded-full border border-white shadow" style={{ background: f.color ?? "#f3e6d0" }} />
          <span className="min-w-0 truncate text-xs font-bold text-ink">{L(f)}</span>
        </span>
        <span className="mt-1 block text-[12px] font-semibold text-ink/50">
          {on ? `✔ ${t("look.equipped")}` : owned ? t("look.owned") : g.stage < f.minStage ? <><Icon n="lock" /> STAGE {f.minStage}</> : <Price c={f.currency} n={f.price} />}
        </span>
      </button>
    );
  };
  return (
    <Sheet title="MY BEAUTY CHARACTER">
      <p className="mb-1 text-[13px] text-ink/50">{t("char.rotate")}</p>
      <Tabs tabs={[["face", t("char.face")], ["hair", t("char.hair")], ["style", t("char.style")], ["pose", t("char.pose")]]} value={tab} onPick={setTab} />
      {tab === "face" && (
        <>
          <Swatches label={t("look.skin")} values={SKIN_TONES} value={look.skin} onPick={(v) => g.setLook({ skin: v })} />
          <Chips label={t("look.face")} values={[...FACE_SHAPES]} value={look.face} onPick={(v) => g.setLook({ face: v })} render={(v) => t(`face.${v}`)} />
          <Chips label={t("look.eyes")} values={[...EYE_SHAPES]} value={look.eyes} onPick={(v) => g.setLook({ eyes: v })} render={(v) => t(`eyes.${v}`)} />
          <Swatches label={t("look.eyeColor")} values={EYE_COLORS} value={look.eyeColor} onPick={(v) => g.setLook({ eyeColor: v })} />
          <Chips label={t("look.brows")} values={[...BROWS]} value={look.brows} onPick={(v) => g.setLook({ brows: v })} render={(v) => t(`brows.${v}`)} />
          <Swatches label={t("look.lip")} values={LIP_COLORS} value={look.lipColor} onPick={(v) => g.setLook({ lipColor: v })} />
          <div className="mt-4">
            <p className="text-xs font-bold text-ink/70">{t("look.height")} <span className="font-semibold text-ink/45">{Math.round((look.height ?? 1) * 100)}%</span></p>
            <input type="range" min={0.92} max={1.08} step={0.01} value={look.height ?? 1} onChange={(e) => g.setLook({ height: Number(e.target.value) })} className="mt-1 w-full accent-pink-500" />
          </div>
          <p className="mt-3 text-[12px] text-ink/40">{t("create.diversity")}</p>
        </>
      )}
      {tab === "hair" && (
        <>
          <Swatches label={t("look.hairColor")} values={HAIR_COLORS} value={look.hairColor} onPick={(v) => g.setLook({ hairColor: v })} />
          <p className="mt-4 text-xs font-bold text-ink/70">{t("look.hair")}</p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">{wear("hair").map((f) => <Item key={f.id} id={f.id} s="hair" />)}</div>
        </>
      )}
      {tab === "style" && (
        <>
          <div className="mb-2 flex gap-1 overflow-x-auto pb-1">{SLOT_TABS.map(([s, k]) => <button key={s} onClick={() => setSlot(s)} className={`chip shrink-0 ${slot === s ? "chip-on" : ""}`}>{t(k)}</button>)}</div>
          <div className="grid grid-cols-2 gap-2">{wear(slot).map((f) => <Item key={f.id} id={f.id} s={slot} />)}</div>
        </>
      )}
      {tab === "pose" && (
        <>
          <Chips label={t("char.pose")} values={[...POSES]} value={look.pose} onPick={(v) => g.setLook({ pose: v })} render={(v) => t(`pose.${v}`)} />
          <button className="btn-primary mt-4 w-full" onClick={() => useUI.setState({ panel: null, mode: "photo" })}><Icon n="camera" /> {t("photo.title")}</button>
        </>
      )}
    </Sheet>
  );
}

// ───────────── LOUNGE MANAGEMENT ─────────────
const SPACES: [string, number][] = [["MAIN ENTRANCE", 1], ["RECEPTION", 1], ["BEAUTY CONSULTING", 1], ["DERMA HOME DEVICE ZONE", 1], ["SKINCARE · PRODUCT DISPLAY", 1], ["PHOTO ZONE", 2], ["HEAD SPA ZONE", 2], ["BODY CARE ZONE", 3], ["VIP BEAUTY ROOM", 4], ["SOCIAL LOUNGE", 5]];
function LoungePanel() {
  const t = useT();
  const L = useL();
  const g = useGame();
  const cur = LOUNGE_LEVELS[g.lounge.level - 1];
  const next = LOUNGE_LEVELS[g.lounge.level];
  const can = next && g.coins >= next.cost && g.lp >= next.lp;
  const themes = (kind: "floor" | "wall" | "light") => INTERIOR.filter((i) => i.kind === kind && g.ownedInterior.includes(i.id));
  const [tab, setTab] = useState<"manage" | "map">("manage");
  return (
    <Sheet title="LOUNGE MANAGEMENT">
      <Tabs tabs={[["manage", t("lounge.tabManage")], ["map", t("lounge.tabMap")]]} value={tab} onPick={setTab} />
      {tab === "map" ? <LoungeMap /> : <>
      <div className="rounded-3xl bg-gradient-to-br from-pink-soft to-lav/70 p-4">
        <p className="text-[12px] font-bold tracking-[0.25em] text-ink/60">LEVEL {cur.n}</p>
        <p className="text-xl font-black text-ink">{cur.name}</p>
        <p className="mt-1 text-xs text-ink/65">{cur.w}m × {cur.d}m · {t("lounge.capacity", { n: cur.customers })}</p>
      </div>
      {next ? (
        <div className="card mt-3">
          <p className="text-[12px] font-bold tracking-[0.2em] text-gold">NEXT · LEVEL {next.n}</p>
          <p className="text-sm font-black text-ink">{next.name}</p>
          <p className="mt-0.5 text-[13px] text-ink/55">{next.unlocks}</p>
          <div className="mt-2 space-y-1.5 text-[13px] font-semibold text-ink/70">
            <div><div className="flex justify-between"><span><Icon n="coin" /> BEAUTY COIN</span><span>{g.coins}/{next.cost}</span></div><Bar v={g.coins} max={next.cost} color="#c9a66b" /></div>
            <div><div className="flex justify-between"><span><Icon n="lp" /> LOUNGE POINT</span><span>{g.lp}/{next.lp}</span></div><Bar v={g.lp} max={next.lp} color="#e79aae" /></div>
          </div>
          <button disabled={!can} className="btn-primary mt-3 w-full disabled:opacity-40" onClick={() => { if (g.upgradeLounge()) { useUI.setState({ panel: null }); useUI.getState().toast(`LEVEL ${next.n} · ${next.name}`); } }}>{t("lounge.upgrade")}</button>
          <p className="mt-1 text-center text-[12px] text-ink/45">{t("lounge.lpHint")}</p>
        </div>
      ) : <p className="mt-3 text-center text-sm font-bold text-gold">★ {t("lounge.max")}</p>}
      <button className="btn-dark mt-3 w-full" onClick={() => useUI.setState({ panel: null, mode: "edit", selected: null })}><Icon n="sofa" /> {t("edit.title")}</button>
      <button className="btn-ghost mt-2 w-full" onClick={() => useUI.setState({ panel: "shop", shopTab: "interior" })}><Icon n="shop" /> INTERIOR SHOP</button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button className="btn-ghost !px-3 text-xs" onClick={() => useUI.setState({ panel: "pets" })}>♥ {t("pet.title")} ({g.pets.length})</button>
        <button className="btn-ghost !px-3 text-xs" onClick={() => useUI.setState({ panel: "minigame" })}><Icon n="sparkle" /> {t("mini.title")}</button>
      </div>
      {(["floor", "wall", "light"] as const).map((k) => (
        <div key={k} className="mt-3">
          <p className="text-xs font-bold text-ink/70">{t(`lounge.${k}`)}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">{themes(k).map((i) => <button key={i.id} className={`chip ${g.lounge[k] === i.id ? "chip-on" : ""}`} onClick={() => g.setTheme(k, i.id)}><span className="mr-1 inline-block h-3 w-3 rounded-full border border-white align-middle shadow" style={{ background: i.color }} />{L(i)}</button>)}</div>
        </div>
      ))}
      <p className="mt-4 text-xs font-bold text-ink/70">{t("lounge.spaces")}</p>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {SPACES.map(([n, lv]) => <div key={n} className={`rounded-xl px-2.5 py-1.5 text-[12px] font-bold ${g.lounge.level >= lv ? "bg-pink-soft/60 text-ink" : "bg-ink/5 text-ink/35"}`}>{g.lounge.level >= lv ? "✔" : <><Icon n="lock" /> LV.{lv}</>} {n}</div>)}
      </div>
      </>}
    </Sheet>
  );
}

// ───────────── SHOP · COLLECTION ─────────────
function ShopPanel() {
  const t = useT();
  const L = useL();
  const g = useGame();
  const tab = useUI((s) => s.shopTab);
  const [detail, setDetail] = useState<Product | null>(null);
  const [cat, setCat] = useState<string>("스킨케어");
  const locked = (p: Product) => g.stage < (p.unlock.stage ?? 1) || g.lounge.level < (p.unlock.lounge ?? 1);
  const buyables = useMemo(() => PRODUCTS.filter((p) => p.coinPrice > 0).sort((a, b) => Number(b.modes.length > 0 || !!b.finisher) - Number(a.modes.length > 0 || !!a.finisher)), []);
  const cats = ["스킨케어", "더마 디바이스", "헬스케어", "리빙", "브랜드 아이템"];
  return (
    <Sheet title={tab === "codex" ? "PRODUCT COLLECTION" : tab === "fashion" ? "FASHION SHOP" : tab === "interior" ? "INTERIOR SHOP" : "SKINCARE ITEM SHOP"} wide>
      <Tabs tabs={[["product", t("shop.product")], ["codex", t("shop.codex")], ["fashion", t("shop.fashion")], ["interior", t("shop.interior")]]} value={tab} onPick={(v) => useUI.setState({ shopTab: v })} />
      {(tab === "product" || tab === "codex") && (
        <p className="mb-2 rounded-2xl bg-cream px-3 py-2 text-[12px] leading-relaxed text-ink/60">
          ⓘ {t("shop.virtual")} <a className="font-bold text-pink-deep underline" href={MALL_URL} target="_blank" rel="noreferrer">{t("shop.mall")}</a>
        </p>
      )}
      {tab === "product" && (
        <div className="space-y-2">
          {buyables.map((p) => {
            const lk = locked(p);
            return (
              <div key={p.id} className="card flex items-center gap-3 !p-2">
                <button onClick={() => setDetail(p)} className="shrink-0"><ProductImg p={p} className="h-14 w-14" /></button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-ink">{p.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[12px]">
                    <span className="rounded-full px-1.5 py-0.5 font-black text-white" style={{ background: RARITY_COLOR[p.rarity] }}>{p.rarity}</span>
                    {p.modes.map((m) => <span key={m} className="rounded-full px-1.5 py-0.5 font-bold text-white" style={{ background: MODES[m].color }}>{m.toUpperCase()}</span>)}
                    {p.finisher && <span className="rounded-full bg-[#7fb2e6] px-1.5 py-0.5 font-bold text-white">FINISH</span>}
                    <span className="text-ink/45">{usesOf(p.id) > 1 ? `${t("shop.uses", { n: usesOf(p.id) })} · ` : ""}{t("shop.have")} ×{g.inventory[p.id] ?? 0}</span>
                  </p>
                </div>
                <button disabled={lk} className="btn-primary shrink-0 !px-3 !py-2 text-xs disabled:opacity-40"
                  onClick={() => useUI.getState().toast(g.buyProduct(p.id) ? t("shop.bought") : t("shop.noMoney"))}>
                  {lk ? <><Icon n="lock" /> {p.unlock.stage ? `STAGE ${p.unlock.stage}` : `LV.${p.unlock.lounge}`}</> : <Price c="coin" n={p.coinPrice} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {tab === "codex" && (
        <>
          <div className="mb-1 flex items-center justify-between text-[13px] font-bold text-ink/60"><span>{t("codex.progress")}</span><span>{g.codex.length} / {PRODUCTS.length}</span></div>
          <Bar v={g.codex.length} max={PRODUCTS.length} color="#c9a66b" />
          <div className="my-2 flex gap-1 overflow-x-auto pb-1">{cats.map((c) => <button key={c} className={`chip shrink-0 ${cat === c ? "chip-on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}</div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {PRODUCTS.filter((p) => p.category === cat).map((p) => {
              const has = g.codex.includes(p.id);
              return (
                <button key={p.id} onClick={() => setDetail(p)} className="card !p-1.5 text-center">
                  <ProductImg p={p} className={`mx-auto h-16 w-16 ${has ? "" : "opacity-30 grayscale"}`} />
                  <p className="mt-1 line-clamp-2 text-[12px] font-bold leading-tight text-ink">{p.name}</p>
                  <p className="text-[12px] font-black" style={{ color: RARITY_COLOR[p.rarity] }}>{has ? p.rarity : "???"}</p>
                </button>
              );
            })}
          </div>
        </>
      )}
      {tab === "fashion" && (
        <div className="grid grid-cols-2 gap-2">
          {FASHION.filter((f) => f.price > 0).map((f) => {
            const owned = g.ownedFashion.includes(f.id);
            const lk = g.stage < f.minStage;
            return (
              <button key={f.id} disabled={owned || lk} className="card !p-2 text-left disabled:opacity-55"
                onClick={() => { if (g.buyFashion(f.id)) { g.equip(f.slot, f.id); useUI.getState().toast(t("shop.bought")); } else useUI.getState().toast(t("shop.noMoney")); }}>
                <span className="flex items-center gap-2"><span className="h-7 w-7 shrink-0 rounded-full border border-white shadow" style={{ background: f.color ?? "#f3e6d0" }} /><span className="min-w-0 truncate text-xs font-bold text-ink">{L(f)}</span></span>
                <span className="mt-1 flex justify-between text-[12px] font-semibold text-ink/50"><span>{t(`look.${f.slot}`)}</span><span>{owned ? `✔ ${t("look.owned")}` : lk ? <><Icon n="lock" /> STAGE {f.minStage}</> : <Price c={f.currency} n={f.price} />}</span></span>
              </button>
            );
          })}
        </div>
      )}
      {tab === "interior" && (
        <div className="grid grid-cols-2 gap-2">
          {INTERIOR.filter((i) => i.price > 0).map((i) => {
            const owned = i.kind !== "furniture" && g.ownedInterior.includes(i.id);
            const lk = g.lounge.level < i.minLounge;
            return (
              <button key={i.id} disabled={owned || lk} className="card !p-2 text-left disabled:opacity-55"
                onClick={() => useUI.getState().toast(g.buyInterior(i.id) ? t(i.kind === "furniture" ? "shop.stored" : "shop.bought") : t("shop.noMoney"))}>
                <span className="block truncate text-xs font-bold text-ink">{i.color && <span className="mr-1 inline-block h-3 w-3 rounded-full border border-white align-middle shadow" style={{ background: i.color }} />}{L(i)}</span>
                <span className="mt-1 flex justify-between text-[12px] font-semibold text-ink/50">
                  <span>{t(`interior.${i.kind}`)}{i.kind === "furniture" ? ` ×${(g.storage[i.id] ?? 0) + g.lounge.furniture.filter((f) => f.type === i.id).length}` : ""}</span>
                  <span>{owned ? `✔ ${t("look.owned")}` : lk ? <><Icon n="lock" /> LV.{i.minLounge}</> : <Price c={i.currency} n={i.price} />}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      {detail && <ProductDetail p={detail} onClose={() => setDetail(null)} />}
    </Sheet>
  );
}

function ProductImg({ p, className = "" }: { p: Product; className?: string }) {
  return <img src={productImage(p)} alt={p.name} loading="lazy" className={`rounded-xl bg-white object-contain ${className}`} onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />;
}

function ProductDetail({ p, onClose }: { p: Product; onClose: () => void }) {
  const t = useT();
  const L = useL();
  const g = useGame();
  const [all, setAll] = useState(false);
  const routines = ROUTINES.filter((r) => r.steps.some((s) => s.products.includes(p.id)));
  const Row = ({ k, v }: { k: string; v?: string | null }) => (v ? <div className="flex gap-2 border-b border-ink/5 py-1.5 text-[13px]"><span className="w-20 shrink-0 font-bold text-ink/50">{k}</span><span className="min-w-0 flex-1 text-ink/80">{v}</span></div> : null);
  // 시트의 backdrop-filter 가 fixed 기준을 바꾸므로 body 로 포털
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-4 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-3">
          <ProductImg p={p} className="h-24 w-24 shrink-0 border border-ink/5" />
          <div className="min-w-0">
            <p className="text-[12px] font-bold tracking-wider text-gold">UNI&CORE · {p.category}</p>
            <p className="text-sm font-black leading-snug text-ink">{p.name}</p>
            {p.nameEn && <p className="text-[12px] font-semibold text-ink/45">{p.nameEn}</p>}
            <p className="mt-1 flex flex-wrap gap-1 text-[12px]">
              <span className="rounded-full px-1.5 py-0.5 font-black text-white" style={{ background: RARITY_COLOR[p.rarity] }}>{p.rarity}</span>
              <span className={`rounded-full px-1.5 py-0.5 font-bold ${p.verified ? "bg-[#dff3e4] text-[#2f7a45]" : "bg-ink/5 text-ink/50"}`}>{p.verified ? t("codex.verified") : t("codex.unverified")}</span>
            </p>
          </div>
        </div>
        <p className="mt-3 text-[12px] font-black tracking-wider text-pink-deep">{t("codex.real")}</p>
        <Row k={t("codex.code")} v={p.productCode} />
        <Row k={t("codex.price")} v={p.priceKRW ? `${p.priceKRW.toLocaleString()}원` : t("codex.inquiry")} />
        <Row k={t("codex.volume")} v={p.volume} />
        <Row k={t("codex.key")} v={p.keyIngredients?.join(" · ")} />
        <Row k={t("codex.howto")} v={p.howTo} />
        <Row k={t("codex.note")} v={p.officialNote} />
        <Row k={t("codex.functional")} v={p.functional === undefined ? null : p.functional ? t("codex.funcYes") : t("codex.funcNo")} />
        <Row k={t("codex.maker")} v={p.maker} />
        {p.ingredients && (
          <div className="py-1.5 text-[13px]">
            <button className="font-bold text-pink-deep" onClick={() => setAll(!all)}>{t("codex.ingredients")} {all ? "▲" : "▼"}</button>
            {all && <p className="mt-1 text-[12px] leading-relaxed text-ink/60">{p.ingredients}</p>}
          </div>
        )}
        {!p.verified && <p className="py-1.5 text-[12px] text-ink/45">{t("codex.unverifiedDesc")}</p>}
        <p className="mt-2 text-[12px] font-black tracking-wider text-pink-deep">{t("codex.game")}</p>
        <Row k={t("codex.modes")} v={p.modes.length ? p.modes.map((m) => MODES[m].label).join(" · ") : p.finisher ? t("codex.finisher") : t("codex.display")} />
        <Row k={t("codex.routines")} v={routines.map((r) => L(r)).join(" · ") || null} />
        <Row k={t("shop.have")} v={`×${g.inventory[p.id] ?? 0}`} />
        <p className="mt-2 text-[12px] leading-relaxed text-ink/45">{t("codex.disclaimer")}</p>
        <div className="mt-3 flex gap-2">
          <a className="btn-ghost flex-1 text-center !py-2.5 text-xs" href={MALL_URL} target="_blank" rel="noreferrer">{t("shop.mall")} ↗</a>
          <button className="btn-primary flex-1 !py-2.5 text-xs" onClick={onClose}>{t("common.close")}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ───────────── SOCIAL ─────────────
function SocialPanel() {
  const t = useT();
  const g = useGame();
  const [tab, setTab] = useState<"feed" | "friends" | "invite" | "rank">("feed");
  const [text, setText] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [cm, setCm] = useState("");
  const rank = useMemo(() => [
    ...DEMO_FRIENDS.map((f) => ({ name: `${f.country} ${f.name}`, score: f.level * 180 + f.stage * 90, me: false })),
    { name: g.name, score: g.followers + g.lounge.level * 60 + g.stage * 40, me: true },
  ].sort((a, b) => b.score - a.score), [g.followers, g.lounge.level, g.stage, g.name]);
  return (
    <Sheet title="BEAUTY SOCIAL" wide>
      <Tabs tabs={[["feed", "BEAUTY FEED"], ["friends", t("social.friends")], ["invite", t("invite.tab")], ["rank", t("social.rank")]]} value={tab} onPick={setTab} />
      {tab === "invite" && <InviteBody />}
      <p className="mb-2 rounded-2xl bg-cream px-3 py-2 text-[12px] text-ink/55">ⓘ {t("social.demo")}</p>
      {tab === "feed" && (
        <>
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-pink-soft/50 p-3">
            <div className="text-center"><p className="text-lg font-black text-ink">{g.followers}</p><p className="text-[12px] font-bold text-ink/50">FOLLOWERS</p></div>
            <div className="text-center"><p className="text-lg font-black text-ink">{g.posts.filter((p) => p.mine).length}</p><p className="text-[12px] font-bold text-ink/50">POSTS</p></div>
            <button className="btn-primary ml-auto !px-4 !py-2 text-xs" onClick={() => useUI.setState({ panel: null, mode: "photo" })}><Icon n="camera" /> {t("social.selfie")}</button>
          </div>
          <div className="mb-3 flex gap-2">
            <input value={text} maxLength={80} onChange={(e) => setText(e.target.value)} placeholder={t("social.story")} className="min-w-0 flex-1 rounded-full border border-pink-soft px-4 py-2 text-xs outline-none focus:border-pink-deep" />
            <button disabled={!text.trim()} className="btn-dark !px-4 !py-2 text-xs disabled:opacity-40" onClick={() => { g.addPost({ text: text.trim(), tag: "#LoungeStory" }); setText(""); useUI.getState().toast(t("photo.posted")); }}>{t("social.post")}</button>
          </div>
          <div className="space-y-3">
            {g.posts.map((p) => (
              <article key={p.id} className="card !p-3">
                <header className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: p.mine ? "linear-gradient(135deg,#e79aae,#d9cff2)" : `hsl(${p.hue ?? 300} 70% 72%)` }}>{p.author.slice(0, 1).toUpperCase()}</span>
                  <span className="text-xs font-black text-ink">{p.country} {p.author}</span>
                  {p.demo && <span className="rounded-full bg-ink/5 px-1.5 py-0.5 text-[12px] font-bold text-ink/40">DEMO</span>}
                  <span className="ml-auto text-[12px] font-bold text-pink-deep">{p.tag}</span>
                </header>
                {p.img && <img src={p.img} alt="" className="mt-2 aspect-square w-full rounded-2xl object-cover" />}
                <p className="mt-2 text-xs leading-relaxed text-ink/80">{p.text}</p>
                <footer className="mt-2 flex items-center gap-3 text-xs font-bold">
                  <button className={p.liked ? "text-pink-deep" : "text-ink/45"} onClick={() => g.likePost(p.id)}>{p.liked ? "♥" : "♡"} {p.likes}</button>
                  <button className="text-ink/45" onClick={() => { setOpen(open === p.id ? null : p.id); setCm(""); }}><Icon n="chat" /> {p.comments.length}</button>
                </footer>
                {open === p.id && (
                  <div className="mt-2 border-t border-ink/5 pt-2">
                    {p.comments.map((c, i) => <p key={i} className="text-[13px] text-ink/70"><b>{c.who}</b> {c.text}</p>)}
                    <div className="mt-1.5 flex gap-2">
                      <input value={cm} maxLength={80} onChange={(e) => setCm(e.target.value)} placeholder={t("social.comment")} className="min-w-0 flex-1 rounded-full border border-pink-soft px-3 py-1.5 text-[13px] outline-none" />
                      <button disabled={!cm.trim()} className="chip chip-on disabled:opacity-40" onClick={() => { g.commentPost(p.id, cm.trim()); setCm(""); }}>{t("social.send")}</button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
      {tab === "friends" && (
        <div className="space-y-2">
          {DEMO_FRIENDS.map((f) => (
            <div key={f.id} className="card flex items-center gap-3 !p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: f.hairColor }}>{f.name[0]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-ink">{f.country} {f.name} <span className="rounded-full bg-ink/5 px-1.5 py-0.5 text-[12px] text-ink/40">DEMO</span></p>
                <p className="text-[12px] text-ink/50">STAGE {f.stage} · {LOUNGE_LEVELS[f.level - 1].name}</p>
              </div>
              <button className={`chip ${g.following.includes(f.id) ? "chip-on" : ""}`} onClick={() => g.follow(f.id)}>{g.following.includes(f.id) ? t("social.following") : t("social.follow")}</button>
              <button className="btn-primary !px-3 !py-2 text-[13px]" onClick={() => { const first = g.visitFriend(f.id); useUI.setState({ panel: null, visiting: f.id, customers: [] }); if (first) useUI.getState().toast("+3 SOCIAL STAR"); }}>{t("social.visit")}</button>
            </div>
          ))}
          <p className="pt-2 text-[12px] leading-relaxed text-ink/45">{t("social.phase")}</p>
        </div>
      )}
      {tab === "rank" && (
        <div className="space-y-1.5">
          {rank.map((r, i) => (
            <div key={r.name} className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-xs font-bold ${r.me ? "bg-pink-soft text-ink" : "bg-ink/5 text-ink/70"}`}>
              <span className="w-5 text-center font-black text-gold">{i + 1}</span><span className="flex-1 truncate">{r.name}</span><span>{r.score}</span>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

// ───────────── QUEST & MISSION ─────────────
function QuestsPanel() {
  const t = useT();
  const L = useL();
  const g = useGame();
  const render = (daily: boolean) => QUESTS.filter((q) => q.daily === daily).map((q) => {
    const v = Math.min(q.goal, questValue(g, q)), done = questClaimed(g, q), ready = !done && v >= q.goal;
    const r = q.reward;
    return (
      <div key={q.id} className={`card !p-3 ${done ? "opacity-50" : ""}`}>
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 text-xs font-bold text-ink">{L(q)}</p>
          <button disabled={!ready} className="btn-primary shrink-0 !px-3 !py-1.5 text-[13px] disabled:opacity-35" onClick={() => { if (g.claim(q)) useUI.getState().toast(t("quest.claimed")); }}>{done ? "✔" : t("quest.claim")}</button>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex-1"><Bar v={v} max={q.goal} color="#e79aae" /></div>
          <span className="text-[12px] font-bold text-ink/50">{v}/{q.goal}</span>
        </div>
        <p className="mt-1 text-[12px] font-semibold text-gold">
          {!!r.coins && <Price c="coin" n={r.coins} />} {!!r.gems && <Price c="gem" n={r.gems} />} {!!r.stars && <Price c="star" n={r.stars} />} {!!r.lp && <Price c="lp" n={r.lp} />} {r.item && <><Icon n="gift" /> {PRODUCT_MAP[r.item]?.name}</>}
        </p>
      </div>
    );
  });
  return (
    <Sheet title="QUEST & MISSION">
      <p className="mb-1.5 text-[13px] font-black tracking-wide text-pink-deep">{t("quest.daily")}</p>
      <div className="space-y-2">{render(true)}</div>
      <p className="mb-1.5 mt-4 text-[13px] font-black tracking-wide text-pink-deep">{t("quest.main")}</p>
      <div className="space-y-2">{render(false)}</div>
    </Sheet>
  );
}

// ───────────── PROFILE / GROWTH ─────────────
function ExpBars() {
  const g = useGame();
  const max = Math.max(60, ...EXP_KEYS.map((k) => g.exp[k]));
  return (
    <div className="space-y-1.5">
      {EXP_KEYS.map((k) => (
        <div key={k}>
          <div className="flex justify-between text-[12px] font-bold"><span style={{ color: EXP_META[k].color }}>{EXP_META[k].label} EXP</span><span className="text-ink/50">{g.exp[k]}</span></div>
          <Bar v={g.exp[k]} max={max} color={EXP_META[k].color} />
        </div>
      ))}
    </div>
  );
}
function ProfilePanel() {
  const t = useT();
  const g = useGame();
  const total = totalExp(g);
  const S = ({ k, v }: { k: string; v: number | string }) => <div className="rounded-2xl bg-cream px-3 py-2 text-center"><p className="text-base font-black text-ink">{v}</p><p className="text-[12px] font-bold text-ink/50">{k}</p></div>;
  return (
    <Sheet title="PROFILE">
      <div className="flex items-center gap-3 rounded-3xl bg-gradient-to-br from-pink-soft to-lav/70 p-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-black text-pink-deep shadow">{g.name.slice(0, 1).toUpperCase()}</span>
        <div><p className="text-lg font-black text-ink">{g.name}</p><p className="text-[13px] font-bold text-ink/60">Lv.{levelOf(total)} · STAGE {g.stage} {STAGES[g.stage - 1].name}</p><p className="text-[12px] text-ink/50">{LOUNGE_LEVELS[g.lounge.level - 1].name}</p></div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <S k={t("profile.cares")} v={g.stats.care ?? 0} /><S k={t("profile.customers")} v={g.stats.customers ?? 0} /><S k={t("profile.regulars")} v={g.regulars.length} />
        <S k="FOLLOWERS" v={g.followers} /><S k={t("profile.codex")} v={`${g.codex.length}/${PRODUCTS.length}`} /><S k={t("profile.routines")} v={`${g.routinesDone.length}/${ROUTINES.length}`} />
      </div>
      <button className="btn-ghost mt-3 w-full" onClick={() => useUI.setState({ panel: "rank" })}><Icon n="star" /> LOUNGE RANK · {g.rank ? RANKS[g.rank - 1].code : "-"}</button>
      <p className="mb-1.5 mt-4 text-xs font-bold text-ink/70">{t("profile.exp")}</p>
      <ExpBars />
    </Sheet>
  );
}
function GrowthPanel() {
  const t = useT();
  const L = useL();
  const g = useGame();
  const total = totalExp(g);
  const unlocks = FASHION.filter((f) => f.minStage === g.stage && f.price > 0);
  return (
    <Sheet title="CHARACTER GROWTH">
      <div className="space-y-2">
        {STAGES.map((s) => {
          const reached = g.stage >= s.n, cur = g.stage === s.n;
          const nx = STAGES[s.n];
          return (
            <div key={s.n} className={`rounded-2xl border-2 p-3 ${cur ? "border-pink-deep bg-pink-soft/50" : reached ? "border-gold/40 bg-cream" : "border-ink/5 bg-ink/[0.03]"}`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-black tracking-wide ${reached ? "text-ink" : "text-ink/35"}`}>STAGE {s.n} — {reached ? s.name : "? ? ?"}</p>
                <span className="text-[12px] font-bold text-ink/45">{reached ? (cur ? "NOW" : "✔") : <><Icon n="lock" /> {s.need} EXP</>}</span>
              </div>
              {reached && <p className="mt-0.5 text-[13px] text-ink/55">{g.settings.lang === "ko" ? s.ko : s.name}</p>}
              {cur && nx && <div className="mt-2"><Bar v={total - s.need} max={nx.need - s.need} color="linear-gradient(90deg,#e79aae,#c9a66b)" /><p className="mt-1 text-right text-[12px] font-bold text-ink/50">{total} / {nx.need} EXP</p></div>}
            </div>
          );
        })}
      </div>
      {unlocks.length > 0 && (
        <>
          <p className="mb-1 mt-3 text-xs font-bold text-ink/70"><Icon n="unlock" /> {t("growth.unlocks")}</p>
          <div className="flex flex-wrap gap-1.5">{unlocks.map((f) => <span key={f.id} className="chip">{L(f)}</span>)}</div>
        </>
      )}
      <p className="mb-1.5 mt-4 text-xs font-bold text-ink/70">{t("profile.exp")}</p>
      <ExpBars />
      <p className="mt-3 text-[12px] leading-relaxed text-ink/45">{t("growth.note")}</p>
    </Sheet>
  );
}

// ───────────── CUSTOMER MANAGEMENT ─────────────
function CustomersPanel() {
  const t = useT();
  const L = useL();
  const g = useGame();
  const customers = useUI((s) => s.customers);
  const type = (id: string) => CUSTOMER_TYPES.find((x) => x.id === id)!;
  return (
    <Sheet title="CUSTOMER MANAGEMENT">
      <p className="text-[13px] font-black tracking-wide text-pink-deep">{t("cust.now")} ({customers.length}/{LOUNGE_LEVELS[g.lounge.level - 1].customers})</p>
      <div className="mt-1.5 space-y-2">
        {customers.length === 0 && <p className="rounded-2xl bg-cream p-3 text-xs text-ink/50">{t("cust.none")}</p>}
        {customers.map((c) => (
          <div key={c.id} className="card flex items-center gap-3 !p-3">
            <div className="min-w-0 flex-1"><p className="text-xs font-black text-ink">{c.name} <span className="font-semibold text-ink/50">· {L(type(c.type))}</span></p><p className="text-[12px] text-ink/50">{t(`cust.state.${c.state}`)}</p></div>
            {c.state === "wait" && <button className="btn-primary !px-3 !py-2 text-[13px]" onClick={() => useUI.setState({ panel: null, consult: c.id })}>{t("action.consult")}</button>}
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13px] font-black tracking-wide text-pink-deep">{t("cust.regulars")} ({g.regulars.length})</p>
      <div className="mt-1.5 space-y-1.5">
        {g.regulars.length === 0 && <p className="rounded-2xl bg-cream p-3 text-xs text-ink/50">{t("cust.noRegulars")}</p>}
        {g.regulars.map((r) => (
          <div key={r.name} className="flex items-center justify-between rounded-2xl bg-cream px-3 py-2 text-xs">
            <span className="font-bold text-ink">{r.name} <span className="font-semibold text-ink/50">· {L(type(r.type))}</span></span>
            <span className="text-[12px] font-bold text-gold">{"★".repeat(r.lastStars)} · {t("cust.visits", { n: r.visits })}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-ink/45">{t("cust.fiction")}</p>
    </Sheet>
  );
}

function ConsultModal({ id }: { id: string }) {
  const t = useT();
  const L = useL();
  const g = useGame();
  const c = useUI((s) => s.customers.find((x) => x.id === id));
  const options = useMemo(() => {
    if (!c) return [];
    const type = CUSTOMER_TYPES.find((x) => x.id === c.type)!;
    const ok = ROUTINES.filter((r) => routineUnlocked(r, g.stage, g.lounge.level));
    const liked = ok.filter((r) => type.likes.includes(r.id));
    const rest = ok.filter((r) => !type.likes.includes(r.id));
    const pick = [...liked.slice(0, 1), ...rest.slice(0, 2), ...liked.slice(1)].slice(0, 3);
    return pick.sort((a, b) => a.id.localeCompare(b.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c?.id]);
  if (!c) return null;
  const type = CUSTOMER_TYPES.find((x) => x.id === c.type)!;
  const choose = (rid: string) => {
    const liked = type.likes.includes(rid);
    useUI.getState().patchCustomer(c.id, { state: "care" });
    useUI.setState({ consult: null });
    openCare(c.id);
    beginRoutine(rid, { express: true, liked });
    useUI.getState().toast(t(liked ? "consult.good" : "consult.ok"));
  };
  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl">
        <p className="text-[12px] font-bold tracking-[0.25em] text-gold">BEAUTY CONSULTING</p>
        <p className="mt-1 text-base font-black text-ink">{c.name} <span className="text-xs font-semibold text-ink/50">· {L(type)}</span></p>
        <p className="mt-2 rounded-2xl rounded-tl-none bg-pink-soft/60 p-3 text-sm leading-relaxed text-ink">“{L(type.ask)}”</p>
        <p className="mt-3 text-xs font-bold text-ink/70">{t("consult.recommend")}</p>
        <div className="mt-1.5 space-y-2">
          {options.map((r) => (
            <button key={r.id} className="card w-full text-left" onClick={() => choose(r.id)}>
              <p className="text-sm font-black text-ink">{L(r)}</p>
              <p className="text-[12px] text-ink/50">{L(r.group)} · {r.steps.slice(0, 2).map((s) => s.mode.toUpperCase()).join(" → ")}</p>
              <p className="mt-1 flex flex-wrap gap-1">
                {r.steps.slice(0, 2).map((s, i) => {
                  const has = s.products.some((id) => (g.inventory[id] ?? 0) > 0);
                  return <span key={i} className={`rounded-full px-1.5 py-0.5 text-[12px] font-bold ${has ? "bg-[#dff3e4] text-[#2f7a45]" : "bg-pink-soft text-pink-deep"}`}>{has ? "✔" : "✕"} {PRODUCT_MAP[s.products[0]].name.split(" ").slice(0, 3).join(" ")}</span>;
                })}
              </p>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-ink/45">{t("consult.express")}</p>
        <button className="btn-ghost mt-3 w-full" onClick={() => useUI.setState({ consult: null })}>{t("consult.later")}</button>
      </div>
    </div>
  );
}

// ───────────── SETTINGS ─────────────
function SettingsPanel() {
  const t = useT();
  const g = useGame();
  const [confirm, setConfirm] = useState(false);
  const [code, setCode] = useState("");
  return (
    <Sheet title="SETTINGS">
      <p className="text-xs font-bold text-ink/70">{t("set.lang")}</p>
      <div className="mt-1.5 flex flex-wrap gap-2">{LANGS.map((l) => <button key={l.id} className={`chip ${g.settings.lang === l.id ? "chip-on" : ""}`} onClick={() => g.setSettings({ lang: l.id })}>{l.label}</button>)}</div>
      <p className="mt-1 text-[12px] text-ink/45">{t("set.langNote")}</p>
      <p className="mt-4 text-xs font-bold text-ink/70">{t("set.quality")}</p>
      <div className="mt-1.5 flex gap-2">{(["auto", "high", "low"] as const).map((q) => <button key={q} className={`chip ${g.settings.quality === q ? "chip-on" : ""}`} onClick={() => g.setSettings({ quality: q })}>{t(`set.q.${q}`)}</button>)}</div>
      <p className="mt-4 text-xs font-bold text-ink/70">{t("set.gift")}</p>
      <div className="mt-1.5 flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("set.giftPh")} className="min-w-0 flex-1 rounded-2xl border-2 border-pink-soft bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-pink-deep" />
        <button className="btn-primary !px-4 !py-2 text-xs" onClick={() => { const n = g.redeem(code); useUI.getState().toast(n > 0 ? `+${n.toLocaleString()} BEAUTY COIN` : n < 0 ? t("set.giftUsed") : t("set.giftBad")); if (n > 0) setCode(""); }}>{t("set.giftOk")}</button>
      </div>
      <p className="mt-4 text-xs font-bold text-ink/70">{t("set.controls")}</p>
      <p className="mt-1 whitespace-pre-line rounded-2xl bg-cream p-3 text-[13px] leading-relaxed text-ink/65">{t("set.controlsBody")}</p>
      <p className="mt-4 text-xs font-bold text-ink/70">{t("set.save")}</p>
      <p className="mt-1 text-[13px] text-ink/60">{saveStatus.ok ? `✔ ${t("set.saveOk")}` : <><Icon n="warn" /> {t("set.saveFail")}</>}</p>
      {!confirm ? (
        <button className="btn-ghost mt-2 w-full" onClick={() => setConfirm(true)}>{t("set.reset")}</button>
      ) : (
        <div className="mt-2 rounded-2xl border-2 border-pink-deep p-3">
          <p className="text-xs font-bold text-ink">{t("set.resetAsk")}</p>
          <div className="mt-2 flex gap-2">
            <button className="btn-ghost flex-1 !py-2 text-xs" onClick={() => setConfirm(false)}>{t("common.cancel")}</button>
            <button className="btn-dark flex-1 !py-2 text-xs" onClick={() => { g.reset(); useUI.setState({ screen: "splash", panel: null, customers: [], mode: "explore", care: null, visiting: null }); }}>{t("set.resetYes")}</button>
          </div>
        </div>
      )}
      <button className="btn-ghost mt-2 w-full" onClick={() => useUI.setState({ screen: "splash", panel: null })}>{t("set.title")}</button>
      <p className="mt-4 text-[12px] leading-relaxed text-ink/40">{t("set.legal")}</p>
    </Sheet>
  );
}
