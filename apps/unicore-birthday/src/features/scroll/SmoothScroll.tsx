"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAfterFirstPaint } from "./afterFirstPaint";

gsap.registerPlugin(ScrollTrigger);

/** Lenis 스무스 스크롤 + GSAP ScrollTrigger 동기화. 인트로가 열려 있는 동안은 스크롤을 잠급니다. */
export default function SmoothScroll({ locked }: { locked: boolean }) {
  const ready = useAfterFirstPaint();
  useEffect(() => {
    if (!ready) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = new Lenis({ lerp: reduced ? 1 : 0.09, smoothWheel: !reduced, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    (window as Window & { __lenis?: Lenis }).__lenis = lenis;
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      delete (window as Window & { __lenis?: Lenis }).__lenis;
    };
  }, [ready]);

  useEffect(() => {
    // Lenis 생성 전(첫 페인트 전)에도 인트로 동안 스크롤은 잠근다
    if (locked) document.documentElement.style.overflow = "hidden";
    const lenis = (window as Window & { __lenis?: Lenis }).__lenis;
    if (!lenis) return;
    if (locked) {
      lenis.stop();
      document.documentElement.style.overflow = "hidden";
    } else {
      lenis.start();
      document.documentElement.style.overflow = "";
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  }, [locked, ready]);

  return null;
}
