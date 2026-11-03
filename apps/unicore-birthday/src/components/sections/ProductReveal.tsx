"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { copy } from "@/data/copy";
import { product } from "@/data/product";
import { stills } from "@/data/videos";
import { hasWebGL, useReducedMotion } from "@/lib/env";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import s from "./sections.module.css";

const ProductInspector = dynamic(() => import("@/features/scenes/ProductInspector"), { ssr: false, loading: () => null });

export default function ProductReveal() {
  const pin = useRef<HTMLElement>(null);
  const [webgl, setWebgl] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [visibleHot, setVisibleHot] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => { setWebgl(hasWebGL()); }, []);
  useSectionProgress(pin, (p) => {
    if (!mounted && p > 0) setMounted(true);
    setVisibleHot(p < 0.2 ? 0 : p < 0.35 ? 1 : p < 0.5 ? 2 : 3);
  });
  useEffect(() => {
    // 섹션 진입 전 미리 마운트 (500px 전)
    const el = pin.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setMounted(true); }, { rootMargin: "500px 0px" });
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <section id="product" ref={pin} className={s.pin} style={{ height: "400svh" }} data-bg="#17110F" aria-labelledby="h-product">
      <div className={s.stage}>
        <div className={s.bgStill} style={{ backgroundImage: `url(${stills.lidClean})`, opacity: 0.25, filter: "blur(18px) saturate(.8)", transform: "scale(1.1)" }} aria-hidden="true" />
        <div className="veil-soft" />
        <h2 id="h-product" className="sr-only">{product.brand} {product.name} — 제품 살펴보기</h2>
        {webgl && mounted && !reduced ? (
          <ProductInspector className={s.inspector} hint={copy.s03.hint.text} openLabel={copy.s03.openLid.text} resetLabel={copy.s03.reset.text} />
        ) : (
          <div className={s.fallbackJar} style={{ backgroundImage: `url(${product.images.openBox})` }} role="img" aria-label={`${product.name} 용기`} />
        )}
        <ul className={s.hotspots} aria-label="제품 포인트">
          {copy.s03.hotspots.map((h, i) => (
            <li key={h.title} className={s.hotspot} style={{ opacity: i < visibleHot ? 1 : 0, transform: `translateX(${i < visibleHot ? 0 : -12}px)`, transition: "opacity .8s var(--ease-cinematic), transform .8s var(--ease-cinematic)" }}>
              <i aria-hidden="true" />
              <div><b>{h.title}</b><small>{h.desc}</small></div>
            </li>
          ))}
        </ul>
        <span className={s.chap}>03 / 13 · PRODUCT REVEAL · {product.volume.g} g / {product.volume.oz} oz</span>
      </div>
    </section>
  );
}
