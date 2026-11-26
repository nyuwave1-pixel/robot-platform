/**
 * 클라우드 백업 · 기기 이전 화면 (net/cloud.ts)
 *  - 설정: 마지막 백업 시각 · 지금 백업 · 기기 이전 코드 만들기
 *  - 첫 화면: 다른 기기에서 이어하기 (친구 코드 + 이전 코드)
 */
import { useEffect, useState } from "react";
import { useGame } from "../store/game";
import { useUI } from "../store/ui";
import { useL, useT } from "../i18n";
import { accountMeta, backupNow, claimTransfer, createTransfer, linkToPlatform, loadFromAccount, normPin, useCloud, type CloudMeta } from "../net/cloud";
import { useAccountLink, usePlatformStatus } from "../platform/status";
import { onExchange, requestExchange } from "../platform/bitpark";
import { EXCHANGE_OFFERS } from "../platform/exchange";
import { Icon } from "./Icon";

const time = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

export function CloudSettings() {
  const t = useT();
  const code = useGame((s) => s.friendCode);
  const { status, lastAt } = useCloud();
  const [pin, setPin] = useState<{ pin: string; expires: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useUI((s) => s.toast);
  const backup = async () => {
    setBusy(true);
    const r = await backupNow();
    setBusy(false);
    toast(t(`cloud.backup.${r}`), r === "ok" ? "pickup" : "error");
  };
  const transfer = async () => {
    setBusy(true);
    const r = await createTransfer();
    setBusy(false);
    if (typeof r === "object") setPin(r); else toast(t(`cloud.tr.${r}`), "error");
  };
  return (
    <div className="mt-4 rounded-2xl bg-cream p-3" data-testid="cloud-settings">
      <p className="text-xs font-bold text-ink/70"><Icon n="box" /> {t("cloud.title")}</p>
      <AccountLinkBox />
      <p className="mt-1 text-[12px] text-ink/60">{t("cloud.last", { at: time(lastAt) })}{status === "error" && ` · ${t("cloud.err")}`}</p>
      <div className="mt-2 flex gap-2">
        <button disabled={busy} className="btn-ghost flex-1 !py-2 text-xs disabled:opacity-40" onClick={backup} data-testid="cloud-backup">{t("cloud.now")}</button>
        <button disabled={busy} className="btn-primary flex-1 !py-2 text-xs disabled:opacity-40" onClick={transfer} data-testid="cloud-transfer">{t("cloud.makeCode")}</button>
      </div>
      {pin && (
        <div className="mt-2 rounded-xl border-2 border-pink-deep bg-white p-3 text-center" data-testid="cloud-pin">
          <p className="text-[12px] font-bold text-ink/55">{t("cloud.friendCode")}</p>
          <p className="text-lg font-black tracking-[0.25em] text-ink">{code}</p>
          <p className="mt-1 text-[12px] font-bold text-ink/55">{t("cloud.pin")}</p>
          <p className="text-2xl font-black tracking-[0.2em] text-pink-deep">{pin.pin}</p>
          <p className="mt-1 text-[12px] text-ink/55">{t("cloud.until", { at: time(pin.expires) })}</p>
        </div>
      )}
      <p className="mt-2 text-[12px] leading-relaxed text-ink/50">{t("cloud.note")}</p>
    </div>
  );
}

export function TransferClaim({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true); setMsg("");
    const r = await claimTransfer(code, pin);
    setBusy(false);
    if (r !== "ok") setMsg(t(`cloud.claim.${r}`));
  };
  return (
    <div className="relative mt-4 w-full max-w-xs rounded-2xl border border-pink-soft bg-white/90 p-3 text-left shadow-sm" data-testid="transfer-claim">
      <p className="text-xs font-black text-ink">{t("cloud.claimTitle")}</p>
      <p className="mt-0.5 text-[12px] text-ink/55">{t("cloud.claimHelp")}</p>
      <input value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t("cloud.friendCode")} className="mt-2 w-full rounded-xl border-2 border-pink-soft px-3 py-2 text-sm font-bold tracking-widest outline-none focus:border-pink-deep" />
      <input value={pin} maxLength={9} onChange={(e) => setPin(normPin(e.target.value))} placeholder={t("cloud.pin")} className="mt-1.5 w-full rounded-xl border-2 border-pink-soft px-3 py-2 text-sm font-bold tracking-widest outline-none focus:border-pink-deep" />
      {msg && <p className="mt-1.5 text-[12px] font-bold text-pink-deep">{msg}</p>}
      <div className="mt-2 flex gap-2">
        <button className="btn-ghost !px-3 !py-2 text-xs" onClick={onClose}>{t("brag.cancel")}</button>
        <button disabled={busy || code.length !== 6 || pin.length !== 8} className="btn-primary flex-1 !py-2 text-xs disabled:opacity-40" onClick={go} data-testid="transfer-go">{t("cloud.claimGo")}</button>
      </div>
      <p className="mt-1.5 text-[12px] text-ink/45">{t("cloud.claimWarn")}</p>
    </div>
  );
}

