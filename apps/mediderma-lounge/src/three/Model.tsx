/**
 * Blender 에서 내보낸 GLB 모델 로더.
 * 불러오는 동안, 그리고 불러오기에 실패했을 때는 fallback(코드로 만든 형상)을 그대로 보여 주므로
 * 모델 파일이 없어도 게임은 동작한다. 재질 이름으로 색을 바꿀 수 있다(tint).
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const cache = new Map<string, Promise<THREE.Group | null>>();
function load(url: string) {
  let p = cache.get(url);
  if (!p) {
    p = new Promise<THREE.Group | null>((resolve) => new GLTFLoader().load(url, (g) => resolve(g.scene), undefined, () => resolve(null)));
    cache.set(url, p);
  }
  return p;
}

export interface Tint { color?: string; emissive?: string; emissiveIntensity?: number; roughness?: number }

export function Model({ url, tint, fallback, materials, ...props }: { url: string; tint?: Record<string, Tint>; fallback?: ReactNode; /** 재질 이름 → 통째로 바꿔 끼울 재질 (캐릭터 피부처럼 공유 재질을 쓸 때) */ materials?: Record<string, THREE.Material> } & JSX.IntrinsicElements["group"]) {
  const [src, setSrc] = useState<THREE.Group | null>(null);
  useEffect(() => { let on = true; load(url).then((s) => { if (on) setSrc(s); }); return () => { on = false; }; }, [url]);
  const tintKey = JSON.stringify(tint ?? {});
  const obj = useMemo(() => {
    if (!src) return null;
    const o = src.clone(true);
    o.traverse((c) => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true; m.receiveShadow = true;
      const mats = (Array.isArray(m.material) ? m.material : [m.material]).map((mt) => {
        if (materials?.[mt.name]) return materials[mt.name];
        const t = tint?.[mt.name];
        if (!t) return mt;
        const n = (mt as THREE.MeshStandardMaterial).clone();
        if (t.color) n.color.set(t.color);
        if (t.emissive) n.emissive.set(t.emissive);
        if (t.emissiveIntensity !== undefined) n.emissiveIntensity = t.emissiveIntensity;
        if (t.roughness !== undefined) n.roughness = t.roughness;
        return n;
      });
      m.material = Array.isArray(m.material) ? mats : mats[0];
    });
    return o;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, tintKey, materials]);
  if (!obj) return <group {...props}>{fallback}</group>;
  return <group {...props}><primitive object={obj} /></group>;
}
