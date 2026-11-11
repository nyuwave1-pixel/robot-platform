/**
 * 메디더마 라운지 공간 (v2 인테리어).
 * 반사 대리석 바닥, 패널 몰딩 벽과 코브 조명, 천장·샹들리에, 아치 창과 빛줄기,
 * 아치 진열 알코브, 케어 스테이지, 곡선 리셉션. 등급에 따라 크기와 존이 확장된다.
 * 모든 형상·텍스처는 코드로 만든다.
 */
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { MeshReflectorMaterial, RoundedBox, Sparkles } from "@react-three/drei";
import { INTERIOR_MAP } from "../data/game";
import { PRODUCTS } from "../data/products";
import type { Furniture } from "../store/game";
import { Label } from "./Label";
import { layout, type Layout } from "./layout";
import { CareBed, DermaHome, FlowerArch, FurnitureMesh, ProductBottle, Sofa, Vanity } from "./Props";
import { fluted, glow, gradient, herringbone, marble, terrazzo, wallPanel } from "./textures";
import type { ModeId } from "../data/devices";

const GOLD = "#c9a66b";
export const ROOM_H = 3.7;
const Gold = ({ rough = 0.28 }: { rough?: number }) => <meshStandardMaterial color={GOLD} metalness={0.92} roughness={rough} />;

export const SHELF_PRODUCTS = PRODUCTS.filter((p) => p.category === "스킨케어");

interface Props {
  level: number; floor: string; wall: string; light: string;
  furniture: Furniture[];
  selected?: string | null;
  activeMode?: ModeId | null;
  quality: "low" | "high";
  onFloor?: (x: number, z: number) => void;
  onFurniture?: (uid: string) => void;
}

