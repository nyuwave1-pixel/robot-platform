"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { product } from "@/data/product";

/**
 * 1ST BIRTHDAY CREAM 용기 — 프로시저럴 모델.
 * 비율(캡 지름 = 1): 캡 높이 0.42, 바디 지름 0.98, 바디 높이 0.55, 밴드 0.02. 인쇄는 캔버스 디칼(원본 표기 그대로).
 */
function labelTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = 2048; c.height = 512;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = "#D9B977";
  g.textAlign = "center";
  const cx = c.width * 0.5;
  g.font = "500 54px 'Pretendard Variable', Inter, Arial, sans-serif";
  g.letterSpacing = "6px";
  g.fillText(product.print.jar[0], cx, 190);
  g.font = "400 34px 'Pretendard Variable', Inter, Arial, sans-serif";
  g.letterSpacing = "5px";
  g.fillText(product.print.jar[1], cx, 245);
  g.font = "500 40px 'Pretendard Variable', Inter, Arial, sans-serif";
  g.letterSpacing = "4px";
  g.fillText(product.print.jar[2], cx, 390);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(1, 1);
  t.offset.set(0, 0);
  t.anisotropy = 8;
  return t;
}

function Jar({ rot, zoom, lidOpen }: { rot: React.MutableRefObject<{ x: number; y: number; vx: number; vy: number }>; zoom: React.MutableRefObject<number>; lidOpen: boolean }) {
  const group = useRef<THREE.Group>(null);
  const cap = useRef<THREE.Group>(null);
  const label = useMemo(() => labelTexture(), []);
  const { camera } = useThree();
  useFrame((_, dt) => {
    const g = group.current; if (!g) return;
    const r = rot.current;
    // 관성
    r.y += r.vy; r.x += r.vx; r.vx *= 0.92; r.vy *= 0.92;
    r.x = Math.max(-0.9, Math.min(0.6, r.x));
    g.rotation.y += (r.y - g.rotation.y) * 0.18;
    g.rotation.x += (r.x - g.rotation.x) * 0.18;
    g.position.y = Math.sin(performance.now() * 0.0007) * 0.03;
    const targetZ = 4.3 / zoom.current;
    camera.position.z += (targetZ - camera.position.z) * 0.1;
    if (cap.current) {
      const ty = lidOpen ? 0.46 : 0; const trx = lidOpen ? -0.28 : 0;
      cap.current.position.y += (ty - cap.current.position.y) * Math.min(1, dt * 6);
      cap.current.rotation.x += (trx - cap.current.rotation.x) * Math.min(1, dt * 6);
    }
  });
  const gold = { color: "#D9B977", metalness: 1, roughness: 0.26, envMapIntensity: 1.6 } as const;
  return (
    <group ref={group} rotation={[0.08, -0.4, 0]}>
      {/* 캡 */}
      <group ref={cap} position={[0, 0, 0]}>
        <mesh position={[0, 0.49, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.42, 96, 1, false]} />
          <meshPhysicalMaterial {...gold} clearcoat={0.4} clearcoatRoughness={0.3} />
        </mesh>
        {/* 캡 상판 동심원 하이라이트 */}
        <mesh position={[0, 0.701, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.02, 0.5, 96]} />
          <meshPhysicalMaterial color="#E9D2A0" metalness={1} roughness={0.18} envMapIntensity={2.2} side={THREE.DoubleSide} />
        </mesh>
        {/* 캡 내부 골드 링 (뚜껑 열렸을 때 보임) */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.48, 0.48, 0.04, 64]} />
          <meshPhysicalMaterial color="#C9A868" metalness={1} roughness={0.35} />
        </mesh>
      </group>
      {/* 밴드 */}
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.495, 0.495, 0.02, 96]} />
        <meshPhysicalMaterial {...gold} />
      </mesh>
      {/* 내부 크림 */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.44, 0.44, 0.12, 64]} />
        <meshStandardMaterial color="#F4EFE7" roughness={0.9} />
      </mesh>
      {/* 바디 (반투명 다크 브라운) */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.49, 0.47, 0.55, 96]} />
        <meshPhysicalMaterial color="#2A211E" roughness={0.25} metalness={0.05} transmission={0.28} thickness={1.2} ior={1.45} attenuationColor="#3A2520" attenuationDistance={0.9} clearcoat={0.6} clearcoatRoughness={0.25} />
      </mesh>
      {/* 라벨 디칼 — 텍스처 u=0.5(라벨 중심)가 +z(카메라 정면)를 향하도록 π 회전 */}
      <mesh position={[0, 0.02, 0]} rotation={[0, Math.PI, 0]}>
        <cylinderGeometry args={[0.496, 0.476, 0.5, 96, 1, true]} />
        <meshPhysicalMaterial map={label} transparent metalness={0.9} roughness={0.35} envMapIntensity={1.2} depthWrite={false} />
      </mesh>
      {/* 바닥 */}
      <mesh position={[0, -0.28, 0]}>
        <cylinderGeometry args={[0.47, 0.44, 0.03, 96]} />
        <meshPhysicalMaterial color="#1E1714" roughness={0.4} />
      </mesh>
    </group>
  );
}

