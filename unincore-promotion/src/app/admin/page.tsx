import Link from "next/link";
import { getCmsFresh, getAuditLog } from "@/lib/cms";
import { getStats } from "@/lib/stats";
import { storageMode } from "@/lib/storage";
import { isPromoActive, isPromoUpcoming, formatPromoWindow } from "@/lib/promo";
import { validateAmazonUrl } from "@/lib/amazon";

const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "—");

function Table({ title, rows, note }: { title: string; rows: [string, number, number][]; note?: string }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-sans text-sm font-semibold">{title}</h3>
      {note && <p className="mt-1 text-xs text-ink-mute">{note}</p>}
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-ink-mute">No data yet.</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-mute">
              <th className="py-1 font-medium">Name</th>
              <th className="py-1 text-right font-medium">Views</th>
              <th className="py-1 text-right font-medium">Amazon clicks</th>
              <th className="py-1 text-right font-medium">CTR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, v, c]) => (
              <tr key={name} className="border-t border-ink/5">
                <td className="py-1.5">
                  <div>{name}</div>
                  <div className="mt-1 h-1 rounded bg-citrus/70" style={{ width: `${(v / max) * 100}%` }} />
                </td>
                <td className="py-1.5 text-right tabular-nums">{v}</td>
                <td className="py-1.5 text-right tabular-nums">{c}</td>
                <td className="py-1.5 text-right tabular-nums">{pct(c, v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: d } = await searchParams;
  const days = [7, 30, 90].includes(Number(d)) ? Number(d) : 30;
  const [{ products, settings }, stats, audit] = await Promise.all([getCmsFresh(), getStats(days), getAuditLog()]);
  const mode = storageMode();
  const V = "product_detail_view";
  const C = "amazon_cta_click";
  const sortRows = (obj: Record<string, Record<string, number>>, viewKey = V) =>
    Object.entries(obj)
      .map(([k, v]) => [k, v[viewKey] || v.page_view || 0, v[C] || 0] as [string, number, number])
      .sort((a, b) => b[1] + b[2] - (a[1] + a[2]));

  const productRows = products.map((p) => [p.shortName, stats.byProduct[p.key]?.[V] || 0, stats.byProduct[p.key]?.[C] || 0] as [string, number, number]);
  const totalViews = stats.totals[V] || 0;
  const totalClicks = stats.totals[C] || 0;
  const maxDaily = Math.max(1, ...stats.daily.map((x) => x.views));

  const warnings: string[] = [];
  if (mode === "none") warnings.push("Storage is not configured — CMS edits can't be saved and click stats are not recorded. Connect Upstash Redis (KV_REST_API_URL / KV_REST_API_TOKEN).");
  if (!settings.tracking.ga4Id && !settings.tracking.gtmId) warnings.push("No GA4 or GTM ID set (Settings).");
  if (!settings.tracking.metaPixelId) warnings.push("No Meta Pixel ID set (Settings).");
  for (const p of products) {
    if (!p.asinVerified) warnings.push(`${p.shortName}: ASIN ${p.asin} not yet confirmed against the live Amazon page.`);
    const link = validateAmazonUrl(p.amazonUrl, p.asin);
    if (!link.ok) warnings.push(`${p.shortName}: product link problem — ${link.reason}`);
    if (!p.attribution.default && !p.attribution.meta) warnings.push(`${p.shortName}: no Amazon Attribution link yet — Meta traffic can't be tied to Amazon sales.`);
    const pending = p.claims.filter((c) => c.status === "pending").length + p.ingredients.filter((c) => c.status === "pending").length;
    if (pending) warnings.push(`${p.shortName}: ${pending} claim(s)/ingredient(s) pending verification (hidden from the public page).`);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Dashboard</h1>
          <p className="text-sm text-ink-mute">Landing-page activity, {stats.from} → {stats.to} (US Pacific). Storage: <strong>{mode}</strong></p>
        </div>
        <div className="flex gap-2 text-sm">
          {[7, 30, 90].map((n) => (
            <Link key={n} href={`/admin?days=${n}`} className={`rounded-full px-3 py-1 ${n === days ? "bg-ink text-ivory" : "bg-white"}`}>{n} days</Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm">
        <strong>Note:</strong> these numbers are landing-page events (visits and clicks to Amazon). They are <em>not</em> Amazon sales. Purchases and
        sales are reported only in Amazon Attribution / Seller Central — compare them there, side by side with these clicks.
      </div>

      {warnings.length > 0 && (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-sans text-sm font-semibold">Launch checklist ({warnings.length})</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            {warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Page views", stats.totals.page_view || 0],
          ["Product page views", totalViews],
          ["Amazon clicks", totalClicks],
          ["Click-through rate", pct(totalClicks, totalViews)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-ink-mute">{k}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="font-sans text-sm font-semibold">Daily product views &amp; Amazon clicks</h3>
        <div className="mt-4 flex h-32 items-end gap-[2px]">
          {stats.daily.map((x) => (
            <div key={x.day} className="group relative flex-1" title={`${x.day}: ${x.views} views, ${x.clicks} clicks`}>
              <div className="w-full rounded-t bg-citrus/60" style={{ height: `${(x.views / maxDaily) * 120}px` }} />
              <div className="absolute bottom-0 w-full rounded-t bg-ink" style={{ height: `${(x.clicks / maxDaily) * 120}px` }} />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-mute"><span className="inline-block h-2 w-2 bg-citrus/60" /> views · <span className="inline-block h-2 w-2 bg-ink" /> Amazon clicks</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Table title="By product" rows={productRows} />
        <Table title="By channel (ad source)" rows={sortRows(stats.byChannel)} note="meta = Facebook/Instagram (utm_source or fbclid), google = paid search (gclid)." />
        <Table title="By UTM campaign" rows={sortRows(stats.byCampaign)} />
        <Table title="By utm_source" rows={sortRows(stats.bySource)} />
        <Table title="By device" rows={sortRows(stats.byDevice)} />
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-sans text-sm font-semibold">Amazon clicks by button placement</h3>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {Object.entries(stats.ctaLocations).flatMap(([prod, locs]) =>
                Object.entries(locs).map(([loc, n]) => (
                  <tr key={prod + loc} className="border-t border-ink/5">
                    <td className="py-1.5">{prod}</td>
                    <td className="py-1.5">{loc}</td>
                    <td className="py-1.5 text-right tabular-nums">{n}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
          {Object.keys(stats.ctaLocations).length === 0 && <p className="mt-4 text-sm text-ink-mute">No data yet.</p>}
        </section>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-sans text-sm font-semibold">Products</h2>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-mute">
              <th className="py-1">Product</th><th>Status</th><th>ASIN</th><th>Promotion</th><th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.key} className="border-t border-ink/5">
                <td className="py-2">{p.name}</td>
                <td>{p.published ? "Published" : "Hidden"}</td>
                <td>{p.asin} {p.asinVerified ? "✅" : "⚠️ unverified"}</td>
                <td>
                  {isPromoActive(p.promotion) ? `LIVE ${p.promotion.discountPct}%` : isPromoUpcoming(p.promotion) ? `Scheduled ${p.promotion.discountPct}%` : p.promotion.enabled ? "Ended" : "Off"} · {formatPromoWindow(p.promotion)}
                </td>
                <td className="space-x-3 text-right">
                  <Link className="underline" href={`/admin/products/${p.key}`}>Edit</Link>
                  <Link className="underline" href={`/admin/preview/${p.slug}`}>Preview</Link>
                  <a className="underline" href={`/products/${p.slug}`} target="_blank" rel="noopener">Live</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-ink-mute">SEO: <a className="underline" href="/sitemap.xml" target="_blank">sitemap.xml</a> · <a className="underline" href="/robots.txt" target="_blank">robots.txt</a> — hidden products are removed from the sitemap automatically.</p>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-sans text-sm font-semibold">Recent changes</h2>
        <ul className="mt-3 space-y-1 text-sm text-ink-soft">
          {audit.slice(0, 15).map((a, i) => (
            <li key={i}>{new Date(a.at).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })} — {a.user} {a.action} {a.target}</li>
          ))}
          {audit.length === 0 && <li>No changes yet.</li>}
        </ul>
      </section>
    </div>
  );
}
