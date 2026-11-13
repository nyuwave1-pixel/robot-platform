"use client";
/**
 * 랜딩 히어로 3D — 홀로그램 얼굴(canonical 샘플 지오메트리, 사용자 데이터 아님).
 * 표면 메시는 Blender 로 서브디비전·스무딩한 GLB(public/3d/face.glb, scripts/blender/build_face.py)를 쓰고,
 * GLB 의 두 번째 UV 채널에 담긴 영역 ID 로 영역을 차례로 점등한다.
 * 프레넬 림 라이트 셰이더 + 스캔 밴드 + 랜드마크 포인트 + 궤도 링 + 영역 콜아웃 + 블룸 후처리.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { CANONICAL, FACE_ZONES, TRIANGLES } from "@/lib/analysis/zones";

const skinVert = /* glsl */ `
  attribute vec2 uv1;
  varying vec3 vN; varying vec3 vV; varying vec3 vP; varying float vZone;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vP = position; vZone = uv1.x * 16.0;
    gl_Position = projectionMatrix * mv;
  }`;
const skinFrag = /* glsl */ `
  uniform float uScan; uniform float uTime; uniform float uActive; uniform float uPulse;
  varying vec3 vN; varying vec3 vV; varying vec3 vP; varying float vZone;
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.4);
    float inZone = step(0.5, vZone);
    float act = (1.0 - step(0.5, abs(vZone - uActive))) * inZone;
    float band = smoothstep(1.1, 0.0, abs(vP.y - uScan));
    float lines = smoothstep(0.92, 1.0, sin(vP.y * 9.0 - uTime * 1.6) * 0.5 + 0.5) * 0.12;
    vec3 base = vec3(0.016, 0.028, 0.045);
    vec3 rim = mix(vec3(0.12, 0.45, 0.95), vec3(0.75, 0.93, 1.0), fres);
    vec3 col = base + rim * fres * 1.25 + vec3(0.25, 0.7, 1.0) * band * (0.35 + fres) + vec3(0.2, 0.6, 1.0) * lines * (0.3 + fres);
    col += vec3(0.05, 0.16, 0.3) * inZone * 0.08;
    col += vec3(0.2, 0.62, 1.0) * act * (0.2 + 0.32 * uPulse);
    gl_FragColor = vec4(col, 1.0);
  }`;