export default function ProductInspector({ className, hint, openLabel, resetLabel }: { className?: string; hint: string; openLabel: string; resetLabel: string }) {
  const rot = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const zoom = useRef(1);
  const [lidOpen, setLidOpen] = useState(false);
  const [zoomUi, setZoomUi] = useState(1);
  const drag = useRef<{ x: number; y: number; active: boolean; moved: boolean; pinch?: number }>({ x: 0, y: 0, active: false, moved: false });
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const down = (e: PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY, active: true, moved: false }; el.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      const d = drag.current; if (!d.active) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      // 세로 우세 드래그(모바일)는 스크롤로 양보
      if (!d.moved && Math.abs(dy) > Math.abs(dx) * 1.5 && e.pointerType === "touch") { d.active = false; return; }
      d.moved = true;
      rot.current.vy = dx * 0.004; rot.current.vx = dy * 0.0025;
      d.x = e.clientX; d.y = e.clientY;
    };
    const up = () => { drag.current.active = false; };
    const dbl = () => { rot.current = { x: 0, y: 0, vx: 0, vy: 0 }; zoom.current = 1; setZoomUi(1); };
    const touch = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (drag.current.pinch) { zoom.current = Math.max(1, Math.min(2.5, zoom.current * (dist / drag.current.pinch))); setZoomUi(zoom.current); }
        drag.current.pinch = dist;
        e.preventDefault();
      }
    };
    const touchEnd = () => { drag.current.pinch = undefined; };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    el.addEventListener("dblclick", dbl); el.addEventListener("touchmove", touch, { passive: false }); el.addEventListener("touchend", touchEnd);
    return () => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); el.removeEventListener("dblclick", dbl); el.removeEventListener("touchmove", touch); el.removeEventListener("touchend", touchEnd); };
  }, []);

  const setZoom = (z: number) => { zoom.current = Math.max(1, Math.min(2.5, z)); setZoomUi(zoom.current); };

  return (
    <div ref={wrap} className={className} style={{ position: "absolute", inset: 0, touchAction: "pan-y", cursor: "grab" }} aria-label="제품 3D 인스펙터: 드래그로 회전, 더블클릭으로 초기화">
      <Canvas dpr={[1, 2]} shadows camera={{ position: [0, 0.35, 4.3], fov: 32 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
        <ambientLight intensity={0.25} />
        <directionalLight position={[3, 5, 4]} intensity={2.2} color="#FFF1C9" castShadow />
        <directionalLight position={[-4, 2, -3]} intensity={1.1} color="#C6A16A" />
        <spotLight position={[0, 6, 2]} angle={0.5} penumbra={0.8} intensity={6} color="#FFE7B8" />
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={2.5} color="#FFF1C9" position={[0, 5, -9]} scale={[12, 6, 1]} />
          <Lightformer intensity={1.2} color="#E5C58D" position={[-6, 2, 2]} rotation={[0, Math.PI / 2, 0]} scale={[8, 3, 1]} />
          <Lightformer intensity={1.6} color="#FFFFFF" position={[6, 3, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 2, 1]} />
          <Lightformer intensity={0.6} color="#8F6B3A" position={[0, -4, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 10, 1]} />
        </Environment>
        <Jar rot={rot} zoom={zoom} lidOpen={lidOpen} />
        <ContactShadows position={[0, -0.33, 0]} opacity={0.65} scale={4} blur={2.4} far={1.2} color="#000" />
      </Canvas>
      <div className="inspector-hint">
        <span className="caption" style={{ color: "var(--gold)" }}>{hint}</span>
      </div>
      <div className="inspector-ctl">
        <button className="btn btn-ghost" onClick={() => setLidOpen((v) => !v)} style={{ padding: "0 16px", minHeight: 40 }}>{lidOpen ? "CLOSE LID" : openLabel}</button>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-ghost" aria-label="축소" onClick={() => setZoom(zoomUi - 0.25)} style={{ padding: 0, width: 40, minHeight: 40 }}>−</button>
          <button className="btn btn-ghost" aria-label="확대" onClick={() => setZoom(zoomUi + 0.25)} style={{ padding: 0, width: 40, minHeight: 40 }}>+</button>
          <button className="btn btn-ghost" onClick={() => { rot.current = { x: 0, y: 0, vx: 0, vy: 0 }; setZoom(1); setLidOpen(false); }} style={{ padding: "0 14px", minHeight: 40 }}>{resetLabel}</button>
        </div>
      </div>
    </div>
  );
}
