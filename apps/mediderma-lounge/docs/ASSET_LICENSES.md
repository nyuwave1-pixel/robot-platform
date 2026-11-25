# 에셋 라이선스 대장

게임에 들어간 **외부 무료 에셋**을 파일 하나당 한 줄로 기록합니다. 대장에 없는 파일은 넣지 않습니다
(외부 무료 에셋은 모두 CC0, 직접 생성한 에셋은 '자체 생성'으로 표기. `tests/assets.test.ts` 가 `public/tex`, `public/audio`, `public/models/qn_*` · `public/models/real_*` 의 모든 파일이 이 표에 있는지 검사합니다).

- 원본 받기: `python3 tools/assets/fetch_free_assets.py` (공식 출처에서 받고 원본 SHA-256 을 확인)
- 게임용 가공: `python3 tools/assets/build_free_assets.py` · Blender `tools/blender/import_quaternius.py` · `tools/blender/build_real_character.py`
- 출처 설명: [ASSET_SOURCES.md](ASSET_SOURCES.md) · 코드 의존성: [GITHUB_DEPENDENCIES.md](GITHUB_DEPENDENCIES.md) · 고지: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
- 직접 만든 모델(`public/models/` 의 나머지 GLB)은 `tools/blender/build_assets.py` 가 원본이며 외부 에셋이 아닙니다. 제품 이미지 정책은 [LICENSE_AUDIT.md](LICENSE_AUDIT.md).

받은 날짜는 모두 **2026-11-19**, 라이선스는 다운로드 시점에 각 에셋 페이지에서 확인했습니다. 원본 SHA-256 은 `fetch_free_assets.py` 의 `SOURCES` 표에 있습니다.

