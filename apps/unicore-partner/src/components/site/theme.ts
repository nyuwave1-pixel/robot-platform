import type { Design } from "@/lib/types";

/** 디자인 엔진별 독립 토큰: 색·글꼴·모션 성격·레이아웃 규칙 */
export interface Theme {
  id: Design;
  label: string;
  desc: string;
  root: string; // 페이지 바탕
  text: string;
  sub: string;
  accent: string; // 강조 글자색
  accentBg: string; // 주 버튼
  ghost: string; // 보조 버튼
  hairline: string; // 구분선
  card: string; // 카드
  productCard: string; // 공식 제품 카드 (제품 원본 이미지가 흰 배경이므로 항상 밝은 면)
  displayFont: string;
  eyebrow: string;
  motion: { ease: [number, number, number, number]; dur: number; stagger: number };
}

export const THEMES: Record<Design, Theme> = {
  luxury_black: {
    id: "luxury_black",
    label: "Luxury Black",
    desc: "블랙 × 샴페인 골드 · 시네마틱",
    root: "bg-onyx",
    text: "text-[#f5f1e8]",
    sub: "text-[#a7a294]",
    accent: "text-gold",
    accentBg: "bg-gradient-to-r from-gold to-gold2 text-onyx",
    ghost: "border border-gold/40 text-gold2 hover:bg-gold/10",
    hairline: "border-gold/15",
    card: "bg-coal/80 border border-gold/10",
    productCard: "bg-[#fbfaf7]",
    displayFont: "font-serif",
    eyebrow: "text-gold/80 tracking-[0.4em]",
    motion: { ease: [0.16, 1, 0.3, 1], dur: 1.2, stagger: 0.045 },
  },
  premium_white: {
    id: "premium_white",
    label: "Premium White",
    desc: "화이트 스튜디오 · 미니멀 · 제품 중심",
    root: "bg-bone",
    text: "text-graphite",
    sub: "text-[#6e6a63]",
    accent: "text-graphite",
    accentBg: "bg-graphite text-bone",
    ghost: "border border-graphite/25 text-graphite hover:bg-graphite/5",
    hairline: "border-graphite/10",
    card: "bg-white border border-graphite/[0.07]",
    productCard: "bg-white",
    displayFont: "font-display",
    eyebrow: "text-[#8a857c] tracking-[0.35em]",
    motion: { ease: [0.65, 0, 0.35, 1], dur: 1.0, stagger: 0.03 },
  },
};
