/** WORLD PLAZA — 다른 플레이어와 함께 걷는 야외 광장. 통신은 src/net/plaza.ts */
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Billboard, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { tune } from "../data/config";
import { DEMO_FRIENDS } from "../data/game";
import { joinPlaza, leavePlaza, remotes, sparkleSpots, usePlaza, SLOT_MS, type Remote } from "../net/plaza";
import { DEFAULT_LOOK, useGame, type Look } from "../store/game";
import { input, useUI } from "../store/ui";
import { useT } from "../i18n";
import { Character } from "./Character";
import { Label } from "./Label";
import { Model } from "./Model";
import { layout, type Layout } from "./layout";

export const PLAZA_R = 13.5;
/** 광장용 레이아웃: 플레이어·카메라 코드가 라운지와 같은 모양의 값을 읽는다 */
export function plazaLayout(): Layout {
  const base = layout(1, 0);
  const obstacles = [{ x: 0, z: 0, r: 2.3 }, ...TREES.map((t) => ({ x: t[0], z: t[1], r: 0.55 })), ...LAMPS.map((t) => ({ x: t[0], z: t[1], r: 0.3 }))];
  return { ...base, w: PLAZA_R * 2 + 2, d: PLAZA_R * 2 + 2, zones: [], obstacles, stations: 0, stationSpots: [] };
}
const TREES: [number, number, number][] = [[-9, -8, 1.2], [9, -8, 1.1], [-11.5, 2, 1.0], [11.5, 3, 1.25], [-8.5, 9, 1.1], [8.5, 9, 1.0], [-5.5, -11, 0.9], [5.5, -11, 0.95]];
const LAMPS: [number, number][] = [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]];
const BENCHES: [number, number, number][] = [[-6.2, 0, Math.PI / 2], [6.2, 0, -Math.PI / 2], [0, -6.2, 0]];

export function Plaza({ onFloor }: { onFloor: (x: number, z: number) => void }) {
  useEffect(() => { joinPlaza(); return () => leavePlaza(); }, []);
  const click = (e: ThreeEvent<MouseEvent>) => { if (e.delta > 6) return; e.stopPropagation(); onFloor(e.point.x, e.point.z); };
  return (
    <group>
      <hemisphereLight args={["#fff8f2", "#f3d9e2", 0.75]} />
      <directionalLight position={[8, 14, 6]} intensity={1.35} color="#fff3e0" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} />
      {/* 바닥: 잔디 → 광장 돌바닥 → 분수 둘레 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow><circleGeometry args={[40, 48]} /><meshStandardMaterial color="#cfe8c4" roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={click}><circleGeometry args={[PLAZA_R + 0.6, 64]} /><meshStandardMaterial color="#fbeee6" roughness={0.85} /></mesh>
      {[PLAZA_R + 0.3, 9, 5].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}><ringGeometry args={[r - 0.09, r, 72]} /><meshStandardMaterial color="#e8c9a0" roughness={0.6} metalness={0.3} /></mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}><ringGeometry args={[2.4, 5, 64]} /><meshStandardMaterial color="#fbdfe6" roughness={0.9} /></mesh>
      <Fountain />
      {TREES.map(([x, z, s], i) => <Tree key={i} x={x} z={z} s={s} pink={i % 3 === 0} />)}
      {LAMPS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} scale={1.25}>
          <Model url="./models/furn_lamp.glb" />
        </group>
      ))}
      {BENCHES.map(([x, z, r], i) => <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}><Model url="./models/sofa_2.glb" tint={{ fabric: { color: i === 2 ? "#e3d8f6" : "#f6bccb" } }} /></group>)}
      {/* 입구 아치와 간판 */}
      <group position={[0, 0, -12.4]}>
        {[-1, 1].map((s) => <mesh key={s} position={[s * 2.2, 1.6, 0]} castShadow><cylinderGeometry args={[0.16, 0.2, 3.2, 16]} /><meshStandardMaterial color="#fffaf4" roughness={0.4} /></mesh>)}
        <mesh position={[0, 3.2, 0]}><torusGeometry args={[2.2, 0.14, 12, 40, Math.PI]} /><meshStandardMaterial color="#c9a66b" metalness={0.85} roughness={0.25} /></mesh>
        {Array.from({ length: 15 }, (_, i) => { const a = (i / 14) * Math.PI; return <mesh key={i} position={[Math.cos(a) * 2.2, 3.2 + Math.sin(a) * 2.2, 0.12]} castShadow><sphereGeometry args={[0.22 + (i % 3) * 0.04, 10, 8]} /><meshStandardMaterial color={["#f29bb1", "#ffd0dc", "#ffffff", "#d9cff2", "#fbe1a8"][i % 5]} roughness={0.7} /></mesh>; })}
        <Label text="WORLD PLAZA" width={3} position={[0, 3.3, 0.3]} color="#c9a66b" />
      </group>
      {[-1, 1].map((s) => <group key={s} position={[s * 3.2, 0, -11.8]}><Model url="./models/furn_flower.glb" scale={1.2} /></group>)}
      {[[-10, -3], [10, -2.5], [-3, 11], [3.4, 11.2]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><Model url="./models/furn_plant.glb" scale={1.4} /></group>)}
      <SparkleHunt />
      <Remotes />
      <Guides />
    </group>
  );
}

