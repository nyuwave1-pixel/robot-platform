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
| PHASE 1 시장 조사 | `MARKET_RESEARCH.md` · `STEAM_TOP_GAMES.md` · `GENRE_ANALYSIS.md` · `COMPETITOR_ANALYSIS.md` · `REVENUE_MODEL.md` · `DEVELOPMENT_PRIORITY.md` — 벤치마크 21종 동시접속 실측(Steam API 2026-11-27), SteamSpy 추정, steamrankings 장르 통계 확인. 원자료 `data/steam-snapshot-2026-11-27.json`, 수집기 `tools/indie-studio/collect-steam.mjs` | 완료 |
| PHASE 2 GitHub 감사 | `GITHUB_REPOSITORY_AUDIT.md` · `OPEN_SOURCE_LICENSE_AUDIT.md` · `REUSABLE_SYSTEMS.md` · `OPEN_SOURCE_INTEGRATION_PLAN.md` — 약 72개 저장소(파일 경로는 HEAD에서 확인), GPL 격리 정책 | 완료 |
| PHASE 3·4 게임·엔진 | `TECHNICAL_ARCHITECTURE.md` | 1차 완료 |
| 첫 MVP | ROGUE LEGENDS — 플레이 가능, 규칙 테스트 10개, 브라우저 자동 플레이 오류 0, 리플레이 검증 일치 | **완료 (사람 테스트 전)** |
| PHASE 7 플랫폼 | BIT PARK `docs/STUDIO_PLATFORM_MATRIX.md` (20개 중 12·6·2) | BIT PARK 세션 |
| 포털 등록 | BEAT LAB·TURBO LAP 검증기 등록(BIT PARK, 함수 배포는 사용자 CLI 로그인 대기), ROGUE LEGENDS는 피드에 추가 → BIT PARK 세션이 등록 | 진행 중 |

## 5개 게임 우선순위 (DEVELOPMENT_PRIORITY.md 요약)
1. **ROGUE LEGENDS** — 첫 MVP(완료). 조건: Slay the Spire 2가 장르를 지배 중이라 단순·새로운 규칙 한 가지가 필요 → 화상 반감·방어=공격·리플레이 검증 리그로 차별화, 4–8주 안에 사람 테스트로 계속/중단 판단.
2. **SURVIVAL WORLD** — 시장 상한이 가장 높음(생존 제작 $100K 달성 28%). 섬 지형·멀티 코드 재사용 가능. 지금은 작은 기술 프로토타입만.
3. **LIFE SIMULATION** — 보류(가장 붐비는 장르, 콘텐츠 부담 큼).
4. **PUZZLE UNIVERSE** — BIT PARK가 이미 운영 → 웹 포털 트랙으로 유지(Steam 퍼즐 시장은 약함).
5. **TACTICAL ARENA** — 5v5는 동접이 없으면 죽음 → SPECIAL SOLDIER 안의 모드로 싸게 시험.

## 알려진 한계 (정직하게)
- 사람 플레이 테스트 없음 — 밸런스는 탐욕 봇 기준.
- 그래픽은 직접 그린 SVG(일관된 스타일)이며 일러스트 수준은 아님. 사운드트랙 없음(효과음만 합성).
- 게임패드·Steam Deck 입력, 다국어(영어)는 아직.
- Steam 출시(데스크톱 래핑·Steamworks)는 시장 조사 결론 이후.
