# GDD — 전투·탄도

## 1. Overview
모든 사격은 발사체로 시뮬레이션되고, 피해는 거리·부위·방어구로 결정된다. 무기 수치는 `src/config/weapons.js` 한 곳에 있다.

## 2. Player Fantasy
무기마다 손맛이 다르다: 돌격소총은 다루기 쉽고, 저격총은 한 발이 무겁고, 샷건은 가까울수록 결정적이다.

## 3. Detailed Rules
- 발사체: 초기 속도 `vel`, 중력 9.81 m/s², 공기저항. 프레임마다 선분 충돌.
- 유리는 깨지고 관통된다. 그 외 충돌체는 탄을 멈춘다.
- 몸통 피해는 방어구가 50% 흡수(플레이어는 60%). 차량은 소화기 피해 10%, 폭발 피해 220%.
- 반동: 수직 킥의 55%는 영구 상승, 45%는 자동 복귀.

## 4. Formulas
- `damage(d) = dmg` (d ≤ r0) · `dmg × minMul` (d ≥ r1) · 그 사이 선형 보간
- 부위 배율: 머리 2.6 / 몸통 1.0 / 팔다리 0.72
- `burstDps = dmg × pellets × rpm / 60`
- `fieldDps(d) = damage(d) × pellets × mag × hitChance(d) / (탄창 소진 시간 + 재장전)`
- `hitChance(d) = clamp((0.3 / (d·tan(cone)))², 0.03, 0.98)`, `cone = adsSpread + 정상상태 블룸 + 반동 항`
- 탄퍼짐 = lerp(지향, 조준, ADS) × 자세 × 이동 × 공중 + 블룸 + 제압

## 5. Edge Cases
- 탄창 0에서 방아쇠 → 딸깍 소리 후 자동 재장전.
- 샷건은 한 발씩 장전하며 사격으로 장전을 끊을 수 있다.
- 방향 벡터는 저항 적용 후 다시 정규화한다(과거 결함: QA 보고서 #1).

## 6. Dependencies
`world.raycast`(충돌), `enemies.hitTest/damage`, `player.damage`, `fx`(이펙트·사운드).

## 7. Tuning Knobs
무기별 `dmg rpm mag reload ads recoilV recoilH spread adsSpread range minMul vel weight` — 게임 중 **F2 튜닝 패널**에서 슬라이더로 바꾸고 JSON으로 내보낼 수 있다.

## 8. Acceptance Criteria
- `npm test` 9개 통과(DPS 공식, 감쇠, 역할 구분, TTK).
- E2E: 자동 사격으로 탄 소모, 반동 상승, 단발/자동, 재장전, ADS 탄퍼짐 감소, 수류탄 폭발.
