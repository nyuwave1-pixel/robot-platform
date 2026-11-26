# 장르 게임 랩 — 오픈소스로 배우고, 하부 섹션으로 만든다

게임 개발 섹션의 하위 섹션입니다. 리듬·레이싱 등 장르별로 **공개된 오픈소스 게임을 조사·학습**하고, 그 장르의 게임을
**하부 섹션(`apps/game-lab/<id>`)으로 바로 만들어 개발**할 수 있게 합니다. SPECIAL SOLDIER(웹·Unity)와는 별개의 작은 게임들입니다.

| 문서·도구 | 용도 |
|---|---|
| [OPEN_SOURCE_CATALOG.md](OPEN_SOURCE_CATALOG.md) | GitHub·커뮤니티 오픈소스 게임 조사 — 장르별, **라이선스는 GitHub API 로 확인**, 우리 판정(재사용/학습만/읽기만), 배울 점 |
| [LAB_INDEX.md](LAB_INDEX.md) | 지금 있는 하부 섹션 목록(자동 생성) |
| `tools/game-lab/new-game.mjs` | 새 하부 섹션 생성기 |
| `tools/game-lab/templates/` | 장르 템플릿: `rhythm`, `racing`, `blank`(그 밖의 장르) + 공통 파일 |
| `tools/game-lab/test-new-game.mjs` | 생성기 자체 시험(모든 템플릿 생성 → 그 게임의 테스트 통과 확인) |

## 새 하부 섹션 만들기

```bash
node tools/game-lab/new-game.mjs --genre rhythm --id my-beat --name "MY BEAT"
```

```bash
cd apps/game-lab/my-beat && node --test tests/*.test.mjs
```

```bash
node tools/portal/export-bitpark-feed.mjs
```

1. 만들기 전에 `docs/game-dev/STUDIO_HUB.md` "작업 중" 표에 `apps/game-lab/<id>` 를 적습니다.
2. 생성기가 `apps/game-lab/<id>/` 에 규칙(`src/core`), 화면(`src/main.js`), 테스트, `game.json`, README, 에셋·코드 대장을 만들고 [LAB_INDEX.md](LAB_INDEX.md) 를 갱신합니다.
3. 실행: 그 폴더에서 `npx --yes serve .` 또는 `python3 -m http.server` (설치 없음, 순수 ES 모듈).
4. 상태는 `game.json` 의 `status`(prototype → playable → polished), 참고한 오픈소스는 `learnedFrom` 에 적고 `--index` 와 피드를 다시 만듭니다.

## 오픈소스를 가져올 때 (라이선스 규칙)

우리 저장소는 **오픈소스 라이선스가 없는(독점) 코드**입니다. 그래서:

| 라이선스 | 할 수 있는 것 |
|---|---|
| MIT · BSD · Zlib · Apache-2.0 · Unlicense · CC0 | 코드 복사 가능 — 그 게임의 `THIRD_PARTY.md` 에 저장소·라이선스·가져온 부분을 적음 |
| LGPL · MPL | 파일 단위·링크 조건이 있음 — 복사 전에 허브와 상의 |
| GPL · AGPL | **학습만** (구조·알고리즘을 읽고 우리 코드로 새로 작성, 코드 복사 금지) |
| CC-BY-NC · 라이선스 없음 · "비상업 무료" | 읽기만 |

에셋(그림·소리·음악·차트·맵)은 코드와 라이선스가 다른 경우가 많습니다(예: 코드는 MIT 인데 스킨·비트맵은 금지). 에셋은 `free-asset-pipeline`
스킬 절차(라이선스 확인 → 대장 → 게임에서 확인)를 따릅니다.

## 지금 있는 하부 섹션 (2026-11-26)

| 게임 | 장르 | 무엇을 담았나 | 확인 |
|---|---|---|---|
| BEAT LAB (`apps/game-lab/beat-lab`) | 리듬 | 4레인(D F J K), Web Audio 시계로 음악·판정 동기화, **난이도 EASY·NORMAL·HARD**(판정 폭이 난이도에 따라 좁아짐 — osu! OD 개념을 보고 새로 작성), **롱노트(홀드)**, 오디오 시계 떨림을 없애는 **SmoothClock**(osu-framework 개념), 콤보·정확도·랭크, 오프셋 보정, 난이도별 최고 기록 | 테스트 10(리플레이 검증 3 포함), 브라우저 플레이 오류 0, 화면 `screenshots/game-lab-beat-lab.png` |
| TURBO LAP (`apps/game-lab/turbo-lap`) | 레이싱 | 닫힌 스플라인 서킷(약 1.2 km), 아케이드 카트 물리, **드리프트 → 미니 터보 2단계**, 스키드 마크, 잔디 감속, 진행도 기반 랩(코스 자르기 무효), AI 3대, 3랩 레이스, **1/60 s 고정 스텝**(같은 입력 = 같은 레이스) | 테스트 8(AI 완주·드리프트·리플레이 검증 포함), 브라우저 플레이 오류 0, 화면 `screenshots/game-lab-turbo-lap.png` |

## 포털 연동 (포인트)

모든 장르 랩 게임은 `src/portal.js` 하나로 두 포털에 결과를 보냅니다(템플릿에 들어 있어 새 게임도 자동).

| 포털 | 보내는 것 | 포인트 규칙 | 상태 |
|---|---|---|---|
| airobotphysical.com (RP) | `{type:"game_result", game, score, rp, mission, grade}` | 등급 S 30 · A 22 · B 15 · C 8 RP. 사이트가 상한 `min(65, rpReward×2)`, 게임당 하루 1회, 게임 주소(origin) 확인 | 게임 등록 PR(airobotverse-) — 병합·배포는 사용자 결정 |
| BIT PARK (PP) | SDK v1 이벤트 `ready` · `levelStart{level}` · `levelClear{level, stars, seconds, proof}` | 서버가 `src/verify.js`로 proof 를 **처음부터 다시 재생**해 확인한 뒤 기록·지급 | verify 준비 완료(게임 DB 등록·score 함수 배포 전) |

- **리플레이 증명(proof)**: BEAT LAB = 차트 seed + 키 누름/뗌 시각(ms), TURBO LAP = 매 틱 입력(5비트, 런렝스). 서버는 클라이언트가 계산한 점수를 믿지 않고
  같은 규칙으로 다시 계산합니다. 브라우저에서 한 곡을 끝까지 친 proof 를 verify 로 돌려 화면 점수와 같은 값(5269)이 나오는 것을 확인했습니다.
- 파일 배치는 BIT PARK 검증 서버 규칙을 따릅니다: `src/logic.js`(규칙, 다른 import 없음) · `src/levels.js` · `src/verify.js`.
- 포털 밖(단독 실행)에서는 아무 메시지도 보내지 않습니다.

다음 단계(음악·그래픽 에셋, 3D 전환, 곡 선택·차트 편집기, 트랙 편집기·고스트)는 카탈로그의 "우리 프로젝트에 바로 쓸 것"을 보고 정합니다.
