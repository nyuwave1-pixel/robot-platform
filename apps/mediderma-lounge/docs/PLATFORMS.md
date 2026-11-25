# 플랫폼 연동 (비트파크 우선)

뷰티 라이프는 **비트파크 포털(AIRobotVerse · airobotphysical.com)** 을 홈 플랫폼으로 삼는다.
게임 플레이 · 보상 · 공유 링크는 모두 비트파크 기준으로 동작하고, 다른 플랫폼은 같은 규격의 어댑터를 추가해 붙인다.

## 구조

```
src/platform/
  types.ts    — Platform 규격 (detect · playUrl · init · report), PlayEvent, LinkParams
  bitpark.ts  — 비트파크 포털 어댑터 (홈 플랫폼)
  web.ts      — 일반 웹 (게임 주소로 바로 들어온 경우, 마지막 대체)
  index.ts    — HOME_PLATFORM · ADAPTERS(감지 순서) · platform() · shareUrl() · reportPlay() · initPlatform()
```

| 하는 일 | 어디서 |
|---|---|
| 실행 중인 플랫폼 감지 | `platform()` — `ADAPTERS` 순서대로 `detect()`, 없으면 일반 웹 |
| 공유 · 초대 · 라운지 방문 링크 | `shareUrl({ invite, from, visit, open })` — 지금 플랫폼이 일반 웹이면 홈(비트파크) 주소 |
| 플레이 기록 알림 (보상) | `reportPlay(ev, score)` — 같은 종류는 1분에 한 번. 보상 여부 · 횟수는 플랫폼이 판단 |
| 게임 주소로 바로 온 사람 안내 | 첫 화면의 "비트파크에서 플레이하기" (`onHomePlatform()` 이 false 일 때) |

### 지금 알리는 플레이 기록 (`PlayEvent`)

| 이벤트 | 언제 | 점수 |
|---|---|---|
| `care` | 뷰티 케어 완료 (자동) | 누적 케어 수 |
| `brag` | 뷰티 자랑 올리기 성공 | 1 |
| `harvest` | 뷰티 가든 수확 | 받은 코인 |
| `pet` | 펫과 놀아주기 | 유대감 |
| `style` | 스타일 챌린지 출전 | 스타일 점수 |

## 비트파크 메시지 규격 (iframe → 포털, 허용된 포털 주소로만)

```js
{ type: "game_ready",  game: "beauty-life" }                                   // 시작
{ type: "game_event",  game: "beauty-life", event: "brag", score: 1 }         // 어떤 플레이를 했는지 (포털 활동 기록용)
{ type: "game_result", game: "beauty-life", score: 3, rp: 40 }                // RP 적립 요청 (포털이 상한 · 게임당 하루 1회 확인)
```

- 포털 게임 페이지: `https://www.airobotphysical.com/games/play/beauty-life/`
- 포털이 게임 주소로 넘겨 주는 값: `visit`(라운지 방문 코드) · `open`(열 탭) · `invite`(초대 코드) · `from`(초대한 사람 이름)
- 포털 쪽 코드: `airobotverse-` 저장소 `src/components/GamePlayClient.tsx`, 게임 목록 `src/lib/games-config.ts`

## 새 플랫폼 추가하기

1. `types.ts` 의 `PlatformId` 에 이름을 추가한다 (예: `"kakao"`).
2. `src/platform/<이름>.ts` 에 `Platform` 을 구현한다.
   - `detect()`: 그 플랫폼 안에서 실행 중인지 (부모 창 주소 · 웹뷰 사용자 에이전트 · SDK 존재 등). **허용 목록으로만** 판단한다.
   - `playUrl(p)`: 그 플랫폼에서 게임을 여는 주소 + `LinkParams` (형식 검사는 `bitpark.ts` 의 `linkQuery` 를 재사용).
   - `init()`: SDK 초기화 · 준비 완료 알림.
   - `report(ev, score)`: 그 플랫폼의 보상 · 업적 API 로 전달. 실패해도 게임 진행에 영향을 주지 않게 한다.
3. `index.ts` 의 `ADAPTERS` 에서 `web` **앞에** 넣는다.
4. 홈 플랫폼을 바꾸려면 `HOME_PLATFORM` 만 바꾸면 된다 (공유 링크 · 첫 화면 안내가 따라 바뀐다).
5. `tests/events.test.ts` 의 "플랫폼 연동" 테스트처럼 메시지 형식 · 링크 · 감지를 테스트한다.

게임 데이터(세이브 · 콘테스트 · 방명록 · 뷰티 자랑)는 플랫폼과 무관하게 같은 서버(Supabase 게임 전용 스키마)를 쓰므로, 어느 플랫폼에서 하든 같은 라운지 · 같은 피드를 함께 본다.
