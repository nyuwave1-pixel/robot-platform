/**
 * DERMA HOME 3D 체험: 부위 마커 선택 → 디바이스 헤드를 문질러 진행 게이지를 채운다.
 * 모드별 판타지 이펙트 — RF: 따뜻한 엠버 / ULTRASONIC: 물결 링 / IONTOPHORESIS: 은은한 스파크.
 * (실제 기기 강도·시간이 아니라 축약된 체험 연출)
 */
import { tune } from "../data/config";
import { useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useShallow } from "zustand/react/shallow";
import { MODES, type ZoneId } from "../data/devices";
import { useGame } from "../store/game";
import { useUI } from "../store/ui";
import { addProgress, careFx, selectZone } from "../store/care";
import { bodyDims, styleNow } from "./Character";
import { lieRig } from "./RealCharacter";
import { Handpiece } from "./Props";
import type { Layout } from "./layout";
import { lieOrigin } from "./lie";

/**
 * 실사 캐릭터: 누워 있는 모델의 머리·목 뼈에서 부위를 잡는다 (모델마다 키·머리 위치가 다르다).
 * a = 목→머리 방향(정수리 쪽), u = 얼굴이 향한 위쪽, s = 볼 쪽 옆. 값은 m, 모델 배율에 비례.
 */
export function rigZonePoints(): Record<ZoneId, THREE.Vector3> | null {
  if (styleNow() !== "real" || performance.now() - lieRig.at > 1500) return null;
  const H = lieRig.head, Nk = lieRig.neck;
  const a = H.clone().sub(Nk).setY(0);
  if (a.lengthSq() < 1e-6) return null;
  a.normalize();
  const k = lieRig.scale / 0.86;
  const u = new THREE.Vector3(0, 1, 0), sd = new THREE.Vector3(-a.z, 0, a.x); // 머리 방향을 기준으로 한쪽 볼
  const at = (base: THREE.Vector3, along: number, up: number, side = 0) => base.clone().addScaledVector(a, along * k).addScaledVector(u, up * k).addScaledVector(sd, side * k);
  const mid = H.clone().add(Nk).multiplyScalar(0.5);
  return {
    forehead: at(H, ZONE_RIG.forehead[0], ZONE_RIG.forehead[1], ZONE_RIG.forehead[2]),
    cheek: at(H, ZONE_RIG.cheek[0], ZONE_RIG.cheek[1], ZONE_RIG.cheek[2]),
    jaw: at(H, ZONE_RIG.jaw[0], ZONE_RIG.jaw[1], ZONE_RIG.jaw[2]),
    neck: at(mid, ZONE_RIG.neck[0], ZONE_RIG.neck[1], ZONE_RIG.neck[2]),
    scalp: at(H, ZONE_RIG.scalp[0], ZONE_RIG.scalp[1], ZONE_RIG.scalp[2]),
    body: at(H, ZONE_RIG.body[0], ZONE_RIG.body[1], ZONE_RIG.body[2]),
  };
}
/** [머리 방향, 얼굴 위쪽, 옆] 오프셋 (m, 기본 체형 기준) — 실제 화면에서 맞춘 값 */
export const ZONE_RIG: Record<ZoneId, [number, number, number]> = {
  forehead: [0.105, 0.09, 0],
  cheek: [0.035, 0.078, 0.042],
  jaw: [-0.03, 0.07, 0.022],
  neck: [-0.06, 0.05, 0],
  scalp: [0.17, 0.03, 0],
  body: [-0.45, 0.12, 0],
};
/** 부위마다 디바이스를 미는 방향 (공식 가이드: 미간→관자놀이, 볼→귀, 턱선→귀밑, 목은 아래→위) */
export const ZONE_DIR: Record<ZoneId, [number, number]> = {
  forehead: [0, 1], cheek: [0.6, 0.8], jaw: [0.45, 0.9], neck: [1, 0], scalp: [1, 0], body: [1, 0],
};

