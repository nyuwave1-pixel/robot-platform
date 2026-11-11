/** 3D 월드: 캔버스, 플레이어 이동·카메라, 존 감지, 성장 시네마틱 */
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, Sparkles } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { DEMO_FRIENDS } from "../data/game";
import { DEFAULT_LOOK, earnedStage, useGame, type Look } from "../store/game";
import { input, useUI } from "../store/ui";
import { bodyDims, Character } from "./Character";
import { Lounge } from "./Lounge";
import { layout, type Layout } from "./layout";
import { lieOrigin, Lying } from "./lie";
import { Care3D } from "./Care3D";
import { Customers, npcPos } from "./Customers";

const lerp = THREE.MathUtils.lerp;

export function World() {
  const quality = useGame((s) => s.settings.quality);
  const [auto, setAuto] = useState<"low" | "high">(() => (typeof navigator !== "undefined" && /Android|iPhone|iPad/i.test(navigator.userAgent) ? "low" : "high"));
  const q = quality === "auto" ? auto : quality;
  const wrap = useRef<HTMLDivElement>(null);
  useCameraGestures(wrap);

  return (
    <div ref={wrap} className="absolute inset-0 touch-none select-none">
      <Canvas
        shadows={q === "high"}
        dpr={q === "high" ? [1, 2] : [0.75, 1.25]}
        camera={{ fov: 42, near: 0.1, far: 80, position: [0, 4, 10] }}
        gl={{ antialias: q === "high", preserveDrawingBuffer: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}
      >
        <color attach="background" args={["#fbe9ee"]} />
        <fog attach="fog" args={["#fbe9ee", 26, 55]} />
        <PerformanceMonitor onDecline={() => setAuto("low")} onIncline={() => setAuto("high")} flipflops={2} />
        <AdaptiveDpr pixelated={false} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        {q === "high" && (
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.45} luminanceThreshold={0.82} luminanceSmoothing={0.2} mipmapBlur />
            <Vignette eskil={false} offset={0.2} darkness={0.42} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}

function Scene() {
  const lounge = useGame((s) => s.lounge);
  const visiting = useUI((s) => s.visiting);
  const mode = useUI((s) => s.mode);
  const selected = useUI((s) => s.selected);
  const hasCare = useUI((s) => !!s.care);
  const careMode = useUI((s) => (s.care && s.care.phase === "step" ? s.care.steps[s.care.step]?.mode ?? null : null));
  const friend = DEMO_FRIENDS.find((f) => f.id === visiting);
  const level = friend ? friend.level : lounge.level;
  const L = useMemo(() => layout(level), [level]);

  // 라운지 크기가 바뀌면 플레이어를 입구 근처로
  useEffect(() => {
    input.playerPos.x = THREE.MathUtils.clamp(input.playerPos.x, -L.w / 2 + 1, L.w / 2 - 1);
    input.playerPos.z = THREE.MathUtils.clamp(input.playerPos.z, -L.d / 2 + 1, L.d / 2 - 1);
    if (friend) { input.playerPos.x = 0; input.playerPos.z = L.d / 2 - 2; }
  }, [L, friend]);

  const onFloor = (x: number, z: number) => {
    const ui = useUI.getState();
    if (ui.mode === "edit" && ui.selected) {
      useGame.getState().moveFurniture(ui.selected, THREE.MathUtils.clamp(x, -L.w / 2 + 0.6, L.w / 2 - 0.6), THREE.MathUtils.clamp(z, -L.d / 2 + 0.6, L.d / 2 - 0.6));
    } else if (ui.mode === "explore" && !ui.panel) {
      input.moveTarget = { x, z };
    }
  };

  return (
    <>
      <Lounge
        level={level}
        floor={friend ? friend.floor : lounge.floor}
        wall={friend ? friend.wall : lounge.wall}
        light={lounge.light}
        furniture={friend ? FRIEND_FURNITURE : lounge.furniture}
        selected={mode === "edit" ? selected : null}
        activeMode={careMode}
        onFloor={onFloor}
        onFurniture={mode === "edit" && !friend ? (uid) => useUI.setState({ selected: uid }) : undefined}
      />
      <Player L={L} />
      {friend ? <FriendHost friend={friend} /> : <Customers L={L} />}
      {hasCare && !friend && <Care3D L={L} />}
      <ZoneMarkers L={L} hidden={mode !== "explore" || !!friend} />
      <CameraRig L={L} />
      <Director />
    </>
  );
}

const FRIEND_FURNITURE = [
  { uid: "f1", type: "plant", x: -3, z: 1, rot: 0 }, { uid: "f2", type: "rug", x: 0, z: 0.5, rot: 0 },
  { uid: "f3", type: "lamp", x: 3, z: 1.5, rot: 0 }, { uid: "f4", type: "flower", x: -1.5, z: -1.5, rot: 0 }, { uid: "f5", type: "display", x: 1.5, z: -1, rot: 0 },
];

function FriendHost({ friend }: { friend: (typeof DEMO_FRIENDS)[number] }) {
  const look: Look = { ...DEFAULT_LOOK, hair: friend.hair, hairColor: friend.hairColor, outfit: friend.outfit, skin: friend.skin, accessory: friend.stage >= 4 ? "acc-tiara" : "acc-flower" };
  return (
    <group position={[0, 0, 0.5]}>
      <Character look={look} growth={friend.stage} anim="wave" mood="happy" seed={3} />
    </group>
  );
}

// ───────────── 플레이어 ─────────────
function Player({ L }: { L: Layout }) {
  const look = useGame((s) => s.look);
  const stage = useGame((s) => s.stage);
  const skinExp = useGame((s) => s.exp.skin);
  const furniture = useGame((s) => s.lounge.furniture);
  const growthView = useUI((s) => s.growthView);
  const mode = useUI((s) => s.mode);
  const careSubject = useUI((s) => s.care?.subject);
  const carePhase = useUI((s) => s.care?.phase);
  const g = useRef<THREE.Group>(null!);
  const movingRef = useRef(false);
  const growth = growthView ?? stage;
  const lying = mode === "care" && careSubject === "player";
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const lastNear = useRef("");

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const ui = useUI.getState();
    const p = input.playerPos;
    let moving = false;
    if (ui.mode === "explore" && !ui.panel && !ui.consult) {
      // 입력: 키보드 + 조이스틱 (카메라 기준) / 탭 이동
      let ix = input.joy.x, iy = input.joy.y;
      const k = input.keys;
      if (k.has("KeyW") || k.has("ArrowUp")) iy += 1;
      if (k.has("KeyS") || k.has("ArrowDown")) iy -= 1;
      if (k.has("KeyA") || k.has("ArrowLeft")) ix -= 1;
      if (k.has("KeyD") || k.has("ArrowRight")) ix += 1;
      let vx = 0, vz = 0;
      const len = Math.hypot(ix, iy);
      if (len > 0.12) {
        input.moveTarget = null;
        const yaw = input.cam.yaw;
        const n = Math.min(1, len);
        // 카메라가 보는 방향을 '앞'으로
        vx = ((ix / len) * Math.cos(yaw) - (iy / len) * Math.sin(yaw)) * n;
        vz = (-(ix / len) * Math.sin(yaw) - (iy / len) * Math.cos(yaw)) * n;
      } else if (input.moveTarget) {
        const dx = input.moveTarget.x - p.x, dz = input.moveTarget.z - p.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.12) input.moveTarget = null;
        else { vx = dx / dist; vz = dz / dist; }
      }
      if (vx || vz) {
        const speed = 2.6 + bodyDims(growth).leg * 1.2;
        let nx = p.x + vx * speed * dt, nz = p.z + vz * speed * dt;
        const r = 0.32;
        nx = THREE.MathUtils.clamp(nx, -L.w / 2 + r, L.w / 2 - r);
        nz = THREE.MathUtils.clamp(nz, -L.d / 2 + r, L.d / 2 - r);
        const obs = ui.visiting ? [] : L.obstacles;
        for (const o of [...obs, ...furniture.filter((f) => f.type !== "rug").map((f) => ({ x: f.x, z: f.z, r: 0.42 }))]) {
          const dx = nx - o.x, dz = nz - o.z, dd = Math.hypot(dx, dz), min = o.r + r;
          if (dd < min && dd > 0.0001) { nx = o.x + (dx / dd) * min; nz = o.z + (dz / dd) * min; }
        }
        moving = Math.hypot(nx - p.x, nz - p.z) > 0.002;
        p.x = nx; p.z = nz;
        input.playerYaw = Math.atan2(vx, vz);
      }
      // 근처 존/고객 감지
      let near: string | null = null, best = 1.9;
      if (!ui.visiting) for (const z of L.zones) { const dd = Math.hypot(z.x - p.x, z.z - p.z); if (dd < best) { best = dd; near = z.key; } }
      let nc: string | null = null, bc = 1.7;
      for (const id in npcPos) { const n = npcPos[id]; if (n.state !== "wait") continue; const dd = Math.hypot(n.x - p.x, n.z - p.z); if (dd < bc) { bc = dd; nc = id; } }
      const key = `${near}|${nc}`;
      if (key !== lastNear.current) { lastNear.current = key; useUI.setState({ near: near as never, nearCustomer: nc }); }
    } else if (ui.mode === "care" && ui.care && ui.care.subject !== "player") {
      // 고객 케어를 마치면 침대 옆에서 다시 시작
      p.x = L.bed.x + 0.2; p.z = L.bed.z + 1.5; input.playerYaw = Math.PI;
    } else if (ui.mode === "photo" || ui.mode === "cinematic") {
      // 카메라를 바라본다
      input.playerYaw = input.cam.yaw;
    }
    movingRef.current = moving;
    input.moving = moving;
    if (g.current && !lying) {
      g.current.position.set(p.x, 0, p.z);
      let dy = input.playerYaw - g.current.rotation.y;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      g.current.rotation.y += dy * Math.min(1, dt * 12);
    }
    void tmp; void state;
  });

  // 고객 케어 중에는 탑다운 시술 뷰를 가리지 않도록 플레이어를 그리지 않는다
  if (mode === "care" && !lying) return null;
  const glow = Math.min(1, skinExp / 600);
  const anim = mode === "photo" ? "pose" : mode === "cinematic" ? "pose" : "idle";
  if (lying)
    return (
      <Lying L={L} growth={growth}>
        <Character look={look} growth={growth} anim="lie" mood={carePhase === "result" ? "happy" : "relaxed"} glow={glow} />
      </Lying>
    );
  return (
    <group ref={g}>
      <Character look={look} growth={growth} anim={anim} movingRef={movingRef} glow={glow} mood="smile" sparkle={mode === "cinematic"} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.3, 24]} />
        <meshBasicMaterial color="#e79aae" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ───────────── 존 표시 ─────────────
