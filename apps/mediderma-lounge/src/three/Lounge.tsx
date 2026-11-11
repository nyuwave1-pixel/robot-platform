/** 메디더마 라운지 공간. 등급에 따라 크기·존·장식이 확장된다. */
import { useMemo } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";
import { INTERIOR_MAP } from "../data/game";
import { PRODUCTS } from "../data/products";
import type { Furniture } from "../store/game";
import { Label } from "./Label";
import { layout, type Layout } from "./layout";
import { CareBed, DermaHome, FlowerArch, FurnitureMesh, ProductBottle, Sofa, Vanity } from "./Props";
import type { ModeId } from "../data/devices";

const gold = "#c9a66b";
const H = 3.3;

function useFloorTexture(base: string, alt: string) {
  return useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    g.fillStyle = alt;
    g.fillRect(0, 0, 128, 128); g.fillRect(128, 128, 128, 128);
    g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 2;
    g.strokeRect(0, 0, 128, 128); g.strokeRect(128, 128, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }, [base, alt]);
}

export const SHELF_PRODUCTS = PRODUCTS.filter((p) => p.category === "스킨케어");

interface Props {
  level: number; floor: string; wall: string; light: string;
  furniture: Furniture[];
  selected?: string | null;
  activeMode?: ModeId | null;
  onFloor?: (x: number, z: number) => void;
  onFurniture?: (uid: string) => void;
}

