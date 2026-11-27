# 오픈소스 라이선스 감사 — 독점 상용 게임 기준

> 확인일: **2026-11-27**. 저장소 목록·구조는 `GITHUB_REPOSITORY_AUDIT.md`. 기존 판정 기준은 `docs/game-dev/genres/OPEN_SOURCE_CATALOG.md` §0과 같다.
> 이 문서는 **"비공개 소스 상용 게임에 넣어도 되는가"**만 본다. 법률 자문이 아니다. 실제로 가져오기 직전에 해당 커밋의 LICENSE를 다시 확인하고 커밋 해시를 `THIRD_PARTY.md`/에셋 대장에 남긴다.

## 0. 판정 5단계

| 판정 | 라이선스 | 독점 게임에서 할 수 있는 것 | 수정·재배포 조건 |
|---|---|---|---|
| **재사용 가능(고지)** | MIT, BSD-2/3, ISC, Zlib, Apache-2.0, BSL-1.0, Unlicense, CC0, PD | 복사·수정·비공개 배포 | MIT/BSD/ISC/BSL: 저작권·허가 문구를 고지 파일에 유지(BSL은 바이너리 배포 시 면제). Apache-2.0: 라이선스 사본 + `NOTICE` 유지 + 수정 파일에 변경 표시, 특허 조항. Zlib: 출처 오인 금지·수정본 표시. CC0/PD: 조건 없음(장부에는 기록) |
| **Unity 한정(UCL)** | Unity Companion License | Unity 의존 프로젝트 안에서 사용·수정·배포 | Unity 밖(웹 JS판)으로 포팅 금지 |
| **학습만** | GPL-2.0/3.0, AGPL-3.0, CC-BY-SA(코드·데이터에 적용), NetHack GPL | 읽고 이해 → **우리 글로 쓴 명세서로 클린룸 재구현** | 코드·주석·데이터 표·파일 구조를 복사하면 게임 전체 공개 의무 → 금지 |
| **조건부** | MPL-2.0(파일 단위), LGPL(동적 링크·교체 가능), EPL-2.0, 커스텀(FishNet) | 조건을 지킬 수 있을 때만 | 웹 번들·IL2CPP에서는 LGPL 조건 충족이 어려움 → 실무상 학습만 |
| **읽기만** | CC-BY-NC, 비영리 한정(Angband licence), EULA, **라이선스 없음** | 열람만 | 모든 권리 보유 |

**코드와 에셋은 따로 판정한다.** 아래 표는 항상 `코드 / 그림·모델 / 오디오 / 폰트 / 데이터·애니메이션` 칸을 나눈다.

---

## 1. 필수 감사 대상 — 코드·에셋 분리 판정

