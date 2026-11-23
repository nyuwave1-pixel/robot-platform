import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { sanitizeEvent } from "../../src/lib/events";
import { aggregate } from "../../src/server/stats";

describe("extended anonymous analytics", () => {
  it("keeps only allowed categorical props", () => {
    const e = sanitizeEvent({ type: "profile_done", sid: "s1", locale: "ko", props: { age: "3", skin: "oily", who: "self", makeup: false, email: "a@b.c", score: 77 } });
    expect(e?.props).toEqual({ age: "3", skin: "oily", who: "self", makeup: false });
    const v = sanitizeEvent({ type: "visit", sid: "s1", locale: "ko", props: { source: "instagram.com/p/secret?x=1" } });
    expect(v?.props?.source).not.toMatch(/[/?=]/);
  });
  it("builds a session funnel and breakdowns", async () => {
    const ev = (type: string, sid: string, props: Record<string, unknown> = {}) => ({ id: 0, ts: "2026-11-23T01:00:00.000Z", type, sid, locale: "ko", country: "KR", props }) as never;
    const s = aggregate([
      ev("visit", "a", { device: "mobile", source: "direct" }), ev("visit", "b", { device: "desktop", source: "naver.com" }),
      ev("consent_given", "a", { history: true }), ev("profile_done", "a", { age: "2", skin: "dry" }),
      ev("photo_selected", "a", { source: "camera" }), ev("analysis_started", "a"), ev("analysis_succeeded", "a"),
      ev("report_viewed", "a"), ev("trial_click", "a"), ev("tech_view", "b", { tech: ["rf"] }),
    ]);
    expect(s.funnel.map((f) => f.sessions)).toEqual([2, 1, 1, 1, 1, 1, 1, 1]);
    expect(s.funnel[1].fromPrev).toBe(50);
    expect(s.devices).toEqual(expect.arrayContaining([{ key: "mobile", count: 1 }, { key: "desktop", count: 1 }]));
    expect(s.consent.historyOptInRate).toBe(100);
    expect(s.hours[10].count).toBe(1); // 01시 UTC = 10시 KST
    expect(s.techViews).toEqual([{ key: "rf", count: 1 }]);
  });
});

describe("funnel with sessions recorded before the extended events", () => {
  it("counts earlier steps as passed and ignores actions without a result", () => {
    const ev = (type: string, sid: string) => ({ id: 0, ts: "2026-11-23T01:00:00.000Z", type, sid, locale: "ko", country: "KR", props: {} }) as never;
    const s = aggregate([ev("analysis_started", "old"), ev("analysis_succeeded", "old"), ev("visit", "x"), ev("trial_click", "x")]);
    expect(s.funnel.map((f) => f.sessions)).toEqual([2, 1, 1, 1, 1, 1, 0, 0]);
    expect(s.funnel.every((f) => f.fromPrev === null || f.fromPrev <= 100)).toBe(true);
  });
});
