"use client";
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Field({ count, drift }: { count: number; drift: number }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      seeds[i] = Math.random() * Math.PI * 2;
    }
    return { positions, seeds };
  }, [count]);
  const tex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, "rgba(255,241,201,1)"); r.addColorStop(0.35, "rgba(229,197,141,0.8)"); r.addColorStop(1, "rgba(229,197,141,0)");
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  }, []);
  useFrame(({ clock, pointer }) => {
    const p = ref.current; if (!p) return;
    const t = clock.getElapsedTime();
    const arr = p.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      arr[i * 3 + 1] += Math.sin(t * 0.4 + s) * 0.0015 + drift * 0.002;
      arr[i * 3] += Math.cos(t * 0.3 + s) * 0.001;
      if (arr[i * 3 + 1] > 5) arr[i * 3 + 1] = -5;
    }
    p.geometry.attributes.position.needsUpdate = true;
    p.rotation.y = pointer.x * 0.08;
    p.rotation.x = -pointer.y * 0.05;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial map={tex} size={0.09} sizeAttenuation transparent depthWrite={false} blending={THREE.AdditiveBlending} color="#E5C58D" opacity={0.85} />
    </points>
  );
}

export default function GoldParticles({ count = 600, drift = 1, className }: { count?: number; drift?: number; className?: string }) {
  return (
    <div className={className} aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 8], fov: 45 }} gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}>
        <Field count={count} drift={drift} />
      </Canvas>
    </div>
  );
}