| 저장소 | 코드 | 그림·모델 | 오디오 | 폰트 | 데이터 | 최종 판정 |
|---|---|---|---|---|---|---|
| **max99x/wutw-public** | **CC0-1.0** (`LICENSE.md` 전문 + README "entire game is released into the public domain … including within commercial projects, without attribution") | **CC0** (작가 원본 PSD·SVG `art_src/` 포함). 원화 다수가 PD 우키요에·에마키 기반 | 음악·효과음 **저장소에 없음**(제3자 라이선스). 컷신 보이스 mp3 포함 — README상 PD 범위로 읽히나 **성우 권리 미확인 → 쓰지 않음** | Yuji Mai·Merienda·Noto = **OFL-1.1**(게임 동봉 가능, 폰트 단독 판매 금지·이름 예약) | 카드·유물·이벤트 `.tres` = CC0. `wutw/japanese/databases/`(JMdict·KANJIDIC2 **CC-BY-SA-4.0**, KanjiVG CC-BY-SA-3.0, tatoeba CC-BY 2.0 FR) = **학습만/별도** | **재사용 가능(작가분)**. ⚠ `wutw/addons/Wwise/`(Audiokinetic 상용 SDK + 상용 DSP 플러그인 바이너리) 절대 반입 금지 |
| **Anuken/Mindustry** | GPL-3.0 | 저장소 포함, 별도 표기 없음 → GPL로 배포되는 것으로 보되 **미확인** | `core/assets/music/*.ogg` 별도 표기 없음 → **미확인** | 미확인 | 콘텐츠가 Java 코드(`content/Blocks.java` 등) = GPL | **학습만** |
| **veloren/veloren** (GitLab 미러) | GPL-3.0-or-later | `assets/` 별도 표기 없음 → **미확인**(GPL로 배포) | 미확인 | 폰트별 라이선스 파일(`assets/voxygen/font/*-license.txt`) | RON 데이터 = 저장소 라이선스 | **학습만** |
| **OpenRA/OpenRA** | GPL-3.0-or-later | 원작 EA 자산 **미포함**(사용자 설치) | 동일 | 미확인 | `mods/*/rules` YAML = GPL | **학습만** |
| **CleverRaven/Cataclysm-DDA** | **CC-BY-SA-3.0**(코드 포함) | CC-BY-SA-3.0 | CC-BY-SA-3.0 (`data/sound/`) | Unifont(OFL + GPL-2.0+ 폰트 예외), Terminus·VecTerminus(OFL), Roboto(Apache-2.0) | `data/json/` = CC-BY-SA-3.0 | **학습만** — 예외: `src/list.h`·`src/colony.h`(PLF, **zlib**) 파일 단위 재사용 가능 |
| **smshahbaj/awesome-open-source-games** | 목록 본문 CC0 | — | — | — | `data/catalogue.json`에 **라이선스 칸 없음** | 목록 자유. 항목은 개별 확인 |

### 1.1 WUTW "퍼블릭 도메인" 검증 결과 (요청 항목)
1. `LICENSE.md` = **CC0 1.0 Universal 전문**이 맞다. GitHub spdx도 `CC0-1.0`.
2. README "License": *"Except for the third-party libraries and data mentioned below and the excluded audio, the entire game is released into the public domain. Feel free to reuse any art or code, including within commercial projects, without attribution."* → **코드와 아트 모두 PD**(작가 저작분).
3. **오디오는 PD가 아니다 — 아예 빠져 있다.** README: "all music and sound effects are excluded"(제3자 라이선스). 코드상 Wwise 기반 오디오 시스템(`wutw/audio/audio_system.gd`)은 있지만 런타임에 무음.
4. 예외(PD 아님): Godot·GodotSteam·godot_resource_groups·godot-console(MIT), 폰트(OFL), 일본어 사전 데이터(CC-BY-SA / CC-BY).
5. **README에 없는 예외: `wutw/addons/Wwise/`** — Audiokinetic Wwise의 Godot 통합과 네이티브 라이브러리(`native/lib/android/...`의 `libAkConvolutionReverb.so`, `libiZotope.so`, `libMcDSP.so`, `libAuro.so` 등 249개 파일). 작가는 남의 저작물을 CC0로 풀 권한이 없으므로 이 폴더는 **Wwise 상용 라이선스** 대상이다. 우리 프로젝트에 **절대 복사하지 않는다.**
6. CC0 4.a: 상표·특허는 포기 대상 아님 → "Worlds Upon The Wind" 이름·로고는 쓰지 않는다.

---

## 2. 덱빌더·로그라이크

