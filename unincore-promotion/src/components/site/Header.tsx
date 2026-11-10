import Link from "next/link";
import type { ProductContent } from "@/content/types";
import { toAmazonProduct } from "@/lib/visibility";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";
import { HeaderShop } from "./StoreLink";

export function Header({ products }: { products: ProductContent[] }) {
  return (
    <header className="sticky top-0 z-40 px-4 pt-3 sm:px-6 lg:px-10">
      <div className="glass-bar mx-auto flex h-14 w-full max-w-[1240px] items-center justify-between gap-6 rounded-[18px] px-4 sm:px-6">
        <Link href="/" prefetch={false} aria-label="UNI&CORE home" className="rounded-[6px]">
          <Logo />
        </Link>
        <NavLinks products={products.map(({ slug, shortName }) => ({ slug, shortName }))} />
        <HeaderShop products={products.map((p) => ({ ...toAmazonProduct(p), slug: p.slug }))} />
        <MobileMenu products={products.map(({ slug, shortName }) => ({ slug, shortName }))} />
      </div>
    </header>
  );
}
