/** WORLD PLAZA — 다른 플레이어와 함께 걷는 야외 광장. 통신은 src/net/plaza.ts */
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Billboard, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { tune } from "../data/config";
import { DEMO_FRIENDS } from "../data/game";
import { joinPlaza, leavePlaza, postScore, remotes, sparkleSpots, usePlaza, SLOT_MS, type Remote } from "../net/plaza";
import { DEFAULT_LOOK, useGame, type Look } from "../store/game";
import { input, useUI } from "../store/ui";
import { useT } from "../i18n";
import { Character } from "./Character";
import { Label } from "./Label";
import { Model } from "./Model";
import { layout, type Layout } from "./layout";

export const PLAZA_R = 13.5;
const STAGE = { x: 7.4, z: 5.4, r: 2.4 };
const STALL = { x: -7.6, z: 5.2 };
/** 광장용 레이아웃: 플레이어·카메라 코드가 라운지와 같은 모양의 값을 읽는다 */
export function plazaLayout(): Layout {
  const base = layout(1, 0);
  const obstacles = [
    { x: 0, z: 0, r: 2.95 }, { x: STALL.x, z: STALL.z, r: 1.1 },
    ...TREES.map((t) => ({ x: t[0], z: t[1], r: 0.5 })), ...LAMPS.map((t) => ({ x: t[0], z: t[1], r: 0.28 })),
    ...BENCHES.map((t) => ({ x: t[0], z: t[1], r: 0.75 })), ...BEDS.map((t) => ({ x: t[0], z: t[1], r: 0.95 })),
  ];
  return { ...base, w: PLAZA_R * 2 + 2, d: PLAZA_R * 2 + 2, zones: [], obstacles, stations: 0, stationSpots: [] };
}
const TREES: [number, number, number][] = [[-9.5, -8, 1.15], [9.5, -8, 1.05], [-12, 1, 1.0], [12, 0.5, 1.2], [-9.5, 9, 1.1], [10.8, 9.2, 1.0], [-5.6, -11.3, 0.9], [5.6, -11.3, 0.95], [-4.8, 12.0, 1.0], [5.2, 12.0, 1.05]];
const LAMPS: [number, number][] = [[-4.6, -4.6], [4.6, -4.6], [-4.6, 4.6], [4.6, 4.6]];
const BENCHES: [number, number, number][] = [[-6.4, -1.2, Math.PI / 2], [6.4, -1.2, -Math.PI / 2], [0, -6.6, 0], [-2.6, 9.6, Math.PI]];
const BEDS: [number, number][] = [[-3.4, -9.6], [3.4, -9.6], [-10.6, -3.6], [10.6, -3.8]];

/** 동심원과 방사선 무늬가 있는 광장 돌바닥 */
function usePaving() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 1024;
    const g = c.getContext("2d")!;
    g.fillStyle = "#fbeee6"; g.fillRect(0, 0, 1024, 1024);
    g.translate(512, 512);
    const tones = ["#fbeee6", "#f8e4dc", "#fdf3ec", "#f6dfe0"];
    for (let ring = 20; ring >= 1; ring--) {
      const r0 = (ring - 1) * 25.6, r1 = ring * 25.6, n = Math.max(8, ring * 6);
      for (let i = 0; i < n; i++) {
        g.beginPath();
        g.arc(0, 0, r1, (i / n) * Math.PI * 2, ((i + 1) / n) * Math.PI * 2);
        g.arc(0, 0, r0, ((i + 1) / n) * Math.PI * 2, (i / n) * Math.PI * 2, true);
        g.closePath();
        g.fillStyle = tones[(i * 7 + ring * 3) % 4];
        g.fill();
        g.strokeStyle = "rgba(190,150,130,0.35)"; g.lineWidth = 1.2; g.stroke();
      }
    }
    for (const [r, w] of [[128, 5], [256, 4], [384, 4], [505, 7]] as const) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.strokeStyle = "#d9b88a"; g.lineWidth = w; g.stroke(); }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }, []);
}

