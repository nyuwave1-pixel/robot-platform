"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { gpcEnabled, setConsent, storedConsent } from "@/lib/analytics";

type Mode = "opt-out" | "opt-in";

/**
 * True while this visitor has not made a privacy choice yet (and sends no GPC signal).
 * Starts false so the server HTML and the first client render match; flips after mount.
 */
export function useConsentPending() {
  const [pending, setPending] = useState(false);
  useEffect(() => {
    setPending(!storedConsent() && !gpcEnabled());
    const done = () => setPending(false);
    window.addEventListener("uc-consent", done);
    return () => window.removeEventListener("uc-consent", done);
  }, []);
  return pending;
}

const BTN =
  "relative h-[26px] shrink-0 whitespace-nowrap rounded-[8px] px-2 text-[12px] min-[375px]:px-2.5 font-semibold transition-[transform,background-color] duration-150 ease-out active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']";

/**
 * First-visit privacy notice, one line in the dark strip at the very top of the page.
 *
 * It used to be a card fixed to the bottom of the screen, which on phones sat on top of the
 * Amazon buttons (the gallery button on the first screen and the sticky bottom button) until the
 * visitor chose Accept or Opt out (client report, 2026-11-25). The top strip never overlaps a
 * buy button, and as an overlay on the announcement strip it takes exactly that strip's height,
 * so nothing on the page moves when it appears or goes away.
 *
 * `overlay`: drawn over the announcement strip. Without it (no announcement configured) it is its
 * own strip in the page flow.
 */
export function ConsentNoticeBar({ mode, overlay = false }: { mode: Mode; overlay?: boolean }) {
  const optOut = mode === "opt-out";
  return (
    <div
      role="region"
      aria-label="Privacy notice"
      className={`uc-notice flex items-center justify-between gap-2 bg-[#16150F] px-2.5 text-white min-[375px]:gap-2.5 min-[375px]:px-3 sm:justify-center sm:gap-5 ${
        overlay ? "absolute inset-0 z-10" : "min-h-[35px] py-1"
      }`}
    >
      {/* One line at every width: the shortest sentence below 360px, a short one on phones, the full one from 640px. */}
      <p className="min-w-0 text-[12px] leading-[1.2] text-white/85">
        <span className="min-[360px]:hidden">{optOut ? "We use cookies." : "Allow cookies?"}</span>
        <span className="hidden min-[360px]:inline sm:hidden">{optOut ? "Cookies help us measure ads." : "May we use cookies for ads?"}</span>
        <span className="hidden sm:inline">
          {optOut ? "We use cookies to measure our ads and improve this site." : "We'd like to use cookies to measure our ads and improve this site."}
        </span>{" "}
        <Link
          href="/privacy"
          className="whitespace-nowrap font-medium text-white underline decoration-white/50 underline-offset-2 transition-colors hover:decoration-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span className="sm:hidden">Privacy</span>
          <span className="hidden sm:inline">Privacy Policy</span>
        </Link>
      </p>
      <div className="flex shrink-0 items-center gap-1.5">
        <button type="button" className={`${BTN} bg-white text-[#16150F] hover:bg-[#F0EEE9]`} onClick={() => setConsent("granted")}>
          Accept
        </button>
        <button
          type="button"
          aria-label={optOut ? "Opt out of sharing for targeted advertising" : "Decline cookies"}
          className={`${BTN} text-white ring-1 ring-inset ring-white/40 hover:bg-white/10`}
          onClick={() => setConsent("denied")}
        >
          {optOut ? (
            <>
              <span className="sm:hidden">Opt out</span>
              <span className="hidden sm:inline">Opt out of sharing</span>
            </>
          ) : (
            "Decline"
          )}
        </button>
      </div>
    </div>
  );
}

/** The notice as its own top strip, for when no announcement strip is configured. */
export function ConsentNotice({ mode }: { mode: Mode }) {
  const pending = useConsentPending();
  return pending ? <ConsentNoticeBar mode={mode} /> : null;
}
