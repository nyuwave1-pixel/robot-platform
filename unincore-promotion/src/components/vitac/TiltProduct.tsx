"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/perf";

/**
 * 2.5D product inspection: drag (mouse or touch) to turn the official product
 * photo up to ±28° in 3D space; it eases back when released. The photo itself is
 * never warped, so the packaging, logo and label stay exactly as printed.
 * Keyboard: focus and use the arrow keys.
 */
export function TiltProduct({
  src,
  alt,
  priority = false,
  sizes = "(max-width: 768px) 80vw, 480px",
  className = "",
  glow = "rgba(233,185,77,.35)",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  glow?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = wrap.current;
    const c = card.current;
    if (!w || !c || prefersReducedMotion()) return;
    let rx = 0, ry = 0, tx = 0, ty = 0;
    let dragging = false;
    let lastX = 0, lastY = 0;
    let raf = 0;
    const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
    const apply = () => {
      rx += (tx - rx) * 0.12;
      ry += (ty - ry) * 0.12;
      c.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      c.style.setProperty("--shine", `${50 + ry * 1.4}%`);
      if (!dragging) {
        tx *= 0.94;
        ty *= 0.94;
      }
      if (Math.abs(rx - tx) > 0.01 || Math.abs(ry - ty) > 0.01 || Math.abs(tx) > 0.05 || Math.abs(ty) > 0.05) raf = requestAnimationFrame(apply);
      else raf = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      w.setPointerCapture(e.pointerId);
      w.dataset.dragging = "1";
    };
    const move = (e: PointerEvent) => {
      if (dragging) {
        ty = clamp(ty + (e.clientX - lastX) * 0.35, 28);
        tx = clamp(tx - (e.clientY - lastY) * 0.25, 16);
        lastX = e.clientX;
        lastY = e.clientY;
      } else if (e.pointerType === "mouse") {
        const r = w.getBoundingClientRect();
        ty = ((e.clientX - r.left) / r.width - 0.5) * 14;
        tx = -((e.clientY - r.top) / r.height - 0.5) * 10;
      }
      kick();
    };
    const up = () => {
      dragging = false;
      delete w.dataset.dragging;
      kick();
    };
    const leave = () => {
      if (!dragging) {
        tx = 0;
        ty = 0;
        kick();
      }
    };
    const key = (e: KeyboardEvent) => {
      const step = 8;
      if (e.key === "ArrowLeft") ty = clamp(ty - step, 28);
      else if (e.key === "ArrowRight") ty = clamp(ty + step, 28);
      else if (e.key === "ArrowUp") tx = clamp(tx + step, 16);
      else if (e.key === "ArrowDown") tx = clamp(tx - step, 16);
      else return;
      e.preventDefault();
      kick();
    };
    w.addEventListener("pointerdown", down);
    w.addEventListener("pointermove", move);
    w.addEventListener("pointerup", up);
    w.addEventListener("pointercancel", up);
    w.addEventListener("pointerleave", leave);
    w.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(raf);
      w.removeEventListener("pointerdown", down);
      w.removeEventListener("pointermove", move);
      w.removeEventListener("pointerup", up);
      w.removeEventListener("pointercancel", up);
      w.removeEventListener("pointerleave", leave);
      w.removeEventListener("keydown", key);
    };
  }, []);

  return (
    <div
      ref={wrap}
      className={`vc-tilt group relative select-none [perspective:1100px] ${className}`}
      tabIndex={0}
      role="img"
      aria-label={`${alt}. Drag or use the arrow keys to turn the product.`}
      style={{ touchAction: "pan-y" }}
    >
      <div className="absolute inset-[8%] rounded-full blur-3xl" style={{ background: glow }} aria-hidden />
      <div ref={card} className="vc-tilt-card relative aspect-[4/5] overflow-hidden rounded-[12%] shadow-[0_40px_80px_-40px_rgba(10,6,2,.7)] [transform-style:preserve-3d] will-change-transform">
        <Image src={src} alt="" fill priority={priority} sizes={sizes} className="object-cover" draggable={false} />
        <div className="vc-tilt-shine pointer-events-none absolute inset-0" aria-hidden />
      </div>
      <p className="mt-4 text-center text-[10px] font-semibold uppercase tracking-[0.28em] opacity-60 transition group-focus-visible:opacity-100" aria-hidden>
        Drag to turn
      </p>
    </div>
  );
}
