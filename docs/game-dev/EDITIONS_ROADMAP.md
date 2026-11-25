# SPECIAL SOLDIER — 하나의 게임, 두 판(에디션) 로드맵

사용자 결정(2026-11-25): **두 판을 모두 유지**하고, **한 게임 안에서 유저가 플레이 방식을 골라** 플레이하게 하며,
두 판 모두 계속 개발해 완성된 게임으로 만든다.

| | CLASSIC (클래식) | UNITY EDITION (유니티판) |
|---|---|---|
| 코드 | `apps/special-soldier` (Three.js) | `apps/unity-studio` (Unity 6, URP) |
| 지금 범위 | 캠페인 5개 미션, 훈련소, 무기고, 장비, 정보 파일 | Island Slice 1개 미션(거점 장악 → 정보 다운로드 → 탈출) + 캠페인 미션 01, S/A/B/C 등급 |
| 강점 | 내용 분량, 바로 실행(추가 다운로드 없음) | HDRI 하늘·비·번개, UI Toolkit HUD, Unity 지형 |
| 배포 | https://special-soldier.vercel.app · 포털 메인 카드 | 포털 `play/unity-island-slice/` · 포털 실험실 카드 |

## 1. 지금 연결된 것 (2026-11-25)

- 클래식 메인 메뉴 **PLAY MODE** → 두 판 카드 → `PLAY UNITY EDITION` 이 Unity 빌드를
  `?difficulty=<현재 난이도>&return=<클래식 주소>` 로 엶(`src/config/editions.js`). 화면: `screenshots/editions-play-mode.jpg`.
- Unity 판: 주소의 `difficulty` 적용(코드 > `-difficulty` > 주소 > 저장값), 일시정지(Esc) **CLASSIC EDITION** 버튼이 `return` 주소로 돌아감.
  `return` 은 신뢰 호스트만 허용(`Core/EditionLinks.cs`, 그 외는 기본 클래식 주소) — 열린 리다이렉트 방지.
- 같은 규칙: 난이도 표, 무기 표, 적 인지·엄폐·측면·수류탄, 미션 등급 공식, HUD 상수, 하늘 프리셋, **섬 지형 공식**(웹 `terrain.js` ↔ `IslandTerrain.cs`)을
  테스트로 숫자 대조(dotnet `CoreTests~`, 웹 `npm test`).
- 크레딧: 클래식 크레딧 화면에 Unity 판 CC0 HDRI 포함.

## 2. 완성까지 남은 일

### 공통 (한 게임으로서)
| # | 일 | 담당 제안 | 상태 |
|---|---|---|---|
| C1 | 포털: SPECIAL SOLDIER 카드 1장에 "클래식 / 유니티판" 버튼 2개 | 포털 세션 | 요청함 |
| C2 | Unity 판 결과를 포털 활동 기록에 남기기(iframe 플레이 페이지 + `game_result` 수신) | 포털 세션 | 사용자 결정 대기 |
| C3 | 콜사인·설정(감도·FOV·볼륨) 공유 — 같은 사이트에 두 판을 올리면 localStorage 로 공유 가능, 지금은 다른 도메인이라 주소 파라미터만 | 결정 필요 | 대기 |
| C4 | 판별 최고 기록을 한 화면(OPERATIONS)에서 보기 | 클래식 | 할 일 |

### 유니티판
| # | 일 | 상태 |
|---|---|---|
| U1 | storm·dusk·night 하늘 밝기 재보정 화면 확인(fd35aa7) | 확인 중 |
| U2 | 섬 지형(eb0335f) WebGL 확인·빌드 크기·프레임 | 확인 중 |
| U3 | 병사 애니메이션(Quaternius UAL CC0, Humanoid 리타깃) — **코드·에셋 푸시됨**: 보이지 않는 UAL 마네킹이 동작을 재생하고 병사 관절이 따라 움직임, UAL 없으면 웹과 같은 절차 포즈. PC 화면 확인 대기. 다음: 소총 동작(UAL Standard엔 없음 — Pro/다른 CC0 원천 검토) | 진행 중 |
| U4 | 캠페인 미션 이식(`missions.js` 정의 재사용) — **M01 SILENT LANDING 이식됨**(`Core/Campaign.cs`, `Assets/Scenes/Mission01.unity`, `?mission=m01`), PC 확인 대기. M01 해변 구조물(`Core/IslandProps.cs`, 웹 build.js 대조) 추가. **M02 DEEP JUNGLE·M03 BLACK COBRA BASE·M04 UNDERGROUND ZERO 이식됨**(`?mission=m02`·`m03`·`m04`, 장갑차·보안 카메라 포함). 다음: M05 최종 탈출 | 진행 중 |
| U5 | 사람 플레이테스트: 포인터 잠금 이동·사격, 소리 균형, 감도 기본값(웹 기준 0.126°/px) | 사용자 |

### 클래식
| # | 일 | 상태 |
|---|---|---|
| K1 | PLAY MODE 화면 e2e 확인(메뉴 루프에 추가됨) | 할 일 |
| K2 | Unity 판의 개선점 역이식 후보: 날씨 이름 표시·[K] 순환, 킬 피드 | 검토 |

## 3. 일 나누기

- 허브(클라우드): 새 기능 설계·Core 이식(웹 ↔ Unity 숫자 대조).
- PC Unity 세션: Unity 컴파일·PlayMode·WebGL 실화면 확인, 클래식·Unity 연결부(이 문서 §1), 기록·feed.
- 포털 세션: 포털 카드·플레이 페이지. 운영 배포는 사용자 승인 후.
- 시작 전 `STUDIO_HUB.md` "작업 중" 표에 대상 파일을 먼저 적는다.