/** 누운 캐릭터의 부위 월드 좌표 (코드 캐릭터 · 실사 모델을 아직 못 불러왔을 때) */
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
  // 실사 모델이 누운 뒤 뼈 위치가 잡히면 한 번 다시 계산한다
  const [rigVer, setRigVer] = useState(0);
  const pts = useMemo(() => rigZonePoints() ?? zonePoints(L, growth), [L, growth, rigVer]);
  const rigSeen = useRef(false);
  // 얼굴 기준 방향: a = 정수리 쪽, sd = 볼 쪽 (실사 모델이면 뼈에서, 아니면 기본값 — 머리는 -x 쪽)
  const axes = useMemo(() => {
    const a = performance.now() - lieRig.at < 1500 ? lieRig.head.clone().sub(lieRig.neck).setY(0).normalize() : new THREE.Vector3(-1, 0, 0);
    if (!isFinite(a.x) || a.lengthSq() < 0.5) a.set(-1, 0, 0);
    return { a, sd: new THREE.Vector3(-a.z, 0, a.x) };
  }, [rigVer]);
  const guide = useRef<THREE.Group>(null!);
  const dv = useMemo(() => new THREE.Vector3(), []);
  const gv = useMemo(() => new THREE.Vector3(), []);
  const tilt = useRef<THREE.Group>(null!);
  const d = bodyDims(growth);
  const hitR = Math.max(0.1, d.head * 0.42);
  // 표시 링은 얼굴 크기에 맞게 작게 (터치 판정 hitR 은 손가락으로 누르기 쉽게 그대로 둔다)
  const ringR = Math.min(hitR * 0.6, d.head * 0.38);
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
    col: Array.from({ length: N }, () => new THREE.Color()), i: 0, m: new THREE.Matrix4(), c: new THREE.Color(), base: 0,
  }), []);

  const emit = (at: THREE.Vector3, kind: string, color: string, n: number) => {
    P.base = at.y;
    for (let k = 0; k < n; k++) {
      const i = (P.i = (P.i + 1) % N);
      const a = Math.random() * Math.PI * 2, r = Math.random();
      P.pos[i * 3] = at.x + Math.cos(a) * 0.03; P.pos[i * 3 + 1] = at.y + 0.01; P.pos[i * 3 + 2] = at.z + Math.sin(a) * 0.03;
      if (kind === "ember") { P.vel[i * 3] = Math.cos(a) * 0.08; P.vel[i * 3 + 1] = 0.12 + r * 0.16; P.vel[i * 3 + 2] = Math.sin(a) * 0.08; P.max[i] = 0.9; }
      else if (kind === "ripple") { P.vel[i * 3] = Math.cos(a) * 0.45; P.vel[i * 3 + 1] = 0.03; P.vel[i * 3 + 2] = Math.sin(a) * 0.45; P.max[i] = 0.55; }
      else if (kind === "spark") { P.vel[i * 3] = Math.cos(a) * 0.7 * r; P.vel[i * 3 + 1] = (Math.random() - 0.2) * 0.6; P.vel[i * 3 + 2] = Math.sin(a) * 0.7 * r; P.max[i] = 0.32; }
      // 완료 반짝임: 피부 위로 낮게 퍼진다 (위로 솟으면 탑다운 카메라 앞에서 크게 보인다)
      else { P.vel[i * 3] = Math.cos(a) * (0.15 + r * 0.35); P.vel[i * 3 + 1] = 0.06 + r * 0.12; P.vel[i * 3 + 2] = Math.sin(a) * (0.15 + r * 0.35); P.max[i] = 0.7; }
      P.life[i] = P.max[i];
      P.col[i].set(color);
    }
  };

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    if (!rigSeen.current && rigZonePoints()) { rigSeen.current = true; setRigVer((v) => v + 1); }
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
          P.pos[i * 3 + 1] = Math.min(P.pos[i * 3 + 1], P.base + 0.22); // 카메라 쪽으로 너무 올라오지 않게
        }
        const s = P.life[i] > 0 ? 0.004 + (P.life[i] / P.max[i]) * 0.008 : 0;
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
        // 프레임 수와 무관하게 따라가고, 처음 나타날 때(멀리 있을 때)는 바로 부위 위로
        if (hand.current.position.distanceTo(target) > 0.4) hand.current.position.copy(target);
        else hand.current.position.lerp(target, 1 - Math.pow(careFx.active ? 0.0001 : 0.02, dt));
        hand.current.visible = true;
        // 모드별 손놀림: RF 는 작은 원을 그리며, 울트라소닉은 결을 따라 짧게 왕복(+미세 진동), 이온은 천천히 미끄러지듯
        if (careFx.active) {
          const k = d.head / 0.09;
          if (step?.mode === "rf") hand.current.position.addScaledVector(axes.a, Math.cos(t * 7) * 0.007 * k).addScaledVector(axes.sd, Math.sin(t * 7) * 0.007 * k);
          else if (step?.mode === "us") { hand.current.position.addScaledVector(axes.a, Math.sin(t * 5) * 0.008 * k); hand.current.position.x += Math.sin(t * 90) * 0.0012; }
        }
        // 기울기: 피부에 닿을 때는 더 눕히고, 대기할 때는 조금 세운다
        // 손잡이는 볼 쪽 바깥으로 눕혀 얼굴을 가리지 않게 (sd 방향으로 기울임)
        if (tilt.current) {
          const ang = careFx.active ? 0.95 : 0.7;
          tilt.current.quaternion.setFromAxisAngle(cp.set(axes.a.x, 0, axes.a.z).normalize(), ang);
        }
      } else hand.current.visible = false;
    }
    // 방향 가이드: 부위 위에서 밀어야 할 방향으로 점 세 개가 흐른다
    if (guide.current) {
      const show = !!zone && !!c?.applied;
      guide.current.visible = show;
      if (zone && c?.zone && show) {
        const [da, ds] = ZONE_DIR[c.zone];
        const dir = cp.copy(axes.a).multiplyScalar(da).addScaledVector(axes.sd, ds).normalize();
        const len = hitR * 2.2;
        guide.current.children.forEach((m, i) => {
          const f = ((clock.elapsedTime * 0.8 + i / 3) % 1) - 0.5;
          m.position.set(zone.x + dir.x * f * len, zone.y + 0.012, zone.z + dir.z * f * len);
          m.scale.setScalar(0.6 + (f + 0.5) * 0.8);
        });
      }
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
    if (last.current) {
      // 결 방향 판정: 이번에 민 방향과 가이드 방향(ZONE_DIR) 비교 — 바닥(XZ)에서
      const mv = dv.copy(cp).sub(last.current).setY(0);
      const dist = mv.length();
      if (dist > 1e-5) {
        const [da, ds] = ZONE_DIR[c.zone];
        const gd = gv.copy(axes.a).multiplyScalar(da).addScaledVector(axes.sd, ds).setY(0).normalize();
        addProgress(Math.min(0.08, dist / (hitR * tune("care.stroke_length"))), mv.dot(gd) / dist, dist);
      }
    }
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
              <ringGeometry args={[ringR * 0.8, ringR, 32]} />
              <meshBasicMaterial color={done ? "#d8b468" : on ? mode.color : "#ffffff"} transparent opacity={done ? 0.9 : on ? 0.95 : 0.6} depthTest={false} toneMapped={false} />
            </mesh>
            {done && (
              <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[ringR * 0.45, 20]} />
                <meshBasicMaterial color="#ffe2a0" transparent opacity={0.85} depthTest={false} toneMapped={false} />
              </mesh>
            )}
          </group>
        );
      })}

      <mesh ref={glowM} visible={false}>
        <sphereGeometry args={[hitR * 0.7, 20, 16]} />
        <meshBasicMaterial color={mode.color} transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>

      <group ref={hand} visible={false}>
        {/* 헤드는 피부에 닿고 손잡이는 얼굴 바깥쪽으로 기울인다 — 위에서 봐도 기기 모양이 보이고 얼굴을 가리지 않게 */}
        <group ref={tilt}>
          <Handpiece mode={step?.mode ?? "rf"} scale={d.head > 0.3 ? 1.5 : 1.15} />
          <Grip y={(step?.mode === "ionto" ? 0.24 : 0.19) * (d.head > 0.3 ? 1.5 : 1.15)} />
        </group>
        <pointLight intensity={1.6} distance={1.2} color={mode.color} position={[0, 0.05, 0]} />
      </group>
      <group ref={guide} visible={false}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}><sphereGeometry args={[hitR * 0.12, 10, 8]} /><meshBasicMaterial color={mode.color} transparent opacity={0.9} depthTest={false} toneMapped={false} /></mesh>
        ))}
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
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.95} />
      </instancedMesh>
    </group>
  );
}

/** 디바이스를 쥔 손 (손바닥 + 손가락 4개 + 엄지): 시술자가 직접 기기를 대고 있는 느낌 */
function Grip({ y }: { y: number }) {
  const skin = <meshStandardMaterial color="#f3cdb8" roughness={0.75} />;
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, 0, -0.028]} scale={[1, 1.25, 0.55]} castShadow><sphereGeometry args={[0.03, 14, 10]} />{skin}</mesh>
      {[-0.024, -0.008, 0.008, 0.024].map((yy, i) => (
        <mesh key={i} position={[0.018, yy, 0.006]} rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[0.0075, 0.026, 4, 8]} />{skin}</mesh>
      ))}
      <mesh position={[-0.02, 0.012, 0.01]} rotation={[0, 0, -0.5]}><capsuleGeometry args={[0.008, 0.024, 4, 8]} />{skin}</mesh>
      <mesh position={[0, -0.045, -0.03]} rotation={[0.3, 0, 0]}><cylinderGeometry args={[0.024, 0.028, 0.05, 12]} /><meshStandardMaterial color="#ffffff" roughness={0.6} /></mesh>
    </group>
  );
}
