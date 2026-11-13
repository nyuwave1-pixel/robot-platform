import { beforeEach, describe, expect, it } from "vitest";
import { tune } from "../src/data/config";
import { FASHION_MAP, LOOK_PRESETS, LOUNGE_LEVELS, MAX_PETS, PET_TYPES, STATION_COSTS, HAIR_COLORS, SKIN_TONES } from "../src/data/game";
import { DEFAULT_LOOK, normCode, useGame } from "../src/store/game";
import { layout } from "../src/three/layout";

const g = () => useGame.getState();
beforeEach(() => { g().reset(); g().startNew("테스트", DEFAULT_LOOK); });

describe("펫", () => {
  it("입양은 코인을 차감하고, 최대 마릿수를 넘길 수 없다", () => {
    useGame.setState({ coins: 5000 });
    const before = g().coins;
    expect(g().adoptPet("cat-cream", "나비")).toBe(true);
    expect(g().coins).toBe(before - PET_TYPES.find((p) => p.id === "cat-cream")!.price);
    expect(g().pets[0]).toMatchObject({ name: "나비", type: "cat-cream" });
    for (let i = 1; i < MAX_PETS; i++) expect(g().adoptPet("dog-gold", "")).toBe(true);
    expect(g().adoptPet("dog-white", "")).toBe(false);
    expect(g().pets.length).toBe(MAX_PETS);
    expect(g().pets[1].name.length).toBeGreaterThan(0); // 이름을 비우면 기본 이름
  });
  it("코인이 부족하거나 없는 종류면 입양되지 않는다", () => {
    useGame.setState({ coins: 10 });
    expect(g().adoptPet("cat-cream", "x")).toBe(false);
    useGame.setState({ coins: 5000 });
    expect(g().adoptPet("dragon", "x")).toBe(false);
    expect(g().pets.length).toBe(0);
  });
  it("쓰다듬기는 애정도를 올리고, SOCIAL STAR 는 하루 한 번만 준다", () => {
    useGame.setState({ coins: 5000 });
    g().adoptPet("dog-gold", "몽");
    const id = g().pets[0].id, a0 = g().pets[0].affection, s0 = g().stars;
    expect(g().petPet(id)).toEqual({ star: true });
    expect(g().stars).toBe(s0 + tune("pet.daily_star"));
    expect(g().petPet(id)).toEqual({ star: false });
    expect(g().stars).toBe(s0 + tune("pet.daily_star"));
    expect(g().pets[0].affection).toBe(a0 + 2 * tune("pet.pet_affection"));
    for (let i = 0; i < 30; i++) g().petPet(id);
    expect(g().pets[0].affection).toBe(100);
    expect(g().petPet("없는펫")).toBeNull();
  });
  it("간식은 코인이 있어야 준다", () => {
    useGame.setState({ coins: 5000 }); g().adoptPet("cat-gray", "");
    useGame.setState({ coins: 0 });
    expect(g().feedPet(g().pets[0].id)).toBe(false);
    useGame.setState({ coins: tune("pet.feed_cost") });
    expect(g().feedPet(g().pets[0].id)).toBe(true);
    expect(g().coins).toBe(0);
  });
});

describe("DERMA HOME 스테이션", () => {
  it("등급이 오를수록 설치 자리가 줄지 않고, 비용표가 자리 수를 덮는다", () => {
    let prev = 0;
    for (const l of LOUNGE_LEVELS) {
      const n = layout(l.n).stationSpots.length;
      expect(n).toBeGreaterThanOrEqual(prev); expect(n).toBeGreaterThan(0);
      expect(STATION_COSTS.length).toBeGreaterThanOrEqual(n);
      prev = n;
    }
  });
  it("설치는 비용을 차감하고 자리 수를 넘길 수 없다", () => {
    const max = layout(1).stationSpots.length;
    useGame.setState({ coins: 100000 });
    for (let i = 0; i < max; i++) expect(g().buyStation(max)).toBe(true);
    expect(g().buyStation(max)).toBe(false);
    expect(g().lounge.stations).toBe(max);
    expect(g().coins).toBe(100000 - STATION_COSTS.slice(0, max).reduce((a, b) => a + b, 0));
  });
  it("스테이션은 방 안에 놓이고, 설치한 만큼만 충돌체가 생긴다", () => {
    for (const l of LOUNGE_LEVELS) {
      const L = layout(l.n);
      for (const s of L.stationSpots) { expect(Math.abs(s.x) + 1.2).toBeLessThan(L.w / 2); expect(Math.abs(s.z) + 0.5).toBeLessThan(L.d / 2); }
      expect(layout(l.n, 1).obstacles.length).toBe(L.obstacles.length + 2);
      expect(layout(l.n, 99).stations).toBe(L.stationSpots.length);
    }
  });
  it("자동 케어는 수입·LOUNGE POINT·고객 수를 올리고 별 4개 이상이면 단골이 된다", () => {
    const c0 = g().coins;
    g().autoServe({ name: "하린", type: "beginner", stars: 4, coins: 60, lp: 4 });
    g().autoServe({ name: "Mia", type: "office", stars: 3, coins: 40, lp: 3 });
    expect(g().coins).toBe(c0 + 100);
    expect(g().lp).toBe(7);
    expect(g().stats.customers).toBe(2);
    expect(g().regulars.map((r) => r.name)).toEqual(["하린"]);
  });
});

