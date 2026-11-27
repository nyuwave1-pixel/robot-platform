# `claude-code-game-studios` 분석과 반영 내역

대상: https://github.com/donchitos/claude-code-game-studios (MIT) — Claude Code용 게임 스튜디오 프레임워크
(서브에이전트 49개, 스킬 78개, 훅·권한 규칙, 엔진별 레퍼런스, 설계/QA 표준).

## 반영한 것

| 그쪽의 관행 | 우리 게임에 반영한 내용 |
|---|---|
| 숨은 탭에서 큰 델타 방지 — `visibilitychange` 에서 일시정지 | 플레이 중 탭이 숨겨지면 자동 일시정지 (`main.js`) |
| 포인터 락은 `pointerlockerror` 도 들어야 한다 | 락 거부 시 "클릭해서 재개" 안내 유지 (`input.js`) |
| `file://` 에서는 모듈 스크립트·`fetch` 가 막힌다 → 단일 파일 빌드 | `npm run build:single` → `dist-single/index.html` 더블클릭 실행. 헤드리스 Chromium에서 `file://` 부팅 확인 |
| "모든 값에 슬라이더가 있는 튜닝 패널" | **F2 튜닝 패널**(또는 `?tune`): 장착 무기 11개 수치 + 적 탄퍼짐·시야·피해·이동 속도 배율, JSON 내보내기 |
| 한 장짜리 게임 브리프가 설계 기준 | `design/game-brief.md` |
| GDD 8섹션(개요·판타지·규칙·공식·예외·의존·튜닝·수용 기준) | `design/gdd/` 3편(전투·탄도 / 적 AI / 스텔스·탐지) |
| 아키텍처 결정은 ADR로 | `docs/adr/` 3편 |
| 핸드오버 카드: 통과 / 깨짐 / 추정, "사람이 아직 플레이하지 않음" | `production/handover.md` |
| 증거는 남겨 둔다(스크린샷 보존) | `docs/screenshots/` 유지, QA 보고서에서 참조 |
| PR마다 자동 테스트 | `.github/workflows/special-soldier.yml` (단위 테스트 + 빌드) |

## 확인만 하고 바꾸지 않은 것
- three.js r182+ 에서 `PCFSoftShadowMap` 이 폐기 예정. 현재 고정 버전(0.170대)에서는 유효해 그대로 두었고, 업그레이드 시 `PCFShadowMap` 으로 바꿔야 한다.
- `Clock` 폐기(r183) — 우리는 `requestAnimationFrame` 타임스탬프를 직접 쓰므로 해당 없음.
- 오디오는 사용자 제스처(메뉴 클릭) 이후에 시작 — 이미 그렇게 되어 있다.

## 반영하지 않은 것 (이유)
- **프레임워크 자체(`.claude/` 의 에이전트·스킬·훅·권한 규칙) 설치.** 설치하면 이 저장소에서 Claude Code의 동작 방식(쓰기 전 승인 요구, 커밋 훅 등)이 바뀌므로 저장소 소유자의 결정이 필요하다. 원하면 별도 작업으로 설치할 수 있다.
- TypeScript 전환, Vitest 도입, 스토리/스프린트 운영 문서 — 현재 규모에서는 이득보다 변경 비용이 크다.
- 터치/게임패드 지원 — 이 게임은 마우스·키보드 FPS로 범위를 잡았다.
