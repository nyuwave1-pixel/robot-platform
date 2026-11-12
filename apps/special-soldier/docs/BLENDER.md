# Blender 에셋 파이프라인

게임의 3D 모델은 **Blender 5.3** 파이썬 스크립트로 만들어집니다. 스크립트가 모델을 생성하고, 게임용 `GLB`와
Blender에서 바로 열 수 있는 `.blend`, 그리고 Cycles 렌더 이미지를 내보냅니다.

| 파일 | 내용 |
|---|---|
| `tools/blender/lib.py` | 모델링 헬퍼(베벨 박스, 원기둥, 림, 스윕 튜브, 로프트 메시, 피벗 계층) |
| `tools/blender/weapons.py` | 총기 10종 + 1인칭 팔 |
| `tools/blender/weapons.py` (v0.6 추가분) | 장전 손잡이, 노리쇠 멈치, 조정간, 탄창 멈치, 분해 핀, M-LOK 슬롯, 레이저 표적지시기, 웨폰 라이트+압력 스위치, 접이식 보조 가늠쇠, 소염기 포트, 탄창 리브, 개머리판 조절 레버, QD 슬링 소켓 / 1인칭 팔: 손가락 마디가 있는 전술 장갑, 소매 커프·포켓, 손목 GPS |
| `tools/blender/models.py` | 병사, 침투 보트, 헬기, APC, 나무, 야자수, 바위, 소품 4종, **트럭, 감시탑, 통신탑, 레이더, 가로등, 벽·지붕 패널 4종 (v0.4)**, **실내 소품 9종(책상·서버랙·캐비닛·발전기·탱크·콘솔·침상·탄약상자·바리케이드), 대전차 장애물, 항만 크레인, 화물선 (v0.5)**, **절벽 바위·철조망 펜스·방폭문·창틀·시료 받침대·깃대·관제탑 캡·부두 (v0.6)**. 병사는 v0.6에서 카고 포켓, 무릎 보호대, 드롭레그 홀스터, MOLLE 웨빙, 탄입대+탄창, 무전기·PTT, IFAK, 수류탄, 배낭 스트랩·안테나·급수관, 헬멧 고글·턱끈·붐 마이크·배터리 파우치, 장갑·소매 포켓·패치를 추가(14.2k tris) |
| `tools/blender/build.py` | 전체 빌드 → GLB / .blend / 렌더 |
| `blender/special_soldier_assets.blend` | **결과물. Blender 5.3에서 열어 수정 가능** |
| `src/assets/assets.glb` | 게임이 로드하는 파일(번들에 인라인) |

## 내 PC의 Blender 5.3에서 열기 / 다시 빌드하기 (Windows)

`.blend` 열기: Blender 실행 → File → Open → `apps\special-soldier\blender\special_soldier_assets.blend`

스크립트로 전체 재생성(저장소의 `apps\special-soldier` 폴더에서):

```bat
"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" --background --python tools\blender\build.py
```

렌더를 건너뛰려면 끝에 `-- --no-render` 를 붙입니다. 이후 `npm run build` 로 게임에 반영됩니다.

Blender에서 직접 모델을 고친 경우에는 File → Export → glTF 2.0 (.glb) 로 `src\assets\assets.glb` 에 덮어쓰면 됩니다
(Format: glTF Binary, +Y Up 체크). **오브젝트 이름과 부모-자식 구조는 유지해야 합니다** — 게임이 이름으로 찾습니다.

## 게임이 찾는 노드 이름

