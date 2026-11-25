/** 케어 세션 진행 로직 (순수 상태 전이). 3D 연출은 three/Care3D.tsx 가 담당. */
import { tune } from "../data/config";
import * as THREE from "three";
import { MODES, ROUTINE_MAP, type ModeId, type Routine, type RoutineStep, type ZoneId } from "../data/devices";
import { CUSTOMER_TYPES, type ExpKey } from "../data/game";
import { PRODUCT_MAP, CARE_PRODUCTS } from "../data/products";
import { rankBonus, useGame } from "./game";
import { useUI, input } from "./ui";

/** 3D 이펙트와 공유하는 프레임 단위 값 */
export const careFx = { pos: new THREE.Vector3(), active: false, mode: "rf" as ModeId, burst: 0, mist: 0 };

export const routineUnlocked = (r: Routine, stage: number, lounge: number) => stage >= (r.unlock.stage ?? 1) && lounge >= (r.unlock.lounge ?? 1);

export function openCare(subject: "player" | string = "player") {
  useUI.setState({
    mode: "care", panel: null, near: null,
    care: { subject, routineId: null, title: "", phase: "pick", steps: [], zones: [], step: 0, applied: false, product: null, zone: null, done: [], progress: 0, modes: [], zonesDone: 0, mist: false, mistAllowed: false },
  });
  input.moveTarget = null;
}

export function beginRoutine(routineId: string, opts?: { express?: boolean; liked?: boolean }) {
  const r = ROUTINE_MAP[routineId];
  if (!r) return;
  const steps = opts?.express ? r.steps.slice(0, 2) : r.steps;
  const zones = opts?.express ? r.zones.slice(0, 2) : r.zones;
  useUI.getState().patchCare({ routineId, title: r.ko, phase: "step", steps, zones, step: 0, applied: false, product: null, zone: null, done: [], progress: 0, mistAllowed: r.mistFinish, liked: opts?.liked, dirGood: 0, dirAll: 0, dirLast: undefined });
  careFx.mode = steps[0].mode;
}

/** 자유 케어: 모드 하나를 골라 공식 조합 제품으로 페이스 부위를 관리 */
export function beginFree(mode: ModeId) {
  const products = CARE_PRODUCTS.filter((p) => p.modes.includes(mode)).map((p) => p.id);
  const step: RoutineStep = { mode, minutes: 5, products };
  useUI.getState().patchCare({ routineId: null, title: MODES[mode].label, phase: "step", steps: [step], zones: ["forehead", "cheek", "jaw", "neck"], step: 0, applied: false, product: null, zone: null, done: [], progress: 0, mistAllowed: true, dirGood: 0, dirAll: 0, dirLast: undefined });
  careFx.mode = mode;
}

/** 현재 스텝에서 쓸 수 있는(보유 중인) 제품 */
export function availableProduct(step: RoutineStep): string | null {
  const inv = useGame.getState().inventory;
  return step.products.find((id) => (inv[id] ?? 0) > 0) ?? null;
}

export function applyProduct(id: string): boolean {
  const ui = useUI.getState();
  if (!ui.care || !useGame.getState().consume(id)) return false;
  ui.patchCare({ applied: true, product: id, zone: ui.care.zones[0], progress: 0 });
  careFx.burst = 0.6;
  return true;
}

export function selectZone(z: ZoneId) {
  const c = useUI.getState().care;
  if (!c || !c.applied || c.done.includes(z) || c.zone === z) return;
  useUI.getState().patchCare({ zone: z, progress: 0 });
}

/** 결 방향 판정: 민 방향과 가이드 방향의 코사인 → 1 좋음 · 0 보통 · -1 반대 */
export function strokeGrade(cos: number): 1 | 0 | -1 {
  return cos > 0.6 ? 1 : cos < -0.3 ? -1 : 0;
}
/** 결 정확도(%) — 문지른 거리가 거의 없으면 없음 */
export function dirAccuracy(c: { dirGood?: number; dirAll?: number }): number | undefined {
  return c.dirAll && c.dirAll > 1e-4 ? Math.round(((c.dirGood ?? 0) / c.dirAll) * 100) : undefined;
}

