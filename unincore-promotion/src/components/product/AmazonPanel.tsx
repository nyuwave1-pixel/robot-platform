import Image from "next/image";
import type { ProductContent } from "@/content/types";
import type { AmazonProduct } from "@/components/site/AmazonButton";
import { AmazonButton } from "@/components/site/AmazonButton";

const TRUST = [
  { title: "Official UNI&CORE listing", text: "The genuine product, sold through our official Amazon.com listing." },
  { title: "Secure Amazon checkout", text: "Pay with your Amazon account — saved addresses, cards and order tracking." },
  { title: "Reviews & today's price", text: "Read customer reviews and see the current price, delivery options and Prime eligibility." },
];

/**
 * Large "buy on Amazon" panel: white-background packshot, product facts and the
 * main Amazon CTA. Used mid-page on product landings. Never states a price —
 * the live price is always on Amazon.
 */
export function AmazonPanel({ p, ap, location = "amazon-panel", dark = false }: { p: ProductContent; ap: AmazonProduct; location?: string; dark?: boolean }) {
  const img = p.packshotWhite || p.heroImage;
  return (
    <div className={`overflow-hidden rounded-[36px] ${dark ? "bg-night text-ivory" : "bg-white ring-1 ring-ink/10"} shadow-[0_30px_80px_-40px_rgba(0,0,0,.35)]`} data-reveal>
      <div className="grid items-center md:grid-cols-[0.9fr_1.1fr]">
        {img && (
          <div className="relative aspect-square w-full bg-white">
            <Image src={img} alt={`UNI&CORE ${p.name}, ${p.size} — available on Amazon.com`} fill sizes="(max-width: 768px) 90vw, 520px" className="object-contain p-8" />
            <span className="absolute left-5 top-5 rounded-full bg-[#232F3E] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white">Now on Amazon.com</span>
          </div>
        )}
        <div className="p-8 sm:p-12">
          <p className={`eyebrow ${dark ? "!text-champagne" : ""}`}>Shop the official listing</p>
          <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            Get {p.shortName} on Amazon
          </h2>
          <p className={`mt-3 text-sm font-semibold uppercase tracking-widest ${dark ? "text-ivory/60" : "text-ink-mute"}`}>
            {p.keyIngredient} · {p.size}
          </p>
          <ul className="mt-7 space-y-4">
            {TRUST.map((t) => (
              <li key={t.title} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#FF9900] text-xs font-bold text-[#232F3E]" aria-hidden>✓</span>
                <span>
                  <strong className="font-semibold">{t.title}</strong>
                  <span className={`block text-sm ${dark ? "text-ivory/70" : "text-ink-soft"}`}>{t.text}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <AmazonButton product={ap} location={location}>
              Buy on Amazon
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </AmazonButton>
            <span className={`text-xs ${dark ? "text-ivory/50" : "text-ink-mute"}`}>Opens Amazon.com in a new tab</span>
          </div>
        </div>
      </div>
    </div>
  );
}
