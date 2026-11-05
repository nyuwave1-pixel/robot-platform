import Link from "next/link";
import type { ProductContent } from "@/content/types";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

export function Header({ products }: { products: Pick<ProductContent, "slug" | "shortName">[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-ivory/85 backdrop-blur-md">
      <div className="container-site flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="UNI&CORE home">
          <Logo />
        </Link>
        <nav aria-label="Products" className="hidden items-center gap-8 md:flex">
          {products.map((p) => (
            <Link key={p.slug} href={`/products/${p.slug}`} className="text-[13px] font-medium text-ink-soft transition hover:text-ink">
              {p.shortName}
            </Link>
          ))}
          <Link href="/#routine" className="text-[13px] font-medium text-ink-soft transition hover:text-ink">
            3-Step Routine
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/#shop" className="btn-primary hidden !min-h-[40px] !px-5 !text-[11px] sm:inline-flex">
            Shop on Amazon
          </Link>
          <MobileMenu products={products.map(({ slug, shortName }) => ({ slug, shortName }))} />
        </div>
      </div>
    </header>
  );
}