export function Lounge({ level, floor, wall, light, furniture, selected, activeMode, quality, onFloor, onFurniture }: Props) {
  const L = useMemo(() => layout(level), [level]);
  const wl = INTERIOR_MAP[wall] ?? INTERIOR_MAP["wall-cream"];
  const lt = INTERIOR_MAP[light] ?? INTERIOR_MAP["light-warm"];
  const dark = wall === "wall-black";
  const hi = quality === "high";
  const accent = wl.accent ?? "#f9d5dc";
  const soft = dark ? "#2a2527" : "#f6bccb";

  const floorTex = useMemo(() => {
    const t = floor === "floor-pink" ? marble("#fbe7ea", "#e2a9b7", "#d8b468")
      : floor === "floor-lav" ? terrazzo("#eee8fb", ["#c9b8ef", "#f2a7b8", "#ffffff", "#d8b468", "#b9a2e8"])
      : floor === "floor-black" ? marble("#1f1b1d", "#4d4549", "#c9a66b")
      : herringbone("#ecd9bf", "#dcc19f");
    const size = floor === "floor-cream" ? 2.2 : floor === "floor-lav" ? 1.2 : 2.6;
    t.repeat.set(L.w / size, L.d / size);
    return t;
  }, [floor, L.w, L.d]);
  const floorRough = floor === "floor-cream" ? 0.55 : floor === "floor-lav" ? 0.4 : 0.22;
  const click = (e: ThreeEvent<MouseEvent>) => { if (e.delta > 6) return; e.stopPropagation(); onFloor?.(e.point.x, e.point.z); };

  return (
    <group>
      {/* ── 조명 리그 ── */}
      <hemisphereLight args={["#fff6f0", dark ? "#3a2f33" : "#f1d6de", dark ? 0.3 : 0.42]} />
      <directionalLight position={[L.w / 2 + 3, 7.5, -1]} intensity={1.15} color="#fff1dc" castShadow={hi} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0003} shadow-normalBias={0.03}>
        <orthographicCamera attach="shadow-camera" args={[-L.w / 2 - 3, L.w / 2 + 3, L.d / 2 + 3, -L.d / 2 - 3, 0.5, 34]} />
      </directionalLight>
      <directionalLight position={[-6, 4, 7]} intensity={0.4} color={dark ? "#ffd9a0" : "#ffd3e2"} />
      <pointLight position={[0, ROOM_H - 1.1, 0]} intensity={7} distance={L.w} color={lt.color} />
      <pointLight position={[L.bed.x - 0.2, 2.5, L.bed.z + 0.8]} intensity={6} distance={7} color="#ffe6ee" />
      <pointLight position={[L.shelf.x, 2.2, L.shelf.z + 1.6]} intensity={4} distance={6} color="#ffe9c8" />

      {/* ── 바닥 ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={click}>
        <planeGeometry args={[L.w, L.d]} />
        {hi ? (
          <MeshReflectorMaterial map={floorTex} resolution={1024} blur={[420, 140]} mixBlur={1} mixStrength={dark ? 1.2 : 0.5} mirror={0.55} roughness={floorRough} depthScale={0.8} minDepthThreshold={0.6} maxDepthThreshold={1.3} metalness={dark ? 0.35 : 0.05} color={dark ? "#bdb3b6" : "#ffffff"} />
        ) : (
          <meshStandardMaterial map={floorTex} roughness={floorRough} metalness={dark ? 0.3 : 0.02} />
        )}
      </mesh>
      {/* 바닥 골드 인레이 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[Math.min(L.w, L.d) * 0.36, Math.min(L.w, L.d) * 0.36 + 0.035, 96]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <planeGeometry args={[L.w + 40, L.d + 40]} />
        <meshStandardMaterial color={dark ? "#1a1617" : "#f3dfe5"} roughness={1} />
      </mesh>

      {/* ── 벽 · 천장 ── */}
      <Wall w={L.w} pos={[0, 0, -L.d / 2]} rot={0} color={wl.color!} accent={accent} dark={dark} />
      <Wall w={L.d} pos={[-L.w / 2, 0, 0]} rot={Math.PI / 2} color={wl.color!} accent={accent} dark={dark} />
      <Wall w={L.d} pos={[L.w / 2, 0, 0]} rot={-Math.PI / 2} color={wl.color!} accent={accent} dark={dark} />
      {[-1, 1].map((s) => (
        <Wall key={s} w={L.w / 2 - 1.4} pos={[s * (L.w / 4 + 0.7), 0, L.d / 2]} rot={Math.PI} color={wl.color!} accent={accent} dark={dark} />
      ))}
      <Ceiling L={L} dark={dark} light={lt.color!} />
      <Chandelier position={[0, ROOM_H, 0]} color={lt.color!} r={Math.min(1.5, L.w * 0.09)} />

      {/* ── 오른쪽 벽: 아치 창 + 빛줄기 ── */}
      {windowsZ(L).map((z) => <ArchWindow key={z} position={[L.w / 2 - 0.02, 0, z]} hi={hi} dark={dark} />)}

      {/* ── 입구: 골드 프레임 + 글래스 도어 ── */}
      <group position={[0, 0, L.d / 2]}>
        {[-1.4, 1.4].map((x) => (
          <mesh key={x} position={[x, 1.45, 0]} castShadow><boxGeometry args={[0.12, 2.9, 0.18]} /><Gold /></mesh>
        ))}
        <mesh position={[0, 2.93, 0]}><boxGeometry args={[2.92, 0.12, 0.18]} /><Gold /></mesh>
        {[-0.7, 0.7].map((x) => (
          <mesh key={x} position={[x, 1.45, -0.02]}>
            <boxGeometry args={[1.34, 2.84, 0.03]} />
            <meshPhysicalMaterial color="#eaf4ff" transparent opacity={0.16} roughness={0.04} metalness={0.1} side={THREE.DoubleSide} />
          </mesh>
        ))}
        {[-0.12, 0.12].map((x) => (
          <mesh key={x} position={[x, 1.3, -0.07]}><cylinderGeometry args={[0.018, 0.018, 0.9, 10]} /><Gold /></mesh>
        ))}
        <mesh position={[0, 0.012, -0.85]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.4, 1.5]} /><meshStandardMaterial color={dark ? "#3a3336" : "#f1b3c4"} roughness={1} /></mesh>
        <Label text="WELCOME" width={1.3} position={[0, 0.016, -0.85]} rotation={[-Math.PI / 2, 0, 0]} color="#ffffff" />
      </group>

      {/* ── 시그니처 월: 백라이트 로고 ── */}
      <group position={[0.4, 2.62, -L.d / 2 + 0.03]}>
        <mesh position={[0, 0, 0.004]}>
          <planeGeometry args={[Math.min(7.4, L.w * 0.5), 1.5]} />
          <meshBasicMaterial map={glow(dark ? "#c9a66b" : "#ffd9a8")} transparent opacity={dark ? 0.55 : 0.75} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
        <Label text="MEDIDERMA LOUNGE" sub={L.level.name} width={Math.min(6, L.w * 0.4)} position={[0, 0, 0.012]} color={dark ? "#f2d59a" : "#b98a4a"} />
      </group>

      <DisplayAlcoves L={L} dark={dark} accent={accent} />
      <CareStage L={L} dark={dark} activeMode={activeMode} />
      <Reception L={L} dark={dark} />

      {/* ── 대기 라운지 (CONSULTING) ── */}
      <group position={[L.sofa.x - 0.4, 0, L.sofa.z + 0.1]}>
        <mesh position={[0, 0.012, -0.9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[1.9, 56]} /><meshStandardMaterial color={dark ? "#2e282a" : "#fdeef1"} roughness={1} /></mesh>
        <mesh position={[0, 0.014, -0.9]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.72, 1.78, 56]} /><meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.35} /></mesh>
        <Sofa color={soft} seats={3} />
        <group position={[0, 0, -1.25]}>
          <mesh position={[0, 0.42, 0]} castShadow><cylinderGeometry args={[0.5, 0.5, 0.045, 40]} /><meshStandardMaterial map={marble("#ffffff", "#c9c1c4", "#d8b468")} roughness={0.15} /></mesh>
          <mesh position={[0, 0.21, 0]}><cylinderGeometry args={[0.05, 0.22, 0.42, 20]} /><Gold /></mesh>
          <ProductBottle p={PRODUCTS[5]} s={1.2} position={[0.15, 0.445, 0.05]} />
          <mesh position={[-0.18, 0.5, -0.05]} castShadow><sphereGeometry args={[0.07, 12, 10]} /><meshStandardMaterial color="#f29bb1" roughness={0.7} /></mesh>
        </group>
        <Pampas position={[-1.75, 0, 0.05]} />
      </group>
      {level >= 3 && <group position={[L.sofa.x + 6.0, 0, L.sofa.z + 0.1]}><Sofa color={dark ? "#2a2527" : "#e3d8f6"} seats={2} /></group>}

      {/* ── 화장대 코너 (MY CHARACTER) ── */}
      <group position={[L.vanity.x, 0, L.vanity.z]} rotation={[0, Math.PI / 2, 0]}>
        <Vanity />
        <mesh position={[0, 0.24, 0.55]} castShadow><cylinderGeometry args={[0.2, 0.2, 0.1, 24]} /><meshStandardMaterial color={soft} roughness={0.9} /></mesh>
        <mesh position={[0, 0.1, 0.55]}><cylinderGeometry args={[0.03, 0.14, 0.2, 12]} /><Gold /></mesh>
      </group>

      {/* ── 등급별 확장 존 ── */}
      {level >= 2 && (
        <>
          <group position={[L.photo.x, 0, L.photo.z]} rotation={[0, Math.PI / 2, 0]}>
            <FlowerArch />
            <Neon text="BEAUTY LIFE" position={[0, 2.75, -0.46]} />
          </group>
          <group position={[L.bed.x - 4.4, 0, -L.d / 2 + 1.2]}>
            {/* HEAD SPA ZONE */}
            <RoundedBox args={[0.8, 0.5, 1.5]} radius={0.1} position={[0, 0.3, 0]} castShadow><meshStandardMaterial color="#e3d8f6" roughness={0.8} /></RoundedBox>
            <RoundedBox args={[0.8, 0.9, 0.18]} radius={0.08} position={[0, 0.75, -0.6]} rotation={[0.5, 0, 0]} castShadow><meshStandardMaterial color="#e3d8f6" roughness={0.8} /></RoundedBox>
            <mesh position={[0, 0.5, -1]} castShadow><cylinderGeometry args={[0.36, 0.3, 0.9, 28]} /><meshStandardMaterial map={marble("#ffffff", "#c9c1c4")} roughness={0.2} /></mesh>
            <Label text="HEAD SPA" width={1.4} position={[0, 2.0, -1.17]} color={GOLD} />
          </group>
        </>
      )}
      {level >= 3 && (
        <group position={[-L.w / 2 + 7.6, 0, -L.d / 2 + 1.5]}>
          <CareBed accent="#d9efe4" scale={0.95} />
          <Label text="BODY CARE" width={1.5} position={[0, 2.0, -1.47]} color={GOLD} />
        </group>
      )}
      {level >= 4 && (
        <group position={[-L.w / 2 + 2.6, 0, -L.d / 2 + 5.2]}>
          {/* VIP BEAUTY ROOM: 글래스 파티션 */}
          <mesh position={[2.3, 1.4, 0]}><boxGeometry args={[0.05, 2.8, 3.6]} /><meshPhysicalMaterial color="#ffffff" transparent opacity={0.18} roughness={0.03} metalness={0.1} /></mesh>
          {[-1.8, 1.8].map((z) => <mesh key={z} position={[2.3, 1.4, z]}><boxGeometry args={[0.07, 2.8, 0.07]} /><Gold /></mesh>)}
          <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[4.4, 3.6]} /><meshStandardMaterial map={marble("#1f1b1d", "#4d4549", "#c9a66b")} roughness={0.2} metalness={0.3} /></mesh>
          <CareBed accent="#1b1719" position={[0, 0, -0.4]} rotation={[0, Math.PI / 2, 0]} />
          <Label text="VIP BEAUTY ROOM" width={2} position={[-2.56, 2.1, 0]} rotation={[0, Math.PI / 2, 0]} color={GOLD} />
        </group>
      )}
      {level >= 5 && (
        <group position={[2.5, 0, 1.5]}>
          {/* SOCIAL LOUNGE */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[2.3, 56]} /><meshStandardMaterial map={marble("#1f1b1d", "#4d4549", "#c9a66b")} roughness={0.2} metalness={0.3} /></mesh>
          <mesh position={[0, 0.45, 0]} castShadow><cylinderGeometry args={[0.7, 0.7, 0.06, 36]} /><Gold rough={0.2} /></mesh>
          <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.08, 0.3, 0.44, 18]} /><Gold /></mesh>
          {[0, 1, 2, 3].map((i) => (
            <group key={i} rotation={[0, (i / 4) * Math.PI * 2, 0]}><group position={[0, 0, 1.55]}><Sofa color="#f6bccb" seats={1} /></group></group>
          ))}
        </group>
      )}

      {/* 공기 중 반짝이는 먼지 */}
      {hi && <Sparkles count={70} scale={[L.w * 0.9, ROOM_H * 0.8, L.d * 0.9]} position={[0, ROOM_H * 0.5, 0]} size={1.6} speed={0.25} opacity={0.5} color={dark ? "#ffe2a0" : "#fff3e0"} />}

      {/* ── 플레이어가 배치한 가구 ── */}
      {furniture.map((f) => (
        <group key={f.uid} position={[f.x, 0, f.z]} rotation={[0, f.rot, 0]} onClick={(e) => { if (!onFurniture || e.delta > 6) return; e.stopPropagation(); onFurniture(f.uid); }}>
          <FurnitureMesh type={f.type} accent={accent} />
          {selected === f.uid && (
            <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.85, 0.95, 40]} /><meshBasicMaterial color="#ff7fa5" transparent opacity={0.9} toneMapped={false} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

const windowsZ = (L: Layout) => {
  const out: number[] = [];
  for (let z = -L.d / 2 + 4.6; z < L.d / 2 - 4.4; z += 2.6) out.push(z);
  return out.length ? out : [0];
};

/** 벽 한 면: 패널 몰딩 텍스처 + 걸레받이·체어레일·크라운 몰딩 + 코브 LED */
function Wall({ w, pos, rot, color, accent, dark }: { w: number; pos: [number, number, number]; rot: number; color: string; accent: string; dark: boolean }) {
  const upper = useMemo(() => { const t = wallPanel(color, dark, true).clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, Math.round(w / 1.5)), 1); return t; }, [color, dark, w]);
  const lower = useMemo(() => { const t = wallPanel(dark ? "#1a1617" : accent, dark, false).clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, Math.round(w / 1.0)), 1); return t; }, [accent, dark, w]);
  const rail = 1.0;
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <mesh position={[0, (ROOM_H + rail) / 2, 0]} receiveShadow><planeGeometry args={[w, ROOM_H - rail]} /><meshStandardMaterial map={upper} roughness={0.85} /></mesh>
      <mesh position={[0, rail / 2, 0.004]} receiveShadow><planeGeometry args={[w, rail]} /><meshStandardMaterial map={lower} roughness={0.8} /></mesh>
      <mesh position={[0, 0.07, 0.03]}><boxGeometry args={[w, 0.14, 0.05]} /><meshStandardMaterial color={dark ? "#141112" : "#ffffff"} roughness={0.5} /></mesh>
      <mesh position={[0, rail, 0.025]}><boxGeometry args={[w, 0.05, 0.045]} /><Gold rough={0.35} /></mesh>
      <mesh position={[0, ROOM_H - 0.34, 0.05]}><boxGeometry args={[w, 0.1, 0.1]} /><meshStandardMaterial color={dark ? "#141112" : "#ffffff"} roughness={0.5} /></mesh>
      <mesh position={[0, ROOM_H - 0.4, 0.03]}><boxGeometry args={[w, 0.025, 0.05]} /><Gold rough={0.35} /></mesh>
      {/* 코브 LED: 크라운 몰딩 위로 번지는 간접 조명 */}
      <mesh position={[0, ROOM_H - 0.27, 0.07]}><boxGeometry args={[w - 0.1, 0.025, 0.03]} /><meshBasicMaterial color={dark ? "#ffcf8a" : "#ffe6cf"} toneMapped={false} /></mesh>
      <mesh position={[0, ROOM_H - 0.14, 0.012]}>
        <planeGeometry args={[w, 0.5]} />
        <meshBasicMaterial map={gradient([[0, "rgba(255,225,190,0)"], [1, "rgba(255,225,190,0.55)"]], "cove")} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Ceiling({ L, dark, light }: { L: Layout; dark: boolean; light: string }) {
  // 아래에서만 보이는 면: 카메라가 높이 올라가면 자동으로 사라진다
  const spots: [number, number][] = [];
  for (let x = -L.w / 2 + 2.2; x < L.w / 2 - 1; x += 3.2) for (let z = -L.d / 2 + 2.2; z < L.d / 2 - 1; z += 3.2) spots.push([x, z]);
  return (
    <group position={[0, ROOM_H, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[L.w, L.d]} /><meshStandardMaterial color={dark ? "#191516" : "#fffaf5"} roughness={0.95} /></mesh>
      {/* 우물천장 프레임 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}><ringGeometry args={[Math.min(L.w, L.d) * 0.3, Math.min(L.w, L.d) * 0.3 + 0.12, 72]} /><meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.35} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
        <circleGeometry args={[Math.min(L.w, L.d) * 0.3, 72]} />
        <meshBasicMaterial map={glow(light)} transparent opacity={dark ? 0.35 : 0.6} depthWrite={false} toneMapped={false} />
      </mesh>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, -0.01, z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.1, 20]} /><meshBasicMaterial color="#fff4de" toneMapped={false} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}><ringGeometry args={[0.1, 0.135, 20]} /><meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.35} /></mesh>
        </group>
      ))}
    </group>
  );
}

/** 3단 링 샹들리에 */
function Chandelier({ color, r, ...props }: { color: string; r: number } & JSX.IntrinsicElements["group"]) {
  const g = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => { if (g.current) g.current.rotation.y = clock.elapsedTime * 0.05; });
  const rings = [{ r, y: -1.15, n: 18 }, { r: r * 0.68, y: -0.85, n: 13 }, { r: r * 0.38, y: -0.58, n: 8 }];
  return (
    <group {...props}>
      <mesh position={[0, -0.04, 0]}><cylinderGeometry args={[0.2, 0.26, 0.08, 24]} /><Gold /></mesh>
      <group ref={g}>
        {rings.map((ring, k) => (
          <group key={k} position={[0, ring.y, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[ring.r, 0.022, 10, 64]} /><Gold rough={0.2} /></mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}><torusGeometry args={[ring.r, 0.012, 8, 64]} /><meshBasicMaterial color="#fff1d6" toneMapped={false} /></mesh>
            {Array.from({ length: ring.n }).map((_, i) => {
              const a = (i / ring.n) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(a) * ring.r, -0.12, Math.sin(a) * ring.r]}>
                  <octahedronGeometry args={[0.045]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.05} metalness={0.3} emissive={color} emissiveIntensity={1.1} />
                </mesh>
              );
            })}
            {/* 천장에서 내려오는 줄 */}
            {[0, 1, 2].map((i) => {
              const a = (i / 3) * Math.PI * 2 + k;
              return <mesh key={i} position={[Math.cos(a) * ring.r, -ring.y / 2, Math.sin(a) * ring.r]}><cylinderGeometry args={[0.004, 0.004, -ring.y, 4]} /><Gold /></mesh>;
            })}
          </group>
        ))}
      </group>
    </group>
  );
}

