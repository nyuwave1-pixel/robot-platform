"use client";

import { useEffect, useRef } from "react";
import { renderTier } from "@/lib/perf";
import type { ShaderName } from "./shaders";

/**
 * A WebGL layer (three.js) that fills its parent. three.js and the shader source
 * are loaded only when the stage comes near the viewport, rendering pauses while
 * it is off screen, and GPU resources are released on unmount.
 *
 * On the "low" tier (reduced motion, data saver, no WebGL, weak device) nothing
 * is rendered and the section's own photography/CSS carries the scene.
 *
 * `progressFrom` names an element whose scroll progress (0 → 1 while it passes
 * through the viewport) drives uProgress; it defaults to the stage's parent.
 */
let gateDone = false;
let idleScheduled = false;
/** Desktop fallback: start the effects after a few idle seconds even without interaction. */
function scheduleIdleGate() {
  if (idleScheduled || typeof window === "undefined") return;
  idleScheduled = true;
  const mark = () => (gateDone = true);
  ["pointerdown", "pointermove", "wheel", "touchstart", "scroll", "keydown"].forEach((e) => window.addEventListener(e, mark, { passive: true, once: true }));
  if (window.matchMedia("(pointer: coarse)").matches) return; // touch devices scroll right away
  window.setTimeout(() => {
    gateDone = true;
    window.dispatchEvent(new Event("uc-fx-ready"));
  }, 6000);
}

export function ShaderStage({ shader, className = "", progressFrom }: { shader: ShaderName; className?: string; progressFrom?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const tier = renderTier();
    if (tier === "low") return;

    let disposed = false;
    let cleanup = () => {};
    let started = false;

    const start = async () => {
      if (started) return;
      started = true;
      const THREE = await import("three");
      const { SHADERS, VERTEX } = await import("./shaders");
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "high-performance" });
      const dpr = Math.min(window.devicePixelRatio || 1, tier === "high" ? 1.75 : 1);
      renderer.setPixelRatio(tier === "high" ? dpr : dpr * 0.75);
      renderer.setClearColor(0x000000, 0);
      const canvas = renderer.domElement;
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;opacity:0;transition:opacity 1.2s ease";
      el.appendChild(canvas);

      const uniforms = {
        uTime: { value: 0 },
        uRes: { value: new THREE.Vector2(1, 1) },
        uProgress: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uDensity: { value: tier === "high" ? 1 : 0.55 },
      };
      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: SHADERS[shader],
        uniforms,
        transparent: true,
        premultipliedAlpha: true,
        depthTest: false,
        depthWrite: false,
      });
      const geometry = new THREE.PlaneGeometry(2, 2);
      const scene = new THREE.Scene();
      scene.add(new THREE.Mesh(geometry, material));
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const resize = () => {
        const w = el.clientWidth || 1;
        const h = el.clientHeight || 1;
        renderer.setSize(w, h, false);
        uniforms.uRes.value.set(w, h);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      const target = new THREE.Vector2();
      const onPointer = (e: PointerEvent) => {
        target.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      const progressEl = (progressFrom && document.querySelector(progressFrom)) || el.parentElement || el;
      let visible = true;
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) loop();
      }, { rootMargin: "120px" });
      io.observe(el);

      let raf = 0;
      const t0 = performance.now();
      const loop = () => {
        cancelAnimationFrame(raf);
        if (!visible || disposed) return;
        raf = requestAnimationFrame(loop);
        const r = progressEl.getBoundingClientRect();
        const vh = window.innerHeight;
        uniforms.uProgress.value = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        uniforms.uPointer.value.lerp(target, 0.05);
        uniforms.uTime.value = (performance.now() - t0) / 1000;
        renderer.render(scene, camera);
      };
      loop();
      requestAnimationFrame(() => (canvas.style.opacity = "1"));

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("pointermove", onPointer);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
      };
    };

    // Load three.js only when the stage is about to be seen — and never during the
    // initial page load: wait for the visitor's first interaction (or, on desktop,
    // a few idle seconds) so the first paint and the Amazon buttons stay fast.
    let near: IntersectionObserver | null = null;
    const arm = () => {
      if (near || disposed) return;
      near = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          near?.disconnect();
          start();
        }
      }, { rootMargin: "400px" });
      near.observe(el);
    };
    const events = ["pointerdown", "pointermove", "wheel", "touchstart", "scroll", "keydown"] as const;
    const onFirst = () => {
      events.forEach((e) => window.removeEventListener(e, onFirst));
      arm();
    };
    if (gateDone) arm();
    else {
      events.forEach((e) => window.addEventListener(e, onFirst, { passive: true, once: true }));
      window.addEventListener("uc-fx-ready", onFirst, { once: true });
      scheduleIdleGate();
    }

    return () => {
      disposed = true;
      events.forEach((e) => window.removeEventListener(e, onFirst));
      window.removeEventListener("uc-fx-ready", onFirst);
      near?.disconnect();
      cleanup();
    };
  }, [shader, progressFrom]);

  return <div ref={host} className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden />;
}
