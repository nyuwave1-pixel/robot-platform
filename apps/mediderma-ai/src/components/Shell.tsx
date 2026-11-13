"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { LOCALE_NAMES, type Locale } from "@/lib/appConfig";
import { useApp } from "@/lib/client/store";
import { track } from "@/lib/client/telemetry";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-2 font-display tracking-[0.28em] ${className}`}>
      <span className="font-semibold text-white">MEDIDERMA</span>
      <span className="bg-gradient-to-r from-scan to-scan2 bg-clip-text text-transparent">AI</span>
    </span>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useI18n();
  const { config, expiredNotice, dismissExpired, analysis } = useApp();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" aria-label="MEDIDERMA AI" className="text-[13px] sm:text-sm">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1 text-[13px] text-silver sm:gap-3">
            <Link href="/analyze" className="rounded px-2 py-1.5 hover:text-white">{t.nav.analyze}</Link>
            <Link href="/compare" className="rounded px-2 py-1.5 hover:text-white">{t.nav.compare}</Link>
            <Link href="/history" className="hidden rounded px-2 py-1.5 hover:text-white sm:block">{t.nav.history}</Link>
            <label className="sr-only" htmlFor="lang">{t.common.language}</label>
            <select
              id="lang"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="rounded border border-line bg-panel px-1.5 py-1 text-xs text-silver focus:outline-none focus:ring-1 focus:ring-scan"
            >
              {config.locales.map((l) => (
                <option key={l} value={l}>{LOCALE_NAMES[l]}</option>
              ))}
            </select>
          </nav>
        </div>
        {analysis?.result.isMock && <div className="bg-amber-500 px-4 py-1 text-center text-xs font-semibold text-black">{t.common.mockBanner}</div>}
      </header>
      {expiredNotice && (
        <div role="alert" className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-200">
          {t.errors.sessionExpired}{" "}
          <button onClick={dismissExpired} className="underline">{t.common.close}</button>
        </div>
      )}
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line/70 bg-panel/60">
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 text-xs leading-relaxed text-silver/70">
          <p>{t.common.footerDisclaimer}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-silver">{t.common.footerCompany}</span>
            <Link href="/privacy" className="underline-offset-2 hover:text-white hover:underline">{t.nav.privacy}</Link>
            <Link href="/history" className="underline-offset-2 hover:text-white hover:underline">{t.nav.history}</Link>
            <a href="https://dermahome.unincore.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">{t.nav.dermahome}</a>
            <a href={config.links.freeTrial} target="_blank" rel="noopener noreferrer" onClick={() => track("trial_click")} className="hover:text-white hover:underline">{t.nav.trial}</a>
            <a href={config.links.partners} target="_blank" rel="noopener noreferrer" onClick={() => track("partner_click")} className="hover:text-white hover:underline">{t.care.partnerCta}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
