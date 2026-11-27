# TURBO LAP

장르: **racing** · 만든 날: 2026-11-26 · 생성기: `tools/game-lab/new-game.mjs`

장르 게임 랩(`docs/game-dev/genres/`)의 하부 섹션입니다. 설치 없이 돌아가는 순수 ES 모듈 게임으로 시작합니다.

## 실행

```bash
cd apps/game-lab/turbo-lap
npx --yes serve . -l 5180        # 또는 python3 -m http.server 5180 — 브라우저에서 http://localhost:5180
node --test tests/*.test.mjs               # 게임 규칙 테스트 (설치 없음)
```

## 구조

| 경로 | 내용 |
|---|---|
| `src/core/` | 엔진 없는 게임 규칙(판정·물리·점수). 테스트는 여기만 봅니다. |
| `src/main.js` | 화면·입력·소리 — 브라우저 전용 |
| `tests/` | `node --test` 규칙 테스트 |
| `game.json` | 랩 목록·BIT PARK 피드가 읽는 메타데이터(상태를 여기서 바꿈) |
| `ASSET_LICENSES.md` | 들여온 에셋 대장 — 대장에 없는 파일은 커밋하지 않음 |
| `THIRD_PARTY.md` | 가져온 오픈소스 코드와 라이선스 고지 |

## 규칙 (요약)

- 오픈소스를 가져오기 전에 `docs/game-dev/genres/OPEN_SOURCE_CATALOG.md` 의 판정을 봅니다: **MIT·BSD·Zlib·Apache·CC0 만 코드 복사**(고지를 `THIRD_PARTY.md` 에), **GPL·AGPL 은 학습만**, NC·라이선스 없음은 읽기만.
- 에셋은 `free-asset-pipeline` 스킬 절차(라이선스 확인 → 대장 → 게임에서 확인).
- 상태 바꾸기: `game.json` 의 `status`(`prototype` → `playable` → `polished`) 후 `node tools/portal/export-bitpark-feed.mjs`.
