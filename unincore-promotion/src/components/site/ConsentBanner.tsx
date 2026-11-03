"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { gpcEnabled, setConsent, storedConsent } from "@/lib/analytics";

export function ConsentBanner({ mode }: { mode: "opt-out" | "opt-in" }) {
  const [open, setOpen] = useState(false);
  const [gpc, setGpc] = useState(false);

  useEffect(() => {
    setGpc(gpcEnabled());
    if (!storedConsent() && !gpcEnabled()) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener("uc-open-privacy", reopen);
    return () => window.removeEventListener("uc-open-privacy", reopen);
  }, []);

  if (!open) return null;
  return (
    <div role="dialog" aria-live="polite" aria-label="Privacy choices" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-2xl bg-ink p-4 text-ivory shadow-2xl sm:bottom-5 sm:p-5">
      <p className="text-[13px] leading-relaxed text-ivory/85 sm:text-sm">
        We use cookies and similar tools to measure our ads and improve this site.{" "}
        {mode === "opt-out" ? "You can opt out of sharing for targeted advertising at any time." : "Nothing is loaded until you accept."}{" "}
        {gpc && "Your browser's Global Privacy Control signal is honored. "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="rounded-full bg-ivory px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-ink"
          onClick={() => {
            setConsent("granted");
            setOpen(false);
          }}
        >
          Accept
        </button>
        <button
          className="rounded-full border border-ivory/30 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest"
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
