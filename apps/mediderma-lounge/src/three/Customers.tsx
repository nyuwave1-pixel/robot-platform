/** 고객 NPC: 입장 → 대기(착석) → 상담 → 케어(침대) → 결제 → 퇴장 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import { CUSTOMER_NAMES, CUSTOMER_TYPES } from "../data/game";
import { DEFAULT_LOOK, useGame, type Look } from "../store/game";
import { useUI, type Customer } from "../store/ui";
import { Character, type Anim } from "./Character";
import { Label } from "./Label";
import type { Layout } from "./layout";
import { Lying } from "./lie";

/** 플레이어 근접 판정용 위치 공유 */
export const npcPos: Record<string, { x: number; z: number; state: string }> = {};
const NPC_GROWTH = 3.4;
let lastSpawn = 0;

export function Customers({ L }: { L: Layout }) {
  const customers = useUI((s) => s.customers);

  // 스포너: 라운지 등급의 수용 인원까지 주기적으로 방문
  useEffect(() => {
    const tick = () => {
      const ui = useUI.getState();
      const g = useGame.getState();
      if (ui.screen !== "game" || ui.visiting || ui.mode === "cinematic") return;
      const now = performance.now();
      const gap = ui.customers.length === 0 ? 7000 : 24000;
      if (ui.customers.length >= L.level.customers || now - lastSpawn < gap) return;
      lastSpawn = now;
      const pool = CUSTOMER_TYPES.filter((t) => t.minLounge <= g.lounge.level);
      // 단골 재방문
      const reg = g.regulars.length && Math.random() < 0.35 ? g.regulars[Math.floor(Math.random() * g.regulars.length)] : null;
      const type = (reg && pool.find((t) => t.id === reg.type)) || pool[Math.floor(Math.random() * pool.length)];
      const used = new Set(ui.customers.map((c) => c.seat));
      const seat = [0, 1, 2, 3, 4].find((i) => !used.has(i) && (i < 3 || g.lounge.level >= 3)) ?? 0;
      const names = CUSTOMER_NAMES.filter((n) => !ui.customers.some((c) => c.name === n));
      const c: Customer = { id: Math.random().toString(36).slice(2, 8), type: type.id, name: reg?.name ?? names[Math.floor(Math.random() * names.length)], state: "enter", seat, stars: 0, t: 0 };
      useUI.setState({ customers: [...ui.customers, c] });
      ui.toast(`🔔 ${c.name} · ${g.settings.lang === "ko" ? type.ko : type.en}`);
    };
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [L]);

  return <>{customers.map((c, i) => <Npc key={c.id} c={c} L={L} seed={i + 5} />)}</>;
}

function Npc({ c, L, seed }: { c: Customer; L: Layout; seed: number }) {
  const type = CUSTOMER_TYPES.find((t) => t.id === c.type)!;
  const look: Look = useMemo(() => ({ ...DEFAULT_LOOK, hair: type.look.hair, hairColor: type.look.hairColor, outfit: type.look.outfit, skin: type.look.skin, accessory: null, earring: "ear-pearl", bag: "bag-mini", shoes: "shoe-white" }), [type]);
  const g = useRef<THREE.Group>(null!);
  const pos = useRef({ x: L.entrance.x + (seed % 2 ? 0.4 : -0.4), z: L.d / 2 + 1.6 });
  const moving = useRef(false);
  const timer = useRef(0);
  const leg = useRef(0);
  const prevState = useRef(c.state);
  const seat = L.seats[c.seat] ?? L.seats[0];

  useEffect(() => () => { delete npcPos[c.id]; }, [c.id]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const ui = useUI.getState();
    if (prevState.current !== c.state) {
      // 케어를 마치면 침대 옆에서 다시 걷기 시작
      if (prevState.current === "care") { pos.current.x = L.bed.x + 0.6; pos.current.z = L.bed.z + 1.1; }
      prevState.current = c.state; timer.current = 0; leg.current = 0;
    }
    const p = pos.current;
    const walkTo = (tx: number, tz: number, speed = 1.7) => {
      const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
      if (d < 0.08) { moving.current = false; return true; }
      p.x += (dx / d) * speed * dt; p.z += (dz / d) * speed * dt;
      if (g.current) g.current.rotation.y = Math.atan2(dx, dz);
      moving.current = true;
      return false;
    };
    timer.current += dt;
    // 경유점을 따라 걷는다 (입구 → 통로 → 좌석 / 결제 → 통로 → 입구)
    const via = (pts: [number, number][], speed?: number) => {
      const i = Math.min(leg.current, pts.length - 1);
      if (walkTo(pts[i][0], pts[i][1], speed)) { if (i === pts.length - 1) return true; leg.current++; }
      return false;
    };
    const aisle = L.d / 2 - 3.4;
    if (c.state === "enter") {
      if (via([[p.x, aisle], [seat.x, aisle], [seat.x, seat.z - 0.05]])) { if (g.current) g.current.rotation.y = Math.PI; ui.patchCustomer(c.id, { state: "wait" }); }
    } else if (c.state === "wait") {
      moving.current = false;
      if (g.current) g.current.rotation.y = Math.PI;
      if (timer.current > 150 && ui.consult !== c.id) ui.patchCustomer(c.id, { state: "leave" });
    } else if (c.state === "toPay") {
      if (walkTo(L.payPoint.x, L.payPoint.z)) { if (g.current) g.current.rotation.y = 0; ui.patchCustomer(c.id, { state: "pay" }); }
    } else if (c.state === "pay") {
      moving.current = false;
      if (timer.current > 2.6) ui.patchCustomer(c.id, { state: "leave" });
    } else if (c.state === "leave") {
      if (via([[L.entrance.x, aisle + 1.4], [L.entrance.x, L.d / 2 + 2.2]], 2)) useUI.setState({ customers: useUI.getState().customers.filter((x) => x.id !== c.id) });
    }
    if (g.current) g.current.position.set(p.x, 0, p.z);
    npcPos[c.id] = { x: p.x, z: p.z, state: c.state };
  });

  if (c.state === "care")
    return (
      <Lying L={L} growth={NPC_GROWTH}>
        <Character look={look} growth={NPC_GROWTH} anim="lie" mood="relaxed" seed={seed} />
      </Lying>
    );
  const anim: Anim = c.state === "wait" ? "sit" : c.state === "pay" ? "pay" : "idle";
  return (
    <group ref={g}>
      <Character look={look} growth={NPC_GROWTH} anim={anim} movingRef={moving} seed={seed} mood={c.state === "pay" || c.state === "leave" ? "happy" : "smile"} />
      {(c.state === "wait" || c.state === "pay") && (
        <Billboard position={[0, c.state === "wait" ? 1.75 : 2.1, 0]}>
          <mesh>
            <circleGeometry args={[0.2, 24]} />
            <meshBasicMaterial color={c.state === "wait" ? "#ff7fa5" : "#c9a66b"} toneMapped={false} />
          </mesh>
          <Label text={c.state === "wait" ? "!" : "★".repeat(Math.max(1, c.stars))} width={c.state === "wait" ? 1.5 : 0.36} position={[0, 0, 0.01]} color="#ffffff" size={150} weight={800} spacing={0} />
        </Billboard>
      )}
    </group>
  );
}
