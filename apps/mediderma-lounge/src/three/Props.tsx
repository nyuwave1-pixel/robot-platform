/** 라운지 소품: DERMA HOME 디바이스, 케어 베드, 제품 용기, 가구 (모두 프로시저럴 — 외부 에셋 없음) */
import { useMemo } from "react";
import * as THREE from "three";
import { Label } from "./Label";
import type { Product } from "../data/products";
import type { ModeId } from "../data/devices";
import { MODES } from "../data/devices";

const gold = "#c9a66b";

/**
 * DERMA HOME 본체. 공식 제품 사진 기준:
 * 화이트 본체 + 기울어진 블랙 터치스크린 + 실버 힌지 바 + 전면 UNI&CORE 플레이트(3색 세로 바)
 * 좌측 프로브 거치대, 우측 원형 메탈 헤드 핸드피스, 하단 라이트 스트립.
 */
export function DermaHome({ activeMode, ...props }: { activeMode?: ModeId | null } & JSX.IntrinsicElements["group"]) {
  const screen = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 512; c.height = 320;
    const g = c.getContext("2d")!;
    g.fillStyle = "#0b0b0d"; g.fillRect(0, 0, 512, 320);
    g.textAlign = "center"; g.fillStyle = "#5d5d63";
    g.font = '500 26px "Helvetica Neue", Arial, sans-serif'; g.fillText("RF DERMA HOME", 256, 70);
    [["#6f7377", 236], ["#8fb38a", 256], ["#b7a9d6", 276]].forEach(([col, x]) => { g.fillStyle = col as string; g.fillRect((x as number) - 6, 110, 12, 70); });
    g.fillStyle = "#7c7c84"; g.font = '500 44px Georgia, "Times New Roman", serif'; g.fillText("UNI&CORE", 256, 250);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  const plate = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 256; c.height = 160;
    const g = c.getContext("2d")!;
    g.fillStyle = "#b9bcc0"; g.fillRect(0, 0, 256, 160);
    [["#55585c", 112], ["#7fa67a", 128], ["#a99bcb", 144]].forEach(([col, x]) => { g.fillStyle = col as string; g.fillRect((x as number) - 5, 26, 10, 52); });
    g.fillStyle = "#4a4d52"; g.textAlign = "center"; g.font = '500 30px Georgia, "Times New Roman", serif'; g.fillText("UNI&CORE", 128, 126);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  const glow = activeMode ? MODES[activeMode].color : "#9fd8ff";
  return (
    <group {...props}>
      {/* 하단 라이트 스트립 */}
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[0.52, 0.024, 0.42]} />
        <meshStandardMaterial color="#eaf6ff" emissive={glow} emissiveIntensity={1.4} transparent opacity={0.9} />
      </mesh>
      {/* 본체 */}
      <mesh position={[0, 0.115, 0]} castShadow>
        <boxGeometry args={[0.5, 0.18, 0.4]} />
        <meshStandardMaterial color="#f5f5f4" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.115, 0.201]}>
        <planeGeometry args={[0.11, 0.07]} />
        <meshStandardMaterial map={plate} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 실버 힌지 바 */}
      <mesh position={[0, 0.225, 0.13]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 16]} />
        <meshStandardMaterial color="#c9ccd0" metalness={0.85} roughness={0.28} />
      </mesh>
      {/* 스크린 하우징 (뒤로 기울어짐) */}
      <group position={[0, 0.235, 0.1]} rotation={[-0.42, 0, 0]}>
        <mesh position={[0, 0.2, -0.02]} castShadow>
          <boxGeometry args={[0.5, 0.4, 0.045]} />
          <meshStandardMaterial color="#f7f7f6" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.215, 0.004]}>
          <planeGeometry args={[0.33, 0.2]} />
          <meshStandardMaterial map={screen} emissive="#ffffff" emissiveMap={screen} emissiveIntensity={0.55} roughness={0.15} />
        </mesh>
      </group>
      {/* 좌: 이온토 프로브 거치대 */}
      <group position={[-0.31, 0.12, 0.08]}>
        <mesh>
          <boxGeometry args={[0.1, 0.012, 0.09]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.45} roughness={0.1} />
        </mesh>
        <Handpiece mode="ionto" scale={0.9} position={[0, 0.02, 0]} />
      </group>
      {/* 우: 원형 헤드 핸드피스 */}
      <group position={[0.33, 0.1, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <Handpiece mode="rf" scale={0.9} />
      </group>
    </group>
  );
}

