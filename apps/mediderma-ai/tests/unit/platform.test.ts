import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { deviceType, platformPayload } from "../../src/server/platform";
import { sanitizeEvent } from "../../src/lib/events";

describe("통합 관리자 전달(익명 집계)", () => {
  it("기기 종류만 판별한다", () => {
    expect(deviceType("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148")).toBe("mobile");
    expect(deviceType("Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Safari/537.36")).toBe("tablet");
    expect(deviceType("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe("tablet");
    expect(deviceType("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130")).toBe("desktop");
    expect(deviceType(null)).toBe("unknown");
  });
  it("세션 ID 는 보내지 않는다", () => {
    const ev = sanitizeEvent({ type: "analysis_succeeded", sid: "abc123", locale: "ko", props: { concerns: ["poreVisibility"] } })!;
    const p = platformPayload(ev, "KR", "Mozilla/5.0 (iPhone) Mobile");
    expect(p).toEqual({ type: "analysis_succeeded", country: "KR", device: "mobile", locale: "ko", props: { concerns: ["poreVisibility"] } });
    expect(JSON.stringify(p)).not.toContain("abc123");
  });
});
