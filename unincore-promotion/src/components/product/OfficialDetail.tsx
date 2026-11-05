import type { ProductContent } from "@/content/types";
import { toAmazonProduct } from "@/lib/visibility";
import { TrackedDetails } from "./TrackedDetails";

/**
 * The brand's official detail page, re-published as image slices inside a
 * <details>. Slices are lazy-loaded and the closed <details> keeps them from
 * downloading until a visitor opens it. The outline is real text for SEO and
 * screen readers.
 */
export function OfficialDetail({ p }: { p: ProductContent }) {
  const d = p.officialDetail;
  if (!d || d.slices.length === 0) return null;
  return (
    <div className="mx-auto max-w-3xl" data-reveal>
      <ul className="space-y-3">
        {d.outline.map((o) => (
          <li key={o} className="flex gap-3 text-ink-soft">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/40" aria-hidden />
            <span>{o}</span>
          </li>
        ))}
      </ul>
      <TrackedDetails product={toAmazonProduct(p)} className="group mt-8 overflow-hidden rounded-3xl border border-ink/10 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-medium">
          <span>View the full official product page</span>
          <span className="text-xl transition-transform group-open:rotate-45" aria-hidden>+</span>
        </summary>
        <div className="border-t border-ink/10">
          {d.slices.map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- pre-sized static slices; next/image adds nothing here
            <img
              key={s.src}
              src={s.src}
              width={s.width}
              height={s.height}
              loading="lazy"
              decoding="async"
              alt={i === 0 ? `Official UNI&CORE ${p.name} product details: ${d.outline.join(". ")}` : ""}
              className="block h-auto w-full"
            />
          ))}
        </div>
        <p className="px-6 py-4 text-xs text-ink-mute">
          Source:{" "}
          <a href={d.sourceUrl} target="_blank" rel="noopener" className="underline underline-offset-2">
            official UNI&amp;CORE product page
          </a>{" "}
          (adapted for the US site). Test results are from the brand&apos;s human application tests; individual results may vary.
        </p>
      </TrackedDetails>
    </div>
  );
}
