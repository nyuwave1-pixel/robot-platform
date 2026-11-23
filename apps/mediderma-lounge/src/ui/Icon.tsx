/**
 * 직접 그린 SVG 아이콘 세트. 이모지는 OS·브라우저마다 모양이 달라 게임 아트로 쓰지 않는다.
 * 모두 24x24, stroke=currentColor 기반이라 글자색을 따라간다. 재화 아이콘만 고유색을 가진다.
 */
import type { ReactNode } from "react";

type P = { className?: string };
const S = ({ children, className = "", fill = "none" }: { children: ReactNode; className?: string; fill?: string }) => (
  <svg viewBox="0 0 24 24" className={`inline-block h-[1.15em] w-[1.15em] shrink-0 align-[-0.18em] ${className}`} fill={fill} stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const PATHS: Record<string, ReactNode> = {
  character: <><circle cx="12" cy="9" r="4.5" /><path d="M7.5 8.5c0-3 2-5 4.5-5s4.5 2 4.5 5" /><path d="M5 21c.6-4 3.4-6 7-6s6.400 2 7 6" /><path d="M15.500 3.800l2.300-1.300.2 2.600" /></>,
  lounge: <><path d="M3 10l9-6 9 6" /><path d="M5 10v9M19 10v9M9.500 19v-5h5v5" /><path d="M3 19h18" /></>,
  sparkle: <><path d="M12 3l1.900 5.100L19 10l-5.100 1.900L12 17l-1.900-5.100L5 10l5.100-1.900z" /><path d="M19 15l.8 2.200L22 18l-2.200.8L19 21l-.8-2.200L16 18l2.200-.8z" /></>,
  bottle: <><path d="M10 3h4v3h-4z" /><path d="M9 6h6l1.500 3.500V19a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2V9.500z" /><path d="M9.500 13h5" /></>,
  chat: <><path d="M4 5h16v11H10l-4.500 4v-4H4z" /><path d="M8.500 10.500h.01M12 10.500h.01M15.500 10.500h.01" /></>,
  quest: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9z" /><path d="M8.500 12l2 2 4-4" /></>,
  profile: <><circle cx="12" cy="8.500" r="4" /><path d="M4.500 21c.8-4 3.800-6 7.500-6s6.700 2 7.500 6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M5.300 18.700l2.100-2.100M16.600 7.400l2.100-2.100" /></>,
  target: <><circle cx="12" cy="12" r="8.500" /><circle cx="12" cy="12" r="4.500" /><circle cx="12" cy="12" r="1" /></>,
  camera: <><path d="M4 8h3.500l1.500-2.500h6L16.500 8H20v11H4z" /><circle cx="12" cy="13" r="3.500" /></>,
  sofa: <><path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" /><path d="M3 12.500a2 2 0 0 1 4 0V15h10v-2.500a2 2 0 0 1 4 0V18H3z" /><path d="M6 18v2M18 18v2" /></>,
  box: <><path d="M3.500 8l8.500-4 8.500 4v8.500L12 20.500l-8.500-4z" /><path d="M3.500 8l8.500 4 8.500-4M12 12v8.500" /></>,
  shop: <><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6.500a3 3 0 0 1 6 0V8" /></>,
  lock: <><rect x="5.500" y="10.500" width="13" height="9.500" rx="2" /><path d="M8.500 10.500V8a3.500 3.500 0 0 1 7 0v2.500" /></>,
  unlock: <><rect x="5.500" y="10.500" width="13" height="9.500" rx="2" /><path d="M8.500 10.500V8a3.500 3.500 0 0 1 6.700-1.400" /></>,
  gift: <><rect x="4" y="9" width="16" height="11" rx="1.500" /><path d="M3 9h18M12 9v11" /><path d="M12 9c-1.500-4-6-3.500-4.500-.5M12 9c1.500-4 6-3.500 4.500-.5" /></>,
  drop: <path d="M12 3.500c3.500 4.500 5.500 7.300 5.500 10a5.500 5.500 0 0 1-11 0c0-2.700 2-5.500 5.500-10z" />,
  hand: <><path d="M9 11.500V5.500a1.500 1.500 0 0 1 3 0v5" /><path d="M12 10.500a1.500 1.500 0 0 1 3 0v1a1.500 1.500 0 0 1 3 0V15a6 6 0 0 1-6 6h-.5c-2 0-3.300-.8-4.500-2.500L4.500 15a1.500 1.500 0 0 1 2.500-1.700l2 2.200" /></>,
  bell: <><path d="M6 16.500V11a6 6 0 0 1 12 0v5.500l1.500 2h-15z" /><path d="M10 20.500a2 2 0 0 0 4 0" /></>,
  party: <><path d="M4 20l4.500-12 7.500 7.500z" /><path d="M14 4.500c1 1 1 2.500 0 3.500M17.500 9c1.500-.5 3 0 3.500 1M18.500 3.500v.01M20.500 6v.01" /></>,
  warn: <><path d="M12 4l9 16H3z" /><path d="M12 10v4.500M12 17.300v.01" /></>,
  flower: <><circle cx="12" cy="12" r="2.200" /><circle cx="12" cy="6.300" r="2.800" /><circle cx="17.400" cy="10.200" r="2.800" /><circle cx="15.300" cy="16.600" r="2.800" /><circle cx="8.700" cy="16.600" r="2.800" /><circle cx="6.600" cy="10.200" r="2.800" /></>,
  smile: <><circle cx="12" cy="12" r="8.500" /><path d="M8.500 14c1 1.600 2.200 2.300 3.500 2.300s2.500-.7 3.500-2.300M9 9.800v.01M15 9.800v.01" /></>,
  story: <><path d="M5 4h10l4 4v12H5z" /><path d="M8.500 12h7M8.500 15.500h5" /></>,
};
export type IconName = keyof typeof PATHS | "coin" | "gem" | "star" | "lp";

export function Icon({ n, className }: { n: IconName } & P) {
  // 재화: 색이 의미를 가지므로 채움 아이콘
  if (n === "coin") return <S className={className}><circle cx="12" cy="12" r="9" fill="#f2c14e" stroke="#b9862f" /><circle cx="12" cy="12" r="5.600" fill="none" stroke="#b9862f" strokeWidth={1.400} /><path d="M12 9.300v5.400" stroke="#b9862f" /></S>;
  if (n === "gem") return <S className={className}><path d="M7 4h10l4 5.500L12 21 3 9.500z" fill="#8fd3f7" stroke="#3d8fc4" /><path d="M3 9.500h18M9.500 4L8 9.500 12 21l4-11.500L14.500 4" stroke="#3d8fc4" strokeWidth={1.300} /></S>;
  if (n === "star") return <S className={className}><path d="M12 3l2.700 5.700 6.300.800-4.600 4.300 1.200 6.200L12 17l-5.600 3 1.200-6.200L3 9.500l6.300-.8z" fill="#f6b73c" stroke="#c98a1e" /></S>;
  if (n === "lp") return <S className={className}><path d="M3 10l9-6 9 6z" fill="#e79aae" stroke="#b96880" /><path d="M5.500 10v8M10 10v8M14 10v8M18.500 10v8M3 19h18" stroke="#b96880" /></S>;
  return <S className={className}>{PATHS[n]}</S>;
}

/** 재화 + 수량 표기 */
export const CUR_ICON = { coin: "coin", star: "star", gem: "gem" } as const;
export function Price({ c, n }: { c: "coin" | "star" | "gem" | "lp"; n: number }) {
  return <span className="inline-flex items-center gap-0.5 whitespace-nowrap"><Icon n={c} />{n.toLocaleString()}</span>;
}