| 저장소 | 코드 | 그림 | 오디오 | 폰트/기타 | 판정 |
|---|---|---|---|---|---|
| DesirePathGames/Slay-The-Robot | MIT | 자리표시자만(표기 없음 → 미확인) | `sounds/missing_audio.wav`뿐 | 애드온 3개 각각 MIT 확인 | **재사용 가능(고지)** |
| guladam/deck_builder_tutorial | MIT | Kenney Tiny Dungeon(CC0) | OpenGameArt·Pixabay SFX, Tad 음악 — **미확인** | — | 코드 재사용 가능 / 오디오 쓰지 않음 |
| oskarrough/slaytheweb | **AGPL-3.0** | game-icons.net 등 외부 출처 | freesound 출처 | **mbtype.com 유료 폰트** | **학습만** |
| silverua/slay-the-spire-map-in-unity | MIT (`Assets/Scripts/`) | 아이콘 game-icons.net = CC-BY-3.0 | — | **DOTween(Demigiant, Asset Store)·Newtonsoft(Asset Store)·OneLine 동봉** | 스크립트만 재사용 가능 |
| yurkth/stsmapgen | MIT (+ "NFT 판매용 사용 불허" 문구) | — | — | 라이브러리 MIT/ISC/BSD-3 | 재사용 가능(고지, NFT 금지 존중) |
| BigJk/end_of_eden | MIT | 미확인 | 일부 CC0(`assets/audio/README.md`), 음악 synthroton 미확인 | Nerd Font(미확인) | 코드 재사용 가능 |
| ycarowr/UiCard | MIT | 데모 텍스처 미확인 | — | TextMesh Pro 리소스(Unity) | 스크립트 재사용 가능 |
| ondras/rot.js | BSD-3-Clause | — | — | — | 재사용 가능(고지) |
| FaronBracy/RogueSharp | MIT | — | — | — | 재사용 가능(고지) |
| tmewett/BrogueCE | AGPL-3.0 | — | — | — | 학습만 |
| NetHack/NetHack | NetHack GPL(카피레프트) | — | — | — | 학습만 |
| angband/angband | GPL-2.0 **또는** Angband licence(비영리 한정) — 상용엔 GPL만 남음 | — | — | — | 학습만 |
| cataclysmbn/Cataclysm-BN | CC-BY-SA-3.0, 문서 AGPL-3.0, Magical Nights CC-BY-SA-4.0 | 동일 | 동일 | — | 학습만 |
| tomlooman/ActionRoguelike | **라이선스 파일 없음** | Paragon 에셋 "Unreal Engine 전용" | — | — | 읽기만 |

## 3. 백엔드·네트워크·플랫폼

| 저장소 | 코드 라이선스 | 판정 | 조건 |
|---|---|---|---|
| heroiclabs/nakama | Apache-2.0 | 재사용 가능(고지) | 서버를 수정해 배포하면 NOTICE·변경 표시. 자체 호스팅만 하면 배포 아님. 번들 `internal/gopher-lua/LICENSE` 별도(MIT로 알려짐, 미확인) |
| colyseus/colyseus | MIT | 재사용 가능(고지) | — |
| boardgameio/boardgame.io | MIT | 재사용 가능(고지) | — |
| geckosio/geckos.io | BSD-3-Clause | 재사용 가능(고지) | 이름으로 홍보 금지 조항 |
| rameshvarun/netplayjs | ISC | 재사용 가능(고지) | — |
| MirrorNetworking/Mirror | MIT (© Unity Technologies 2015 — UNet 유래) | 재사용 가능(고지) | 예제 폴더 에셋은 개별 License.txt |
| FirstGearGames/FishNet | **커스텀** | 조건부 | 게임 제작에는 무료·로열티 없음. 경쟁 네트워킹 제품 금지. 특허 소송 시 종료. Florida 법 |
| Unity NGO | UCL | Unity 한정 | — |
| rlabrecque/Steamworks.NET | MIT(래퍼) | 재사용 가능(고지) | 동봉 `steam_api` 헤더·바이너리는 **Valve Steamworks SDK 약관**(Steam 파트너만) |
| GodotSteam (Codeberg) | MIT (`license.md`) | 재사용 가능(고지) | GitHub판은 보관·라이선스 null — **Codeberg판 기준**. Steam SDK 약관 별도 |
| Godot 엔진·데모 | MIT | 재사용 가능(고지) | — |
| luanti-org/luanti | LGPL-2.1+ / 미디어 CC-BY-SA-3.0 | 조건부 → 학습만 | — |
| MovingBlocks/Terasology | Apache-2.0 / 아트 **CC-BY-4.0**(`LICENSE_ARTWORK`) | 재사용 가능(고지) | 아트 쓰면 출처 표기 |
| jasonrohrer/OneLife | **PD**(`no_copyright.txt`) | 코드 재사용 가능 | 같은 문서가 인격권·퍼블리시티권·**상표**(이름·로고·"specific graphical, auditory, and character elements") 유보 → 에셋·이름은 쓰지 않음, "공식 버전"처럼 보이게 하지 않음 |
| FakeFishGames/Barotrauma | EULA | 읽기만 | — |
| SmartlyDressedGames/U3-SDK | **미확인**(LICENSE 없음) | 읽기만 | — |

