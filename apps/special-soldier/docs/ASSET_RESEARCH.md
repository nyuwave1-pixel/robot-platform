# 무료 에셋·오픈소스 조사 보고서 (2026-11-19)

범위: SPECIAL SOLDIER(Three.js + Vite, Blender 5.3 스크립트 → GLB). 엔진은 바꾸지 않는다. 라이선스는 **CC0 + CC-BY**(사용자 결정).
이 문서는 **조사만** 한 결과다. 내려받거나 게임에 적용한 것은 없다.

표기: **[확인]** 오늘 웹페이지·GitHub API에서 직접 확인 · **[미확인]** 사이트 차단(403) 또는 검색 요약만 봄 · **[판단]** 의견.

## 1. 사이트별 라이선스

| 사이트 | 라이선스 | 형식 | 적합도 [판단] |
|---|---|---|---|
| Quaternius https://quaternius.com | 팩마다 CC0 [확인] | FBX/OBJ/Blend, 일부 glTF | 높음. 캐릭터는 툰 비율이라 병사와 다름 |
| Kenney https://kenney.nl/support | 전 에셋 CC0 [확인] | [미확인] | 효과음·UI 높음, 3D는 캐주얼해 낮음 |
| Poly Haven https://polyhaven.com/license | CC0 [확인], 스크래핑 금지 | HDR/EXR, PBR | 매우 높음(이미 사용 중) |
| ambientCG https://docs.ambientcg.com/license/ | CC0 1.0 [확인] | 1K–8K zip | 높음. 위장무늬 소재는 없음(검색 0건) [확인] |
| game-icons.net https://game-icons.net/about.html | **CC BY 3.0**, 출처 표기 필수 [확인] | SVG 약 4,180개 | 높음. 크레딧 화면 필요 |
| Poly Pizza https://poly.pizza | 모델마다 CC0 / CC BY 3.0 [확인] | FBX/glTF | 검색용. 작가가 섞여 스타일 위험 |
| Sketchfab | 모델마다 다름 [확인] | glTF | CC0·CC BY만. NC/ND/Standard 제외 |
| Fab https://www.fab.com/eula | Standard는 타 엔진 가능, 단독 재배포 금지 [확인]. 웹 빌드 추출 조항 [미확인] | — | **Standard 권장 안 함**. CC-BY 항목만 개별 확인 |
| Mixamo | 약관 페이지 403 [미확인]. 포럼 요약: 게임 포함 허용, 원본 재배포 금지 | FBX | **권장 안 함**: 공개 저장소·단일 HTML 빌드가 원본 재배포에 해당할 위험 |
| Sonniss GDC https://sonniss.com/gdc-bundle-license/ | 상업 무료·표기 불필요, **효과음 자체 재배포 금지** [확인] | WAV | **권장 안 함**(공개 저장소에 원본 WAV) |
| Freesound https://freesound.org/help/faq/ | 파일마다 CC0/BY/BY-NC/Sampling+ [확인] | WAV/FLAC | 높음. "Free Cultural Works" 필터 사용 |
| OpenGameArt | 403 [미확인]. CC0·BY·**BY-SA**·GPL 혼재 | OGG/WAV | 중간. 페이지별 확인 필요. BY-SA는 범위 밖 |
| itch.io | 팩마다 다름 | 다양 | 낮음~중간 |

## 2. 후보 (38건)

### 3D·애니메이션
| 이름 / URL | 라이선스 | 용도·위험 [판단] |
|---|---|---|
| Universal Animation Library https://quaternius.com/packs/universalanimationlibrary.html | CC0 [확인], 120+ 동작, GLB 있음 | 병사 애니메이션 원천. 소총 동작 포함 여부 [미확인] |
| UAL 2 https://quaternius.com/packs/universalanimationlibrary2.html | CC0 [확인] | 소총 동작 없음. 회피·구르기 정도 |
| Character Soldier https://poly.pizza/m/PpLF4rt4ah · SWAT https://poly.pizza/m/Btfn3G5Xv4 | Quaternius CC0 [확인] | 리깅 참고용(툰 스타일) |
| Soldier https://poly.pizza/m/XT8jgwSesV | KolosStudios **CC BY 3.0** [확인] | 표기 필요, 스타일 미확인 |
| Ultimate Guns Pack https://quaternius.com/packs/ultimategun.html | CC0 [확인] | 참고용(기존 12정이 더 정밀) |
| Animated Guns Pack https://quaternius.com/packs/animatedguns.html | CC0 [확인] | 재장전 타이밍 참고 |
| Toon Shooter Game Kit https://quaternius.com/packs/toonshootergamekit.html | CC0 [확인] | 스타일 불일치, 권장 안 함 |
| Animated Tanks Pack https://quaternius.com/packs/animatedtanks.html | CC0 [확인] | 전차 추가 시 후보 |
| Free CC0 Guns & Explosives https://3dmodelscc0.itch.io/free-cc0-guns-explosives-pack | CC0 [확인], 154 MB | 투척물 형태 참고, 용량 큼 |
| Kenney Watercraft / Survival / Blaster Kit | CC0 [확인] | 캐주얼 스타일, 배경 소품 정도 |

