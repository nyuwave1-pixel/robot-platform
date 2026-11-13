import { beforeEach, describe, expect, it } from "vitest";
import { INTERIOR_MAP, LOUNGE_LEVELS, QUESTS } from "../src/data/game";
import { PRODUCT_MAP, usesOf } from "../src/data/products";
import { DEFAULT_LOOK, questValue, useGame } from "../src/store/game";

beforeEach(() => { useGame.getState().reset(); useGame.getState().startNew("  아주아주긴이름입니다열두자넘김  ", DEFAULT_LOOK); });

describe("게임 상태", () => {
  it("이름은 다듬어지고 12자로 제한된다", () => {
    expect(useGame.getState().name.length).toBeLessThanOrEqual(12);
    expect(useGame.getState().name.startsWith(" ")).toBe(false);
  });
  it("코인이 부족하면 구매되지 않고 상태가 변하지 않는다", () => {
    useGame.setState({ coins: 0 });
    const before = JSON.stringify(useGame.getState().inventory);
    expect(useGame.getState().buyProduct("vitac-ampoule")).toBe(false);
    expect(JSON.stringify(useGame.getState().inventory)).toBe(before);
    expect(useGame.getState().buyFashion("hair-bun")).toBe(false);
    expect(useGame.getState().upgradeLounge()).toBe(false);
  });
  it("제품 구매는 가격만큼 차감하고 회분만큼 늘리며 도감에 등록한다", () => {
    useGame.setState({ coins: 1000, inventory: {}, codex: [] });
    expect(useGame.getState().buyProduct("vitac-mask")).toBe(true);
    const g = useGame.getState();
    expect(g.coins).toBe(1000 - PRODUCT_MAP["vitac-mask"].coinPrice);
    expect(g.inventory["vitac-mask"]).toBe(usesOf("vitac-mask"));
    expect(g.codex).toContain("vitac-mask");
  });
  it("가구는 보관 → 배치 → 회수 과정에서 수량이 보존된다", () => {
    const g = useGame.getState();
    const n0 = g.storage.plant;
    const uid = g.place("plant")!;
    expect(useGame.getState().storage.plant).toBe(n0 - 1);
    useGame.getState().moveFurniture(uid, 2, -1);
    expect(useGame.getState().lounge.furniture[0]).toMatchObject({ x: 2, z: -1 });
    useGame.getState().storeFurniture(uid);
    expect(useGame.getState().storage.plant).toBe(n0);
    expect(useGame.getState().lounge.furniture.length).toBe(0);
    useGame.setState({ storage: {} });
    expect(useGame.getState().place("plant")).toBeNull();
  });
  it("보유하지 않은 테마는 적용되지 않는다", () => {
    expect(INTERIOR_MAP["wall-black"]).toBeTruthy();
    useGame.getState().setTheme("wall", "wall-black");
    expect(useGame.getState().lounge.wall).toBe("wall-cream");
  });
  it("라운지 확장은 코인과 LOUNGE POINT 가 모두 있어야 한다", () => {
    const next = LOUNGE_LEVELS[1];
    useGame.setState({ coins: next.cost, lp: next.lp - 1 });
    expect(useGame.getState().upgradeLounge()).toBe(false);
    useGame.setState({ lp: next.lp });
    expect(useGame.getState().upgradeLounge()).toBe(true);
    expect(useGame.getState().lounge.level).toBe(2);
    expect(useGame.getState().coins).toBe(0);
  });
  it("퀘스트는 조건을 채워야 받고, 두 번 받을 수 없다", () => {
    const q = QUESTS.find((x) => x.id === "q-first")!;
    expect(useGame.getState().claim(q)).toBe(false);
    useGame.getState().bump("care");
    expect(questValue(useGame.getState(), q)).toBe(1);
    expect(useGame.getState().claim(q)).toBe(true);
    expect(useGame.getState().claim(q)).toBe(false);
  });
  it("게시물 사진은 최근 6장만 유지한다 (저장 용량 보호)", () => {
    for (let i = 0; i < 9; i++) useGame.getState().addPost({ text: `p${i}`, tag: "#t", img: "data:image/jpeg;base64,AAAA" });
    expect(useGame.getState().posts.filter((p) => p.mine && p.img).length).toBe(6);
    expect(useGame.getState().posts.filter((p) => p.mine).length).toBe(9);
  });
  it("저장 데이터는 함수를 빼면 JSON 으로 왕복된다", () => {
    const s = useGame.getState();
    const data = JSON.parse(JSON.stringify(s));
    expect(data.name).toBe(s.name);
    expect(data.lounge.level).toBe(1);
    expect(typeof data.startNew).toBe("undefined");
  });
});