/** 모드별 헤드. rf: 레드 링이 있는 원형 메탈 헤드 / us: 넓은 플랫 헤드 / ionto: 볼팁 프로브 */
export function Handpiece({ mode, ...props }: { mode: ModeId } & JSX.IntrinsicElements["group"]) {
  const metal = <meshStandardMaterial color="#d6d8db" metalness={0.9} roughness={0.22} />;
  if (mode === "ionto")
    return (
      <group {...props}>
        <mesh position={[0, 0.02, 0]}><sphereGeometry args={[0.016, 12, 10]} />{metal}</mesh>
        <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.006, 0.006, 0.16, 8]} />{metal}</mesh>
        <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.012, 0.012, 0.1, 10]} />{metal}</mesh>
        <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.011, 0.008, 0.07, 10]} /><meshStandardMaterial color="#c8323c" roughness={0.5} /></mesh>
        <mesh position={[0.03, 0.33, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.012, 0.012, 0.05, 10]} />{metal}</mesh>
      </group>
    );
  const r = mode === "us" ? 0.062 : 0.05;
  return (
    <group {...props}>
      <mesh position={[0, 0.012, 0]}><cylinderGeometry args={[r, r * 0.96, 0.02, 28]} />{metal}</mesh>
      {mode === "rf" && (
        <mesh position={[0, 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r * 0.48, 0.004, 8, 28]} />
          <meshStandardMaterial color="#b3202c" emissive="#ff2a3a" emissiveIntensity={0.9} />
        </mesh>
      )}
      <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[r * 1.02, r * 1.02, 0.014, 28]} /><meshPhysicalMaterial color="#f3d9cf" transparent opacity={0.7} roughness={0.2} /></mesh>
      <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[r * 0.55, r * 0.9, 0.07, 20]} />{metal}</mesh>
      <mesh position={[0, 0.17, 0]}><cylinderGeometry args={[0.022, 0.026, 0.16, 14]} /><meshStandardMaterial color="#f4f4f3" roughness={0.35} /></mesh>
    </group>
  );
}

export function CareBed({ accent = "#f9d5dc", ...props }: { accent?: string } & JSX.IntrinsicElements["group"]) {
  return (
    <group {...props}>
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow><boxGeometry args={[2.3, 0.36, 0.9]} /><meshStandardMaterial color="#fffaf4" roughness={0.6} /></mesh>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow><boxGeometry args={[2.36, 0.16, 0.96]} /><meshStandardMaterial color={accent} roughness={0.85} /></mesh>
      <mesh position={[0, 0.595, 0]} receiveShadow><boxGeometry args={[2.2, 0.04, 0.82]} /><meshStandardMaterial color="#ffffff" roughness={0.9} /></mesh>
      <mesh position={[-0.92, 0.64, 0]} scale={[1, 0.38, 1]} castShadow><sphereGeometry args={[0.24, 16, 12]} /><meshStandardMaterial color="#ffffff" roughness={0.9} /></mesh>
      {[-1, 1].flatMap((x) => [-1, 1].map((z) => (
        <mesh key={`${x}${z}`} position={[x * 1.05, 0.03, z * 0.36]}><cylinderGeometry args={[0.04, 0.05, 0.06, 10]} /><meshStandardMaterial color={gold} metalness={0.8} roughness={0.3} /></mesh>
      )))}
    </group>
  );
}

