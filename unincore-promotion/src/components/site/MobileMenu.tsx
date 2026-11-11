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
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-[10px] ring-1 ring-black/10"
      >
        <span className="relative block h-3 w-4">
          <span className={`absolute left-0 h-px w-4 bg-[#191A17] transition ${open ? "top-1.5 rotate-45" : "top-0"}`} />
          <span className={`absolute left-0 top-1.5 h-px w-4 bg-[#191A17] transition ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 h-px w-4 bg-[#191A17] transition ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
        </span>
      </button>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="fixed inset-x-0 bottom-0 top-[80px] z-40 bg-white px-5 py-6">
          <ul className="space-y-1">
            {products.map((p) => (
              <li key={p.slug}>
                <Link href={`/products/${p.slug}`} className="block border-b border-black/[0.07] py-5 font-serif text-[26px] font-medium tracking-[-0.01em] text-[#191A17]">
                  {p.shortName}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/#routine" className="block border-b border-black/[0.07] py-5 font-serif text-[26px] font-medium tracking-[-0.01em] text-[#191A17]">
                3-Step Routine
              </Link>
            </li>
            <li>
              <Link href="/guides" className="block border-b border-black/[0.07] py-5 font-serif text-[26px] font-medium tracking-[-0.01em] text-[#191A17]">
                Guides
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
