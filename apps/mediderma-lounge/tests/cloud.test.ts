import { describe, expect, it } from "vitest";
import { SAVE_KEYS, applyBundle, bundle, normPin } from "../src/net/cloud";

const save = (state: Record<string, unknown>) => JSON.stringify({ state, version: 1 });

describe("클라우드 백업 · 기기 이전", () => {
  it("세 세이브를 묶고 피드 사진은 빼며, 요약을 만든다", () => {
    const store: Record<string, string> = {
      [SAVE_KEYS[0]]: save({ started: true, name: "미나", stage: 3, coins: 1200, lounge: { level: 2 }, posts: [{ id: "a", img: "data:image/jpeg;base64,xxx", text: "hi" }] }),
      [SAVE_KEYS[1]]: save({ garden: [] }),
    };
    const b = bundle((k) => store[k] ?? null)!;
    expect(Object.keys(b.data).sort()).toEqual([SAVE_KEYS[0], SAVE_KEYS[1]].sort());
    expect(((b.data[SAVE_KEYS[0]] as { state: { posts: { img?: string }[] } }).state.posts[0].img)).toBeUndefined();
    expect(b.meta).toEqual({ name: "미나", stage: 3, level: 2, coins: 1200 });
  });
  it("시작 안 한 게임 · 깨진 세이브는 백업하지 않는다", () => {
    expect(bundle((k) => (k === SAVE_KEYS[0] ? save({ started: false }) : null))).toBeNull();
    expect(bundle((k) => (k === SAVE_KEYS[0] ? "{broken" : null))).toBeNull();
  });
  it("넘겨받을 때는 아는 키 · 객체만 쓴다", () => {
    const out: Record<string, string> = {};
    const n = applyBundle({ [SAVE_KEYS[0]]: { state: { started: true }, version: 1 }, evil: { state: {} }, [SAVE_KEYS[1]]: "str" }, (k, v) => { out[k] = v; });
    expect(n).toBe(1);
    expect(Object.keys(out)).toEqual([SAVE_KEYS[0]]);
    expect(normPin("ab-cd 23 45x")).toBe("ABCD2345");
  });
});

describe("비트파크 계정 연결", async () => {
  const { cleanLink } = await import("../src/platform/status");
  it("포털이 준 연결은 형식이 맞을 때만", () => {
    expect(cleanLink({ code: "ABC123", secret: "a".repeat(32) })).toEqual({ code: "ABC123", secret: "a".repeat(32) });
    expect(cleanLink({ code: "abc123", secret: "a".repeat(32) })).toBeNull();
    expect(cleanLink({ code: "ABC123", secret: "zz" })).toBeNull();
    expect(cleanLink({})).toBeNull();
  });
});
