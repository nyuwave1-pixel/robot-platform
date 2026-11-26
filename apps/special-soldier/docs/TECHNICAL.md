# SPECIAL SOLDIER — 개발자 기술 문서

대상: 이 프로토타입을 수정·확장하거나 UE5로 이식하려는 개발자.

## 1. 개발 환경 분석 결과

| 항목 | 결과 |
|---|---|
| OS / 런타임 | Linux 컨테이너, Node 22, GPU 없음(헤드리스 Chromium + SwiftShader) |
| Unreal Engine 5 | **설치되어 있지 않음** → UE5 프로젝트의 컴파일·실행 검증 불가 |
| 저장소 | `robot-platform`(Next.js 앱). 게임은 독립 패키지 `apps/special-soldier/` 로 분리, 루트 빌드에 영향 없음 |
| 선택한 스택 | Three.js r170 + Vite 5, 순수 ES 모듈(프레임워크 없음), 외부 에셋 0개 |

따라서 "실제 작동을 검증할 수 있는 것만 만든다"는 원칙에 따라 브라우저 프로토타입을 구현했고,
UE5 본 제작은 [`UE5_ARCHITECTURE.md`](UE5_ARCHITECTURE.md) 에 설계로만 남겼습니다.

### 브라우저 프로토타입 vs AAA 최종 게임 — 기술적 한계

| 영역 | 이 프로토타입(WebGL2) | UE5 최종 목표 |
|---|---|---|
| 지오메트리 | 저폴리 + 인스턴싱 + 머지(프레임당 수십만 tri) | Nanite(수억 tri), World Partition 스트리밍 |
| 조명 | 방향광 1 + 반구광 + 포인트 라이트 ~20, 섀도맵 1장 | Lumen GI/반사, Virtual Shadow Maps |
| 물리 | 자체 AABB 충돌·레이캐스트, 파편은 파티클 | Chaos 강체/파괴/차량 |
| 애니메이션 | 절차적(사인파) | 스켈레탈, Control Rig, Motion Warping |
| 오디오 | WebAudio 합성 + HRTF 패너 | MetaSounds, 컨볼루션 리버브, 오클루전 |
| 네트워크 | 없음 | 데디케이티드 서버, 리플리케이션 |
| 업스케일링 | 해상도 스케일만 | DLSS / FSR / TSR |

## 2. 폴더 구조

```
apps/special-soldier/
├─ index.html              # 캔버스 + UI 루트
├─ src/
│  ├─ main.js              # 부트, 상태 머신, 프레임 루프
│  ├─ config/weapons.js    # 무기 데이터 테이블 + DPS 모델 (순수 함수, 테스트 대상)
│  ├─ core/   ctx.js(전역 컨텍스트 G) · input.js · audio.js · save.js · util.js
│  ├─ world/  world.js(지형·충돌·레이캐스트) · build.js(5개 구역) · sky.js(하늘·바다·날씨·포스트)
│  ├─ game/   player.js · weapons.js · fx.js(탄도·폭발·VFX) · enemies.js(AI) · squad.js
│  │          gear.js(전술 장비) · missions.js(캠페인) · cinematics.js · models.js
│  └─ ui/     hud.js · menu.js · style.css
├─ tests/     balance.test.mjs(단위) · e2e.mjs(전체 QA) · plans.mjs/shots.mjs(개발용)
├─ electron/main.cjs       # 데스크톱 래퍼
└─ docs/
```

## 3. 아키텍처

- **전역 컨텍스트 `G`** (`core/ctx.js`): 모든 시스템이 `G.player`, `G.enemies` … 로 등록됩니다. 시스템끼리 직접 import 하지 않으므로
  교체·이식이 쉽습니다(UE5의 GameInstance Subsystem 구조에 대응).
- **상태 머신** (`main.js`): `menu → cinematic → playing ⇄ paused → dead/deadMenu → result`.
- **프레임 순서**(playing): `player → weapons → gear → enemies → squad → fx(탄도) → mission → cine → world → sky → hud → render`.
- **시뮬레이션과 렌더 분리**: `G.tick(dt)` 는 렌더 없이도 호출할 수 있어(`G.skipRender`) 테스트가 게임 시간을 빠르게 진행합니다.
  서버 권한 시뮬레이션으로 옮길 때도 같은 경계를 씁니다.

## 4. 시스템별 설계

### 4.1 지형·충돌 (`world/world.js`)
- 1,200 m 하이트필드(241², 5 m 셀). `rawHeight(x,z)` = 섬 마스크 + fBm 언덕 + 구역 평탄화(`FLATS`).
- 정적 충돌체는 전부 AABB, 16 m 해시 그리드. 약 2,000개(건물 조각, 나무 줄기, 바위).
- `raycast()` = 그리드 DDA(Amanatides–Woo) + AABB 슬랩 테스트 + 지형 레이마칭(이분법 보정). 탄환·시야·수류탄이 공용.
- `moveCircle()` = 축 분리 원-AABB 이동(벽 슬라이딩), `groundAt()` = 지형/상판 높이(계단·감시탑 지원).
- 지하 시설은 y = −60 에 따로 지어져 있고, y < −30 이면 바닥/천장 평면으로 처리합니다.
- 정적 박스는 `finalize()` 에서 머티리얼별로 머지 → 드로콜 감소(HLOD 대용).