/** 비트파크 계정 연결 상태 · 계정에 저장된 다른 진행 불러오기 */
export function AccountLinkBox({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const { known, link } = useAccountLink();
  const loggedIn = usePlatformStatus((s) => s.loggedIn);
  const started = useGame((s) => s.started);
  const code = useGame((s) => s.friendCode);
  const [meta, setMeta] = useState<(CloudMeta & { at: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const differs = !!link && (!started || link.code !== code);
  useEffect(() => { if (differs && link) void accountMeta(link).then(setMeta); else setMeta(null); }, [differs, link?.code]);
  if (!known || !loggedIn) return null;
  if (link && started && link.code === code) return compact ? null : <p className="mt-2 text-[12px] font-bold text-gold" data-testid="account-linked">✓ {t("acct.linked")}</p>;
  if (!differs || !meta) return null;
  const load = async () => {
    setBusy(true);
    const r = await loadFromAccount(link!);
    setBusy(false);
    if (r !== "ok") useUI.getState().toast(t(`acct.fail.${r}`), "error");
  };
  return (
    <div className="relative mt-3 w-full max-w-xs rounded-2xl border border-gold/50 bg-white/90 p-3 text-left shadow-sm" data-testid="account-link">
      <p className="text-xs font-black text-ink">{t("acct.found")}</p>
      <p className="mt-0.5 text-[12px] text-ink/60">{meta.name || "—"} · STAGE {meta.stage} · {time(meta.at)}</p>
      <button disabled={busy} className="btn-primary mt-2 w-full !py-2 text-xs disabled:opacity-40" onClick={load} data-testid="account-load">{t("acct.load")}</button>
      {started && <button disabled={busy} className="btn-ghost mt-1.5 w-full !py-2 text-xs disabled:opacity-40" onClick={() => { linkToPlatform(true); useUI.getState().toast(t("acct.relinked")); }}>{t("acct.useThis")}</button>}
      <p className="mt-1.5 text-[12px] text-ink/45">{started ? t("acct.warn") : t("acct.fresh")}</p>
    </div>
  );
}

/** 비트파크 RP 교환소 (비트파크에 로그인해 있을 때만) */
export function RpExchange() {
  const t = useT();
  const L = useL();
  const st = usePlatformStatus();
  useEffect(() => onExchange((r) => {
    if (r.ok) useUI.getState().toast(t("ex.done", { item: L(r.offer) }), "reward");
    else if (r.reason !== "cancel") useUI.getState().toast(t(`ex.fail.${r.reason === "balance" ? "balance" : "error"}`), "error");
  }), [t, L]);
  if (!st.known || !st.loggedIn) return null;
  return (
    <div className="mb-3 rounded-2xl border border-gold/40 bg-ink p-3 text-cream" data-testid="rp-exchange">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-gold">{t("ex.title")}</p>
        <span className="text-[12px] font-bold text-cream/70">{(st.rp ?? 0).toLocaleString()} RP</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {EXCHANGE_OFFERS.map((o) => (
          <button key={o.id} disabled={(st.rp ?? 0) < o.rp} className="rounded-xl bg-white/10 px-2 py-2 text-left disabled:opacity-40" data-testid={`ex-${o.id}`}
            onClick={() => { if (!requestExchange(o.id)) useUI.getState().toast(t("ex.fail.error"), "error"); }}>
            <span className="block text-[12px] font-black leading-tight">{L(o)}</span>
            <span className="mt-0.5 block text-[12px] font-bold text-gold">{o.rp} RP</span>
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[12px] text-cream/55">{t("ex.note")}</p>
    </div>
  );
}