export function Plaza({ onFloor, quality = "high" }: { onFloor: (x: number, z: number) => void; quality?: "low" | "high" }) {
  const hi = quality === "high";
  useEffect(() => { joinPlaza(); return () => leavePlaza(); }, []);
  const paving = usePaving();
  const click = (e: ThreeEvent<MouseEvent>) => { if (e.delta > 6) return; e.stopPropagation(); usePlaza.setState({ target: null }); onFloor(e.point.x, e.point.z); };
  // 가까이 있는 시설 감지
  const last = useRef<string | null>(null);
  useFrame(() => {
    const p = input.playerPos;
    const near = Math.hypot(p.x - STAGE.x, p.z - STAGE.z) < STAGE.r + 0.6 ? "stage" : Math.hypot(p.x - STALL.x, p.z - STALL.z) < 2.6 ? "stall" : Math.hypot(p.x, p.z) < 4.2 ? "fountain" : null;
    if (near !== last.current) { last.current = near; usePlaza.setState({ near }); }
  });
  return (
    <group>
      <hemisphereLight args={["#fff8f2", "#f3d9e2", 0.78]} />
      <directionalLight position={[8, 14, 6]} intensity={1.4} color="#fff3e0" castShadow={hi} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} />
      {/* 잔디 언덕 → 광장 돌바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow><circleGeometry args={[46, 48]} /><meshStandardMaterial color="#cfe8c4" roughness={1} /></mesh>
      {[[-22, -16, 9], [20, -20, 11], [26, 8, 8], [-26, 10, 10], [0, -30, 12], [4, 28, 9]].map(([x, z, r], i) => (
        <mesh key={i} position={[x, -r * 0.72, z]}><sphereGeometry args={[r, 24, 16]} /><meshStandardMaterial color={i % 2 ? "#c2e0b6" : "#d6ecca"} roughness={1} /></mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={click}><circleGeometry args={[PLAZA_R + 0.6, 72]} /><meshStandardMaterial map={paving} roughness={0.8} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}><ringGeometry args={[PLAZA_R + 0.5, PLAZA_R + 0.85, 72]} /><meshStandardMaterial color="#fffaf4" roughness={0.5} /></mesh>

      <Model url="./models/plaza_fountain.glb" fallback={<mesh position={[0, 0.25, 0]}><cylinderGeometry args={[2.3, 2.3, 0.5, 32]} /><meshStandardMaterial color="#fffaf4" /></mesh>} />
      <Water />
      {TREES.map(([x, z, s], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, i * 1.3, 0]} scale={s * 1.35}>
          <Model url="./models/plaza_tree.glb" tint={i % 3 === 1 ? { foliage: { color: "#8cc592" }, foliage2: { color: "#a9d8a4" } } : undefined} />
        </group>
      ))}
      {LAMPS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, Math.atan2(x, z) + Math.PI / 2, 0]}>
          <Model url="./models/plaza_lamp.glb" />
          {hi && i < 2 && <pointLight position={[0, 2.8, 0]} intensity={1.6} distance={7} color="#ffe6b8" />}
        </group>
      ))}
      {BENCHES.map(([x, z, r], i) => <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}><Model url="./models/plaza_bench.glb" /></group>)}
      {BEDS.map(([x, z], i) => <group key={i} position={[x, 0, z]} rotation={[0, i, 0]}><Model url="./models/plaza_bed.glb" /></group>)}
      <group position={[0, 0, -12.6]}>
        <Model url="./models/plaza_gate.glb" />
        <Label text="WORLD PLAZA" width={3.2} position={[0, 2.5, 0.05]} color="#c9a66b" />
      </group>
      {/* 미니게임 무대 */}
      <group position={[STAGE.x, 0, STAGE.z]}>
        <Model url="./models/plaza_stage.glb" />
        <Billboard position={[0, 3.0, 0]}><Label text="PETAL CATCH" width={2.2} color="#d66e8c" bg="rgba(255,255,255,0.9)" size={150} weight={800} spacing={0.04} /></Billboard>
      </group>
      <PetalGame />
      {/* 라운지 홍보 부스 */}
      <group position={[STALL.x, 0, STALL.z]} rotation={[0, Math.atan2(-STALL.x, -STALL.z), 0]}>
        <Model url="./models/plaza_stall.glb" />
        <Label text="LOUNGE PROMO" width={1.35} position={[0, 2.45, -0.35]} rotation={[0, Math.PI, 0]} color="#f6d9a6" size={150} weight={800} spacing={0.04} />
      </group>
      <SparkleHunt />
      <Remotes />
      <Guides />
    </group>
  );
}

