# UE5 본 제작 아키텍처 (설계 문서 — 미구현)

> 이 문서는 **설계**입니다. 현재 개발 환경에 Unreal Engine이 없어 아래 내용은 컴파일·실행으로 검증되지 않았습니다.
> 프로토타입(`apps/special-soldier`)에서 검증된 게임 규칙을 UE5로 옮기는 기준선으로 사용합니다.

## 1. 프로젝트 구조

```
SpecialSoldier/
├─ SpecialSoldier.uproject          # UE 5.4+ (Lumen, Nanite, VSM, World Partition 기본 사용)
├─ Config/  DefaultEngine.ini · DefaultGame.ini · DefaultInput.ini · DefaultGameplayTags.ini
├─ Source/
│  ├─ SSCore/        # 게임 프레임워크: GameInstance, GameMode, PlayerState, SaveGame, 설정
│  ├─ SSCombat/      # 무기, 탄도, 피해, GAS AttributeSet/GameplayEffect
│  ├─ SSAI/          # AIController, StateTree 태스크, EQS 제너레이터, 분대 매니저
│  ├─ SSMission/     # 미션 데이터 에셋, 목표 컴포넌트, 체크포인트
│  └─ SSUI/          # Common UI 위젯 베이스, HUD 뷰모델(MVVM)
├─ Plugins/ GameplayAbilities · EnhancedInput · CommonUI · PCG · Water · MotionWarping · ControlRig · Niagara · Metasound
└─ Content/
   ├─ Maps/  L_Island (World Partition) · L_Facility (레벨 인스턴스) · L_MainMenu
   ├─ Characters/ Weapons/ Vehicles/ Environment/ VFX/ Audio/ UI/ Cinematics/ Data/
```

## 2. 프로토타입 → UE5 대응표

| 프로토타입 모듈 | UE5 클래스/시스템 | 비고 |
|---|---|---|
| `core/ctx.js` `G` | `USSGameInstance` + `UGameInstanceSubsystem` 들 | 시스템 간 직접 참조 금지 원칙 유지 |
| `game/player.js` | `ASSCharacter : ACharacter` + `USSCharacterMovementComponent` | 슬라이드/엎드리기는 커스텀 무브먼트 모드, 네트워크 예측 포함 |
| `core/input.js` | Enhanced Input (`IMC_OnFoot`, `IMC_Drone`) | 키 리바인딩은 `UEnhancedInputUserSettings` |
| `config/weapons.js` | `USSWeaponData : UPrimaryDataAsset` + DataTable | 수치 그대로 이관, CSV 내보내기로 밸런스 시트와 동기화 |
| `game/weapons.js` | `ASSWeapon` + GAS `GA_Fire / GA_Reload / GA_ADS` | 반동은 Control Rig 절차적 + 카메라 모디파이어 |
| `game/fx.js` 탄도 | `USSProjectileSubsystem`(데이터 지향 풀) 또는 `UProjectileMovementComponent` | 근거리 히트스캔 폴백, 원거리 시뮬레이션 |
| 피해/방어구 | GAS `USSAttributeSet(Health, Armor, Stamina)` + `GE_Damage` + 피지컬 머티리얼별 부위 배율 | |
| `game/enemies.js` | `ASSAIController` + **StateTree**(Patrol/Suspicious/Search/Combat/Retreat) + `UAIPerceptionComponent`(Sight, Hearing, Damage) | 엄폐는 EQS(`EQS_FindCover`) + Smart Object |
| 분대 경보/증원 | `USSSquadSubsystem` + GameplayMessage | |
| `game/squad.js` | 아군 StateTree + 커맨드 휠 | |
| `game/gear.js` | GAS 어빌리티 + 포스트 프로세스 머티리얼(NVG/Thermal, 커스텀 스텐실) | 드론은 `ASSDronePawn` 포제션 |
| `game/missions.js` | `USSMissionData`(데이터 에셋) + `USSObjectiveComponent` + `ASSGameMode` | 목표 타입 5종 동일 |
| `game/cinematics.js` | Level Sequence + Cine Camera Actor, Take Recorder | 보트 침투는 `LS_BoatInfiltration` |
| `world/world.js` 지형 | Landscape(2 km²) + World Partition + HLOD | 프로토타입 하이트맵을 16-bit PNG로 내보내 초안으로 사용 |
| `world/build.js` | 모듈러 킷 + Packed Level Actor, 식생은 **PCG** 그래프 | |
| `world/sky.js` | SkyAtmosphere, Volumetric Cloud, Exponential Height Fog, **Water**, Niagara 날씨 | 날씨 프리셋은 `USSWeatherData` |
| `core/audio.js` | **MetaSounds** + Sound Attenuation + Audio Volume(실내 리버브) | |
| `ui/hud.js`, `ui/menu.js` | **Common UI** + UMG, MVVM 뷰모델 | |
| `core/save.js` | `USSSaveGame` + `UGameUserSettings` | |

## 3. 렌더링/최적화 계획
- Nanite: 모든 스태틱 메시·식생. Lumen: 야외 SW 레이트레이싱, 지하 시설은 HW RT 옵션.
- Virtual Shadow Maps, 야간 미션은 로컬 라이트 수 예산(화면당 섀도 캐스팅 ≤ 8).
- World Partition 스트리밍 + HLOD, 지하 시설은 레벨 인스턴스로 분리해 오클루전 비용 차단.
- 텍스처 스트리밍 풀 예산, 셰이더 순열 감축, PSO 프리캐싱(프로토타입의 셰이더 워밍업에 해당).
- 업스케일러: TSR 기본, DLSS/FSR 플러그인 **검토 항목**(미검증).
- 목표: 1080p High 60 fps(중급 GPU), 1440p 120 fps(상급 GPU) — **목표치이며 측정값이 아님**.

## 4. 네트워크(확장)
- 데디케이티드 서버 권한, Iris 리플리케이션, GAS 예측 키.
- 히트 판정: 서버 리와인드(틱별 히트박스 기록), 클라 발사 타임스탬프 검증.
- 치트 방지: 서버 측 연사·탄약·이동 검증, 관련성(relevancy) 기반 적 위치 은닉, EAC 연동 검토.

## 5. 이행 단계 (Phase)

| Phase | 내용 | 프로토타입에서 가져올 것 |
|---|---|---|
| 01 | 프로젝트/모듈/CI, 그레이박스 Landscape | 하이트맵, 구역 좌표(`POI`) |
| 02 | 캐릭터 무브먼트·카메라·입력 | 속도·스태미나·자세 수치 |
| 03 | 보트 시퀀스·상륙 | 샷 리스트 6컷, 자막 |
| 04 | 무기·탄도·GAS 피해 | `weapons.js` 테이블, DPS 테스트 |
| 05 | AI StateTree·퍼셉션·EQS | 상태 전이 규칙, 인지 수치 |
| 06 | 환경 아트(5개 구역) | 레이아웃 |
| 07 | 미션 5개·보스 | 목표 스크립트 |
| 08 | HUD·메뉴·장비 | 화면 구성 |
| 09 | 오디오·시네마틱 고도화 | — |
| 10 | 최적화·QA·패키징(Win64 Shipping) | e2e 체크리스트 |