| 게임 파일 | 원본 에셋 | 제작자 | 라이선스 | 출처 | 게임 안 사용 위치 | 가공 |
|---|---|---|---|---|---|---|
| `public/models/qn_bush_large.glb` | Ultimate Stylized Nature — Bush_Large_Flowers | Quaternius | CC0 1.0 | [quaternius.com](https://quaternius.com/packs/ultimatestylizednature.html) | 월드 광장 둘레 덤불 | 원점 바닥 중앙, 잎·꽃 텍스처 파스텔 보정, 384px WebP |
| `public/models/qn_bush.glb` | 〃 Bush_Flowers | Quaternius | CC0 1.0 | 〃 | 〃 | 〃 |
| `public/models/qn_bush_small.glb` | 〃 Bush_Small_Flowers | Quaternius | CC0 1.0 | 〃 | 〃 | 〃 |
| `public/models/qn_flowerpatch.glb` | 〃 Flower_1~5_Clump, Grass_Large/Small 묶음 | Quaternius | CC0 1.0 | 〃 | 광장 나무 밑·잔디 꽃밭 | 11개 배치해 하나로 합침 |
| `public/models/qn_grass.glb` | 〃 Grass_Large, Grass_Small 묶음 | Quaternius | CC0 1.0 | 〃 | 광장 잔디 풀 무더기 | 4개 배치해 하나로 합침 |
| `public/models/qn_petal.glb` | 〃 Petals_1 | Quaternius | CC0 1.0 | 〃 | 미니게임 PETAL CATCH 꽃잎 | 〃 |
| `public/models/real_female.glb` | Universal Base Characters [Standard] — Superhero_Female_FullBody + Hairstyles(Long·Buns·SimpleParted·BuzzedFemale) | Quaternius | CC0 1.0 | [itch.io](https://quaternius.itch.io/universal-base-characters) | 실사형 캐릭터(여성) — 내 캐릭터·손님·광장 플레이어 | 몸 메시로 상의·반바지·소매·구두를, 몸 단면으로 치마 2종을 Blender 에서 만들어 붙임 · 피부 Light 텍스처 1024px · 헤어 회색조 · WebP |
| `public/models/real_male.glb` | 〃 Superhero_Male_FullBody + Hairstyles(SimpleParted·Buzzed·Long·Beard) | Quaternius | CC0 1.0 | 〃 | 실사형 캐릭터(남성) | 〃 |
| `public/models/real_anims.glb` | Universal Animation Library [Standard] — Idle·Walk·Jog·Sitting_Idle·Idle_Talking·Interact·Dance·Walk_Formal | Quaternius | CC0 1.0 | [itch.io](https://quaternius.itch.io/universal-animation-library) | 실사형 캐릭터 동작 (두 체형 공용 65개 뼈대) | 43개 중 8개 클립만, 뼈대만 내보냄 |
| `public/models/signature.glb` | 시그니처 캐릭터 — 2026-11-20 Higgsfield 에서 직접 디자인(GPT Image 2.6 콘셉트 → Meshy 7 이미지-3D·자동 리깅·동작 5종) | 이 프로젝트 | 자체 생성 (Higgsfield) | 프로젝트 계정의 Higgsfield 생성물 (유료 플랜 · 상업 사용 가능, 서비스 약관 따름) | 실사형 체형 '시그니처' | `tools/blender/build_signature.py`: 동작 GLB 5개를 한 뼈대로 합침 · 텍스처 2048 JPEG → 1024 WebP · meshopt 압축 (4.7MB → 0.8MB) |
| `public/models/guest_mint.glb` | 손님 캐릭터(곱슬머리·민트 블라우스) — 2026-11-21 Higgsfield 에서 직접 디자인(GPT Image 2.6 콘셉트 → Meshy 7 이미지-3D·자동 리깅·동작 4종) | 이 프로젝트 | 자체 생성 (Higgsfield) | 프로젝트 계정의 Higgsfield 생성물 (유료 플랜 · 상업 사용 가능, 서비스 약관 따름) | 실사형 손님·광장 안내 NPC | `tools/blender/build_signature.py guest_mint` · 텍스처 1024 WebP · meshopt 압축 |
| `public/models/guest_lavender.glb` | 손님 캐릭터(단발·라벤더 셔츠 원피스) — 2026-11-21 Higgsfield 에서 직접 디자인(GPT Image 2.6 콘셉트 → Meshy 7 이미지-3D·자동 리깅·동작 4종) | 이 프로젝트 | 자체 생성 (Higgsfield) | 프로젝트 계정의 Higgsfield 생성물 (유료 플랜 · 상업 사용 가능, 서비스 약관 따름) | 실사형 손님·광장 안내 NPC | `tools/blender/build_signature.py guest_lavender` · 텍스처 1024 WebP · meshopt 압축 |
| `public/models/guest_coral.glb` | 손님 캐릭터(금발 포니테일·코랄 스커트) — 2026-11-21 Higgsfield 에서 직접 디자인(GPT Image 2.6 콘셉트 → Meshy 7 이미지-3D·자동 리깅·동작 4종) | 이 프로젝트 | 자체 생성 (Higgsfield) | 프로젝트 계정의 Higgsfield 생성물 (유료 플랜 · 상업 사용 가능, 서비스 약관 따름) | 실사형 손님·광장 안내 NPC | `tools/blender/build_signature.py guest_coral` · 텍스처 1024 WebP · meshopt 압축 |
| `public/models/guest_gentle.glb` | 손님 캐릭터(남성 손님·그레이 폴로) — 2026-11-21 Higgsfield 에서 직접 디자인(GPT Image 2.6 콘셉트 → Meshy 7 이미지-3D·자동 리깅·동작 4종) | 이 프로젝트 | 자체 생성 (Higgsfield) | 프로젝트 계정의 Higgsfield 생성물 (유료 플랜 · 상업 사용 가능, 서비스 약관 따름) | 실사형 손님·광장 안내 NPC | `tools/blender/build_signature.py guest_gentle` · 텍스처 1024 WebP · meshopt 압축 |
| `public/models/pet_shiba.glb` | Ultimate Animated Animals — ShibaInu (glTF, 동작 Idle·Walk·Eating·Idle_2_HeadLow·Jump_ToIdle) | Quaternius | CC0 1.0 | [quaternius.com](https://quaternius.com/packs/ultimateanimatedanimals.html) (같은 팩이 Unity Asset Store 에도 무료 공개) | 라운지 펫 "시바견" | `tools/assets/build_pets.mjs`: 동작 5종만 남김, 키 0.42m, 색 15% 밝게, meshopt 압축 (2026-11-24 받음) |
| `public/models/pet_husky.glb` | 〃 Husky | Quaternius | CC0 1.0 | 〃 | 라운지 펫 "허스키" | 〃 (키 0.46m) |
| `public/models/pet_fox.glb` | 〃 Fox | Quaternius | CC0 1.0 | 〃 | 라운지 펫 "아기 여우" | 〃 (키 0.40m) |
| `public/models/furn_relaxchair.glb` | Furniture Kit 1.0 — loungeChairRelax (OBJ) | Kenney | CC0 1.0 | [opengameart.org](https://opengameart.org/content/furniture-kit) (같은 팩에 Unity 패키지도 포함) | 라운지 가구 "릴랙스 라운지 체어" | `tools/blender/import_kenney_furniture.py`: 라운지 팔레트로 재질 색 변경(패브릭 핑크·나무 밝은 오크·금속 골드), 바닥 중앙 원점·높이 맞춤, meshopt 압축 (2026-11-25 받음) |
| `public/models/furn_cornersofa.glb` | 〃 loungeSofaCorner | Kenney | CC0 1.0 | 〃 | 라운지 가구 "핑크 코너 소파" | 〃 |
| `public/models/furn_ottoman.glb` | 〃 loungeSofaOttoman | Kenney | CC0 1.0 | 〃 | 라운지 가구 "벨벳 오토만" | 〃 |
| `public/models/furn_squarelamp.glb` | 〃 lampSquareFloor | Kenney | CC0 1.0 | 〃 | 라운지 가구 "스퀘어 플로어 램프" | 〃 |
| `public/models/furn_succulent.glb` | 〃 plantSmall2 | Kenney | CC0 1.0 | 〃 | 라운지 가구 "미니 다육이 화분" | 〃 |
| `public/models/furn_radio.glb` | 〃 radio | Kenney | CC0 1.0 | 〃 | 라운지 가구 "레트로 라디오" | 〃 |
| `public/models/furn_glasstable.glb` | 〃 tableCoffeeGlass | Kenney | CC0 1.0 | 〃 | 라운지 가구 "유리 커피 테이블" | 〃 |
| `public/models/furn_coatrack.glb` | 〃 coatRackStanding | Kenney | CC0 1.0 | 〃 | 라운지 가구 "골드 스탠딩 행거" | 〃 |
| `public/models/furn_cushionbench.glb` | 〃 benchCushion | Kenney | CC0 1.0 | 〃 | 라운지 가구 "쿠션 벤치" | 〃 (2026-11-25 2차 추가) |
| `public/models/furn_lowbookcase.glb` | 〃 bookcaseOpenLow | Kenney | CC0 1.0 | 〃 | 라운지 가구 "로우 오픈 책장" | 〃 (2026-11-25 2차 추가) |
| `public/models/furn_drawertable.glb` | 〃 sideTableDrawers | Kenney | CC0 1.0 | 〃 | 라운지 가구 "서랍 사이드 테이블" | 〃 (2026-11-25 2차 추가) |
| `public/models/furn_teatable.glb` | 〃 tableRound | Kenney | CC0 1.0 | 〃 | 라운지 가구 "원형 티 테이블" | 〃 (2026-11-25 2차 추가) |
| `public/models/furn_cactus.glb` | 〃 plantSmall1 | Kenney | CC0 1.0 | 〃 | 라운지 가구 "꼬마 선인장 화분" | 〃 (2026-11-25 2차 추가) |
| `public/models/furn_aloe.glb` | 〃 plantSmall3 | Kenney | CC0 1.0 | 〃 | 라운지 가구 "알로에 화분" | 〃 (2026-11-25 2차 추가) |
| `public/models/furn_pinkrug.glb` | 〃 rugRectangle | Kenney | CC0 1.0 | 〃 | 라운지 가구 "핑크 사각 러그" | 〃 (2026-11-25 2차 추가) |
| `public/models/furn_floorcushion.glb` | 〃 pillow | Kenney | CC0 1.0 | 〃 | 라운지 가구 "바닥 쿠션" | 〃 (2026-11-25 2차 추가) |
| `public/tex/sky_plaza.hdr` | Kloofendal 43d Clear (Pure Sky), 1k | Greg Zaal | CC0 | [polyhaven.com](https://polyhaven.com/a/kloofendal_43d_clear_puresky) | 광장 하늘 배경·반사광 | 원본 그대로 |
| `public/tex/grass_c.jpg` | Grass004 Color | ambientCG (Lennart Demes) | CC0 | [ambientcg.com](https://ambientcg.com/view?id=Grass004) | 광장 잔디·언덕 | 512px, 파스텔 보정 |
| `public/tex/grass_n.jpg` | Grass004 NormalGL | ambientCG | CC0 | 〃 | 광장 잔디 | 512px |
| `public/tex/paving_n.jpg` | Concrete034 NormalGL | ambientCG | CC0 | [ambientcg.com](https://ambientcg.com/view?id=Concrete034) | 광장 돌바닥 표면 질감 | 512px |
| `public/tex/paving_r.jpg` | Concrete034 Roughness | ambientCG | CC0 | 〃 | 〃 | 256px |
| `public/tex/fabric_n.jpg` | Fabric086 NormalGL | ambientCG | CC0 | [ambientcg.com](https://ambientcg.com/view?id=Fabric086) | 라운지 소파 패브릭 질감 | 512px |
| `public/audio/bgm_lounge.mp3` | Apple Cider | Zane Little Music | CC0 | [opengameart.org](https://opengameart.org/content/apple-cider) | 타이틀·라운지 배경음악 | MP3 80kbps |
| `public/audio/bgm_plaza.mp3` | Hot Springs Town | Kistol | CC0 | [opengameart.org](https://opengameart.org/content/hot-springs-town) | 월드 광장 배경음악 | MP3 80kbps |
| `public/audio/amb_birds.mp3` | Park Ambiences — park_ambience_birds | Thimras | CC0 | [opengameart.org](https://opengameart.org/content/park-ambiences) | 광장 새소리 | 36초 루프(끝-처음 교차 페이드), 음량 정규화 |
| `public/audio/amb_water.mp3` | 100 CC0 SFX #2 — loop_water_03 | rubberduck | CC0 | [opengameart.org](https://opengameart.org/content/100-cc0-sfx-2) | 광장 분수 물소리(거리에 따라 음량) | 8초 루프 |
| `public/audio/ui_click.mp3` | Interface Sounds — click_001 | Kenney | CC0 | [opengameart.org](https://opengameart.org/content/interface-sounds) | 모든 버튼 | 모노, 최대 -3dB |
| `public/audio/ui_open.mp3` | 〃 open_001 | Kenney | CC0 | 〃 | 메뉴 패널 열기 | 〃 |
| `public/audio/ui_close.mp3` | 〃 close_001 | Kenney | CC0 | 〃 | 메뉴 패널 닫기 | 〃 |
| `public/audio/reward.mp3` | 〃 confirmation_002 | Kenney | CC0 | 〃 | 코인·스타 보상 | 〃 |
| `public/audio/pickup.mp3` | 〃 glass_001 | Kenney | CC0 | 〃 | 반짝이·꽃잎 획득 | 〃 |
| `public/audio/error.mp3` | 〃 error_004 | Kenney | CC0 | 〃 | 이미 받은 보상 | 〃 |
| `public/audio/heart.mp3` | 〃 maximize_008 | Kenney | CC0 | 〃 | 하트 보내기·받기 | 〃 |
| `public/audio/chime.mp3` | 〃 confirmation_001 | Kenney | CC0 | 〃 | 소원 분수 | 〃 |

## 쓰지 않기로 한 후보

| 후보 | 이유 |
|---|---|
| Quaternius 바위(Rock_1~5) | 짙은 회녹색 텍스처라 파스텔 광장과 어울리지 않음 |
| Poly Haven `kloofendal_48d_partly_cloudy_puresky` | 흐린 하늘이 회색으로 보여 맑은 하늘(43d clear)로 교체 |
| OpenGameArt "Cozy Endless Game Background" | 음악이 아니라 배경 그림 팩이었음 |
| Unity Asset Store 무료 에셋 직접 사용 | 받으려면 Unity 계정 로그인과 Unity 에디터가 필요하고 클라우드에서 받을 수 없음. 같은 제작자가 자기 사이트에 CC0 로 올린 원본(Quaternius 등)을 대신 받음 |
| Quaternius Ultimate Animated Animals 의 나머지 동물(말·소·사슴 등) | 라운지 펫으로 어울리지 않음. 고양이·토끼는 팩에 없어 기존 코드 모델 유지 |
| Kenney Furniture Kit `bear`(곰인형) | 앞에서 보면 육각형 판처럼 보여 곰인형으로 알아보기 어려움 |
| Quaternius Ultimate Home Interior · Ultimate Furniture | 2026-11-25 구글 드라이브 다운로드 한도 초과로 받지 못함. 같은 용도로 Kenney Furniture Kit(CC0, OpenGameArt) 사용 |
| Kenney 원본 사이트·Freesound·Sonniss·Sketchfab·Mixamo | 클라우드에서 403 또는 로그인 필요 — Kenney 사운드는 같은 제작자가 OpenGameArt 에 올린 원본으로 받음 |
