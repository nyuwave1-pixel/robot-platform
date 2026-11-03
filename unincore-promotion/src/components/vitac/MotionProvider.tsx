"use client";

import { useEffect } from "react";
import { prefersReducedMotion, renderTier } from "@/lib/perf";

/**
 * Scroll choreography for the VITA C home page (GSAP ScrollTrigger + Lenis).
 * Everything is opt-in through data attributes, so the markup stays readable
 * and the page is complete without JavaScript:
 *
 *   [data-hscroll] / [data-hscroll-track]  pinned horizontal ritual (desktop)
 *   [data-words]                            words light up as you scroll
 *   [data-parallax="0.2"]                   vertical parallax (fraction of height)
 *   [data-zoom]                             big typography scales in with scroll
 *   [data-magnetic]                         buttons lean toward the cursor (desktop)
 *
 * Scrubbed animations are tied to scroll position, so they stop exactly where
 * the visitor stops. Reduced motion disables all of it.
 */
export function MotionProvider() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let cancelled = false;
    let teardown = () => {};

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      // Smooth scrolling only for precise pointers on capable devices; touch keeps native scrolling.
      let lenis: import("lenis").default | null = null;
      let tick: ((t: number) => void) | null = null;
      if (renderTier() === "high" && window.matchMedia("(pointer: fine)").matches) {
        const { default: Lenis } = await import("lenis");
        if (cancelled) return;
        const instance = new Lenis({ lerp: 0.1, anchors: true });
        instance.on("scroll", ScrollTrigger.update);
        lenis = instance;
        tick = (t: number) => lenis?.raf(t * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      }

      const mm = gsap.matchMedia();

      // Pinned horizontal ritual (desktop only; mobile keeps a vertical stack).
      mm.add("(min-width: 1024px)", () => {
        document.querySelectorAll<HTMLElement>("[data-hscroll]").forEach((section) => {
          const track = section.querySelector<HTMLElement>("[data-hscroll-track]");
          if (!track) return;
          const distance = () => Math.max(0, track.scrollWidth - section.clientWidth);
          gsap.to(track, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 0.6,
              invalidateOnRefresh: true,
              onUpdate: (st) => section.style.setProperty("--progress", st.progress.toFixed(3)),
            },
          });
        });
      });

      mm.add("(min-width: 0px)", () => {
        // Word-by-word reveal.
        document.querySelectorAll<HTMLElement>("[data-words]").forEach((el) => {
          gsap.fromTo(
            el.querySelectorAll(".vc-word"),
            { opacity: 0.14 },
            { opacity: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 45%", scrub: true } },
          );
        });

        document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
          const amt = parseFloat(el.dataset.parallax || "0.15");
          gsap.fromTo(el, { yPercent: amt * 100 }, { yPercent: -amt * 100, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
        });

        document.querySelectorAll<HTMLElement>("[data-zoom]").forEach((el) => {
          gsap.fromTo(
            el,
            { scale: 0.62, rotateX: 28, opacity: 0.2 },
            { scale: 1, rotateX: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: el.closest("section") || el, start: "top 80%", end: "top 10%", scrub: true } },
          );
        });
      });

      // Magnetic buttons (desktop, precise pointer).
      const magnets: Array<() => void> = [];
      if (window.matchMedia("(pointer: fine)").matches) {
        document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((btn) => {
          const xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3" });
          const yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3" });
          const move = (e: PointerEvent) => {
            const r = btn.getBoundingClientRect();
            xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
            yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
          };
          const leave = () => {
            xTo(0);
            yTo(0);
          };
          btn.addEventListener("pointermove", move);
          btn.addEventListener("pointerleave", leave);
          magnets.push(() => {
            btn.removeEventListener("pointermove", move);
            btn.removeEventListener("pointerleave", leave);
          });
        });
      }

      // Images and fonts change layout after load; recompute pinned distances once settled.
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);

      teardown = () => {
        window.removeEventListener("load", refresh);
        magnets.forEach((off) => off());
        mm.revert();
        if (tick) gsap.ticker.remove(tick);
        lenis?.destroy();
      };
    })();

    return () => {
      cancelled = true;
      teardown();
    };
  }, []);

  return null;
}
