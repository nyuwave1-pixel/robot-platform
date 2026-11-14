"use client";

import { useEffect } from "react";

const RELOAD_KEY = "uc_err_reload";

/**
 * Root error boundary. The usual cause on a static site is "version skew": the
 * tab was opened before a deploy and now asks for script chunks that no longer
 * exist. A full reload fetches the current version, so we do that once
 * automatically (guarded so a real bug can't cause a reload loop), and the
 * buttons always do a full page load rather than a client-side retry.
 */
export default function ErrorPage({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    try {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
      if (Date.now() - last > 60_000) {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        window.location.reload();
      }
    } catch {
      /* storage blocked: leave the buttons to the visitor */
    }
  }, [error]);

  return (
    <main className="grid min-h-[70vh] place-items-center px-6 text-center">
      <div>
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-4 font-display text-5xl">We couldn&apos;t load this page.</h1>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={() => window.location.reload()} className="btn-primary">Try again</button>
          {/* Plain <a>: a full page load, not a client-side navigation that could hit the same stale chunks. */}
          <a href="/" className="btn-ghost">Back to home</a>
        </div>
      </div>
    </main>
  );
}
