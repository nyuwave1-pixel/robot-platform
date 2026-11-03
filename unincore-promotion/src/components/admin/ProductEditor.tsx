"use client";

import { useMemo, useState } from "react";
import type { ProductContent } from "@/content/types";
import type { Role } from "@/lib/session";
import { validateAmazonUrl } from "@/lib/amazon";
import { formatPromoWindow, isPromoActive } from "@/lib/promo";

type Editable = Pick<
  ProductContent,
  | "published" | "asin" | "asinVerified" | "amazonUrl" | "attribution" | "heroEyebrow" | "heroHeadline" | "heroSub" | "tagline" | "heroImage"
  | "benefits" | "differentiators" | "claims" | "claimsNote" | "ingredients" | "beforeAfter" | "videos" | "faqs" | "promotion" | "seo"
> & { price?: ProductContent["price"] | null };

type FieldSpec = { key: string; label: string; type?: "text" | "textarea" | "status" | "url" };

function pickEditable(p: ProductContent): Editable {
  return {
    published: p.published, asin: p.asin, asinVerified: p.asinVerified, amazonUrl: p.amazonUrl, attribution: { ...p.attribution },
    heroEyebrow: p.heroEyebrow, heroHeadline: p.heroHeadline, heroSub: p.heroSub, tagline: p.tagline, heroImage: p.heroImage || "",
    benefits: p.benefits, differentiators: p.differentiators, claims: p.claims, claimsNote: p.claimsNote, ingredients: p.ingredients, beforeAfter: p.beforeAfter,
    videos: p.videos, faqs: p.faqs, promotion: { ...p.promotion, amazonUrl: p.promotion.amazonUrl || "", couponNote: p.promotion.couponNote || "" },
    seo: { ...p.seo, ogImage: p.seo.ogImage || "" }, price: p.price ?? null,
  };
}

/** datetime-local <-> ISO with US Pacific offset (-08:00 standard / -07:00 daylight). */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d);
  const g = (t: string) => parts.find((x) => x.type === t)?.value;
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}
function fromLocalInput(v: string) {
  // Determine Pacific offset for that wall time by probing both candidates.
  for (const off of ["-08:00", "-07:00"]) {
    const iso = `${v}:00${off}`;
    if (toLocalInput(iso) === v) return iso;
  }
  return `${v}:00-08:00`;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="admin-label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-mute">{hint}</span>}
    </label>
  );
}