/** 공식 패키지 사진의 형태·색을 단순화한 3D 용기 */
export function ProductBottle({ p, s = 1, ...props }: { p: Product; s?: number } & JSX.IntrinsicElements["group"]) {
  const [a, b] = p.colors;
  const body = <meshStandardMaterial color={a} roughness={0.35} />;
  const cap = <meshStandardMaterial color={b} roughness={0.3} metalness={p.id === "first-birthday-cream" ? 0.8 : 0.15} />;
  const k = s;
  let m: React.ReactNode;
  switch (p.shape) {
    case "jar":
      m = (<>
        <mesh position={[0, 0.045 * k, 0]} castShadow><cylinderGeometry args={[0.07 * k, 0.065 * k, 0.09 * k, 20]} />{body}</mesh>
        <mesh position={[0, 0.105 * k, 0]} castShadow><cylinderGeometry args={[0.073 * k, 0.073 * k, 0.04 * k, 20]} />{cap}</mesh>
      </>); break;
    case "ampoule":
      m = (<>
        <mesh position={[0, 0.09 * k, 0]} castShadow><cylinderGeometry args={[0.032 * k, 0.032 * k, 0.18 * k, 16]} /><meshPhysicalMaterial color={a} roughness={0.15} transparent opacity={0.85} /></mesh>
        <mesh position={[0, 0.2 * k, 0]}><cylinderGeometry args={[0.022 * k, 0.03 * k, 0.05 * k, 12]} />{cap}</mesh>
        <mesh position={[0.075 * k, 0.11 * k, -0.01]} castShadow><boxGeometry args={[0.07 * k, 0.22 * k, 0.06 * k]} />{cap}</mesh>
      </>); break;
    case "pouch":
      m = <mesh position={[0, 0.1 * k, 0]} rotation={[-0.12, 0, 0]} castShadow><boxGeometry args={[0.15 * k, 0.2 * k, 0.012]} />{body}</mesh>; break;
    case "pad":
      m = (<>
        <mesh position={[0, 0.05 * k, 0]} castShadow><cylinderGeometry args={[0.08 * k, 0.08 * k, 0.1 * k, 22]} />{body}</mesh>
        <mesh position={[0, 0.108 * k, 0]}><cylinderGeometry args={[0.082 * k, 0.082 * k, 0.018 * k, 22]} />{cap}</mesh>
      </>); break;
    case "mist":
      m = (<>
        <mesh position={[0, 0.07 * k, 0]} castShadow><cylinderGeometry args={[0.035 * k, 0.035 * k, 0.14 * k, 16]} /><meshStandardMaterial color={b} roughness={0.3} /></mesh>
        <mesh position={[0, 0.165 * k, 0]}><cylinderGeometry args={[0.03 * k, 0.033 * k, 0.07 * k, 16]} /><meshPhysicalMaterial color="#ffffff" transparent opacity={0.55} roughness={0.1} /></mesh>
      </>); break;
    case "tube":
      m = (<>
        <mesh position={[0, 0.12 * k, 0]} scale={[1, 1, 0.55]} castShadow><cylinderGeometry args={[0.02 * k, 0.045 * k, 0.2 * k, 16]} />{body}</mesh>
        <mesh position={[0, 0.02 * k, 0]}><cylinderGeometry args={[0.04 * k, 0.04 * k, 0.04 * k, 16]} />{cap}</mesh>
      </>); break;
    case "pump":
      m = (<>
        <mesh position={[0, 0.09 * k, 0]} castShadow><cylinderGeometry args={[0.04 * k, 0.04 * k, 0.18 * k, 16]} />{body}</mesh>
        <mesh position={[0, 0.2 * k, 0]}><cylinderGeometry args={[0.012 * k, 0.02 * k, 0.05 * k, 10]} />{cap}</mesh>
        <mesh position={[0.02 * k, 0.225 * k, 0]}><boxGeometry args={[0.06 * k, 0.014 * k, 0.02 * k]} />{cap}</mesh>
      </>); break;
    case "stick":
      m = (<>
        <mesh position={[0, 0.11 * k, 0]} scale={[1, 1, 0.5]} castShadow><cylinderGeometry args={[0.03 * k, 0.022 * k, 0.2 * k, 14]} />{body}</mesh>
        <mesh position={[0, 0.012 * k, 0]}><cylinderGeometry args={[0.014 * k, 0.014 * k, 0.03 * k, 10]} />{cap}</mesh>
      </>); break;
    case "cushion":
      m = (<>
        <mesh position={[0, 0.018 * k, 0]} castShadow><cylinderGeometry args={[0.075 * k, 0.075 * k, 0.03 * k, 24]} />{body}</mesh>
        <mesh position={[0, 0.045 * k, 0]}><cylinderGeometry args={[0.077 * k, 0.077 * k, 0.022 * k, 24]} /><meshStandardMaterial color={b} metalness={0.7} roughness={0.25} /></mesh>
      </>); break;
    case "tall":
      m = (<>
        <mesh position={[0, 0.12 * k, 0]} castShadow><cylinderGeometry args={[0.036 * k, 0.036 * k, 0.24 * k, 16]} />{body}</mesh>
        <mesh position={[0, 0.255 * k, 0]}><cylinderGeometry args={[0.02 * k, 0.03 * k, 0.04 * k, 12]} />{cap}</mesh>
      </>); break;
    default:
      m = (<>
        <mesh position={[0, 0.09 * k, 0]} castShadow><boxGeometry args={[0.12 * k, 0.18 * k, 0.07 * k]} />{body}</mesh>
        <mesh position={[0, 0.09 * k, 0.036 * k]}><planeGeometry args={[0.07 * k, 0.05 * k]} />{cap}</mesh>
      </>);
  }
  return <group {...props}>{m}</group>;
}

