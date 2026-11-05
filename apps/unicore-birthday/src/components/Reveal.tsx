"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAfterFirstPaint } from "@/features/scroll/afterFirstPaint";

gsap.registerPlugin(ScrollTrigger);

type Mode = "lines" | "chars" | "words" | "weight" | "depth";

/**
 * 텍스트 리빌. SSR 에서는 완전한 텍스트가 보이고, 클라이언트에서 진입 시 애니메이션합니다.
 * - lines: 라인 마스크 리빌  - chars: 캐릭터 Z축 전진  - words: 단어 단위  - weight: 가변 굵기 200→600  - depth: 블러+원근 전진
 */
export default function Reveal({ children, as: Tag = "div", mode = "lines", className, delay = 0, once = true, id, style }: { children: ReactNode; as?: keyof React.JSX.IntrinsicElements; mode?: Mode; className?: string; delay?: number; once?: boolean; id?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLElement>(null);
  const ready = useAfterFirstPaint();
  useEffect(() => {
    const el = ref.current; if (!el || !ready) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let targets: Element[] = [el];
    let from: gsap.TweenVars = { y: 24, opacity: 0 };
    let stagger = 0.08;
    if (mode === "chars" || mode === "words") {
      const text = el.textContent || "";
      // 중국어는 띄어쓰기가 없어 단어 모드도 글자 단위로 쪼개 줄바꿈을 허용
      const zh = document.documentElement.lang.toLowerCase().startsWith("zh");
      const units = mode === "chars" || zh ? Array.from(text) : text.split(/(\s+)/);
      el.textContent = "";
      units.forEach((u) => {
        const s = document.createElement("span");
        s.textContent = u;
        s.style.display = "inline-block";
        s.style.whiteSpace = "pre";
        s.style.willChange = "transform, opacity";
        el.appendChild(s);
      });
      targets = Array.from(el.children);
      from = mode === "chars" ? { z: 220, opacity: 0, rotateX: -18, transformPerspective: 900 } : { y: 30, opacity: 0, filter: "blur(6px)" };
      stagger = mode === "chars" ? 0.018 : 0.06;
    } else if (mode === "weight") {
      from = { opacity: 0, fontWeight: 200, filter: "blur(8px)", y: 10 };
    } else if (mode === "depth") {
      from = { opacity: 0, z: -300, filter: "blur(10px)", transformPerspective: 900 };
    }
    const tl = gsap.fromTo(targets, from, {
      y: 0, z: 0, opacity: 1, rotateX: 0, filter: "blur(0px)", fontWeight: mode === "weight" ? 600 : undefined,
      duration: 1.2, ease: "power3.out", stagger, delay, overwrite: true,
      scrollTrigger: { trigger: el, start: "top 85%", once, toggleActions: once ? "play none none none" : "play none none reverse" },
    });
    return () => { tl.scrollTrigger?.kill(); tl.kill(); };
  }, [mode, delay, once, ready]);
  const Comp = Tag as "div";
  return <Comp ref={ref as React.RefObject<HTMLDivElement>} id={id} className={className} style={{ transformStyle: "preserve-3d", ...style }}>{children}</Comp>;
}
