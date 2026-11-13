import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { CONFIG } from "../src/data/config";
import { ROUTINES, MODES, ZONES } from "../src/data/devices";
import { CUSTOMER_TYPES, FASHION, INTERIOR, LOUNGE_LEVELS, QUESTS, STAGES, stageFor } from "../src/data/game";
import { PRODUCTS, PRODUCT_MAP } from "../src/data/products";
import ko from "../src/i18n/ko.json";
import en from "../src/i18n/en.json";

const unique = (xs: string[]) => new Set(xs).size === xs.length;

describe("config.json", () => {
  it("모든 수치가 min ≤ value ≤ max 이고 설명이 있다", () => {
    for (const [g, knobs] of Object.entries(CONFIG)) for (const [k, kn] of Object.entries(knobs)) {
      expect(kn.value, `${g}.${k}`).toBeGreaterThanOrEqual(kn.min);
      expect(kn.value, `${g}.${k}`).toBeLessThanOrEqual(kn.max);
      expect(kn.step, `${g}.${k}`).toBeGreaterThan(0);
      expect(kn.note.length, `${g}.${k}`).toBeGreaterThan(3);
    }
  });
});

describe("상품 DB", () => {
  it("id · 공식몰 seq 가 중복되지 않는다", () => {
    expect(unique(PRODUCTS.map((p) => p.id))).toBe(true);
    expect(unique(PRODUCTS.map((p) => String(p.mallSeq)))).toBe(true);
  });
  it("모든 상품의 썸네일 파일이 있다", () => {
    for (const p of PRODUCTS) expect(existsSync(`public/products/${p.mallSeq}.webp`), p.id).toBe(true);
  });
  it("검증 완료 상품은 고시 정보(용량·제조업자)를 갖고, 화장품은 전성분·사용법도 갖는다", () => {
    for (const p of PRODUCTS.filter((x) => x.verified && x.kind !== "device")) {
      expect(p.ingredients, p.id).toBeTruthy();
      expect(p.howTo, p.id).toBeTruthy();
      expect(p.maker, p.id).toBeTruthy();
      for (const k of p.keyIngredients ?? []) expect(p.ingredients!.includes(k), `${p.id}: ${k}`).toBe(true);
    }
  });
});

describe("공식 루틴", () => {
  it("스텝의 제품·모드·부위가 모두 실제 데이터에 있고, 제품의 케어 모드와 일치한다", () => {
    for (const r of ROUTINES) {
      for (const z of r.zones) expect(ZONES[z], `${r.id}:${z}`).toBeTruthy();
      for (const s of r.steps) {
        expect(MODES[s.mode]).toBeTruthy();
        expect(s.products.length).toBeGreaterThan(0);
        for (const id of s.products) expect(PRODUCT_MAP[id], `${r.id}:${id}`).toBeTruthy();
        // 첫 번째(대표) 제품은 그 모드에 쓰이는 제품이어야 한다
        expect(PRODUCT_MAP[s.products[0]].modes, `${r.id}:${s.products[0]}`).toContain(s.mode);
      }
    }
  });
  it("미스트 마무리는 페이스 루틴에만 있다", () => {
    for (const r of ROUTINES) expect(r.mistFinish).toBe(r.area === "face");
  });
});

describe("성장 · 라운지 · 콘텐츠", () => {
  it("성장 단계 기준은 오름차순이고 stageFor 가 경계에서 맞다", () => {
    for (let i = 1; i < STAGES.length; i++) expect(STAGES[i].need).toBeGreaterThan(STAGES[i - 1].need);
    expect(stageFor(0)).toBe(1);
    for (const s of STAGES.slice(1)) { expect(stageFor(s.need - 1)).toBe(s.n - 1); expect(stageFor(s.need)).toBe(s.n); }
    expect(stageFor(1e9)).toBe(5);
  });
  it("성장할수록 머리는 작아지고 다리는 길어진다 (프로포션 키프레임)", () => {
    for (let i = 1; i < STAGES.length; i++) {
      expect(STAGES[i].body.head).toBeLessThan(STAGES[i - 1].body.head);
      expect(STAGES[i].body.leg).toBeGreaterThan(STAGES[i - 1].body.leg);
    }
  });
  it("라운지 등급이 오를수록 넓어지고 비용이 오른다", () => {
    for (let i = 1; i < LOUNGE_LEVELS.length; i++) {
      expect(LOUNGE_LEVELS[i].w).toBeGreaterThan(LOUNGE_LEVELS[i - 1].w);
      expect(LOUNGE_LEVELS[i].cost).toBeGreaterThan(LOUNGE_LEVELS[i - 1].cost);
      expect(LOUNGE_LEVELS[i].customers).toBeGreaterThanOrEqual(LOUNGE_LEVELS[i - 1].customers);
    }
  });
  it("고객이 좋아하는 루틴·외형 아이템, 퀘스트 보상 아이템이 실제로 존재한다", () => {
    const routineIds = ROUTINES.map((r) => r.id), fashionIds = FASHION.map((f) => f.id);
    for (const c of CUSTOMER_TYPES) {
      for (const l of c.likes) expect(routineIds, c.id).toContain(l);
      expect(fashionIds, c.id).toContain(c.look.hair);
      expect(fashionIds, c.id).toContain(c.look.outfit);
    }
    for (const q of QUESTS) if (q.reward.item) expect(PRODUCT_MAP[q.reward.item], q.id).toBeTruthy();
    expect(unique(FASHION.map((f) => f.id))).toBe(true);
    expect(unique(INTERIOR.map((f) => f.id))).toBe(true);
  });
  it("라운지 1에서 방문하는 고객마다, 해금된 루틴 중 좋아하는 것이 하나 이상 있다", () => {
    const open = ROUTINES.filter((r) => !r.unlock.stage && !r.unlock.lounge).map((r) => r.id);
    for (const c of CUSTOMER_TYPES.filter((x) => x.minLounge === 1)) expect(c.likes.some((l) => open.includes(l)), c.id).toBe(true);
  });
});

describe("다국어", () => {
  it("ko 와 en 의 키가 같다", () => {
    expect(Object.keys(ko).sort()).toEqual(Object.keys(en).sort());
  });
  it("UI 문구에 그림 이모지를 쓰지 않는다", () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{1F1E6}-\u{1F1FF}]/u;
    for (const [k, v] of [...Object.entries(ko), ...Object.entries(en)]) expect(emoji.test(v), k).toBe(false);
  });
});