| 에셋 | 노드 | 용도 |
|---|---|---|
| `Soldier` | `body` › `legL` `legR` `upper` › `head` `arms` › `gun` | 걷기·앉기·조준 애니메이션 피벗, 무기 부착점 |
| | `acc_helmet` `acc_nvg` `acc_cap` `acc_beret` `acc_hood` `acc_visor` `acc_heavy` | 병종별 장구(게임이 종류에 맞는 것만 사용) |
| `W_m4` … `W_gl` | `mag` `pump` / 빈 오브젝트 `muzzle` `sight` `gripL` | 재장전·펌프 동작, 총구 화염 위치, 조준선 높이, 왼손 위치 |
| `Heli` | `rotor` `tail` `light` | 회전, 점멸등 |
| `APC` | `turret` | 포탑 회전 |
| `Tree` `Palm` | `trunk` `canopy` | 인스턴싱(잎은 바람 셰이더) |
| `P_crate` `P_barrel` `P_sandbags` `P_container` | — | 1×1×1 단위 큐브 안에 모델링 → 게임이 충돌 박스 크기로 스케일 |
| `P_wall_concrete` `P_wall_metal` `P_wall_wood` `P_roof` | — | 단위 큐브 패널. 벽 한 구간에 약 4 m 간격으로 타일링(충돌체는 구간당 1개) |
| `Truck` `Watchtower` `CommsTower` `LampPost` | — | 실제 크기 모델, 원점 = 지면 중심. 충돌체는 게임이 따로 둠 |
| `Radar` | `base` `dish` | 받침대와 회전하는 반사판 |

머티리얼 이름 `cloth` `vest` `skin` `helmet` 은 게임에서 병종 팔레트 색으로 바뀝니다.

## 축 / 단위

Blender: 정면 −Y, 위 +Z, 미터. glTF로 내보내면 정면 +Z, 위 +Y.

## 실사화 개선 (v0.2)

| 항목 | 방법 | 위치 |
|---|---|---|
| 앰비언트 오클루전 | Blender에서 모델 전체에 레이캐스트(정점당 22방향) → 정점 컬러 `COLOR_0`로 내보냄 → 게임이 색에 곱함 | `lib.py: Asm.build`, `assets.js: withColor` |
| 환경광·반사(IBL) | 현재 날씨의 하늘 그라디언트 + 해/달을 PMREM 환경맵으로 필터링, 프리셋이 바뀔 때 재생성 | `sky.js: refreshEnv` |
| 표면 디테일 | 직물·금속·도장 타일링 노멀맵(캔버스 생성) | `models.js: detailNormal` |
| 표면 텍스처 (v0.3) | Blender가 모든 메시에 미터 단위 박스 투영 UV를 생성 → 게임이 타일링 맵을 곱함: 군복·조끼 = 3톤 위장 무늬, 차량·총기·소품 = 때·얼룩·긁힘 | `lib.py: Asm.build`, `models.js: detailMap` |
| 바다 | 환경맵 반사(거칠기 0.3 / 금속성 0.45) | `sky.js` |
| 화면 공간 AO | GTAO 패스 — 설정에서 켜는 **실험 옵션**(High/Ultra). 실제 GPU에서 검증하지 못해 기본값은 꺼짐 | `sky.js: Post` |

렌더 예시: `docs/screenshots/blender-*.jpg`(Blender Cycles), `docs/screenshots/game-blender-*.jpg`(게임 화면).

**실사 수준은 아닙니다.** 실사에 가까워지려면 스캔/스컬프트 기반 메시, 4K PBR 텍스처 세트, 스켈레탈 애니메이션이 필요하며
이는 이 스크립트 방식의 범위를 벗어납니다(연결된 AI 3D 생성 도구를 쓰는 방법은 크레딧이 들어 보류했습니다).

## 한계 (정직하게)

- 형상은 프리미티브 조합 + 베벨/스윕/로프트로 만든 **하드서피스 수준**입니다. 스컬프팅·리토폴로지·하이폴리 베이크는 없습니다.
- 텍스처는 **코드로 생성한 타일링 패턴**(위장·때)이며 사진/스캔 기반 PBR 텍스처 세트가 아닙니다. UV는 박스 투영이라 이음새가 있습니다.
- **리깅/스키닝 없음** — 병사는 관절이 분리된 강체 파츠이며 애니메이션은 게임 코드가 피벗을 돌립니다.
- 지형, 유리, 지하 시설의 바닥·천장·서버 랙·책상, 화물선, 항구 크레인은 아직 게임 코드의 박스 지오메트리입니다. 건물 벽은 패널 모델을 타일링한 것이라 창틀·문짝 같은 개별 디테일은 없습니다.