### 4.2 탄도·전투 (`game/fx.js`, `config/weapons.js`)
- 모든 사격은 **시뮬레이션되는 발사체**: 초기속도 `vel`, 중력 9.81, 공기저항. 프레임마다 선분 캐스트.
- 피해 = `damageAt(거리)`(선형 감쇠) × 부위 배율(머리 2.6 / 몸통 1.0 / 팔다리 0.72), 몸통은 방어구가 50% 흡수.
- 유리는 관통(파괴 후 진행), 폭발은 반경 감쇠 + 엄폐 뒤 25%, 드럼·차량 연쇄 폭발.
- **DPS 모델**
  - Burst DPS = `dmg × pellets × rpm / 60`
  - Field DPS = `damageAt(d) × pellets × mag × hitChance(d) / (탄창 소진 시간 + 재장전)`
  - `hitChance` 는 게임 내 탄퍼짐 샘플링(원뿔 균등)과 지속 사격 블룸의 정상상태를 그대로 수식화 → 무기고 화면과 `npm test` 가 같은 함수를 씁니다.

### 4.3 플레이어·무기 (`game/player.js`, `game/weapons.js`)
- 반동: 발당 수직 킥의 55%는 영구 상승, 45%는 자동 복귀. 수평은 연사 길이에 따라 좌우로 흔들림.
- 탄퍼짐 = lerp(지향, 조준) × 자세 × 이동 × 공중 + 블룸 + 제압.
- Sprint-to-fire 지연, ADS 시간, 이동 속도는 무기 무게에 비례.
- 엄폐: 앉기/엎드리기 상태에서 허리 높이 이상 물체에 붙으면 `inCover` — 적 명중률 감소, ADS 시 피킹.

### 4.4 적 AI (`game/enemies.js`)
- **인지**: 시야 거리(야간·자세·날씨·난이도 보정) × 시야각 × 가시선, 발소리/총성/폭발 청각. 인지 게이지가 1이 되면 교전.
- **상태**: `PATROL → SUSPICIOUS → SEARCH → COMBAT ↔ RETREAT`.
- **전술**: `cover`(엄폐·피킹) / `push`(엄폐 전진) / `flank`(측면 우회+수류탄) / `suppress`(제압 사격) / `hold`(저격·포탑).
- **분대**: 첫 발견 시 48 m 내·같은 분대에 경보 전파. 발견자가 5초 생존하면 무전으로 증원 호출(미션별 `alarm()`).
- **엄폐 탐색**: 주변 충돌체 중 위협 반대편 지점을 점수화(EQS 대용).
- **LOD**: 400 m 밖 비교전 적은 갱신 생략, 130 m 밖은 인지 틱 0.45 s.
- 이동은 조향+벽 슬라이딩이며 **내비메시가 없습니다**(알려진 한계: 복잡한 실내에서 끼일 수 있음 → 재계획으로 완화).

### 4.5 미션 (`game/missions.js`)
미션은 데이터입니다: `{code, name, sky, spawn, brief, intro, setup(), objectives[], alarm(), unlocks}`.
목표 타입 `kill | reach | interact | defend | custom` + `start/tick/done` 훅. 목표 완료마다 체크포인트.

새 미션 추가: `MISSIONS` 배열에 객체 하나를 추가하면 캠페인·브리핑·기록 화면에 자동 반영됩니다.

### 4.6 시네마틱 (`game/cinematics.js`)
샷 리스트 시퀀서: `{dur, from, to, look | cam(k), fov, text, radio, start(), update(k,dt)}`. Enter/Space 로 스킵.

### 4.7 날씨·렌더링 (`world/sky.js`)
프리셋(`night/dawn/storm/dusk/facility`) 간 보간. 포스트: Bloom → 최종 패스(NVG/열화상/비네트/피격/수중/페이드) → 톤매핑.

## 5. 설정·저장
`localStorage['special-soldier-save-v1']`: 진행도, 로드아웃, 미션 기록, 누적 통계, 설정.
그래픽: 품질(Low/Medium/High/Ultra — 픽셀 비율·섀도 해상도·블룸), 해상도 스케일 50–150%, FOV, 섀도, 프레임 제한(30/60/120/무제한).

## 6. 성능 설계
GPU 인스턴싱(식생 4종), 정적 지오메트리 머지, 파티클·예광탄·데칼 풀링, AI 거리 LOD, 부트 시 셰이더 워밍업,
설정 변경 시 섀도 토글에만 셰이더 재컴파일. 측정값은 [`QA_REPORT.md`](QA_REPORT.md) 참고(검증된 수치만 기재).

## 7. 테스트
- `npm test` — DPS 모델 단위 테스트 9개.
- `npm run test:e2e` — 프로덕션 빌드를 헤드리스 Chromium에서 실행: 메뉴 전 버튼, 설정, 조작, 무기, 장비, AI, 사망/체크포인트, **캠페인 5개 미션 완주**, 성능 측정. 결과는 `tests/out/report.json` + 스크린샷.
- 디버그 훅: `?test` 쿼리(포인터 락 없이 조작), `window.SS`(= `G`), `SS.godMode`, `SS.noTarget`.

