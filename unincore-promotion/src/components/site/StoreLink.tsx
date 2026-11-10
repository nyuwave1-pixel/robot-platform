"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SITE } from "@/content/site";
import { track } from "@/lib/analytics";
import { AmazonLogo } from "@/components/landing/AmazonLogo";
import { AmazonButton, type AmazonProduct } from "./AmazonButton";

/**
 * Outbound link to UNI&CORE on Amazon (all three products), for calls to action
 * that are not tied to one product: the home hero and the header.
 */
export function StoreLink({
  location,
  className = "",
  children,
  decorative = false,
}: {
  location: string;
  className?: string;
  children?: ReactNode;
  /** A click area that repeats a visible button: kept out of the tab order and the accessibility tree. */
  decorative?: boolean;
}) {
  const href = SITE.amazonStore;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={className}
      data-cta={location}
      tabIndex={decorative ? -1 : undefined}
      aria-hidden={decorative || undefined}
      onClick={() => track("amazon_cta_click", { url: href, location })}
    >
      {children}
      {!decorative && <span className="sr-only"> (opens Amazon.com in a new tab)</span>}
    </a>
  );
}

/** Anything that does its own thing on click keeps it: links, buttons, form fields, video, the intro, drag-to-turn products. */
const OWN_CLICK =
  'a, button, input, select, textarea, label, summary, details, video, audio, iframe, [role="button"], [role="link"], [role="slider"], [role="tab"], [role="dialog"], [contenteditable="true"], [tabindex]:not([tabindex="-1"]), [data-no-store-link]';

/**
 * Makes the page background a link to UNI&CORE on Amazon: a click on anything inside
 * #main that is not itself clickable opens the store in a new tab. Mounted on the home page.
 */
export function PageBackgroundLink({ rootId = "main", location = "page-background" }: { rootId?: string; location?: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    root.classList.add("store-bg");
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as Element | null;
      if (!target || target.closest(OWN_CLICK)) return;
      if (window.getSelection()?.toString()) return; // the visitor was selecting text
      const href = SITE.amazonStore;
      track("amazon_cta_click", { url: href, location });
      window.open(href, "_blank", "noopener");
    };
    root.addEventListener("click", onClick);
    return () => {
      root.removeEventListener("click", onClick);
      root.classList.remove("store-bg");
    };
  }, [rootId, location]);
  return null;
}

/** The orange "Shop Now on amazon" button, linking to UNI&CORE on Amazon. */
export function StoreCta({ location, label = "Shop Now on", className = "" }: { location: string; label?: string; className?: string }) {
  return (
    <StoreLink location={location} className={`amz-btn ${className}`}>
      <span>{label}</span>
      <AmazonLogo title="Amazon" smile="currentColor" />
    </StoreLink>
  );
}

/**
 * Header button in the same orange Amazon style. On a product page it opens that
 * product's listing; everywhere else it opens UNI&CORE on Amazon.
 */
export function HeaderShop({ products }: { products: (AmazonProduct & { slug: string })[] }) {
  const pathname = usePathname();
  const product = products.find((p) => pathname === `/products/${p.slug}`);
  const cls = "amz-btn amz-sm !min-h-[40px] !px-4 !text-[14px] hidden md:inline-flex";
  const inner = (
    <>
      <span>Shop on</span>
      <AmazonLogo title="Amazon" smile="currentColor" />
    </>
  );
  return product ? (
    <AmazonButton product={product} location="header" className={cls}>
      {inner}
    </AmazonButton>
  ) : (
    <StoreLink location="header" className={cls}>
      {inner}
    </StoreLink>
  );
}
