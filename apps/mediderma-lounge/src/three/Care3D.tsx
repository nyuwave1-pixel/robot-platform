/**
 * DERMA HOME 3D 체험: 부위 마커 선택 → 디바이스 헤드를 문질러 진행 게이지를 채운다.
 * 모드별 판타지 이펙트 — RF: 따뜻한 엠버 / ULTRASONIC: 물결 링 / IONTOPHORESIS: 은은한 스파크.
 * (실제 기기 강도·시간이 아니라 축약된 체험 연출)
 */
import { tune } from "../data/config";
import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useShallow } from "zustand/react/shallow";
import { MODES, type ZoneId } from "../data/devices";
import { useGame } from "../store/game";
import { useUI } from "../store/ui";
import { addProgress, careFx, selectZone } from "../store/care";
import { bodyDims } from "./Character";
import { Handpiece } from "./Props";
import type { Layout } from "./layout";
import { lieOrigin } from "./lie";

/** 누운 캐릭터의 부위 월드 좌표 */
export function zonePoints(L: Layout, growth: number): Record<ZoneId, THREE.Vector3> {
  const d = bodyDims(growth);
  const [ox, oy, oz] = lieOrigin(L, growth);
  const R = d.head;
  const w = (lx: number, ly: number, lz: number) => new THREE.Vector3(ox - ly, oy + lz, oz - lx);
  const topY = d.leg + d.torso;
  return {
    forehead: w(0, d.headY + R * 0.5, R * 0.86),
    cheek: w(-R * 0.6, d.headY - R * 0.4, R * 0.72),
    jaw: w(-R * 0.15, d.headY - R * 0.72, R * 0.68),
    neck: w(0, topY + d.neck * 0.5 - 0.02, d.limb * 1.4),
    scalp: w(-R * 0.2, d.headY + R * 0.98, R * 0.45),
    body: w(0, d.leg + d.torso * 0.5, d.shoulder * 1.0),
  };
}

