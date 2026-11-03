"use client";

import type { Faq } from "@/content/types";
import { track } from "@/lib/analytics";
import type { AmazonProduct } from "./AmazonButton";

export function FaqList({ faqs, product }: { faqs: Faq[]; product?: AmazonProduct }) {
  return (
    <div className="divide-y divide-ink/10 border-y border-ink/10">
      {faqs.map((f, i) => (
        <details
          key={i}
          className="group py-6"
          onToggle={(e) => {
            if ((e.currentTarget as HTMLDetailsElement).open) track("faq_open", { product, label: f.q.slice(0, 80) });
          }}
        >
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left text-lg font-medium [&::-webkit-details-marker]:hidden">
            <h3 className="font-sans text-lg font-medium tracking-normal">{f.q}</h3>
            <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink/20 transition group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
