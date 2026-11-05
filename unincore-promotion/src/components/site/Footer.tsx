import Link from "next/link";
import type { ProductContent } from "@/content/types";
import { SITE } from "@/content/site";
import { Logo } from "./Logo";
import { PrivacyChoicesLink } from "./ConsentBanner";

export function Footer({ products }: { products: Pick<ProductContent, "slug" | "name">[] }) {
  return (
    <footer data-hide-sticky className="bg-ink text-ivory">
      <div className="container-site grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ivory/60">{SITE.tagline}. Korean vitamin C skincare, available in the US on Amazon.com.</p>
        </div>
        <div>
          <p className="eyebrow !text-ivory/50">Shop</p>
          <ul className="mt-4 space-y-3 text-sm text-ivory/80">
            {products.map((p) => (
              <li key={p.slug}>
                <Link href={`/products/${p.slug}`} className="hover:text-ivory">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow !text-ivory/50">Info</p>
          <ul className="mt-4 space-y-3 text-sm text-ivory/80">
            <li><Link href="/guides/korean-vitamin-c-skincare-routine" className="hover:text-ivory">Vitamin C Routine Guide</Link></li>
            <li><Link href="/contact" className="hover:text-ivory">Contact</Link></li>
            <li><Link href="/privacy" className="hover:text-ivory">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-ivory">Terms of Use</Link></li>
            <li><Link href="/disclaimer" className="hover:text-ivory">Disclaimer</Link></li>
            <li><PrivacyChoicesLink className="hover:text-ivory" /></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-site flex flex-col gap-2 py-6 text-xs text-ivory/45 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE.legalName}. All rights reserved.</p>
          <p>Amazon and the Amazon logo are trademarks of Amazon.com, Inc. or its affiliates.</p>
        </div>
      </div>
    </footer>
  );
}
