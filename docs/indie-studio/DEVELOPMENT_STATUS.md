# NEXT-GEN INDIE STUDIO — 개발 현황

마지막 갱신 2026-11-27 · 브랜치 `claude/relaxed-ramanujan-83okpi` (robot-platform)

## 다른 PC에서 이어 하기
1. `git pull` (robot-platform, 위 브랜치)
2. ROGUE LEGENDS: `cd apps/game-lab/rogue-legends && python3 -m http.server 5180` → 브라우저 `http://localhost:5180`
3. 테스트: `node --test tests/*.test.mjs` · 밸런스: `node tools/sim.mjs 300`
4. 포털 반영: `node tools/portal/export-bitpark-feed.mjs` → bitpark-portal 쪽에 PR (BIT PARK 세션이 `collect-lab.mjs`로 가져감)

## 단계별 현황
| 단계 | 내용 | 상태 |
|---|---|---|
| PHASE 1 시장 조사 | `MARKET_RESEARCH.md` 외 5종 (Steam API 실측·SteamSpy 추정 구분) | 조사 중 (백그라운드) |
| PHASE 2 GitHub 감사 | `GITHUB_REPOSITORY_AUDIT.md` 외 3종 + 기존 카탈로그 86개 | 조사 중 (백그라운드) |
| PHASE 3·4 게임·엔진 | `TECHNICAL_ARCHITECTURE.md` | 1차 완료 |
| 첫 MVP | ROGUE LEGENDS — 플레이 가능, 규칙 테스트 10개, 브라우저 자동 플레이 오류 0, 리플레이 검증 일치 | **완료 (사람 테스트 전)** |
| PHASE 7 플랫폼 | BIT PARK `docs/STUDIO_PLATFORM_MATRIX.md` (20개 중 12·6·2) | BIT PARK 세션 |
| 포털 등록 | BEAT LAB·TURBO LAP 검증기 등록(BIT PARK, 함수 배포는 사용자 CLI 로그인 대기), ROGUE LEGENDS는 피드에 추가 → BIT PARK 세션이 등록 | 진행 중 |

## 알려진 한계 (정직하게)
- 사람 플레이 테스트 없음 — 밸런스는 탐욕 봇 기준.
- 그래픽은 직접 그린 SVG(일관된 스타일)이며 일러스트 수준은 아님. 사운드트랙 없음(효과음만 합성).
- 게임패드·Steam Deck 입력, 다국어(영어)는 아직.
- Steam 출시(데스크톱 래핑·Steamworks)는 시장 조사 결론 이후.