### HDRI (Poly Haven, CC0)
- 낮: kloofendal_48d_partly_cloudy_puresky https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky [확인], aristea_wreck_puresky, farm_field_puresky [API 확인]
- 일몰: belfast_sunset_puresky, evening_road_01_puresky [API 확인]
- 야간: qwantani_night_puresky, kloppenheim_02_puresky, qwantani_moonrise_puresky, moonless_golf, satara_night_no_lamps [API 확인]
- 위험 [판단]: 1K HDR도 수 MB일 수 있음(크기 미확인). 단일 HTML 빌드는 측정 후 결정.

### 텍스처 (CC0)
hessian_230/380(모래주머니), rough_linen·poly_wool_herringbone(군복 직조 노멀) — Poly Haven [확인] ·
Fabric061(조끼·웨빙), PaintedMetal006(차량 도장), Concrete034, MetalPlates006, Ground037 — ambientCG [확인].

### 효과음·음악
| 이름 / URL | 라이선스 | 용도 |
|---|---|---|
| Kenney Impact Sounds https://kenney.nl/assets/impact-sounds · UI Audio · Music Jingles | CC0 [확인] | 탄착음, 메뉴, 성공/실패 징글 |
| Freesound Explosion_01 https://freesound.org/people/tommccann/sounds/235968/ | CC0 [확인] | 폭발 |
| Freesound Heavy Machine Gun https://freesound.org/people/ShawnyBoy/sounds/165394/ · Gunshot 4 https://freesound.org/people/ShawnyBoy/sounds/166191/ | CC0 [확인] | 기관총, 총성 트랜지언트 층 |
| Freesound Helicopter https://freesound.org/people/alegemaate/sounds/413655/ · Bell 407 https://freesound.org/people/bzamecnik/sounds/348991/ | CC0 [확인] | 헬기 |
| Freesound Sounds of war 01 https://freesound.org/people/frankum/sounds/387140/ | CC0 [확인] | 원거리 교전 앰비언스 |
| Freesound 발소리 콘크리트 https://freesound.org/people/florianreichelt/sounds/459964/ · 자갈 https://freesound.org/people/PotatokingXII/sounds/352870/ | CC0 [확인] | 발소리 |
| OGA free firearm sound library https://opengameart.org/content/the-free-firearm-sound-library | CC0 추정 [미확인] | 총성 묶음 |
| OGA QaziJamJam orchestral battle theme https://opengameart.org/content/qazijamjam-orchestral-battle-theme · war theme https://opengameart.org/content/war-theme | CC0 추정 [미확인] | 미션·메뉴 BGM |
| OGA battle music 0 (peastman) | CC BY 3.0 [미확인] | BGM 대안 |
| Incompetech https://incompetech.com/music/royalty-free/licenses/ | CC, 표기 필수, 버전 [미확인] | 메뉴 BGM |

### UI
Kenney Crosshair Pack https://kenney.nl/assets/crosshair-pack (CC0, 200개) · Kenney Game Icons / UI Pack Sci-Fi (CC0) · game-icons.net (CC BY 3.0).

## 3. GitHub

지시서에 적힌 저장소 [GitHub API 확인]:
| 저장소 | 실체 | 판단 |
|---|---|---|
| A19200332/awesome-game-assets | ★1, 라이선스 없음, 짧은 링크 목록 | 가치 낮음. 판매 사이트를 CC0라고 소개하는 항목이 있어 신뢰 불가 |
| jjones26/free-and-open-source-game-dev-resources | ★0, 라이선스 없음 | 가치 낮음 |
| tranek/GASDocumentation · motionforge/Unreal-Engine-5-Game-Starter-Template · XistGG/XistCommonGameSample | 존재, MIT, UE 전용 | **해당 없음**(Three.js) |

