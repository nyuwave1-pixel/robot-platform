import { beforeEach, describe, expect, it } from "vitest";
import { applyGrant, cleanItems, hasItem, isGemPack, PP_GRANTS } from "../src/platform/ppShop";
import { DEFAULT_LOOK, useGame } from "../src/store/game";

beforeEach(() => {
  useGame.getState().reset();
  useGame.getState().startNew("포인트", DEFAULT_LOOK);
  useGame.setState({ ppGranted: [], ppPending: {} });
});

// 포털 마이그레이션 20261128010000_beauty_life_game_items.sql 의 shop_items id 와 같아야 한다
const PORTAL_IDS = ["beauty-life-gems-10", "beauty-life-gems-30", "beauty-life-gems-60", "beauty-life-hair-updo", "beauty-life-fit-gown",
  "beauty-life-fit-pure", "beauty-life-acc-tiara", "beauty-life-sh-smoky", "beauty-life-lip-berry", "beauty-life-goldtable",
  "beauty-life-floor-black", "beauty-life-wall-black"];

describe("BIT PARK 포인트 상점 (포털 게임 경제)", () => {
  it("포털 상품 id 와 게임 지급표가 정확히 같다 (젬 팩 3 · 젬 가격 아이템 9)", () => {
    expect(Object.keys(PP_GRANTS).sort()).toEqual([...PORTAL_IDS].sort());
    expect(PORTAL_IDS.filter(isGemPack)).toEqual(["beauty-life-gems-10", "beauty-life-gems-30", "beauty-life-gems-60"]);
  });
  it("포털 아이템 목록은 아는 id · P 가격만 받는다", () => {
    const r = cleanItems([
      { id: "beauty-life-gems-10", name: "뷰티 젬 10", price: 100, currency: "PP", owned: false, count: 2, consumable: true },
      { id: "beauty-life-lip-berry", name: "<i>립</i>", price: 150, currency: "PP", owned: true, count: 1, consumable: false },
      { id: "special-soldier-revive", name: "다른 게임", price: 60, currency: "PP" },
      { id: "beauty-life-gems-30", name: "하트 가격", price: 3, currency: "HEART" },
      { id: "beauty-life-gems-60", name: "가격 없음", price: 0, currency: "PP" },
    ]);
    expect(r.map((p) => p.id)).toEqual(["beauty-life-gems-10", "beauty-life-lip-berry"]);
    expect(r[0]).toMatchObject({ count: 2, consumable: true });
    expect(r[1]).toMatchObject({ name: "i립/i", owned: true });
  });
  it("젬 팩은 젬으로", () => {
    const g0 = useGame.getState().gems;
    expect(applyGrant("beauty-life-gems-30")).toBe("gems");
    expect(useGame.getState().gems).toBe(g0 + 30);
    expect(applyGrant("nope")).toBeNull();
  });
  it("아이템은 젬 구매와 같은 경로로 들어오고(젬 그대로), 한 번만 — 저장에 기록되어 다시 동기화해도 안 늘어난다", () => {
    const g0 = useGame.getState().gems;
    expect(applyGrant("beauty-life-lip-berry")).toBe("item");
    expect(useGame.getState().ownedFashion).toContain("lip-berry");
    expect(useGame.getState().gems).toBe(g0);
    expect(applyGrant("beauty-life-lip-berry")).toBe("owned");
    // 가구는 여러 개 둘 수 있어도 포털 아이템은 한 번만
    expect(applyGrant("beauty-life-goldtable")).toBe("item");
    expect(applyGrant("beauty-life-goldtable")).toBe("owned");
    expect(useGame.getState().storage.goldtable).toBe(1);
    expect(hasItem("beauty-life-goldtable")).toBe(true);
    expect(useGame.getState().gems).toBe(g0);
  });
  it("이미 젬으로 산 아이템이면 포털 동기화로 아무것도 더 주지 않는다", () => {
    useGame.setState((s) => ({ ownedFashion: [...s.ownedFashion, "fit-gown"] }));
    const g0 = useGame.getState().gems;
    expect(applyGrant("beauty-life-fit-gown")).toBe("owned");
    expect(useGame.getState().gems).toBe(g0);
  });
});
