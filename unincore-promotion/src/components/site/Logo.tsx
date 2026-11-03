/**
 * UNI&CORE wordmark. Replace with the official logo file when supplied
 * (drop it in /public/brand/logo.svg and swap this component's markup).
 */
export function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={`inline-flex items-baseline font-display text-[22px] font-semibold leading-none tracking-[0.08em] ${light ? "text-ivory" : "text-ink"} ${className}`}>
      UNI<span className="mx-[1px] italic text-citrus">&amp;</span>CORE
    </span>
  );
}
