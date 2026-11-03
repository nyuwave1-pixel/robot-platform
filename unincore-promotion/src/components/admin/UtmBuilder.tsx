"use client";

import { useMemo, useState } from "react";

const PRESETS = {
  "Meta – Facebook feed": { utm_source: "facebook", utm_medium: "paid_social" },
  "Meta – Instagram": { utm_source: "instagram", utm_medium: "paid_social" },
  "Google Ads": { utm_source: "google", utm_medium: "cpc" },
  Email: { utm_source: "newsletter", utm_medium: "email" },
  Influencer: { utm_source: "influencer", utm_medium: "social" },
} as const;

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export function UtmBuilder({ siteUrl, products }: { siteUrl: string; products: { slug: string; name: string; key: string }[] }) {
  const [page, setPage] = useState(products[0]?.slug || "");
  const [preset, setPreset] = useState<keyof typeof PRESETS>("Meta – Facebook feed");
  const [campaign, setCampaign] = useState("bfcm_2026");
  const [content, setContent] = useState("");
  const [term, setTerm] = useState("");
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    const u = new URL(page ? `/products/${page}` : "/", siteUrl);
    const p = PRESETS[preset];
    u.searchParams.set("utm_source", p.utm_source);
    u.searchParams.set("utm_medium", p.utm_medium);
    if (campaign) u.searchParams.set("utm_campaign", slugify(campaign));
    if (content) u.searchParams.set("utm_content", slugify(content));
    if (term) u.searchParams.set("utm_term", slugify(term));
    return u.toString();
  }, [page, preset, campaign, content, term, siteUrl]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl">UTM campaign links</h1>
        <p className="mt-1 text-sm text-ink-mute">Build consistent ad URLs. For Meta ads you can also use dynamic parameters, e.g. <code>utm_content={"{{ad.name}}"}</code>.</p>
      </div>
      <div className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-2">
        <label><span className="admin-label">Landing page</span>
          <select className="admin-input" value={page} onChange={(e) => setPage(e.target.value)}>
            {products.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            <option value="">Home page</option>
          </select>
        </label>
        <label><span className="admin-label">Channel</span>
          <select className="admin-input" value={preset} onChange={(e) => setPreset(e.target.value as keyof typeof PRESETS)}>
            {Object.keys(PRESETS).map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
        <label><span className="admin-label">utm_campaign</span><input className="admin-input" value={campaign} onChange={(e) => setCampaign(e.target.value)} /></label>
        <label><span className="admin-label">utm_content (ad / creative)</span><input className="admin-input" value={content} placeholder="ugc_video_a" onChange={(e) => setContent(e.target.value)} /></label>
        <label><span className="admin-label">utm_term (audience / keyword)</span><input className="admin-input" value={term} onChange={(e) => setTerm(e.target.value)} /></label>
      </div>
      <div className="rounded-2xl bg-ink p-5 text-ivory">
        <p className="break-all font-mono text-sm">{url}</p>
        <button className="mt-3 rounded-full bg-ivory px-4 py-1.5 text-sm text-ink" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <p className="text-xs text-ink-mute">Short alias for ads: <code>{siteUrl}/?product=mask</code> (also <code>ampoule</code>, <code>wash</code>) redirects to the product page and keeps all UTM parameters.</p>
    </div>
  );
}
