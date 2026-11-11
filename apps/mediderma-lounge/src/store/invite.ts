/** 초대 링크: ?invite=친구코드&from=이름. 서버가 없으므로 코드 형식만 확인하고 기기 안에 기록한다. */
import { normCode, useGame } from "./game";
import { useUI } from "./ui";

export function inviteLink() {
  const g = useGame.getState();
  const u = new URL(location.href);
  u.search = ""; u.hash = "";
  u.searchParams.set("invite", g.friendCode);
  u.searchParams.set("from", g.name);
  return u.toString();
}

/** 주소에 초대 정보가 있고 게임을 시작한 상태면 한 번만 적용한다 */
export function applyPendingInvite() {
  if (typeof location === "undefined") return;
  const q = new URLSearchParams(location.search);
  const code = normCode(q.get("invite") ?? "");
  const g = useGame.getState();
  if (!code || !g.started) return;
  const from = (q.get("from") ?? "").slice(0, 12);
  if (g.acceptInvite(code, from)) useUI.getState().toast(g.settings.lang === "ko" ? `${from || "친구"}의 초대 선물을 받았어요` : `Invite gift from ${from || "a friend"} received`);
}
