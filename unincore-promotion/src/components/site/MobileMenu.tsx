"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function MobileMenu({ products }: { products: { slug: string; shortName: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-full border border-ink/15"
      >
        <span className="relative block h-3 w-4">
          <span className={`absolute left-0 h-px w-4 bg-ink transition ${open ? "top-1.5 rotate-45" : "top-0"}`} />
          <span className={`absolute left-0 top-1.5 h-px w-4 bg-ink transition ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 h-px w-4 bg-ink transition ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
        </span>
      </button>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="fixed inset-x-0 bottom-0 top-16 z-40 bg-ivory px-6 py-8">
          <ul className="space-y-1">
            {products.map((p) => (
              <li key={p.slug}>
                <Link href={`/products/${p.slug}`} className="block border-b border-ink/10 py-5 font-display text-3xl">
                  {p.shortName}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/#routine" className="block border-b border-ink/10 py-5 font-display text-3xl">
                3-Step Routine
              </Link>
            </li>
          </ul>
          <Link href="/#shop" className="btn-primary mt-8 w-full">
            Shop on Amazon
          </Link>
        </nav>
      )}
    </div>
  );
}
