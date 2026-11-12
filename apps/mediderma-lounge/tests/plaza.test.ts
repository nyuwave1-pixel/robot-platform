import { beforeEach, describe, expect, it } from "vitest";
import { tune } from "../src/data/config";
import { cleanLook, cleanName, sparkleSpots } from "../src/net/plaza";
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
});
