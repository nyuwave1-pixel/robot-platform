"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { copy } from "@/data/copy";
import { product } from "@/data/product";
import { detail, productLoop } from "@/data/images";
import { hasWebGL, useReducedMotion } from "@/lib/env";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import s from "./sections.module.css";

const ProductInspector = dynamic(() => import("@/features/scenes/ProductInspector"), { ssr: false, loading: () => null });

/** 제품 리빌 — 기본은 상세페이지 실제 제품 사진(스톤 위 용기), 선택 시 3D 인스펙터 */
export default function ProductReveal() {
  const pin = useRef<HTMLElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const [webgl, setWebgl] = useState(true);
  const [mode, setMode] = useState<"photo" | "3d">("photo");
  const [visibleHot, setVisibleHot] = useState(0);
  const [videoOk, setVideoOk] = useState(true);
  const video = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => { setWebgl(hasWebGL()); }, []);
  useEffect(() => {
    const v = video.current; if (!v) return;
    v.muted = true; v.defaultMuted = true;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.1 });
    io.observe(v); return () => io.disconnect();
  }, [videoOk, mode]);
  useSectionProgress(pin, (p) => {
    setVisibleHot(p < 0.2 ? 0 : p < 0.35 ? 1 : p < 0.5 ? 2 : 3);
    const el = photo.current; if (el) el.style.transform = `scale(${1.06 - Math.min(p, 0.6) * 0.06}) translateY(${(0.5 - p) * 16}px)`;
  });
  const show3d = mode === "3d" && webgl && !reduced;
  return (
    <section id="product" ref={pin} className={s.pin} style={{ height: "400svh" }} data-bg="#17110F" aria-labelledby="h-product">
      <div className={s.stage} style={{ background: "#120d0a" }}>
        <h2 id="h-product" className="sr-only">{product.brand} {product.name} — 제품 살펴보기</h2>
        {show3d ? (
          <ProductInspector className={s.inspector} hint={copy.s03.hint.text} openLabel={copy.s03.openLid.text} resetLabel={copy.s03.reset.text} />
        ) : videoOk ? (
          <div ref={photo} className={s.productPhoto} role="img" aria-label={`${product.brand} ${product.name} 용기`}>
            <video ref={video} className={s.productVideo} poster={productLoop.poster} playsInline muted preload="auto" onError={() => setVideoOk(false)} aria-hidden="true">
              <source src={productLoop.src} type="video/mp4" />
            </video>
          </div>
        ) : (
          <div ref={photo} className={s.productPhoto} style={{ backgroundImage: `url(${detail.jarStone})` }} role="img" aria-label={`${product.brand} ${product.name} 용기`} />
        )}
        <div className={s.productVeil} aria-hidden="true" />
        <ul className={s.hotspots} aria-label="제품 포인트">
          {copy.s03.hotspots.map((h, i) => (
            <li key={h.title} className={s.hotspot} style={{ opacity: i < visibleHot ? 1 : 0, transform: `translateX(${i < visibleHot ? 0 : -12}px)`, transition: "opacity .8s var(--ease-cinematic), transform .8s var(--ease-cinematic)" }}>
              <i aria-hidden="true" />
              <div><b>{h.title}</b><small>{h.desc}</small></div>
            </li>
          ))}
        </ul>
        {webgl && !reduced && (
          <button type="button" className={s.modeBtn} onClick={() => setMode((m) => (m === "photo" ? "3d" : "photo"))} aria-pressed={mode === "3d"}>
            {mode === "photo" ? "3D VIEW" : "PHOTO"}
          </button>
        )}
        <span className={s.chap}>03 / 13 · PRODUCT REVEAL · {product.volume.g} g / {product.volume.oz} oz</span>
      </div>
    </section>
  );
}
