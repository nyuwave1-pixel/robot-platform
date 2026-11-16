/**
 * UNI&CORE wordmark: the official logo artwork (unincore.com, /resources/image/common/f_logo.svg),
 * redrawn with currentColor so it can sit on light or dark surfaces. Source file: /public/brand/unincore-logo.svg.
 * The paths live in SvgSprites (#uc-logo), rendered once by the site layout.
 */
export function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <svg viewBox="0 0 201.26 28.35" role="img" aria-label="UNI&amp;CORE" className={`h-[19px] w-auto ${light ? "text-ivory" : "text-[#16150F]"} ${className}`} fill="currentColor">
      <use href="#uc-logo" />
    </svg>
  );
}
