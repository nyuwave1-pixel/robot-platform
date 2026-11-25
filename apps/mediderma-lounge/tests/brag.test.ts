import { beforeEach, describe, expect, it } from "vitest";
import { BRAG_KINDS, BRAG_MESSAGES, bragDataOf, cleanBrag, cleanBragData } from "../src/net/brag";
import { DEFAULT_LOOK, useGame } from "../src/store/game";
import { useLife } from "../src/store/life";

beforeEach(() => {
  useGame.getState().reset();
  useGame.getState().startNew("자랑", DEFAULT_LOOK);
});

describe("뷰티 자랑", () => {
  it("문구는 종류마다 있고 번호가 겹치지 않으며 서버 범위(0~19) 안이다", () => {
    for (const k of BRAG_KINDS) expect(BRAG_MESSAGES.some((m) => m.kind === k), k).toBe(true);
    expect(new Set(BRAG_MESSAGES.map((m) => m.id)).size).toBe(BRAG_MESSAGES.length);
    for (const m of BRAG_MESSAGES) expect(m.id >= 0 && m.id <= 19).toBe(true);
  });
  it("내 상태로 자랑 데이터를 만들고, 없으면 null", () => {
    expect(bragDataOf("look")?.look?.outfit).toBe(useGame.getState().look.outfit);
    expect(bragDataOf("pet")).toBeNull();
    expect(bragDataOf("plant")).toBeNull();
    useLife.setState({ harvested: { mint: 3, rose: 1 } });
    expect(bragDataOf("plant")?.plants?.[0]).toEqual({ id: "mint", n: 3, g: 0 });
    expect(bragDataOf("care", { care: { routine: "calming", acc: 88, stars: null } })?.care?.acc).toBe(88);
  });
  it("서버가 준 자랑은 아는 값만 받는다 (이상한 값 · 다른 종류 문구는 버림)", () => {
    const ok = cleanBrag({ id: 5, writer: "ABC123", name: "Mina<script>", kind: "plant", msg: 7, data: { plants: [{ id: "mint", n: 2 }, { id: "evil", n: 9 }] }, likes: 3, liked: true, at: "2026-11-25T10:00:00Z" });
    expect(ok?.name).toBe("Minascript");
    expect(ok?.data.plants).toEqual([{ id: "mint", n: 2, g: 0 }]);
    expect(cleanBrag({ id: 5, writer: "ABC123", name: "x", kind: "plant", msg: 0, data: {}, likes: 0, at: "2026-11-25T10:00:00Z" })).toBeNull(); // 룩 문구
    expect(cleanBrag({ id: 5, writer: "bad", name: "x", kind: "look", msg: 0, data: {}, at: "2026-11-25T10:00:00Z" })).toBeNull();
    expect(cleanBragData("pet", { pet: { type: "dragon", name: "x" } })).toBeNull();
    const look = cleanBragData("look", { look: { outfit: "fit-gown", lip: "lip-red", hair: "<b>" }, stage: 99 });
    expect([look?.look?.outfit, look?.look?.lip, look?.stage]).toEqual(["fit-gown", "lip-red", 5]);
  });
});

describe("내 코디 저장 · 갈아입기", () => {
  it("저장한 코디로 한 번에 갈아입고, 가지지 않은 아이템은 건너뛴다", () => {
    const g = () => useGame.getState();
    g().equip("lip", "lip-red"); g().equip("makeup", "mk-rose");
    g().saveCoord(0);
    g().equip("lip", null); g().equip("makeup", null);
    useGame.setState({ ownedFashion: [...g().ownedFashion, "lip-red"] }); // mk-rose 는 안 가짐 (스타터가 아니면)
    const owned = g().ownedFashion.includes("mk-rose");
    const n = g().wearCoord(0);
    expect(g().look.lip).toBe("lip-red");
    expect(g().look.makeup).toBe(owned ? "mk-rose" : null);
    expect(n).toBe(owned ? 2 : 1);
    expect(g().wearCoord(0)).toBe(0); // 이미 입고 있음
    expect(g().wearCoord(2)).toBe(0); // 빈 칸
    g().saveCoord(5); // 범위 밖은 무시
    expect(g().coords.length).toBe(3);
  });
});

describe("펫 키우기", () => {
  it("돌봄으로 유대감이 쌓여 레벨이 오르고, 놀아주기 · 목욕은 쿨타임이 있다", async () => {
    const { petLevel, PET_BOND, PLAY_COOLDOWN_MIN, BATH_COST } = await import("../src/data/pets");
    const g = () => useGame.getState();
    useGame.setState({ coins: 5000 });
    expect(g().adoptPet("cat-cream", "나비")).toBe(true);
    const id = g().pets[0].id;
    const t0 = Date.UTC(2026, 10, 25, 12);
    expect(g().playPet(id, t0)).toEqual({ ok: true, levelUp: false });
    const again = g().playPet(id, t0 + 60_000);
    expect(again.ok).toBe(false);
    expect(g().playPet(id, t0 + PLAY_COOLDOWN_MIN * 60_000).ok).toBe(true);
    const c0 = g().coins;
    expect(g().bathPet(id).ok).toBe(true);
    expect(g().coins).toBe(c0 - BATH_COST);
    expect(g().bathPet(id)).toEqual({ ok: false, why: "done" });
    expect(g().pets[0].bond).toBe(PET_BOND.play * 2 + PET_BOND.bath);
    expect(petLevel(g().pets[0].bond!)).toBe(2);
  });
  it("장식은 사야 씌울 수 있고, 레벨 조건을 지킨다", () => {
    const g = () => useGame.getState();
    useGame.setState({ coins: 5000 });
    g().adoptPet("dog-shiba", "콩");
    const id = g().pets[0].id;
    expect(g().wearPetAcc(id, "pacc-ribbon")).toBe(false); // 안 샀음
    expect(g().buyPetAcc("pacc-ribbon")).toBe(true);
    expect(g().buyPetAcc("pacc-ribbon")).toBe(false); // 중복
    expect(g().wearPetAcc(id, "pacc-ribbon")).toBe(true);
    g().buyPetAcc("pacc-crown");
    expect(g().wearPetAcc(id, "pacc-crown")).toBe(false); // Lv.6 필요
    useGame.setState((s) => ({ pets: s.pets.map((p) => ({ ...p, bond: 999 })) }));
    expect(g().wearPetAcc(id, "pacc-crown")).toBe(true);
    expect(bragDataOf("pet")?.pet).toMatchObject({ acc: "pacc-crown", level: 7 });
    expect(cleanBragData("pet", { pet: { type: "dog-shiba", name: "콩", acc: "hack", level: 99 } })?.pet).toMatchObject({ acc: null, level: 7 });
  });
});
