/**
 * MEDIDERMA SKIN IQ 라인 아이콘 — 이모지 대신 쓰는 얇은 선 아이콘 한 벌.
 * 24×24, 선 굵기 1.5, 둥근 끝, 글자색(currentColor)을 따른다. 장식용이므로 기본 aria-hidden.
 */
import type { SVGProps } from "react";

const P: Record<string, React.ReactNode> = {
  camera: (<><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.3-2h6l1.3 2h2.2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" /><circle cx="12" cy="13" r="3.4" /></>),
  image: (<><rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4 17 5-4.5 3.5 3 3-2.5 4.5 4" /></>),
  lock: (<><rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /><path d="M12 14.5v2" /></>),
  bulb: (<><path d="M9 17h6M10 20h4" /><path d="M12 3.5a5.5 5.5 0 0 0-3.2 10c.7.5 1.2 1.3 1.2 2.1V17h4v-1.4c0-.8.5-1.6 1.2-2.1A5.5 5.5 0 0 0 12 3.5z" /></>),
  alert: (<><path d="M12 4 3 19.5h18z" /><path d="M12 10v4.5M12 17v.01" /></>),
  check: <path d="m5 12.5 4.2 4L19 7" />,
  checkCircle: (<><circle cx="12" cy="12" r="8.5" /><path d="m8.2 12.3 2.6 2.5 5-5.2" /></>),
  refresh: (<><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" /><path d="M19.5 4.5v4h-4" /></>),
  external: (<><path d="M9 6H6.5A1.5 1.5 0 0 0 5 7.5v10A1.5 1.5 0 0 0 6.5 19h10a1.5 1.5 0 0 0 1.5-1.5V15" /><path d="M13 5h6v6M19 5l-8 8" /></>),
  sun: (<><circle cx="12" cy="12" r="3.8" /><path d="M12 2.8v2.2M12 19v2.2M2.8 12H5M19 12h2.2M5.5 5.5l1.6 1.6M16.9 16.9l1.6 1.6M5.5 18.5l1.6-1.6M16.9 7.1l1.6-1.6" /></>),
  moon: <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" />,
  face: (<><circle cx="12" cy="12" r="8.5" /><path d="M9 10v.01M15 10v.01" /><path d="M8.8 14.2a4 4 0 0 0 6.4 0" /></>),
  glasses: (<><circle cx="7" cy="14" r="3.2" /><circle cx="17" cy="14" r="3.2" /><path d="M10.2 14a2 2 0 0 1 3.6 0M3.8 14 3 9.5M20.2 14 21 9.5" /></>),
  user: (<><circle cx="12" cy="8.5" r="3.5" /><path d="M5 19.5a7 7 0 0 1 14 0" /></>),
  users: (<><circle cx="9" cy="8.5" r="3.2" /><path d="M3 19.5a6 6 0 0 1 12 0" /><path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 13.6a6 6 0 0 1 3.5 5.9" /></>),
  makeup: (<><path d="M9 21V12h6v9z" /><path d="M10 12V8.5L14 5v7" /><path d="M9 16h6" /></>),
  sparkle: (<><path d="M12 3.5c.6 3.8 2.7 5.9 6.5 6.5-3.8.6-5.9 2.7-6.5 6.5-.6-3.8-2.7-5.9-6.5-6.5 3.8-.6 5.9-2.7 6.5-6.5z" /><path d="M18.5 15.5c.3 1.6 1 2.3 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.2 2.2-.9 2.5-2.5z" /></>),
  trendUp: (<><path d="m4 16 5-5 4 3.5L20 7" /><path d="M15 7h5v5" /></>),
  trendDown: (<><path d="m4 8 5 5 4-3.5 7 7.5" /><path d="M15 17h5v-5" /></>),
  minus: <path d="M5 12h14" />,
  tap: (<><path d="M9.5 11V5.5a1.5 1.5 0 0 1 3 0V11" /><path d="M12.5 10.5V9a1.5 1.5 0 0 1 3 0v2M15.5 11a1.5 1.5 0 0 1 3 0v3.5a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.6-2.2L5 15.5a1.4 1.4 0 0 1 2.1-1.8l2.4 2.3" /></>),
  search: (<><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></>),
  contrast: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor" stroke="none" /></>),
  spot: (<><circle cx="12" cy="12" r="8.5" /><circle cx="9.5" cy="10" r="1.3" fill="currentColor" /><circle cx="14.5" cy="13.5" r="1.8" fill="currentColor" /><circle cx="10.5" cy="15.2" r="0.9" fill="currentColor" /></>),
  drop: <path d="M12 3.5c3 4 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.5 6-10.5z" />,
  eye: (<><path d="M2.8 12S6 5.8 12 5.8 21.2 12 21.2 12 18 18.2 12 18.2 2.8 12 2.8 12z" /><circle cx="12" cy="12" r="2.8" /></>),
  wave: <path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />,
  jaw: <path d="M5 6v4.5c0 4.5 3.2 8.5 7 9.5 3.8-1 7-5 7-9.5V6" />,
  pin: (<><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>),
  chat: (<><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" /><path d="M8.5 10h.01M12 10h.01M15.5 10h.01" /></>),
  swap: <path d="M8 7 4 11l4 4M16 9l4 4-4 4M4 11h11M20 13H9" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
};

export type IconName = keyof typeof P;

export default function Icon({ name, size = 20, strokeWidth = 1.5, className = "", title, ...rest }: { name: IconName; size?: number; strokeWidth?: number; title?: string } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 align-[-0.18em] ${className}`}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...rest}
    >
      {title && <title>{title}</title>}
      {P[name]}
    </svg>
  );
}
