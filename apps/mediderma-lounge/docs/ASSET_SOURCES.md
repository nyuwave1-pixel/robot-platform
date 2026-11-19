# 무료 에셋 출처

스튜디오 공용 카탈로그: `docs/game-dev/FREE_ASSET_SOURCES.md`(브랜치 `claude/relaxed-ramanujan-83okpi`). 이 게임에서 실제로 받은 출처만 적습니다.

| 출처 | 받는 방법 (로그인 없음) | 라이선스 확인 위치 |
|---|---|---|
| Quaternius | 팩 페이지의 공개 Google Drive 폴더 → `tools/assets/gdrive.py` 로 파일 ID 단위 다운로드. 웹 목록은 50개까지만 보여 팩 전체가 든 `AllModels.blend` 와 텍스처 폴더를 받는다 | quaternius.com/license.html (CC0), 팩의 `License.txt` — 파일 안의 팩 이름은 "Ultimate Platformer Pack"으로 잘못 적혀 있으나 라이선스 문구는 CC0 1.0 |
| Poly Haven | `api.polyhaven.com/files/{id}` → `dl.polyhaven.org` | polyhaven.com/license (모든 에셋 CC0) |
| ambientCG | `ambientcg.com/api/v2/full_json` → `ambientcg.com/get?file=…_1K-JPG.zip` | ambientcg.com/license (모든 에셋 CC0) |
| OpenGameArt | 에셋 페이지의 `sites/default/files/…` 직접 링크 | **에셋마다** 페이지의 License(s) 칸 — 사용한 6개 모두 CC0 확인 |

다시 받기·가공은 `tools/assets/fetch_free_assets.py` → `tools/assets/build_free_assets.py` → `tools/blender/import_quaternius.py` 순서입니다.
원본(`tools/assets/incoming/`)은 저장소에 올리지 않고, 게임에 쓰는 최적화된 파일만 커밋합니다.
