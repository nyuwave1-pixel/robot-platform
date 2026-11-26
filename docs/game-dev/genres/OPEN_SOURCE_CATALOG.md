# 오픈소스 게임 소스 카탈로그 (장르별)

> 작은 스튜디오가 **배우고**, 라이선스가 허락하는 경우 **재사용**할 수 있는 무료·오픈소스 게임 코드 모음.
> 확인일: **2026-11-26**. 라이선스는 GitHub REST API(`search/repositories`의 `license.spdx_id`)와 저장소의 LICENSE/README 원문으로 확인했다. 자세한 방법은 맨 아래 "검증 방법" 참고.

## 0. 판정 기준 — "우리 독점(proprietary) 프로젝트에 코드를 복사해도 되는가?"

우리 저장소(robot-platform)는 오픈소스 라이선스가 **없는 독점 코드**다. 웹판은 Three.js + Vite(순수 JS), Unity판은 Unity 6(C#, URP).

| 판정 | 해당 라이선스 | 의미 |
|---|---|---|
| **재사용 가능(고지 필요)** | MIT, BSD, Zlib, Apache-2.0, Unlicense, CC0 | 복사·수정 가능. 원 저작권 고지와 라이선스 문구를 `THIRD_PARTY_NOTICES` 등에 남긴다. Apache-2.0은 수정 사실 표기 + NOTICE 파일 유지. |
| **Unity 한정 재사용(UCL)** | Unity Companion License | Unity에 의존하는 프로젝트 안에서만 사용·수정·배포 가능. **Unity판에는 OK, 웹(Three.js)판으로 옮기면 안 됨.** OSI 오픈소스가 아니다. |
| **학습만(코드 복사 금지)** | GPL-2.0/3.0, AGPL-3.0, CC-BY-SA(코드에 적용된 경우) | 읽고 아이디어·알고리즘을 이해하는 것은 자유. 코드를 복사하면 우리 게임 전체를 같은 라이선스로 공개해야 하므로 **금지**. 구현은 처음부터 직접 쓴다(클린룸). |
| **조건부(파일 단위)** | MPL-2.0 | 해당 **파일**을 수정하면 그 파일은 MPL로 공개해야 한다. 우리 파일과 섞지 말고 별도 파일로 두면 독점 코드와 함께 배포 가능. 실무에서는 "학습만"으로 취급하는 편이 안전. |
| **조건부(링크)** | LGPL | 동적 링크 라이브러리로만 사용, 사용자가 교체 가능해야 함. 웹 번들/Unity IL2CPP 빌드에서는 지키기 어려우므로 사실상 "학습만". |
| **읽기만** | CC-BY-NC, "비상업 한정", 커스텀 제한, **라이선스 없음** | 저작권법상 기본적으로 모든 권리 보유. 참고 열람만. |

**에셋은 코드와 라이선스가 다른 경우가 많다.** 코드가 MIT여도 그림·음악·맵·스킨이 상업 이용 불가인 사례가 흔하다. 표마다 "에셋 라이선스" 칸을 따로 둔다. 에셋을 실제로 가져올 때는 `free-asset-pipeline` 스킬의 라이선스 게이트와 장부 절차를 따른다.

표기: ★는 2026-11-26 기준 GitHub 스타(대략). "미확인" = 원문으로 확인하지 못함.

---

## 1. 대작/AAA급으로 공개된 소스

| 이름 | 저장소 URL | 장르 | 언어/엔진 | 코드 라이선스 (spdx, verified) | 에셋 라이선스 | ★ | 우리 판정 | 배울 점 |
|---|---|---|---|---|---|---|---|---|
| DOOM (1993) | https://github.com/id-Software/DOOM | FPS | C | GPL-2.0 | 게임 데이터(WAD)는 미포함·독점 | 20k | 학습만 | BSP 렌더링 + 고정소수점 이동/충돌, 틱 기반(35Hz) 게임 루프 |
| Quake | https://github.com/id-Software/Quake | FPS | C | GitHub spdx 없음 → 원문 `gnu.txt` = GPL-2.0 | pak 데이터 미포함·독점 | 6.1k | 학습만 | 클라이언트 예측 이전 시대의 QuakeWorld 넷코드, PVS 가시성 |
| Quake III Arena | https://github.com/id-Software/Quake-III-Arena | FPS | C | GPL-2.0 | 데이터 독점 | 8.3k | 학습만 | 스냅샷 델타 압축 넷코드, 무기·히트스캔 처리 구조 |
| DOOM 3 / DOOM 3 BFG | https://github.com/id-Software/DOOM-3 · https://github.com/id-Software/DOOM-3-BFG | FPS | C++ | GPL-3.0 (둘 다) | README: "game data is still covered by the original EULA" | 3.6k / 5.4k | 학습만 | 통합 조명·스텐실 그림자, 엔티티/스크립트 분리 구조 |
| Wolfenstein 3D | https://github.com/id-Software/wolf3d | FPS | C/ASM | **미확인** (GitHub spdx null, LICENSE 파일을 찾지 못함) | 데이터 미포함 | 2.6k | 읽기만(확인 전) | 레이캐스팅 렌더러의 원형 |
| C&C Remastered Collection | https://github.com/electronicarts/CnC_Remastered_Collection | RTS | C++ | spdx NOASSERTION → 원문: TiberianDawn.dll/RedAlert.dll/맵 에디터만 GPL-3.0 + EA 추가 조건 | 리마스터 그래픽·음악은 미포함·독점 | 21k (보관됨) | 학습만 | 고전 RTS의 유닛 AI·경로탐색·결정론적 시뮬레이션 |
| C&C Generals / Zero Hour | https://github.com/electronicarts/CnC_Generals_Zero_Hour | RTS | C++ | spdx NOASSERTION → 원문: GPL-3.0 + EA 추가 조건 | 게임 데이터 독점 | 4.8k (보관됨) | 학습만 | 3D RTS의 락스텝 멀티플레이와 리플레이 |
| Unreal Tournament (2014 프리알파) | https://github.com/EpicGames/UnrealTournament | FPS | C++/UE4 | **미확인** (Epic 계정 연동한 사람만 열람, API로 조회 불가). Unreal Engine EULA 적용으로 알려짐 | 동일 | — | 읽기만 | (UE 사용자라면) 무기·이동 구현 참고 |
| 0 A.D. | https://github.com/0ad/0ad | RTS | C++/JS | spdx NOASSERTION → 원문 `LICENSE.txt`: 소스 GPL-2.0+ (일부 MIT/BSD 셰이더) | 아트·오디오 CC-BY-SA-3.0 | 2.8k (GitHub 미러 보관됨) | 학습만 | 게임 로직을 JS 스크립트로 분리한 엔진/모드 구조 |
| Veloren | https://github.com/veloren/veloren | 복셀 RPG | Rust | GPL-3.0 | 미확인(저장소 내 혼합) | 7.7k | 학습만 | ECS(specs) 기반 서버 권위 멀티플레이 |
| Xonotic | https://github.com/xonotic/xonotic | 아레나 FPS | QuakeC/C | spdx NOASSERTION → 원문 `COPYING`: GPL-3.0+ (엔진 DarkPlaces GPL) | 데이터도 GPL 계열(파일별 확인) | 0.6k (주 개발은 GitLab) | 학습만 | 빠른 아레나 무기 밸런스·무브먼트(스트레이프 점프) |
| OpenTTD | https://github.com/OpenTTD/OpenTTD | 경영 시뮬 | C++ | spdx NOASSERTION → 원문 `COPYING.md`: GPL-2.0 | OpenGFX 등 별도(GPL) | 8.5k | 학습만 | 대규모 틱 시뮬레이션과 결정론적 멀티플레이 |
| Mindustry | https://github.com/Anuken/Mindustry | 타워디펜스/자동화 | Java | GPL-3.0 | 저장소 포함(GPL) | 30k | 학습만 | 데이터 주도 블록/유닛 정의, 모바일까지 가는 최적화 |
| Cataclysm: DDA | https://github.com/CleverRaven/Cataclysm-DDA | 로그라이크 | C++ | spdx NOASSERTION → 원문: **코드 포함 CC-BY-SA-3.0** (폰트는 OFL 등) | CC-BY-SA-3.0 | 13.6k | 학습만 (ShareAlike) | JSON 데이터로 아이템·몬스터를 정의하는 방식 |
| Unity Open Project "Chop Chop" | https://github.com/UnityTechnologies/open-project-1 | 액션 어드벤처 | C#/Unity (URP) | **Apache-2.0** | 저장소 전체 Apache-2.0으로 표기(에셋 개별 표기는 미확인) | 6.1k | **재사용 가능(고지 필요)** | ScriptableObject 이벤트 채널, SO 기반 상태 머신 |
| Boss Room | https://github.com/Unity-Technologies/com.unity.multiplayer.samples.coop | 협동 액션 RPG | C#/Unity NGO | spdx NOASSERTION → 원문: **Unity Companion License** | UCL | 2.0k | Unity 한정 재사용(UCL) | Netcode for GameObjects 액션/스킬 동기화 패턴 |
| FPS Sample | https://github.com/Unity-Technologies/FPSSample | FPS | C#/Unity (HDRP, 구버전) | 원문: Unity Companion License | UCL | 5.1k | Unity 한정 재사용(UCL) | 서버 권위 + 클라이언트 예측 FPS 넷코드 구조 |
| Megacity Metro | https://github.com/Unity-Technologies/megacity-metro | 멀티 슈터 | C#/Unity DOTS | README: Unity Companion License | UCL | 1.2k | Unity 한정 재사용(UCL) | DOTS + Netcode for Entities 대규모 접속 |
| Megacity (2019) | https://github.com/Unity-Technologies/Megacity-2019 | 데모 | C#/Unity DOTS | **미확인** (LICENSE 파일·README 표기 못 찾음) | 미확인 | 0.5k | 읽기만(확인 전) | DOTS 스트리밍 데모 |

> UCL 요약: "Licensed under the Unity Companion License for Unity-dependent projects". Unity 엔진에 의존하는 프로젝트에서는 수정·사용 가능하지만, 웹(Three.js)판으로 포팅해 쓰면 조건 위반이다.

---

## 2. 리듬 게임

| 이름 | 저장소 URL | 장르 | 언어/엔진 | 코드 라이선스 (spdx, verified) | 에셋 라이선스 | ★ | 우리 판정 | 배울 점 |
|---|---|---|---|---|---|---|---|---|
| osu! (lazer) | https://github.com/ppy/osu | 리듬 | C#/osu-framework | **MIT** | 리소스는 별도 저장소 `ppy/osu-resources` = **CC-BY-NC-4.0** (상업 불가). "osu!" 상표 사용 불가. 비트맵은 각 제작자·음원 권리 | 19.5k | **재사용 가능(고지 필요)** — 코드만 | 판정 윈도우(`HitWindows.cs`, `ManiaHitWindows.cs`)와 비트맵별 오디오 오프셋 보정(`BeatmapOffsetControl.cs`) |
| osu-framework | https://github.com/ppy/osu-framework | 프레임워크 | C# | **MIT** | — | 2.0k | **재사용 가능(고지 필요)** | 오디오 시계와 렌더 프레임을 맞추는 `Timing/InterpolatingFramedClock.cs` |
| osu-resources | https://github.com/ppy/osu-resources | 에셋 | — | spdx NOASSERTION → 원문 `LICENCE.md`: CC-BY-NC-4.0 | 동일 | 0.3k | 읽기만 | — (상업 게임에 쓰면 안 됨) |
| Etterna | https://github.com/etternagame/etterna | 키보드 리듬(VSRG) | C++/Lua | **MIT** | 기본 테마·노트스킨은 미확인 | 0.7k | **재사용 가능(고지 필요)** | 실력 기반 점수(Wife) 계산과 난이도 산정 — 파일 위치는 미확인 |
| StepMania 5 | https://github.com/stepmania/stepmania | 댄스 리듬 | C++/Lua | GitHub spdx null → 원문 `Docs/Licenses.txt`: MIT 계열(X11) 허용 라이선스 | 곡·테마 개별 확인 필요 | 2.1k | 재사용 가능(고지 필요) — 단 파일별 확인 | `.sm/.ssc` 차트 포맷, BPM 변화·정지(stops) 타이밍 처리 |
| Quaver | https://github.com/Quaver/Quaver | 키보드 리듬 | C# (MonoGame) | **MPL-2.0** | 미확인 | 0.8k | 조건부(파일 단위) → 학습만 권장 | 오토플레이·리플레이 기록과 판정 정밀도 |
| Friday Night Funkin' | https://github.com/FunkinCrew/Funkin | 리듬 액션 | Haxe/HaxeFlixel | spdx NOASSERTION → 원문: 코드 **Apache-2.0** | `funkin.assets` = **독점, All rights reserved** (그림·음악·효과음 배포 금지) | 3.9k | 재사용 가능(코드만, 고지 필요) | 차트 이벤트(카메라·캐릭터 애니)와 노트 판정을 한 타임라인으로 묶는 방식 |
| Psych Engine | https://github.com/ShadowMario/FNF-PsychEngine | FNF 엔진 | Haxe | **Apache-2.0** | FNF 원본 에셋 포함 → 에셋은 독점 | 1.4k (보관됨) | 재사용 가능(코드만) | Lua 모딩 API, 차트 에디터 |
| Codename Engine | https://github.com/CodenameCrew/CodenameEngine | FNF 엔진 | Haxe | **Apache-2.0** | FNF 에셋 독점 | 0.5k | 재사용 가능(코드만) | HScript 기반 스크립팅, 모듈식 노트 타입 |
| webosu | https://github.com/111116/webosu | 웹 리듬 | JavaScript/PixiJS | **MIT** | README: 일부 미디어는 ppy 등 저작물 → 별도 확인 | 0.6k | 재사용 가능(코드만) | **브라우저에서** 오디오와 노트를 맞추는 실전 예 (우리 웹 리듬 프로토타입과 가장 가까움) |
| Bemuse | https://github.com/bemusic/bemuse | 웹 BMS 리듬 | TypeScript | AGPL-3.0 | 미확인 | 1.3k | 학습만 | 웹 오디오 지연 보정 UI, BMS 파서 |
| osu!droid | https://github.com/osudroid/osu-droid | 모바일 리듬 | Kotlin | **Apache-2.0** | osu! 리소스 계열 주의 | 0.7k | 재사용 가능(코드만) | 터치 입력 판정과 모바일 오디오 지연 |
| NoteEditor (Unity) | https://github.com/setchi/NoteEditor | 채보 에디터 | C#/Unity | **MIT** | — | 0.4k | 재사용 가능(고지 필요) | Unity에서 파형을 보며 노트 찍는 채보 툴 |

---

## 3. 레이싱 게임

| 이름 | 저장소 URL | 장르 | 언어/엔진 | 코드 라이선스 (spdx, verified) | 에셋 라이선스 | ★ | 우리 판정 | 배울 점 |
|---|---|---|---|---|---|---|---|---|
| SuperTuxKart | https://github.com/supertuxkart/stk-code | 카트 | C++ | spdx NOASSERTION → 원문 `COPYING`: GPL-3.0+ | 데이터는 GPL/CC-BY/CC-BY-SA/PD 혼합 (`licenses.txt` 파일별) | 5.5k | 학습만 | 카트 물리 + AI 레이싱 라인(드리프트·아이템 사용 판단) |
| HexGL | https://github.com/BKcore/HexGL | 반중력 레이싱 | JavaScript/three.js | **MIT** | README: "code and resources are now licensed under the MIT License" (파일에 별도 표기 없으면) | 1.8k | **재사용 가능(고지 필요)** | three.js로 만든 고속 레이서의 트랙 충돌·카메라 흔들림 |
| pmndrs racing-game | https://github.com/pmndrs/racing-game | 레이싱 | TypeScript/R3F + cannon | **MIT** | README: "CC0 assets only" | 2.2k | **재사용 가능(고지 필요)** | `src/models/vehicle/Vehicle.tsx`의 레이캐스트 차량 + 드리프트 연기·스키드 마크 |
| VDrift | https://github.com/VDrift/vdrift | 시뮬 레이싱 | C++ | GPL-3.0 | 미확인 | 0.4k | 학습만 | 타이어 모델(Pacejka)과 드라이브트레인 시뮬 |
| Stunt Rally | https://github.com/stuntrally/stuntrally3 | 랠리 | C++/Ogre | GPL-3.0 | 미확인 | 0.2k | 학습만 | 트랙 에디터, VDrift 기반 차량 물리 |
| TORCS / Speed Dreams | (SourceForge 호스팅) | 시뮬 레이싱 | C/C++ | **미확인** (GitHub 밖이라 API로 못 봄; GPL로 알려짐) | 미확인 | — | 학습만(확인 전) | AI 로봇 드라이버 인터페이스 |
| Kenney Starter Kit Racing | https://github.com/KenneyNL/Starter-Kit-Racing | 아케이드 레이싱 | GDScript/Godot | **MIT** | Kenney 에셋 (CC0) | 0.5k | **재사용 가능(고지 필요)** | 간단한 아케이드 차량 조작감(구체 기반 차량) |
| Randomation Vehicle Physics | https://github.com/JustInvoke/Randomation-Vehicle-Physics | Unity 차량 물리 | C#/Unity | GitHub spdx null, LICENSE 파일 없음. README에 "MIT License as the rest of the repository" 문구만 있음 | 미확인 | 0.9k | 읽기만(라이선스 파일 확인 전) | 서스펜션·휠 그립 모델 |
| Tork | https://github.com/adrenak/tork | Unity 차량 물리 | C#/Unity | **MIT** | — | 0.4k | 재사용 가능(고지 필요) | WheelCollider 없이 레이캐스트 휠로 구현 |
| Unity Karting Microgame | (Unity Hub/에셋 스토어 배포, GitHub 저장소 없음) | 카트 | C#/Unity | **미확인** | 미확인 | — | 읽기만(확인 전) | 초보용 카트 컨트롤러 |

---

## 4. FPS/슈팅 (우리 슈터와 직접 관련)

| 이름 | 저장소 URL | 장르 | 언어/엔진 | 코드 라이선스 (spdx, verified) | 에셋 라이선스 | ★ | 우리 판정 | 배울 점 |
|---|---|---|---|---|---|---|---|---|
| three.js `games_fps` 예제 | https://github.com/mrdoob/three.js/blob/dev/examples/games_fps.html | 웹 FPS 예제 | JS/three.js | **MIT** | 예제 모델은 개별 확인 | 119k | **재사용 가능(고지 필요)** | `examples/jsm/math/Octree.js` + `Capsule.js`로 캡슐 대 지형 충돌 |
| Dive (Yuka) | https://github.com/Mugen87/dive | 웹 데스매치 AI | JS/three.js + Yuka | **MIT** | 미확인 | 0.1k | **재사용 가능(고지 필요)** | 목표 기반(goal-driven) 봇 AI, 기억·시야 시스템 |
| Yuka | https://github.com/Mugen87/yuka | 게임 AI 라이브러리 | JavaScript | **MIT** | — | 1.5k | **재사용 가능(고지 필요)** | 조향(steering), 내비메시(`src/navigation/navmesh/NavMesh.js`), 퍼지 로직 무기 선택 |
| three-fps | https://github.com/mohsenheydari/three-fps | 웹 FPS | JS/three.js + ammo.js | **MIT** | 미확인 | 0.2k | 재사용 가능(코드만) | 컴포넌트 기반 엔티티 구조와 무기 반동 |
| Enari Engine | https://github.com/iErcann/enari-engine | 웹 멀티 FPS | TypeScript/three.js | **MIT** | 미확인 | 0.3k | 재사용 가능(코드만) | 브라우저 FPS용 클라이언트 예측 구조 |
| Gorescript | https://github.com/gorescript/gorescript | 웹 FPS | JavaScript | **MIT** | 미확인 | 0.4k | 재사용 가능(코드만) | 레트로 FPS 맵 에디터 + 게임 일체형 |
| Red Eclipse | https://github.com/redeclipse/base | 아레나 FPS | C++/Cube 2 | GitHub spdx null → 원문 `doc/license.txt`: **Zlib** | 에셋은 `doc/all-licenses.txt`에 파일별(혼합) | 0.5k | **재사용 가능(고지 필요)** — 코드만 | 파쿠르(월런·대시) 무브먼트와 무기 2차 발사 |
| AssaultCube | https://github.com/assaultcube/AC | 밀리터리 FPS | C++/Cube | GitHub spdx null → 원문: **Zlib 계열** + "다른 라이선스로 재라이선스 금지" 추가 조항 | 미확인 | 1.1k | 재사용 가능(고지 필요) — 단 가져온 파일은 원 라이선스 유지 | 저사양에서도 도는 가벼운 넷코드, 라운드 기반 모드 |
| Xonotic / Quake III | (1절 참고) | 아레나 FPS | C | GPL | 독점/GPL | — | 학습만 | 히트스캔·투사체 무기 분리 설계 |
| FPS Sample / Megacity Metro | (1절 참고) | FPS/슈터 | Unity | UCL | UCL | — | Unity 한정 재사용 | Unity판 멀티 슈터 넷코드 |
| Kenney Starter Kit FPS | https://github.com/KenneyNL/Starter-Kit-FPS | FPS 스타터 | GDScript/Godot | **MIT** | 스프라이트·3D 모델 **CC0** | 1.0k | **재사용 가능(고지 필요)** | 무기 리소스 정의 + 반동/탄 흩어짐 최소 구현 (Unity/웹 포팅 쉬움) |

> 웹 FPS 검색에서 "Krunker 같은" 대형 오픈소스 웹 FPS는 찾지 못했다(Krunker 자체는 비공개). `corosolto/client`(★0.3k)는 AGPL-3.0이라 학습만.

---

## 5. 기타 장르

| 이름 | 저장소 URL | 장르 | 언어/엔진 | 코드 라이선스 (spdx, verified) | 에셋 라이선스 | ★ | 우리 판정 | 배울 점 |
|---|---|---|---|---|---|---|---|---|
| Celeste (Player 클래스) | https://github.com/NoelFB/Celeste | 플랫포머 | C# | **MIT** | README: MIT는 코드만, 상용 게임·에셋은 제외 | 4.0k (보관됨) | 재사용 가능(코드만) | `Source/Player/Player.cs` — 코요테 타임, 점프 버퍼, 대시 상태 머신 |
| SuperTux | https://github.com/SuperTux/supertux | 플랫포머 | C++ | GPL-3.0 | 혼합 | 3.2k | 학습만 | 레벨 에디터와 타일맵 스크립팅 |
| Kenney Starter Kit 3D Platformer | https://github.com/KenneyNL/Starter-Kit-3D-Platformer | 3D 플랫포머 | Godot | **MIT** | CC0 | 1.3k | 재사용 가능(고지 필요) | 3D 카메라 추적 + 점프 감각 |
| Red Runner | https://github.com/BayatGames/RedRunner | 2D 러너 | C#/Unity | **MIT** | 미확인 | 0.9k | 재사용 가능(코드만) | Unity 2D 플랫포머 전체 구조 |
| 2048 | https://github.com/gabrielecirulli/2048 | 퍼즐 | JavaScript | **MIT** | — | 13.5k | 재사용 가능(고지 필요) | 순수 JS 그리드 로직 + 입력/애니메이션 분리 |
| Hextris | https://github.com/Hextris/hextris | 퍼즐 | JavaScript | spdx NOASSERTION → 원문: GPL-3.0 | — | 2.5k | 학습만 | 회전 육각 퍼즐의 난이도 곡선 |
| Kenney Starter Kit Match-3 | https://github.com/KenneyNL/Starter-Kit-Match-3 | 퍼즐 | Godot | **MIT** | CC0 | 0.2k | 재사용 가능(고지 필요) | 매치-3 판정·연쇄 처리 |
| OpenRA | https://github.com/OpenRA/OpenRA | RTS | C# | GPL-3.0 | 원작 데이터는 사용자 소유분 사용 | 17.8k | 학습만 | C#로 된 결정론적 락스텝 RTS (Unity C# 개발자에게 읽기 좋음) |
| Battle for Wesnoth | https://github.com/wesnoth/wesnoth | 턴제 전략 | C++/Lua | GPL-2.0 | GPL/CC-BY-SA | 7.0k | 학습만 | 헥스 전투 AI, WML 데이터 주도 캠페인 |
| 0 A.D. / Mindustry | (1절 참고) | RTS/디펜스 | — | GPL | — | — | 학습만 | — |
| rot.js | https://github.com/ondras/rot.js | 로그라이크 툴킷 | JavaScript | **BSD-3-Clause** | — | 2.7k | **재사용 가능(고지 필요)** | FOV, 던전 생성, 경로 탐색을 웹에서 바로 |
| Shattered Pixel Dungeon | https://github.com/00-Evan/shattered-pixel-dungeon | 로그라이크 | Java | GPL-3.0 | GPL | 6.9k | 학습만 | 모바일 로그라이크의 런 밸런스와 UI |
| Dungeon Crawl Stone Soup | https://github.com/crawl/crawl | 로그라이크 | C++/Lua | spdx NOASSERTION → 원문: GPL-2.0+ | 타일 별도 | 3.1k | 학습만 | 수십 년 다듬은 몬스터·종족 밸런스 데이터 |
| Brogue CE | https://github.com/tmewett/BrogueCE | 로그라이크 | C | AGPL-3.0 | — | 1.5k | 학습만 | 맵 생성(호수·다리 배치) |
| Ikemen GO | https://github.com/ikemen-engine/Ikemen-GO | 격투 엔진 | Go | spdx NOASSERTION → README: 소스 **MIT** | 기본 모티프(스크린팩) CC-BY-3.0 | 1.7k | 재사용 가능(고지 필요) | M.U.G.E.N 호환 히트박스·커맨드 입력 버퍼 |
| OpenBOR | https://github.com/DCurrent/openbor | 벨트스크롤 격투 | C | **BSD-3-Clause** | 게임 모드별 | 1.3k | 재사용 가능(고지 필요) | 벨트스크롤 콤보·잡기 판정 |
| OpenOMF | https://github.com/omf2097/openomf | 격투 (One Must Fall 재구현) | C | **MIT** | 원작 데이터 별도 | 0.5k | 재사용 가능(코드만) | 롤백 이전 방식의 P2P 격투 동기화 |
| DDNet | https://github.com/ddnet/ddnet | 2D 협동 플랫폼 | C++ | spdx NOASSERTION → 원문: Zlib 계열(Teeworlds) | 미확인 | 0.9k | 재사용 가능(고지 필요) | 틱 기반 2D 물리 + 고정밀 넷코드 |
| Open Football Manager | https://github.com/openfootmanager/openfootmanager | 스포츠(축구 매니지먼트) | Rust | GPL-3.0 | — | 1.2k | 학습만 | 경기 시뮬레이션 엔진 |
| ZenGM (Basketball GM 등) | https://github.com/zengm-games/zengm | 스포츠 매니지먼트 | TypeScript | spdx NOASSERTION → 원문: "**This project is not open source!**" (소스 공개만, 경쟁 포크 배포 금지) | — | 0.5k | 읽기만 | 웹 워커 기반 시즌 시뮬레이션 |

> 스포츠 장르는 오픈소스 품질 좋은 **액션** 스포츠 게임이 드물다. 대부분 매니지먼트 시뮬이다.

---

## 6. 엔진·프레임워크 (우리에게 쓸모 있는 것만)

| 이름 | 저장소 URL | 장르 | 언어/엔진 | 코드 라이선스 (spdx, verified) | 에셋 라이선스 | ★ | 우리 판정 | 배울 점 |
|---|---|---|---|---|---|---|---|---|
| three.js | https://github.com/mrdoob/three.js | 3D 렌더러 | JavaScript | **MIT** | 예제 모델은 개별 | 119k | 재사용 가능(고지 필요) — 이미 사용 중 | `examples/`의 게임 예제(FPS, 차량, 물리)가 가장 빠른 참고서 |
| Babylon.js | https://github.com/BabylonJS/Babylon.js | 3D 엔진 | TypeScript | **Apache-2.0** | — | 26k | 재사용 가능(고지 필요) | 내장 물리(Havok 플러그인)·오디오 엔진 구조 비교 |
| Phaser | https://github.com/phaserjs/phaser | 2D 엔진 | JavaScript | **MIT** | — | 41k | 재사용 가능(고지 필요) | 2D 미니게임·UI 씬 관리 |
| PlayCanvas engine | https://github.com/playcanvas/engine | 3D 엔진 | JavaScript | **MIT** | — | 17k | 재사용 가능(고지 필요) | ECS 스크립트 컴포넌트, 웹 최적화 |
| Godot | https://github.com/godotengine/godot | 범용 엔진 | C++ | **MIT** | — | 121k | 재사용 가능(고지 필요) | Kenney 스타터 킷을 열어보는 용도 |
| Rapier (rapier.js 포함) | https://github.com/dimforge/rapier | 물리 | Rust → WASM | **Apache-2.0** (`dimforge/rapier.js`는 보관됨, JS 바인딩은 본 저장소로 통합; npm `@dimforge/rapier3d-compat` 0.21.0도 Apache-2.0) | — | 6.1k | 재사용 가능(고지 필요) | 레이캐스트 차량 컨트롤러, 캐릭터 컨트롤러 |
| cannon-es | https://github.com/pmndrs/cannon-es | 물리 | TypeScript | **MIT** (cannon.js 포크) | — | 2.1k | 재사용 가능(고지 필요) | `src/objects/RaycastVehicle.ts` |
| ammo.js | https://github.com/kripken/ammo.js | 물리(Bullet WASM) | C++ → JS | spdx NOASSERTION (Bullet은 Zlib으로 알려짐, 원문 미확인) | — | 4.6k | 미확인 | 무거운 대신 기능 많음 |
| Tone.js | https://github.com/Tonejs/Tone.js | 웹 오디오 | TypeScript | **MIT** | — | 15k | 재사용 가능(고지 필요) | `Tone/core/clock/Transport.ts`(BPM 기준 스케줄) + `Tone/core/util/Draw.ts`(오디오 시각과 화면 동기화) |
| howler.js | https://github.com/goldfire/howler.js | 웹 오디오 | JavaScript | **MIT** | — | 25k | 재사용 가능(고지 필요) | 모바일 오디오 잠금 해제, 스프라이트 사운드 |
| react-three-fiber / drei | https://github.com/pmndrs/react-three-fiber · https://github.com/pmndrs/drei | three.js 래퍼 | TypeScript | **MIT** | — | 34k / 10k | 재사용 가능(고지 필요) | (React 안 쓰지만) 헬퍼 구현 참고 |

---

## 7. 커뮤니티 목록·자료원

| 이름 | 저장소 URL | 장르 | 언어/엔진 | 코드 라이선스 (spdx, verified) | 에셋 라이선스 | ★ | 우리 판정 | 활용법 |
|---|---|---|---|---|---|---|---|---|
| bobeff/open-source-games | https://github.com/bobeff/open-source-games | 목록 | Markdown | CC0-1.0 (목록 자체) | — | 18.7k | 목록이므로 자유 열람 | 장르별 오픈소스 게임 링크 — 항목마다 라이선스를 다시 확인 |
| awesome-open-source-games | https://github.com/michelpereira/awesome-open-source-games | 목록 | Markdown | CC0-1.0 | — | 3.4k | 자유 열람 | 언어/엔진별로 찾기 좋음 |
| leereilly/games | https://github.com/leereilly/games | 목록 | Markdown | 라이선스 없음 | — | 25k (보관됨) | 읽기만 | 웹(HTML5) 게임 링크가 많지만 업데이트 중단 |
| osgameclones | https://github.com/opengaming/osgameclones | 목록(사이트 osgameclones.com) | YAML | spdx NOASSERTION | — | 3.2k | 열람 | "○○ 같은 게임"의 오픈 리메이크 찾기 — 각 항목에 라이선스 표기 |
| magictools | https://github.com/ellisonleao/magictools | 개발 도구 목록 | Markdown | MIT | — | 17.9k | 열람 | 엔진·오디오·툴 탐색 |
| awesome-gamedev | https://github.com/Calinou/awesome-gamedev | 자료 목록 | Markdown | CC-BY-SA-4.0 | — | 3.2k | 열람 | 무료 에셋/툴 링크 |
| GameDev-Resources | https://github.com/Kavex/GameDev-Resources | 자료 목록 | Markdown | 라이선스 없음 | — | 7.2k | 읽기만 | 링크 모음 참고 |
| Kenney | https://kenney.nl · https://github.com/KenneyNL | 에셋 + 스타터 킷 | — | 스타터 킷 MIT | 에셋 **CC0** | — | 재사용 가능 | 프로토타입 에셋 1순위 (출처 표기 없이도 되지만 장부에는 기록) |
| OpenGameArt | https://opengameart.org | 에셋 | — | — | 항목마다 다름 (CC0 / CC-BY / CC-BY-SA / GPL) | — | 항목별 | **필터를 CC0·CC-BY로 제한**하고 CC-BY-SA·GPL 에셋은 피한다 |
| itch.io 오픈소스 태그 | https://itch.io/games/tag-open-source | 게임 목록 | — | — | 게임마다 다름 | — | 항목별 | 게임잼 작품의 소스 링크 — 라이선스 없는 것이 많으므로 GitHub에서 LICENSE를 직접 확인 |

---

## 우리 프로젝트에 바로 쓸 것

모두 **허용 라이선스(MIT/Apache/BSD/Zlib/CC0)** 만 골랐다. 가져올 때 원 라이선스 문구를 고지 파일에 남기고, 에셋은 `free-asset-pipeline` 장부에 기록한다.

### (a) 웹 리듬 게임 프로토타입
1. **Tone.js** — `Tone/core/clock/Transport.ts`(BPM 기준 노트 예약), `Tone/core/util/Draw.ts`(AudioContext 시각에 맞춰 화면 갱신). MIT. 노트 시각을 `requestAnimationFrame`이 아니라 오디오 시계 기준으로 잡는 핵심.
2. **osu!** — `osu.Game/Rulesets/Scoring/HitWindows.cs`, `osu.Game.Rulesets.Mania/Scoring/ManiaHitWindows.cs`(Perfect/Great/Good 판정 폭 + 난이도에 따른 보간), `osu.Game/Screens/Play/PlayerSettings/BeatmapOffsetControl.cs`(오프셋 보정). MIT, 코드만. C#→JS로 옮겨 쓴다. **osu-resources(CC-BY-NC)와 "osu!" 이름·스킨은 절대 쓰지 않는다.**
3. **osu-framework** — `osu.Framework/Timing/InterpolatingFramedClock.cs`: 덜컥거리는 오디오 위치를 매끄러운 게임 시계로 보간. MIT.
4. **webosu** — 브라우저에서 PixiJS로 오디오·노트 동기화한 전체 예. MIT(코드만, 미디어 제외).
5. **howler.js** — 효과음(타격음) 재생과 모바일 오디오 잠금 해제. MIT.

### (b) 웹 레이싱 게임 프로토타입
1. **three.js** — `examples/physics_rapier_vehicle_controller.html` + `examples/jsm/physics/RapierPhysics.js`. three.js MIT, Rapier Apache-2.0(NOTICE 유지). 우리 스택(three.js + Vite)에 그대로 붙는다.
2. **cannon-es** — `src/objects/RaycastVehicle.ts`와 `examples/raycast_vehicle.html`. MIT. Rapier보다 가볍고 순수 JS.
3. **pmndrs/racing-game** — `src/models/vehicle/Vehicle.tsx`(조작·드리프트), `src/effects/Skid.tsx`·`Dust.tsx`(스키드·먼지). 코드 MIT, 에셋 CC0. R3F 코드를 순수 three.js로 옮겨야 한다.
4. **HexGL** — three.js 고속 레이서의 트랙 충돌·카메라. MIT(코드와 리소스, 파일에 다른 표기 없을 때).
5. **Yuka** — `src/steering/behaviors/FollowPathBehavior.js`로 AI 차량이 레이싱 라인을 따라가게. MIT.

### (c) 기존 Unity/웹 슈터
1. **three.js `games_fps.html` + `examples/jsm/math/Octree.js` + `Capsule.js`** — 웹판 플레이어와 섬 지형 충돌. MIT.
2. **Yuka + Dive** — 봇 AI(목표 기반 행동, 시야·기억, 내비메시 `src/navigation/navmesh/NavMesh.js`). 둘 다 MIT. 웹판 적 AI에 바로 적용.
3. **Chop Chop (open-project-1)** — Unity판: `UOP1_Project/Assets/Scripts/Events/ScriptableObjects/VoidEventChannelSO.cs`(이벤트 채널), `Scripts/StateMachine/Core/StateMachine.cs`, `Scripts/Audio/AudioManager.cs`. **Apache-2.0** — Unity 공식 샘플 중 유일하게 진짜 오픈소스. NOTICE·수정 표기 필요.
4. **Kenney Starter Kit FPS** — 무기 정의·반동 로직을 C#/JS로 포팅. 코드 MIT, 에셋 CC0.
5. (Unity판 전용, 선택) **FPS Sample / Boss Room** — UCL이라 Unity 프로젝트 안에서만. 웹판으로 옮기지 않는다.

---

## 놀라웠던 라이선스 메모
- **Unity 공식 샘플은 대부분 UCL**(FPS Sample, Boss Room, Megacity Metro, BoatAttack, ECS Samples)이지만 **Chop Chop만 Apache-2.0**이다.
- **HexGL**은 예전에 비상업 라이선스로 알려졌으나 현재 README와 LICENSE는 **MIT(코드+리소스)** 다.
- **Cataclysm: DDA는 코드까지 CC-BY-SA-3.0**, ZenGM은 "오픈소스 아님"을 명시한 소스 공개형이다.
- **osu!** 는 코드 MIT지만 리소스는 CC-BY-NC-4.0, **FNF**는 코드 Apache-2.0지만 에셋은 "All rights reserved".
- **Etterna**(StepMania 계열)가 MIT라 리듬 판정 로직을 참고·재사용하기 좋다.
- **AssaultCube**는 Zlib 계열이지만 "재라이선스 금지" 조항이 붙어 있어 가져온 파일은 원 라이선스 그대로 둬야 한다.
- GitHub 검색은 **포크를 기본 제외**한다. cannon-es와 DOOM-3는 포크라서 `fork:true`를 붙여야 조회된다.

## 검증 방법
- **확인일: 2026-11-26.**
- 이 세션에서는 `gh api repos/OWNER/REPO`가 연결 안 된 저장소에 403을 반환해서, 대신 **`gh api -X GET search/repositories -f q='repo:A repo:B …'`** 로 `license.spdx_id`, 스타, 언어, 최근 push, archived를 일괄 조회했다(포크는 `fork:true` 추가).
- spdx가 `NOASSERTION`/`null`이면 `raw.githubusercontent.com`에서 LICENSE/COPYING/README 원문을 읽어 판정했고, 표에 "원문: …"으로 적었다. 경로를 추천한 파일은 모두 raw URL이 HTTP 200인지 확인했다.
- GitHub 밖(SourceForge 등)이거나 원문을 찾지 못한 것은 **"미확인"** 으로 표기했다. 에셋 라이선스는 README/LICENSE에 명시된 것만 적었다.
- **규칙: GPL/AGPL 코드는 학습만 한다. 코드·주석·구조를 복사하지 않고, 이해한 뒤 우리 방식으로 새로 작성한다.** MPL/LGPL은 파일·링크 조건을 지킬 수 없으면 학습만으로 취급한다. UCL은 Unity판에서만 쓴다.
- 라이선스는 바뀔 수 있다. 실제로 코드를 들여오기 직전에 해당 커밋의 LICENSE를 다시 확인하고, 커밋 해시를 장부에 남긴다.
