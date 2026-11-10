"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Atom, Camera, CaretRight, CirclesThree, Drop, Leaf, Plant, Scales } from "@phosphor-icons/react";
import type { GalleryItem, IconKey } from "@/content/landing";

const ICONS: Record<IconKey, typeof Atom> = { atom: Atom, circles: CirclesThree, drop: Drop, scales: Scales, leaf: Leaf, plant: Plant };
import type { AmazonProduct } from "@/components/site/AmazonButton";
import { AmazonCta } from "./AmazonCta";

/**
 * Left-hand product gallery (structure from the JYT plan): a large stage in a
 * glass bezel, a thumbnail row and the Amazon button. Sticky on desktop; on
 * mobile it sits on top of the page and the stage swipes.
 */
export function LandingGallery({ items, product, ctaLabel }: { items: GalleryItem[]; product: AmazonProduct; ctaLabel: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setActive(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Keep the current thumbnail in view inside its own scroll area (never scrolls the page).
  const thumbs = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = thumbs.current;
    const el = box?.children[active] as HTMLElement | undefined;
    if (!box || !el) return;
    const b = box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    const column = getComputedStyle(box).flexDirection === "column";
    const pad = 12;
    if (column) {
      if (r.top < b.top) box.scrollBy({ top: r.top - b.top - pad, behavior });
      else if (r.bottom > b.bottom - 28) box.scrollBy({ top: r.bottom - b.bottom + 28 + pad, behavior });
    } else {
      if (r.left < b.left) box.scrollBy({ left: r.left - b.left - pad, behavior });
      else if (r.right > b.right) box.scrollBy({ left: r.right - b.right + pad, behavior });
    }
  }, [active]);

  const go = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
    setActive(i);
  }, []);

  return (
    <div className="mx-auto w-full lg:mx-0">
      {/* Desktop: thumbnails in a column beside the stage, so the stage can use the full column width
          and the whole gallery plus the Amazon button still fits the viewport while sticky. */}
      <div className="lg:flex lg:items-stretch lg:gap-3">
      <div className="glass rounded-[28px] p-2.5 lg:order-2 lg:min-w-0 lg:max-w-[calc(100dvh_-_var(--header-h)_-_126px)] lg:flex-1">
        <div className="relative overflow-hidden rounded-[20px] bg-acc-tint">
          <div
            ref={track}
            className="lp-track flex overflow-x-auto"
            role="group"
            aria-roledescription="carousel"
            aria-label="Product photos"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") go(Math.min(items.length - 1, active + 1));
              if (e.key === "ArrowLeft") go(Math.max(0, active - 1));
            }}
          >
            {items.map((item, i) => (
              <div key={item.id} className="relative aspect-square w-full shrink-0" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${items.length}: ${item.label}`}>
                <Stage item={item} priority={i < 2} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Thumbnails. Desktop: a column beside the stage, exactly as tall as the stage, that scrolls on its own
          to reach the photos further down. Mobile: a row under the stage that scrolls sideways. */}
      {/* The minmax(0,1fr) track keeps a long thumbnail row from widening the page on mobile. */}
      <div className="relative mt-3 grid grid-cols-[minmax(0,1fr)] lg:order-1 lg:mt-0 lg:block lg:w-[100px] lg:shrink-0">
        <div
          ref={thumbs}
          className="lp-thumbs flex gap-2 overflow-x-auto p-[3px] lg:absolute lg:inset-0 lg:flex-col lg:gap-2.5 lg:overflow-y-auto lg:overflow-x-hidden lg:pb-8"
          role="group"
          aria-label="Product photo thumbnails"
        >
          {items.map((item, i) => {
            const on = i === active;
            return (
              <button key={item.id} type="button" onClick={() => go(i)} aria-label={`Show ${item.label}`} aria-current={on ? "true" : undefined} className="group flex w-[72px] shrink-0 flex-col items-center gap-1.5 text-center lg:w-full">
                <span
                  className={`glass block w-full rounded-[14px] p-1 transition duration-300 ease-out ${
                    on ? "shadow-[0_0_0_2px_rgb(var(--acc)),0_12px_24px_-12px_rgb(var(--acc-deep)/0.5)]" : "opacity-80 group-hover:opacity-100"
                  }`}
                >
                  <span className="relative block aspect-square w-full overflow-hidden rounded-[10px] bg-acc-tint">
                    <Thumb item={item} />
                  </span>
                </span>
                <span className={`hidden w-full truncate text-[11.5px] leading-tight transition-colors lg:block ${on ? "font-semibold text-body" : "text-body-mute group-hover:text-body"}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      </div>

      <AmazonCta product={product} location="hero" label={ctaLabel} className="mt-4 w-full" />
    </div>
  );
}

function Stage({ item, priority }: { item: GalleryItem; priority: boolean }) {
  switch (item.kind) {
    case "image":
      return <Image src={item.src} alt={item.alt} fill priority={priority} sizes="(min-width: 1024px) 620px, 100vw" className="object-cover" />;
    case "beforeAfter":
      return <BeforeAfter item={item} priority={priority} />;
    case "slot":
      return (
        <div className="lp-slot absolute inset-0 grid place-items-center" role="img" aria-label={`${item.caption} (photo to be added)`}>
          <div className="relative flex flex-col items-center gap-3 px-6 text-center">
            <span className="lens w-14 text-acc-ink">
              <Camera size={20} />
            </span>
            <span className="max-w-[24ch] text-[14px] font-medium leading-snug text-acc-ink">{item.caption}</span>
          </div>
        </div>
      );
    case "ingredients":
      return (
        <div className="lp-slot absolute inset-0 flex flex-col justify-center px-[5%]">
          <div className={`relative grid gap-[3.5%] ${item.items.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
            {item.items.map((ing) => (
              // Each name stays on one line, sized to its column, so the notes under it line up across columns.
              <figure key={ing.name} className="min-w-0 text-center [container-type:inline-size]">
                <div className="mx-auto aspect-square w-full rounded-full bg-white p-[5%] shadow-[0_14px_30px_-18px_rgb(var(--acc-deep)/0.5)]">
                  <div className="relative grid h-full w-full place-items-center overflow-hidden rounded-full bg-white">
                    {ing.src ? (
                      <Image src={ing.src} alt={ing.name} fill sizes="(min-width: 1024px) 240px, 40vw" className="object-cover" />
                    ) : (
                      <IngredientIcon icon={ing.icon} />
                    )}
                  </div>
                </div>
                <figcaption className="mt-4">
                  <span className="serif block whitespace-nowrap text-[clamp(11px,12.5cqi,28px)] font-semibold leading-tight text-body">{ing.name}</span>
                  <span className="mt-1 block text-[13px] text-body-mute">{ing.note}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      );
  }
}

function IngredientIcon({ icon }: { icon?: IconKey }) {
  const Icon = icon ? ICONS[icon] : Leaf;
  return (
    <span className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_35%_30%,#fff,rgb(var(--acc-tint)))] text-acc-ink">
      <Icon weight="duotone" className="h-[38%] w-[38%]" />
    </span>
  );
}

/** Before and after side by side, the way the brand's Amazon listing shows them. */
function BeforeAfter({ item, priority = false }: { item: Extract<GalleryItem, { kind: "beforeAfter" }>; priority?: boolean }) {
  const ready = Boolean(item.before && item.after);
  const half = (src: string | undefined, label: string, after: boolean) => (
    <figure className="relative h-full overflow-hidden">
      {src ? (
        <Image src={src} alt={`${item.alt}: ${label}`} fill priority={priority} sizes="(min-width: 1024px) 310px, 50vw" className="object-cover" />
      ) : (
        <div className={`h-full w-full ${after ? "bg-[radial-gradient(62%_52%_at_50%_44%,#fff,transparent_72%),linear-gradient(165deg,#F6F4EF,#ECE9E2)]" : "bg-[radial-gradient(90%_70%_at_30%_15%,#fff,transparent_60%),linear-gradient(165deg,#F2F0EA,#E4E0D6)]"}`} />
      )}
      <figcaption
        className={`absolute bottom-3.5 rounded-[8px] px-2.5 py-1 text-[12.5px] font-semibold backdrop-blur-md ${after ? "right-3.5 bg-[rgb(var(--acc))] text-[#16150F]" : "left-3.5 bg-[#16150F]/85 text-white"}`}
      >
        {label}
      </figcaption>
    </figure>
  );
  return (
    <div className="absolute inset-0 grid grid-cols-2 gap-[3px] bg-white" role="group" aria-label={ready ? item.alt : `${item.alt} (clinical photos to be added)`}>
      {half(item.before, item.beforeLabel, false)}
      {half(item.after, item.afterLabel, true)}
      <span aria-hidden className="lens absolute left-1/2 top-1/2 w-11 -translate-x-1/2 -translate-y-1/2 text-[#16150F]">
        <CaretRight size={18} weight="bold" />
      </span>
      <span className="absolute left-3.5 top-3.5 rounded-[8px] bg-white/92 px-2.5 py-1 text-[12.5px] font-semibold text-[#16150F] shadow-[0_4px_12px_-6px_rgb(22_21_15/0.3)]">{item.tag}</span>
    </div>
  );
}

function Thumb({ item }: { item: GalleryItem }) {
  switch (item.kind) {
    case "image":
      return <Image src={item.src} alt="" fill sizes="110px" className="object-cover" />;
    case "ingredients": {
      const first = item.items.find((x) => x.src)?.src;
      return first ? <Image src={first} alt="" fill sizes="110px" className="object-cover" /> : <IngredientIcon icon={item.items[0]?.icon} />;
    }
    case "beforeAfter":
      if (item.before && item.after)
        return (
          <span className="absolute inset-0 grid grid-cols-2 gap-px bg-white">
            <span className="relative"><Image src={item.before} alt="" fill sizes="56px" className="object-cover" /></span>
            <span className="relative"><Image src={item.after} alt="" fill sizes="56px" className="object-cover" /></span>
          </span>
        );
      return (
        <span className="absolute inset-0 grid grid-cols-2">
          <span className="bg-[#E9E6DE]" />
          <span className="bg-[radial-gradient(70%_60%_at_50%_45%,#fff,#F1EEE8)]" />
          <span className="absolute inset-y-0 left-1/2 w-px bg-white" />
        </span>
      );
    case "slot":
      return (
        <span className="lp-slot absolute inset-0 grid place-items-center text-acc-ink/70">
          <Camera size={15} className="relative" />
        </span>
      );
  }
}
