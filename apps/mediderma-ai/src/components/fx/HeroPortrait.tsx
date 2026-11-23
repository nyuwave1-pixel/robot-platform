"use client";
/**
 * 첫 화면 인물 사진 (정아름 님 · 본인/소속사 사용 동의 확인).
 * 배경을 분리한 사진에 아주 느린 부유 모션과 포인터 기울기, 아래쪽 페이드를 준다. 3D 렌더가 아니다.
 */
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { PointerEvent } from "react";

export const PORTRAIT_SRC = "/brand/hero-portrait.webp";
/** 화면 폭에 맞는 크기만 내려받도록 (모바일 26KB · 태블릿 51KB · PC 원본) */
const SRCSET = "/brand/hero-portrait-480.webp 480w, /brand/hero-portrait-720.webp 720w, /brand/hero-portrait.webp 1100w";
const SIZES = "(min-width: 1024px) 560px, (min-width: 640px) 448px, 320px";

/** priority: 첫 화면(LCP) 이미지 — 먼저 받고, 처음부터 보이게 그린다 */
export default function HeroPortrait({ className = "", alt, priority = false }: { className?: string; alt: string; priority?: boolean }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), { stiffness: 80, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), { stiffness: 80, damping: 18 });
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  return (
    <div className={`relative aspect-square w-full [perspective:1200px] ${className}`} onPointerMove={onMove} onPointerLeave={() => { mx.set(0); my.set(0); }}>
      <div aria-hidden className="absolute inset-[12%] rounded-full bg-scan/25 blur-3xl" />
      <motion.div style={reduce ? undefined : { rotateX: rx, rotateY: ry }} className="relative h-full w-full">
        <motion.img
          src={PORTRAIT_SRC}
          srcSet={SRCSET}
          sizes={SIZES}
          width={1100}
          height={1100}
          alt={alt}
          data-testid={priority ? "hero-portrait" : undefined}
          decoding="async"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          // 첫 화면 사진은 투명에서 시작하지 않는다 (JS 가 늦게 실행돼도 바로 보이도록)
          initial={priority ? { opacity: 1, y: 12, scale: 0.99 } : { opacity: 0, y: 24, scale: 0.98 }}
          animate={reduce ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: [0, -8, 0], scale: 1 }}
          transition={reduce ? { duration: 0.6 } : { opacity: { duration: 0.9 }, scale: { duration: 0.9 }, y: { duration: 7, repeat: Infinity, ease: "easeInOut" } }}
          className="h-full w-full object-contain [filter:drop-shadow(0_0_28px_rgba(79,182,255,0.35))] [mask-image:linear-gradient(#000_78%,transparent_99%)]"
        />
      </motion.div>
    </div>
  );
}
