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
    expect(bragDataOf("plant")?.plants?.[0]).toEqual({ id: "mint", n: 3 });
    expect(bragDataOf("care", { care: { routine: "calming", acc: 88, stars: null } })?.care?.acc).toBe(88);
  });
  it("서버가 준 자랑은 아는 값만 받는다 (이상한 값 · 다른 종류 문구는 버림)", () => {
    const ok = cleanBrag({ id: 5, writer: "ABC123", name: "Mina<script>", kind: "plant", msg: 7, data: { plants: [{ id: "mint", n: 2 }, { id: "evil", n: 9 }] }, likes: 3, liked: true, at: "2026-11-25T10:00:00Z" });
    expect(ok?.name).toBe("Minascript");
    expect(ok?.data.plants).toEqual([{ id: "mint", n: 2 }]);
    expect(cleanBrag({ id: 5, writer: "ABC123", name: "x", kind: "plant", msg: 0, data: {}, likes: 0, at: "2026-11-25T10:00:00Z" })).toBeNull(); // 룩 문구
    expect(cleanBrag({ id: 5, writer: "bad", name: "x", kind: "look", msg: 0, data: {}, at: "2026-11-25T10:00:00Z" })).toBeNull();
    expect(cleanBragData("pet", { pet: { type: "dragon", name: "x" } })).toBeNull();
    const look = cleanBragData("look", { look: { outfit: "fit-gown", lip: "lip-red", hair: "<b>" }, stage: 99 });
    expect([look?.look?.outfit, look?.look?.lip, look?.stage]).toEqual(["fit-gown", "lip-red", 5]);
  });
});