describe("친구 초대", () => {
  it("코드는 영문 대문자·숫자 6자리로 정규화된다", () => {
    expect(normCode("ab-c1 23")).toBe("ABC123");
    expect(normCode("abc")).toBe("");
    expect(normCode("abcdefg")).toBe("");
    expect(g().friendCode).toMatch(/^[A-Z0-9]{6}$/);
  });
  it("친구 코드는 한 번만 등록되고 내 코드는 등록할 수 없다", () => {
    const s0 = g().stars;
    expect(g().addFriend("zzz999", "Mia")).toBe("ok");
    expect(g().stars).toBe(s0 + tune("social.friend_code_stars"));
    expect(g().addFriend("ZZZ999", "Mia")).toBe("dup");
    expect(g().addFriend(g().friendCode, "나")).toBe("self");
    expect(g().addFriend("12", "x")).toBe("bad");
    expect(g().stars).toBe(s0 + tune("social.friend_code_stars"));
  });
  it("초대 선물은 한 번만 받고, 초대한 친구가 목록에 들어간다", () => {
    const g0 = g().gems;
    expect(g().acceptInvite("QWE123", "Yuki")).toBe(true);
    expect(g().gems).toBe(g0 + tune("social.invite_gems"));
    expect(g().friends).toEqual([{ code: "QWE123", name: "Yuki" }]);
    expect(g().acceptInvite("AAA111", "Linh")).toBe(false);
    expect(g().gems).toBe(g0 + tune("social.invite_gems"));
  });
  it("자기 코드로 만든 링크는 무시되고, 새 게임을 시작해도 내 코드는 유지된다", () => {
    const code = g().friendCode;
    expect(g().acceptInvite(code, "나")).toBe(false);
    g().startNew("다시", DEFAULT_LOOK);
    expect(g().friendCode).toBe(code);
  });
});

describe("미니게임 보상", () => {
  it("적은 횟수일수록 많이 받고, 최소 보상 아래로 내려가지 않는다", () => {
    const best = g().miniReward(6);
    expect(best).toBe(tune("minigame.base_coins"));
    const worse = g().miniReward(12);
    expect(worse).toBeLessThan(best);
    expect(g().miniReward(500)).toBe(tune("minigame.min_coins"));
  });
  it("하루 보상 횟수를 넘기면 0 을 준다", () => {
    const c0 = g().coins;
    let sum = 0;
    for (let i = 0; i < tune("minigame.daily_rewards"); i++) sum += g().miniReward(6);
    expect(g().miniReward(6)).toBe(0);
    expect(g().coins).toBe(c0 + sum);
  });
});

describe("캐릭터 확장 데이터", () => {
  it("프리셋은 실제 있는 값만 쓰고, 생성 화면에서 고를 수 있는 무료 헤어다", () => {
    for (const p of LOOK_PRESETS) {
      expect(SKIN_TONES, p.id).toContain(p.look.skin);
      expect(HAIR_COLORS, p.id).toContain(p.look.hairColor);
      expect(FASHION_MAP[p.look.hair]?.price, p.id).toBe(0);
    }
  });
  it("의상에는 실루엣과 색이 모두 있다", () => {
    for (const f of Object.values(FASHION_MAP).filter((x) => x.slot === "outfit")) { expect(f.cut, f.id).toBeTruthy(); expect(f.color, f.id).toBeTruthy(); expect(f.accent, f.id).toBeTruthy(); }
  });
});
