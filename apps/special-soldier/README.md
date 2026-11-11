# SPECIAL SOLDIER — OPERATION: ISLAND INVASION

브라우저(WebGL2)에서 실제로 플레이할 수 있는 3D 밀리터리 FPS **플레이어블 프로토타입**입니다.
보트 침투 시네마틱 → 해안 상륙 → 5개 미션 캠페인(보스전·헬기 탈출)까지 처음부터 끝까지 진행됩니다.

> **이 빌드가 무엇이고 무엇이 아닌지**
> - 엔진: **Three.js r170 + Vite** (개발 환경에 Unreal Engine 5가 없어 UE5 프로젝트는 컴파일/실행 검증이 불가능했습니다).
> - 모든 3D 모델·텍스처·사운드는 **코드로 생성한 임시(placeholder) 에셋**입니다. AAA 최종 품질이 아닙니다 → [`docs/ASSET_LIST.md`](docs/ASSET_LIST.md)
> - UE5 본 제작으로 옮기기 위한 설계는 [`docs/UE5_ARCHITECTURE.md`](docs/UE5_ARCHITECTURE.md) 에 있으며, **설계 문서일 뿐 구현물이 아닙니다.**
> - 멀티플레이어는 구현되어 있지 않습니다(메뉴에 설계 상태만 표시).

## 실행

```bash
cd apps/special-soldier
npm install
npm run dev        # http://localhost:5180
```

```bash
npm run build      # dist/ 정적 번들 (아무 정적 호스팅에 배포 가능)
npm run preview    # http://localhost:5181
npm test           # DPS 밸런스 모델 단위 테스트 (node:test)
npm run test:e2e   # 헤드리스 Chromium 전체 QA (메뉴·조작·AI·캠페인 5개 미션 완주)
```

Windows 데스크톱 빌드(Electron 래퍼)는 [`docs/TECHNICAL.md` §9](docs/TECHNICAL.md) 참고.

## 조작

| 키 | 동작 | 키 | 동작 |
|---|---|---|---|
| W A S D / 마우스 | 이동 / 시점 | 좌클릭 / 우클릭 | 사격 / 조준(ADS, 엄폐 중엔 피킹) |
| Shift | 달리기 | R / V | 재장전 / 사격 모드 |
| Ctrl(C) | 앉기 · 달리는 중엔 슬라이딩 | 1 2 3 · Q · 휠 | 무기 교체 |
| Z / Space | 엎드리기 / 점프·일어서기 | G | 수류탄 |
| E | 상호작용(표시된 곳은 길게) | F / X | 선택 장비 사용 / 장비 변경 |
| N · T · L | 야간투시경 · 열화상 · 전술 라이트 | B | 정찰 드론 |
| H | 의료 키트 | Tab / Esc | 전술 지도 / 일시정지 |

## 구현된 내용

- **시네마틱**: 보트 침투 오프닝(6컷, 무전 자막+음성합성), 미션별 인트로, 통신탑 폭파, 헬기 착륙, 엔딩
- **플레이어**: 걷기/달리기/앉기/엎드리기/슬라이딩/점프, 스태미나, 체력·방어구, 엄폐 판정, 지형별 발소리
- **무기 10종**: AR×3, SMG, 샷건, LMG, 볼트액션·반자동 저격총, 소음 권총, 유탄발사기 — 반동·탄퍼짐·블룸·ADS·사격모드·탄피·총구화염
- **탄도/물리**: 중력+공기저항이 적용된 실탄 시뮬레이션, 거리 감쇠, 부위별 피해, 방어구, 수류탄 바운스, 폭발 충격/카메라 셰이크, 파괴 오브젝트(유리·상자·폭발 드럼·차량·연료탱크)
- **적 AI 7종**: 시야각+가시선+청각 인지, 인지 게이지, PATROL→SUSPICIOUS→SEARCH→COMBAT↔RETREAT, 엄폐 선택·피킹·측면 우회·수류탄, 분대 경보 전파, 무전 증원 호출, APC, 보스(2페이즈)
- **아군 분대 3명**: 대형 추종, 교전 전 사격 통제, 다운/자가 회복
- **섬 맵(1.2 km)**: 해변 / 정글(통신소·폭포·동굴) / 군사기지 / 지하 연구시설 / 비행장·항구
- **날씨/시간**: 야간·새벽 안개비·주간 뇌우·황혼 폭풍·지하, 비·번개·바람(식생 흔들림)·파도
- **전술 장비**: 야간투시경, 열화상, 전술 라이트, 정찰 드론(적 태그), 의료 키트
- **캠페인 5개 미션**: 목표 상태머신, 체크포인트, 결과 화면(등급), 무기·장비 해금, 저장(localStorage)
- **UI**: 메인 메뉴(실시간 3D 배경), 캠페인/작전 기록/무기고(DPS 분석)/오퍼레이터/설정, HUD, 미니맵, 전술 지도

## 문서

- [`docs/TECHNICAL.md`](docs/TECHNICAL.md) — 아키텍처, 시스템별 설계, DPS 모델, 확장 방법
- [`docs/UE5_ARCHITECTURE.md`](docs/UE5_ARCHITECTURE.md) — UE5 본 제작 이행 설계
- [`docs/ASSET_LIST.md`](docs/ASSET_LIST.md) — 임시 에셋 목록과 교체 대상
- [`docs/QA_REPORT.md`](docs/QA_REPORT.md) — 실제 실행 테스트 결과와 알려진 문제