/** 아치 창: 밝은 유리 + 골드 프레임 + 커튼 + 빛줄기 + 바닥 빛 웅덩이. 원점은 벽면 바닥, 로컬 +z 가 실내 */
function ArchWindow({ hi, dark, ...props }: { hi: boolean; dark: boolean } & JSX.IntrinsicElements["group"]) {
  const W = 1.3, Hs = 1.75, Y0 = 0.75;
  const sky = gradient([[0, "#ffffff"], [0.55, "#fff2dc"], [1, "#ffd9c2"]], "sky");
  const shaft = gradient([[0, "rgba(255,236,200,0.34)"], [1, "rgba(255,236,200,0)"]], "shaft");
  return (
    <group {...props} rotation={[0, -Math.PI / 2, 0]}>
      {/* 유리 */}
      <mesh position={[0, Y0 + Hs / 2, 0]}><planeGeometry args={[W, Hs]} /><meshBasicMaterial map={sky} color="#fff7ea" toneMapped={false} /></mesh>
      <mesh position={[0, Y0 + Hs, 0]}><circleGeometry args={[W / 2, 32, 0, Math.PI]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh>
      {/* 프레임·창살 */}
      {[-1, 1].map((s) => <mesh key={s} position={[s * (W / 2 + 0.03), Y0 + Hs / 2, 0.02]}><boxGeometry args={[0.07, Hs, 0.07]} /><Gold /></mesh>)}
      <mesh position={[0, Y0 + Hs, 0.02]}><torusGeometry args={[W / 2 + 0.03, 0.035, 10, 40, Math.PI]} /><Gold /></mesh>
      <mesh position={[0, Y0 - 0.03, 0.05]}><boxGeometry args={[W + 0.3, 0.07, 0.16]} /><Gold /></mesh>
      <mesh position={[0, Y0 + Hs / 2, 0.02]}><boxGeometry args={[0.03, Hs, 0.03]} /><Gold /></mesh>
      {[0.33, 0.66, 1].map((k) => <mesh key={k} position={[0, Y0 + Hs * k, 0.02]}><boxGeometry args={[W, 0.03, 0.03]} /><Gold /></mesh>)}
      {/* 커튼 */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (W / 2 + 0.32), 0, 0.1]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[s * i * 0.085, 1.72, (i % 2) * 0.04]} castShadow>
              <cylinderGeometry args={[0.06, 0.075, 3.3, 10]} />
              <meshStandardMaterial color={dark ? "#3a3033" : "#fff3ea"} roughness={0.95} />
            </mesh>
          ))}
          <mesh position={[s * 0.13, 1.25, 0.08]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.16, 0.018, 8, 20]} /><Gold /></mesh>
        </group>
      ))}
      <mesh position={[0, 3.4, 0.12]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.02, 0.02, W + 1.5, 8]} /><Gold /></mesh>
      {/* 빛줄기 (가짜 볼류메트릭) */}
      {hi && [-0.3, 0.3].map((o) => (
        <mesh key={o} position={[o, 1.35, 1.9]} rotation={[-0.92, 0, 0]}>
          <planeGeometry args={[W * 0.55, 4.6]} />
          <meshBasicMaterial map={shaft} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 0.02, 2.5]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.7, 1]}>
        <circleGeometry args={[1.05, 32]} />
        <meshBasicMaterial map={glow("#ffe9c4")} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** PRODUCT DISPLAY ZONE: 뒤벽의 아치 알코브 3개, LED 유리 선반에 스킨케어 17종 */
