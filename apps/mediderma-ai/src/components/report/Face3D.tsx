"use client";
/**
 * 3D 얼굴 시각화 — 사용자 사진에서 실제로 추출한 478개 랜드마크(x,y,z)로 메시를 만들고,
 * 사진 + 관찰 히트맵을 텍스처로 입힌다. 측정하지 않은 내부 조직 등은 표현하지 않는다.
 */
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { TRIANGLES } from "@/lib/analysis/zones";
import type { MetricKey, VisualData } from "@/lib/analysis/types";
import { renderOverlay } from "@/lib/client/overlay";

function Mesh({ visual, heatmap, selected, showZones }: { visual: VisualData; heatmap: MetricKey | null; selected: number | null; showZones: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  const geometry = useMemo(() => {
    const lm = visual.landmarks;
    const n = 468;
    const pos = new Float32Array(n * 3);
    const uv = new Float32Array(n * 2);
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < n; i++) { cx += lm[3 * i]; cy += lm[3 * i + 1]; cz += lm[3 * i + 2]; }
    cx /= n; cy /= n; cz /= n;
    const s = 1 / 320; // 얼굴 폭 640px → 2 단위
    for (let i = 0; i < n; i++) {
      pos[3 * i] = (lm[3 * i] - cx) * s;
      pos[3 * i + 1] = -(lm[3 * i + 1] - cy) * s;
      pos[3 * i + 2] = -(lm[3 * i + 2] - cz) * s; // MediaPipe z: 카메라 쪽이 음수
      uv[2 * i] = lm[3 * i] / visual.width;
      uv[2 * i + 1] = 1 - lm[3 * i + 1] / visual.height;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    g.setIndex(TRIANGLES);
    return g;
  }, [visual]);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(renderOverlay(visual, { heatmap, selected, showZones }));
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [visual, heatmap, selected, showZones]);
  useEffect(() => {
    invalidate();
    return () => texture.dispose();
  }, [texture, invalidate]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#7fe0ff" wireframe transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

export default function Face3D(props: { visual: VisualData; heatmap: MetricKey | null; selected: number | null; showZones: boolean }) {
  return (
    <Canvas frameloop="demand" dpr={[1, 2]} camera={{ position: [0, 0, 5.4], fov: 34 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} data-testid="face-3d">
      <Mesh {...props} />
      <OrbitControls enablePan={false} enableZoom={false} minAzimuthAngle={-0.8} maxAzimuthAngle={0.8} minPolarAngle={Math.PI / 2 - 0.5} maxPolarAngle={Math.PI / 2 + 0.5} />
    </Canvas>
  );
}
