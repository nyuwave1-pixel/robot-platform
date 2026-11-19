"use client";
/**
 * 모션 기본 부품. 모두 '모션 최소화' 설정을 따르며, 그때는 즉시 최종 상태로 보인다.
 *  - SplitText: 글자 단위 상승 + 블러 해제 (키네틱 타이포)
 *  - Reveal: 화면에 들어올 때 블러·위치 해제
 *  - Magnetic: 포인터 쪽으로 살짝 끌려오는 버튼
 *  - Marquee: 무한 흐름 띠
 *  - useParallax: 마우스 위치 기반 패럴랙스 값
 */
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

export function SplitText({ text, className = "", delay = 0, stagger = 0.045, ease = [0.16, 1, 0.3, 1] as [number, number, number, number] }: { text: string; className?: string; delay?: number; stagger?: number; ease?: [number, number, number, number] }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  let i = 0;
  return (
    <span className={className} aria-label={text}>
      {words.map((w, wi) => (
        <span key={wi} aria-hidden className="inline-block whitespace-nowrap">
          {Array.from(w).map((ch) => {
            const k = i++;
            return (
              <span key={k} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span
                  className="inline-block"
                  initial={reduce ? false : { y: "110%", filter: "blur(8px)", opacity: 0 }}
                  animate={{ y: "0%", filter: "blur(0px)", opacity: 1 }}
                  transition={{ delay: delay + k * stagger, duration: 1.1, ease }}
                >
                  {ch}
                </motion.span>
              </span>
            );
          })}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

export function Reveal({ children, className = "", delay = 0, y = 28 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Magnetic({ children, className = "", strength = 0.25 }: { children: ReactNode; className?: string; strength?: number }) {
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 200, damping: 15 });
  const y = useSpring(0, { stiffness: 200, damping: 15 });
  return (
    <motion.div
      className={`inline-block ${className}`}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export function Marquee({ items, className = "", speed = 40 }: { items: string[]; className?: string; speed?: number }) {
  const reduce = useReducedMotion();
  const row = [...items, ...items];
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden>
      <motion.div className="flex w-max gap-12 whitespace-nowrap" animate={reduce ? undefined : { x: ["0%", "-50%"] }} transition={{ duration: speed, ease: "linear", repeat: Infinity }}>
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-12">
            {t}
            <span className="opacity-40">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/** 컨테이너 기준 마우스 위치(-0.5~0.5)를 부드럽게 따라가는 값 */
export function useParallax(): { ref: React.RefObject<HTMLDivElement | null>; px: MotionValue<number>; py: MotionValue<number> } {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 60, damping: 20 });
  const py = useSpring(my, { stiffness: 60, damping: 20 });
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    const on = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width - 0.5);
      my.set((e.clientY - r.top) / r.height - 0.5);
    };
    el.addEventListener("pointermove", on);
    return () => el.removeEventListener("pointermove", on);
  }, [mx, my, reduce]);
  return { ref, px, py };
}

export function useShift(v: MotionValue<number>, range: number) {
  return useTransform(v, [-0.5, 0.5], [-range, range]);
}