이 스택에 맞는 저장소:
| 저장소 | 라이선스·★·최근 푸시 | 해결하는 문제 |
|---|---|---|
| isaac-mason/navcat | MIT · 305 · 2026-11-06 | 순수 JS 내비메시 → 실내 끼임 버그. 단일 HTML 빌드에 유리 |
| isaac-mason/recast-navigation-js | MIT · 441 · 2026-10-30 | Recast WASM, 군중 시뮬레이션 |
| donmccurdy/three-pathfinding | MIT · 1,380 | 경로 탐색만(메시 별도 생성 필요) |
| Mugen87/yuka | MIT · 1,466 | 게임 AI(조향·FSM·지각) |
| donmccurdy/glTF-Transform + zeux/meshoptimizer | MIT · 2,086 / 8,881 | 7 MB GLB meshopt 압축 |
| gkjohnson/three-mesh-bvh | MIT · 3,576 | 사격·시야 레이캐스트 가속 |
| pmndrs/postprocessing · N8python/n8ao | Zlib · 2,985 / CC0 · 519 | 후처리 통합, SMAA, 가벼운 AO |
| pmndrs/detect-gpu | MIT · 1,224 | 품질 프리셋 자동 선택 |
| 0beqz/realism-effects | MIT, 2024-02 이후 정체 | 비추천 |

## 4. 스키닝 캐릭터 / Mixamo 동작 도입 방안 [판단]

현재 병사는 리깅 없는 강체 파츠(피벗 계층)다. 외부 캐릭터로 교체하지 말고:
1. 기존 Blender 병사에 아마추어를 붙이고 부품마다 뼈 하나에 가중치 1을 주는 **강체 스키닝** → 스타일·장구 세분화 유지.
2. 동작 원천은 Mixamo 대신 **Quaternius UAL(CC0)** 을 Blender에서 그 리그로 리타깃, `build.py`가 GLB에 클립을 함께 내보냄.
   Mixamo(Idle/Walk/Run/Crouch/Reload)는 동작 자체는 있지만 원본 재배포 조항 때문에 공개 저장소·단일 HTML 빌드에는 권장하지 않음.
3. 게임: `SkinnedMesh` + `AnimationMixer`, 상체 조준은 척추 뼈를 코드로 덮어씀, `gun`/`gripL`은 손 뼈 기준, 노드 이름 계약·E2E 수정.
4. 비용: 적 수만큼 믹서 CPU, 스킨드 메시 인스턴싱 어려움, `SkeletonUtils.clone` 필요, GLB 증가.

## 5. 우선 적용 Top 10 (효과 대비 작업량) [판단]

1. glTF-Transform meshopt 압축(join/flatten 끄기, 로더에 MeshoptDecoder) → E2E 재실행
2. navcat 내비메시(실내 끼임 해결)
3. CC0 배경음악 2–3곡 + Kenney Music Jingles(현재 BGM 없음)
4. Freesound CC0 녹음 효과음 층(헬기·폭발·발소리·앰비언스, 1 MB 이내)
5. Kenney Impact Sounds + UI Audio
6. Poly Haven pure-sky HDRI 1K 3–4장(용량 측정 후)
7. 직물·도장 텍스처 보강(기존 `textures.py` 파이프라인, 512 px)
8. HUD 아이콘: Kenney Crosshair(CC0) + game-icons.net(CC BY, 크레딧 화면)
9. N8AO 또는 pmndrs/postprocessing(실제 GPU 측정 먼저)
10. 강체 스키닝 + UAL 애니메이션(효과 최대, 작업량 최대)

**권장하지 않음**: Mixamo, Fab Standard, Sonniss GDC, Sketchfab Standard/NC/ND, OGA CC-BY-SA, UE 전용 저장소, Quaternius·Kenney 캐릭터 그대로 투입.

**미확인**: Mixamo 약관 원문, OpenGameArt 전 페이지(403), Kenney 파일 형식, HDRI 파일 크기, Fab EULA 웹 추출 조항, Incompetech 버전.