function DisplayAlcoves({ L, dark, accent }: { L: Layout; dark: boolean; accent: string }) {
  const AW = 1.24, AH = 1.9, Y0 = 0.62;
  const back = gradient(dark ? [[0, "#5a4426"], [1, "#2a2022"]] : [[0, "#fff2dc"], [1, accent]], `alcove${dark}${accent}`);
  return (
    <group position={[L.shelf.x, 0, L.shelf.z - 0.42]}>
      {[-1, 0, 1].map((col) => (
        <group key={col} position={[col * 1.42, 0, 0]}>
          {/* 안쪽 면 + 후광 */}
          <mesh position={[0, Y0 + AH / 2, 0.012]}><planeGeometry args={[AW, AH]} /><meshBasicMaterial map={back} toneMapped={false} /></mesh>
          <mesh position={[0, Y0 + AH, 0.012]}><circleGeometry args={[AW / 2, 32, 0, Math.PI]} /><meshBasicMaterial color={dark ? "#5a4426" : "#fff2dc"} toneMapped={false} /></mesh>
          {/* 아치 프레임 */}
          {[-1, 1].map((s) => <mesh key={s} position={[s * (AW / 2 + 0.035), Y0 + AH / 2, 0.06]} castShadow><boxGeometry args={[0.07, AH, 0.14]} /><Gold /></mesh>)}
          <mesh position={[0, Y0 + AH, 0.06]}><torusGeometry args={[AW / 2 + 0.035, 0.04, 10, 40, Math.PI]} /><Gold /></mesh>
          {/* 유리 선반 + LED */}
          {[0, 1, 2].map((row) => {
            const y = Y0 + 0.02 + row * 0.62;
            const items = SHELF_PRODUCTS.slice((col + 1) * 6 + row * 2, (col + 1) * 6 + row * 2 + 2);
            return (
              <group key={row} position={[0, y, 0.2]}>
                <mesh castShadow><boxGeometry args={[AW, 0.025, 0.36]} /><meshPhysicalMaterial color="#ffffff" transparent opacity={0.55} roughness={0.05} metalness={0.1} /></mesh>
                <mesh position={[0, -0.016, 0.17]}><boxGeometry args={[AW, 0.012, 0.012]} /><meshBasicMaterial color="#fff0d2" toneMapped={false} /></mesh>
                {items.map((p, i) => <ProductBottle key={p.id} p={p} s={1.75} position={[-0.3 + i * 0.6, 0.014, 0]} />)}
              </group>
            );
          })}
        </group>
      ))}
      {/* 하부장 */}
      <mesh position={[0, 0.3, 0.26]} castShadow receiveShadow><boxGeometry args={[4.5, 0.6, 0.52]} /><meshStandardMaterial map={fluted(dark ? "#1b1719" : "#fff6ee")} roughness={0.5} /></mesh>
      <mesh position={[0, 0.615, 0.26]}><boxGeometry args={[4.56, 0.035, 0.56]} /><meshStandardMaterial map={marble("#ffffff", "#c9c1c4", "#d8b468")} roughness={0.15} /></mesh>
      <Label text="UNI&CORE" sub="SKINCARE COLLECTION" width={2.3} position={[0, 3.2, 0.02]} color={dark ? "#f2d59a" : "#b98a4a"} />
    </group>
  );
}