/** 분수의 물 (3단 수면 + 물줄기 반짝임) */
function Water() {
  const g = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => { if (g.current) g.current.position.y = Math.sin(clock.elapsedTime * 1.6) * 0.012; });
  const m = <meshStandardMaterial color="#9fdcf0" roughness={0.06} metalness={0.25} transparent opacity={0.82} />;
  return (
    <group ref={g}>
      <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[2.22, 48]} />{m}</mesh>
      <mesh position={[0, 1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1.02, 32]} />{m}</mesh>
      <mesh position={[0, 2.18, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.55, 24]} />{m}</mesh>
      {[[1.6, 1.15, 0.5], [0.8, 0.85, 1.85]].map(([r, h, y], i) => (
        <mesh key={i} position={[0, y, 0]}><cylinderGeometry args={[r * 0.62, r, h, 24, 1, true]} /><meshStandardMaterial color="#cfefff" transparent opacity={0.16} roughness={0.1} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      ))}
      <Sparkles count={60} scale={[3.4, 2.6, 3.4]} position={[0, 1.6, 0]} size={3.2} speed={1.1} color="#e6f8ff" opacity={0.95} />
    </group>
  );
}

// ───────────── 미니게임: 꽃잎 잡기 ─────────────
/** 무대 근처에 떠 있는 꽃잎을 제한 시간 동안 걸어서 모은다. 끝나면 점수를 광장에 알린다. */
function PetalGame() {
  const active = usePlaza((s) => !!s.game);
  const group = useRef<THREE.Group>(null!);
  const spots = useRef<{ x: number; z: number }[]>([]);
  const spawn = () => { const a = Math.random() * Math.PI * 2, r = 0.8 + Math.random() * 4.4; return { x: STAGE.x + Math.cos(a) * r, z: STAGE.z + Math.sin(a) * r }; };
  useEffect(() => { if (active) spots.current = Array.from({ length: 7 }, spawn); }, [active]);
  useFrame(({ clock }) => {
    const st = usePlaza.getState();
    if (!st.game) return;
    if (Date.now() >= st.game.end) {
      const score = st.game.score;
      usePlaza.setState({ game: null });
      const coins = useGame.getState().petalReward(score);
      postScore(score);
      const ko = useGame.getState().settings.lang === "ko";
      useUI.getState().toast(`PETAL CATCH ${score}${coins ? `  +${coins} BEAUTY COIN` : ko ? " · 오늘 보상은 다 받았어요" : " · daily reward used"}`);
      return;
    }
    const p = input.playerPos;
    spots.current.forEach((s, i) => {
      if (Math.hypot(s.x - p.x, s.z - p.z) < 0.7) {
        spots.current[i] = spawn();
        usePlaza.setState({ game: { end: st.game!.end, score: usePlaza.getState().game!.score + 1 } });
      }
      const m = group.current?.children[i];
      if (m) { m.position.set(spots.current[i].x, 0.6 + Math.sin(clock.elapsedTime * 3 + i) * 0.12, spots.current[i].z); m.rotation.y = clock.elapsedTime * 2 + i; m.rotation.z = Math.sin(clock.elapsedTime * 2 + i) * 0.4; }
    });
  });
  if (!active) return null;
  return (
    <group ref={group}>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} scale={[1, 0.25, 0.7]}>
          <sphereGeometry args={[0.26, 12, 8]} />
          <meshStandardMaterial color={i % 2 ? "#ff9db5" : "#ffd0dc"} emissive="#ff7fa5" emissiveIntensity={0.7} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// ───────────── 다른 플레이어 ─────────────
function NameTag({ name, rank, y, say, sayAt }: { name: string; rank: number; y: number; say: number; sayAt: number }) {
  const t = useT();
  const [, tick] = useState(0);
  const talking = say >= 0 && Date.now() - sayAt < 4000;
  useEffect(() => { if (!talking) return; const id = setTimeout(() => tick((n) => n + 1), 4100 - (Date.now() - sayAt)); return () => clearTimeout(id); }, [talking, sayAt]);
  return (
    <Billboard position={[0, y, 0]}>
      <Label text={rank > 0 ? `${name} · R${rank}` : name} width={Math.min(1.5, 0.3 + (name.length + (rank > 0 ? 5 : 0)) * 0.085)} color="#3a2a33" bg="rgba(255,255,255,0.85)" size={170} weight={800} spacing={0} />
      {talking && <Label text={t(`plaza.say.${say}`)} width={1.6} position={[0, 0.3, 0]} color="#ffffff" bg="rgba(214,110,140,0.95)" size={150} weight={800} spacing={0} />}
    </Billboard>
  );
}

function RemoteAvatar({ r }: { r: Remote }) {
  const g = useRef<THREE.Group>(null!);
  const moving = useRef(false);
  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.001, dt);
    r.rx += (r.x - r.rx) * k; r.rz += (r.z - r.rz) * k;
    moving.current = Math.hypot(r.x - r.rx, r.z - r.rz) > 0.05;
    if (!g.current) return;
    g.current.position.set(r.rx, 0, r.rz);
    let dy = r.yaw - g.current.rotation.y;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    g.current.rotation.y += dy * Math.min(1, dt * 10);
  });
  return (
    <group ref={g} position={[r.rx, 0, r.rz]} onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); usePlaza.setState({ target: r.id, list: false }); }}>
      <Character look={r.look} growth={r.stage} anim="idle" movingRef={moving} rank={r.rank} seed={r.id.length} />
      <NameTag name={r.name} rank={r.rank} y={1.25 + r.stage * 0.2} say={r.say} sayAt={r.sayAt} />
      {r.promo > 0 && (
        <Billboard position={[0, 1.62 + r.stage * 0.2, 0]}>
          <Label text="LOUNGE PROMO" width={0.9} color="#ffffff" bg="rgba(201,166,107,0.95)" size={150} weight={800} spacing={0.02} />
        </Billboard>
      )}
    </group>
  );
}
function Remotes() {
  const ids = usePlaza((s) => s.ids);
  return <>{ids.map((id) => { const r = remotes.get(id); return r ? <RemoteAvatar key={id} r={r} /> : null; })}</>;
}