function ZoneMarkers({ L, hidden }: { L: Layout; hidden: boolean }) {
  const near = useUI((s) => s.near);
  const g = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (!g.current) return;
    g.current.children.forEach((c, i) => { c.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3 + i) * 0.06); });
  });
  if (hidden) return null;
  return (
    <group ref={g}>
      {L.zones.map((z) => (
        <mesh key={z.key} position={[z.x, 0.02, z.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.6, 40]} />
          <meshBasicMaterial color={near === z.key ? "#ff6f9a" : "#f4b9c8"} transparent opacity={near === z.key ? 0.95 : 0.55} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ───────────── 카메라 ─────────────
function CameraRig({ L }: { L: Layout }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 1, 0));
  const want = useMemo(() => new THREE.Vector3(), []);
  const wantT = useMemo(() => new THREE.Vector3(), []);
  const wantUp = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useFrame(({ clock }, dt) => {
    const ui = useUI.getState();
    const game = useGame.getState();
    const growth = ui.growthView ?? game.stage;
    const d = bodyDims(growth);
    const c = input.cam;
    const p = input.playerPos;
    let k = 1 - Math.pow(0.001, dt); // 프레임 독립 보간
    wantUp.set(0, 1, 0);
    if (ui.mode === "care" && ui.care) {
      // 침대 위 시술 뷰
      const sg = ui.care.subject === "player" ? growth : 3.4;
      const sd = bodyDims(sg);
      const [ox, oy, oz] = lieOrigin(L, sg);
      const area = ui.care.zones[0] === "body" ? "body" : ui.care.zones[0] === "scalp" ? "scalp" : "face";
      const along = area === "body" ? sd.leg + sd.torso * 0.5 : area === "scalp" ? sd.headY + sd.head * 0.5 : sd.headY - sd.head * 0.15;
      wantT.set(ox - along, oy + sd.head * 0.3, oz);
      // 머리가 화면 위쪽으로 오는 탑다운 시술 뷰 (얼굴이 정면으로 보인다)
      const narrow = camera instanceof THREE.PerspectiveCamera && camera.aspect < 0.8 ? 1.35 : 1;
      const r = (sd.head * 3.2 + 1.05) * narrow;
      wantT.x += r * 0.12;
      want.set(wantT.x + r * 0.3, wantT.y + r, wantT.z + 0.001);
      wantUp.set(-1, 0, 0);
    } else if (ui.mode === "cinematic") {
      const a = clock.elapsedTime * 0.9;
      c.yaw = a;
      wantT.set(p.x, d.height * 0.62, p.z);
      const r = d.height * 1.5 + 1.2;
      want.set(p.x + Math.sin(a) * r, d.height * 0.8 + 0.3, p.z + Math.cos(a) * r);
      k = 1 - Math.pow(0.0001, dt);
    } else if (ui.mode === "edit") {
      wantT.set(0, 0, 0.5);
      const r = Math.max(L.w, L.d) * 0.95;
      want.set(Math.sin(c.yaw) * r * 0.35, r * 0.85, Math.cos(c.yaw) * r * 0.55);
    } else {
      const dress = ui.panel === "character" || ui.panel === "growth";
      const photo = ui.mode === "photo" || dress;
      const narrow = camera instanceof THREE.PerspectiveCamera && camera.aspect < 0.8;
      const dist = photo ? (d.height * 1.25 + 0.9) * (dress && narrow ? 1.7 : 1) : c.dist;
      const pitch = photo ? 0.12 : c.pitch;
      wantT.set(p.x, dress && narrow ? -d.height * 0.25 : d.height * (photo ? 0.68 : 0.7), p.z);
      want.set(p.x + Math.sin(c.yaw) * Math.cos(pitch) * dist, wantT.y + Math.sin(pitch) * dist, p.z + Math.cos(c.yaw) * Math.cos(pitch) * dist);
      // 카메라가 벽 밖으로 나가지 않게 (벽·입구 프레임에 가리지 않도록)
      want.x = THREE.MathUtils.clamp(want.x, -L.w / 2 + 0.35, L.w / 2 - 0.35);
      want.z = THREE.MathUtils.clamp(want.z, -L.d / 2 + 0.35, L.d / 2 - 0.35);
    }
    camera.position.lerp(want, k);
    target.current.lerp(wantT, k);
    camera.up.lerp(wantUp, k).normalize();
    camera.lookAt(target.current);
  });
  return null;
}

/** 드래그 회전 · 휠/핀치 줌 · 키보드 입력 */
function useCameraGestures(ref: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pts = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const free = () => { const m = useUI.getState().mode; return m === "explore" || m === "photo" || m === "edit"; };
    const down = (e: PointerEvent) => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); pinch = 0; };
    const move = (e: PointerEvent) => {
      const prev = pts.get(e.pointerId);
      if (!prev || !free()) return;
      if (pts.size === 1) {
        input.cam.yaw -= (e.clientX - prev.x) * 0.0065;
        input.cam.pitch = THREE.MathUtils.clamp(input.cam.pitch + (e.clientY - prev.y) * 0.005, 0.08, 1.25);
      }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const dd = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) input.cam.dist = THREE.MathUtils.clamp(input.cam.dist * (pinch / dd), 2.2, 16);
        pinch = dd;
      }
    };
    const up = (e: PointerEvent) => { pts.delete(e.pointerId); pinch = 0; };
    const wheel = (e: WheelEvent) => { if (free()) input.cam.dist = THREE.MathUtils.clamp(input.cam.dist * (1 + Math.sign(e.deltaY) * 0.09), 2.2, 16); };
    const kd = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      input.keys.add(e.code);
      if (e.code === "KeyQ") input.cam.yaw += 0.25;
      if (e.code === "KeyR") input.cam.yaw -= 0.25;
    };
    const ku = (e: KeyboardEvent) => input.keys.delete(e.code);
    const blur = () => input.keys.clear();
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: true });
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("blur", blur);
    return () => {
      el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel); window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); window.removeEventListener("blur", blur);
    };
  }, [ref]);
}

