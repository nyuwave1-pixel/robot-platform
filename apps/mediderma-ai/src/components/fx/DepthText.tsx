"use client";
/**
 * 입체 헤딩 — 글자별 3D 등장(원근 회전) + 압출 깊이 레이어 + 강조어 발광 그라디언트.
 * 모든 언어(한글·한자·키릴 등)에 동작하도록 웹폰트 글리프를 CSS 3D 로 입체화한다.
 */
import { motion, useReducedMotion } from "framer-motion";
import { createElement } from "react";

const seg = (s: string): string[] => {
  try {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s), (x) => x.segment);
  } catch {
    return Array.from(s);
  }
};

export default function DepthText({ text, as = "h2", className = "", accent = "last", size = "lg" }: {
  text: string; as?: "h1" | "h2" | "h3" | "p"; className?: string;
  /** 강조할 단어: 마지막 단어 / 첫 단어 / 없음 / 전체 */
  accent?: "last" | "first" | "none" | "all";
  size?: "md" | "lg" | "xl";
}) {
  const reduce = useReducedMotion();
  const words = text.split(/(\s+)/).filter((w) => w.length);
  const real = words.filter((w) => w.trim());
  // 띄어쓰기가 없는 언어(일본어·중국어)는 뒤쪽 1/3 을 강조한다
  const single = real.length === 1;
  let ci = 0;
  const total = seg(text.replace(/\s/g, "")).length;
  const content = words.map((w, wi) => {
    if (!w.trim()) return " ";
    const idx = real.indexOf(w, 0);
    const isAcc = accent === "all" || (!single && ((accent === "last" && w === real[real.length - 1] && idx >= 0) || (accent === "first" && w === real[0])));
    return (
      <span key={wi} className="inline-block whitespace-nowrap">
        {seg(w).map((ch, k) => {
          const i = ci++;
          const acc = isAcc || (single && accent !== "none" && i >= Math.floor(total * 0.62));
          return (
            <motion.span
              key={k}
              data-ch={ch}
              className={`depth-ch ${acc ? "depth-acc" : ""}`}
              variants={{ hidden: { opacity: 0, y: "0.55em", rotateX: -85, z: -60 }, show: { opacity: 1, y: 0, rotateX: 0, z: 0 } }}
              transition={reduce ? { duration: 0 } : { duration: 0.75, delay: Math.min(i * 0.028, 0.9), ease: [0.2, 0.75, 0.2, 1] }}
            >
              {ch}
            </motion.span>
          );
        })}
      </span>
    );
  });
  return createElement(
    motion[as],
    { className: `depth-text depth-${size} ${className}`, "aria-label": text, initial: "hidden", whileInView: "show", viewport: { once: true, margin: "-60px" } },
    <span aria-hidden className="contents">{content}</span>,
  );
}
