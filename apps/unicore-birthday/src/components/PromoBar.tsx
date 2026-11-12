"use client";
import { useEffect, useState } from "react";
import { product } from "@/data/product";
import { promo } from "@/data/promo";
import { useDict, useLocale } from "@/i18n/context";
import { purchaseLinks } from "@/lib/purchase";

const KEY = "uc.promoClosed.v1";

/** 상단 띠 배너 — 런칭 프로모션 안내 + 구매 페이지 연결. 닫으면 세션 동안 숨김 */
export default function PromoBar() {
  const t = useDict();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (!promo.enabled || !product.urls.purchase) return;
    let closed = false;
    try { closed = sessionStorage.getItem(KEY) === "1"; } catch {}
    if (closed) return;
    setOpen(true);
    const tick = () => setLive(Date.now() >= new Date(promo.openAt).getTime());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.promo = open ? "on" : "off";
    return () => { delete document.documentElement.dataset.promo; };
  }, [open]);
  if (!open) return null;
  const p = t.ui.promo;
  const close = () => { setOpen(false); try { sessionStorage.setItem(KEY, "1"); } catch {} };
  const links = purchaseLinks(locale);
  const order = links.secondary ? [links.primary, links.secondary] : [links.primary];
  const lab = (r: "kr" | "us", short: boolean) => (r === "kr" ? (short ? p.ctaKrShort : p.ctaKr) : (short ? p.ctaUsShort : p.ctaUs));
  return (
    <div className="promo-bar" role="region" aria-label={p.badge}>
      <a className="promo-bar-link" href={links.primary.href} target="_blank" rel="noopener">
        <span className="promo-bar-badge">{p.badge}</span>
        <span className="promo-bar-text">
          <b>{p.text}</b>
          <b className="promo-bar-short">{p.textShort}</b>
          <span className="promo-bar-when">{live ? p.live : p.open}</span>
        </span>
      </a>
      <span className="promo-bar-ctas">
        {order.map((l) => (
          <a key={l.region} className="promo-bar-cta" href={l.href} target="_blank" rel="noopener" data-region={l.region} title={lab(l.region, false)}>
            <span className="promo-bar-cta-full">{lab(l.region, false)}</span><span className="promo-bar-cta-short">{lab(l.region, true)}</span> →
          </a>
        ))}
      </span>
      <button type="button" className="promo-bar-close" onClick={close} aria-label={p.close} title={p.close}>×</button>
    </div>
  );
}
