/** 오픈 라운지에 실시간으로 들어온 다른 플레이어 (주인에게는 방문객, 방문객에게는 주인과 다른 방문객) */
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import { guests, useRoom, type Guest } from "../net/room";
import { Character } from "./Character";
import { useUI } from "../store/ui";
import { Label } from "./Label";
import { NameTag } from "./Plaza";

function LiveAvatar({ r }: { r: Guest }) {
  const g = useRef<THREE.Group>(null!);
  const moving = useRef(false);
  // 사진 모드에서는 이름표가 사진을 가리지 않게 숨기고, 단체 사진 중에는 함께 포즈를 취한다
  const photo = useUI((s) => s.mode === "photo");
  const group = useRoom((s) => !!s.group);
  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.001, dt);
    r.rx += (r.x - r.rx) * k; r.rz += (r.z - r.rz) * k;
    moving.current = Math.hypot(r.x - r.rx, r.z - r.rz) > 0.05;
    if (!g.current) return;
    g.current.position.set(r.rx, 0, r.rz);
    let dy = r.yaw - g.current.rotation.y;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    g.current.rotation.y += dy * Math.min(1, dt * 10);
  });
  return (
    <group ref={g} position={[r.rx, 0, r.rz]}>
      <Character look={r.look} growth={r.stage} anim={group ? "pose" : "idle"} movingRef={moving} rank={r.rank} seed={r.id.length} />
      {!photo && <NameTag name={r.name} rank={r.rank} y={1.25 + r.stage * 0.2} say={r.say} sayAt={r.sayAt} />}
      {!photo && (
        <Billboard position={[0, 1.62 + r.stage * 0.2, 0]}>
          <Label text={r.host ? "HOST" : "GUEST"} width={0.55} color="#ffffff" bg={r.host ? "rgba(201,166,107,0.95)" : "rgba(185,162,232,0.95)"} size={150} weight={800} spacing={0.04} />
        </Billboard>
      )}
    </group>
  );
}

export function LiveGuests() {
  const ids = useRoom((s) => s.ids);
  return <>{ids.map((id) => { const r = guests.get(id); return r ? <LiveAvatar key={id} r={r} /> : null; })}</>;
}
