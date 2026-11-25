# 플랫폼 연동 (비트파크 우선)

뷰티 라이프는 **비트파크 포털(AIRobotVerse · airobotphysical.com)** 을 홈 플랫폼으로 삼는다.
게임 플레이 · 보상 · 공유 링크는 모두 비트파크 기준으로 동작하고, 다른 플랫폼은 같은 규격의 어댑터를 추가해 붙인다.

## 구조

```
src/platform/
  status.ts   — 플랫폼이 알려 주는 플레이어 상태 (로그인 · RP)
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

포털 → 게임 (게임 주소로만, 게임은 허용된 포털 창에서 온 것만 받는다):

```js
{ type: "portal_status", game: "beauty-life", loggedIn: true, name: "표시 이름", rp: 1234, rpToday: false, rpReward: 40 }
```

- `game_ready` 를 받으면, 그리고 로그인 · RP 가 바뀔 때마다 포털이 보낸다. uid · 이메일은 보내지 않는다.
- 게임은 `src/platform/status.ts` 의 `usePlatformStatus` 에 담아 화면 안내에만 쓴다: 상단 RP 표시(`1,234 RP +40` / 오늘 받음 ✓ / 로그인 안내), 새 게임 이름 자동 입력.

### RP 교환소 (포털 RP → 게임 재화)

```js
// 게임 → 포털: 상점의 '비트파크 RP 교환소'에서 상품을 고르면
{ type: "rp_exchange", game: "beauty-life", offer: "coins-1000", rp: 50, nonce: "<16자 16진수>" }
// 포털 → 게임: 확인 창에서 '교환' → spendPoints 로 RP 차감 뒤 (취소 · 잔액 부족 · 하루 5번 초과면 ok:false)
{ type: "rp_exchange_result", game: "beauty-life", offer: "coins-1000", nonce: "…", ok: true }
```

- 가격 · 차감은 포털 표(`airobotverse-` `src/lib/gameExchange.ts`), 지급량은 게임 표(`src/platform/exchange.ts`) — 같은 값으로 유지. 포털은 게임이 보낸 가격이 자기 표와 다르면 거절한다.
- 게임은 자기가 보낸 요청(nonce) · 같은 상품의 결과만, 한 번만 지급한다.

### 계정 연결 (다른 기기에서 이어하기)

```js
// 게임 → 포털: 첫 백업 뒤, 비트파크 계정에 연결된 게임이 아직 없을 때 (또는 플레이어가 '이 기기 진행을 계정에 연결'을 누를 때)
{ type: "game_link",   game: "beauty-life", code: "ABC123", secret: "<32자 16진수>", name: "표시 이름" }
// 포털 → 게임: game_ready 때, 그리고 저장 직후 (연결이 없으면 code · secret 없이)
{ type: "portal_link", game: "beauty-life", code: "ABC123", secret: "<32자 16진수>" }
```

- 포털은 로그인한 본인 문서 `users/{uid}/gameLinks/{gameId}` 에만 저장 · 읽기 (firestore.rules — **Firebase 에 규칙 배포가 필요**, 배포 전에는 조용히 꺼져 있음).
- 게임은 계정에 다른 진행이 연결돼 있으면 첫 화면 · 설정에서 '이 진행 불러오기 / 이 기기 진행을 계정에 연결' 을 고르게 한다. 진행 데이터 자체는 게임 서버(클라우드 백업)에 있다.

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
