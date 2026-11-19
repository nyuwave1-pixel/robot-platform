# 게임 개발 스튜디오 허브 — 세션 역할과 연결 방식

여러 Claude 세션이 같은 지시서(무료 에셋 + 오픈소스 통합)를 나눠 맡고, 이 저장소를 통해 결과를 주고받습니다.
지시서 본문: [`.claude/skills/free-asset-pipeline/SKILL.md`](../../.claude/skills/free-asset-pipeline/SKILL.md) ·
출처 목록: [`FREE_ASSET_SOURCES.md`](FREE_ASSET_SOURCES.md)

## 역할

| 세션(앱의 제목) | 실행 위치 | 맡는 일 |
|---|---|---|
| **게임 개발 학습** | 클라우드 | 허브. 지시서·출처 카탈로그·라이선스 기준 관리, 세션 간 작업 배분과 결과 검토 |
| **Special Soldier FPS 게임 개발** | 클라우드 | SPECIAL SOLDIER(Three.js)에 CC0 에셋 적용: Poly Haven·ambientCG 재질/HDRI, Quaternius 모델, 사운드. e2e 테스트·스크린샷·성능 측정 |
| **SPECIAL SOLDIER — PC Blender 빌드** | 사용자 PC | Windows Blender 5.3으로 `tools/blender/build.py` 실행 검증, FBX→GLB 변환, Mixamo 리타깃(Chrome 로그인), Kenney·Sketchfab 등 로그인/403 출처 다운로드 |
| **퍼즐 게임** | 사용자 PC | 같은 파이프라인으로 퍼즐 게임 UI·아이콘·사운드(Kenney UI/Audio, game-icons.net) 적용 |
| **메디더마라운지게임** | 클라우드 | WORLD PLAZA(라운지)에 Quaternius/Kenney 스타일 에셋 적용, 기존 Blender 맵과 스타일 통일 |

UE5 전용 항목(Lyra, GAS, Nanite, Lumen)은 `.uproject` 가 있는 프로젝트(Project Leonida 등)가 이 저장소나 PC에 생겼을 때만 적용합니다.

## 연결 규칙

1. **공유 지점은 Git 브랜치입니다.** SPECIAL SOLDIER는 `claude/relaxed-ramanujan-83okpi`. 작업 전 `git pull`, 작업 후 커밋·푸시.
   같은 파일을 두 세션이 동시에 고치지 않도록 아래 "작업 중" 표에 먼저 적습니다.
2. **넘길 일은 이 문서의 "요청" 표에 적고 커밋**합니다(예: 클라우드 → PC: "Mixamo Rifle Idle/Walk/Run FBX 받아 `tools/assets/incoming/` 에").
   받은 세션은 처리 후 상태를 바꿉니다.
3. **에셋은 라이선스 대장과 같은 커밋에** 들어갑니다(`docs/ASSET_LICENSES.md` 등). 대장에 없는 파일은 병합하지 않습니다.
4. **완료 보고는 증거와 함께**: 테스트 출력, 전후 스크린샷 경로, 측정값. 못 한 일은 못 했다고 적습니다.

## 작업 중

| 세션 | 대상 파일/폴더 | 시작일 |
|---|---|---|
| | | |

## 요청

| 요청 세션 → 담당 세션 | 내용 | 상태 |
|---|---|---|
| 허브 → PC Blender | Windows Blender 5.3에서 `build.py -- --no-render` 실행 결과(성공/오류 로그) 기록 | **완료** 2026-11-19 — 종료 0, 120,132 tris·51 assets·GLB 7,168 kB(v0.12). 렌더·charsheet도 정상. 기록: `apps/special-soldier/docs/BLENDER.md` |
| 허브 → Special Soldier | `docs/ASSET_LICENSES.md` 등 대장 4종 생성(기존 `CREDITS.txt` 이관), 1차 CC0 에셋 10종 선정·적용 | **PC Blender 세션이 진행 중**(사용자 지시 2026-11-19) — 클라우드 세션은 완료 후 E2E 회귀를 맡아 주세요 |
| 허브 → PC Blender | Mixamo 병사 기본 동작(Idle/Walk/Run/Crouch/Reload) 다운로드 가능 여부 확인 — 현재 병사는 리깅이 없어 리타깃 설계 필요 | **조사만 완료, 다운로드 보류**(사용자 결정: 조사 보고서 먼저). Mixamo는 원본 재배포 조항 때문에 공개 저장소·단일 HTML 빌드에 비권장 → Quaternius UAL(CC0) + 강체 스키닝 방안 제안. `apps/special-soldier/docs/ASSET_RESEARCH.md` §4 |
