/**
 * BIT PARK 포인트(P) 상점 — 상점 패널 위쪽 카드.
 *  - BIT PARK 포털 안: 내 P · 뷰티 코인 충전 · 뷰티 젬 팩 · 프리미엄 아이템 (결제 확인은 포털 창에서)
 *  - 포털 밖: 어디서 쓸 수 있는지만 안내 (가짜 버튼 없음)
 */
import { useEffect, useState } from "react";
import { FASHION_MAP, INTERIOR_MAP } from "../data/game";
import { useGame } from "../store/game";
import { useUI } from "../store/ui";
import { useT } from "../i18n";
import { Icon, Price } from "./Icon";
import { BP_PLAY_URL, bpPortalOrigin, buyItem, hasItem, isGemPack, loadPPShop, PP_GRANTS, TOPUPS, topUp, usePPShop, type BuyResult, type PPItem } from "../platform/ppShop";

export function PPShop() {
  const t = useT();
  const inPortal = bpPortalOrigin() !== null;
  const { status, signedIn, canSpend, pp, items, busy } = usePPShop();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!inPortal) return;
    void loadPPShop().then((got) => { if (got.length) useUI.getState().toast(t("pp.synced", { n: got.length }), "reward"); });
  }, [inPortal]);

  if (!inPortal) {
    return (
      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-gold/40 bg-ink px-3 py-2.5 text-cream" data-testid="pp-shop-off">
        <p className="min-w-0 flex-1 text-[12px] leading-snug text-cream/75"><b className="text-gold">BIT PARK POINT</b> · {t("pp.offNote")}</p>
        <a className="shrink-0 rounded-full bg-gold px-3 py-1.5 text-[12px] font-black text-ink" href={BP_PLAY_URL} target="_blank" rel="noreferrer">{t("pp.openBitpark")}</a>
      </div>
    );
  }

  const done = (r: BuyResult, name: string) => {
    const ui = useUI.getState();
    if (r.ok) ui.toast(r.grant === "coins" ? t("pp.doneCoins", { n: (r.amount ?? 0).toLocaleString() }) : t("pp.done", { item: name }), "reward");
    else if (r.reason !== "cancelled") ui.toast(t(`pp.fail.${r.reason}`), "error");
  };
  const packs = items.filter((p) => isGemPack(p.id));
  const premium = items.filter((p) => !isGemPack(p.id));
  const poor = (price: number) => signedIn && (pp ?? 0) < price;

  return (
    <div className="mb-3 rounded-2xl border border-gold/40 bg-ink p-3 text-cream" data-testid="pp-shop">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black text-gold">BIT PARK POINT SHOP</p>
        <span className="text-[12px] font-bold text-cream/75" data-testid="pp-balance">
          {status === "loading" ? t("pp.loading") : !signedIn ? t("pp.signin") : `${(pp ?? 0).toLocaleString()} P`}
        </span>
      </div>
      {status === "error" && <p className="mt-2 text-[12px] text-cream/60">{t("pp.error")} <button className="font-bold text-gold underline" onClick={() => void loadPPShop()}>{t("brag.retry")}</button></p>}
      {status === "ok" && (
        <>
          {canSpend && (
            <div className="mt-2">
              <p className="mb-1 text-[12px] font-bold text-cream/60">{t("pp.topup")}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {TOPUPS.map((o) => (
                  <button key={o.pack} disabled={!!busy || poor(o.pp)} className="rounded-xl bg-white/10 px-2 py-2 text-left disabled:opacity-40" data-testid={`pp-${o.pack}`}
                    onClick={async () => done(await topUp(o.pack, t("pp.topupLabel", { n: o.coins.toLocaleString() })), "")}>
                    <span className="flex items-center gap-1 text-[12px] font-black"><Price c="coin" n={o.coins} /></span>
                    <span className="mt-0.5 block text-[12px] font-bold text-gold">{busy === o.pack ? "…" : `${o.pp} P`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {packs.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 text-[12px] font-bold text-cream/60">{t("pp.gems")}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {packs.map((p) => (
                  <button key={p.id} disabled={!!busy || poor(p.price)} className="rounded-xl bg-white/10 px-2 py-2 text-left disabled:opacity-40" data-testid={`pp-${p.id}`}
                    onClick={async () => done(await buyItem(p.id), p.name)}>
                    <span className="flex items-center gap-1 text-[12px] font-black"><Price c="gem" n={PP_GRANTS[p.id].gems ?? 0} /></span>
                    <span className="mt-0.5 block text-[12px] font-bold text-gold">{busy === p.id ? "…" : `${p.price.toLocaleString()} P`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {premium.length > 0 && (
            <button className="mt-2 w-full rounded-xl bg-white/10 py-1.5 text-[12px] font-bold text-cream/85" onClick={() => setOpen(!open)} data-testid="pp-items-toggle">
              {t("pp.items")} ({premium.length}) {open ? "▲" : "▼"}
            </button>
          )}
          {open && <div className="mt-1.5 space-y-1">{premium.map((p) => <ItemRow key={p.id} p={p} busy={busy} poor={poor(p.price)} onBuy={async () => done(await buyItem(p.id), p.name)} />)}</div>}
          {!canSpend && signedIn && <p className="mt-1.5 text-[12px] text-cream/55">{t("pp.topupOff")}</p>}
          <p className="mt-1.5 text-[12px] leading-snug text-cream/55">{t("pp.note")}</p>
        </>
      )}
    </div>
  );
}

function ItemRow({ p, busy, poor, onBuy }: { p: PPItem; busy: string | null; poor: boolean; onBuy: () => void }) {
  const t = useT();
  const s = useGame();
  const g = PP_GRANTS[p.id];
  const f = g.fashion ? FASHION_MAP[g.fashion] : null;
  const it = g.interior ? INTERIOR_MAP[g.interior] : null;
  const owned = p.owned || hasItem(p.id);
  const lock = f ? (s.stage < f.minStage ? `STAGE ${f.minStage}` : null) : it ? (s.lounge.level < it.minLounge ? `LOUNGE ${it.minLounge}` : null) : null;
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/5 px-2 py-1.5">
      <p className="min-w-0 flex-1 truncate text-[12px] font-bold">{p.name} <span className="text-cream/45">(<Price c="gem" n={f?.price ?? it?.price ?? 0} />)</span></p>
      {owned ? <span className="text-[12px] text-cream/55">✔ {t("look.owned")}</span>
        : lock ? <span className="flex items-center gap-1 text-[12px] text-cream/55"><Icon n="lock" /> {lock}</span>
        : <button disabled={!!busy || poor} onClick={onBuy} className="shrink-0 rounded-full bg-gold px-2.5 py-1 text-[12px] font-black text-ink disabled:opacity-40" data-testid={`pp-${p.id}`}>{busy === p.id ? "…" : `${p.price.toLocaleString()} P`}</button>}
    </div>
  );
}
