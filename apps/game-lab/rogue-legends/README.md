# ROGUE LEGENDS

오리지널 **덱빌딩 로그라이크** · 장르 게임 랩 하부 섹션 · NEXT-GEN INDIE STUDIO 첫 MVP (2026-11-27).
기획서: [`docs/indie-studio/GAME_DESIGN_DOCUMENTS/ROGUE_LEGENDS.md`](../../../docs/indie-studio/GAME_DESIGN_DOCUMENTS/ROGUE_LEGENDS.md)

## 실행

```bash
cd apps/game-lab/rogue-legends
python3 -m http.server 5180            # 브라우저에서 http://localhost:5180  (?seed=123&hero=arcanist&level=1 로 고정 시드)
node --test tests/*.test.mjs           # 규칙·리플레이 테스트 (설치 없음)
node tools/sim.mjs 300                 # 밸런스 시뮬레이터: 봇이 영웅·난이도별 300판
```

## 구조

| 경로 | 내용 |
|---|---|
| `src/logic.js` | 규칙 전부(지도·전투·카드·유물·적·상점·사건). 순수·결정론적 — `newRun` · `legal` · `apply` · `encode/decode` |
| `src/levels.js` | 영웅 × 난이도 6개 (BIT PARK 레벨 번호) |
| `src/verify.js` | 리플레이 검증: (seed, 행동 목록) → 결과. BIT PARK 점수 서버가 그대로 씀 |
| `src/bot.js` · `tools/sim.mjs` | 탐욕 봇과 밸런스 시뮬레이터 (게임 화면은 안 씀) |
| `src/main.js` · `src/style.css` · `src/art.js` | 화면(DOM·CSS), 원본 SVG 그림, Web Audio 효과음 |
| `src/portal.js` | airobotphysical RP(`game_result`) + BIT PARK SDK v1(`levelStart`/`levelClear` + proof) |

**저장 = 증명**: 원정은 `(seed, 영웅, 난이도) + 행동 목록`으로만 저장됩니다(localStorage). 불러올 때 행동을 다시 재생하고,
같은 목록이 포털로 가는 proof 입니다. 브라우저에서 끝까지 친 원정의 목록을 `verify.js`로 돌리면 화면과 같은 점수가 나옵니다.

## 조작

카드 클릭(대상이 여럿이면 적 클릭) · 숫자키 1–9 카드 · Tab 대상 바꾸기 · E 턴 종료 · D 덱 보기 · Esc 취소.

## 밸런스 (탐욕 봇 300판, 2026-11-27)

| 레벨 | 승률 |
|---|---|
| WARDEN 0 / ARCANIST 0 | 34% / 31% |
| 난이도 1 (WARDEN / ARCANIST) | 11% / 14% |
| 난이도 2 | 3% / 1% |

봇은 다음 수를 내다보지 않으므로 사람의 승률은 이보다 높아야 정상입니다. 사람 플레이 테스트 후 조정합니다.
