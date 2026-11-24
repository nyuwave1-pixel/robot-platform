# BIT PARK 포털 연동 — GAME DEV LAB 섹션

BIT PARK 포털(별도 저장소 `bitpark-portal`, PC의 `C:\개발\bitpark-portal`)에 이 저장소의 게임 개발 현황을 보여 주는
**GAME DEV LAB** 섹션을 붙이기 위한 약속(계약)입니다. 포털은 이 저장소를 **읽기만** 하고, 이 저장소는 포털 파일을 고치지 않습니다.

## 데이터

| 파일 | 만드는 법 | 내용 |
|---|---|---|
| `docs/game-dev/bitpark/feed.json` | `node tools/portal/export-bitpark-feed.mjs` | 프로젝트별 버전·테스트 결과, Unity 슬라이스 상태, 학습 과정(공식 코스 3·코드 단원 12·다음 과제), 무료 에셋 출처·GitHub 프로젝트, 최근 개발 기록 40건 |
| `docs/game-dev/screenshots/*.png` | PC Unity 세션이 촬영 | Unity 슬라이스 화면 |
| `apps/unity-studio/Builds/WebGL/` | `run-batch.ps1 -WebGL` (PC, Unity 필요) | 브라우저에서 바로 플레이하는 Unity 슬라이스. **커밋하지 않음** — 포털이 PC에서 복사 |

`feed.json` 의 모든 수치는 테스트 보고서(`QA_REPORT.md`, `UNITY_SETUP.md`)·문서·Git 기록에서 자동으로 읽습니다. 손으로 고치지 말고 스크립트를 다시 실행하세요.
`schemaVersion` 이 바뀌면 필드 구조가 바뀐 것입니다.

## 필드 (schemaVersion 1)

```text
section            { id: "game-dev-lab", title, subtitle, honesty }
projects[]         { slug, name, engine, version?, status?, tests{...}, playable?{ windows, webgl|null } | { web, portal, rpMessage }, screenshots[], docs[] }
pipeline           { steps[], sources[{name,url,license}], openSource[{repo,url,stars,license,verdict}], claudeUnityLiveControl: "done"|"pending" }
learning           { courses[{title,duration,practice,url}], units[{unit,files,learn}], next[{task,feature,resource}] }
devlog[]           { hash, date, area, subject }      // 게임 관련 경로만, 최신순
source             { repo, branch, commit }           // 어느 커밋에서 만든 데이터인지
```

## 포털에서 보여 줄 것 (제안)

1. **현황 카드** — 웹 SPECIAL SOLDIER(버전·E2E), Unity 슬라이스(EditMode·PlayMode). `null` 이면 "측정 전"으로 표시하고 숫자를 지어내지 않습니다.
2. **Unity 슬라이스 플레이** — `playable.webgl` 이 있을 때만 "브라우저에서 플레이" 버튼. 없으면 스크린샷과 "PC 빌드" 안내.
3. **학습 로드맵** — 공식 무료 코스 3개 → 코드 단원 12개 → 다음 과제(타임라인).
4. **무료 에셋 파이프라인** — 단계 + 출처·라이선스 표(CC0 강조, CC-BY는 크레딧 필요 표시).
5. **개발 로그** — `devlog` 최근 항목.

## 갱신 순서

```bash
git pull
```

```bash
node tools/portal/export-bitpark-feed.mjs
```

포털 쪽에서는 자기 `collect-content` 스크립트가 이 파일과 스크린샷(필요하면 `Builds/WebGL`)을 복사하도록 합니다.

## airobotphysical.com 연동

웹판 SPECIAL SOLDIER는 airobotphysical.com `/games/play/special-soldier/` 에서 iframe으로 열립니다(`playable.portal`).
미션을 마치면 게임이 부모 창에 `{type:"game_result", game:"special-soldier", score, rp, mission, grade}` 를 보내고, 사이트가 로그인 사용자에게 RP를 적립합니다(하루 1회). RP: S 60 · A 45 · B 30 · C 15 (사이트 상한 65).
사이트의 GAME DEV LAB 섹션은 이 `feed.json` 을 복사해 씁니다(`src/data/gamedev-lab.json`). 게임을 바꾼 뒤 피드를 다시 만들고 사이트 쪽 복사본도 갱신하세요.
