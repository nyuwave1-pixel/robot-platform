# 포털 포인트·혜택·유료 아이템 표준 (모든 새 게임 필수)

사용자 방침(2026-11-27): **개발하는 게임은 항상 BIT PARK 포인트(PP)·혜택과 연동하고, 유료 아이템은 포털 포인트로 산다.**
게임은 계정·토큰·잔액을 직접 다루지 않는다. 돈과 같은 일은 모두 포털 서버(BIT PARK `wallet_ledger`·`shop_buy`)가 한다.

## 1. 게임마다 갖출 것

| # | 항목 | 어디 |
|---|---|---|
| 1 | 포인트 적립: 검증 클리어 → PP(첫 클리어·완주 보너스는 BIT PARK DB가 지급), 등급 → airobotphysical RP | `src/portal.js` `levelStart` / `result({ proof, clear })` |
| 2 | 리플레이 검증 `src/verify.js` (+ `levels.js`) — 포인트는 서버가 다시 재생해 확인한 뒤에만 | 게임 |
| 3 | PP 상점: `game.json` 의 `items` 목록 + 게임 안 상점 화면(`portal.items()`, `portal.buy(id)`) | 게임 |
| 4 | 혜택 표시: 지갑(`portal.wallet()`), 보유 아이템 적용, 포털 밖에서는 "BIT PARK에서 구매 가능" 안내만 (가짜 구매 버튼 금지) | 게임 |
| 5 | 포털 등록: `shop_items` 행(kind `game_item`, `game` = slug, `price_currency` PP), 검증기 등록 | BIT PARK 세션 |

`tools/game-lab/new-game.mjs` 로 만든 게임은 1·4의 연결부(`portal.js`)를 처음부터 갖는다.

## 2. 유료 아이템 규칙 (공정성)

- **순위 점수에 영향을 주는 아이템은 팔지 않는다.** 검증 proof 에 아이템이 들어가지 않고, verify 는 아이템을 모른다.
- 팔 수 있는 것: 꾸미기(테마·스킨·펫·카드 뒷면), 순위 밖 모드(자유 모드·연습·샌드박스), 편의 기능 중 점수와 무관한 것(통계·기록 보기).
- 가격은 PP. 하트(HEART)·이벤트(EVT) 통화는 BIT PARK 운영 판단.
- 아이템 id: `<slug>-<이름>` (소문자·숫자·하이픈, 40자 이하 — `shop_items.id` 규칙).
- 1인 1개(`per_user_limit` 1)가 기본. 소모품은 **서버 차감 호출 `useGameItem { id, ref }` 이 BIT PARK 에 생긴 뒤에만** 쓸 수 있다(요청: [`bitpark/SHOP_CONTRACT.md`](bitpark/SHOP_CONTRACT.md) 2장). 그 전에는 게임이 `unknown_call` 을 받고 효과를 주지 않는다.
  소모품도 순위 점수에 영향이 없어야 한다 — SPECIAL SOLDIER 의 부활권·보급 상자는 캠페인 전용(멀티플레이 경기에는 안 들어감).

## 3. SDK 호출 (게임 ↔ 포털)

메시지 형식은 BIT PARK `GAME_SDK_GUIDE.md` 와 같다: 게임 → `{ source:'bitpark-game', slug, call, id, args }`, 포털 → `{ source:'bitpark-portal', id, ok, result | error }`.

| 호출 | 결과 | 상태 |
|---|---|---|
| `getPlayer`, `getWallet` | `{ signedIn, nickname, … }`, `{ PP, HEART, EVT }` | BIT PARK에 있음 |
| `getGameItems` | `[{ id, name, price, currency, owned }]` — 이 게임(`shop_items.game = slug`)의 판매 중 아이템과 보유 여부 | **BIT PARK에 요청** |
| `buyGameItem { id }` | 포털이 **자기 화면에 확인 창**을 띄우고(게임이 대신 누를 수 없음) `shop_buy` 로 결제 → `{ ok, item }`. 오류: `not_signed_in`, `insufficient_funds`, `already_owned`, `cancelled`, `item_unavailable` | **BIT PARK에 요청** |

게임 쪽 함수(`createPortal(slug)`): `player()`, `wallet()`, `items()` (상점을 쓸 수 없으면 `null`), `buy(id)`.
게임은 마지막으로 받은 보유 목록을 localStorage 에 기억해 꾸미기를 오프라인에서도 보여 준다 — 권한 판단(순위 밖 모드 열기 등)은 그 목록을 쓰지만, 점수와 포인트는 언제나 서버 검증이 정한다.

## 4. airobotphysical.com (RP)

지금: 등급별 RP(`game_result`, S30/A22/B15/C8, 하루 1회·상한은 사이트가 적용). RP 상점(`rp-shop.ts`)에서 게임 아이템을 파는 일은 2단계 — 같은 `items` 목록을 RP 가격으로 노출할지는 사용자 결정.
RP → PP 전환은 BIT PARK `import_rp` 가 이미 지원한다(AIROBOT_LINK_PROTOCOL).

## 5. 게임별 현황

| 게임 | PP/RP 적립 | 검증 | PP 아이템 |
|---|---|---|---|
| HEARTHVALE | ✅ | ✅ (metric = 점수, 높을수록 좋음) | 벚꽃 테마 300 · 고양이 200 · 자유 모드 500 — 게임 안 상점 완성, 포털 쪽 대기 |
| ROGUE LEGENDS | ✅ | ✅ (BIT PARK 등록됨) | 수호자 스킨 '서리 갑주' 300 · 비전술사 스킨 '공허' 300 · 황금 카드 테두리 250 — 게임 안 상점 완성, 포털 쪽 대기 |
| BEAT LAB · TURBO LAP | ✅ | ✅ (등록됨) | 연결부만 |
| SURVIVAL WORLD | RP만 (검증 없음) | — | 연결부만 |
| SPECIAL SOLDIER | ✅ (RP `game_result`) | — | 꾸미기 4 · 캠페인 잠금 해제 3 · 소모품 2 — 게임 안 상점 완성(웹판), 포털 등록·`useGameItem` 대기 (`bitpark/SHOP_CONTRACT.md`) |
