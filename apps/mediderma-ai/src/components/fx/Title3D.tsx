"use client";
/**
 * 히어로 3D 타이틀 — 실제 압출(extrude)·베벨 지오메트리 텍스트.
 * 금속 재질 + 절차적 환경광(네트워크 요청 없음) + 줄별 등장 모션 + 포인터 추종 틸트 + 빛 스윕.
 * 접근성·SEO 용 실제 <h1> 은 호출부에서 sr-only 로 유지한다.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Text3D } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const BOLD = "/fonts/helvetiker_bold.typeface.json";
const REGULAR = "/fonts/helvetiker_regular.typeface.json";

function Lines({ line1, line2, onReady }: { line1: string; line2: string; onReady: () => void }) {
  const root = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const l1 = useRef<THREE.Group>(null);
  const l2 = useRef<THREE.Group>(null);
  const sweep = useRef<THREE.PointLight>(null);
  const { viewport, pointer } = useThree();
  const [box, setBox] = useState<{ w: number; h: number; cx: number; cy: number } | null>(null);
  const t0 = useRef<number | null>(null);

  const mats = useMemo(() => {
    const face = new THREE.MeshStandardMaterial({ color: "#f4f7fa", metalness: 0.92, roughness: 0.2, envMapIntensity: 1.35 });
    const side = new THREE.MeshStandardMaterial({ color: "#3a4a5c", metalness: 1, roughness: 0.32, envMapIntensity: 1.1 });
    const accentFace = new THREE.MeshStandardMaterial({ color: "#e9f5ff", metalness: 0.92, roughness: 0.16, envMapIntensity: 1.5 });
    const accentSide = new THREE.MeshStandardMaterial({ color: "#0d6fd6", metalness: 0.6, roughness: 0.3, emissive: "#1b8cff", emissiveIntensity: 1.25 });
    return { plain: [face, side], accent: [accentFace, accentSide] };
  }, []);
  useEffect(() => () => [...mats.plain, ...mats.accent].forEach((m) => m.dispose()), [mats]);

  // 글자 지오메트리가 준비되면 실제 크기를 재서 캔버스 폭에 맞춘다
  const measured = useRef(false);
  useFrame(() => {
    if (measured.current || !inner.current || !l1.current || !l2.current) return;
    l1.current.scale.setScalar(1);
    l2.current.scale.setScalar(1);
    const b = new THREE.Box3().setFromObject(inner.current);
    if (!Number.isFinite(b.min.x) || b.max.x - b.min.x < 0.5) return;
    measured.current = true;
    setBox({ w: b.max.x - b.min.x, h: b.max.y - b.min.y, cx: (b.max.x + b.min.x) / 2, cy: (b.max.y + b.min.y) / 2 });
    onReady();
  });

  useLayoutEffect(() => {
    if (!box || !inner.current) return;
    const s = Math.min((viewport.width * 0.9) / box.w, (viewport.height * 0.8) / box.h);
    inner.current.scale.setScalar(s);
    // 왼쪽 정렬
    inner.current.position.set(-viewport.width / 2 + viewport.width * 0.04 - (box.cx - box.w / 2) * s, -box.cy * s, 0);
  }, [box, viewport.width, viewport.height]);

  useFrame(({ clock }, dt) => {
    if (!box || !root.current || !l1.current || !l2.current) return;
    if (t0.current === null) t0.current = clock.elapsedTime;
    const t = clock.elapsedTime - t0.current;
    const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 4);
    // 줄별 등장: 아래에서 회전하며 올라온다
    [l1.current, l2.current].forEach((g, i) => {
      const k = ease((t - i * 0.22) / 1.1);
      g.rotation.x = (1 - k) * -1.35;
      g.position.z = (1 - k) * -2.4;
      g.scale.setScalar(0.6 + 0.4 * k);
      g.visible = k > 0.001;
    });
    // 포인터 추종 틸트 + 미세한 부유
    const tx = pointer.y * -0.16 + Math.sin(t * 0.7) * 0.02;
    const ty = pointer.x * 0.18 + Math.sin(t * 0.5) * 0.035;
    root.current.rotation.x += (tx - root.current.rotation.x) * Math.min(1, dt * 4);
    root.current.rotation.y += (ty - root.current.rotation.y) * Math.min(1, dt * 4);
    if (sweep.current) sweep.current.position.x = Math.sin(t * 0.6) * viewport.width * 0.7;
  });

  const common = { curveSegments: 10, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.022, bevelSegments: 5 } as const;
  return (
    <group ref={root}>
      <pointLight ref={sweep} position={[0, 0.6, 2.2]} intensity={14} color="#7fd2ff" distance={9} />
      <group ref={inner} visible={!!box}>
        <group ref={l1} position={[0, 0.62, 0]}>
          <Text3D font={REGULAR} size={1} height={0.16} letterSpacing={0.03} material={mats.plain} {...common}>
            {line1}
          </Text3D>
        </group>
        <group ref={l2} position={[0, -0.62, 0]}>
          <Text3D font={BOLD} size={1.04} height={0.3} letterSpacing={0.02} material={mats.accent} {...common}>
            {line2}
          </Text3D>
        </group>
      </group>
    </group>
  );
}

export default function Title3D({ line1, line2, onReady }: { line1: string; line2: string; onReady: () => void }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 9], fov: 22 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} aria-hidden>
      <ambientLight intensity={0.25} />
      <directionalLight position={[-3, 4, 5]} intensity={2.2} />
      <Lines line1={line1} line2={line2} onReady={onReady} />
      {/* 절차적 스튜디오 환경광: 외부 HDR 다운로드 없이 금속 반사를 만든다 */}
      <Environment resolution={256}>
        <color attach="background" args={["#05070a"]} />
        {/* 정면 대형 소프트박스: 글자 앞면이 반사할 밝은 면 */}
        <Lightformer form="rect" intensity={1.25} position={[0, 0.5, 9]} scale={[26, 9, 1]} color="#cfd8e2" />
        <Lightformer form="rect" intensity={4} position={[0, 3.2, 8]} scale={[18, 1.6, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={5} position={[0, 4, 3]} scale={[10, 2.4, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={3.2} position={[-6, 0.5, 2]} rotation={[0, Math.PI / 2.4, 0]} scale={[6, 1.2, 1]} color="#8fd0ff" />
        <Lightformer form="rect" intensity={2.6} position={[6, -1, 2]} rotation={[0, -Math.PI / 2.4, 0]} scale={[6, 1, 1]} color="#dfe7ee" />
        <Lightformer form="ring" intensity={2.5} position={[0, -3.5, 4]} scale={3} color="#4fb6ff" />
        <Lightformer form="rect" intensity={1.4} position={[0, 0, -6]} scale={[14, 5, 1]} color="#22303f" />
      </Environment>
    </Canvas>
  );
}
