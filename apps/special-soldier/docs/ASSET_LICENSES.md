# 에셋 라이선스 대장 (Asset license ledger)

규칙: 이 표에 없는 외부 파일은 게임에 넣지 않는다. 라이선스는 **다운로드 시점에 그 에셋의 페이지에서** 확인한다.
허용: CC0 · 상업 이용이 명시된 라이선스 · CC-BY(출처 표기). 금지: NC, ND(수정 시), 출처 불명, "개인용 무료".
출처 URL과 제작자 상세는 [`ASSET_SOURCES.md`](ASSET_SOURCES.md), 표기 문구는 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md),
코드 의존성은 [`GITHUB_DEPENDENCIES.md`](GITHUB_DEPENDENCIES.md), 후보 조사는 [`ASSET_RESEARCH.md`](ASSET_RESEARCH.md).

## 요약

| 묶음 | 수 | 라이선스 | 표기 의무 | 게임 파일 | 만든 도구 |
|---|---|---|---|---|---|
| Poly Haven 사진 텍스처 (v0.8–0.9, v0.16) | 12 | CC0 1.0 | 없음 | `src/assets/tex/*.jpg` | `tools/blender/textures.py` |
| Freesound 녹음 효과음 (v0.14) | 6 | CC0 1.0 | 없음 | `public/audio/{shot,explosion,heli,battle,step_*}.mp3` | `tools/assets/build_audio.py` |
| Freesound 음악 루프 (v0.14) | 3 | CC0 1.0 | 없음 | `public/audio/music_{menu,stealth,combat}.mp3` | `tools/assets/build_audio.py` |
| 자체 제작 3D 모델 | 53 | 프로젝트 소유 | — | `src/assets/assets.glb` | `tools/blender/*.py` |
| Higgsfield 생성 캐릭터 (분대원) | 1 | Higgsfield 생성물 — 이용 조건은 Higgsfield 약관(Ultra 플랜 계정)을 따름 | 약관 확인 필요 | `src/assets/soldier_hf.glb` | Higgsfield `gpt_image_2_6` → `image_to_3d`(Meshy) → `tools/blender/hf_soldier.py` |

CC-BY 에셋은 아직 없다. 게임 내 크레딧 화면(v0.16, `src/config/credits.js`)이 생겨 이제 game-icons.net 같은 CC-BY 에셋을 넣을 수 있다 — 넣을 때 이 대장과 credits.js 둘 다에 적는다(`tests/credits.test.mjs` 가 검사).

## 행별 대장

| 에셋 | 출처 | 제작자 | 라이선스 | 받은 날 | 원본 SHA-256 | 게임 내 위치 |
|---|---|---|---|---|---|---|
| coast_sand_01 | Poly Haven | Poly Haven | CC0 1.0 | v0.8 | — (텍스처 파이프라인이 재처리) | 지형 모래 |
| forrest_ground_01 | Poly Haven | Poly Haven | CC0 1.0 | v0.8 | — | 지형 풀 |
| rock_face | Poly Haven | Poly Haven | CC0 1.0 | v0.8 | — | 지형 암석 |
| concrete_floor_02 | Poly Haven | Poly Haven | CC0 1.0 | v0.8 | — | 콘크리트 재질 |
| rusty_metal_02 | Poly Haven | Poly Haven | CC0 1.0 | v0.8 | — | 녹 재질 |
| brown_planks_03 | Poly Haven | Poly Haven | CC0 1.0 | v0.8 | — | 목재 재질 |
| corrugated_iron | Poly Haven | Poly Haven | CC0 1.0 | v0.8 | — | 골함석 |
| denim_fabric | Poly Haven | Poly Haven | CC0 1.0 | v0.9 | — | 전투복 직조 |
| metal_plate | Poly Haven | Poly Haven | CC0 1.0 | v0.9 | — | 총기 금속 |
| rusty_painted_metal | Poly Haven | Poly Haven | CC0 1.0 | v0.9 | — | 도장 금속 |
| bark_brown_02 | Poly Haven | Poly Haven | CC0 1.0 | v0.9 | — | 나무 줄기 |
| hessian_230 | Poly Haven https://polyhaven.com/a/hessian_230 | colormass(촬영)·Rico Cilliers(처리) | CC0 1.0 | 2026-11-20 | — (API 1k JPG → 512 px 재처리) | 모래주머니·트럭 덮개 등 소품 재질 클래스 4 (`burlap_t/_n.jpg`) |
| Gunshot 4.wav (#166191) | Freesound | ShawnyBoy | CC0 1.0 | 2026-11-19 | `5ba94bfc…2b36` | 소총류 총성 녹음 층 (`shot.mp3`) |
| Explosion_01.wav (#235968) | Freesound | tommccann | CC0 1.0 | 2026-11-19 | `363b19fb…1c05` | 폭발 (`explosion.mp3`) |
| Helicopter (#413655) | Freesound | alegemaate | CC0 1.0 | 2026-11-19 | `56d6431e…ed09` | 헬기 루프 (`heli.mp3`) |
| Sounds of war 01 (#387140) | Freesound | frankum | CC0 1.0 | 2026-11-19 | `92296378…cb58` | 교전 중 원거리 전투 배경 (`battle.mp3`, 48 s 발췌) |
| Footsteps on concrete (#459964) | Freesound | florianreichelt | CC0 1.0 | 2026-11-19 | `a212ad7c…d486` | 발소리 콘크리트·금속·목재 (`step_concrete1–4.mp3`) |
| Footsteps Dirt Gravel (#352870) | Freesound | PotatokingXII | CC0 1.0 | 2026-11-19 | `75dc7fc5…b3a6` | 발소리 모래·풀 (`step_gravel1–4.mp3`) |
| Action music loop with dark ambient drones (#155139) | Freesound | burning-mir | CC0 1.0 | 2026-11-19 | `63d959c9…43b9` | 메뉴 음악 |
| Loop. An intense cinematic track… (#716157) | Freesound | Lumamorph | CC0 1.0 | 2026-11-19 | `d1bb2725…9d01` | 교전 음악 |
| Suspense Music Loop (#730224) | Freesound | Ncone | CC0 1.0 | 2026-11-19 | `a917a625…6894` | 잠입 음악 |

전체 SHA-256: `tools/assets/audio_sha256.json`(빌드 스크립트가 다시 받을 때 대조). Freesound 파일은 원본 WAV가 아니라 공식 CDN의
128 kbps 미리듣기 MP3다(원본은 로그인 필요). 원본 다운로드 묶음은 저장소에 넣지 않는다(`tools/assets/.cache/`, git 제외).

## 금지·보류 목록 (조사 결과)

Mixamo, Fab Standard License, Sonniss GDC 번들, Sketchfab Standard/NC/ND, OpenGameArt CC-BY-SA — 이유는 `ASSET_RESEARCH.md` §1.
원본 에셋을 게임 빌드 밖에서 재배포·재판매하지 않는다.
| SoldierHF (분대원 캐릭터) | Higgsfield: 디자인 이미지 job aeeef013…, 3D job 415c12a2… | Higgsfield 생성 (사용자 계정) | Higgsfield 약관 | 2026-11-21 | 원본 GLB 9325457879c16c1c… (13.9 MB, 저장소에 넣지 않음) | 분대원 REAPER·NOMAD·ATLAS, 보트 시네마틱 대원 — 컨셉 이미지 `tools/assets/higgsfield/operator_concept.png` |