/** DERMA HOME DEVICE ZONE: 원형 스테이지 + 시어 커튼 + 링 라이트 */
function CareStage({ L, dark, activeMode }: { L: Layout; dark: boolean; activeMode?: ModeId | null }) {
  return (
    <group position={[L.bed.x, 0, L.bed.z]}>
      <mesh position={[0, 0.03, 0.2]} receiveShadow><cylinderGeometry args={[2.35, 2.4, 0.06, 64]} /><meshStandardMaterial map={marble(dark ? "#2a2527" : "#fff3f5", dark ? "#5a5054" : "#e9b9c4", "#d8b468")} roughness={0.2} /></mesh>
      <mesh position={[0, 0.062, 0.2]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[2.28, 2.35, 64]} /><meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} /></mesh>
      <mesh position={[0, 0.04, 0.2]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[2.4, 2.46, 64]} /><meshBasicMaterial color="#ffe0ea" toneMapped={false} /></mesh>
      {/* 시어 커튼 (뒤쪽 반원) */}
      <mesh position={[0, 1.75, 0.2]} rotation={[0, Math.PI, 0]}>
        <cylinderGeometry args={[2.25, 2.25, 3.3, 48, 1, true, -Math.PI * 0.42, Math.PI * 0.84]} />
        <meshStandardMaterial map={gradient([[0, "rgba(255,255,255,0.75)"], [1, "rgba(255,240,244,0.25)"]], "sheer")} transparent side={THREE.DoubleSide} roughness={1} depthWrite={false} />
      </mesh>
      <mesh position={[0, 3.42, 0.2]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[2.25, 0.025, 8, 64]} /><Gold /></mesh>
      <group position={[0, 0.06, 0]}>
        <CareBed accent={dark ? "#3a3336" : "#f9d5dc"} />
        <group position={[-1.75, 0, -0.4]}>
          <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[0.74, 0.8, 0.56]} /><meshStandardMaterial map={fluted(dark ? "#1b1719" : "#fffaf4")} roughness={0.5} /></mesh>
          <mesh position={[0, 0.815, 0]}><boxGeometry args={[0.8, 0.035, 0.62]} /><meshStandardMaterial map={marble("#ffffff", "#c9c1c4", "#d8b468")} roughness={0.15} /></mesh>
          <DermaHome position={[0, 0.835, 0]} rotation={[0, 0.35, 0]} activeMode={activeMode} />
        </group>
        {/* 링 라이트 */}
        <group position={[1.55, 0, -0.75]}>
          <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.2, 0.22, 0.04, 20]} /><Gold /></mesh>
          <mesh position={[0, 0.85, 0]}><cylinderGeometry args={[0.014, 0.014, 1.7, 8]} /><Gold /></mesh>
          <mesh position={[0, 1.85, 0]} rotation={[0, -0.6, 0]}><torusGeometry args={[0.24, 0.03, 12, 40]} /><meshBasicMaterial color="#fff6ea" toneMapped={false} /></mesh>
        </group>
      </group>
      <Label text="DERMA HOME" sub="RF · ULTRASONIC · IONTOPHORESIS" width={2.6} position={[-0.3, 3.2, -L.bed.z - L.d / 2 + 0.03]} color={dark ? "#f2d59a" : "#b98a4a"} />
    </group>
  );
}

