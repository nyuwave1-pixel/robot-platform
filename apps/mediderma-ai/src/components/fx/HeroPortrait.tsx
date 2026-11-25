"use client";
/**
 * 첫 화면 인물 사진 (정아름 님 · 본인/소속사 사용 동의 확인).
 * 배경을 분리한 사진에 아주 느린 부유 모션과 포인터 기울기, 아래쪽 페이드를 준다. 3D 렌더가 아니다.
 */
import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, type PointerEvent } from "react";

export const PORTRAIT_SRC = "/brand/hero-portrait.webp";
/** 화면 폭에 맞는 크기만 내려받도록 (모바일 26KB · 태블릿 51KB · PC 원본) */
const SRCSET = "/brand/hero-portrait-480.webp 480w, /brand/hero-portrait-720.webp 720w, /brand/hero-portrait.webp 1100w";
const SIZES = "(min-width: 1024px) 560px, (min-width: 640px) 448px, 320px";

/** priority: 첫 화면(LCP) 이미지 — 먼저 받고, 처음부터 보이게 그린다 */
/** 아래쪽 페이드 — 사파리는 -webkit- 접두사가 필요하다 */
const FADE = "linear-gradient(#000 78%, transparent 99%)";

export default function HeroPortrait({ className = "", alt, priority = false }: { className?: string; alt: string; priority?: boolean }) {
  const reduce = useReducedMotion();
  // 마우스 같은 정밀 포인터가 있는 기기에서만 기울기 효과
  const [fine, setFine] = useState(false);
  useEffect(() => setFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches), []);
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
    // 둥실거림·기울기는 마우스가 있는 기기에서만 (아이폰 사파리는 필터·마스크·3D 변환이 겹치면 사진이 떨리고 깨져 보인다)
    <div className={`hero-float relative aspect-square w-full [backface-visibility:hidden] [transform:translateZ(0)] [@media(hover:hover)]:[perspective:1200px] ${className}`} onPointerMove={onMove} onPointerLeave={() => { mx.set(0); my.set(0); }}>
      {/* 사진 뒤의 은은한 빛 (사진 자체에 필터를 걸지 않는다) */}
      <div aria-hidden className="absolute inset-[12%] rounded-full bg-scan/25 blur-3xl" />
      {/* 둥실거림은 CSS 애니메이션(GPU 합성)으로 — JS 가 매 프레임 돌지 않게 */}
      <m.div style={reduce || !fine ? undefined : { rotateX: rx, rotateY: ry }} className="relative h-full w-full">
        <m.img
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
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduce ? 0.6 : 0.9 }}
          className="h-full w-full object-contain"
          style={{ WebkitMaskImage: FADE, maskImage: FADE }}
        />
      </m.div>
    </div>
  );
}
