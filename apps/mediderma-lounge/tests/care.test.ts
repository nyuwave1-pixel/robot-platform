import { beforeEach, describe, expect, it } from "vitest";
import { tune } from "../src/data/config";
import { ROUTINE_MAP } from "../src/data/devices";
import { CUSTOMER_TYPES } from "../src/data/game";
import { addProgress, applyProduct, availableProduct, beginRoutine, closeCare, finishCare, openCare } from "../src/store/care";
import { DEFAULT_LOOK, earnedStage, totalExp, useGame } from "../src/store/game";
import { useUI } from "../src/store/ui";

const care = () => useUI.getState().care!;
/** 현재 스텝을 끝까지 진행 (제품 바르기 → 모든 부위 완료) */
function playStep() {
  const c = care();
  const id = availableProduct(c.steps[c.step]);
  expect(id, `step ${c.step} 제품 보유`).toBeTruthy();
  expect(applyProduct(id!)).toBe(true);
  const step = c.step;
  for (let i = 0; i < 20 && care().phase === "step" && care().step === step; i++) addProgress(1);
}

beforeEach(() => {
  useGame.getState().reset();
  useGame.getState().startNew("테스트", DEFAULT_LOOK);
  useUI.setState({ care: null, customers: [], mode: "explore", panel: null });
});

describe("케어 세션", () => {
  it("제품을 바르기 전에는 진행되지 않는다", () => {
    openCare("player"); beginRoutine("calming");
    addProgress(1);
    expect(care().done).toEqual([]);
    expect(care().applied).toBe(false);
  });

  it("스타터 키트만으로 카밍 루틴을 끝낼 수 있고, 보상이 공식과 일치한다", () => {
    const r = ROUTINE_MAP["calming"];
    const coins0 = useGame.getState().coins;
    const inv0 = { ...useGame.getState().inventory };
    openCare("player"); beginRoutine("calming");
    for (let i = 0; i < r.steps.length; i++) playStep();
    expect(care().phase).toBe("mist");
    finishCare(true);
    const res = care().result!;
    const zones = r.steps.length * r.zones.length;
    expect(res.firstTime).toBe(true);
    expect(res.gain.skin).toBe(zones * tune("care.zone_skin_exp") + tune("care.full_routine_bonus_exp") + tune("care.mist_skin_exp"));
    expect(res.gain.device).toBe(zones * tune("care.zone_device_exp") + tune("care.full_routine_bonus_exp"));
    expect(res.coins).toBe(r.steps.length * tune("care.step_coins"));
    const g = useGame.getState();
    expect(g.coins).toBe(coins0 + res.coins);
    expect(g.routinesDone).toContain("calming");
    // 스텝마다 제품 1회분 + 미스트 1회분 소모
    for (const s of r.steps) expect(g.inventory[s.products[0]]).toBe(inv0[s.products[0]] - 1);
    expect(g.inventory["serum-mist"]).toBe(inv0["serum-mist"] - 1);
    expect(totalExp(g)).toBe(Object.values(res.gain).reduce((a, b) => a + (b ?? 0), 0));
  });

  it("첫 풀 루틴 한 번으로 STAGE 2 기준을 넘는다 (첫 성장 연출까지의 거리)", () => {
    openCare("player"); beginRoutine("calming");
    for (let i = 0; i < 3; i++) playStep();
    finishCare(true);
    expect(earnedStage(useGame.getState())).toBe(2);
    expect(useGame.getState().stage).toBe(1); // 시네마틱을 보기 전에는 확정되지 않는다
    useGame.getState().confirmStage(2);
    expect(useGame.getState().stage).toBe(2);
  });

  it("같은 루틴 두 번째에는 첫 클리어 보너스가 없다", () => {
    for (let n = 0; n < 2; n++) {
      openCare("player"); beginRoutine("depuff");
      playStep(); playStep();
      finishCare(false);
      expect(care().result!.firstTime).toBe(n === 0);
      closeCare();
    }
  });

  it("제품이 없으면 바를 수 없다", () => {
    useGame.setState({ inventory: {} });
    openCare("player"); beginRoutine("calming");
    expect(availableProduct(care().steps[0])).toBeNull();
    expect(applyProduct("soothing-gel")).toBe(false);
  });

  it("두피·바디 루틴은 미스트 단계 없이 바로 결과로 간다", () => {
    useGame.setState((s) => ({ inventory: { ...s.inventory, "body-cream": 2, "scalp-serum": 2 } }));
    openCare("player"); beginRoutine("scalp-care");
    for (let i = 0; i < 3; i++) playStep();
    expect(care().phase).toBe("result");
    expect(care().result).toBeTruthy();
  });
});

describe("고객 케어", () => {
  const addCustomer = (type: string) => useUI.setState({ customers: [{ id: "c1", type, name: "하린", state: "care", seat: 0, stars: 0, t: 0 }] });

  it("좋아하는 루틴 + 미스트 마무리면 별 5개, 결제액이 공식과 일치하고 단골이 된다", () => {
    const type = CUSTOMER_TYPES.find((t) => t.id === "beginner")!;
    addCustomer(type.id);
    openCare("c1"); beginRoutine("calming", { express: true, liked: true });
    expect(care().steps.length).toBe(2);
    playStep(); playStep();
    finishCare(true);
    const res = care().result!;
    expect(res.stars).toBe(5);
    expect(res.coins).toBe(Math.round(type.pay * (tune("customer.pay_base") + 5 * tune("customer.pay_per_star"))));
    expect(res.lp).toBe(5 * tune("customer.lp_per_star"));
    const g = useGame.getState();
    expect(g.regulars.map((r) => r.name)).toContain("하린");
    expect(g.routinesDone).not.toContain("calming"); // 익스프레스는 풀 루틴 클리어로 치지 않는다
    closeCare();
    expect(useUI.getState().customers[0].state).toBe("toPay");
  });

  it("맞지 않는 추천이면 별이 낮고 단골이 되지 않으며, 중간에 나가면 고객은 그냥 떠난다", () => {
    addCustomer("beginner");
    openCare("c1"); beginRoutine("brightening", { express: true, liked: false });
    playStep(); playStep();
    finishCare(false);
    expect(care().result!.stars).toBe(3);
    expect(useGame.getState().regulars.length).toBe(0);
    closeCare();
    addCustomer("beginner");
    openCare("c1"); beginRoutine("calming", { express: true, liked: true });
    closeCare();
    expect(useUI.getState().customers[0].state).toBe("leave");
  });
});