function Fountain() {
  const water = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => { if (water.current) water.current.position.y = 0.42 + Math.sin(clock.elapsedTime * 1.6) * 0.012; });
  return (
    <group>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow><cylinderGeometry args={[2.2, 2.35, 0.5, 48]} /><meshStandardMaterial color="#fffaf4" roughness={0.35} /></mesh>
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[2.2, 0.07, 10, 64]} /><meshStandardMaterial color="#c9a66b" metalness={0.85} roughness={0.25} /></mesh>
      <mesh ref={water} position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[2.08, 48]} /><meshStandardMaterial color="#9fdcf0" roughness={0.08} metalness={0.2} transparent opacity={0.85} /></mesh>
      <mesh position={[0, 0.95, 0]} castShadow><cylinderGeometry args={[0.22, 0.38, 1.1, 20]} /><meshStandardMaterial color="#fffaf4" roughness={0.35} /></mesh>
      <mesh position={[0, 1.52, 0]} castShadow><cylinderGeometry args={[1.0, 0.3, 0.16, 32]} /><meshStandardMaterial color="#fbe1e6" roughness={0.35} /></mesh>
      <mesh position={[0, 1.6, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.92, 32]} /><meshStandardMaterial color="#9fdcf0" roughness={0.08} transparent opacity={0.85} /></mesh>
      <mesh position={[0, 1.95, 0]}><sphereGeometry args={[0.2, 16, 12]} /><meshStandardMaterial color="#c9a66b" metalness={0.85} roughness={0.25} /></mesh>
      <Sparkles count={40} scale={[2.6, 2.2, 2.6]} position={[0, 1.6, 0]} size={3} speed={0.9} color="#dff6ff" opacity={0.9} />
    </group>
  );
}

function Tree({ x, z, s, pink }: { x: number; z: number; s: number; pink: boolean }) {
  const c = pink ? ["#f6bccb", "#fbd3dd", "#f29bb1"] : ["#8cc592", "#a5d6a0", "#6fae7b"];
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.9, 0]} castShadow><cylinderGeometry args={[0.16, 0.24, 1.8, 10]} /><meshStandardMaterial color="#a98467" roughness={1} /></mesh>
      {[[0, 2.5, 0, 1.15], [-0.7, 2.1, 0.2, 0.8], [0.7, 2.15, -0.2, 0.85], [0.1, 3.2, 0.1, 0.75]].map(([px, py, pz, r], i) => (
        <mesh key={i} position={[px, py, pz]} castShadow><sphereGeometry args={[r, 14, 12]} /><meshStandardMaterial color={c[i % 3]} roughness={0.9} /></mesh>
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
    <group ref={g} position={[r.rx, 0, r.rz]}>
      <Character look={r.look} growth={r.stage} anim="idle" movingRef={moving} rank={r.rank} seed={r.id.length} />
      <NameTag name={r.name} rank={r.rank} y={1.25 + r.stage * 0.2} say={r.say} sayAt={r.sayAt} />
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
