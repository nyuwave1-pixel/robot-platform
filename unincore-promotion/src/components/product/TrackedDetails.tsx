"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/analytics";
import type { AmazonProduct } from "@/components/site/AmazonButton";

/** <details> that reports the first time a visitor opens it. */
export function TrackedDetails({ product, className, children }: { product: AmazonProduct; className?: string; children: ReactNode }) {
  return (
    <details
      className={className}
      onToggle={(e) => {
        const el = e.currentTarget as HTMLDetailsElement;
        if (el.open && !el.dataset.tracked) {
          el.dataset.tracked = "1";
          track("official_details_open", { product, location: "details" });
        }
      }}
    >
      {children}
    </details>
  );
}
