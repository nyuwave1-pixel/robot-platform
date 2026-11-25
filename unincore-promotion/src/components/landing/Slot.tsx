import { Camera, Play, Quotes } from "@phosphor-icons/react/dist/ssr";

/**
 * Frosted frame for an asset that hasn't been supplied yet (clinical
 * before/after, skin close-ups, UGC). Says what goes there.
 */
export function Slot({ caption, kind = "photo", className = "", compact = false }: { caption: string; kind?: "photo" | "video" | "quote"; className?: string; compact?: boolean }) {
  const Icon = kind === "video" ? Play : kind === "quote" ? Quotes : Camera;
  return (
    <div className={`lp-slot grid place-items-center ${className}`} role="img" aria-label={`${caption} (${kind === "quote" ? "review" : kind} to be added)`}>
      <div className="relative flex max-w-[22ch] flex-col items-center gap-2.5 px-4 text-center">
        <span className="lens w-11 text-acc-ink">
          <Icon size={17} weight={kind === "photo" ? "regular" : "fill"} />
        </span>
        <span className={`text-[12.5px] font-medium leading-snug text-acc-ink ${compact ? "hidden sm:block" : ""}`}>{caption}</span>
      </div>
    </div>
  );
}
