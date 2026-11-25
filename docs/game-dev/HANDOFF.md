# 게임 개발 인수인계 — 어느 PC에서든 이어서 하기

마지막 갱신: 2026-11-25 · 작업 브랜치 `claude/relaxed-ramanujan-83okpi` (초안 PR #31, `main` 미병합)

이 문서 하나로 "지금 어디까지 왔고, 다른 PC에서 무엇부터 하면 되는지" 알 수 있게 합니다.
누가 어떤 파일을 고치는 중인지는 [STUDIO_HUB.md](STUDIO_HUB.md), 새 PC 설치는 [NEW_PC_SETUP.md](NEW_PC_SETUP.md).

## 1. 받기 (처음 한 번)
| 무엇 | 방법 |
|---|---|
| 이 저장소만 | `gh repo clone nyuwave1-pixel/robot-platform` → `git checkout claude/relaxed-ramanujan-83okpi` → `cd apps/special-soldier && npm ci` |
| **게임 전부 + BIT PARK 포털** | `gh repo clone nyuwave1-pixel/bitpark-portal C:\개발\bitpark-portal` → `scripts\setup.ps1` (macOS·Linux `bash scripts/setup.sh`). 게임 19종 저장소가 옆 폴더로 받아지고 설치됨. 목록: bitpark-portal `content/workspace.json`, 설명: bitpark-portal `docs/WORKSPACE.md` (PR #1 병합 후) |
| 설치 없이 | GitHub Codespaces (`.devcontainer/`) |
| 클라우드 세션 | 환경 `robot-platform` (설치 스크립트가 `pip install bpy==5.3.0` + `npm ci`) |

매일 시작: `git pull` (포털 폴더에서는 `npm run ws:status` → `npm run ws:pull` 로 모든 게임 저장소 한 번에).

## 2. 현재 상태
| 영역 | 위치 | 상태 | 확인 방법 |
|---|---|---|---|
| SPECIAL SOLDIER 웹 | `apps/special-soldier` | **v0.22**: 캠페인 5미션 + BOOT CAMP, 순서 자유 목표(미션 02·03), 정보 아이템 15개, 온라인 멀티(1v1·최대 15v15), HUD 표시 설정, 브리핑 작전 지도 | `npm test`(33), `node tests/e2e.mjs`(66), `CAMPAIGN_ONLY=1 node tests/e2e.mjs`(17), `node tests/mp.mjs`, `MP=supabase node tests/mp.mjs`, `node tests/mp-load.mjs` |
| 멀티 전용 서버 | `apps/special-soldier/server` | 코드·Docker·Fly.io 설정 완료, **인터넷에 아직 안 올림** | `npm run mp:server` → `ws://localhost:8787/health` |
| Unity판 | `apps/unity-studio` | 미션 01–03 이식, 병사 애니메이션(Quaternius UAL), 공용 섬 지형·식생, WebGL 빌드 (PC 세션 담당) | [UNITY_SETUP.md](UNITY_SETUP.md), `run-batch.ps1` (Windows + Unity 라이선스) |
| 공용 섬 | `apps/special-soldier/src/world/{terrain,vegetation}.js` | 웹이 원본, Unity가 같은 결과(픽스처 테스트) | 바꾼 뒤 `gen-terrain-fixture.mjs`·`gen-vegetation-fixture.mjs` → `dotnet test "apps/unity-studio/CoreTests~"` |
| 공개 사이트 | https://special-soldier.vercel.app | v0.20 표시 중. v0.21–v0.22는 Vercel 하루 배포 한도로 대기 → 11/26 09:12 UTC 자동 재배포 예약 | 사이트 메뉴 하단 버전 |
| airobotphysical.com | 저장소 `airobotverse-` | `/games/play/special-soldier/` + GAME DEV LAB 섹션 (PR #3 병합, 운영 반영) | 미션 완료 시 RP 적립(`game_result` postMessage) |
| BIT PARK 포털 | 저장소 `bitpark-portal` | GAME DEV LAB 피드 읽음. 모든 게임 작업 공간(`npm run ws:*`) PR #1 | 이 저장소 `docs/game-dev/bitpark/feed.json` — 게임 바꾼 뒤 `node tools/portal/export-bitpark-feed.mjs` |

## 3. 다음 할 일 (우선순위)
1. **결정 필요**: PR #31을 `main`에 병합할지 (코드 테스트는 통과, Vercel 쪽 실패는 배포 한도·다른 프로젝트).
2. **결정 필요**: 멀티 전용 서버 호스팅(Fly.io·Render·Railway 계정) — 공개 15v15에 필요. 그 전까지 공개 사이트는 Supabase 방식(최대 8명 권장).
3. 시점 전환 미션(헬기 사수 / 드론 지원) — 남은 마지막 로드맵 항목 (`apps/special-soldier/docs/GAME_DESIGN.md` §10.3).
4. 사람 플레이 테스트(실제 GPU·인터넷 2인 대전) — 자동 테스트는 SwiftShader·로컬에서만 함.
5. 막힌 것: Gemini 키(400), Flow 영상, PC 원격 연결 없을 때의 Unity 작업.

## 4. 규칙 (요약)
- 작업 전 `git pull`, 끝나면 push. 다른 세션과 겹치는 파일은 STUDIO_HUB "작업 중" 표에 먼저 적기.
- 에셋은 무료·라이선스 대장과 같은 커밋 (`free-asset-pipeline` 스킬).
- SPECIAL SOLDIER 웹은 Three.js 유지, Unity는 별도 판.
- 비밀값(API 키)은 저장소·채팅에 넣지 않음 — 클라우드 환경의 Network secrets 또는 PC 환경 변수.
- `dist/`를 테스트 도중에 다시 빌드하지 않기 (E2E가 깨짐).
