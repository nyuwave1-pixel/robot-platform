"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { LOCALE_NAMES, type Locale } from "@/lib/appConfig";
import { useApp } from "@/lib/client/store";
import { track } from "@/lib/client/telemetry";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** 큰 글씨 모드: 루트 글자 크기를 키워 rem 기반 화면 전체를 함께 키운다(어르신·저시력 사용자용). 브라우저에만 기억한다. */
function BigTextToggle({ label }: { label: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let v = false;
    try {
      v = localStorage.getItem("mediderma:bigText") === "1";
    } catch {}
    setOn(v);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("big-text", on);
  }, [on]);
  const flip = () => {
    const v = !on;
    setOn(v);
    try {
      localStorage.setItem("mediderma:bigText", v ? "1" : "0");
    } catch {}
  };
  return (
    <button onClick={flip} aria-pressed={on} title={label} aria-label={`가+ ${label}`} data-testid="big-text" className={`shrink-0 rounded border px-1.5 py-0.5 text-sm font-bold leading-none ${on ? "border-scan bg-scan/20 text-white" : "border-line text-silver"}`}>
      가<span className="text-[10px]">+</span>
    </button>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-1.5 font-display tracking-[0.16em] min-[400px]:gap-2 min-[400px]:tracking-[0.28em] ${className}`}>
      <span className="font-semibold text-white">MEDIDERMA</span>{" "}
      <span className="bg-gradient-to-r from-scan to-scan2 bg-clip-text text-transparent">AI</span>
    </span>
  );
}

/** 모바일 전용 메뉴: 좁은 화면에서는 상단에 메뉴가 들어갈 자리가 없어, 버튼을 누르면 전체 메뉴가 열린다. */
function MobileMenu({ freeTrial }: { freeTrial: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const links: { href: string; label: string; ext?: boolean; onClick?: () => void }[] = [
    { href: "/analyze", label: t.nav.analyze },
    { href: "/compare", label: t.nav.compare },
    { href: "/history", label: t.nav.history },
    { href: "/#technology", label: t.landing.techTitle },
    { href: "/privacy", label: t.nav.privacy },
    { href: "https://dermahome.unincore.com/", label: t.nav.dermahome, ext: true },
    { href: freeTrial, label: t.nav.trial, ext: true, onClick: () => track("trial_click") },
  ];
  return (
    <>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? t.common.close : t.nav.menu} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-white sm:hidden" data-testid="menu-toggle">
        <span aria-hidden className="relative block h-3 w-4">
          <span className={`absolute left-0 h-px w-4 bg-current transition-all duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
          <span className={`absolute left-0 top-1.5 h-px w-4 bg-current transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 h-px w-4 bg-current transition-all duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
        </span>
      </button>
      {open &&
        createPortal(
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label={t.nav.menu} className="fixed inset-x-0 bottom-0 top-14 z-40 overflow-y-auto bg-ink/95 backdrop-blur-xl sm:hidden" data-testid="mobile-menu">
          <nav className="mx-auto max-w-6xl px-5 pb-10 pt-4">
            <ul>
              {links.map((l, i) => (
                <li key={l.href} className="border-b border-line/70" style={{ animation: `menu-in 0.5s ${0.04 * i}s both cubic-bezier(0.16,1,0.3,1)` }}>
                  {l.ext ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" onClick={l.onClick} className="flex items-center justify-between py-4 text-xl font-medium text-white">
                      {l.label}
                      <span aria-hidden className="text-scan2">↗</span>
                    </a>
                  ) : (
                    <Link href={l.href} onClick={() => setOpen(false)} className="flex items-center justify-between py-4 text-xl font-medium text-white">
                      {l.label}
                      <span aria-hidden className="text-silver-soft">→</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <Link href="/analyze" onClick={() => setOpen(false)} className="mt-7 block rounded-full bg-white py-4 text-center text-base font-bold text-black">
              {t.common.start} →
            </Link>
          </nav>
        </div>,
          document.body,
        )}
    </>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useI18n();
  const { config, expiredNotice, dismissExpired, analysis } = useApp();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="shrink-0 text-[12px] min-[400px]:text-[13px] sm:text-sm">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1 text-[13px] text-silver sm:gap-3">
            <Link href="/analyze" className="hidden whitespace-nowrap rounded min-[440px]:block px-1.5 py-1.5 hover:text-white sm:px-2">{t.nav.analyze}</Link>
            <Link href="/compare" className="hidden whitespace-nowrap rounded px-1.5 py-1.5 hover:text-white min-[480px]:block sm:px-2">{t.nav.compare}</Link>
            <Link href="/history" className="hidden rounded px-2 py-1.5 hover:text-white sm:block">{t.nav.history}</Link>
            <BigTextToggle label={t.common.bigText} />
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
            <MobileMenu freeTrial={config.links.freeTrial} />
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
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 text-xs leading-relaxed text-silver-soft">
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