// ───────────── 가구 ─────────────
export function FurnitureMesh({ type, accent = "#f9d5dc" }: { type: string; accent?: string }) {
  switch (type) {
    case "plant":
      return (<group>
        <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.2, 0.15, 0.4, 16]} /><meshStandardMaterial color="#fff6ec" roughness={0.7} /></mesh>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} position={[Math.cos(i * 0.9) * 0.16, 0.62 + (i % 3) * 0.2, Math.sin(i * 0.9) * 0.16]} rotation={[0.5, i * 0.9, 0.4]} scale={[1, 0.12, 0.7]} castShadow>
            <sphereGeometry args={[0.24, 10, 8]} /><meshStandardMaterial color={i % 2 ? "#6fae7b" : "#8cc592"} roughness={0.7} />
          </mesh>
        ))}
      </group>);
    case "flower":
      return (<group>
        <mesh position={[0, 0.36, 0]} castShadow><cylinderGeometry args={[0.16, 0.2, 0.72, 16]} /><meshStandardMaterial color="#ffffff" roughness={0.5} /></mesh>
        <mesh position={[0, 0.82, 0]} castShadow><cylinderGeometry args={[0.07, 0.1, 0.2, 12]} /><meshPhysicalMaterial color="#e9f3ff" transparent opacity={0.6} roughness={0.1} /></mesh>
        {["#f29bb1", "#ffd0dc", "#fff0b8", "#f2a7b8", "#d9cff2"].map((c, i) => (
          <mesh key={i} position={[Math.cos(i * 1.3) * 0.09, 1.05 + (i % 2) * 0.08, Math.sin(i * 1.3) * 0.09]} scale={[1, 1.3, 1]} castShadow>
            <sphereGeometry args={[0.07, 10, 8]} /><meshStandardMaterial color={c} roughness={0.6} />
          </mesh>
        ))}
      </group>);
    case "sofa":
      return <Sofa color={accent === "#c9a66b" ? "#2a2527" : "#f6bccb"} seats={2} />;
    case "mirror":
      return (<group>
        <mesh position={[0, 0.95, 0]} castShadow><boxGeometry args={[0.8, 1.9, 0.06]} /><meshStandardMaterial color={gold} metalness={0.8} roughness={0.3} /></mesh>
        <mesh position={[0, 0.95, 0.035]}><planeGeometry args={[0.68, 1.76]} /><meshStandardMaterial color="#dfeaf5" metalness={0.95} roughness={0.06} /></mesh>
      </group>);
    case "vanity":
      return <Vanity />;
    case "lamp":
      return (<group>
        <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.18, 0.2, 0.04, 16]} /><meshStandardMaterial color={gold} metalness={0.8} roughness={0.3} /></mesh>
        <mesh position={[0, 0.8, 0]}><cylinderGeometry args={[0.015, 0.015, 1.6, 8]} /><meshStandardMaterial color={gold} metalness={0.8} roughness={0.3} /></mesh>
        <mesh position={[0, 1.65, 0]} castShadow><cylinderGeometry args={[0.16, 0.26, 0.32, 18, 1, true]} /><meshStandardMaterial color="#fff3df" emissive="#ffdca8" emissiveIntensity={0.9} side={THREE.DoubleSide} /></mesh>
        <pointLight position={[0, 1.6, 0]} intensity={2.2} distance={4.5} color="#ffdca8" />
      </group>);
    case "display":
      return (<group>
        <mesh position={[0, 0.4, 0]} castShadow><cylinderGeometry args={[0.5, 0.5, 0.8, 28]} /><meshStandardMaterial color="#fffaf4" roughness={0.5} /></mesh>
        <mesh position={[0, 0.81, 0]}><cylinderGeometry args={[0.53, 0.53, 0.03, 28]} /><meshStandardMaterial color={gold} metalness={0.8} roughness={0.3} /></mesh>
        <mesh position={[0, 0.96, 0]} castShadow><cylinderGeometry args={[0.2, 0.2, 0.26, 20]} /><meshStandardMaterial color="#ffffff" roughness={0.5} /></mesh>
      </group>);
    case "stand":
      return (<group>
        <mesh position={[0, 0.42, 0]} castShadow><boxGeometry args={[0.7, 0.84, 0.5]} /><meshStandardMaterial color="#fffaf4" roughness={0.5} /></mesh>
        <mesh position={[0, 0.85, 0]}><boxGeometry args={[0.74, 0.03, 0.54]} /><meshStandardMaterial color={gold} metalness={0.8} roughness={0.3} /></mesh>
        <DermaHome position={[0, 0.865, 0]} />
      </group>);
    case "rug":
      return (<group>
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[1.2, 40]} /><meshStandardMaterial color="#fbe1e6" roughness={1} /></mesh>
        <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.95, 1.02, 40]} /><meshStandardMaterial color="#ffffff" roughness={1} /></mesh>
      </group>);
    case "logo":
      return (<group>
        <mesh position={[0, 0.85, 0]} castShadow><boxGeometry args={[1.5, 1.7, 0.08]} /><meshStandardMaterial color="#1b1719" roughness={0.5} /></mesh>
        <Label text="MEDIDERMA" sub="LOUNGE" width={1.3} position={[0, 0.95, 0.045]} />
      </group>);
    case "arch":
      return <FlowerArch />;
    case "goldtable":
      return (<group>
        <mesh position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[0.32, 0.32, 0.03, 24]} /><meshStandardMaterial color="#fff6ec" roughness={0.25} /></mesh>
        <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.02, 0.02, 0.5, 8]} /><meshStandardMaterial color={gold} metalness={0.85} roughness={0.25} /></mesh>
        <mesh position={[0, 0.015, 0]}><cylinderGeometry args={[0.2, 0.22, 0.03, 20]} /><meshStandardMaterial color={gold} metalness={0.85} roughness={0.25} /></mesh>
      </group>);
    case "armchair":
      return <Sofa color="#e3d8f6" seats={1} />;
    case "coffeetable":
      return (<group>
        <mesh position={[0, 0.4, 0]} castShadow><cylinderGeometry args={[0.55, 0.55, 0.05, 36]} /><meshStandardMaterial color="#fffdfb" roughness={0.12} /></mesh>
        {[0, 1, 2].map((i) => <mesh key={i} position={[Math.cos(i * 2.094) * 0.32, 0.19, Math.sin(i * 2.094) * 0.32]}><cylinderGeometry args={[0.018, 0.018, 0.38, 8]} /><meshStandardMaterial color={gold} metalness={0.85} roughness={0.25} /></mesh>)}
        <mesh position={[0.12, 0.47, 0.05]} castShadow><boxGeometry args={[0.3, 0.035, 0.22]} /><meshStandardMaterial color="#f29bb1" roughness={0.6} /></mesh>
      </group>);
    case "bookshelf":
      return (<group>
        <mesh position={[0, 0.9, 0]} castShadow><boxGeometry args={[1.1, 1.8, 0.32]} /><meshStandardMaterial color="#fffaf4" roughness={0.6} /></mesh>
        {[0.35, 0.8, 1.25].map((y, r) => (
          <group key={y} position={[0, y, 0.03]}>
            <mesh><boxGeometry args={[1.0, 0.4, 0.28]} /><meshStandardMaterial color="#f3e3d3" roughness={0.9} /></mesh>
            {Array.from({ length: 9 }).map((_, i) => (
              <mesh key={i} position={[-0.42 + i * 0.105, -0.02 + ((i * 3 + r) % 3) * 0.012, 0.1]} castShadow>
                <boxGeometry args={[0.07, 0.3 + ((i + r) % 3) * 0.03, 0.2]} />
                <meshStandardMaterial color={["#f29bb1", "#d9cff2", "#fff3d6", "#c9a66b", "#bfe8d6", "#ffffff"][(i + r * 2) % 6]} roughness={0.7} />
              </mesh>
            ))}
          </group>
        ))}
      </group>);
    case "diffuser":
      return (<group>
        <mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.16, 0.2, 0.6, 20]} /><meshStandardMaterial color="#fffaf4" roughness={0.5} /></mesh>
        <mesh position={[0, 0.68, 0]} castShadow><cylinderGeometry args={[0.07, 0.09, 0.16, 16]} /><meshPhysicalMaterial color="#f6d9c2" transparent opacity={0.7} roughness={0.08} /></mesh>
        {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[Math.cos(i * 1.26) * 0.03, 0.92, Math.sin(i * 1.26) * 0.03]} rotation={[Math.cos(i * 1.26) * 0.25, 0, Math.sin(i * 1.26) * 0.25]}><cylinderGeometry args={[0.005, 0.005, 0.5, 5]} /><meshStandardMaterial color="#8a6a4a" roughness={0.9} /></mesh>)}
      </group>);
    case "petbed":
      return (<group>
        <mesh position={[0, 0.09, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[0.36, 0.1, 12, 32]} /><meshStandardMaterial color="#f6bccb" roughness={0.95} /></mesh>
        <mesh position={[0, 0.07, 0]} scale={[1, 0.25, 1]}><sphereGeometry args={[0.36, 20, 12]} /><meshStandardMaterial color="#fff6ee" roughness={1} /></mesh>
      </group>);
    case "cattower":
      return (<group>
        <mesh position={[0, 0.04, 0]} castShadow><boxGeometry args={[0.8, 0.08, 0.8]} /><meshStandardMaterial color="#f3e6d0" roughness={0.95} /></mesh>
        {[[-0.2, 0.7], [0.2, 1.25]].map(([x, h]) => <mesh key={x} position={[x, h / 2, 0]} castShadow><cylinderGeometry args={[0.07, 0.07, h, 14]} /><meshStandardMaterial color="#d8c3a0" roughness={1} /></mesh>)}
        <mesh position={[-0.2, 0.74, 0]} castShadow><cylinderGeometry args={[0.3, 0.3, 0.07, 24]} /><meshStandardMaterial color="#f6bccb" roughness={0.95} /></mesh>
        <mesh position={[0.2, 1.29, 0]} castShadow><cylinderGeometry args={[0.28, 0.28, 0.07, 24]} /><meshStandardMaterial color="#e3d8f6" roughness={0.95} /></mesh>
        <mesh position={[0.2, 1.05, 0.3]}><sphereGeometry args={[0.05, 10, 8]} /><meshStandardMaterial color="#f29bb1" /></mesh>
        <mesh position={[0.2, 1.17, 0.3]}><cylinderGeometry args={[0.003, 0.003, 0.2, 4]} /><meshStandardMaterial color="#8a6a4a" /></mesh>
      </group>);
    case "partition":
      return (<group>
        {[-1, 0, 1].map((i) => (
          <group key={i} position={[i * 0.62, 0, Math.abs(i) * 0.12]} rotation={[0, -i * 0.35, 0]}>
            <mesh position={[0, 0.9, 0]} castShadow><boxGeometry args={[0.6, 1.8, 0.04]} /><meshStandardMaterial color="#e9d3ae" roughness={0.9} /></mesh>
            <mesh position={[0, 0.9, 0.022]}><planeGeometry args={[0.5, 1.6]} /><meshStandardMaterial color="#f6e7c8" roughness={1} /></mesh>
          </group>
        ))}
      </group>);
    case "aquarium":
      return (<group>
        <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[1.2, 0.8, 0.5]} /><meshStandardMaterial color="#1b1719" roughness={0.4} /></mesh>
        <mesh position={[0, 1.1, 0]}><boxGeometry args={[1.16, 0.6, 0.46]} /><meshPhysicalMaterial color="#7fd3ee" transparent opacity={0.42} roughness={0.03} emissive="#3aa7d0" emissiveIntensity={0.35} /></mesh>
        {["#ff9a5c", "#f29bb1", "#ffd95c", "#ff9a5c"].map((c, i) => <mesh key={i} position={[-0.4 + i * 0.26, 0.98 + (i % 2) * 0.18, (i % 2 ? 0.08 : -0.08)]} scale={[1.6, 1, 0.5]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.3} /></mesh>)}
        <mesh position={[0, 1.42, 0]}><boxGeometry args={[1.2, 0.05, 0.5]} /><meshStandardMaterial color="#1b1719" roughness={0.4} /></mesh>
        <pointLight position={[0, 1.1, 0.4]} intensity={1.5} distance={3} color="#8fdcf5" />
      </group>);
    default:
      return <mesh position={[0, 0.25, 0]}><boxGeometry args={[0.5, 0.5, 0.5]} /><meshStandardMaterial color={accent} /></mesh>;
  }
}