/** RECEPTION: 플루팅 곡선 데스크 + 대리석 상판 + 펜던트 조명 */
function Reception({ L, dark }: { L: Layout; dark: boolean }) {
  const flute = useMemo(() => { const t = fluted(dark ? "#1b1719" : "#fffaf4").clone(); t.needsUpdate = true; t.repeat.set(5, 1); return t; }, [dark]);
  return (
    <group position={[L.reception.x, 0, L.reception.z]}>
      <mesh position={[0, 0.5, 0.25]} castShadow receiveShadow rotation={[0, Math.PI, 0]}>
        <cylinderGeometry args={[1.25, 1.25, 1, 48, 1, false, -Math.PI * 0.42, Math.PI * 0.84]} />
        <meshStandardMaterial map={flute} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.02, 0.25]} rotation={[0, Math.PI, 0]}>
        <cylinderGeometry args={[1.34, 1.34, 0.05, 48, 1, false, -Math.PI * 0.44, Math.PI * 0.88]} />
        <meshStandardMaterial map={marble("#ffffff", "#c9c1c4", "#d8b468")} roughness={0.12} />
      </mesh>
      <mesh position={[0, 0.06, 0.25]} rotation={[0, Math.PI, 0]}>
        <cylinderGeometry args={[1.27, 1.27, 0.03, 48, 1, true, -Math.PI * 0.42, Math.PI * 0.84]} />
        <meshBasicMaterial color="#ffe0c0" toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <Label text="RECEPTION" width={1.2} position={[0, 0.6, -1.02]} rotation={[0, Math.PI, 0]} color={dark ? "#f2d59a" : "#b98a4a"} />
      <mesh position={[0.45, 1.16, -0.75]} rotation={[0, Math.PI, 0]} castShadow><boxGeometry args={[0.36, 0.22, 0.02]} /><meshStandardMaterial color="#1b1719" roughness={0.25} metalness={0.4} /></mesh>
      <group position={[-0.5, 1.045, -0.7]}>
        <mesh position={[0, 0.09, 0]} castShadow><cylinderGeometry args={[0.07, 0.05, 0.18, 14]} /><meshPhysicalMaterial color="#ffffff" transparent opacity={0.5} roughness={0.05} /></mesh>
        {["#f29bb1", "#ffd0dc", "#ffffff"].map((c, i) => <mesh key={c} position={[Math.cos(i * 2.1) * 0.05, 0.26 + (i % 2) * 0.04, Math.sin(i * 2.1) * 0.05]} castShadow><sphereGeometry args={[0.055, 10, 8]} /><meshStandardMaterial color={c} roughness={0.7} /></mesh>)}
      </group>
      {/* 펜던트 조명 */}
      {[-0.6, 0, 0.6].map((x, i) => (
        <group key={x} position={[x, ROOM_H, -0.55]}>
          <mesh position={[0, -(0.55 + i * 0.12), 0]}><cylinderGeometry args={[0.004, 0.004, 1.1 + i * 0.24, 4]} /><Gold /></mesh>
          <mesh position={[0, -(1.15 + i * 0.24), 0]}><sphereGeometry args={[0.1, 16, 12]} /><meshBasicMaterial color="#fff0d4" toneMapped={false} /></mesh>
          <mesh position={[0, -(1.06 + i * 0.24), 0]}><cylinderGeometry args={[0.03, 0.06, 0.06, 12]} /><Gold /></mesh>
        </group>
      ))}
      <pointLight position={[0, 2.3, -0.55]} intensity={4} distance={5} color="#ffe6c4" />
    </group>
  );
}

