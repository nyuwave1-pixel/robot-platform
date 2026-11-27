# SPECIAL SOLDIER × BIT PARK — PP 상점 연동 계약 (2026-11-27)

사용자 요청(11-27): "유료 아이템 및 기능은 비트파크 포털 포인트와 연동하여 게임 내 소진 및 주요 기능에 사용". 선택: SPECIAL SOLDIER 먼저, 꾸미기·기능 잠금 해제·소모품.
공통 규칙은 [`../PORTAL_ECONOMY.md`](../PORTAL_ECONOMY.md) 를 따르고, 이 문서는 SPECIAL SOLDIER 에 **더 필요한 것**(소모품의 서버 차감)을 BIT PARK 세션에 요청합니다.

## 1. 아이템 (원본: `apps/special-soldier/src/config/shop.js`, 포털용 목록: `apps/special-soldier/game.json` `items`)

| id | 이름 | 종류 | PP | 게임 효과 |
|---|---|---|---|---|
| `special-soldier-camo-desert` | 사막 위장 무늬 | 꾸미기 | 150 | 1인칭 무기 색 |
| `special-soldier-camo-urban` | 도시 위장 무늬 | 꾸미기 | 150 | 〃 |
| `special-soldier-camo-gold` | 황금 마감 | 꾸미기 | 600 | 〃 |
| `special-soldier-callsign-gold` | 황금 콜사인 | 꾸미기 | 200 | 메뉴의 호출부호 금색 |
| `special-soldier-armory` | 무기고 전체 해제 | 잠금 해제(캠페인) | 800 | 캠페인 무기 12종을 미션 1부터 |
| `special-soldier-mission-select` | 미션 전체 열기 | 잠금 해제(캠페인) | 500 | 5개 미션 아무거나 |
| `special-soldier-gear-early` | 전술 장비 조기 지급 | 잠금 해제(캠페인) | 300 | 드론·열상 미션 1부터 |
| `special-soldier-revive` | 현장 부활권 | **소모품** | 60 | K.I.A. 화면에서 그 자리에서 체력 60 으로 일어남 |
| `special-soldier-supply` | 보급 상자 | **소모품** | 40 | 미션 시작 시 구급상자 +2, 수류탄 +2 |

- 공정성: 멀티플레이(랭크) 경기에는 어떤 효과도 들어가지 않음(`effects(own, { ranked: true })` = 전부 없음, 테스트로 고정). 꾸미기만 보일 수 있음.
- 꾸미기·잠금 해제는 `per_user_limit 1`, 소모품은 여러 개 살 수 있음(`per_user_limit null`).

## 2. BIT PARK 에 요청하는 것

PORTAL_ECONOMY 의 `getGameItems`·`buyGameItem` 에 더해:

1. **`shop_items` 9행 등록** — `kind 'game_item'`, `game 'special-soldier'`, `price_currency 'PP'`, 위 표의 가격. 소모품 2종은 `consumable true`.
2. **`getGameItems` 결과에 소모품 개수** — `[{ id, name, price, currency, owned, count }]`; 소모품은 `count` = 남은 개수(구매 수 − 사용 수), 나머지는 `owned`.
3. **`buyGameItem { id }`** 를 소모품에도 — 살 때마다 `count +1`(포털 확인 창은 그대로).
4. **새 호출 `useGameItem { id, ref }`** — 서버가 소모품 1개를 차감.
   - `ref` = 게임이 만드는 사용 id(`revive:<미션>:<시각>` / `supply:<미션>:<시각>`). **같은 ref 는 한 번만 차감**(멱등, 원장 키 `game_use:<user>:<id>:<ref>`).
   - 성공 `{ ok: true, left }`, 실패 `none_left` · `not_signed_in` · `item_unavailable`. 포인트는 움직이지 않음(이미 살 때 냄).
   - 게임은 성공 응답을 받은 뒤에만 효과를 줌. 아직 이 호출이 없으면 포털이 `unknown_call` 을 돌려주고, 게임은 "BIT PARK 준비 중" 안내만 함.
5. 원장: 구매는 기존 `shop` reason, 사용은 PP 변동 없는 `game_item_use` 기록(통계·환불 근거).

## 3. 게임 쪽 (완료, 웹판)

- `src/net/portal.js` — 공용 연결부 + `use(id, ref)`. 포털 밖에서는 모든 호출이 `standalone` 으로 거절되고 구매 버튼이 없음.
- `src/ui/shop.js` — PP SHOP 화면(지갑, 종류별 목록, 구매는 포털 확인 창), 보유 목록 캐시(꾸미기·잠금 해제만; 소모품 개수는 항상 서버 값).
- 적용: 미션 카드 잠금(`missionOpen`), 무기고, 장비(`Gear.has`, 멀티플레이 제외), 무기 색(`applyCamo`), K.I.A. 화면 부활 버튼, 브리핑 보급 상자 선택.
- 테스트 `tests/shop.test.mjs`(7개): id 규칙·game.json 일치·모르는 id 무시·랭크전 효과 없음·위장 선택·미션 열림·SDK 메시지 형식.
- Unity 판: 같은 카탈로그를 C# 로 옮기고 WebGL jslib 로 같은 SDK 메시지를 보냄(다음 작업).