## 8. 멀티플레이어 (v0.22)
OPERATIONS → MULTIPLAYER 에서 방을 만들고 초대 링크(`?mp=방코드`)로 다른 사람을 부릅니다. 모드: **1v1 DUEL**(7킬, 5분), **TEAM DEATHMATCH**(최대 15 v 15, 50킬, 10분). 전장은 BLACK COBRA 기지(SQUAD 07 남문 / BLACK COBRA 북쪽 끝 스폰).

| 파일 | 역할 |
|---|---|
| `src/net/authority.js` | 규칙의 유일한 결정자: 팀 배정·정원, 피격 검사, 사망·점수·리스폰(4초, 스폰 보호 2초), 시간·점수 종료, 호스트 이전. three.js·DOM 없음 → 브라우저와 Node 서버가 같은 코드 실행 |
| `src/net/transport.js` | 같은 인터페이스의 두 전송: **Supabase Realtime**(서버 없음, 방의 첫 플레이어가 호스트) / **WebSocket**(전용 서버) |
| `src/net/mp.js` | 클라이언트: 위치 전송, 다른 플레이어 보간 표시, 내 총알의 명중 → 판정 요청, 판정 결과 적용 |
| `src/ui/mp.js` | 로비(방 만들기·참가·팀 변경·모드·초대 링크), 경기 HUD(점수·시간·킬 피드·리스폰·TAB 점수판·결과) |
| `server/mp-server.mjs` | 전용 서버 `npm run mp:server` (PORT 기본 8787, `GET /health` 통계) |

**다른 슈팅 게임과 같은 방식**
- *권한 서버*: 체력·점수는 Authority만 바꿈. 클라이언트는 "맞췄다"는 요청만 보냄 → 아군 사격·스폰 보호·데미지 상한(300)·발사 위치 오차(9 m+이동)·초당 데미지 상한(1,600)·사거리 검사 후 적용. 거절은 `rejected` 로 집계.
- *클라이언트 명중 판정 + 서버 확인*("쏜 사람 우선"): 내 화면에서 맞으면 맞은 것으로 요청 → 지연이 있어도 조준한 대로 맞음.
- *명중 지점 검증 + 지연 보상*(v0.23): 요청에 탄착점과 사수 눈 위치를 담음. 탄착점이 표적의 최근 0.6초 위치 중 하나의 몸통 기둥(반경 1.2 m, 발 −0.4 ~ +2.2 m) 안이어야 하고, 눈 위치가 사수 보고 위치와 3.5 m 이내, 눈→탄착점 선이 섬 지형(`terrain.js`의 `rawHeight`) 아래로 지나가지 않아야 함 — 언덕 너머 사격·허공 사격·위치 위조 거절. 전용 서버와 브라우저 호스트가 같은 검사.
- *스냅샷 보간*: 다른 플레이어를 보고 주기 1.5배(최소 100 ms) 과거 시점으로 두 보고 사이를 부드럽게 그림, 늦으면 25 %까지 외삽.
- *전용 서버 일괄 스냅샷*: 50 ms 틱마다 각 클라이언트에 전원 상태 1개 메시지(배열 압축) — N×N 중계 대신.
- *호스트 이전*: Supabase 방에서 호스트가 나가면 다음으로 오래된 플레이어가 마지막 로스터로 경기를 이어 감.

**전송량 한도(중요)**
- Supabase 무료: 프로젝트당 초당 100 이벤트, 월 200만 메시지(보낸 1 + 받은 사람 수만큼 집계). 위치 전송을 `80 ÷ 인원` Hz(최대 15 Hz)로 맞춤 → 1v1 약 60 메시지/초(월 한도로 1v1 약 9시간). **8명 초과는 전용 서버 권장.**
- 15 v 15는 전용 서버로: 부하 테스트(`tests/mp-load.mjs`, 봇 30명·60초)에서 틱 최대 4 ms / 50 ms, 플레이어당 수신 약 33 KB/s, 31번째 접속 거절, 킬 60건 전원 수신.
- 전용 서버는 아직 인터넷에 올리지 않음(호스팅 필요: Fly.io·Render·Railway 등 WebSocket 지원 서비스). 로컬/사내망에서는 `npm run mp:server` 후 로비의 DEDICATED SERVER에 `ws://주소:8787`.

**아직 없는 것**: 건물·벽 관통 검사(지형만 검사 — 건물 충돌체는 서버에 없음), 수류탄·장비(멀티에서 끔), 다른 맵·모드, 매치메이킹, 계정·랭킹.

## 9. Windows PC 빌드
웹 번들을 Electron으로 감싼 데스크톱 빌드 스크립트가 있습니다.

```bash
npm install --save-dev electron @electron/packager
npm run build:win      # → release/SpecialSoldier-win32-x64/SpecialSoldier.exe
```

상태: 패키징 결과와 검증 범위는 [`QA_REPORT.md`](QA_REPORT.md) §Windows 빌드에 기록했습니다.