/** 팜파스 그라스 화병 */
function Pampas(props: JSX.IntrinsicElements["group"]) {
  return (
    <group {...props}>
      <mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.13, 0.2, 0.6, 20]} /><meshStandardMaterial map={marble("#ffffff", "#c9c1c4", "#d8b468")} roughness={0.2} /></mesh>
      {Array.from({ length: 9 }).map((_, i) => {
        const a = i * 0.7, lean = 0.12 + (i % 3) * 0.09;
        return (
          <group key={i} rotation={[Math.cos(a) * lean, 0, Math.sin(a) * lean]}>
            <mesh position={[0, 0.95, 0]}><cylinderGeometry args={[0.006, 0.008, 1.1, 5]} /><meshStandardMaterial color="#cdb892" roughness={0.9} /></mesh>
            <mesh position={[0, 1.6 + (i % 2) * 0.1, 0]} scale={[1, 3.4, 1]} castShadow><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color={i % 2 ? "#f4e7d2" : "#ecd9bd"} roughness={1} /></mesh>
          </group>
        );
      })}
    </group>
  );
}

/** 네온 사인 (블룸으로 번진다) */
function Neon({ text, ...props }: { text: string } & JSX.IntrinsicElements["group"]) {
  return (
    <group {...props}>
      <mesh position={[0, 0, -0.01]}><planeGeometry args={[2.4, 0.9]} /><meshBasicMaterial map={glow("#ff7fb0")} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
      <Label text={text} width={1.9} color="#ffd6e6" weight={800} />
    </group>
  );
}
