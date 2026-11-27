import { beforeEach, describe, expect, it } from "vitest";
import { applyGrant, cleanProducts, PP_GRANTS } from "../src/platform/ppShop";
import { FASHION_MAP } from "../src/data/game";
import { DEFAULT_LOOK, useGame } from "../src/store/game";

beforeEach(() => {
  useGame.getState().reset();
  useGame.getState().startNew("포인트", DEFAULT_LOOK);
});

// 포털 마이그레이션 20261127220000_game_shop_pp.sql 의 beauty-life 상품과 같아야 한다
const PORTAL_SKUS = ["gems-10", "gems-30", "gems-60", "coins-5000", "item:hair-updo", "item:fit-gown", "item:fit-pure", "item:acc-tiara",
  "item:sh-smoky", "item:lip-berry", "item:goldtable", "item:floor-black", "item:wall-black"];

describe("BIT PARK 포인트 상점", () => {
  it("포털이 파는 상품은 전부 게임이 지급할 수 있고, 아이템 상품은 젬 가격 아이템 전부다", () => {
    for (const s of PORTAL_SKUS) expect(PP_GRANTS[s], s).toBeTruthy();
    expect(Object.keys(PP_GRANTS).sort()).toEqual([...PORTAL_SKUS].sort());
  });
  it("포털 상품 목록은 게임이 아는 sku · 올바른 가격만 받는다", () => {
    const r = cleanProducts([
      { sku: "gems-10", name: "뷰티 젬 10", price: 100, dailyLimit: null },
      { sku: "coins-5000", name: "<b>코인</b>", price: 100, dailyLimit: 5 },
      { sku: "gems-9999", name: "모르는 상품", price: 1 },
      { sku: "gems-30", name: "가격 없음", price: 0 },
      "junk",
    ]);
    expect(r.map((p) => p.sku)).toEqual(["gems-10", "coins-5000"]);
    expect(r[1]).toEqual({ sku: "coins-5000", name: "b코인/b", price: 100, dailyLimit: 5 });
  });
  it("젬 · 코인 팩은 그만큼 지급", () => {
    const g0 = useGame.getState().gems, c0 = useGame.getState().coins;
    expect(applyGrant("gems-30")).toBe("gems");
    expect(applyGrant("coins-5000")).toBe("coins");
    expect(useGame.getState().gems).toBe(g0 + 30);
    expect(useGame.getState().coins).toBe(c0 + 5000);
    expect(applyGrant("nope")).toBeNull();
  });
  it("아이템은 젬 구매와 똑같이 들어오고(젬은 그대로), 이미 가진 것이면 그 값의 젬으로 남는다", () => {
    const g0 = useGame.getState().gems;
    expect(applyGrant("item:lip-berry")).toBe("item");
    expect(useGame.getState().ownedFashion).toContain("lip-berry");
    expect(useGame.getState().gems).toBe(g0);
    expect(applyGrant("item:lip-berry")).toBe("kept-gems");
    expect(useGame.getState().gems).toBe(g0 + FASHION_MAP["lip-berry"].price);
    expect(applyGrant("item:goldtable")).toBe("item");
    expect(useGame.getState().storage.goldtable).toBe(1);
  });
});
