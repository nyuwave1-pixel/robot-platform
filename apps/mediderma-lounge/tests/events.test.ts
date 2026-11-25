import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { EVENT_HOST_DAILY, EVENT_REWARD_CAP, EVENT_VISIT_DAILY, LOUNGE_EVENTS, NOTICES, cleanEvents, isActive } from "../src/data/events";
import { cleanEvent, cleanLobby } from "../src/net/room";
import { useEvents } from "../src/store/events";
import { DEFAULT_LOOK, useGame } from "../src/store/game";

const g = () => useGame.getState();
const ev = () => useEvents.getState();
const today = new Date().toISOString().slice(0, 10);
beforeEach(() => {
  g().reset(); g().startNew("테스트", DEFAULT_LOOK);
  useGame.setState({ coins: 10_000, gems: 0, stars: 0 });
  useEvents.setState({ claimed: [], seen: [], open: true, hosting: null, contestClaimed: [], daily: { date: today, hosted: 0, visits: 0, owners: [] } });
});

describe("공식 이벤트 (public/events.json)", () => {
  it("배포되는 events.json 이 형식에 맞고 모두 읽힌다", () => {
    const raw = JSON.parse(readFileSync(join(__dirname, "../public/events.json"), "utf8"));
    const list = cleanEvents(raw);
    expect(list.length).toBe(raw.events.length);
    for (const e of list) expect(Date.parse(e.end)).toBeGreaterThan(Date.parse(e.start));
  });
  it("모르는 값·잘못된 날짜·과한 보상은 걸러 낸다", () => {
    const list = cleanEvents({ events: [
      { id: "ok-1", ko: "<b>이벤트</b>", start: "2026-01-01", end: "2026-02-01", color: "red", reward: { coins: 99999999, gems: -5 }, cta: "hack" },
      { id: "BAD ID", ko: "x", start: "2026-01-01", end: "2026-02-01" },
      { id: "no-date", ko: "x", start: "nope", end: "2026-02-01" },
      { id: "reverse", ko: "x", start: "2026-03-01", end: "2026-02-01" },
      { id: "ok-1", ko: "중복", start: "2026-01-01", end: "2026-02-01" },
    ] });
    expect(list.map((e) => e.id)).toEqual(["ok-1"]);
    expect(list[0].ko).toBe("b이벤트/b");
    expect(list[0].color).toBe("#e2718d");
    expect(list[0].reward).toEqual({ coins: EVENT_REWARD_CAP.coins, gems: 0, stars: 0 });
    expect(list[0].cta).toBeUndefined();
    expect(cleanEvents("garbage")).toEqual([]);
  });
  it("기간 안에서만, 한 번만 보상을 받는다", () => {
    const [e] = cleanEvents([{ id: "gift", ko: "선물", start: "2026-01-01T00:00:00Z", end: "2026-01-10T00:00:00Z", reward: { coins: 100, gems: 2 } }]);
    expect(isActive(e, Date.parse("2026-01-05"))).toBe(true);
    expect(ev().claimOfficial(e, Date.parse("2025-12-31"))).toBeNull();
    expect(ev().claimOfficial(e, Date.parse("2026-01-05"))).toEqual({ coins: 100, gems: 2, stars: 0 });
    expect(g().coins).toBe(10_100);
    expect(g().gems).toBe(2);
    expect(ev().claimOfficial(e, Date.parse("2026-01-06"))).toBeNull();
    expect(g().coins).toBe(10_100);
  });
});

describe("라운지 이벤트 · 공지", () => {
  it("코인을 내고 열고, 하루 횟수와 중복 진행을 막는다", () => {
    const t0 = Date.now();
    const e = LOUNGE_EVENTS[0];
    expect(ev().startLoungeEvent(e.id, t0)).toBe("ok");
    expect(g().coins).toBe(10_000 - e.cost);
    expect(ev().hosting?.until).toBe(t0 + e.minutes * 60_000);
    expect(ev().startLoungeEvent(e.id, t0 + 1000)).toBe("busy");
    for (let i = 1; i < EVENT_HOST_DAILY; i++) { ev().endLoungeEvent(); expect(ev().startLoungeEvent(e.id, t0)).toBe("ok"); }
    ev().endLoungeEvent();
    expect(ev().startLoungeEvent(e.id, t0)).toBe("limit");
    expect(ev().startLoungeEvent(999, t0)).toBe("bad");
    useEvents.setState({ daily: { date: today, hosted: 0, visits: 0, owners: [] } });
    useGame.setState({ coins: 0 });
    expect(ev().startLoungeEvent(e.id, t0)).toBe("money");
  });
  it("방문 혜택은 진행 중인 이벤트에서 라운지마다 하루 한 번, 하루 한도까지", () => {
    const now = Date.now(), e = LOUNGE_EVENTS[0];
    expect(ev().eventVisit("AAAAAA", e.id, now - 1, now)).toBeNull(); // 끝난 이벤트
    expect(ev().eventVisit(g().friendCode, e.id, now + 60_000, now)).toBeNull(); // 내 라운지
    expect(ev().eventVisit("AAAAAA", e.id, now + 9 * 3_600_000, now)).toBeNull(); // 말이 안 되는 종료 시각
    expect(ev().eventVisit("AAAAAA", e.id, now + 60_000, now)).toEqual({ coins: e.coins, stars: e.stars });
    expect(ev().eventVisit("AAAAAA", e.id, now + 60_000, now)).toBeNull();
    for (let i = 1; i < EVENT_VISIT_DAILY; i++) expect(ev().eventVisit(`BBBBB${i}`, e.id, now + 60_000, now)).not.toBeNull();
    expect(ev().eventVisit("CCCCCC", e.id, now + 60_000, now)).toBeNull();
  });
  it("공지 문구는 번호가 이어지고 ko/en 이 모두 있다", () => {
    NOTICES.forEach((n, i) => { expect(n.id).toBe(i); expect(n.ko && n.en).toBeTruthy(); });
  });
});

