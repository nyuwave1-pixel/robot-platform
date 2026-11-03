"use client";

import { useState } from "react";
import type { SiteSettings } from "@/content/types";

export function SettingsForm({ settings, capiEnabled }: { settings: SiteSettings; capiEnabled: boolean }) {
  const [s, setS] = useState({ tracking: settings.tracking, announcement: settings.announcement, contactEmail: settings.contactEmail, consentMode: settings.consentMode });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setMsg(null);
    setErr(null);
    const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    const data = (await res.json().catch(() => ({}))) as { error?: string; issues?: { path: string; message: string }[] };
    if (res.ok) setMsg("Saved.");
    else setErr([data.error, ...(data.issues || []).map((i) => `${i.path}: ${i.message}`)].filter(Boolean).join(" · "));
  }
  const t = s.tracking;
  const setT = (k: keyof typeof t, v: string) => setS({ ...s, tracking: { ...t, [k]: v.trim() } });

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-4xl">Settings</h1>
      <fieldset className="rounded-2xl bg-white p-5 shadow-sm">
        <legend className="px-1 text-sm font-semibold">Tracking IDs</legend>
        <p className="mb-4 text-xs text-ink-mute">If a GTM container is set, configure GA4 inside GTM (this site then only pushes dataLayer events). Without GTM, GA4 is loaded directly.</p>
        <div className="grid gap-4 md:grid-cols-3">
          <label><span className="admin-label">GA4 Measurement ID</span><input className="admin-input font-mono" placeholder="G-XXXXXXX" value={t.ga4Id} onChange={(e) => setT("ga4Id", e.target.value)} /></label>
          <label><span className="admin-label">GTM Container ID</span><input className="admin-input font-mono" placeholder="GTM-XXXXXX" value={t.gtmId} onChange={(e) => setT("gtmId", e.target.value)} /></label>
          <label><span className="admin-label">Meta Pixel ID</span><input className="admin-input font-mono" placeholder="1234567890" value={t.metaPixelId} onChange={(e) => setT("metaPixelId", e.target.value)} /></label>
        </div>
        <p className="mt-3 text-xs text-ink-mute">Meta Conversions API: {capiEnabled ? "enabled (META_CAPI_ACCESS_TOKEN set)" : "off — set META_CAPI_ACCESS_TOKEN in Vercel env to enable server-side events."}</p>
      </fieldset>
      <fieldset className="rounded-2xl bg-white p-5 shadow-sm">
        <legend className="px-1 text-sm font-semibold">Privacy</legend>
        <label className="block">
          <span className="admin-label">Consent mode</span>
          <select className="admin-input" value={s.consentMode} onChange={(e) => setS({ ...s, consentMode: e.target.value as "opt-out" | "opt-in" })}>
            <option value="opt-out">Opt-out (US standard: tracking on unless visitor opts out or sends GPC)</option>
            <option value="opt-in">Opt-in (nothing loads until the visitor accepts)</option>
          </select>
        </label>
      </fieldset>
      <fieldset className="rounded-2xl bg-white p-5 shadow-sm">
        <legend className="px-1 text-sm font-semibold">Site</legend>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.announcement.enabled} onChange={(e) => setS({ ...s, announcement: { ...s.announcement, enabled: e.target.checked } })} /> Show announcement bar</label>
        <label className="mt-3 block"><span className="admin-label">Announcement text</span><input className="admin-input" value={s.announcement.text} onChange={(e) => setS({ ...s, announcement: { ...s.announcement, text: e.target.value } })} /></label>
        <label className="mt-3 block"><span className="admin-label">Public contact email</span><input className="admin-input" value={s.contactEmail} onChange={(e) => setS({ ...s, contactEmail: e.target.value.trim() })} /></label>
      </fieldset>
      {msg && <p className="text-sm text-green-700">{msg}</p>}
      {err && <p className="text-sm text-red-700">{err}</p>}
      <button onClick={save} className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-ivory">Save settings</button>
    </div>
  );
}
