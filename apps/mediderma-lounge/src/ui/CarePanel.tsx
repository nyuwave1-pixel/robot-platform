/** DERMA HOME DEVICE EXPERIENCE: 루틴 선택 → 스텝(제품 → 부위 케어) → 미스트 마무리 → 결과 */
import { GUIDE_NOTES, MODES, ROUTINES, ZONES, type ModeId } from "../data/devices";
import { EXP_META, type ExpKey } from "../data/game";
import { PRODUCT_MAP, productImage } from "../data/products";
import { useGame } from "../store/game";
import { useUI } from "../store/ui";
import { applyProduct, availableProduct, beginFree, beginRoutine, closeCare, finishCare, routineUnlocked, selectZone } from "../store/care";
import { useL, useT } from "../i18n";

export function CarePanel() {
  const t = useT();
  const L = useL();
  const care = useUI((s) => s.care);
  const stroking = useUI((s) => s.stroking);
  const g = useGame();
  const lang = g.settings.lang === "ko" ? "ko" : "en";
  if (!care) return null;
  const isCustomer = care.subject !== "player";

  const header = (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex items-start justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="rounded-2xl bg-white/85 px-3 py-2 shadow-sm backdrop-blur">
        <p className="text-[10px] font-bold tracking-[0.25em] text-gold">DERMA HOME</p>
        <p className="text-sm font-black text-ink">{care.phase === "pick" ? t("care.choose") : care.routineId ? L(ROUTINES.find((r) => r.id === care.routineId)!) : care.title}</p>
      </div>
      <button className="pointer-events-auto rounded-full bg-white/85 px-3 py-2 text-xs font-bold text-ink shadow-sm backdrop-blur" onClick={closeCare}>✕ {t("common.exit")}</button>
    </div>
  );

  // ── 루틴 선택 ──
  if (care.phase === "pick") {
    const groups = Array.from(new Set(ROUTINES.map((r) => r.group.ko)));
    return (
      <>
        {header}
        <Sheet>
          <p className="text-xs leading-relaxed text-ink/60">{t("care.pickDesc")}</p>
          {groups.map((gk) => (
            <div key={gk} className="mt-3">
              <p className="text-[11px] font-black tracking-wide text-pink-deep">{L(ROUTINES.find((r) => r.group.ko === gk)!.group)}</p>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                {ROUTINES.filter((r) => r.group.ko === gk).map((r) => {
                  const ok = routineUnlocked(r, g.stage, g.lounge.level);
                  const done = g.routinesDone.includes(r.id);
                  return (
                    <button key={r.id} disabled={!ok} onClick={() => beginRoutine(r.id)} className="card text-left disabled:opacity-50">
                      <p className="flex items-center justify-between text-sm font-black text-ink">{L(r)} {done && <span className="text-[10px] text-gold">✔ CLEAR</span>}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {r.steps.map((s, i) => <span key={i} className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: MODES[s.mode].color }}>{s.mode.toUpperCase()} {s.minutes}′</span>)}
                      </div>
                      {!ok && <p className="mt-1 text-[10px] font-semibold text-ink/50">🔒 {r.unlock.stage ? `STAGE ${r.unlock.stage}` : ""} {r.unlock.lounge ? `LOUNGE LV.${r.unlock.lounge}` : ""}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {!isCustomer && (
            <div className="mt-3">
              <p className="text-[11px] font-black tracking-wide text-pink-deep">{t("care.free")}</p>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {(Object.keys(MODES) as ModeId[]).map((m) => (
                  <button key={m} className="card !p-2 text-center" onClick={() => beginFree(m)}>
                    <span className="mx-auto block h-3 w-3 rounded-full" style={{ background: MODES[m].color }} />
                    <p className="mt-1 text-[11px] font-black text-ink">{MODES[m].ko}</p>
                    <p className="text-[9px] text-ink/50">{MODES[m].spec}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          <ul className="mt-3 list-disc space-y-0.5 pl-4 text-[10px] leading-relaxed text-ink/45">{GUIDE_NOTES[lang].map((n) => <li key={n}>{n}</li>)}</ul>
        </Sheet>
      </>
    );
  }

  // ── 결과 ──
  if (care.phase === "result" && care.result) {
    const r = care.result;
    return (
      <>
        {header}
        <Sheet>
          <p className="text-center text-[11px] font-bold tracking-[0.3em] text-gold">CARE COMPLETE</p>
          <p className="mt-1 text-center text-xl font-black text-ink">{isCustomer ? t("care.customerDone") : t("care.done")}</p>
          {r.stars !== undefined && <p className="mt-1 text-center text-2xl text-gold">{"★".repeat(r.stars)}<span className="text-ink/15">{"★".repeat(5 - r.stars)}</span></p>}
          {r.firstTime && <p className="mt-1 text-center text-xs font-bold text-pink-deep">🎉 {t("care.first")}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(Object.entries(r.gain) as [ExpKey, number][]).filter(([, v]) => v > 0).map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-cream px-3 py-2">
                <p className="text-[10px] font-bold" style={{ color: EXP_META[k].color }}>{EXP_META[k].label} EXP</p>
                <p className="text-lg font-black text-ink">+{v}</p>
              </div>
            ))}
            <div className="rounded-2xl bg-cream px-3 py-2"><p className="text-[10px] font-bold text-gold">BEAUTY COIN</p><p className="text-lg font-black text-ink">+{r.coins} 🪙</p></div>
            {!!r.lp && <div className="rounded-2xl bg-cream px-3 py-2"><p className="text-[10px] font-bold text-gold">LOUNGE POINT</p><p className="text-lg font-black text-ink">+{r.lp} 🏛️</p></div>}
          </div>
          <p className="mt-3 text-center text-[10px] text-ink/45">{t("care.fantasy")}</p>
          <button className="btn-primary mt-3 w-full" onClick={closeCare}>{t("common.ok")}</button>
        </Sheet>
      </>
    );
  }

  // ── 미스트 마무리 ──
  if (care.phase === "mist") {
    const mist = PRODUCT_MAP["serum-mist"];
    const have = g.inventory["serum-mist"] ?? 0;
    return (
      <>
        {header}
        <Sheet>
          <p className="text-sm font-black text-ink">💧 {t("care.mistTitle")}</p>
          <p className="mt-1 text-xs text-ink/60">{t("care.mistDesc")}</p>
          <ProductRow id="serum-mist" have={have} />
          <p className="mt-1 text-[10px] text-ink/45">{mist.howTo}</p>
          <div className="mt-3 flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => finishCare(false)}>{t("common.skip")}</button>
            {have > 0 ? (
              <button className="btn-primary flex-1" onClick={() => finishCare(true)}>{t("care.mistUse")}</button>
            ) : (
              <button className="btn-primary flex-1" onClick={() => { if (!g.buyProduct("serum-mist")) useUI.getState().toast(t("shop.noMoney")); }}>{t("care.buy")} 🪙{mist.coinPrice}</button>
            )}
          </div>
        </Sheet>
      </>
    );
  }

  // ── 스텝 진행 ──
  const step = care.steps[care.step];
  const mode = MODES[step.mode];
  const avail = availableProduct(step);
  return (
    <>
      {header}
      <div className={`absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(231,154,174,0.35)] backdrop-blur transition-opacity ${stroking ? "pointer-events-none opacity-60" : ""}`}>
        <div className="mx-auto max-w-xl">
          <div className="flex items-center gap-2">
            {care.steps.map((s, i) => (
              <span key={i} className={`flex-1 rounded-full py-1 text-center text-[10px] font-black ${i === care.step ? "text-white" : i < care.step ? "bg-gold/30 text-ink/60" : "bg-ink/5 text-ink/35"}`} style={i === care.step ? { background: MODES[s.mode].color } : undefined}>
                {i < care.step ? "✔ " : ""}STEP {i + 1} · {s.mode.toUpperCase()}
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <p className="text-sm font-black text-ink">MODE 0{["rf", "us", "ionto"].indexOf(step.mode) + 1} — {mode.label}</p>
            <p className="shrink-0 text-[10px] font-semibold text-ink/45">{t("care.official", { m: step.minutes })}</p>
          </div>
          <p className="text-[11px] text-ink/55">{mode.how[lang]}</p>

          {!care.applied ? (
            <div className="mt-2">
              <p className="text-[11px] font-bold text-ink/70">{t("care.selectProduct")}</p>
              <div className="mt-1 space-y-1.5">
                {step.products.map((id) => {
                  const have = g.inventory[id] ?? 0;
                  const p = PRODUCT_MAP[id];
                  return (
                    <div key={id} className="flex items-center gap-2">
                      <div className="min-w-0 flex-1"><ProductRow id={id} have={have} /></div>
                      {have > 0 ? (
                        <button className="btn-primary shrink-0 !px-4 !py-2 text-xs" onClick={() => applyProduct(id)}>{t("care.apply")}</button>
                      ) : (
                        <button className="btn-ghost shrink-0 !px-3 !py-2 text-xs" onClick={() => { if (!g.buyProduct(id)) useUI.getState().toast(t("shop.noMoney")); }}>{t("care.buy")} 🪙{p.coinPrice}</button>
                      )}
                    </div>
                  );
                })}
              </div>
              {!avail && <p className="mt-1 text-[10px] text-pink-deep">{t("care.needProduct")}</p>}
            </div>
          ) : (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1.5">
                {care.zones.map((z) => {
                  const done = care.done.includes(z);
                  return (
                    <button key={z} onClick={() => selectZone(z)} className={`chip ${care.zone === z ? "chip-on" : ""} ${done ? "!border-gold !bg-gold/20 !text-ink/60" : ""}`}>
                      {done ? "✔ " : ""}{L(ZONES[z])}
                    </button>
                  );
                })}
              </div>
              {care.zone && (
                <>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${care.progress * 100}%`, background: `linear-gradient(90deg, ${mode.color}, #c9a66b)` }} />
                  </div>
                  <p className="mt-1.5 text-[11px] font-semibold text-ink/65">👆 {t("care.stroke", { zone: L(ZONES[care.zone]) })}</p>
                  <p className="text-[10px] text-ink/45">➜ {t("care.direction")}: {L(ZONES[care.zone].dir)}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ProductRow({ id, have }: { id: string; have: number }) {
  const p = PRODUCT_MAP[id];
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-cream p-1.5">
      <img src={productImage(p)} alt="" className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-ink">{p.name}</p>
        <p className="text-[10px] text-ink/50">×{have}</p>
      </div>
    </div>
  );
}

function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 max-h-[58vh] overflow-y-auto rounded-t-3xl bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(231,154,174,0.35)] backdrop-blur md:bottom-4 md:left-auto md:right-4 md:max-h-[80vh] md:w-[420px] md:rounded-3xl">
      {children}
    </div>
  );
}
