import { beforeEach, describe, expect, it } from "vitest";
import { BOX_COST, CURIOS, CURIO_SETS, DUP_REFUND, GIFT_DAILY, PLANT_MAP, PLANTS, RARITY_ODDS, WORKOUT_DAILY, WORKOUTS, fitLevel, growth, potsFor, rollCurio } from "../src/data/life";
import { CURIO_IDS } from "../src/ui/LifeArt";
import { CURIO_MODEL_IDS } from "../src/three/Curios3D";
import { useGame } from "../src/store/game";
import { useLife } from "../src/store/life";

const H = 3_600_000;
beforeEach(() => {
  useGame.setState({ coins: 10_000, gems: 0, lounge: { ...useGame.getState().lounge, level: 1 } });
  useLife.setState({ garden: [], harvested: {}, fit: 0, bestScore: {}, curios: {}, setsClaimed: [], milestones: [], daily: { date: new Date().toISOString().slice(0, 10), workouts: 0, gifts: [], helps: [], boxes: 0 } });
});

describe("뷰티 가든", () => {
  it("시간이 지나면 씨앗 → 새싹 → 봉오리 → 수확 단계로 자란다", () => {
    const p = PLANT_MAP.chamomile; const t0 = 1_000_000;
    expect(growth({ planted: t0, water: 0 }, p, t0).stage).toBe(0);
    expect(growth({ planted: t0, water: 0 }, p, t0 + p.hours * H * 0.3).stage).toBe(1);
    expect(growth({ planted: t0, water: 0 }, p, t0 + p.hours * H * 0.6).stage).toBe(2);
    expect(growth({ planted: t0, water: 0 }, p, t0 + p.hours * H).stage).toBe(3);
  });
  it("물을 주면 빨리 자란다", () => {
    const p = PLANT_MAP.rose; const t0 = 0; const at = p.hours * H * 0.7;
    expect(growth({ planted: t0, water: 0 }, p, at).stage).toBeLessThan(3);
    expect(growth({ planted: t0, water: 2 }, p, at).stage).toBe(3);
  });
  it("심기·물 주기·수확이 코인과 원료 도감에 반영된다", () => {
    const t0 = Date.now();
    expect(useLife.getState().plant("mint", t0)).toBe("ok");
    expect(useGame.getState().coins).toBe(10_000 - PLANT_MAP.mint.seed);
    const id = useLife.getState().garden[0].id;
    expect(useLife.getState().water(id, t0 + 1000)).toBe(true);
    expect(useLife.getState().water(id, t0 + 2000)).toBe(false); // 1시간에 한 번
    expect(useLife.getState().harvest(id, t0 + 1000)).toBeNull(); // 아직 안 자람
    const r = useLife.getState().harvest(id, t0 + PLANT_MAP.mint.hours * H);
    expect(r?.coins).toBe(PLANT_MAP.mint.coins);
    expect(useLife.getState().garden).toHaveLength(0);
    expect(useLife.getState().harvested.mint).toBe(1);
  });
  it("화분 수와 라운지 레벨 조건을 지킨다", () => {
    for (let i = 0; i < potsFor(1); i++) expect(useLife.getState().plant("mint")).toBe("ok");
    expect(useLife.getState().plant("mint")).toBe("full");
    useLife.setState({ garden: [] });
    expect(useLife.getState().plant("camellia")).toBe("level");
    useGame.setState({ coins: 0 });
    expect(useLife.getState().plant("mint")).toBe("money");
  });
});

describe("웰니스 피트니스", () => {
  it("점수에 비례해 보상하고 하루 보상 횟수를 지킨다", () => {
    const w = WORKOUTS[0];
    const full = useLife.getState().finishWorkout(w.id, w.beats);
    expect(full).toEqual({ fit: w.fit, coins: w.coins, rewarded: true });
    for (let i = 1; i < WORKOUT_DAILY; i++) useLife.getState().finishWorkout(w.id, 0);
    const extra = useLife.getState().finishWorkout(w.id, w.beats);
    expect(extra.rewarded).toBe(false);
    expect(extra.coins).toBe(0);
    expect(extra.fit).toBe(w.fit); // 점수는 계속 쌓인다
  });
  it("레벨이 단계적으로 오른다", () => {
    expect(fitLevel(0)).toBe(1);
    expect(fitLevel(40)).toBe(2);
    expect(fitLevel(100_000)).toBe(10);
  });
});

describe("인테리어 소품 컬렉션", () => {
  it("모든 소품에 그림이 있고 세트마다 4개씩이다", () => {
    expect(CURIO_IDS.sort()).toEqual(CURIOS.map((c) => c.id).sort());
    expect(CURIO_MODEL_IDS.sort()).toEqual(CURIOS.map((c) => c.id).sort()); // 라운지 진열 3D 모델
    for (const s of CURIO_SETS) expect(CURIOS.filter((c) => c.set === s.id)).toHaveLength(4);
    expect(RARITY_ODDS[1] + RARITY_ODDS[2] + RARITY_ODDS[3]).toBeCloseTo(1);
  });
  it("희귀도 확률대로 고른다", () => {
    expect(rollCurio(0.01, 0).rarity).toBe(3);
    expect(rollCurio(0.2, 0).rarity).toBe(2);
    expect(rollCurio(0.9, 0.99).rarity).toBe(1);
  });
  it("상자는 코인을 쓰고, 중복은 환급하고, 세트를 다 모으면 보상을 한 번 받는다", () => {
    const rnd = (() => { let i = 0; const seq = [0.9, 0]; return () => seq[i++ % 2]; })();
    const a = useLife.getState().openBox(rnd);
    expect(a !== "money" && a.dup).toBe(false);
    const coins = useGame.getState().coins;
    const b = useLife.getState().openBox(rnd);
    expect(b !== "money" && b.dup).toBe(true);
    expect(useGame.getState().coins).toBe(coins - BOX_COST + DUP_REFUND);
    const set = CURIO_SETS[0];
    expect(useLife.getState().claimSet(set.id)).toBe(false);
    useLife.setState({ curios: Object.fromEntries(CURIOS.filter((c) => c.set === set.id).map((c) => [c.id, 1])) });
    const gems = useGame.getState().gems;
    expect(useLife.getState().claimSet(set.id)).toBe(true);
    expect(useGame.getState().gems).toBe(gems + set.gems);
    expect(useLife.getState().claimSet(set.id)).toBe(false);
    useGame.setState({ coins: 0 });
    expect(useLife.getState().openBox()).toBe("money");
  });
});

describe("친구 교류", () => {
  it("선물은 친구마다 하루 한 번, 하루 최대 횟수까지", () => {
    expect(useLife.getState().sendGift("a")).toBe(true);
    expect(useLife.getState().sendGift("a")).toBe(false);
    for (let i = 0; i < GIFT_DAILY + 2; i++) useLife.getState().sendGift(`f${i}`);
    expect(useLife.getState().daily.gifts).toHaveLength(GIFT_DAILY);
  });
  it("친구 수 달성 보상은 조건을 채웠을 때 한 번만", () => {
    expect(useLife.getState().claimMilestone(1, 0)).toBe(false);
    expect(useLife.getState().claimMilestone(1, 1)).toBe(true);
    expect(useLife.getState().claimMilestone(1, 1)).toBe(false);
  });
});

it("식물 데이터는 레벨·시간 순으로 비싸진다", () => {
  for (let i = 1; i < PLANTS.length; i++) expect(PLANTS[i].coins).toBeGreaterThan(PLANTS[i - 1].coins);
});