## 4. 라이선스 놀라운 점 (이번 감사)
1. **WUTW는 진짜 CC0지만, 저장소 안에 상용 Wwise SDK 바이너리(+iZotope·McDSP·Auro 플러그인)가 들어 있고 README 제3자 목록에 빠져 있다.** "PD 저장소 통째 복사"는 위험하다.
2. WUTW는 **음악·효과음이 아예 없다**(PD 여부 이전에 미포함). 일본어 사전 데이터는 CC-BY-SA.
3. **Cataclysm-DDA는 코드까지 CC-BY-SA-3.0**(재확인) — JSON 데이터 구조를 "그대로" 옮기는 것도 피한다. 단 PLF `list.h`/`colony.h`만 zlib.
4. **slaytheweb**(우리와 같은 웹 JS 덱빌더)는 **AGPL** + **유료 폰트(mbtype)** — 가장 닮은 레퍼런스가 가장 못 쓰는 라이선스.
5. **silverua StS 맵**은 MIT라 표기돼 있지만 DOTween·Newtonsoft(Asset Store 배포물)와 CC-BY 아이콘이 저장소에 함께 있다.
6. **GodotSteam GitHub 저장소는 보관(archived)되고 spdx null** — 본거지가 Codeberg로 이전, 거기 `license.md`는 MIT.
7. **FishNet은 MIT가 아니다** — 자체 라이선스(넷코드 경쟁 제품 금지). **Mirror의 MIT 저작권자는 Unity Technologies**(UNet 유래).
8. **Angband**는 "GPL-2.0 또는 비영리 한정"의 이중 라이선스 — 상용에선 GPL만 선택 가능.
9. **OneLife**는 PD 선언이지만 그래픽·청각·캐릭터 요소에 **상표권을 주장**한다.
10. **Steamworks.NET**은 MIT지만 저장소에 Valve 헤더·`libsteam_api` 바이너리가 있어 Valve 약관이 겹친다.
11. Veloren GitHub는 **GitLab 미러**(이슈·MR은 GitLab).
12. `topic:` 검색에 **스타 조작 의심 저장소**(★4.9k/포크 2)와 스팸이 섞여 나온다 — ★만 보고 고르지 않는다.

## 5. 반입 절차 (요약)
1. 이 문서와 `GITHUB_REPOSITORY_AUDIT.md`에서 판정 확인 → "재사용 가능"·"Unity 한정(Unity판만)"만 진행.
2. 가져올 **파일 단위**로 해당 커밋의 LICENSE 재확인(폴더에 제3자 하위 라이선스가 있는지 `git ls-tree`로 `LICENSE*`·`License.txt` 검색).
3. 코드 → 게임 폴더의 `THIRD_PARTY.md`에 저장소·커밋·파일·라이선스 전문/고지. 에셋 → `free-asset-pipeline` 스킬의 라이선스 게이트 + `ASSET_LICENSES.md` 대장.
4. GPL/AGPL/CC-BY-SA → `OPEN_SOURCE_INTEGRATION_PLAN.md` §7 GPL 격리 정책(클린룸) 적용.
