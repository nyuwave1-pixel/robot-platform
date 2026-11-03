"use client";
import { useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { pdrnGenerations } from "@/data/ingredients";

function Scene({ progressRef }: { progressRef: RefObject<number> }) {
  const refs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];
  useFrame(({ clock }) => {
    const p = progressRef.current ?? 0;
    const t = clock.getElapsedTime();
    // 0~0.3: 1세대 중앙, 0.3~0.6: 2세대, 0.6~1: 3세대 확대
    const focus = p < 0.33 ? 0 : p < 0.63 ? 1 : 2;
    refs.forEach((r, i) => {
      const m = r.current; if (!m) return;
      const base = (i - 1) * 2.3;
      const targetX = i === focus ? 0 : base + (i - focus) * 0.25;
      const targetS = i === focus ? (i === 2 ? 1.55 + (p - 0.63) * 0.8 : 1.15) : 0.72;
      const targetZ = i === focus ? 0.6 : -0.8;
      m.position.x += (targetX - m.position.x) * 0.08;
      m.position.z += (targetZ - m.position.z) * 0.08;
      const s = m.scale.x + (targetS - m.scale.x) * 0.08; m.scale.setScalar(s);
      m.position.y = Math.sin(t * 0.8 + i) * 0.06;
      m.rotation.y = t * 0.15 + i;
      const mat = m.material as THREE.MeshPhysicalMaterial;
      const targetOpacity = i === focus ? 1 : 0.55;
      mat.opacity += (targetOpacity - mat.opacity) * 0.08;
    });
  });
  const mats = [
    { color: pdrnGenerations[0].color, roughness: 0.75, metalness: 0.05, transmission: 0, clearcoat: 0.1 },
    { color: pdrnGenerations[1].color, roughness: 0.35, metalness: 0.0, transmission: 0.35, thickness: 0.8, clearcoat: 0.5 },
    { color: pdrnGenerations[2].color, roughness: 0.18, metalness: 0.85, transmission: 0.15, thickness: 1, clearcoat: 1, clearcoatRoughness: 0.15, emissive: "#5a3f20", emissiveIntensity: 0.25 },
  ];
  return (
    <>
      {refs.map((r, i) => (
        <mesh key={i} ref={r} position={[(i - 1) * 2.3, 0, 0]}>
          <sphereGeometry args={[0.62, 64, 64]} />
          <meshPhysicalMaterial {...mats[i]} transparent opacity={0.8} envMapIntensity={1.6} />
        </mesh>
      ))}
    </>
  );
}

export default function PdrnSpheres({ progressRef, className }: { progressRef: RefObject<number>; className?: string }) {
  return (
    <div className={className} aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 5.2], fov: 35 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 5]} intensity={2} color="#FFF1C9" />
        <directionalLight position={[-4, -1, 2]} intensity={0.8} color="#C6A16A" />
        <Environment resolution={128} frames={1}>
          <Lightformer intensity={2} color="#FFF1C9" position={[0, 4, -6]} scale={[10, 4, 1]} />
          <Lightformer intensity={1} color="#E5C58D" position={[-5, 0, 2]} rotation={[0, Math.PI / 2, 0]} scale={[6, 3, 1]} />
          <Lightformer intensity={1.4} color="#FFFFFF" position={[5, 2, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 2, 1]} />
        </Environment>
        <Scene progressRef={progressRef} />
      </Canvas>
    </div>
  );
}
