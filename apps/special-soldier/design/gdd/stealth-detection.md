# GDD — 스텔스·탐지

## 1. Overview
플레이어는 자세·소음·조명으로 발각 위험을 조절한다. HUD 상단의 인지 표시(HIDDEN / SUSPICIOUS / DETECTED / COMBAT)가 현재 상태를 알려 준다.

## 2. Player Fantasy
어둠 속에서 초병 뒤로 돌아가 한 발로 끝내고, 아무도 모른다.

## 3. Detailed Rules
- 앉기·엎드리기는 적의 시야 거리를 72% / 50%로 줄인다.
- 발소리 반경: 달리기 16 m, 걷기 7 m, 앉기 2.5 m, 엎드리기 1 m(물에서는 ×1.4).
- 총성 반경은 무기의 `loud`(소음 권총 14 m, 돌격소총 110 m). 반경의 55% 안은 즉시 수색, 바깥은 의심.
- 동료의 사망을 30 m 안에서 본 적은 수색에 들어간다.
- 지하 시설의 카메라는 시야 안에 1.2초 이상 잡히면 전 구역 경보. 쏴서 파괴할 수 있다.
- 전술 라이트를 켜면 적 시야 거리 ×1.5.

## 4. Formulas
인지 게이지와 시야 거리는 `enemy-ai.md` §4.

## 5. Edge Cases
- 분대원은 교전 전에는 사격하지 않는다(사격 통제).
- 체크포인트 재시작 시 적은 플레이어를 잊지만 피해는 유지된다.

## 6. Dependencies
`enemies.perceive / hear`, `player.noise / stance`, `gear.light`, `sky.night / rainAmt`.

## 7. Tuning Knobs
자세 배율, 소음 반경, `loud`, 카메라 감지 시간, 야간 계수.

## 8. Acceptance Criteria
E2E: 초병 뒤에서 앉아 있으면 미발견 / 소음 권총 헤드샷 후 교전 중인 적 0.