function ListEditor<T extends Record<string, unknown>>({ title, items, fields, blank, onChange, help }: { title: string; items: T[]; fields: FieldSpec[]; blank: T; onChange: (v: T[]) => void; help?: string }) {
  const update = (i: number, k: string, v: unknown) => onChange(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  return (
    <fieldset className="rounded-2xl bg-white p-5 shadow-sm">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {help && <p className="mb-3 text-xs text-ink-mute">{help}</p>}
      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl border border-ink/10 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              {fields.map((f) => (
                <Field key={f.key} label={f.label}>
                  {f.type === "textarea" ? (
                    <textarea className="admin-input min-h-[80px]" value={String(it[f.key] ?? "")} onChange={(e) => update(i, f.key, e.target.value)} />
                  ) : f.type === "status" ? (
                    <select className="admin-input" value={String(it[f.key] ?? "pending")} onChange={(e) => update(i, f.key, e.target.value)}>
                      <option value="pending">Pending verification (hidden)</option>
                      <option value="verified">Verified (public)</option>
                    </select>
                  ) : (
                    <input className="admin-input" value={String(it[f.key] ?? "")} onChange={(e) => update(i, f.key, e.target.value)} />
                  )}
                </Field>
              ))}
            </div>
            <div className="mt-3 flex gap-3 text-xs">
              <button type="button" className="underline" disabled={i === 0} onClick={() => { const n = [...items]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; onChange(n); }}>Move up</button>
              <button type="button" className="text-red-700 underline" onClick={() => onChange(items.filter((_, j) => j !== i))}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="mt-4 rounded-full border border-ink/20 px-4 py-1.5 text-sm" onClick={() => onChange([...items, { ...blank, ...(blank.id !== undefined ? { id: `item-${Date.now().toString(36)}` } : {}) }])}>
        + Add
      </button>
    </fieldset>
  );
}

export function ProductEditor({ product, role }: { product: ProductContent; role: Role }) {
  const [v, setV] = useState<Editable>(() => pickEditable(product));
  const [msg, setMsg] = useState<{ ok: boolean; text: string; issues?: { path: string; message: string }[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Editable>(k: K, val: Editable[K]) => setV((s) => ({ ...s, [k]: val }));
  const isAdmin = role === "admin";

  const linkChecks = useMemo(() => {
    const entries: [string, string | undefined][] = [
      ["Product URL", v.amazonUrl],
      ["Attribution – default", v.attribution.default],
      ["Attribution – Meta", v.attribution.meta],
      ["Attribution – Google", v.attribution.google],
      ["Attribution – Email", v.attribution.email],
      ["Promotion URL", v.promotion.amazonUrl],
    ];
    return entries.filter(([, u]) => u).map(([k, u]) => [k, validateAmazonUrl(u!, v.asin)] as const);
  }, [v]);

  async function save() {
    setBusy(true);
    setMsg(null);
    const clean = (o: object) => Object.fromEntries(Object.entries(o).filter(([, x]) => x));
    const payload = {
      ...v,
      heroImage: v.heroImage || undefined,
      attribution: clean(v.attribution),
      promotion: { ...v.promotion, amazonUrl: v.promotion.amazonUrl || undefined, couponNote: v.promotion.couponNote || undefined },
      seo: { ...v.seo, ogImage: v.seo.ogImage || undefined, keywords: v.seo.keywords.filter(Boolean) },
      videos: v.videos.map((x) => ({ ...x, duration: x.duration || undefined })),
    };
    const res = await fetch(`/api/admin/products/${product.key}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = (await res.json().catch(() => ({}))) as { error?: string; issues?: { path: string; message: string }[] };
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: "Saved. Public pages update within seconds." } : { ok: false, text: data.error || "Save failed.", issues: data.issues });
  }

  async function reset() {
    if (!confirm("Reset this product to the default content? All CMS edits for this product will be removed.")) return;
    const res = await fetch(`/api/admin/products/${product.key}`, { method: "DELETE" });
    if (res.ok) window.location.reload();
    else setMsg({ ok: false, text: ((await res.json().catch(() => ({}))) as { error?: string }).error || "Reset failed." });
  }

  const promoLive = isPromoActive(v.promotion);

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-5 flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 bg-[#F6F3EE]/95 px-5 py-3 backdrop-blur">
        <div>
          <h1 className="font-display text-3xl">{product.name}</h1>
          <p className="text-xs text-ink-mute">/products/{product.slug}</p>
        </div>
        <div className="flex gap-2">
          <a href={`/admin/preview/${product.slug}`} target="_blank" className="rounded-full border border-ink/20 px-4 py-2 text-sm">Preview (incl. pending)</a>
          {isAdmin && <button onClick={reset} className="rounded-full border border-red-300 px-4 py-2 text-sm text-red-700">Reset</button>}
          <button onClick={save} disabled={busy} className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-ivory disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>

      {msg && (
        <div role="status" className={`rounded-xl p-4 text-sm ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {msg.text}
          {msg.issues && <ul className="mt-2 list-disc pl-5">{msg.issues.map((i) => <li key={i.path + i.message}><code>{i.path}</code>: {i.message}</li>)}</ul>}
        </div>
      )}

      <fieldset className="rounded-2xl bg-white p-5 shadow-sm">
        <legend className="px-1 text-sm font-semibold">Publishing &amp; Amazon links</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={v.published} onChange={(e) => set("published", e.target.checked)} /> Published (visible + in sitemap)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" disabled={!isAdmin} checked={v.asinVerified} onChange={(e) => set("asinVerified", e.target.checked)} />
            ASIN verified on the live Amazon page {isAdmin ? "" : "(admin only)"}
          </label>
          <Field label="ASIN" hint="10 characters. Every Amazon link below must point to this ASIN.">
            <input className="admin-input font-mono" disabled={!isAdmin} value={v.asin} onChange={(e) => set("asin", e.target.value.toUpperCase())} />
          </Field>
          <Field label="Amazon product URL">
            <input className="admin-input" value={v.amazonUrl} onChange={(e) => set("amazonUrl", e.target.value)} />
          </Field>
          {(["default", "meta", "google", "email"] as const).map((ch) => (
            <Field key={ch} label={`Amazon Attribution link — ${ch}`} hint={ch === "default" ? "Used for any visitor without a channel-specific link." : `Used when the visitor came from ${ch} (UTM/click id).`}>
              <input className="admin-input" value={v.attribution[ch] || ""} placeholder="https://www.amazon.com/dp/…?maas=…&ref_=aa_maas" onChange={(e) => set("attribution", { ...v.attribution, [ch]: e.target.value })} />
            </Field>
          ))}
        </div>
        <ul className="mt-4 space-y-1 text-xs">
          {linkChecks.map(([k, r]) => (
            <li key={k} className={r.ok ? "text-green-700" : "text-red-700"}>{r.ok ? "✓" : "✗"} {k}{!r.ok && ` — ${r.reason}`}</li>
          ))}
        </ul>
      </fieldset>

      <fieldset className="rounded-2xl bg-white p-5 shadow-sm">
        <legend className="px-1 text-sm font-semibold">Promotion (BFCM etc.) {promoLive && <span className="ml-2 rounded bg-green-600 px-2 py-0.5 text-xs text-white">LIVE NOW</span>}</legend>
        <p className="mb-3 text-xs text-ink-mute">Times are US Pacific. The page switches automatically at start/end. Display only — confirm the deal is live on Amazon; never enter a computed sale price.</p>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex items-center gap-2 text-sm md:col-span-3">
            <input type="checkbox" checked={v.promotion.enabled} onChange={(e) => set("promotion", { ...v.promotion, enabled: e.target.checked })} /> Promotion enabled
          </label>
          <Field label="Name"><input className="admin-input" value={v.promotion.name} onChange={(e) => set("promotion", { ...v.promotion, name: e.target.value })} /></Field>
          <Field label="Starts (Pacific)"><input type="datetime-local" className="admin-input" value={toLocalInput(v.promotion.startsAt)} onChange={(e) => set("promotion", { ...v.promotion, startsAt: fromLocalInput(e.target.value) })} /></Field>
          <Field label="Ends (Pacific, exclusive)"><input type="datetime-local" className="admin-input" value={toLocalInput(v.promotion.endsAt)} onChange={(e) => set("promotion", { ...v.promotion, endsAt: fromLocalInput(e.target.value) })} /></Field>
          <Field label="Discount %"><input type="number" min={0} max={90} className="admin-input" value={v.promotion.discountPct} onChange={(e) => set("promotion", { ...v.promotion, discountPct: Number(e.target.value) })} /></Field>
          <Field label="Headline"><input className="admin-input" value={v.promotion.headline} onChange={(e) => set("promotion", { ...v.promotion, headline: e.target.value })} /></Field>
          <Field label="Coupon note"><input className="admin-input" value={v.promotion.couponNote || ""} onChange={(e) => set("promotion", { ...v.promotion, couponNote: e.target.value })} /></Field>
          <div className="md:col-span-2"><Field label="Detail"><textarea className="admin-input" value={v.promotion.detail} onChange={(e) => set("promotion", { ...v.promotion, detail: e.target.value })} /></Field></div>
          <Field label="Promo-specific Amazon URL (optional)"><input className="admin-input" value={v.promotion.amazonUrl || ""} onChange={(e) => set("promotion", { ...v.promotion, amazonUrl: e.target.value })} /></Field>
        </div>
        <p className="mt-3 text-xs text-ink-mute">Window: {formatPromoWindow(v.promotion)}</p>
      </fieldset>

      <fieldset className="rounded-2xl bg-white p-5 shadow-sm">
        <legend className="px-1 text-sm font-semibold">Hero</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow"><input className="admin-input" value={v.heroEyebrow} onChange={(e) => set("heroEyebrow", e.target.value)} /></Field>
          <Field label="Headline (H1)"><input className="admin-input" value={v.heroHeadline} onChange={(e) => set("heroHeadline", e.target.value)} /></Field>
          <div className="md:col-span-2"><Field label="Sub copy"><textarea className="admin-input" value={v.heroSub} onChange={(e) => set("heroSub", e.target.value)} /></Field></div>
          <Field label="Tagline"><input className="admin-input" value={v.tagline} onChange={(e) => set("tagline", e.target.value)} /></Field>
          <Field label="Product photo URL" hint="Transparent PNG/WebP, 4:5. https:// on *.unincore.com / Vercel Blob, or /path in /public. Empty = illustrated packshot.">
            <input className="admin-input" value={v.heroImage || ""} onChange={(e) => set("heroImage", e.target.value)} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl bg-white p-5 shadow-sm">
        <legend className="px-1 text-sm font-semibold">SEO</legend>
        <div className="grid gap-4">
          <Field label={`Title (${v.seo.title.length}/60 recommended)`}><input className="admin-input" value={v.seo.title} onChange={(e) => set("seo", { ...v.seo, title: e.target.value })} /></Field>
          <Field label={`Meta description (${v.seo.description.length}/155 recommended)`}><textarea className="admin-input" value={v.seo.description} onChange={(e) => set("seo", { ...v.seo, description: e.target.value })} /></Field>
          <Field label="Keywords (comma separated)"><input className="admin-input" value={v.seo.keywords.join(", ")} onChange={(e) => set("seo", { ...v.seo, keywords: e.target.value.split(",").map((s) => s.trim()) })} /></Field>
          <Field label="OG image URL (optional, 1200×630)"><input className="admin-input" value={v.seo.ogImage || ""} onChange={(e) => set("seo", { ...v.seo, ogImage: e.target.value })} /></Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Verified Amazon price (USD, optional)" hint="Only for Product schema. Copy from the live listing; leave empty if unsure.">
              <input className="admin-input" value={v.price?.amount || ""} onChange={(e) => set("price", e.target.value ? { amount: e.target.value, currency: "USD", verifiedAt: new Date().toISOString().slice(0, 10) } : null)} />
            </Field>
          </div>
          <div className="rounded-xl bg-cream p-4 text-sm">
            <p className="text-[#1a0dab]">{v.seo.title}</p>
            <p className="text-xs text-green-800">promotion.unincore.com › products › {product.slug}</p>
            <p className="text-ink-soft">{v.seo.description}</p>
          </div>
        </div>
      </fieldset>

      <ListEditor title="Test results & sales claims" help="Set to Verified only after matching the number to the source document. Pending items are never shown publicly." items={v.claims as unknown as Record<string, unknown>[]} blank={{ id: "", value: "", label: "", detail: "", source: "", status: "pending" }}
        fields={[{ key: "value", label: "Figure" }, { key: "label", label: "Label" }, { key: "detail", label: "Detail" }, { key: "source", label: "Source / footnote", type: "textarea" }, { key: "status", label: "Status", type: "status" }]}
        onChange={(x) => set("claims", x as unknown as Editable["claims"])} />
      <Field label="Results disclaimer"><textarea className="admin-input" value={v.claimsNote} onChange={(e) => set("claimsNote", e.target.value)} /></Field>

      <ListEditor title="Before & After photos" help="Only original, unretouched images from the test report or with customer permission." items={v.beforeAfter as unknown as Record<string, unknown>[]} blank={{ id: "", before: "", after: "", beforeLabel: "Day 0", afterLabel: "Day 7", alt: "", caption: "", status: "pending" }}
        fields={[{ key: "before", label: "Before image URL" }, { key: "after", label: "After image URL" }, { key: "beforeLabel", label: "Before label" }, { key: "afterLabel", label: "After label" }, { key: "alt", label: "Alt text" }, { key: "caption", label: "Caption" }, { key: "status", label: "Status", type: "status" }]}
        onChange={(x) => set("beforeAfter", x as unknown as Editable["beforeAfter"])} />

      <ListEditor title="UGC / product videos" help="MP4 (H.264) 9:16, under ~8 MB. Poster image required. Upload date YYYY-MM-DD (used for VideoObject schema)." items={v.videos as unknown as Record<string, unknown>[]} blank={{ id: "", src: "", poster: "", title: "", description: "", uploadDate: new Date().toISOString().slice(0, 10), duration: "", creator: "", status: "pending" }}
        fields={[{ key: "src", label: "Video URL" }, { key: "poster", label: "Poster image URL" }, { key: "title", label: "Title" }, { key: "creator", label: "Creator (@handle)" }, { key: "description", label: "Description", type: "textarea" }, { key: "uploadDate", label: "Upload date" }, { key: "duration", label: "Duration (PT0M30S)" }, { key: "status", label: "Status (usage rights confirmed?)", type: "status" }]}
        onChange={(x) => set("videos", x as unknown as Editable["videos"])} />

      <ListEditor title="Key ingredients" help="Match the US INCI list on the label before marking Verified." items={v.ingredients as unknown as Record<string, unknown>[]} blank={{ name: "", inci: "", role: "", detail: "", status: "pending" }}
        fields={[{ key: "name", label: "Name" }, { key: "inci", label: "INCI" }, { key: "role", label: "Role" }, { key: "detail", label: "Detail", type: "textarea" }, { key: "status", label: "Status", type: "status" }]}
        onChange={(x) => set("ingredients", x as unknown as Editable["ingredients"])} />
      <ListEditor title="Key benefits" items={v.benefits as unknown as Record<string, unknown>[]} blank={{ title: "", text: "" }} fields={[{ key: "title", label: "Title" }, { key: "text", label: "Text", type: "textarea" }]} onChange={(x) => set("benefits", x as unknown as Editable["benefits"])} />
      <ListEditor title="What makes it different" items={v.differentiators as unknown as Record<string, unknown>[]} blank={{ title: "", text: "" }} fields={[{ key: "title", label: "Title" }, { key: "text", label: "Text", type: "textarea" }]} onChange={(x) => set("differentiators", x as unknown as Editable["differentiators"])} />
      <ListEditor title="FAQ" help="Also emitted as FAQPage structured data. Keep answers identical to what's on the page." items={v.faqs as unknown as Record<string, unknown>[]} blank={{ q: "", a: "" }} fields={[{ key: "q", label: "Question" }, { key: "a", label: "Answer", type: "textarea" }]} onChange={(x) => set("faqs", x as unknown as Editable["faqs"])} />

      <div className="flex justify-end">
        <button onClick={save} disabled={busy} className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-ivory disabled:opacity-60">{busy ? "Saving…" : "Save changes"}</button>
      </div>
    </div>
  );
}
