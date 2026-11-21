import type { Promotion } from "@/content/types";

export function isPromoActive(p: Promotion | undefined, now: Date = new Date()): boolean {
  if (!p || !p.enabled || p.discountPct <= 0) return false;
  const start = Date.parse(p.startsAt);
  const end = Date.parse(p.endsAt);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return false;
  const t = now.getTime();
  return t >= start && t < end;
}

export function isPromoUpcoming(p: Promotion | undefined, now: Date = new Date()): boolean {
  if (!p || !p.enabled) return false;
  const start = Date.parse(p.startsAt);
  return !Number.isNaN(start) && now.getTime() < start;
}

export function formatPromoWindow(p: Promotion): string {
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/Los_Angeles" });
  // endsAt is exclusive; show the last full day.
  const last = new Date(Date.parse(p.endsAt) - 1);
  return `${fmt.format(new Date(p.startsAt))} – ${fmt.format(last)}`;
}
