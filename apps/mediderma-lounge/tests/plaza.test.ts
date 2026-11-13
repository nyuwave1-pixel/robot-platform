import { beforeEach, describe, expect, it } from "vitest";
import { tune } from "../src/data/config";
import { PROMOS } from "../src/data/game";
import { MAX_FURNITURE, cleanLook, cleanLounge, cleanName, sparkleSpots } from "../src/net/plaza";
import { DEFAULT_LOOK, useGame } from "../src/store/game";

const g = () => useGame.getState();
beforeEach(() => { g().reset(); g().startNew("테스트", DEFAULT_LOOK); });

describe("월드 광장", () => {
  it("다른 사람이 보낸 외형은 아는 값만 받아들인다", () => {
    const l = cleanLook({ skin: "red", hairColor: "#123abc", hair: "hair-nope", outfit: "fit-lav", accessory: "<script>", height: 99, face: "DROP TABLE" });
    expect(l.skin).toBe(DEFAULT_LOOK.skin);
    expect(l.hairColor).toBe("#123abc");
    expect(l.hair).toBe(DEFAULT_LOOK.hair);
    expect(l.outfit).toBe("fit-lav");
    expect(l.accessory).toBeNull();
    expect(l.height).toBe(1.08);
    expect(l.face).toBe(DEFAULT_LOOK.face);
    expect(cleanLook(null).hair).toBe(DEFAULT_LOOK.hair);
  });
  it("이름은 12자까지, 태그 문자는 지운다", () => {
    expect(cleanName("<b>루나</b>")).toBe("b루나/b");
    expect(cleanName("a".repeat(40)).length).toBe(12);
    expect(cleanName(123)).toBe("GUEST");
    expect(cleanName("   ")).toBe("GUEST");
  });
  it("반짝이 위치는 같은 시간 슬롯이면 모두에게 같고, 분수와 광장 밖을 피한다", () => {
    expect(sparkleSpots(1234)).toEqual(sparkleSpots(1234));
    expect(sparkleSpots(1234)).not.toEqual(sparkleSpots(1235));
    for (const s of sparkleSpots(777, 30)) {
      const r = Math.hypot(s.x, s.z);
      expect(r).toBeGreaterThan(3);
      expect(r).toBeLessThan(13);
    }
  });
  it("반짝이 보상은 하루 한도까지만 받고, 정해진 개수마다 스타를 준다", () => {
    const c = g().coins, st = g().stars;
    const per = tune("plaza.sparkles_per_star"), cap = tune("plaza.daily_sparkles");
    for (let i = 0; i < per; i++) g().plazaCollect();
    expect(g().coins).toBe(c + per * tune("plaza.sparkle_coins"));
    expect(g().stars).toBe(st + 1);
    for (let i = per; i < cap + 5; i++) g().plazaCollect();
    expect(g().coins).toBe(c + cap * tune("plaza.sparkle_coins"));
    expect(g().plazaCollect()).toEqual({ coins: 0, star: false });
  });
  it("라운지 방문 혜택은 라운지마다 하루 한 번, 내 라운지는 받을 수 없다", () => {
    const c = g().coins, st = g().stars;
    expect(g().plazaVisit("ABC123", 1)).toEqual({ coins: PROMOS[0].coins, stars: PROMOS[0].stars });
    expect(g().coins).toBe(c + PROMOS[0].coins);
    expect(g().plazaVisit("ABC123", 1)).toBeNull();
    expect(g().plazaVisit("ZZZ999", 2)).toEqual({ coins: 0, stars: 2 });
    expect(g().stars).toBe(st + 2);
    expect(g().plazaVisit(g().friendCode, 1)).toBeNull();
    expect(g().plazaVisit("QQQ111", 99)).toBeNull();
    for (let i = 0; i < 20; i++) g().plazaVisit(`AAA${100 + i}`, 3);
    expect(g().daily.stats.visits).toBe(tune("plaza.visit_daily"));
  });
  it("방문객·하트 보상에는 하루 한도가 있다", () => {
    expect(g().plazaHosted()).toBe(tune("plaza.host_lp"));
    for (let i = 0; i < tune("plaza.host_daily") + 3; i++) g().plazaHosted();
    expect(g().plazaHosted()).toBe(0);
    const st = g().stars;
    for (let i = 0; i < tune("plaza.heart_daily") + 4; i++) g().plazaHeart();
    expect(g().stars).toBe(st + tune("plaza.heart_daily"));
  });
  it("소원 분수는 하루 한 번, 꽃잎 잡기 보상은 상한과 하루 판 수 제한이 있다", () => {
    const w = g().plazaWish();
    expect(w).toBeGreaterThanOrEqual(tune("plaza.wish_min"));
    expect(w).toBeLessThanOrEqual(tune("plaza.wish_max"));
    expect(g().plazaWish()).toBe(0);
    expect(g().petalReward(5)).toBe(5 * tune("plaza.petal_coin"));
    expect(g().petalReward(9999)).toBe(tune("plaza.petal_max"));
    for (let i = 2; i < tune("plaza.petal_daily"); i++) g().petalReward(1);
    expect(g().petalReward(10)).toBe(0);
    expect(g().stats.petalBest).toBe(9999);
  });
  it("홍보는 정해진 혜택만 고를 수 있다", () => {
    g().setPromo(2); expect(g().promo).toBe(2);
    g().setPromo(77); expect(g().promo).toBe(0);
  });
  it("다른 사람의 라운지 꾸밈은 아는 값만, 방 안쪽 좌표로만 받아들인다", () => {
    const l = cleanLounge({ level: 99, floor: "wall-lav", wall: "wall-lav", light: "x", furniture: [
      { type: "plant", x: 2, z: 1, rot: 0.5 }, { type: "nope", x: 0, z: 0 }, { type: "wall-pink", x: 0, z: 0 }, { type: "rug", x: 9999, z: -9999, rot: "a" }, null, "x",
    ] });
    expect(l.level).toBe(5);
    expect(l.floor).toBe("floor-cream");
    expect(l.wall).toBe("wall-lav");
    expect(l.light).toBe("light-warm");
    expect(l.furniture.map((f) => f.type)).toEqual(["plant", "rug"]);
    expect(Math.abs(l.furniture[1].x)).toBeLessThan(20);
    expect(l.furniture[1].rot).toBe(0);
    expect(cleanLounge(undefined)).toEqual({ level: 1, floor: "floor-cream", wall: "wall-cream", light: "light-warm", furniture: [] });
    expect(cleanLounge({ furniture: Array.from({ length: 200 }, () => ({ type: "plant", x: 0, z: 0, rot: 0 })) }).furniture.length).toBe(MAX_FURNITURE);
  });
});