// ───────────── 성장 시네마틱 ─────────────
const CINE_LEN = 5.2;
function Director() {
  const cine = useUI((s) => s.cine);
  const t = useRef(0);
  const ring = useRef<THREE.Group>(null!);
  const mode = useUI((s) => s.mode);
  const panel = useUI((s) => s.panel);
  const care = useUI((s) => s.care);
  const stage = useGame((s) => s.stage);
  const earned = useGame((s) => earnedStage(s));

  // 탐험 상태로 돌아왔을 때 달성한 단계가 있으면 연출 시작 (한 단계씩)
  useEffect(() => {
    if (mode === "explore" && !panel && !care && !cine && earned > stage) {
      const id = setTimeout(() => { t.current = 0; useUI.setState({ mode: "cinematic", cine: { from: stage, to: stage + 1 }, growthView: stage, near: null }); }, 500);
      return () => clearTimeout(id);
    }
  }, [mode, panel, care, cine, earned, stage]);

  useFrame((_, dt) => {
    if (!cine) return;
    t.current += Math.min(dt, 0.25); // 저사양에서도 연출 길이는 실제 시간 기준
    const x = t.current / CINE_LEN;
    // 1.3s~3.6s 구간에서 프로포션이 블렌딩된다
    const m = THREE.MathUtils.smootherstep(t.current, 1.3, 3.6);
    const flash = Math.max(0, 1 - Math.abs(t.current - 2.4) / 0.9);
    useUI.setState({ growthView: cine.from + (cine.to - cine.from) * m, flash });
    if (ring.current) {
      ring.current.position.set(input.playerPos.x, 0, input.playerPos.z);
      ring.current.rotation.y += dt * 3;
      ring.current.children.forEach((c, i) => { c.position.y = ((t.current * 0.9 + i * 0.13) % 1) * 2.4; });
    }
    if (x >= 1) {
      useGame.getState().confirmStage(cine.to);
      useUI.setState({ cine: null, growthView: null, flash: 0, mode: "explore", panel: "growth" });
    }
  });
  if (!cine) return null;
  return (
    <>
      <group ref={ring}>
        {Array.from({ length: 16 }).map((_, i) => (
          <mesh key={i} position={[Math.cos((i / 16) * Math.PI * 2) * 0.9, 0, Math.sin((i / 16) * Math.PI * 2) * 0.9]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshBasicMaterial color={i % 2 ? "#ffd98a" : "#ff9fbd"} toneMapped={false} />
          </mesh>
        ))}
        <Sparkles count={70} scale={[2.6, 2.8, 2.6]} position={[0, 1.2, 0]} size={5} speed={1.4} color="#ffe2a0" />
        <Sparkles count={50} scale={[2.2, 2.6, 2.2]} position={[0, 1.1, 0]} size={4} speed={1} color="#ffb3cb" />
        <pointLight position={[0, 1.2, 0.6]} intensity={14} distance={5} color="#ffd9e6" />
      </group>
    </>
  );
}

