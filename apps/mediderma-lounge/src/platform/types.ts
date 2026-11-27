/**
 * 게임이 실행되는 플랫폼(포털 · 앱 마켓 · 메신저 등) 공통 규격.
 * 새 플랫폼은 이 규격으로 어댑터 파일을 하나 만들어 platform/index.ts 의 ADAPTERS 에 넣으면 된다 (docs/PLATFORMS.md).
 */
export type PlatformId = "bitpark" | "web";

/** 플랫폼에 알리는 플레이 기록 (보상 여부 · 횟수 제한은 플랫폼이 판단한다) */
export type PlayEvent = "care" | "brag" | "harvest" | "pet" | "style";

/** 공유 · 초대 · 라운지 방문 링크에 담는 값 */
export interface LinkParams { visit?: string; open?: string; invite?: string; from?: string }

export interface Platform {
  id: PlatformId;
  name: { ko: string; en: string };
  /** 지금 이 플랫폼 안(iframe · 웹뷰 등)에서 실행 중인지 */
  detect(): boolean;
  /** 이 플랫폼에서 게임을 여는 주소 (공유 · 초대 · 방문 링크의 기준) */
  playUrl(p?: LinkParams): string;
  /** 실행을 시작할 때 한 번 (플랫폼에 준비 완료 알림 등) */
  init(): void;
  /** 플레이 기록 알림 */
  report(ev: PlayEvent, score: number): void;
}
