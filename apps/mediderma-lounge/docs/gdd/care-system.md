# GDD — DERMA HOME 케어 시스템

수치는 모두 `src/data/config.json` 의 키로 적는다. 값을 바꿀 때는 그 파일만 고친다.

## 1. 개요
플레이어가 공식 루틴을 골라, 스텝마다 지정 제품을 바르고 부위를 문질러 게이지를 채우는 미션. 완료하면 EXP 와 코인을 얻는다.

## 2. 플레이어 판타지
"내 손으로 돌봐서 자라게 한다." 디바이스를 직접 쥐고 관리해 주는 감각, 그리고 끝났을 때의 반짝임.

## 3. 규칙
1. 루틴을 고른다. 루틴은 1~3개 스텝이고, 스텝은 모드(RF·US·IONTO) 하나와 제품 하나를 쓴다. 구성은 더마홈 공식 가이드 그대로다.
2. 스텝을 시작하려면 그 스텝의 제품을 1회분 이상 갖고 있어야 한다. **바르기**를 누르면 1회분이 줄어든다.
3. 바른 뒤 부위가 활성화된다. 부위 위에서 누른 채 문지르면 진행도가 오른다. 누르고만 있어도 천천히 오른다.
4. 진행도가 1 이 되면 그 부위가 완료되고 다음 부위로 넘어간다. 부위 순서는 자유.
5. 모든 부위가 끝나면 다음 스텝. 마지막 스텝이 끝나면 페이스 루틴은 미스트 마무리(선택), 두피·바디는 바로 결과.
6. 고객 케어는 익스프레스: 앞의 2스텝·2부위만 진행한다.

## 4. 공식
`Z` = 완료한 부위 수, `S` = 스텝 수, `full` = 루틴을 끝까지 했는가, `first` = 그 루틴 첫 클리어인가, `mist` = 미스트로 마무리했는가.

- Skin EXP = `Z × care.zone_skin_exp` + (`full` ? `care.full_routine_bonus_exp` : 0) + (`mist` ? `care.mist_skin_exp` : 0)
- Device EXP = `Z × care.zone_device_exp` + (`full` ? `care.full_routine_bonus_exp` : 0)
- Knowledge EXP = `S × care.step_knowledge_exp` + (`full` ? `care.full_routine_knowledge_exp` : 0) + (`first` ? `care.first_clear_knowledge_exp` : 0)
- 코인(셀프) = `S × care.step_coins`
- 진행도 증가 = 문지른 거리 ÷ (부위 반지름 × `care.stroke_length`) + 누른 시간 × `care.hold_rate`

고객 케어:
- 별 = 3 + (추천 적중 ? 1 : 0) + (미스트 ? 1 : 0), 미스트가 없는 루틴에서 적중이면 +1, 최대 5
- 코인 = 고객 유형 결제액 × (`customer.pay_base` + 별 × `customer.pay_per_star`)
- LOUNGE POINT = 별 × `customer.lp_per_star`
- Lounge EXP = `customer.lounge_exp_base` + `S × customer.lounge_exp_per_step`
- 플레이어 Skin EXP 는 `customer.skin_exp_ratio` 만큼만

기본값에서 카밍 풀 루틴(3스텝 × 4부위 + 미스트 + 첫 클리어) = Skin 64 · Device 70 · Knowledge 30 = **164 EXP**, STAGE 2 기준(120)을 한 번에 넘는다.

## 5. 예외
- 제품이 없으면 바를 수 없다 → 그 자리에서 구매하거나 나간다.
- 스텝 도중 나가면 보상이 없고 이미 바른 제품은 돌아오지 않는다.
- 고객 케어를 중간에 나가면 고객은 결제 없이 떠난다.
- 익스프레스는 풀 루틴 클리어로 치지 않는다(첫 클리어 보너스·루틴 퀘스트에 반영되지 않음).
- 한 번에 두 단계 기준을 넘어도 성장 연출은 한 단계씩.

## 6. 의존성
상품 DB(`products.ts`) · 루틴 데이터(`devices.ts`) · 인벤토리와 재화(`store/game.ts`) · 고객 NPC(`three/Customers.tsx`) · 성장 디렉터(`three/World.tsx`).

## 7. 튜닝 손잡이
`care.*` 10개, `customer.*` 11개. `?debug` 의 TWEAK 패널에서 실시간으로 바꿔 볼 수 있다.

## 8. 수용 기준
| 기준 | 확인 방법 |
|---|---|
| 스타터 키트만으로 카밍 루틴을 끝낼 수 있다 | `tests/care.test.ts` |
| 보상이 위 공식과 일치한다 | `tests/care.test.ts` |
| 첫 풀 루틴 1회로 STAGE 2 기준을 넘는다 | `tests/care.test.ts` |
| 제품을 바르기 전에는 진행되지 않는다 | `tests/care.test.ts` |
| 라운지 1의 모든 고객에게 맞는 추천이 존재한다 | `tests/data.test.ts` |
| 루틴 선택부터 결과 화면까지 오류 없이 진행된다 | `npm run smoke` 의 `care` 행 |
| 문지르는 손맛이 좋다 / 한 부위에 걸리는 시간이 적당하다 | **판정하지 않음 — 사람이 플레이해서 본다** |
