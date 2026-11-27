/**
 * 비트파크 RP 교환소: 포털 RP 로 게임 재화를 산다.
 *  - 게임이 상품을 고르면 포털에 요청(rp_exchange) → 포털이 확인 창을 띄우고 본인이 동의하면 RP 를 차감
 *  - 포털이 결과(rp_exchange_result)를 돌려주면, 게임이 보낸 요청(nonce)과 맞을 때 한 번만 지급한다
 *  - 지급량은 게임 표(EXCHANGE_OFFERS)가, 가격 · 차감은 포털 표가 정한다 (두 표는 같은 값으로 유지)
 */
import { create } from "zustand";
import { useGame } from "../store/game";

export interface ExchangeOffer { id: string; rp: number; grant: { coins?: number; gems?: number; stars?: number }; ko: string; en: string }
export const EXCHANGE_OFFERS: ExchangeOffer[] = [
  { id: "coins-1000", rp: 50, grant: { coins: 1000 }, ko: "뷰티 코인 1,000", en: "1,000 Beauty Coins" },
  { id: "coins-5000", rp: 200, grant: { coins: 5000 }, ko: "뷰티 코인 5,000", en: "5,000 Beauty Coins" },
  { id: "gems-10", rp: 100, grant: { gems: 10 }, ko: "뷰티 젬 10", en: "10 Beauty Gems" },
];
export const OFFER_MAP: Record<string, ExchangeOffer> = Object.fromEntries(EXCHANGE_OFFERS.map((o) => [o.id, o]));

/** 보낸 요청 (응답이 오면 지운다) */
export const useExchange = create<{ pending: Record<string, string> }>(() => ({ pending: {} }));

export function newNonce() {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** 포털 결과를 받아 지급 — 내가 보낸 요청 · 같은 상품일 때만, 한 번만. 지급했으면 상품을 돌려준다 */
export function settleExchange(v: unknown): { offer: ExchangeOffer; ok: boolean; reason?: string } | null {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const nonce = typeof o.nonce === "string" ? o.nonce : "";
  const pend = useExchange.getState().pending;
  const offerId = pend[nonce];
  if (!offerId || o.offer !== offerId) return null;
  const { [nonce]: _done, ...rest } = pend;
  useExchange.setState({ pending: rest });
  const offer = OFFER_MAP[offerId];
  if (!offer) return null;
  if (o.ok !== true) return { offer, ok: false, reason: typeof o.reason === "string" ? o.reason.slice(0, 20) : "cancel" };
  const g = offer.grant;
  useGame.setState((s) => ({ coins: s.coins + (g.coins ?? 0), gems: s.gems + (g.gems ?? 0), stars: s.stars + (g.stars ?? 0) }));
  return { offer, ok: true };
}
