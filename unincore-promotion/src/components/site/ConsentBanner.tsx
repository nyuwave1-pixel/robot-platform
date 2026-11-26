"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { gpcEnabled, setConsent } from "@/lib/analytics";

/**
 * Full privacy choices card. Opens only when the visitor asks for it ("Your Privacy Choices" in the
 * footer and on /privacy). The first-visit notice is the one-line strip at the top of the page
 * (ConsentNotice), because this card, fixed to the bottom of the screen, covered the mobile Amazon buttons.
 */
export function ConsentBanner({ mode }: { mode: "opt-out" | "opt-in" }) {
  const [open, setOpen] = useState(false);
  const [gpc, setGpc] = useState(false);

  useEffect(() => {
    setGpc(gpcEnabled());
    const reopen = () => setOpen(true);
    window.addEventListener("uc-open-privacy", reopen);
    return () => window.removeEventListener("uc-open-privacy", reopen);
  }, []);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Privacy choices"
      className="glass fixed inset-x-3 bottom-3 z-[60] rounded-[22px] p-4 text-[#16150F] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-[400px] sm:p-5 lg:left-auto lg:right-6 lg:max-w-[420px]"
    >
      <p className="text-[13.5px] font-semibold">Your privacy</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#5C5F58]">
        We use cookies and similar tools to measure our ads and improve this site.{" "}
        {mode === "opt-out" ? "You can opt out of sharing for targeted advertising at any time." : "Nothing is loaded until you accept."}{" "}
        {gpc && "Your browser's Global Privacy Control signal is honored. "}
        <Link href="/privacy" className="font-medium text-[#191A17] underline underline-offset-2">
          Privacy Policy
        </Link>
      </p>
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="min-h-[42px] rounded-[10px] bg-[#16150F] px-4 text-[13px] font-semibold text-white transition hover:bg-black active:scale-[0.98]"
          onClick={() => {
            setConsent("granted");
            setOpen(false);
          }}
        >
          Accept
        </button>
        <button
          type="button"
          className="min-h-[42px] rounded-[10px] bg-white/60 px-4 text-[13px] font-semibold text-[#16150F] ring-1 ring-black/10 transition hover:bg-white/90 active:scale-[0.98]"
          onClick={() => {
            setConsent("denied");
            setOpen(false);
          }}
        >
          {mode === "opt-out" ? "Opt out of sharing" : "Decline"}
        </button>
      </div>
    </div>
  );
}

export function PrivacyChoicesLink({ className = "" }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("uc-open-privacy"))}>
      Your Privacy Choices
    </button>
  );
}
