# 무료 게임 에셋 · 오픈소스 출처 카탈로그

게임 세션들이 함께 쓰는 출처 목록입니다. 사용 절차는 [`.claude/skills/free-asset-pipeline/SKILL.md`](../../.claude/skills/free-asset-pipeline/SKILL.md),
세션 역할 분담은 [`STUDIO_HUB.md`](STUDIO_HUB.md)를 따릅니다.

**확인 기준일: 2026-11-19.** "클라우드 접근"은 Claude 클라우드 세션의 네트워크에서 실제로 응답을 받았는지입니다.
라이선스는 사이트 전체가 아니라 **에셋마다 다운로드 시점에 다시 확인**해야 합니다.

## 3D 모델 · 텍스처 · HDRI

| 출처 | 라이선스 | 주 용도 | 클라우드 접근 | 비고 |
|---|---|---|---|---|
| [Poly Haven](https://polyhaven.com) | CC0 | 실사 PBR 텍스처, HDRI, 소품 모델 | ✅ 공개 API `api.polyhaven.com` 응답 | SPECIAL SOLDIER v0.8–0.9 에서 이미 사용 중(`src/assets/tex/CREDITS.txt`) |
| [ambientCG](https://ambientcg.com) | CC0 | 바닥·벽·금속·목재 PBR 1K–8K | ✅ 공개 API `ambientcg.com/api/v2` 응답 | 스크립트로 반복 다운로드 가능 |
| [Quaternius](https://quaternius.com) | CC0 | 로우폴리 캐릭터(리깅+애니메이션), 건물, 차량, 자연 | ✅ 사이트 응답 | 실사 스타일과 섞을 때 스타일 통일 주의 |
| [Kenney](https://kenney.nl/assets) | CC0 | 캐릭터·소품·UI·아이콘·사운드 | ⚠️ 클라우드에서 403 | PC 세션에서 받기 |
| [Sketchfab](https://sketchfab.com) | 모델마다 다름(CC0/CC-BY/NC/유료) | 무기·차량·캐릭터·환경 | — | 로그인 필요. **NC·ND 제외** |
| [Fab](https://www.fab.com) | Fab 라이선스(무료 항목 포함) | UE5 에셋·샘플(Lyra 등) | — | Epic 로그인 필요. UE5 프로젝트 전용으로 취급 |

## 캐릭터 · 애니메이션

| 출처 | 라이선스 | 비고 |
|---|---|---|
| [Mixamo](https://www.mixamo.com) | Adobe 약관: 게임 내 사용 무료, 원본 재배포 금지 | Adobe 로그인 필요 → PC 세션 + Chrome. FBX → Blender에서 GLB 변환·리타깃 |
| [Quaternius](https://quaternius.com) | CC0 | 리깅된 캐릭터 + 기본 애니메이션 세트 |
| UE Game Animation Sample (Fab) | Epic 라이선스 | 500+ 애니메이션, UE5 전용 |

## 사운드 · UI · 기타

| 출처 | 라이선스 | 클라우드 접근 | 비고 |
|---|---|---|---|
| [Freesound](https://freesound.org) | 파일마다 CC0 / CC-BY / CC-BY-NC | ⚠️ 403 | NC 제외. 원본 다운로드는 로그인 필요 |
| [Sonniss GDC Bundle](https://sonniss.com/gameaudiogdc) | 상업 사용 가능, 크레딧 불요(번들 약관 확인) | ⚠️ 403 | 수십 GB 수동 다운로드 → PC |
| [OpenGameArt](https://opengameart.org) | 파일마다 다름 | ✅ | 라이선스 필드 확인 필수 |
| [game-icons.net](https://game-icons.net) | CC-BY 3.0 | ✅ | 크레딧 표기 필요 |
| [itch.io game assets](https://itch.io/game-assets/free) | 팩마다 다름 | — | 팩 설명의 라이선스 확인 |

## GitHub 오픈소스 (검색 API로 확인, 2026-11-19)

| 저장소 | ★ | 라이선스 | 마지막 푸시 | 판단 |
|---|---|---|---|---|
| [tranek/GASDocumentation](https://github.com/tranek/GASDocumentation) | 5,999 | MIT | 2024-04 | UE5 GAS 설계 참고서. 신뢰도 높음, UE 5.4+ 변경분은 별도 확인 |
| [ellisonleao/magictools](https://github.com/ellisonleao/magictools) | 17,824 | MIT | 2026-11 | 활발히 관리되는 게임 개발 리소스 목록 — **목록 출발점으로 추천** |
| [Calinou/awesome-gamedev](https://github.com/Calinou/awesome-gamedev) | 3,229 | CC-BY-SA-4.0 | 2026-08 | 무료·오픈소스 도구/에셋 목록 |
| [madjin/awesome-cc0](https://github.com/madjin/awesome-cc0) | 563 | CC0 | 2024-09 | CC0 출처만 모은 목록 |
| [XistGG/XistCommonGameSample](https://github.com/XistGG/XistCommonGameSample) | 47 | MIT | 2025-12 | UE5 CommonUI/입력 샘플 |
| [motionforge/Unreal-Engine-5-Game-Starter-Template](https://github.com/motionforge/Unreal-Engine-5-Game-Starter-Template) | 29 | MIT | 2026-11 | UE5 스타터. 별이 적어 코드 검토 후 일부만 |
| [A19200332/awesome-game-assets](https://github.com/A19200332/awesome-game-assets) | 1 | **없음** | 2026-11 | 링크 참고만. 내용 복사 금지 |
| [jjones26/free-and-open-source-game-dev-resources](https://github.com/jjones26/free-and-open-source-game-dev-resources) | 0 | **없음** | 2026-03 | 링크 참고만. 내용 복사 금지 |

**Lyra Starter Game**은 GitHub가 아니라 Fab(Epic Games Launcher)에서 받는 Epic 공식 샘플입니다. 이름만 같은 GitHub 저장소는 공식이 아닙니다.

## 추천 조합

- **웹 게임(SPECIAL SOLDIER, 라운지 게임, 퍼즐 게임):** Poly Haven + ambientCG(재질·HDRI) → Quaternius/Kenney(모델·UI) → Mixamo(애니메이션, PC) → OpenGameArt/Kenney 사운드.
- **UE5 프로젝트(Project Leonida 등, `.uproject` 가 있을 때만):** 위 조합 + Fab Lyra + Game Animation Sample + GASDocumentation.

## 2차 조사 추가분 (2026-11-19)

SPECIAL SOLDIER 전용 후보 38건과 Top 10 적용 순서는 PC 세션 보고서 [`apps/special-soldier/docs/ASSET_RESEARCH.md`](../../apps/special-soldier/docs/ASSET_RESEARCH.md)에 있습니다. 아래는 그 보고서에 없는 출처입니다.

| 출처 | 라이선스 | 용도 | 판단 |
|---|---|---|---|
| [KayKit (Kay Lousberg)](https://kaylousberg.itch.io) | 무료판 CC0 (팩마다 itch 페이지 확인) | 로우폴리 캐릭터·던전·소품, 리깅+애니메이션 포함 팩 | 라운지·퍼즐 게임 스타일에 적합. 유료 티어 추가분은 제외 |
| [Poly Pizza](https://poly.pizza) | 모델마다 CC0 또는 **CC-BY**(대부분 CC-BY) | 10,000+ 로우폴리 모델 | 크레딧 대장 필수. API는 키 필요(공식 문서로 확인 후 사용) |
| [Rokoko 무료 모션](https://www.rokoko.com/resources/download-263-rokoko-motion-capture-assets) | 상업 사용 가능(게임 포함) 명시 | 모캡 263종(FBX) | Mixamo 대안 1순위. Blender에서 리타깃 |
| [ActorCore 무료 모션 (Reallusion)](https://actorcore.reallusion.com) | 무료 항목 상업 사용 가능 | 소수 무료 모캡 | 현재 무료 개수는 사이트에서 확인 |
| [CMU Graphics Lab Mocap](http://mocap.cs.cmu.edu) | 사용료 없음, 상업 사용 전 CMU 약관 확인 | 2,500+ 원시 BVH | 정리·리타깃 작업량 큼. 보조용 |
| [Unity Asset Store 무료 에셋](https://assetstore.unity.com) | Standard EULA(타 엔진 사용 허용) / Unity Companion License | Unity 프로젝트 | **공개 GitHub에 원본 커밋 금지**(재배포 불가). 각 PC에서 패키지 매니저로 받기 |
| [glTFast](https://docs.unity3d.com/Packages/com.unity.cloud.gltfast@latest) | Unity 패키지 | Unity에서 GLB 임포트 | Blender 파이프라인 GLB를 Unity와 공유하는 연결 고리 |

### 반영 결정

- **애니메이션:** Mixamo(로그인 필요) 대신 Rokoko 무료 모션을 1순위로, Quaternius/KayKit 내장 애니메이션을 2순위로 둡니다.
- **스타일 축:** SPECIAL SOLDIER(실사 지향) = Poly Haven·ambientCG + 자체 Blender 모델. 라운지·퍼즐(스타일라이즈드) = KayKit·Quaternius·Kenney. 두 축을 한 게임에 섞지 않습니다.
- **CC-BY 출처(Poly Pizza, game-icons.net)** 는 대장에 작성자·URL을 남기고 게임 크레딧 화면에 표시할 수 있을 때만 사용합니다.

출처: [Unity Asset Store 타 엔진 사용 FAQ](https://support.unity.com/hc/en-us/articles/34387186019988-Can-I-use-assets-from-the-Asset-Store-with-other-engines),
[KayKit Block Bits](https://kaylousberg.itch.io/block-bits), [Poly Pizza 소개](https://poly.pizza/docs/press),
[Rokoko 무료 모캡](https://www.rokoko.com/resources/download-263-rokoko-motion-capture-assets), [CG Channel: CMU 데이터베이스](https://cgpress.org/archives/carnegie-mellon-university-motion-capture-database.html)