/** 진행도를 더한다. cos 를 주면(문지름) 결 방향을 판정해 진행 배율과 정확도에 반영한다 */
export function addProgress(amount: number, cos?: number, dist = 0) {
  const ui = useUI.getState();
  const c = ui.care;
  if (!c || c.phase !== "step" || !c.applied || !c.zone) return;
  const dirPatch: Partial<typeof c> = {};
  if (cos !== undefined) {
    const g = strokeGrade(cos);
    amount *= g === 1 ? tune("care.dir_good_mult") : g === -1 ? tune("care.dir_bad_mult") : 1;
    dirPatch.dirAll = (c.dirAll ?? 0) + dist;
    dirPatch.dirGood = (c.dirGood ?? 0) + (g === 1 ? dist : 0);
    dirPatch.dirLast = g;
  }
  const p = c.progress + amount;
  if (p < 1) return ui.patchCare({ progress: p, ...dirPatch });
  ui.patchCare(dirPatch);
  // 부위 완료
  careFx.burst = 1;
  const done = [...c.done, c.zone];
  const next = c.zones.find((z) => !done.includes(z)) ?? null;
  if (next) return ui.patchCare({ done, zone: next, progress: 0, zonesDone: c.zonesDone + 1 });
  // 스텝 완료
  const modes = Array.from(new Set([...c.modes, c.steps[c.step].mode]));
  if (c.step + 1 < c.steps.length) {
    careFx.mode = c.steps[c.step + 1].mode;
    return ui.patchCare({ done: [], zone: null, progress: 0, zonesDone: c.zonesDone + 1, step: c.step + 1, applied: false, product: null, modes });
  }
  careFx.active = false;
  ui.patchCare({ done, zone: null, progress: 0, zonesDone: c.zonesDone + 1, modes, phase: c.mistAllowed ? "mist" : "result" });
  if (!c.mistAllowed) finishCare(false);
}

export function finishCare(withMist: boolean) {
  const ui = useUI.getState();
  const c = ui.care;
  if (!c) return;
  const g = useGame.getState();
  if (withMist) {
    if (!g.consume("serum-mist")) withMist = false;
    else careFx.mist = 1;
  }
  const full = c.routineId ? c.steps.length === ROUTINE_MAP[c.routineId].steps.length : false;
  const firstTime = !!c.routineId && full && !g.routinesDone.includes(c.routineId);
  const gain: Partial<Record<ExpKey, number>> = {
    skin: c.zonesDone * tune("care.zone_skin_exp") + (full ? tune("care.full_routine_bonus_exp") : 0) + (withMist ? tune("care.mist_skin_exp") : 0),
    device: c.zonesDone * tune("care.zone_device_exp") + (full ? tune("care.full_routine_bonus_exp") : 0),
    knowledge: c.steps.length * tune("care.step_knowledge_exp") + (full ? tune("care.full_routine_knowledge_exp") : 0) + (firstTime ? tune("care.first_clear_knowledge_exp") : 0),
  };
  let coins = c.steps.length * tune("care.step_coins");
  // 결 정확도 보너스: 가이드 방향대로 꼼꼼히 밀었으면
  const accuracy = dirAccuracy(c);
  const dirBonus = accuracy !== undefined && accuracy >= tune("care.dir_bonus_pct");
  if (dirBonus) gain.skin = (gain.skin ?? 0) + tune("care.dir_bonus_skin_exp");
  let stars: number | undefined; let lp: number | undefined;
  let customer: { name: string; type: string; stars: number; lp: number } | undefined;
  if (c.subject !== "player") {
    const cu = ui.customers.find((x) => x.id === c.subject);
    const type = CUSTOMER_TYPES.find((t) => t.id === cu?.type);
    stars = Math.min(5, (c.liked ? 4 : 3) + (withMist ? 1 : 0) + (c.liked && !c.mistAllowed ? 1 : 0));
    // 라운지 등급이 높을수록 결제와 LOUNGE POINT 에 보너스가 붙는다
    lp = Math.round(stars * tune("customer.lp_per_star") * rankBonus(g.rank));
    coins = Math.round((type?.pay ?? 60) * (tune("customer.pay_base") + stars * tune("customer.pay_per_star")) * rankBonus(g.rank));
    gain.lounge = tune("customer.lounge_exp_base") + c.steps.length * tune("customer.lounge_exp_per_step");
    gain.social = stars >= 4 ? 4 : 1;
    gain.skin = Math.round((gain.skin ?? 0) * tune("customer.skin_exp_ratio"));
    if (cu) { customer = { name: cu.name, type: cu.type, stars, lp }; ui.patchCustomer(cu.id, { stars }); }
  }
  if (dirBonus) coins += tune("care.dir_bonus_coins");
  g.finishCare({ routineId: full ? c.routineId : null, modes: c.modes, gain, coins, customer });
  useUI.getState().patchCare({ phase: "result", mist: withMist, result: { gain, coins, stars, lp, firstTime, accuracy, dirBonus } });
}

export function closeCare() {
  const ui = useUI.getState();
  const c = ui.care;
  careFx.active = false;
  if (c && c.subject !== "player") {
    // 케어를 마쳤으면 결제하러, 중간에 나가면 그냥 퇴장
    ui.patchCustomer(c.subject, { state: c.phase === "result" ? "toPay" : "leave", t: 0 });
  }
  useUI.setState({ mode: "explore", care: null, stroking: false });
}

export const productName = (id: string) => PRODUCT_MAP[id]?.name ?? id;
