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

describe("자랑 반응 알림", () => {
  it("처음엔 기준만 잡고, 이후 늘어난 좋아요만큼 (최대 50) 알린다", async () => {
    const { newLikes, BRAG_FOLLOW_CAP } = await import("../src/net/brag");
    expect(newLikes(12, undefined)).toBe(0);
    expect(newLikes(15, 12)).toBe(3);
    expect(newLikes(10, 12)).toBe(0); // 자랑을 지워 줄어든 경우
    expect(newLikes(500, 0)).toBe(BRAG_FOLLOW_CAP);
  });
});

describe("플레이어 선물", async () => {
  const { cleanGift } = await import("../src/net/gifts");
  it("선물함 항목은 아는 종류 · 금액만", () => {
    const at = "2026-11-25T10:00:00Z";
    expect(cleanGift({ id: 1, from: "ABC123", name: "미나<b>", kind: "coins", amount: 500, at })).toMatchObject({ kind: "coins", amount: 500, name: "미나b" });
    expect(cleanGift({ id: 1, from: "ABC123", name: "x", kind: "coins", amount: 9999, at })).toBeNull();
    expect(cleanGift({ id: 1, from: "ABC123", name: "x", kind: "heart", amount: 2, at })).toBeNull();
    expect(cleanGift({ id: 1, from: "bad", name: "x", kind: "heart", amount: 1, at })).toBeNull();
  });
});

describe("7일 출석부", () => {
  it("하루 한 번, 칸이 차고 7칸 뒤 처음부터", async () => {
    const { ATTEND_REWARDS } = await import("../src/store/game");
    const g = () => useGame.getState();
    const c0 = g().coins;
    const r = g().claimAttendance()!;
    expect(r.slot).toBe(0);
    expect(g().coins).toBe(c0 + (ATTEND_REWARDS[0].coins ?? 0));
    expect(g().claimAttendance()).toBeNull(); // 같은 날 두 번 안 됨
    useGame.setState({ attend: { day: "2000-01-01", count: 6 } });
    const gems = g().gems;
    expect(g().claimAttendance()!.slot).toBe(6);
    expect(g().gems).toBe(gems + (ATTEND_REWARDS[6].gems ?? 0));
    useGame.setState({ attend: { day: "2000-01-02", count: 7 } });
    expect(g().claimAttendance()!.slot).toBe(0); // 다시 1일차
  });
});

describe("주간 자랑왕", async () => {
  const { cleanKing, kingReward } = await import("../src/net/brag");
  it("1~3위만 보상, 순위표는 아는 값만", () => {
    expect(kingReward(1)).toEqual({ coins: 2000, gems: 30 });
    expect(kingReward(3)).toEqual({ coins: 800, gems: 10 });
    expect(kingReward(4)).toBeNull();
    expect(cleanKing([{ code: "ABC123", name: "미나<b>", likes: "12", posts: 3, rank: 1 }, { code: "bad", likes: 9 }])).toEqual([{ code: "ABC123", name: "미나b", likes: 12, posts: 3, rank: 1 }]);
  });
});

describe("플레이어 팔로우", async () => {
  const { cleanFollows } = await import("../src/net/follows");
  it("팔로우 목록은 아는 형식만", () => {
    expect(cleanFollows({ followers: 3.9, following: [{ code: "ABC123", name: "미나<b>" }, { code: "bad", name: "x" }] })).toEqual({ followers: 3, list: [{ code: "ABC123", name: "미나b" }] });
    expect(cleanFollows(null)).toEqual({ followers: 0, list: [] });
  });
});

describe("팔로잉 피드", () => {
  it("본인 확인용 비밀값과 함께 mdl_brag_following 을 부르고, 아는 값만 목록에 넣는다", async () => {
    const { vi } = await import("vitest");
    const { loadBrags, useBrag } = await import("../src/net/brag");
    const calls: { url: string; body: Record<string, unknown> }[] = [];
    const brag = { id: 9, writer: "ABC123", name: "미나", kind: "look", msg: 0, data: { look: useGame.getState().look }, likes: 2, liked: false, at: "2026-11-27T01:00:00Z" };
    vi.stubGlobal("fetch", async (url: string, init: { body: string }) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return { ok: true, json: async () => ({ ok: true, list: [brag, { id: "x" }] }) };
    });
    try {
      await loadBrags("follow", null);
      expect(calls[0].url).toMatch(/mdl_brag_following$/);
      expect(calls[0].body.p_code).toBe(useGame.getState().friendCode);
      expect(String(calls[0].body.p_secret)).toMatch(/^[0-9a-f]{32}$/);
      expect(useBrag.getState()).toMatchObject({ sort: "follow", status: "ok" });
      expect(useBrag.getState().list.map((b) => b.id)).toEqual([9]);
    } finally { vi.unstubAllGlobals(); useBrag.setState({ sort: "new", list: [], status: "idle" }); }
  });
});

describe("팔로잉 새 자랑 알림", () => {
  const mk = (id: number, at: string) => ({ id, writer: "ABC123", name: "미나", kind: "look" as const, msg: 0, data: {}, likes: 0, liked: false, at });
  it("처음(기준 없음)에는 0, 기준 뒤에 올라온 것만 센다", async () => {
    const { countNewSince } = await import("../src/net/brag");
    const list = [mk(1, "2026-11-27T01:00:00Z"), mk(2, "2026-11-27T03:00:00Z"), mk(3, "2026-11-27T05:00:00Z")];
    expect(countNewSince(list, undefined)).toBe(0);
    expect(countNewSince(list, "2026-11-27T02:00:00Z")).toBe(2);
    expect(countNewSince(list, "2026-11-27T05:00:00Z")).toBe(0);
  });
  it("확인하면 새로 늘어난 수만 알리고, 팔로잉 피드를 열면 기준이 갱신되어 0이 된다", async () => {
    const { vi } = await import("vitest");
    const { checkFollowFeed, loadBrags, useBrag } = await import("../src/net/brag");
    const look = useGame.getState().look;
    let rows = [{ ...mk(1, "2026-11-27T01:00:00Z"), data: { look } }];
    vi.stubGlobal("fetch", async () => ({ ok: true, json: async () => ({ ok: true, list: rows }) }));
    try {
      expect(await checkFollowFeed(false)).toBe(0);                 // 팔로우 없으면 안 부름
      expect(await checkFollowFeed(true)).toBe(0);                  // 처음: 기준만 잡음
      expect(useGame.getState().followSeenAt).toBe("2026-11-27T01:00:00.000Z");
      rows = [{ ...mk(2, "2026-11-27T02:00:00Z"), data: { look } }, ...rows];
      expect(await checkFollowFeed(true)).toBe(1);
      expect(useBrag.getState().followNew).toBe(1);
      expect(await checkFollowFeed(true)).toBe(0);                  // 같은 글로 또 알리지 않음
      expect(useBrag.getState().followNew).toBe(1);
      await loadBrags("follow", null);
      expect(useBrag.getState().followNew).toBe(0);
      expect(useGame.getState().followSeenAt).toBe("2026-11-27T02:00:00.000Z");
    } finally { vi.unstubAllGlobals(); useBrag.setState({ sort: "new", list: [], status: "idle", followNew: 0 }); useGame.setState({ followSeenAt: undefined }); }
  });
});