const ptVert = /* glsl */ `
  uniform float uScan; uniform float uSize;
  varying float vGlow;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vGlow = smoothstep(1.4, 0.0, abs(position.y - uScan));
    gl_PointSize = uSize * (1.0 + vGlow * 2.6) * (30.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const ptFrag = /* glsl */ `
  varying float vGlow;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    vec3 c = mix(vec3(0.55, 0.66, 0.78), vec3(0.45, 0.85, 1.0), vGlow);
    gl_FragColor = vec4(c * (0.7 + vGlow * 1.6), (0.5 + vGlow * 0.5) * smoothstep(0.5, 0.05, d));
  }`;

/** 순서대로 점등하는 영역 (id = FACE_ZONES 인덱스 + 1, GLB 의 영역 ID 와 같다) */
const TOUR: { zone: string; side: 1 | -1; id: number }[] = [
  { zone: "forehead", side: 1, id: 1 },
  { zone: "right_cheek", side: -1, id: 8 },
  { zone: "left_under_eye", side: 1, id: 5 },
  { zone: "right_jawline", side: -1, id: 12 },
];

const centroid = (id: string): [number, number, number] => {
  const poly = FACE_ZONES.find((z) => z.id === id)!.polygon;
  let x = 0, y = 0, z = 0;
  for (const i of poly) { x += CANONICAL[3 * i]; y += CANONICAL[3 * i + 1]; z += CANONICAL[3 * i + 2]; }
  return [x / poly.length, y / poly.length, z / poly.length + 0.4];
};

function Callout({ zone, label, side, on }: { zone: string; label: string; side: 1 | -1; on: boolean }) {
  const p = useMemo(() => centroid(zone), [zone]);
  const dot = useRef<THREE.Mesh>(null);
  // 라벨은 캔버스 텍스처 스프라이트로 그린다 (DOM 오버레이 없이 씬 안에서 함께 움직이고 블룸도 받는다)
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d")!;
    const font = '600 30px -apple-system, "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif';
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(label).width) + 56;
    c.width = w;
    c.height = 64;
    ctx.font = font;
    ctx.fillStyle = "rgba(4,10,18,0.78)";
    ctx.strokeStyle = "rgba(127,224,255,0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(2, 2, w - 4, 60, 30);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#8fdcff";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 28, 34);
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    return { texture, aspect: w / 64 };
  }, [label]);
  useFrame(({ clock }) => {
    if (dot.current) dot.current.scale.setScalar((on ? 1.7 : 1) + Math.sin(clock.elapsedTime * 3 + p[1]) * 0.35);
  });
  const end: [number, number, number] = [p[0] + side * 4.2, p[1] + 1.1, p[2] + 1.5];
  const line = useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...p), new THREE.Vector3(...end)]), [p, end[0], end[1], end[2]]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <group>
      <mesh ref={dot} position={p}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshBasicMaterial color="#9fe6ff" toneMapped={false} />
      </mesh>
      {/* @ts-expect-error three line element */}
      <line geometry={line}>
        <lineBasicMaterial color="#7fe0ff" transparent opacity={on ? 0.95 : 0.35} />
      </line>
      <sprite position={end} scale={[tex.aspect * 1.15, 1.15, 1]}>
        <spriteMaterial map={tex.texture} transparent depthWrite={false} opacity={on ? 1 : 0.5} toneMapped={!on} />
      </sprite>
    </group>
  );
}

function Face({ labels }: { labels: string[] }) {
  const group = useRef<THREE.Group>(null);
  const skin = useRef<THREE.ShaderMaterial>(null);
  const pts = useRef<THREE.ShaderMaterial>(null);
  const plane = useRef<THREE.Mesh>(null);
  const rings = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  // Blender 에서 만든 고해상도 표면 (Draco 미사용 → 외부 디코더 요청 없음)
  const gltf = useGLTF("/3d/face.glb", false);
  const mesh = useMemo(() => {
    let g: THREE.BufferGeometry | null = null;
    gltf.scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && !g) g = (o as THREE.Mesh).geometry;
    });
    return g as unknown as THREE.BufferGeometry;
  }, [gltf]);
  const { points, lines } = useMemo(() => {
    const pos = new Float32Array(CANONICAL);
    // 랜드마크 포인트·와이어는 원본 468점 토폴로지를 유지하고, 매끈한 표면 위로 살짝 띄운다
    for (let i = 2; i < pos.length; i += 3) pos[i] += 0.06;
    const lowpoly = new THREE.BufferGeometry();
    lowpoly.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    lowpoly.setIndex(TRIANGLES);
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { points: pg, lines: new THREE.WireframeGeometry(lowpoly) };
  }, []);
  const uSkin = useMemo(() => ({ uScan: { value: 0 }, uTime: { value: 0 }, uActive: { value: 1 }, uPulse: { value: 0 } }), []);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setActive((a) => (a + 1) % TOUR.length), 2200);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    uSkin.uActive.value = TOUR[active].id;
  }, [active, uSkin]);
  const uPts = useMemo(() => ({ uScan: { value: 0 }, uSize: { value: 2.2 } }), []);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const y = Math.sin(t * 0.85) * 9.6 - 1;
    uSkin.uScan.value = y;
    uSkin.uTime.value = t;
    uSkin.uPulse.value = 0.5 + 0.5 * Math.sin(t * 4.0);
    uPts.uScan.value = y;
    if (plane.current) plane.current.position.y = y;
    if (group.current) {
      const ty = Math.sin(t * 0.3) * 0.38 + pointer.x * 0.35;
      const tx = Math.sin(t * 0.2) * 0.05 - pointer.y * 0.18;
      group.current.rotation.y += (ty - group.current.rotation.y) * Math.min(1, dt * 3);
      group.current.rotation.x += (tx - group.current.rotation.x) * Math.min(1, dt * 3);
    }
    if (rings.current) {
      rings.current.children[0].rotation.z = t * 0.25;
      rings.current.children[1].rotation.z = -t * 0.18;
      rings.current.children[2].rotation.z = t * 0.1;
    }
  });
  return (
    <>
      <group ref={rings} position={[0, 0.5, -3]}>
        <mesh rotation={[1.25, 0.2, 0]}>
          <torusGeometry args={[12.2, 0.035, 8, 160, Math.PI * 1.5]} />
          <meshBasicMaterial color="#4fb6ff" toneMapped={false} transparent opacity={0.9} />
        </mesh>
        <mesh rotation={[1.4, -0.35, 0]}>
          <torusGeometry args={[13.6, 0.02, 8, 160, Math.PI * 1.1]} />
          <meshBasicMaterial color="#c9d1d9" toneMapped={false} transparent opacity={0.5} />
        </mesh>
        <mesh rotation={[1.05, 0.5, 0]}>
          <torusGeometry args={[15, 0.012, 8, 200]} />
          <meshBasicMaterial color="#4fb6ff" transparent opacity={0.25} />
        </mesh>
      </group>
      <group ref={group} position={[0, 0.5, 0]}>
        <mesh geometry={mesh}>
          <shaderMaterial ref={skin} vertexShader={skinVert} fragmentShader={skinFrag} uniforms={uSkin} side={THREE.DoubleSide} />
        </mesh>
        <lineSegments geometry={lines}>
          <lineBasicMaterial color="#6fa8d6" transparent opacity={0.13} depthWrite={false} />
        </lineSegments>
        <points geometry={points}>
          <shaderMaterial ref={pts} vertexShader={ptVert} fragmentShader={ptFrag} uniforms={uPts} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
        <mesh ref={plane} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 13]} />
          <meshBasicMaterial color="#4fb6ff" transparent opacity={0.035} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {TOUR.map((z, i) => (
          <Callout key={z.zone} zone={z.zone} label={labels[i]} side={z.side} on={active === i} />
        ))}
      </group>
    </>
  );
}

function Particles() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const n = 420;
    const p = new Float32Array(n * 3);
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      p[3 * i] = (rnd() - 0.5) * 52;
      p[3 * i + 1] = (rnd() - 0.5) * 40;
      p[3 * i + 2] = (rnd() - 0.5) * 24 - 8;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.02;
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.2) * 0.6;
    }
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#7fe0ff" size={0.1} transparent opacity={0.55} depthWrite={false} toneMapped={false} />
    </points>
  );
}

export default function FaceScene({ labels }: { labels: string[] }) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 36], fov: 40 }} gl={{ antialias: false, powerPreference: "high-performance" }} aria-hidden>
      <color attach="background" args={["#05070a"]} />
      <Suspense fallback={null}>
        <Face labels={labels} />
      </Suspense>
      <Particles />
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.22} luminanceSmoothing={0.3} radius={0.75} />
        <Vignette eskil={false} offset={0.22} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
