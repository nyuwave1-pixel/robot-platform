import Link from "next/link";
import type { ProductContent } from "@/content/types";
import { SITE } from "@/content/site";
import { Logo } from "./Logo";
import { PrivacyChoicesLink } from "./ConsentBanner";

export function Footer({ products }: { products: Pick<ProductContent, "slug" | "name">[] }) {
  const link = "text-[#3F413B] transition-colors hover:text-[#191A17]";
  return (
    <footer data-hide-sticky className="border-t border-black/[0.06] bg-[#F5F5F1] text-[#191A17]">
      <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-10">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-[#5C5F58]">Korean vitamin C skincare, available in the US on Amazon.com.</p>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[#191A17]">Shop</p>
          <ul className="mt-4 space-y-3 text-[14px]">
            {products.map((p) => (
              <li key={p.slug}>
                <Link href={`/products/${p.slug}`} className={link}>
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[#191A17]">Info</p>
          <ul className="mt-4 space-y-3 text-[14px]">
            <li><Link href="/contact" className={link}>Contact</Link></li>
            <li><Link href="/privacy" className={link}>Privacy Policy</Link></li>
            <li><Link href="/terms" className={link}>Terms of Use</Link></li>
            <li><Link href="/disclaimer" className={link}>Disclaimer</Link></li>
            <li><PrivacyChoicesLink className={link} /></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-black/[0.06]">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-2 px-4 py-6 text-[12.5px] text-[#5C5F58] sm:flex-row sm:justify-between sm:px-6 lg:px-10">
          <p>© {new Date().getFullYear()} {SITE.legalName}. All rights reserved.</p>
          <p>Amazon and the Amazon logo are trademarks of Amazon.com, Inc. or its affiliates.</p>
        </div>
      </div>
    </footer>
  );
}