## 이 저장소의 에셋은 어디서 만들어졌나

클라우드 세션은 사용자 PC의 Blender에 직접 접속할 수 없어서, 같은 버전인 `bpy 5.3.0`(Blender를 파이썬 모듈로 빌드한 공식 패키지)을
Linux에서 헤드리스로 실행해 만들었습니다. 같은 스크립트가 PC의 Blender 5.3에서도 그대로 돌아가도록 작성되어 있지만,
**Windows의 Blender에서 실행해 본 것은 아닙니다.**

## v0.7 — 병사 종류별 캐릭터 키트와 거리 LOD

| 종류 | Blender 노드 | 위장 패턴 |
|---|---|---|
| 아군 분대 | `acc_helmet` `acc_nvg` `acc_pack` | multi (다색) |
| SENTRY 경계병 | `acc_cap` `acc_shades` `acc_guard` (쉬마그, 선글라스, 어깨 무전기, 진압봉, 손전등) | khaki |
| ASSAULT 돌격병 | `acc_helmet` `acc_mask` `acc_assault` `acc_pack` (발라클라바, 밀폐 고글, 가슴 나이프, 섬광탄, 로프) | urban (디지털) |
| SNIPER 저격수 | `acc_hood` `acc_ghillie` (길리 스트립 70개, 드래그백, 거리측정기) | woodland |
| HEAVY 중화기병 | `acc_helmet` `acc_heavy` `acc_shield` `acc_jugg` (방폭 안면 실드, 목 보호대, 탄약 배낭+급탄 슈트, 상완 장갑) | solid |
| COBRA ELITE | `acc_helmet` `acc_visor` `acc_gasmask` `acc_elite` (방독면, 이중 안테나 무전 팩, 어깨 장갑, 상태 LED) | tiger |
| COMMANDER VIPER | `acc_beret` `acc_visor` `acc_heavy` `acc_boss` `acc_cigar` (롱코트 자락, 금색 견장·식서, 약장, 시가) | solid |

- `Asm.detail(True)` 로 추가한 부품은 `<노드>__d` 자식으로 내보내지고, 게임은 카메라에서 34 m(줌 배율 반영) 넘으면 숨긴다(`lodSoldier`). 측정값: 병사 1인 근거리 약 1.3–1.7만 → 원거리 0.76–0.96만 tris. 총기의 레일 톱니·M-LOK 등도 같은 방식.
- 위장 패턴은 `detailMap('camo:<style>')` 절차 생성이며 종류마다 재질 1개를 공유한다.

## v0.8 — 무료 CC0 사진 텍스처 (Poly Haven)

- `python3 tools/blender/textures.py` 가 Poly Haven(CC0, 계정·API 키 불필요)에서 모래·숲바닥·암석·콘크리트·녹슨 철·목재·골함석 7종을 받아 Blender 이미지 파이프라인으로 512 px 색상/노멀 JPEG와 지형용 색조 정규화 맵을 만든다 → `src/assets/tex/` (1.3 MB, 출처는 `CREDITS.txt`).
- 지형은 정점 속성 `splat`(모래·풀·암석·콘크리트 가중치)으로 4종을 섞고 정점 색이 색조를 준다(`src/world/textures.js`). 박스 재질(`MAT.concrete/dark/metal/wood/sand/rust/rock`)은 사진 세트를 쓴다.
- Blender 모델(병사·소품·나무)의 표면은 여전히 정점 색 + 절차 생성 디테일 맵이다.