const N = 110;
export function Care3D({ L }: { L: Layout }) {
  // progress 는 프레임 루프에서 직접 읽으므로 구독하지 않는다 (스트로크 중 리렌더 방지)
  const care = useUI(useShallow((s) => ({ subject: s.care!.subject, steps: s.care!.steps, step: s.care!.step, zones: s.care!.zones, done: s.care!.done, zone: s.care!.zone, applied: s.care!.applied, phase: s.care!.phase })));
  const stage = useGame((s) => s.stage);
  const growth = care.subject === "player" ? stage : 3.4;
  const pts = useMemo(() => zonePoints(L, growth), [L, growth]);
  const d = bodyDims(growth);
  const hitR = Math.max(0.1, d.head * 0.42);
  const step = care.steps[care.step];
  const mode = step ? MODES[step.mode] : MODES.rf;
  const active = care.phase === "step" && care.applied;

  const hand = useRef<THREE.Group>(null!);
  const glowM = useRef<THREE.Mesh>(null!);
  const inst = useRef<THREE.InstancedMesh>(null!);
  const rings = useRef<THREE.Group>(null!);
  const last = useRef<THREE.Vector3 | null>(null);
  const hold = useRef(false);
  const onZone = useRef(false);
  const cp = useMemo(() => new THREE.Vector3(), []);
  const P = useMemo(() => ({
    pos: new Float32Array(N * 3), vel: new Float32Array(N * 3), life: new Float32Array(N), max: new Float32Array(N).fill(1),
    col: Array.from({ length: N }, () => new THREE.Color()), i: 0, m: new THREE.Matrix4(), c: new THREE.Color(),
  }), []);

  const emit = (at: THREE.Vector3, kind: string, color: string, n: number) => {
    for (let k = 0; k < n; k++) {
      const i = (P.i = (P.i + 1) % N);
      const a = Math.random() * Math.PI * 2, r = Math.random();
      P.pos[i * 3] = at.x + Math.cos(a) * 0.03; P.pos[i * 3 + 1] = at.y + 0.01; P.pos[i * 3 + 2] = at.z + Math.sin(a) * 0.03;
      if (kind === "ember") { P.vel[i * 3] = Math.cos(a) * 0.08; P.vel[i * 3 + 1] = 0.35 + r * 0.35; P.vel[i * 3 + 2] = Math.sin(a) * 0.08; P.max[i] = 0.9; }
      else if (kind === "ripple") { P.vel[i * 3] = Math.cos(a) * 0.45; P.vel[i * 3 + 1] = 0.03; P.vel[i * 3 + 2] = Math.sin(a) * 0.45; P.max[i] = 0.55; }
      else if (kind === "spark") { P.vel[i * 3] = Math.cos(a) * 0.7 * r; P.vel[i * 3 + 1] = (Math.random() - 0.2) * 0.6; P.vel[i * 3 + 2] = Math.sin(a) * 0.7 * r; P.max[i] = 0.32; }
      else { P.vel[i * 3] = Math.cos(a) * (0.3 + r * 0.9); P.vel[i * 3 + 1] = 0.5 + r * 1.2; P.vel[i * 3 + 2] = Math.sin(a) * (0.3 + r * 0.9); P.max[i] = 1.1; }
      P.life[i] = P.max[i];
      P.col[i].set(color);
    }
  };

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const c = useUI.getState().care;
    const zone = c?.zone ? pts[c.zone] : null;
    // 누르고 있기만 해도 조금씩 진행 (터치 접근성)
    if (hold.current && onZone.current && c?.applied) addProgress(dt * tune("care.hold_rate"));
    careFx.active = hold.current && onZone.current && !!c?.applied;
    if (careFx.active) emit(careFx.pos, mode.fx, mode.color, mode.fx === "spark" ? 3 : 2);
    if (careFx.burst > 0) { emit(zone ?? careFx.pos, "burst", "#ffe2a0", Math.round(26 * careFx.burst)); careFx.burst = 0; }
    if (careFx.mist > 0) { for (let i = 0; i < 6; i++) emit(cp.copy(pts.forehead).add(new THREE.Vector3((Math.random() - 0.6) * 0.3, 0.35, (Math.random() - 0.5) * 0.3)), "ripple", "#cfe9ff", 3); careFx.mist -= dt * 0.9; }

    // 파티클 업데이트
    if (inst.current) {
      for (let i = 0; i < N; i++) {
        if (P.life[i] > 0) {
          P.life[i] -= dt;
          P.pos[i * 3] += P.vel[i * 3] * dt; P.pos[i * 3 + 1] += P.vel[i * 3 + 1] * dt; P.pos[i * 3 + 2] += P.vel[i * 3 + 2] * dt;
          if (P.max[i] > 1) P.vel[i * 3 + 1] -= dt * 2.2;
        }
        const s = P.life[i] > 0 ? 0.012 + (P.life[i] / P.max[i]) * 0.016 : 0;
        P.m.makeScale(s, s, s).setPosition(P.pos[i * 3], P.pos[i * 3 + 1], P.pos[i * 3 + 2]);
        inst.current.setMatrixAt(i, P.m);
        inst.current.setColorAt(i, P.col[i]);
      }
      inst.current.instanceMatrix.needsUpdate = true;
      if (inst.current.instanceColor) inst.current.instanceColor.needsUpdate = true;
    }
    // 디바이스 헤드: 스트로크 중엔 포인터를, 아니면 선택 부위 위에서 대기
    if (hand.current) {
      const t = clock.elapsedTime;
      if (zone && c?.applied) {
        const target = careFx.active ? careFx.pos : cp.copy(zone).setY(zone.y + 0.1 + Math.sin(t * 3) * 0.015);
        hand.current.position.lerp(target, careFx.active ? 0.5 : 0.12);
        hand.current.visible = true;
        if (step?.mode === "us" && careFx.active) hand.current.position.x += Math.sin(t * 90) * 0.0015; // 미세 진동
      } else hand.current.visible = false;
    }
    if (glowM.current) {
      const show = !!zone && !!c?.applied;
      glowM.current.visible = show;
      if (zone && c) { glowM.current.position.copy(zone); (glowM.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + c.progress * 0.38 + (careFx.active ? Math.sin(clock.elapsedTime * 14) * 0.05 : 0); }
    }
    if (rings.current) {
      rings.current.visible = careFx.active && mode.fx === "ripple";
      rings.current.position.copy(careFx.pos);
      rings.current.children.forEach((r, i) => {
        const k = (clock.elapsedTime * 1.6 + i / 3) % 1;
        r.scale.setScalar(0.4 + k * 2.2);
        ((r as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.7;
      });
    }
  });

  const pick = (ray: THREE.Ray): ZoneId | null => {
    const c = useUI.getState().care;
    if (!c) return null;
    let best: ZoneId | null = null, bd = hitR * 1.25;
    for (const z of c.zones) {
      if (c.done.includes(z)) continue;
      const dd = ray.distanceToPoint(pts[z]);
      if (dd < bd) { bd = dd; best = z; }
    }
    return best;
  };
  const down = (e: ThreeEvent<PointerEvent>) => {
    if (!active) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const z = pick(e.ray);
    if (z) selectZone(z);
    hold.current = true; last.current = null;
    useUI.setState({ stroking: true });
    track(e);
  };
  const track = (e: ThreeEvent<PointerEvent>) => {
    const c = useUI.getState().care;
    if (!hold.current || !c?.zone) return;
    const zp = pts[c.zone];
    e.ray.closestPointToPoint(zp, cp);
    const off = cp.distanceTo(zp);
    onZone.current = off < hitR * 1.7;
    if (!onZone.current) { last.current = null; return; }
    // 피부 표면에 붙도록 부위 중심에서 살짝만 벗어나게
    if (off > hitR) cp.sub(zp).setLength(hitR).add(zp);
    careFx.pos.copy(cp).setY(Math.max(cp.y, zp.y + 0.012));
    if (last.current) addProgress(Math.min(0.08, last.current.distanceTo(cp) / (hitR * tune("care.stroke_length"))));
    last.current = (last.current ?? new THREE.Vector3()).copy(cp);
  };
  const up = () => { hold.current = false; onZone.current = false; last.current = null; careFx.active = false; useUI.setState({ stroking: false }); };

  const head = pts.forehead;
  return (
    <group>
      {/* 포인터 입력을 받는 보이지 않는 면 */}
      <mesh position={[L.bed.x, head.y + 0.05, L.bed.z]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={down} onPointerMove={track} onPointerUp={up} onPointerCancel={up}>
        <planeGeometry args={[4.5, 3.2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 부위 마커 */}
      {active && care.zones.map((z) => {
        const done = care.done.includes(z);
        const on = care.zone === z;
        return (
          <group key={z} position={pts[z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <ringGeometry args={[hitR * 0.62, hitR * 0.78, 32]} />
              <meshBasicMaterial color={done ? "#d8b468" : on ? mode.color : "#ffffff"} transparent opacity={done ? 0.9 : on ? 0.95 : 0.6} depthTest={false} toneMapped={false} />
            </mesh>
            {done && (
              <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[hitR * 0.36, 20]} />
                <meshBasicMaterial color="#ffe2a0" transparent opacity={0.85} depthTest={false} toneMapped={false} />
              </mesh>
            )}
          </group>
        );
      })}

      <mesh ref={glowM} visible={false}>
        <sphereGeometry args={[hitR * 0.95, 20, 16]} />
        <meshBasicMaterial color={mode.color} transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>

      <group ref={hand} visible={false}>
        <Handpiece mode={step?.mode ?? "rf"} scale={d.head > 0.3 ? 1.5 : 1.15} />
        <pointLight intensity={1.6} distance={1.2} color={mode.color} position={[0, 0.05, 0]} />
      </group>

      <group ref={rings}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
            <ringGeometry args={[0.05, 0.058, 32]} />
            <meshBasicMaterial color={mode.color} transparent opacity={0.6} depthTest={false} toneMapped={false} />
          </mesh>
        ))}
      </group>

      <instancedMesh ref={inst} args={[undefined, undefined, N]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.95} />
      </instancedMesh>
    </group>
  );
}