describe("오픈 라운지 네트워크 입력 검증", () => {
  it("다른 사람이 보낸 이벤트는 아는 종류이고 곧 끝나는 것만", () => {
    const now = 1_000_000;
    expect(cleanEvent({ id: 1, until: now + 60_000 }, now)).toEqual({ id: 1, until: now + 60_000 });
    expect(cleanEvent({ id: 77, until: now + 60_000 }, now)).toBeNull();
    expect(cleanEvent({ id: 1, until: now - 1 }, now)).toBeNull();
    expect(cleanEvent({ id: 1, until: now + 9e9 }, now)?.until).toBe(now + 2 * 3_600_000);
    expect(cleanEvent("x", now)).toBeNull();
  });
  it("로비는 코드가 올바른 라운지만, 내 라운지·중복 없이, 이벤트 중인 곳부터", () => {
    const now = 1_000_000;
    const list = cleanLobby({
      a: [{ code: "AAAAAA", name: "A", level: 2, guests: 5 }],
      b: [{ code: "BBBBBB", name: "B", level: 99, guests: 1, ev: { id: 2, until: now + 1000 } }],
      c: [{ code: "AAAAAA", name: "A2" }],
      d: [{ code: "bad", name: "X" }],
      e: [{ code: "MYCODE", name: "me" }],
    }, "MYCODE", now);
    expect(list.map((o) => o.code)).toEqual(["BBBBBB", "AAAAAA"]);
    expect(list[0].level).toBe(10);
  });
});

describe("주간 라운지 꾸미기 콘테스트", async () => {
  const { contestReward, weekOf, weekEndsAt, cleanEntry } = await import("../src/net/contest");
  it("주 표기는 한국 시간 ISO 주 (서버와 같은 규칙)", () => {
    expect(weekOf(Date.parse("2026-11-22T05:00:00Z"))).toBe("2026-W47"); // 일요일 14시 KST
    expect(weekOf(Date.parse("2026-11-22T15:30:00Z"))).toBe("2026-W48"); // 월요일 00:30 KST
    expect(weekOf(Date.parse("2027-01-01T03:00:00Z"))).toBe("2026-W53");
    expect(weekEndsAt(Date.parse("2026-11-22T05:00:00Z"))).toBe(Date.parse("2026-11-22T15:00:00Z"));
    expect(weekEndsAt(Date.parse("2026-11-16T00:00:00Z"))).toBe(Date.parse("2026-11-22T15:00:00Z"));
  });
  it("순위 보상은 높을수록 크고, 순위가 없으면 없다", () => {
    expect(contestReward(null)).toBeNull();
    expect(contestReward(1)!.gems).toBeGreaterThan(contestReward(2)!.gems);
    expect(contestReward(3)!.coins).toBeGreaterThan(contestReward(4)!.coins);
    expect(contestReward(10)!.coins).toBeGreaterThan(contestReward(11)!.coins);
  });
  it("보상은 주마다 한 번만", () => {
    const c = g().coins;
    expect(ev().claimContest("2026-W46", contestReward(1))).toBe(true);
    expect(g().coins).toBe(c + 3000);
    expect(ev().claimContest("2026-W46", contestReward(1))).toBe(false);
    expect(ev().claimContest("nope", contestReward(1))).toBe(false);
    expect(ev().claimContest("2026-W47", null)).toBe(false);
  });
  it("서버가 준 출품작도 아는 값만 받아들인다", () => {
    expect(cleanEntry({ code: "bad" })).toBeNull();
    const e = cleanEntry({ code: "ABC123", name: "<i>x", level: 77, votes: "12", rank: 2, snapshot: { lounge: { level: 2, furniture: [{ type: "nope" }] }, look: { hair: "zzz" }, stage: 9 } })!;
    expect(e.name).toBe("ix");
    expect(e.level).toBe(10);
    expect(e.votes).toBe(12);
    expect(e.lounge.furniture).toEqual([]);
    expect(e.stage).toBe(5);
  });
});

