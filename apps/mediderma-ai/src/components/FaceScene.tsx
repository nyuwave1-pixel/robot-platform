"use client";
/** 랜딩 히어로: canonical 얼굴 메시(샘플 지오메트리, 사용자 데이터 아님) + 스캔 라인 + 파티클 */
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CANONICAL, TRIANGLES } from "@/lib/analysis/zones";

const vertex = /* glsl */ `
  uniform float uScan; uniform float uSize;
  varying float vGlow;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vGlow = smoothstep(1.6, 0.0, abs(position.y - uScan));
    gl_PointSize = uSize * (1.0 + vGlow * 2.2) * (30.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const fragment = /* glsl */ `
  varying float vGlow;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    vec3 base = vec3(0.72, 0.78, 0.84);
    vec3 glow = vec3(0.31, 0.71, 1.0);
    gl_FragColor = vec4(mix(base, glow, vGlow), (0.55 + vGlow * 0.45) * smoothstep(0.5, 0.1, d));
  }`;

function Face() {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const plane = useRef<THREE.Mesh>(null);
  const { points, lines } = useMemo(() => {
    const pos = new Float32Array(CANONICAL);
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const seen = new Set<string>();
    const seg: number[] = [];
    for (let i = 0; i < TRIANGLES.length; i += 3) {
      for (const [a, b] of [[0, 1], [1, 2], [2, 0]] as const) {
        const p = TRIANGLES[i + a];
        const q = TRIANGLES[i + b];
        const k = p < q ? `${p}-${q}` : `${q}-${p}`;
        if (seen.has(k)) continue;
        seen.add(k);
        seg.push(pos[3 * p], pos[3 * p + 1], pos[3 * p + 2], pos[3 * q], pos[3 * q + 1], pos[3 * q + 2]);
      }
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(seg), 3));
    return { points: pg, lines: lg };
  }, []);
  const uniforms = useMemo(() => ({ uScan: { value: 0 }, uSize: { value: 2.4 } }), []);
  useFrame(({ clock }) => {
    const tt = clock.getElapsedTime();
    const y = Math.sin(tt * 0.9) * 9.5 - 1;
    if (mat.current) mat.current.uniforms.uScan.value = y;
    if (plane.current) plane.current.position.y = y;
    if (group.current) {
      group.current.rotation.y = Math.sin(tt * 0.35) * 0.45;
      group.current.rotation.x = Math.sin(tt * 0.22) * 0.06;
    }
  });
  return (
    <group ref={group} position={[0, 0.5, 0]}>
      <lineSegments geometry={lines}>
        <lineBasicMaterial color="#8fa3b8" transparent opacity={0.16} />
      </lineSegments>
      <points geometry={points}>
        <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent depthWrite={false} />
      </points>
      <mesh ref={plane} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[19, 12]} />
        <meshBasicMaterial color="#4fb6ff" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Particles() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const n = 260;
    const p = new Float32Array(n * 3);
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      p[3 * i] = (rnd() - 0.5) * 46;
      p[3 * i + 1] = (rnd() - 0.5) * 34;
      p[3 * i + 2] = (rnd() - 0.5) * 20 - 6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.015;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#7fe0ff" size={0.09} transparent opacity={0.5} depthWrite={false} />
    </points>
  );
}

export default function FaceScene() {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 30], fov: 40 }} gl={{ antialias: true, alpha: true, powerPreference: "low-power" }} aria-hidden>
      <Face />
      <Particles />
    </Canvas>
  );
}
