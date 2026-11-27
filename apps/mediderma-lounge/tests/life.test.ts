import { beforeEach, describe, expect, it } from "vitest";
import { BOX_COST, CURIOS, CURIO_SETS, DUP_REFUND, GIFT_DAILY, PLANT_MAP, PLANTS, RARITY_ODDS, WORKOUT_DAILY, WORKOUTS, fitLevel, growth, potsFor, rollCurio } from "../src/data/life";
import { CURIO_IDS } from "../src/ui/LifeArt";
import { CURIO_MODEL_IDS } from "../src/three/Curios3D";
import { useGame } from "../src/store/game";
import { useLife } from "../src/store/life";

const H = 3_600_000;
beforeEach(() => {
  useGame.setState({ coins: 10_000, gems: 0, lounge: { ...useGame.getState().lounge, level: 1 } });
  useLife.setState({ style: { date: "", entries: 0, best: 0, streak: 0, lastDay: "", wins: 0 }, garden: [], harvested: {}, golden: {}, fit: 0, bestScore: {}, curios: {}, setsClaimed: [], milestones: [], daily: { date: new Date().toISOString().slice(0, 10), workouts: 0, gifts: [], helps: [], boxes: 0 } });
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
    const r = useLife.getState().harvest(id, t0 + PLANT_MAP.mint.hours * H, () => 0.99); // 황금 수확이 아닌 경우
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

describe("스타일 챌린지", () => {
  it("모든 패션 아이템에 스타일 수치가 있고 0~5 범위다", async () => {
    const { FASHION } = await import("../src/data/game");
    const { ITEM_STYLE } = await import("../src/data/style");
    for (const f of FASHION) {
      expect(ITEM_STYLE[f.id], f.id).toBeDefined();
      for (const v of ITEM_STYLE[f.id]) expect(v >= 0 && v <= 5).toBe(true);
    }
  });
  it("테마에 맞는 룩이 더 높은 점수를 받고, 최고 조합은 100점에 가깝다", async () => {
    const { THEMES, scoreFit } = await import("../src/data/style");
    const red = THEMES.find((x) => x.id === "redcarpet")!;
    const cute = scoreFit({ outfit: "fit-pastel", hair: "hair-twin", shoes: "shoe-pink" }, red, "glam").total;
    const glam = scoreFit({ outfit: "fit-gown", hair: "hair-wave", shoes: "shoe-gold" }, red, "glam").total;
    expect(glam).toBeGreaterThan(cute + 20);
    const full = scoreFit({ outfit: "fit-gown", hair: "hair-wave", shoes: "shoe-gold", accessory: "acc-tiara", earring: "ear-gold", necklace: "neck-gold", bag: "bag-black", makeup: "mk-rose", nail: "nail-gold", base: "base-satin", shadow: "sh-gold", lip: "lip-red" }, red, "glam");
    expect(full.total).toBeGreaterThanOrEqual(90);
    expect(full.grade).toBe("S");
  });
  it("스타일리스트 팁은 실제로 점수를 올리는 가진 아이템만 추천한다", async () => {
    const { THEMES, scoreFit, stylistTip } = await import("../src/data/style");
    const th = THEMES[0]; const fit = { outfit: "fit-suit", hair: "hair-pixie" };
    const tip = stylistTip(fit, ["fit-pastel", "fit-suit", "hair-pixie", "hair-twin"], th, "cute")!;
    expect(["fit-pastel", "hair-twin"]).toContain(tip.id);
    expect(scoreFit({ ...fit, [tip.slot]: tip.id }, th, "cute").total - scoreFit(fit, th, "cute").total).toBe(tip.gain);
    expect(stylistTip(fit, ["fit-suit"], th, "cute")).toBeNull();
  });
  it("출전: 하루 3번, 순위대로 보상, 연속 출전이 이어진다", async () => {
    const { CHALLENGE_DAILY } = await import("../src/data/style");
    const fit = { outfit: "fit-gown", hair: "hair-wave" };
    const f0 = useGame.getState().followers;
    const r1 = useLife.getState().enterChallenge(fit, "2026-01-01")!;
    expect(r1.streak).toBe(1);
    expect(useGame.getState().followers).toBeGreaterThan(f0);
    for (let i = 1; i < CHALLENGE_DAILY; i++) expect(useLife.getState().enterChallenge(fit, "2026-01-01")).not.toBeNull();
    expect(useLife.getState().enterChallenge(fit, "2026-01-01")).toBeNull();
    expect(useLife.getState().enterChallenge(fit, "2026-01-02")!.streak).toBe(2);
    expect(useLife.getState().enterChallenge(fit, "2026-01-05")!.streak).toBe(1); // 끊기면 1부터
  });
  it("같은 날은 모두 같은 테마·트렌드·라이벌", async () => {
    const { themeOfDay, trendOfDay, rivalsOf } = await import("../src/data/style");
    expect(themeOfDay("2026-03-03")).toBe(themeOfDay("2026-03-03"));
    expect(trendOfDay("2026-03-03")).toBe(trendOfDay("2026-03-03"));
    expect(rivalsOf("2026-03-03", 0)).toEqual(rivalsOf("2026-03-03", 0));
    // 트렌드는 언제나 다섯 스타일 중 하나 (부호 있는 시프트로 음수 인덱스가 나오던 버그)
    const { STYLES } = await import("../src/data/style");
    for (let i = 0; i < 400; i++) expect(STYLES).toContain(trendOfDay(new Date(Date.UTC(2026, 0, 1) + i * 86_400_000).toISOString().slice(0, 10)));
    const days = new Set(Array.from({ length: 30 }, (_, i) => themeOfDay(`2026-04-${String(i + 1).padStart(2, "0")}`).id));
    expect(days.size).toBeGreaterThan(5); // 테마가 고르게 돈다
  });
});

describe("뷰티 가든 — 영양제 · 황금 수확", () => {
  it("영양제는 화분마다 한 번, 성장이 빨라지고 황금 수확 확률이 오른다", async () => {
    const { FERTILIZER_COST, goldenChance } = await import("../src/data/life");
    const t0 = Date.now();
    useLife.getState().plant("chamomile", t0);
    const id = useLife.getState().garden[0].id;
    const c0 = useGame.getState().coins;
    expect(goldenChance(useLife.getState().garden[0])).toBeCloseTo(0.08);
    expect(useLife.getState().fertilize(id, t0)).toBe("ok");
    expect(useGame.getState().coins).toBe(c0 - FERTILIZER_COST);
    expect(useLife.getState().fertilize(id, t0)).toBe("done");
    const slot = useLife.getState().garden[0];
    expect(goldenChance(slot)).toBeCloseTo(0.18);
    const p = PLANT_MAP.chamomile;
    expect(growth(slot, p, t0 + p.hours * H * 0.71).stage).toBe(3); // 70% 시간에 다 자람
  });
  it("황금 수확은 코인 2배와 황금 도감", () => {
    const t0 = Date.now();
    useLife.getState().plant("mint", t0);
    const id = useLife.getState().garden[0].id;
    const r = useLife.getState().harvest(id, t0 + PLANT_MAP.mint.hours * H, () => 0)!;
    expect(r.golden).toBe(true);
    expect(r.coins).toBe(PLANT_MAP.mint.coins * 2);
    expect(useLife.getState().golden.mint).toBe(1);
  });
});
