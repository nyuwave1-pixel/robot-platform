"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { product } from "@/data/product";
import { detail, productLoop } from "@/data/images";
import { hasWebGL, useReducedMotion } from "@/lib/env";
import { useSectionProgress } from "@/features/scroll/useSectionProgress";
import { useNearViewport } from "@/features/video/useNearViewport";
import s from "./sections.module.css";
import { useDict } from "@/i18n/context";

const ProductInspector = dynamic(() => import("@/features/scenes/ProductInspector"), { ssr: false, loading: () => null });

/** 제품 리빌 — 기본은 상세페이지 실제 제품 사진(스톤 위 용기), 선택 시 3D 인스펙터 */
export default function ProductReveal() {
  const t = useDict();
  const pin = useRef<HTMLElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const [webgl, setWebgl] = useState(true);
  const [mode, setMode] = useState<"photo" | "3d">("photo");
  const [visibleHot, setVisibleHot] = useState(0);
  const [videoOk, setVideoOk] = useState(true);
  const video = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const near = useNearViewport(pin);
  useEffect(() => { const v = video.current; if (v && near && v.preload !== "auto") { v.preload = "auto"; v.load(); } }, [near, videoOk, mode]);
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
        <h2 id="h-product" className="sr-only">{product.brand} {product.name} — {t.ui.productExplore}</h2>
        {show3d ? (
          <ProductInspector className={s.inspector} hint={t.copy.s03.hint} openLabel={t.copy.s03.openLid} resetLabel={t.copy.s03.reset} ariaLabel={t.ui.inspectorHint} zoomInLabel={t.ui.zoomIn} zoomOutLabel={t.ui.zoomOut} />
        ) : videoOk ? (
          <div ref={photo} className={s.productPhoto} role="img" aria-label={`${product.brand} ${product.name} ${t.ui.productJar}`}>
            <video ref={video} className={s.productVideo} poster={productLoop.poster} playsInline muted preload="metadata" onError={() => setVideoOk(false)} aria-hidden="true">
              <source src={productLoop.src} type="video/mp4" />
            </video>
          </div>
        ) : (
          <div ref={photo} className={s.productPhoto} style={{ backgroundImage: `url(${detail.jarStone})` }} role="img" aria-label={`${product.brand} ${product.name} ${t.ui.productJar}`} />
        )}
        <div className={s.productVeil} aria-hidden="true" />
        <ul className={s.hotspots} aria-label={t.ui.productPoints}>
          {t.copy.s03.hotspots.map((h, i) => (
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