/** 광장을 산책하는 안내 NPC (사람이 아니라는 표시로 이름 앞에 NPC 를 붙인다) */
function Guides() {
  const list = useMemo(() => DEMO_FRIENDS.slice(0, 3).map((f, i) => ({
    name: `NPC ${f.name}`, stage: f.stage,
    look: { ...DEFAULT_LOOK, hair: f.hair, hairColor: f.hairColor, outfit: f.outfit, skin: f.skin } as Look,
    r: 6.6 + i * 2.2, speed: (i % 2 ? -1 : 1) * (0.09 + i * 0.02), phase: i * 2.1,
  })), []);
  return <>{list.map((n, i) => <Guide key={i} n={n} />)}</>;
}
function Guide({ n }: { n: { name: string; stage: number; look: Look; r: number; speed: number; phase: number } }) {
  const g = useRef<THREE.Group>(null!);
  const moving = useRef(true);
  useFrame(({ clock }) => {
    const a = n.phase + clock.elapsedTime * n.speed;
    g.current.position.set(Math.cos(a) * n.r, 0, Math.sin(a) * n.r);
    g.current.rotation.y = Math.atan2(-Math.sin(a) * Math.sign(n.speed), Math.cos(a) * Math.sign(n.speed));
  });
  return (
    <group ref={g}>
      <Character look={n.look} growth={n.stage} anim="idle" movingRef={moving} seed={n.r} />
      <NameTag name={n.name} rank={0} y={1.25 + n.stage * 0.2} say={-1} sayAt={0} />
    </group>
  );
}

// ───────────── 반짝이 모으기 ─────────────
function SparkleHunt() {
  const [slot, setSlot] = useState(() => Math.floor(Date.now() / SLOT_MS));
  const [taken, setTaken] = useState<number[]>([]);
  const spots = useMemo(() => sparkleSpots(slot), [slot]);
  const group = useRef<THREE.Group>(null!);
  const takenRef = useRef<number[]>([]);
  takenRef.current = taken;
  useFrame(({ clock }) => {
    const now = Math.floor(Date.now() / SLOT_MS);
    if (now !== slot) { setSlot(now); setTaken([]); return; }
    if (group.current) group.current.children.forEach((c, i) => { c.rotation.y = clock.elapsedTime * 1.4 + i; c.position.y = 0.55 + Math.sin(clock.elapsedTime * 2 + i) * 0.08; });
    const p = input.playerPos;
    for (let i = 0; i < spots.length; i++) {
      if (takenRef.current.includes(i)) continue;
      if (Math.hypot(spots[i].x - p.x, spots[i].z - p.z) < 0.75) {
        setTaken((t) => [...t, i]);
        const got = useGame.getState().plazaCollect();
        useUI.getState().toast(got.coins ? `+${got.coins} BEAUTY COIN${got.star ? "  +1 SOCIAL STAR" : ""}` : useGame.getState().settings.lang === "ko" ? "오늘은 반짝이를 다 모았어요" : "Daily sparkle limit reached");
        break;
      }
    }
  });
  void tune;
  return (
    <group ref={group}>
      {spots.map((s, i) => (
        <mesh key={`${slot}-${i}`} position={[s.x, 0.55, s.z]} visible={!taken.includes(i)}>
          <octahedronGeometry args={[0.2]} />
          <meshStandardMaterial color="#ffe9a8" emissive="#ffd35c" emissiveIntensity={1.4} metalness={0.4} roughness={0.15} />
        </mesh>
      ))}
    </group>
  );
}
