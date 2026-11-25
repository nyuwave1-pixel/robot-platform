import { product } from "@/data/product";
import type { Locale } from "@/i18n/config";

export type Region = "kr" | "us";
export interface PurchaseLink { region: Region; href: string }

/** 언어별 구매 링크 우선순위 — 영어는 미국 사이트, 그 외는 한국 사이트가 1순위 */
export function purchaseLinks(locale: Locale): { primary: PurchaseLink; secondary?: PurchaseLink } {
  const kr: PurchaseLink | null = product.urls.purchase ? { region: "kr", href: product.urls.purchase } : null;
  const us: PurchaseLink | null = product.urls.purchaseUs ? { region: "us", href: product.urls.purchaseUs } : null;
  const order = locale === "en" ? [us, kr] : [kr, us];
  const [a, b] = order.filter((x): x is PurchaseLink => !!x);
  return { primary: a ?? { region: "kr", href: "#how-to-use" }, secondary: b };
}