export function Lounge({ level, floor, wall, light, furniture, selected, activeMode, onFloor, onFurniture }: Props) {
  const L = useMemo(() => layout(level), [level]);
  const fl = INTERIOR_MAP[floor] ?? INTERIOR_MAP["floor-cream"];
  const wl = INTERIOR_MAP[wall] ?? INTERIOR_MAP["wall-cream"];
  const lt = INTERIOR_MAP[light] ?? INTERIOR_MAP["light-warm"];
  const dark = wall === "wall-black";
  const tex = useFloorTexture(fl.color!, fl.accent!);
  tex.repeat.set(L.w / 2, L.d / 2);
  const accent = wl.accent ?? "#f9d5dc";
  const click = (e: ThreeEvent<MouseEvent>) => { if (e.delta > 6) return; e.stopPropagation(); onFloor?.(e.point.x, e.point.z); };

  return (
    <group>
      {/* 조명 */}
      <hemisphereLight args={["#fff4ee", "#f3d9e0", dark ? 0.75 : 1.05]} />
      <directionalLight position={[5, 9, 6]} intensity={1.5} color={lt.color} castShadow shadow-mapSize={[1536, 1536]} shadow-bias={-0.0004}>
        <orthographicCamera attach="shadow-camera" args={[-L.w / 2 - 2, L.w / 2 + 2, L.d / 2 + 2, -L.d / 2 - 2, 0.5, 30]} />
      </directionalLight>
      <pointLight position={[0, 2.9, 0]} intensity={8} distance={L.w} color={lt.color} />
      <pointLight position={[L.bed.x, 2.4, L.bed.z + 0.6]} intensity={6} distance={7} color="#ffe9f0" />

      {/* 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={click}>
        <planeGeometry args={[L.w, L.d]} />
        <meshStandardMaterial map={tex} roughness={dark ? 0.25 : 0.55} metalness={dark ? 0.25 : 0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[L.w + 30, L.d + 30]} />
        <meshStandardMaterial color="#f6e7ec" roughness={1} />
      </mesh>

      {/* 벽: 안쪽 면만 그려서 카메라가 밖으로 나가면 자동으로 사라진다 */}
      <Wall w={L.w} pos={[0, H / 2, -L.d / 2]} rot={0} color={wl.color!} accent={accent} />
      <Wall w={L.d} pos={[-L.w / 2, H / 2, 0]} rot={Math.PI / 2} color={wl.color!} accent={accent} />
      <Wall w={L.d} pos={[L.w / 2, H / 2, 0]} rot={-Math.PI / 2} color={wl.color!} accent={accent} />
      {[-1, 1].map((s) => (
        <Wall key={s} w={L.w / 2 - 1.3} pos={[s * (L.w / 4 + 0.65), H / 2, L.d / 2]} rot={Math.PI} color={wl.color!} accent={accent} />
      ))}
      {/* 입구 프레임 */}
      <group position={[0, 0, L.d / 2]}>
        {[-1.3, 1.3].map((x) => (
          <mesh key={x} position={[x, 1.3, 0]} castShadow><boxGeometry args={[0.12, 2.6, 0.16]} /><meshStandardMaterial color={gold} metalness={0.8} roughness={0.3} /></mesh>
        ))}
        <mesh position={[0, 2.62, 0]}><boxGeometry args={[2.72, 0.12, 0.16]} /><meshStandardMaterial color={gold} metalness={0.8} roughness={0.3} /></mesh>
        <mesh position={[0, 0.011, -0.7]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.2, 1.3]} /><meshStandardMaterial color={dark ? "#3a3336" : "#f6bccb"} roughness={1} /></mesh>
        <Label text="WELCOME" width={1.2} position={[0, 0.013, -0.7]} rotation={[-Math.PI / 2, 0, 0]} color="#ffffff" />
      </group>

      {/* 시그니처 월 */}
      <Label text="MEDIDERMA LOUNGE" sub={L.level.name} width={Math.min(6.2, L.w * 0.42)} position={[0.4, 2.45, -L.d / 2 + 0.03]} color={gold} />

      {/* PRODUCT DISPLAY ZONE */}
      <ProductShelf L={L} dark={dark} />

      {/* DERMA HOME DEVICE ZONE */}
      <group position={[L.bed.x, 0, L.bed.z]}>
        <CareBed accent={dark ? "#3a3336" : "#f9d5dc"} />
        <group position={[-1.75, 0, -0.4]}>
          <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[0.74, 0.8, 0.56]} /><meshStandardMaterial color="#fffaf4" roughness={0.5} /></mesh>
          <mesh position={[0, 0.815, 0]}><boxGeometry args={[0.78, 0.03, 0.6]} /><meshStandardMaterial color={gold} metalness={0.8} roughness={0.3} /></mesh>
          <DermaHome position={[0, 0.83, 0]} rotation={[0, 0.35, 0]} activeMode={activeMode} />
        </group>
        <Label text="DERMA HOME" sub="RF · ULTRASONIC · IONTOPHORESIS" width={2.6} position={[-0.4, 1.75, -L.bed.z - L.d / 2 + 0.03]} color={dark ? gold : "#b38a4f"} />
        <mesh position={[0, 0.012, 0.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[2.2, 40]} /><meshStandardMaterial color={dark ? "#3a3336" : "#fde8ec"} roughness={1} /></mesh>
      </group>

      {/* RECEPTION */}
      <group position={[L.reception.x, 0, L.reception.z]}>
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow><boxGeometry args={[2, 1, 0.7]} /><meshStandardMaterial color={dark ? "#1b1719" : "#fffaf4"} roughness={0.45} /></mesh>
        <mesh position={[0, 1.02, 0]}><boxGeometry args={[2.1, 0.05, 0.8]} /><meshStandardMaterial color={gold} metalness={0.8} roughness={0.3} /></mesh>
        <Label text="RECEPTION" width={1.3} position={[0, 0.55, -0.36]} rotation={[0, Math.PI, 0]} color={gold} />
        <mesh position={[0.6, 1.14, 0]} castShadow><boxGeometry args={[0.36, 0.2, 0.02]} /><meshStandardMaterial color="#1b1719" roughness={0.3} /></mesh>
        <mesh position={[-0.6, 1.2, 0]} castShadow><sphereGeometry args={[0.12, 12, 10]} /><meshStandardMaterial color="#f29bb1" roughness={0.7} /></mesh>
      </group>

      {/* 대기 소파 (CONSULTING) */}
      <group position={[L.sofa.x - 0.4, 0, L.sofa.z + 0.1]}><Sofa color={dark ? "#2a2527" : "#f6bccb"} seats={3} /></group>
      {level >= 3 && <group position={[L.sofa.x + 6.0, 0, L.sofa.z + 0.1]}><Sofa color={dark ? "#2a2527" : "#e3d8f6"} seats={2} /></group>}

      {/* 화장대 (MY CHARACTER) */}
      <group position={[L.vanity.x, 0, L.vanity.z]} rotation={[0, Math.PI / 2, 0]}><Vanity /></group>

      {/* 등급별 확장 존 */}
      {level >= 2 && (
        <>
          <group position={[L.photo.x, 0, L.photo.z]} rotation={[0, Math.PI / 2, 0]}><FlowerArch /></group>
          <group position={[L.bed.x - 4.4, 0, -L.d / 2 + 1.2]}>
            {/* HEAD SPA ZONE */}
            <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[0.8, 0.5, 1.5]} /><meshStandardMaterial color="#e3d8f6" roughness={0.8} /></mesh>
            <mesh position={[0, 0.75, -0.6]} rotation={[0.5, 0, 0]} castShadow><boxGeometry args={[0.8, 0.9, 0.16]} /><meshStandardMaterial color="#e3d8f6" roughness={0.8} /></mesh>
            <mesh position={[0, 0.5, -1]} castShadow><cylinderGeometry args={[0.36, 0.3, 0.9, 20]} /><meshStandardMaterial color="#ffffff" roughness={0.3} /></mesh>
            <Label text="HEAD SPA" width={1.4} position={[0, 1.85, -1.17]} color={gold} />
          </group>
        </>
      )}
      {level >= 3 && (
        <group position={[-L.w / 2 + 7.6, 0, -L.d / 2 + 1.5]}>
          <CareBed accent="#d9efe4" scale={0.95} />
          <Label text="BODY CARE" width={1.5} position={[0, 1.85, -1.47]} color={gold} />
        </group>
      )}
      {level >= 4 && (
        <group position={[-L.w / 2 + 2.6, 0, -L.d / 2 + 5.2]}>
          {/* VIP BEAUTY ROOM: 글래스 파티션 */}
          <mesh position={[2.3, 1.3, 0]}><boxGeometry args={[0.06, 2.6, 3.6]} /><meshPhysicalMaterial color="#ffffff" transparent opacity={0.22} roughness={0.05} /></mesh>
          <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[4.4, 3.6]} /><meshStandardMaterial color="#1b1719" roughness={0.3} metalness={0.3} /></mesh>
          <CareBed accent="#1b1719" position={[0, 0, -0.4]} rotation={[0, Math.PI / 2, 0]} />
          <Label text="VIP BEAUTY ROOM" width={2} position={[-2.56, 2.0, 0]} rotation={[0, Math.PI / 2, 0]} color={gold} />
        </group>
      )}
      {level >= 5 && (
        <group position={[2.5, 0, 1.5]}>
          {/* SOCIAL LOUNGE */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[2.3, 48]} /><meshStandardMaterial color="#1b1719" roughness={0.3} metalness={0.3} /></mesh>
          <mesh position={[0, 0.45, 0]} castShadow><cylinderGeometry args={[0.7, 0.7, 0.06, 32]} /><meshStandardMaterial color={gold} metalness={0.85} roughness={0.25} /></mesh>
          <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.08, 0.3, 0.44, 16]} /><meshStandardMaterial color={gold} metalness={0.85} roughness={0.25} /></mesh>
          {[0, 1, 2, 3].map((i) => (
            <group key={i} rotation={[0, (i / 4) * Math.PI * 2, 0]}><group position={[0, 0, 1.55]}><Sofa color="#f6bccb" seats={1} /></group></group>
          ))}
        </group>
      )}

      {/* 플레이어가 배치한 가구 */}
      {furniture.map((f) => (
        <group key={f.uid} position={[f.x, 0, f.z]} rotation={[0, f.rot, 0]} onClick={(e) => { if (!onFurniture || e.delta > 6) return; e.stopPropagation(); onFurniture(f.uid); }}>
          <FurnitureMesh type={f.type} accent={accent} />
          {selected === f.uid && (
            <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.85, 0.95, 40]} /><meshBasicMaterial color="#ff7fa5" transparent opacity={0.9} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

function Wall({ w, pos, rot, color, accent }: { w: number; pos: [number, number, number]; rot: number; color: string; accent: string }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <mesh receiveShadow><planeGeometry args={[w, H]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>
      <mesh position={[0, -H / 2 + 0.45, 0.01]}><planeGeometry args={[w, 0.9]} /><meshStandardMaterial color={accent} roughness={0.9} /></mesh>
      <mesh position={[0, -H / 2 + 0.92, 0.02]}><planeGeometry args={[w, 0.04]} /><meshStandardMaterial color={gold} metalness={0.7} roughness={0.35} /></mesh>
      <mesh position={[0, H / 2 - 0.05, 0.02]}><planeGeometry args={[w, 0.1]} /><meshStandardMaterial color={gold} metalness={0.7} roughness={0.35} /></mesh>
    </group>
  );
}

function ProductShelf({ L, dark }: { L: Layout; dark: boolean }) {
  const per = 6;
  return (
    <group position={[L.shelf.x, 0, L.shelf.z]}>
      <mesh position={[0, 1.1, -0.2]} castShadow receiveShadow><boxGeometry args={[4.2, 2.2, 0.1]} /><meshStandardMaterial color={dark ? "#1b1719" : "#fffaf4"} roughness={0.6} /></mesh>
      {[0.55, 1.15, 1.75].map((y, row) => (
        <group key={y}>
          <mesh position={[0, y, 0]} castShadow receiveShadow><boxGeometry args={[4.2, 0.05, 0.45]} /><meshStandardMaterial color={dark ? "#2a2527" : "#ffffff"} roughness={0.4} /></mesh>
          <mesh position={[0, y - 0.03, 0.225]}><boxGeometry args={[4.2, 0.02, 0.012]} /><meshStandardMaterial color={gold} metalness={0.8} roughness={0.3} emissive="#ffdca8" emissiveIntensity={0.4} /></mesh>
          {SHELF_PRODUCTS.slice(row * per, row * per + per).map((p, i) => (
            <ProductBottle key={p.id} p={p} s={1.7} position={[-1.75 + i * 0.7, y + 0.026, 0.02]} />
          ))}
        </group>
      ))}
      <mesh position={[0, 0.25, 0]} castShadow><boxGeometry args={[4.2, 0.5, 0.5]} /><meshStandardMaterial color={dark ? "#1b1719" : "#fbe1e6"} roughness={0.7} /></mesh>
      <Label text="UNI&CORE" sub="SKINCARE COLLECTION" width={2.2} position={[0, 2.55, -0.2]} color={gold} />
    </group>
  );
}
