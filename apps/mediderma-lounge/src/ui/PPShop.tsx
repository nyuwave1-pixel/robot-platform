/**
 * BIT PARK 포인트(PP) 상점 — 상점 패널 위쪽 카드.
 *  - BIT PARK 포털 안: 내 PP · 젬/코인 팩 · 프리미엄 아이템 바로 사기 (결제 확인은 포털 창에서)
 *  - 포털 밖: 어디서 쓸 수 있는지만 안내 (가짜 버튼 없음)
 */
import { useEffect, useState } from "react";
import { FASHION_MAP, INTERIOR_MAP } from "../data/game";
import { useGame } from "../store/game";
import { useUI } from "../store/ui";
import { useT } from "../i18n";
import { Icon, Price } from "./Icon";
import { BP_PLAY_URL, bpPortalOrigin, buyWithPP, loadPPShop, PP_GRANTS, usePPShop, type PPProduct } from "../platform/ppShop";

const isPack = (sku: string) => !sku.startsWith("item:");

export function PPShop() {
  const t = useT();
  const inPortal = bpPortalOrigin() !== null;
  const { status, signedIn, pp, products, busy } = usePPShop();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (inPortal) void loadPPShop(); }, [inPortal]);

  if (!inPortal) {
    return (
      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-gold/40 bg-ink px-3 py-2.5 text-cream" data-testid="pp-shop-off">
        <p className="min-w-0 flex-1 text-[12px] leading-snug text-cream/75"><b className="text-gold">BIT PARK POINT</b> · {t("pp.offNote")}</p>
        <a className="shrink-0 rounded-full bg-gold px-3 py-1.5 text-[12px] font-black text-ink" href={BP_PLAY_URL} target="_blank" rel="noreferrer">{t("pp.openBitpark")}</a>
      </div>
    );
  }

  const buy = async (p: PPProduct) => {
    const r = await buyWithPP(p.sku);
    const ui = useUI.getState();
    if (r.ok) ui.toast(t(r.grant === "kept-gems" ? "pp.doneKept" : "pp.done", { item: p.name }), "reward");
    else if (r.reason !== "cancelled") ui.toast(t(`pp.fail.${r.reason}`), "error");
  };
  const packs = products.filter((p) => isPack(p.sku));
  const items = products.filter((p) => !isPack(p.sku));

  return (
    <div className="mb-3 rounded-2xl border border-gold/40 bg-ink p-3 text-cream" data-testid="pp-shop">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black text-gold">BIT PARK POINT SHOP</p>
        <span className="text-[12px] font-bold text-cream/75" data-testid="pp-balance">
          {status === "loading" ? t("pp.loading") : !signedIn ? t("pp.signin") : `${(pp ?? 0).toLocaleString()} PP`}
        </span>
      </div>
      {status === "error" && <p className="mt-2 text-[12px] text-cream/60">{t("pp.error")} <button className="font-bold text-gold underline" onClick={() => void loadPPShop()}>{t("brag.retry")}</button></p>}
      {status === "ok" && (
        <>
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {packs.map((p) => <PackBtn key={p.sku} p={p} pp={pp} signedIn={signedIn} busy={busy} onBuy={buy} />)}
          </div>
          {items.length > 0 && (
            <button className="mt-2 w-full rounded-xl bg-white/10 py-1.5 text-[12px] font-bold text-cream/85" onClick={() => setOpen(!open)} data-testid="pp-items-toggle">
              {t("pp.items")} ({items.length}) {open ? "▲" : "▼"}
            </button>
          )}
          {open && <div className="mt-1.5 space-y-1">{items.map((p) => <ItemRow key={p.sku} p={p} pp={pp} signedIn={signedIn} busy={busy} onBuy={buy} />)}</div>}
          <p className="mt-1.5 text-[12px] leading-snug text-cream/55">{t("pp.note")}</p>
        </>
      )}
    </div>
  );
}

type RowProps = { p: PPProduct; pp: number | null; signedIn: boolean; busy: string | null; onBuy: (p: PPProduct) => void };

function PackBtn({ p, pp, signedIn, busy, onBuy }: RowProps) {
  const g = PP_GRANTS[p.sku];
  const poor = signedIn && (pp ?? 0) < p.price;
  return (
    <button disabled={!!busy || poor} onClick={() => onBuy(p)} className="rounded-xl bg-white/10 px-2 py-2 text-left disabled:opacity-40" data-testid={`pp-${p.sku}`}>
      <span className="flex items-center gap-1 text-[12px] font-black leading-tight">{g.gems ? <Price c="gem" n={g.gems} /> : <Price c="coin" n={g.coins ?? 0} />}</span>
      <span className="mt-0.5 block text-[12px] font-bold text-gold">{busy === p.sku ? "…" : `${p.price.toLocaleString()} PP`}</span>
    </button>
  );
}

function ItemRow({ p, pp, signedIn, busy, onBuy }: RowProps) {
  const t = useT();
  const s = useGame();
  const g = PP_GRANTS[p.sku];
  const f = g.fashion ? FASHION_MAP[g.fashion] : null;
  const it = g.interior ? INTERIOR_MAP[g.interior] : null;
  const owned = f ? s.ownedFashion.includes(f.id) : it ? it.kind !== "furniture" && s.ownedInterior.includes(it.id) : false;
  const lock = f ? (s.stage < f.minStage ? `STAGE ${f.minStage}` : null) : it ? (s.lounge.level < it.minLounge ? `LOUNGE ${it.minLounge}` : null) : null;
  const poor = signedIn && (pp ?? 0) < p.price;
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/5 px-2 py-1.5">
      <p className="min-w-0 flex-1 truncate text-[12px] font-bold">{p.name} <span className="text-cream/45">(<Price c="gem" n={f?.price ?? it?.price ?? 0} />)</span></p>
      {owned ? <span className="text-[12px] text-cream/55">✔ {t("look.owned")}</span>
        : lock ? <span className="flex items-center gap-1 text-[12px] text-cream/55"><Icon n="lock" /> {lock}</span>
        : <button disabled={!!busy || poor} onClick={() => onBuy(p)} className="shrink-0 rounded-full bg-gold px-2.5 py-1 text-[12px] font-black text-ink disabled:opacity-40" data-testid={`pp-${p.sku}`}>{busy === p.sku ? "…" : `${p.price.toLocaleString()} PP`}</button>}
    </div>
  );
}
