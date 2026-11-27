/** 초대 링크: ?invite=친구코드&from=이름. 서버가 없으므로 코드 형식만 확인하고 기기 안에 기록한다. */
import { normCode, useGame } from "./game";
import { useUI } from "./ui";
import { shareUrl } from "../platform";

/** 초대 링크는 비트파크(홈 플랫폼) 게임 주소로 만든다 — 친구가 포털에서 바로 플레이하고 RP 도 받게 */
export function inviteLink() {
  const g = useGame.getState();
  return shareUrl({ invite: g.friendCode, from: g.name });
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
