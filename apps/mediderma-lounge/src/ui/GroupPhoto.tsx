/**
 * 단체 사진: 같은 라운지에 있는 플레이어들이 카운트다운에 맞춰 함께 찍힌다.
 *  - 누군가 사진 모드에서 "단체 사진"을 누르면 방 전체에 시각(at)이 전달된다 (net/room.ts startGroupPhoto)
 *  - 모두 사진 모드로 바뀌고 카메라가 함께 있는 사람들을 담도록 물러난다 (three/World.tsx)
 *  - 시각이 되면 각자 화면에서 동시에 촬영 → 사진 모드 결과 화면으로 넘어가 피드에 올릴 수 있다
 *  - 두 명 이상이 함께 찍으면 하루 한 번 SOCIAL STAR +1
 */
import { useEffect, useState } from "react";
import { create } from "zustand";
import { activeGroup, endGroupPhoto, groupPositions, startGroupPhoto, useRoom } from "../net/room";
import { useGame } from "../store/game";
import { input, useUI } from "../store/ui";
import { useT } from "../i18n";
import { Icon } from "./Icon";

/** 사진 모드에서 찍은 사진 (단체 사진이면 인원 수를 함께 기억) */
export const useShot = create<{ shot: string | null; group: number }>(() => ({ shot: null, group: 0 }));

/** 지금 3D 화면을 정사각형 사진으로 */
export function captureCanvas(size = 360): string | null {
  try {
    const cv = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!cv) return null;
    const s = Math.min(cv.width, cv.height);
    const out = document.createElement("canvas");
    out.width = out.height = size;
    out.getContext("2d")!.drawImage(cv, (cv.width - s) / 2, (cv.height - s) / 2, s, s, 0, 0, size, size);
    const url = out.toDataURL("image/jpeg", 0.72);
    useUI.setState({ flash: 0.9 });
    setTimeout(() => useUI.setState({ flash: 0 }), 160);
    return url;
  } catch {
    return null;
  }
}

const GROUP_KEY = "mdl-group-photo-day";
const today = () => new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);
/** 하루 한 번 단체 사진 보상 (받았으면 true) */
export function groupReward(n: number): boolean {
  if (n < 2) return false;
  try {
    if (localStorage.getItem(GROUP_KEY) === today()) return false;
    localStorage.setItem(GROUP_KEY, today());
  } catch { /* 저장 불가 환경: 이번에는 지급 */ }
  useGame.setState((s) => ({ stars: s.stars + 1 }));
  return true;
}

/** 사진 모드 안의 "단체 사진" 버튼: 같은 방에 다른 사람이 있을 때만 */
export function GroupPhotoButton() {
  const t = useT();
  const online = useRoom((s) => s.status === "online");
  const others = useRoom((s) => s.ids.length);
  const busy = useRoom((s) => !!s.group);
  if (!online || others < 1) return null;
  const go = () => {
    const r = startGroupPhoto();
    if (r !== "ok") useUI.getState().toast(t(`group.fail.${r}`), "error");
  };
  return (
    <button disabled={busy} className="btn-ghost mt-2 w-full disabled:opacity-40" onClick={go} data-testid="group-photo">
      <Icon n="camera" /> {t("group.btn", { n: others + 1 })}
    </button>
  );
}

/** 카운트다운 표시 · 동시 촬영 (Hud 에 항상 붙어 있다) */
export function GroupPhotoOverlay() {
  const t = useT();
  const group = useRoom((s) => s.group);
  const [now, setNow] = useState(Date.now());
  // 단체 사진이 시작되면 모두 사진 모드로 (패널은 닫는다)
  useEffect(() => {
    if (!group) return;
    useShot.setState({ shot: null, group: 0 });
    useUI.setState({ mode: "photo", panel: null });
    // 다른 사람과 거의 같은 자리에 서 있으면 겹쳐 찍히지 않게 반 걸음 비켜선다 (이름 순서로 서로 반대쪽)
    const me = input.playerPos, myName = useGame.getState().name;
    const near = groupPositions().find((o) => Math.hypot(o.x - me.x, o.z - me.z) < 0.7);
    if (near) { me.x += myName <= near.name ? -0.45 : 0.45; input.moveTarget = null; }
    if (group.by !== useGame.getState().name) useUI.getState().toast(t("group.started", { name: group.by }));
  }, [group?.at]);
  useEffect(() => {
    if (!group) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [group?.at]);
  // 시각이 되면 촬영 (한 번만)
  useEffect(() => {
    if (!group) return;
    const wait = group.at - Date.now();
    const shoot = setTimeout(() => {
      // 카메라가 자리를 잡은 뒤의 화면을 찍는다
      const url = captureCanvas();
      if (url) {
        useShot.setState({ shot: url, group: group.n });
        if (groupReward(group.n)) useUI.getState().toast(t("group.reward"), "reward");
      } else useUI.getState().toast(t("photo.fail"), "error");
    }, Math.max(0, wait));
    const end = setTimeout(() => endGroupPhoto(), Math.max(0, wait) + 2600);
    return () => { clearTimeout(shoot); clearTimeout(end); };
  }, [group?.at]);
  const g = activeGroup(now);
  if (!g) return null;
  const left = Math.ceil((g.at - now) / 1000);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[34%] z-40 flex flex-col items-center gap-2" data-testid="group-countdown">
      <p className="rounded-full bg-ink/75 px-4 py-1.5 text-[13px] font-bold text-cream">{t("group.title", { n: g.n })}</p>
      {left > 0 && <p className="text-7xl font-black text-white drop-shadow-[0_4px_18px_rgba(226,113,141,0.8)]">{left}</p>}
    </div>
  );
}
