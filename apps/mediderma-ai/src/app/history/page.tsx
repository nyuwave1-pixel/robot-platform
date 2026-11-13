"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fmt, useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/client/store";
import { clearHistory, deleteHistory, listHistory, type HistoryEntry } from "@/lib/client/history";
import { getAnonId, hasHistoryConsent, setHistoryConsent } from "@/lib/client/session";

function Thumb({ blob }: { blob: Blob }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="" className="h-24 w-20 rounded-lg object-cover" /> : null;
}

export default function HistoryPage() {
  const { t, locale } = useI18n();
  const { config } = useApp();
  const [consent, setConsent] = useState(false);
  const [items, setItems] = useState<HistoryEntry[] | null>(null);
  const reload = useCallback(() => listHistory(config.retention.historyDays).then(setItems).catch(() => setItems([])), [config.retention.historyDays]);
  useEffect(() => {
    setConsent(hasHistoryConsent());
    reload();
  }, [reload]);
  const wipeAll = async (withdraw: boolean) => {
    if (!confirm(t.history.deleteConfirm)) return;
    await clearHistory();
    if (withdraw) {
      setHistoryConsent(false);
      setConsent(false);
    }
    reload();
  };
  const df = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  return (
    <div className="mx-auto max-w-3xl px-4 py-10" data-testid="history">
      <h1 className="font-display text-3xl font-light">{t.history.title}</h1>
      <p className="mt-2 text-sm text-silver">{t.history.desc}</p>
      {!consent ? (
        <div className="mt-6 rounded-xl border border-line bg-panel p-5">
          <p className="text-sm">{t.history.disabled}</p>
          <p className="mt-2 text-xs leading-relaxed text-silver">{fmt(t.consent.history, { days: config.retention.historyDays })}</p>
          <button onClick={() => { setHistoryConsent(true); setConsent(true); }} data-testid="history-enable" className="mt-3 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">{t.history.enable}</button>
        </div>
      ) : (
        <p className="mt-4 text-xs text-silver">
          {t.history.anonId}: <code className="text-white" data-testid="anon-id">{getAnonId()}</code> · {fmt(t.history.retention, { days: config.retention.historyDays })}
        </p>
      )}
      <ul className="mt-6 space-y-3">
        {items?.map((e) => (
          <li key={e.id} className="flex items-center gap-4 rounded-xl border border-line bg-panel p-3" data-testid="history-item">
            <Thumb blob={e.image} />
            <div className="min-w-0 flex-1">
              <p className="text-sm">{df.format(new Date(e.savedAt))}</p>
              <p className="text-xs text-silver">{t.report.overall}: <b className="text-white">{e.result.analysis.overallConditionScore ?? "—"}</b> · {t.report.confidence} {e.result.analysis.confidence !== null ? Math.round(e.result.analysis.confidence * 100) : "—"}%</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Link href={`/compare?before=${e.id}`} className="rounded-full border border-line px-3 py-1 text-silver hover:text-white">{t.history.useBefore}</Link>
                <Link href={`/compare?after=${e.id}`} className="rounded-full border border-line px-3 py-1 text-silver hover:text-white">{t.history.useAfter}</Link>
                <button onClick={() => deleteHistory(e.id).then(reload)} className="rounded-full border border-rose-400/40 px-3 py-1 text-rose-200">{t.common.delete}</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {items && items.length === 0 && <p className="mt-6 text-sm text-silver" data-testid="history-empty">{t.history.empty}</p>}
      <div className="mt-8 flex flex-wrap gap-3">
        {items && items.length > 0 && <button onClick={() => wipeAll(false)} data-testid="history-delete-all" className="rounded-full border border-rose-400/50 px-5 py-2 text-sm text-rose-200">{t.history.deleteAll}</button>}
        {consent && <button onClick={() => wipeAll(true)} data-testid="history-withdraw" className="rounded-full border border-line px-5 py-2 text-sm text-silver">{t.history.withdraw}</button>}
      </div>
    </div>
  );
}
