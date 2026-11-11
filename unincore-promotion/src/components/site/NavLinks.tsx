"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Header product links; the current product is marked. */
export function NavLinks({ products }: { products: { slug: string; shortName: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-6 whitespace-nowrap lg:flex xl:gap-7">
      {products.map((p) => {
        const href = `/products/${p.slug}`;
        const on = pathname === href;
        return (
          <Link
            key={p.slug}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`relative text-[13.5px] font-medium transition-colors after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-[1.5px] after:rounded-full after:transition-opacity ${
              on ? "text-[#16150F] after:bg-[#16150F] after:opacity-100" : "text-[#4A4943] after:opacity-0 hover:text-[#16150F]"
            }`}
          >
            {p.shortName}
          </Link>
        );
      })}
      <Link
        href="/guides"
        aria-current={pathname.startsWith("/guides") ? "page" : undefined}
        className={`relative text-[13.5px] font-medium transition-colors after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-[1.5px] after:rounded-full after:transition-opacity ${
          pathname.startsWith("/guides") ? "text-[#16150F] after:bg-[#16150F] after:opacity-100" : "text-[#4A4943] after:opacity-0 hover:text-[#16150F]"
        }`}
      >
        Guides
      </Link>
    </nav>
  );
}