describe("라운지 방명록", async () => {
  const { GB_MESSAGES, GB_STICKERS, cleanNote } = await import("../src/net/guestbook");
  it("문구·스티커 번호가 서버 범위(문구 0–19, 스티커 0–9) 안이고 겹치지 않는다", () => {
    expect(new Set(GB_MESSAGES.map((m) => m.id)).size).toBe(GB_MESSAGES.length);
    expect(GB_MESSAGES.every((m) => m.id >= 0 && m.id <= 19 && m.ko && m.en)).toBe(true);
    expect(GB_STICKERS.every((s, i) => s.id === i && s.id <= 9 && /^#[0-9a-f]{6}$/i.test(s.color))).toBe(true);
  });
  it("서버 값은 아는 형식만 받는다", () => {
    const ok = cleanNote({ writer: "ABC123", name: "<b>Mina</b>", msg: 3, sticker: 2, at: "2026-11-23T01:00:00Z" });
    expect(ok?.writer).toBe("ABC123");
    expect(ok?.name).not.toMatch(/[<>]/);
    expect(cleanNote({ writer: "bad", msg: 1, sticker: 0, at: "2026-11-23T01:00:00Z" })).toBeNull();
    expect(cleanNote({ writer: "ABC123", msg: 99, sticker: 0, at: "2026-11-23T01:00:00Z" })).toBeNull();
    expect(cleanNote({ writer: "ABC123", msg: 1, sticker: 77, at: "2026-11-23T01:00:00Z" })?.sticker).toBe(0);
    expect(cleanNote(null)).toBeNull();
  });
});

describe("단체 사진", async () => {
  const { activeGroup, startGroupPhoto, useRoom, GROUP_COUNTDOWN } = await import("../src/net/room");
  it("실시간 방에 들어가 있지 않으면 시작하지 않는다", () => {
    expect(startGroupPhoto()).toBe("offline");
    expect(useRoom.getState().group).toBeNull();
  });
  it("촬영 시각이 지나고 잠시 뒤에는 진행 중이 아니다", () => {
    const now = Date.now();
    useRoom.setState({ group: { at: now + GROUP_COUNTDOWN, by: "A", n: 2 } });
    expect(activeGroup(now)?.n).toBe(2);
    expect(activeGroup(now + GROUP_COUNTDOWN + 3000)).toBeNull();
    useRoom.setState({ group: null });
  });
});

describe("플랫폼 연동 (비트파크 우선)", async () => {
  const { BITPARK_GAME_ID, BITPARK_ORIGINS, BITPARK_PLAY_URL, bitpark, bitparkOrigin, eventMessage, linkQuery, resultMessage } = await import("../src/platform/bitpark");
  const { HOME_PLATFORM, ADAPTERS, platform, shareUrl, resetPlatformForTest } = await import("../src/platform");
  it("포털이 받는 결과 형식 (game_result · 게임 id · 포털 상한 안의 RP) + 활동 이벤트", () => {
    const m = resultMessage(3.7);
    expect(m).toEqual({ type: "game_result", game: BITPARK_GAME_ID, score: 3, rp: m.rp });
    expect(m.rp).toBeGreaterThan(0);
    expect(m.rp).toBeLessThanOrEqual(65);
    expect(eventMessage("brag", 1)).toEqual({ type: "game_event", game: BITPARK_GAME_ID, event: "brag", score: 1 });
  });
  it("허용된 포털 주소만 쓰고, iframe 밖에서는 일반 웹으로 감지한다", () => {
    expect(BITPARK_ORIGINS.every((o) => o.startsWith("https://") && o.includes("airobotphysical"))).toBe(true);
    expect(bitparkOrigin()).toBeNull();
    resetPlatformForTest();
    expect(platform().id).toBe("web");
    expect(ADAPTERS[ADAPTERS.length - 1].id).toBe("web");
    expect(HOME_PLATFORM.id).toBe("bitpark");
  });
  it("공유 · 초대 링크는 비트파크 게임 주소로, 형식이 맞는 값만 담는다", () => {
    const u = new URL(shareUrl({ invite: "ABC123", from: "미나<b>", visit: "bad!" }));
    expect(u.origin + u.pathname).toBe(BITPARK_PLAY_URL);
    expect(u.searchParams.get("invite")).toBe("ABC123");
    expect(u.searchParams.get("from")).toBe("미나b");
    expect(u.searchParams.has("visit")).toBe(false);
    expect(linkQuery({ open: "contest" }).get("open")).toBe("contest");
    expect(bitpark.playUrl()).toBe(BITPARK_PLAY_URL);
  });
});

describe("비트파크 → 게임 상태", async () => {
  const { cleanStatus } = await import("../src/platform/status");
  it("아는 형식만 받고, 로그인 안 했으면 이름 · RP 를 버린다", () => {
    expect(cleanStatus({ loggedIn: true, name: "미나<script>", rp: 1234.7, rpToday: true, rpReward: 40 })).toEqual({ known: true, loggedIn: true, name: "미나script", rp: 1234, rpToday: true, rpReward: 40 });
    expect(cleanStatus({ loggedIn: false, name: "x", rp: 99 })).toMatchObject({ loggedIn: false, name: "", rp: null });
    expect(cleanStatus({ name: "no flag" })).toBeNull();
    expect(cleanStatus({ loggedIn: true, rp: -5, rpReward: "40" })).toMatchObject({ rp: 0, rpReward: 0 });
  });
});
