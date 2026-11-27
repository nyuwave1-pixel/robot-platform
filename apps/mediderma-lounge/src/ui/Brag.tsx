/**
 * 뷰티 자랑 (실제 다른 플레이어와 나누는 SNS 피드) — net/brag.ts
 *  - 피드: 최신 · 이번 주 인기, 종류별 보기, 좋아요, 자랑한 사람 라운지 놀러 가기
 *  - 자랑하기: 종류(룩 · 펫 · 가든 · 케어 · 컬렉션) → 미리보기 → 문구 고르기 → 올리기
 */
import { useEffect, useState } from "react";
import { FASHION_MAP, PET_MAP } from "../data/game";
import { CURIO_SETS, PLANT_MAP } from "../data/life";
import { ROUTINE_MAP } from "../data/devices";
import { PET_ACC_MAP } from "../data/pets";
import { STYLES, scoreFit, themeOfDay } from "../data/style";
import { useGame, type Look } from "../store/game";
import { useUI } from "../store/ui";
import { useL, useT } from "../i18n";
import { claimKing, loadKing, useKing, checkBragLikes, checkFollowFeed, BRAG_DAILY, BRAG_KINDS, BRAG_SORTS, BRAG_MESSAGES, BRAG_REWARD, bragDataOf, deleteBrag, likeBrag, loadBrags, postBrag, useBrag, type Brag, type BragData, type BragKind } from "../net/brag";
import { visitByCode } from "./Events";
import { CurioArt, PlantArt } from "./LifeArt";
import { Icon, type IconName } from "./Icon";
import { reportPlay, shareUrl } from "../platform";
import { claimGifts, GIFT_COINS, loadInbox, sendGift, useGifts } from "../net/gifts";
import { loadFollows, setFollow, useFollows } from "../net/follows";

export const BRAG_ICON: Record<BragKind, IconName> = { look: "character", pet: "smile", plant: "flower", care: "sparkle", collection: "gift" };
const LOOK_SLOTS = ["outfit", "hair", "makeup", "shadow", "lip", "base", "shoes", "accessory", "earring", "necklace", "bag", "nail"] as const;

