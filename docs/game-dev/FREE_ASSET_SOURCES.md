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
