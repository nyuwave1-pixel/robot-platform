"use client";
import { useEffect, useState } from "react";
import { product } from "@/data/product";
import { copy } from "@/data/copy";

const CHAPTERS: { id: string; label: string }[] = [
  { id: "birthday", label: "Skin Has a Birthday" },
  { id: "28days", label: "The 28 Days" },
  { id: "product", label: "Product Reveal" },
  { id: "clinical", label: "Clinical Data" },
  { id: "masterpiece", label: "The Masterpiece" },
  { id: "ingredients", label: "4 Key Ingredients" },
  { id: "pdrn", label: "PDRN Technology" },
  { id: "science", label: "Skin Science" },
  { id: "moisture", label: "Moisture & Barrier" },
  { id: "reviews", label: "User Experience" },
  { id: "how-to-use", label: "How to Use" },
  { id: "rebirth", label: "Your First Birthday" },
  { id: "lineup", label: "Skincare Guide" },
];

/** 우측 챕터 레일 + 배경색 동기화 + 모바일 고정 CTA */
export default function Chrome() {
  const [active, setActive] = useState(0);
  const [showCta, setShowCta] = useState(false);
  useEffect(() => {
    const sections = CHAPTERS.map((c) => document.getElementById(c.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const i = sections.indexOf(e.target as HTMLElement);
        if (i >= 0) {
          setActive(i);
          const bg = (e.target as HTMLElement).dataset.bg;
          if (bg) document.documentElement.style.setProperty("--bg", bg);
          setShowCta(i >= 2 && i < CHAPTERS.length - 1);
        }
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  const go = (id: string) => {
    const el = document.getElementById(id); if (!el) return;
    const lenis = (window as Window & { __lenis?: { scrollTo: (t: HTMLElement, o?: object) => void } }).__lenis;
    if (lenis) lenis.scrollTo(el, { duration: 1.4 }); else el.scrollIntoView({ behavior: "smooth" });
  };
  const purchase = product.urls.purchase || "#how-to-use";
  return (
    <>
      <nav className="rail" aria-label="챕터">
        {CHAPTERS.map((c, i) => (
          <button key={c.id} className={`rail-dot ${i === active ? "on" : ""}`} onClick={() => go(c.id)} aria-label={`${i + 1}. ${c.label}`} aria-current={i === active ? "true" : undefined}>
            <span className="rail-label">{String(i + 1).padStart(2, "0")} · {c.label}</span>
          </button>
        ))}
      </nav>
      <div className={`sticky-cta ${showCta ? "show" : ""}`} aria-hidden={!showCta}>
        <div className="sticky-cta-text">{product.name} {product.volume.g} g<small>{product.subtitle}</small></div>
        <a className="btn btn-primary" href={purchase} target={product.urls.purchase ? "_blank" : undefined} rel="noopener" style={{ minHeight: 44 }}>{copy.s12.cta1.text}</a>
      </div>
      <style jsx global>{`
        .rail { position: fixed; right: max(14px, env(safe-area-inset-right, 0px)); top: 50%; transform: translateY(-50%); z-index: 40; display: grid; gap: 10px; }
        .rail-dot { position: relative; width: 20px; height: 20px; display: grid; place-items: center; padding: 0; }
        .rail-dot::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: rgba(198,161,106,.4); transition: all .4s; }
        .rail-dot.on::before { background: var(--gold-metal); box-shadow: 0 0 10px var(--gold-metal); transform: scale(1.4); }
        .rail-label { position: absolute; right: 26px; top: 50%; transform: translateY(-50%) translateX(6px); white-space: nowrap; font: 500 10px/1 var(--font-ui); letter-spacing: .22em; text-transform: uppercase; color: var(--gold-metal); opacity: 0; transition: all .3s; pointer-events: none; }
        .rail-dot:hover .rail-label, .rail-dot:focus-visible .rail-label { opacity: 1; transform: translateY(-50%) translateX(0); }
        @media (max-width: 767px) { .rail { display: none; } }
        .sticky-cta { position: fixed; left: 0; right: 0; bottom: 0; z-index: 45; display: none; grid-template-columns: 1fr auto; align-items: center; gap: 12px; padding: 12px max(16px, env(safe-area-inset-right, 0px)) calc(12px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px)); background: linear-gradient(180deg, rgba(8,7,6,0), rgba(8,7,6,.94) 35%); transform: translateY(100%); transition: transform .5s var(--ease-cinematic); }
        .sticky-cta.show { transform: translateY(0); }
        .sticky-cta-text { font-size: 13px; color: var(--ivory); line-height: 1.3; }
        .sticky-cta-text small { display: block; font: 400 10px/1.6 var(--font-ui); letter-spacing: .25em; color: var(--gold); }
        @media (max-width: 767px) { .sticky-cta { display: grid; } }
      `}</style>
    </>
  );
}