/** 자랑 카드 안의 내용 (피드와 미리보기에서 같이 쓴다) */
export function BragBody({ kind, data }: { kind: BragKind; data: BragData }) {
  const t = useT();
  const L = useL();
  if (kind === "look" && data.look) {
    const look: Look = data.look;
    const items = LOOK_SLOTS.map((s) => look[s]).filter((id): id is string => !!id && !!FASHION_MAP[id]);
    const today = new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);
    const fit = Object.fromEntries(LOOK_SLOTS.map((s) => [s, look[s] ?? undefined]));
    const sc = STYLES.map((st) => scoreFit(fit, themeOfDay(today), st)).sort((a, b) => b.total - a.total)[0];
    return (
      <div className="mt-2 rounded-2xl bg-cream p-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white text-base font-black text-white shadow" style={{ background: `linear-gradient(135deg, ${look.hairColor}, ${look.skin})` }}>{data.stage ?? 1}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-ink/50">STAGE {data.stage ?? 1} · {t("brag.styleScore")}</p>
            <p className="text-lg font-black leading-tight text-ink">{sc.total}<span className="ml-1 text-xs text-gold">{sc.grade}</span></p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {items.map((id) => (
            <span key={id} className="flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[12px] font-semibold text-ink/75">
              <span className="h-2.5 w-2.5 rounded-full border border-ink/10" style={{ background: FASHION_MAP[id].color ?? "#f2b8c6" }} />{L(FASHION_MAP[id])}
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (kind === "pet" && data.pet) {
    const ty = PET_MAP[data.pet.type];
    return (
      <div className="mt-2 flex items-center gap-3 rounded-2xl bg-cream p-2.5">
        <span className="h-12 w-12 shrink-0 rounded-full border-2 border-white shadow" style={{ background: `linear-gradient(135deg, ${ty?.color}, ${ty?.accent})` }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-ink">{data.pet.name} <span className="text-[12px] font-semibold text-ink/50">· {ty ? L(ty) : ""}</span></p>
          <p className="text-[12px] font-bold text-gold">Lv.{data.pet.level ?? 1}{data.pet.acc && PET_ACC_MAP[data.pet.acc] ? ` · ${L(PET_ACC_MAP[data.pet.acc])}` : ""}</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-pink-deep" style={{ width: `${data.pet.affection}%` }} /></div>
            <span className="text-[12px] font-bold text-ink/50">♥ {data.pet.affection}</span>
          </div>
        </div>
      </div>
    );
  }
  if (kind === "plant" && data.plants) {
    return (
      <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-2xl bg-cream p-2.5">
        {data.plants.map((p) => (
          <div key={p.id} className="flex flex-col items-center rounded-xl bg-white p-1.5 text-center">
            <PlantArt color={PLANT_MAP[p.id].color} stage={3} size={36} />
            <p className="mt-0.5 truncate text-[12px] font-bold text-ink/75">{L(PLANT_MAP[p.id])}</p>
            <p className="text-[12px] font-black text-gold">×{p.n}{p.g ? ` · ✨${p.g}` : ""}</p>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "care" && data.care) {
    const r = data.care.routine ? ROUTINE_MAP[data.care.routine] : null;
    return (
      <div className="mt-2 flex items-center gap-3 rounded-2xl bg-cream p-2.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-lg text-gold shadow"><Icon n="sparkle" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-ink">{r ? L(r) : t("brag.care")}</p>
          <p className="text-[12px] font-semibold text-ink/55">
            {data.care.acc !== null && t("care.dir.acc", { n: data.care.acc })}
            {data.care.stars !== null && <span className="ml-1 text-gold">{"★".repeat(data.care.stars)}</span>}
          </p>
        </div>
      </div>
    );
  }
  if (kind === "collection" && data.curios) {
    const c = data.curios;
    return (
      <div className="mt-2 rounded-2xl bg-cream p-2.5">
        <p className="text-[12px] font-bold text-ink/55">{t("brag.curios", { n: c.owned, total: c.total })}{c.sets.length > 0 && ` · ${t("brag.sets", { n: c.sets.length })}`}</p>
        <div className="mt-1.5 flex gap-1.5">
          {c.best.map((id) => <span key={id} className="rounded-xl bg-white p-1"><CurioArt id={id} size={36} /></span>)}
        </div>
        {c.sets.length > 0 && <p className="mt-1 truncate text-[12px] font-semibold text-gold">{c.sets.map((s) => { const set = CURIO_SETS.find((x) => x.id === s); return set ? L(set) : ""; }).join(" · ")}</p>}
      </div>
    );
  }
  return null;
}

function ago(iso: string, t: ReturnType<typeof useT>) {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  return m < 60 ? t("brag.min", { n: Math.max(1, m) }) : m < 1440 ? t("brag.hour", { n: Math.round(m / 60) }) : t("brag.day", { n: Math.round(m / 1440) });
}

function BragCard({ b }: { b: Brag }) {
  const t = useT();
  const L = useL();
  const me = useGame((s) => s.friendCode);
  const toast = useUI((s) => s.toast);
  const msg = BRAG_MESSAGES.find((m) => m.id === b.msg)!;
  const [gift, setGift] = useState(false);
  const like = async () => {
    if (b.liked || b.writer === me) return;
    const r = await likeBrag(b.id);
    if (r !== "ok" && r !== "dup") toast(t(`brag.likeFail.${r}`), "error");
  };
  const visit = async () => {
    const r = await visitByCode(b.writer);
    if (r !== "ok") toast(t(`live.visit.${r}`), "error");
  };
  return (
    <article className="card !p-3" data-testid="brag-card">
      <header className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: b.writer === me ? "linear-gradient(135deg,#e79aae,#d9cff2)" : `hsl(${(parseInt(b.writer, 36) % 360)} 60% 72%)` }}>{b.name.slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black text-ink">{b.name}</p>
          <p className="text-[12px] text-ink/45">{ago(b.at, t)}</p>
        </div>
        {b.writer !== me && <FollowChip code={b.writer} name={b.name} />}
        <span className="flex items-center gap-1 rounded-full bg-pink-soft/60 px-2 py-0.5 text-[12px] font-bold text-pink-deep"><Icon n={BRAG_ICON[b.kind]} />{t(`brag.kind.${b.kind}`)}</span>
      </header>
      <p className="mt-2 text-[13px] font-semibold text-ink/85">{L(msg)}</p>
      <BragBody kind={b.kind} data={b.data} />
      <footer className="mt-2 flex items-center gap-3 text-xs font-bold">
        <button className={b.liked ? "text-pink-deep" : "text-ink/45"} disabled={b.writer === me} onClick={like} data-testid="brag-like">{b.liked ? "♥" : "♡"} {b.likes}</button>
        {b.writer === me
          ? <>
              <button className="ml-auto text-pink-deep" onClick={() => void shareBrag(b, L(msg), t)} data-testid="brag-share"><Icon n="gift" /> {t("brag.share")}</button>
              <button className="text-ink/35" onClick={() => void deleteBrag(b.id)}>{t("brag.delete")}</button>
            </>
          : <>
              <button className="ml-auto text-ink/55" onClick={() => setGift(!gift)} data-testid="gift-open"><Icon n="gift" /> {t("gift.btn")}</button>
              <button className="text-pink-deep" onClick={visit}><Icon n="lounge" /> {t("brag.visit")}</button>
            </>}
      </footer>
      {gift && b.writer !== me && <GiftPicker to={b.writer} name={b.name} onDone={() => setGift(false)} />}
    </article>
  );
}

/** 자랑하기 작성 */
function Composer({ initial, onDone }: { initial: BragKind; onDone: () => void }) {
  const t = useT();
  const L = useL();
  const toast = useUI((s) => s.toast);
  const careDraft = useUI((s) => s.bragCare);
  const [kind, setKind] = useState<BragKind>(initial);
  const msgs = BRAG_MESSAGES.filter((m) => m.kind === kind);
  const [msg, setMsg] = useState(msgs[0].id);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setMsg(BRAG_MESSAGES.find((m) => m.kind === kind)!.id); }, [kind]);
  const data = bragDataOf(kind, kind === "care" && careDraft ? { care: careDraft } : undefined);
  const send = async () => {
    setBusy(true);
    const r = await postBrag(kind, msg, data);
    if (r === "ok") reportPlay("brag", 1);
    setBusy(false);
    if (r === "ok") { toast(t("brag.posted", { n: BRAG_REWARD }), "reward"); useUI.setState({ bragCare: null }); onDone(); }
    else toast(t(`brag.fail.${r}`), "error");
  };
  return (
    <div className="mb-3 rounded-2xl border-2 border-pink-soft bg-white p-3" data-testid="brag-composer">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {BRAG_KINDS.map((k) => <button key={k} onClick={() => setKind(k)} className={`chip shrink-0 ${kind === k ? "chip-on" : ""}`}><Icon n={BRAG_ICON[k]} /> {t(`brag.kind.${k}`)}</button>)}
      </div>
      {data ? <BragBody kind={kind} data={data} /> : <p className="mt-2 rounded-2xl bg-cream p-3 text-xs text-ink/50">{t(`brag.empty.${kind}`)}</p>}
      <div className="mt-2 flex flex-wrap gap-1">
        {msgs.map((m) => <button key={m.id} onClick={() => setMsg(m.id)} className={`chip ${msg === m.id ? "chip-on" : ""}`}>{L(m)}</button>)}
      </div>
      <div className="mt-2 flex gap-2">
        <button className="btn-ghost !px-4 !py-2 text-xs" onClick={onDone}>{t("brag.cancel")}</button>
        <button disabled={!data || busy} className="btn-primary flex-1 !py-2 text-xs disabled:opacity-40" onClick={send} data-testid="brag-send">{t("brag.send")} · +{BRAG_REWARD} COIN</button>
      </div>
      <p className="mt-1.5 text-[12px] text-ink/45">{t("brag.rule", { n: BRAG_DAILY })}</p>
    </div>
  );
}

/** 소셜 패널의 "뷰티 자랑" 탭 */
export function BragFeed() {
  const t = useT();
  const { sort, kind, status, list, mine, mineLikes, followNew } = useBrag();
  const want = useUI((s) => s.bragKind);
  const [compose, setCompose] = useState<BragKind | null>(want ?? null);
  const [showMine, setShowMine] = useState(false);
  const king = useKing((s) => s.list);
  const follows = useFollows((s) => s.list);
  useEffect(() => {
    void loadBrags(); void checkBragLikes(); void loadKing(); void loadFollows();
    void claimKing().then((r) => { if (r) useUI.getState().toast(t("king.reward", { n: r.rank, c: r.coins, g: r.gems }), "reward"); });
  }, []);
  useEffect(() => { if (want) { setCompose(want); useUI.setState({ bragKind: null }); } }, [want]);
  return (
    <>
      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-pink-soft/50 p-3">
        <p className="min-w-0 flex-1 text-[12px] leading-snug text-ink/65">{t("brag.desc")}</p>
        {!compose && <button className="btn-primary shrink-0 !px-4 !py-2 text-xs" onClick={() => setCompose("look")} data-testid="brag-open"><Icon n="party" /> {t("brag.btn")}</button>}
      </div>
      {compose && <Composer initial={compose} onDone={() => setCompose(null)} />}
      {/* 이번 주 자랑왕 (좋아요 합계) — 지난 주 1~3위는 다음 주에 보상 */}
      <div className="mb-3 rounded-2xl bg-ink p-3 text-cream" data-testid="brag-king">
        <div className="flex items-center justify-between"><p className="text-xs font-black text-gold">{t("king.title")}</p><span className="text-[12px] text-cream/55">{t("king.rule")}</span></div>
        {king.length === 0 ? <p className="mt-1.5 text-[12px] text-cream/60">{t("king.none")}</p> : (
          <ol className="mt-1.5 space-y-1">
            {king.slice(0, 3).map((k) => (
              <li key={k.code} className="flex items-center gap-2 text-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-[12px] font-black text-ink" style={{ background: ["#d9a441", "#c7ced6", "#c58b62"][k.rank - 1] ?? "#8a8088" }}>{k.rank}</span>
                <span className="min-w-0 flex-1 truncate font-bold">{k.name}</span>
                <span className="font-black text-pink-soft">♥ {k.likes}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
        {BRAG_SORTS.map((s) => <button key={s} onClick={() => { setShowMine(false); void loadBrags(s, kind); }} className={`chip relative shrink-0 ${!showMine && sort === s ? "chip-on" : ""}`} data-testid={`brag-sort-${s}`}>{t(`brag.sort.${s}`)}{s === "follow" && followNew > 0 && <span className="ml-1 rounded-full bg-pink-deep px-1.5 text-[11px] font-black text-white" data-testid="follow-new">{followNew}</span>}</button>)}
        <span className="mx-1 w-px shrink-0 bg-ink/10" />
        <button onClick={() => { setShowMine(false); void loadBrags(sort, null); }} className={`chip shrink-0 ${!showMine && kind === null ? "chip-on" : ""}`}>{t("brag.all")}</button>
        {BRAG_KINDS.map((k) => <button key={k} onClick={() => { setShowMine(false); void loadBrags(sort, k); }} className={`chip shrink-0 ${!showMine && kind === k ? "chip-on" : ""}`}>{t(`brag.kind.${k}`)}</button>)}
        <span className="mx-1 w-px shrink-0 bg-ink/10" />
        <button onClick={() => { setShowMine(true); void checkBragLikes(); }} className={`chip shrink-0 ${showMine ? "chip-on" : ""}`} data-testid="brag-mine">{t("brag.mine")} ♥{mineLikes}</button>
      </div>
      {showMine && (
        <>
          <p className="mb-2 rounded-2xl bg-cream px-3 py-2 text-[12px] text-ink/60">{t("brag.mineDesc", { n: mine.length, likes: mineLikes })}</p>
          {mine.length === 0 && <p className="rounded-2xl bg-cream p-3 text-xs text-ink/55">{t("brag.mineNone")}</p>}
          <div className="space-y-3">{mine.map((b) => <BragCard key={b.id} b={b} />)}</div>
        </>
      )}
      {!showMine && status === "loading" && <p className="py-6 text-center text-xs text-ink/45">{t("brag.loading")}</p>}
      {!showMine && status === "error" && <p className="rounded-2xl bg-cream p-3 text-xs text-ink/55">{t("brag.error")} <button className="font-bold text-pink-deep" onClick={() => void loadBrags()}>{t("brag.retry")}</button></p>}
      {!showMine && status === "ok" && list.length === 0 && <p className="rounded-2xl bg-cream p-3 text-xs text-ink/55" data-testid="brag-empty">{t(sort === "follow" ? (follows.length ? "brag.followNone" : "follow.none") : "brag.none")}</p>}
      {!showMine && <div className="space-y-3">{list.map((b) => <BragCard key={b.id} b={b} />)}</div>}
    </>
  );
}

/** 다른 화면에서 "자랑하기" 바로가기 */
export function BragButton({ kind, care, before, className = "" }: { kind: BragKind; care?: BragData["care"]; before?: () => void; className?: string }) {
  const t = useT();
  return (
    <button className={`btn-ghost !px-3 !py-2 text-xs ${className}`} data-testid={`brag-${kind}`}
      onClick={() => { before?.(); useUI.setState({ panel: "social", socialTab: "brag", bragKind: kind, bragCare: care ?? null }); }}>
      <Icon n="party" /> {t("brag.btn")}
    </button>
  );
}

/** 게임 중 5분마다 내 자랑에 새 좋아요가 왔는지 확인해 알려 준다 (Hud 에 붙어 있다) */
export function BragWatcher() {
  const t = useT();
  const screen = useUI((s) => s.screen);
  useEffect(() => {
    if (screen !== "game") return;
    let seenGifts = -1;
    const check = async () => {
      const n = await checkBragLikes();
      if (n > 0) useUI.getState().toast(t("brag.newLikes", { n }), "reward");
      const g = await loadInbox();
      if (g > 0 && g !== seenGifts) useUI.getState().toast(t("gift.arrived", { n: g }), "reward");
      seenGifts = g;
      if (!useFollows.getState().loaded) await loadFollows();
      const f = await checkFollowFeed(useFollows.getState().list.length > 0);
      if (f > 0) useUI.getState().toast(t("brag.followNew", { n: f }), "reward");
    };
    const first = setTimeout(check, 4000);
    const id = setInterval(check, 5 * 60_000);
    return () => { clearTimeout(first); clearInterval(id); };
  }, [screen]);
  return null;
}

/** 선물 고르기: 하트(무료) · 코인 100 · 500 */
export function GiftPicker({ to, name, onDone }: { to: string; name: string; onDone: () => void }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const send = async (kind: "heart" | "coins", amount: number) => {
    setBusy(true);
    const r = await sendGift(to, kind, amount);
    setBusy(false);
    useUI.getState().toast(r === "ok" ? t("gift.sent", { name }) : t(`gift.fail.${r}`), r === "ok" ? "reward" : "error");
    if (r === "ok") onDone();
  };
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-xl bg-pink-soft/40 p-2" data-testid="gift-picker">
      <span className="text-[12px] font-bold text-ink/60">{t("gift.to", { name })}</span>
      <button disabled={busy} className="chip disabled:opacity-40" onClick={() => send("heart", 1)} data-testid="gift-heart">♥ {t("gift.heart")}</button>
      {GIFT_COINS.map((n) => <button key={n} disabled={busy} className="chip disabled:opacity-40" onClick={() => send("coins", n)} data-testid={`gift-coins-${n}`}>{n} COIN</button>)}
    </div>
  );
}

/** 소셜 패널 '선물함' */
export function GiftInbox() {
  const t = useT();
  const { list, status } = useGifts();
  const [busy, setBusy] = useState(false);
  useEffect(() => { void loadInbox(); }, []);
  const claim = async () => {
    setBusy(true);
    const r = await claimGifts();
    setBusy(false);
    if (r && r.count) useUI.getState().toast(t("gift.claimed", { s: r.hearts, c: r.coins }), "reward");
  };
  return (
    <div data-testid="gift-inbox">
      <p className="mb-2 rounded-2xl bg-cream px-3 py-2 text-[12px] text-ink/60">{t("gift.desc")}</p>
      {status === "loading" && <p className="py-6 text-center text-xs text-ink/45">{t("brag.loading")}</p>}
      {status === "ok" && list.length === 0 && <p className="rounded-2xl bg-cream p-3 text-xs text-ink/55">{t("gift.none")}</p>}
      {list.length > 0 && <button disabled={busy} className="btn-primary mb-2 w-full disabled:opacity-40" onClick={claim} data-testid="gift-claim">{t("gift.claimAll", { n: list.length })}</button>}
      <div className="space-y-1.5">
        {list.map((g) => (
          <div key={g.id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm">
            <span className="text-lg text-pink-deep">{g.kind === "heart" ? "♥" : <Icon n="coin" />}</span>
            <p className="min-w-0 flex-1 truncate text-xs font-bold text-ink">{g.name} <span className="font-semibold text-ink/50">· {g.kind === "heart" ? t("gift.heartItem") : `${g.amount} COIN`}</span></p>
            <span className="text-[12px] text-ink/40">{ago(g.at, t)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 내 자랑을 외부 SNS · 메신저로 공유: 비트파크에서 내 라운지로 바로 들어오는 링크 */
export async function shareBrag(b: Brag, msg: string, t: (k: string, v?: Record<string, string | number>) => string) {
  const url = shareUrl({ visit: b.writer });
  const text = t("brag.shareText", { name: b.name, msg });
  try {
    if (navigator.share) { await navigator.share({ title: "BEAUTY LIFE", text, url }); return; }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    useUI.getState().toast(t("brag.shareCopied"));
  } catch { /* 사용자가 공유 창을 닫음 */ }
}

/** 팔로우 토글 */
export function FollowChip({ code, name }: { code: string; name: string }) {
  const t = useT();
  const on = useFollows((s) => s.list.some((f) => f.code === code));
  const click = async () => {
    const r = await setFollow(code, name, !on);
    if (r !== "ok") useUI.getState().toast(t(`follow.fail.${r}`), "error");
  };
  return <button onClick={click} className={`chip shrink-0 !px-2 !py-0.5 !text-[12px] ${on ? "chip-on" : ""}`} data-testid="follow">{on ? t("follow.on") : t("follow.off")}</button>;
}

/** 소셜 '친구' 탭: 내가 팔로우한 실제 플레이어 */
export function FollowList() {
  const t = useT();
  const { list, followers, loaded } = useFollows();
  const [gift, setGift] = useState<string | null>(null);
  useEffect(() => { void loadFollows(); }, []);
  const visit = async (code: string) => { const r = await visitByCode(code); if (r !== "ok") useUI.getState().toast(t(`live.visit.${r}`), "error"); };
  return (
    <div className="mb-4" data-testid="follow-list">
      <div className="mb-2 flex items-center gap-3 rounded-2xl bg-pink-soft/50 p-3">
        <div className="text-center"><p className="text-lg font-black text-ink">{list.length}</p><p className="text-[12px] font-bold text-ink/50">{t("follow.following")}</p></div>
        <div className="text-center"><p className="text-lg font-black text-ink">{followers}</p><p className="text-[12px] font-bold text-ink/50">{t("follow.followers")}</p></div>
        <p className="min-w-0 flex-1 text-[12px] leading-snug text-ink/60">{t("follow.desc")}</p>
      </div>
      {loaded && list.length === 0 && <p className="rounded-2xl bg-cream p-3 text-xs text-ink/55">{t("follow.none")}</p>}
      <div className="space-y-2">
        {list.map((f) => (
          <div key={f.code} className="card !p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: `hsl(${parseInt(f.code, 36) % 360} 60% 72%)` }}>{f.name.slice(0, 1).toUpperCase()}</span>
              <p className="min-w-0 flex-1 truncate text-xs font-black text-ink">{f.name}</p>
              <button className="chip" onClick={() => setGift(gift === f.code ? null : f.code)}><Icon n="gift" /> {t("gift.btn")}</button>
              <button className="btn-primary !px-3 !py-1.5 text-[12px]" onClick={() => visit(f.code)}>{t("brag.visit")}</button>
              <button className="text-[12px] font-bold text-ink/35" onClick={() => void setFollow(f.code, f.name, false)}>{t("follow.unfollow")}</button>
            </div>
            {gift === f.code && <GiftPicker to={f.code} name={f.name} onDone={() => setGift(null)} />}
          </div>
        ))}
      </div>
    </div>
  );
}