export function Sofa({ color = "#f6bccb", seats = 3 }: { color?: string; seats?: number }) {
  const w = seats * 0.8 + 0.3;
  return (
    <group>
      <mesh position={[0, 0.26, 0]} castShadow receiveShadow><boxGeometry args={[w, 0.36, 0.8]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>
      <mesh position={[0, 0.62, 0.34]} castShadow><boxGeometry args={[w, 0.6, 0.18]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 0.08), 0.5, 0]} castShadow><boxGeometry args={[0.16, 0.36, 0.8]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>
      ))}
      {[-1, 1].flatMap((x) => [-1, 1].map((z) => (
        <mesh key={`${x}${z}`} position={[x * (w / 2 - 0.12), 0.04, z * 0.3]}><cylinderGeometry args={[0.03, 0.02, 0.08, 8]} /><meshStandardMaterial color={gold} metalness={0.8} roughness={0.3} /></mesh>
      )))}
    </group>
  );
}

export function Vanity() {
  return (
    <group>
      <mesh position={[0, 0.72, 0]} castShadow><boxGeometry args={[1.3, 0.06, 0.5]} /><meshStandardMaterial color="#fffaf4" roughness={0.4} /></mesh>
      <mesh position={[0, 0.58, 0]}><boxGeometry args={[1.2, 0.2, 0.44]} /><meshStandardMaterial color="#fbe1e6" roughness={0.6} /></mesh>
      {[-0.58, 0.58].map((x) => (
        <mesh key={x} position={[x, 0.36, 0]}><cylinderGeometry args={[0.025, 0.02, 0.72, 8]} /><meshStandardMaterial color={gold} metalness={0.8} roughness={0.3} /></mesh>
      ))}
      <mesh position={[0, 1.25, -0.2]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.42, 0.42, 0.04, 36]} /><meshStandardMaterial color={gold} metalness={0.8} roughness={0.3} /></mesh>
      <mesh position={[0, 1.25, -0.176]}><circleGeometry args={[0.37, 36]} /><meshStandardMaterial color="#e3eef8" metalness={0.95} roughness={0.05} /></mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[Math.cos((i / 8) * Math.PI * 2) * 0.47, 1.25 + Math.sin((i / 8) * Math.PI * 2) * 0.47, -0.17]}>
          <sphereGeometry args={[0.03, 8, 8]} /><meshStandardMaterial color="#fff6dc" emissive="#ffe6b0" emissiveIntensity={1.6} />
        </mesh>
      ))}
    </group>
  );
}

export function FlowerArch() {
  const cols = ["#f29bb1", "#ffd0dc", "#ffffff", "#d9cff2", "#fbe1a8"];
  return (
    <group>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[1.25, 36]} /><meshStandardMaterial color="#fff6ec" roughness={0.9} /></mesh>
      <mesh position={[0, 1.25, -0.5]}><planeGeometry args={[2.3, 2.5]} /><meshStandardMaterial color="#fbe1e6" roughness={1} side={THREE.DoubleSide} /></mesh>
      {Array.from({ length: 26 }).map((_, i) => {
        const a = (i / 25) * Math.PI;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.12, 0.35 + Math.sin(a) * 1.9, -0.42 + ((i * 7) % 5) * 0.03]} castShadow>
            <sphereGeometry args={[0.13 + ((i * 3) % 4) * 0.02, 10, 8]} /><meshStandardMaterial color={cols[i % cols.length]} roughness={0.7} />
          </mesh>
        );
      })}
      <Label text="MEDIDERMA" width={1.3} position={[0, 1.55, -0.48]} color="#c9a66b" />
    </group>
  );
}
