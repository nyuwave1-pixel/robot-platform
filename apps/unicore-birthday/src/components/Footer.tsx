"use client";
import { product } from "@/data/product";
import { useDict, fmt } from "@/i18n/context";

export default function Footer() {
  const t = useDict();
  const trial = t.trialInfo;
  return (
    <footer className="section" style={{ borderTop: "1px solid var(--line)", background: "var(--bg-midnight)", color: "var(--muted)", fontSize: 12, lineHeight: 1.7 }}>
      <div className="section-inner" style={{ paddingBlock: 40, display: "grid", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ font: "500 13px/1 var(--font-serif)", letterSpacing: ".35em", color: "var(--ivory)" }}>{product.brand}</span>
          <nav className="footer-nav" aria-label={t.ui.footerNav}>
            <a href="#clinical">{t.ui.footerLinks.clinical}</a>
            <a href="#ingredients">{t.ui.footerLinks.ingredients}</a>
            <a href="#how-to-use">{t.ui.footerLinks.howto}</a>
            <a href={product.urls.brand} target="_blank" rel="noopener">{t.ui.footerLinks.brand}</a>
          </nav>
        </div>
        <p style={{ margin: 0 }}>
          {fmt(t.ui.footerLegal, { institute: trial.institute, code: trial.code, subjects: trial.subjects, period: trial.period, usage: trial.usage, disclaimer: trial.disclaimer })}
        </p>
        <p style={{ margin: 0 }}>{product.name} {product.volume.g} g / {product.volume.oz} oz · {product.subtitle} · © {t.product.brandLocal}</p>
      </div>
    </footer>
  );
}
