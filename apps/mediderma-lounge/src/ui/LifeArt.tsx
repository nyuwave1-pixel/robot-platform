/**
 * 라이프 콘텐츠 그림 (직접 그린 SVG). 이모지는 OS마다 모양이 달라 쓰지 않는다 — docs/STUDIO_PRACTICES.md.
 * 식물 · 운동 · 인테리어 소품을 색만 바꿔 같은 화풍으로 그린다.
 */
import type { ReactNode } from "react";

const Svg = ({ children, size = 40 }: { children: ReactNode; size?: number }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} className="shrink-0" aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const INK = "#5b4a50";

/** 화분 식물: stage 0 씨앗 · 1 새싹 · 2 봉오리 · 3 꽃 */
export function PlantArt({ color, stage, size = 40 }: { color: string; stage: number; size?: number }) {
  return (
    <Svg size={size}>
      <path d="M11 27h18l-2.5 10h-13z" fill="#e8c2ab" stroke="#c99a80" strokeWidth={1.2} />
      <path d="M10 26h20v2.6H10z" fill="#f0d2bf" stroke="#c99a80" strokeWidth={1.2} />
      {stage === 0 && <ellipse cx="20" cy="24.6" rx="2.2" ry="1.4" fill="#8a6a4a" />}
      {stage >= 1 && <path d={`M20 26V${stage === 1 ? 19 : 12}`} stroke="#5fae7e" strokeWidth={1.8} fill="none" />}
      {stage >= 1 && <path d="M20 22c-3-.5-5-2.5-5.5-5 3 .2 5 2 5.5 5zM20 20c3-.5 5-2.5 5.5-5-3 .2-5 2-5.5 5z" fill="#7fc8a9" stroke="#5fae7e" strokeWidth={0.8} />}
      {stage === 2 && <ellipse cx="20" cy="10.5" rx="3" ry="4" fill={color} stroke={INK} strokeOpacity={0.25} strokeWidth={0.8} />}
      {stage >= 3 && (
        <g transform="translate(20 10)">
          {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-4.6" rx="3.4" ry="4.6" fill={color} stroke={INK} strokeOpacity={0.2} strokeWidth={0.8} transform={`rotate(${a})`} />)}
          <circle r="2.6" fill="#f6e27a" stroke="#d9b648" strokeWidth={0.8} />
        </g>
      )}
    </Svg>
  );
}

/** 운동 포즈 (사람 실루엣) */
const POSES: Record<string, ReactNode> = {
  stretch: <><circle cx="20" cy="8" r="3.4" /><path d="M20 12v12M20 14l-7-6M20 14l7-6M20 24l-5 11M20 24l5 11" /></>,
  yoga: <><circle cx="20" cy="9" r="3.4" /><path d="M20 13v10M20 16l-8 2M20 16l8 2M20 23c-4 0-9 2-9 5h18c0-3-5-5-9-5z" /></>,
  pilates: <><circle cx="8" cy="22" r="3.2" /><path d="M11 23l12 2M23 25l9-8M16 24l1 9M23 25l3 8" /><path d="M4 34h32" /></>,
  dance: <><circle cx="19" cy="8" r="3.4" /><path d="M19 12l2 11M20 15l-7-4M20 15l8-6M21 23l-6 11M21 23l8 7" /></>,
  hiit: <><circle cx="20" cy="9" r="3.4" /><path d="M20 13v9M20 15l-7 4M20 15l7 4M20 22l-8 4-1 8M20 22l8 4 1 8" /><path d="M7 7l2 2M33 7l-2 2M20 2v2" /></>,
};
export function WorkoutArt({ id, size = 40 }: { id: string; size?: number }) {
  return (
    <Svg size={size}>
      <circle cx="20" cy="20" r="19" fill="#fde7ee" />
      <g fill="none" stroke="#c75b80" strokeWidth={2.4}>{POSES[id]}</g>
    </Svg>
  );
}

/** 인테리어 소품 */
const C = { pink: "#f2a6b8", rose: "#e98c9a", gold: "#e3c26f", cream: "#fff3e2", lav: "#b9a2e8", mint: "#9fd3c7", brown: "#c8946a", blue: "#a9d4ec", glass: "#dcecf6" };
const vase = (flower: string, petal: string) => (
  <>
    <path d="M14 22h12l-1.5 13h-9z" fill={C.glass} stroke={INK} strokeOpacity={0.35} strokeWidth={1.1} />
    <path d="M20 22V12M20 18l-5-4M20 17l5-5" stroke="#5fae7e" strokeWidth={1.4} fill="none" />
    {[[20, 10], [14.5, 13], [25.5, 11]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={flower === "sun" ? 3.6 : 3} fill={petal} stroke={INK} strokeOpacity={0.25} strokeWidth={0.8} />)}
    {flower === "sun" && <circle cx="20" cy="10" r="1.4" fill="#8a6a4a" />}
  </>
);
const CURIO_ART: Record<string, ReactNode> = {
  "c-tulip": vase("tulip", C.rose),
  "c-sunflower": vase("sun", C.gold),
  "c-bouquet": <><path d="M14 20l6 15 6-15z" fill={C.cream} stroke={INK} strokeOpacity={0.35} strokeWidth={1.1} />{[[15, 15, C.pink], [20, 12, C.cream], [25, 15, C.lav], [17.5, 19, C.rose], [22.5, 19, C.pink]].map(([x, y, c], i) => <circle key={i} cx={x as number} cy={y as number} r="3.6" fill={c as string} stroke={INK} strokeOpacity={0.25} strokeWidth={0.8} />)}<path d="M18 27l2 2 2-2" stroke={C.rose} strokeWidth={1.6} fill="none" /></>,
  "c-cherry": <><path d="M8 33c6-6 12-10 24-22" stroke={C.brown} strokeWidth={2} fill="none" /><path d="M16 26l-3-5M24 18l1-6" stroke={C.brown} strokeWidth={1.4} fill="none" />{[[13, 20], [25, 11], [30, 13], [19, 22], [11, 28]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}>{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cy="-1.8" rx="1.3" ry="1.9" fill="#f7c6d4" transform={`rotate(${a})`} />)}</g>)}</>,
  "c-candle": <><rect x="14" y="16" width="12" height="19" rx="2" fill={C.cream} stroke={INK} strokeOpacity={0.35} strokeWidth={1.1} /><path d="M20 16v-3" stroke={INK} strokeWidth={1.1} /><path d="M20 6c2 3 2.5 4.5 0 6.5-2.5-2-2-3.5 0-6.5z" fill="#f6b73c" /></>,
  "c-diffuser": <><path d="M13 24h14l-1 11H14z" fill={C.lav} stroke={INK} strokeOpacity={0.35} strokeWidth={1.1} /><path d="M17 24h6v-3h-6z" fill={C.cream} /><path d="M19 21l-6-15M20 21V5M21 21l6-15" stroke={C.brown} strokeWidth={1.2} fill="none" /></>,
  "c-lamp": <><path d="M12 18h16l-3-10h-10z" fill={C.pink} stroke={INK} strokeOpacity={0.35} strokeWidth={1.1} /><path d="M20 18v12" stroke={C.gold} strokeWidth={2} /><path d="M14 34h12l-2-4h-8z" fill={C.gold} /><circle cx="20" cy="15" r="7" fill="#fff4c2" opacity={0.35} /></>,
  "c-crystal": <><path d="M13 34h14l-2-5H15z" fill={C.gold} stroke={INK} strokeOpacity={0.35} strokeWidth={1.1} /><circle cx="20" cy="19" r="10" fill={C.lav} opacity={0.75} stroke={INK} strokeOpacity={0.3} strokeWidth={1.1} /><path d="M15 15c1.5-2.5 3.5-3.5 6-3.500" stroke="#fff" strokeWidth={1.6} fill="none" /></>,
  "c-mirror": <><ellipse cx="20" cy="15" rx="9" ry="10" fill={C.gold} /><ellipse cx="20" cy="15" rx="6.5" ry="7.5" fill={C.glass} /><path d="M17 11l4-2" stroke="#fff" strokeWidth={1.4} /><path d="M20 25v10" stroke={C.gold} strokeWidth={3} /></>,
  "c-ribbon": <><path d="M20 19l-11-7v14zM20 19l11-7v14z" fill={C.pink} stroke={INK} strokeOpacity={0.35} strokeWidth={1.1} /><path d="M19 21l-5 13M21 21l5 13" stroke={C.pink} strokeWidth={3} /><circle cx="20" cy="19" r="3" fill={C.rose} /></>,
  "c-perfume": <><rect x="12" y="17" width="16" height="17" rx="5" fill={C.pink} opacity={0.85} stroke={INK} strokeOpacity={0.35} strokeWidth={1.1} /><rect x="17" y="12" width="6" height="5" fill={C.gold} /><circle cx="20" cy="9" r="3" fill={C.gold} /><path d="M15 22c1-1.500 2-2 3.500-2" stroke="#fff" strokeWidth={1.4} fill="none" /></>,
  "c-crown": <><path d="M9 28l2-14 6 7 3-10 3 10 6-7 2 14z" fill={C.gold} stroke="#b9862f" strokeWidth={1.1} /><rect x="9" y="28" width="22" height="4" rx="1" fill={C.gold} stroke="#b9862f" strokeWidth={1.1} /><circle cx="20" cy="22" r="2" fill={C.rose} /><circle cx="14" cy="24" r="1.4" fill={C.blue} /><circle cx="26" cy="24" r="1.4" fill={C.blue} /></>,
  "c-teddy": <><circle cx="13" cy="10" r="3.5" fill={C.brown} /><circle cx="27" cy="10" r="3.5" fill={C.brown} /><circle cx="20" cy="15" r="8" fill={C.brown} /><ellipse cx="20" cy="29" rx="9" ry="7.5" fill={C.brown} /><ellipse cx="20" cy="18" rx="3.5" ry="2.5" fill={C.cream} /><circle cx="17" cy="13.5" r="1" fill={INK} /><circle cx="23" cy="13.5" r="1" fill={INK} /><path d="M15 23l5 2 5-2" stroke={C.rose} strokeWidth={2} fill="none" /></>,
  "c-tea": <><path d="M9 18h20v6a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8z" fill={C.cream} stroke={INK} strokeOpacity={0.35} strokeWidth={1.1} /><path d="M29 20h3a3 3 0 0 1 0 6h-3" stroke={INK} strokeOpacity={0.35} strokeWidth={1.4} fill="none" /><path d="M9 22l-4-4" stroke={INK} strokeOpacity={0.35} strokeWidth={1.6} /><ellipse cx="19" cy="18" rx="10" ry="2" fill={C.pink} /><circle cx="19" cy="14" r="2" fill={C.gold} /><path d="M14 26c1.500 1.500 6.500 1.500 8 0" stroke={C.rose} strokeWidth={1.2} fill="none" /></>,
  "c-books": <><rect x="9" y="28" width="22" height="6" rx="1" fill={C.lav} /><rect x="11" y="22" width="19" height="6" rx="1" fill={C.mint} /><rect x="10" y="16" width="20" height="6" rx="1" fill={C.pink} /><path d="M13 31h16M14 25h14M13 19h15" stroke="#fff" strokeWidth={1} /><path d="M24 16V9l3 2 3-2v7" fill={C.gold} /></>,
  "c-globe": <><path d="M12 34h16l-2-5H14z" fill={C.brown} /><circle cx="20" cy="18" r="11" fill={C.blue} opacity={0.6} stroke={INK} strokeOpacity={0.3} strokeWidth={1.1} /><path d="M12 24c3-2 13-2 16 0" fill="#fff" stroke="#fff" strokeWidth={3} /><path d="M20 13l-3 6h6z" fill="#5fae7e" />{[[15, 12], [24, 10], [26, 17], [14, 18]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="0.9" fill="#fff" />)}</>,
};
export function CurioArt({ id, size = 40, owned = true }: { id: string; size?: number; owned?: boolean }) {
  return (
    <span className={owned ? "" : "opacity-25 grayscale"}>
      <Svg size={size}>{CURIO_ART[id] ?? <circle cx="20" cy="20" r="10" fill={C.pink} />}</Svg>
    </span>
  );
}
/** 상자 */
export function BoxArt({ size = 40 }: { size?: number }) {
  return (
    <Svg size={size}>
      <rect x="7" y="16" width="26" height="19" rx="2" fill={C.pink} stroke={INK} strokeOpacity={0.35} strokeWidth={1.1} />
      <rect x="5" y="11" width="30" height="6" rx="1.500" fill={C.rose} />
      <path d="M20 11v24" stroke={C.gold} strokeWidth={3} />
      <path d="M20 11c-3-6-10-5-7-1M20 11c3-6 10-5 7-1" stroke={C.gold} strokeWidth={2} fill="none" />
    </Svg>
  );
}
export const CURIO_IDS = Object.keys(CURIO_ART);
