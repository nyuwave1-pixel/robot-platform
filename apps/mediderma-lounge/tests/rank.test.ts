import { beforeEach, describe, expect, it } from "vitest";
import { tune } from "../src/data/config";
import { RANKS, gtvOf, rankFor } from "../src/data/game";
import { PRODUCTS, usesOf } from "../src/data/products";
import { DEFAULT_LOOK, pvOf, rankBonus, useGame } from "../src/store/game";

const g = () => useGame.getState();
beforeEach(() => { g().reset(); g().startNew("테스트", DEFAULT_LOOK); });

describe("라운지 등급", () => {
  it("직급 10단계의 이름·코드·순서가 공식 안내서와 같고, 기준은 단계마다 커진다", () => {
    expect(RANKS.map((r) => r.code)).toEqual(["M", "TM", "DR", "ED", "ID", "VP", "IVP", "PD", "IPD", "CEO"]);
    expect(RANKS[0].ko).toBe("매니저");
    expect(RANKS[9].ko).toBe("최고경영자");
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].gtv).toBeGreaterThan(RANKS[i - 1].gtv);
      expect(RANKS[i].stv).toBeGreaterThanOrEqual(RANKS[i - 1].stv);
      expect(RANKS[i].coins).toBeGreaterThan(RANKS[i - 1].coins);
    }
  });
  it("세 기준을 모두 채워야 승급한다", () => {
    expect(rankFor({ buy: 0, use: 0, cust: 0 })).toBe(0);
    expect(rankFor({ buy: 100, use: 0, cust: 0 })).toBe(1);
    expect(rankFor({ buy: 5000, use: 0, cust: 0 })).toBe(1); // 고객 등록 포인트가 없으면 팀 매니저가 못 된다
    expect(rankFor({ buy: 5000, use: 0, cust: 50 })).toBe(2); // 소비 PV 가 없으면 디렉터가 못 된다
    expect(rankFor({ buy: 800, use: 100, cust: 100 })).toBe(3);
    expect(gtvOf({ buy: 1, use: 2, cust: 3 })).toBe(6);
  });
  it("제품 구매와 소비가 PV 로 쌓인다", () => {
    const p = PRODUCTS.find((x) => x.priceKRW >= 30000)!;
    useGame.setState({ coins: 99999, stage: 5 });
    const had = g().inventory[p.id] ?? 0;
    expect(g().buyProduct(p.id)).toBe(true);
    expect(g().pv.buy).toBe(pvOf(p.id));
    expect(g().inventory[p.id]).toBe(had + usesOf(p.id));
    expect(g().consume(p.id)).toBe(true);
    expect(g().pv.use).toBeCloseTo(pvOf(p.id) / usesOf(p.id));
  });
  it("승급하면 건너뛴 등급의 보너스까지 한 번만 받는다", () => {
    const c0 = g().coins, g0 = g().gems;
    g().addPV({ buy: 600, cust: 60 });
    expect(g().rank).toBe(2);
    expect(g().rankNotice).toBe(2);
    expect(g().coins).toBe(c0 + RANKS[0].coins + RANKS[1].coins);
    expect(g().gems).toBe(g0 + RANKS[0].gems + RANKS[1].gems);
    g().addPV({ buy: 1 });
    expect(g().coins).toBe(c0 + RANKS[0].coins + RANKS[1].coins);
  });
  it("등급이 높을수록 보너스가 크고, 구독 보너스는 하루 한 번이다", () => {
    expect(rankBonus(0)).toBe(1);
    expect(rankBonus(5)).toBeGreaterThan(rankBonus(2));
    expect(g().claimSalary()).toBe(0); // 등급 없음
    g().addPV({ buy: 100 });
    const c = g().coins;
    expect(g().claimSalary()).toBe(tune("rank.salary_per_rank"));
    expect(g().coins).toBe(c + tune("rank.salary_per_rank"));
    expect(g().claimSalary()).toBe(0);
  });
  it("고객 케어는 별점만큼 등록 포인트를 준다", () => {
    g().finishCare({ routineId: null, modes: [], gain: {}, coins: 10, customer: { name: "A", type: "office", stars: 5, lp: 5 } });
    expect(g().pv.cust).toBe(5 * tune("rank.customer_pv_per_star"));
  });
  it("선물 코드는 한 번만 등록된다", () => {
    const c = g().coins;
    expect(g().redeem("nope")).toBe(0);
    expect(g().redeem(" bungabunga ")).toBe(10_000_000);
    expect(g().coins).toBe(c + 10_000_000);
    expect(g().redeem("BUNGABUNGA")).toBe(-1);
    expect(g().coins).toBe(c + 10_000_000);
  });
});
