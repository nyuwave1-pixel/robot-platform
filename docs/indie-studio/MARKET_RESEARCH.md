# Steam 인디 게임 시장 조사 — 요약 · 방법 · 출처

- **조사 날짜:** 2026-11-27 (Steam/SteamSpy 수집 2026-11-27 01:32Z~, steamrankings.com 2026-11-20 업데이트판을 2026-11-27 수집)
- **대상:** 소규모 AI 보조 스튜디오의 다음 5개 게임(SURVIVAL WORLD, ROGUE LEGENDS, TACTICAL ARENA, LIFE SIMULATION, PUZZLE UNIVERSE) 우선순위 결정
- **원칙:** 우리 게임은 오리지널이다. 벤치마크는 게임 루프·가격·운영 구조를 분석하려는 것이지 복제하려는 것이 아니다.

## 문서 구성

| 문서 | 내용 |
|---|---|
| `MARKET_RESEARCH.md` (이 문서) | 요약, 수치 라벨 규칙, 수집 방법, 실패 목록, 출처 |
| `STEAM_TOP_GAMES.md` | 벤치마크 21종: 동접(실측), 보유자·리뷰·긍정률·플레이타임·태그(SteamSpy 추정), 출시일·DLC·개발사(스토어), 판매량 대략 모델 |
| `GENRE_ANALYSIS.md` | 20개 장르: 장르별 상위 타이틀(보유자 순), steamrankings $100K 확률, 질적 비교(판단) |
| `COMPETITOR_ANALYSIS.md` | 기획 게임 5종별 경쟁작과 루프 분석, 차별화 포인트 |
| `REVENUE_MODEL.md` | 게임별 수익 모델, Steam 정책, 확률형 아이템 규제, 비용 가정 |
| `DEVELOPMENT_PRIORITY.md` | 5개 게임 순위, TOP 10 장르, 첫 빌드 계획 |
| `data/steam-snapshot-2026-11-27.json` | 원자료 (요청 URL·수집 시각 포함) |
| `../../tools/indie-studio/collect-steam.mjs` | 수집 스크립트 (Node 22, npm 의존성 없음, 재실행 시 이어받기) |

## 요약 (결론 먼저)

1. **개발 순위 (판단, 근거는 DEVELOPMENT_PRIORITY.md):** ① ROGUE LEGENDS → ② SURVIVAL WORLD (지금은 기술 프로토타입만) → ③ LIFE SIMULATION (보류) → ④ PUZZLE UNIVERSE (Steam 신작이 아니라 웹 포털 상시 운영) → ⑤ TACTICAL ARENA (신작 보류, SPECIAL SOLDIER 모드로 검증).
2. **ROGUE LEGENDS 먼저 — 조건부 동의.** Roguelike Deckbuilder는 $100K+ 21%, AA/AAA 매출 비중 6%(외부 추정 steamrankings), 2D·턴제·싱글이라 브라우저 첫 빌드와 서버비 0에 가장 잘 맞는다. 다만 Slay the Spire 2가 수집 시각 동접 **58,910**(실측, 벤치마크 21종 중 1위, 1편 3,847의 약 15배)으로 장르를 점유 중이고 장르 중앙값은 $11k(외부 추정)라, 쉬운 규칙 비틀기 하나가 없으면 안 된다. 4~8주 브라우저 프로토타입 2~3개로 검증 후 진행.
3. **시장 상한은 서바이벌 크래프팅:** Survival Craft $100K+ 28%, $1M+ 12%, 평균 $2.0M이지만 중앙값 $15k, 출시 예정 인디 157종, AA/AAA 31%(외부 추정). 우리 섬·멀티 코드를 재사용할 수 있으나 개발 기간이 가장 길다.
4. **피해야 할 곳:** Shooter(AA/AAA 84%, $100K+ 14%), Puzzle($100K+ 7.9%, 중앙값 $2.1k), Action-Adventure(7.0%) — 외부 추정. 5v5 PvP는 동접이 없으면 매칭이 성립하지 않는다(판단).
5. **기획 밖 기회 장르(외부 추정):** Automation/Factory $100K+ 35%(표본 작음), Bullet Heaven 25%(AA 3%), Co-op Horror 31%, Cooking 25%(출시 수 +195% 급증 중).
6. **롱테일 근거(실측 동접):** Stardew 32,441 · Project Zomboid 25,927 · Valheim 23,841 · RimWorld 18,402 · Terraria 17,981 — 출시 수년~15년 뒤에도 유지. 공통점: 샌드박스/시뮬레이션 루프 + 대형 업데이트/확장 + 모드.
7. **수익 원칙:** 프리미엄 본편 + 콘텐츠 DLC + 직판 코스메틱 + OST. Pay-to-win·유료 루트박스 없음(한국 확률 표시 의무 2024-03-22~, 벨기에 관행상 금지). 포털 포인트는 환전·뽑기 없이 참여 보상으로만.

## 수치 라벨 규칙 (모든 문서 공통)

| 라벨 | 의미 |
|---|---|
| **실측(Steam API, 수집 시각)** | Steam Web API `GetNumberOfCurrentPlayers` 응답. 그 순간의 동접 |
| **Steam 스토어(실측)** | Steam 스토어 `appdetails` 응답(cc=us): 출시일, 가격, DLC 목록, 개발사, 총 리뷰 수 |
| **SteamSpy 추정** | SteamSpy API. 보유자는 구간 추정, `ccu`는 전날 피크, 플레이타임은 평균/중앙값 추정 |
| **외부 추정 (출처)** | 공개된 제3자 분석. 주로 steamrankings.com/genres (인디 $4.99+ 약 18,000종, 2023-01~2025-10 출시, Steam 수수료 이후 매출 추정) |
| **분석 모델** | 우리가 세운 근사 모델 (예: 리뷰 × 20~60 = 판매 수). 범위로만 제시 |
| **판단** | 정성 평가 (개발 난이도, 소규모 적합도 등). 수치가 아니다 |
| **미확인** | 수집 실패 또는 근거 없음 |

## 수집 방법

1. **수집 스크립트 먼저 작성 → 실행 → 요청마다 JSON 저장.** `node tools/indie-studio/collect-steam.mjs` 는 기존 JSON을 읽어 성공한 항목은 건너뛰고 실패한 항목만 다시 요청한다(`--fresh`로 전체 재수집). 요청 간 1.1초 대기, SteamSpy `request=all`은 61초 대기.
2. **벤치마크 21종** (appid는 스토어/SteamSpy가 돌려준 이름과 대조해 21/21 일치 확인): 동접(Steam API) → SteamSpy appdetails → 스토어 appdetails.
3. **장르 상위 타이틀:** 처음 계획은 SteamSpy `request=tag`였으나 결과가 부실했다(아래 실패 목록). 그래서 **SteamSpy `request=all` 페이지(보유자 구간·리뷰 포함) + 벤치마크 21종을 풀로 만들고, steamrankings.com의 게임별 주 장르 분류(`/data/genres.json`)로 장르를 붙여 보유자 하한 → 리뷰 수 순으로 정렬**했다. SteamSpy 태그 결과는 참고용으로만 JSON에 남겼다.
4. **장르 성과 분포:** steamrankings.com/genres 표(37개 장르, 77개 태그)를 파싱해 JSON에 저장(외부 추정).
5. **판매량 대략 모델:** 리뷰 × 20~60 = 판매 수, × 정가 × 0.30~0.45 = 순수령 근사 (STEAM_TOP_GAMES.md §3).
6. **정성 평가:** 장르별 개발 난이도·기간·소규모 적합도·오픈소스 활용도·경쟁도·차별화 여지는 위 데이터와 우리 스튜디오 조건(웹 Three.js FPS + Unity 6 포트 보유, 포털 2개, 첫 빌드는 브라우저/Node)을 놓고 내린 **판단**이다.

## 실패·한계 목록

| 항목 | 결과 | 처리 |
|---|---|---|
| Steam API 동접 | **21/21 성공** | — |
| Steam 스토어 appdetails | 21/21 성공 | Valheim·Enshrouded는 1.0 날짜로 보이는 출시일만 제공 → 앞서 해보기 시작일 미확인 |
| SteamSpy appdetails | 21/21 응답, 그러나 **Slay the Spire 2·Hollow Knight: Silksong은 보유자 0..20,000·리뷰 0으로 비어 있음** | 두 게임 보유자·긍정률·태그 = 미확인. 리뷰 수는 스토어 값 사용 |
| SteamSpy `request=tag` | 20개 장르 중 **Bullet Heaven·Deck Building·Tower Defense는 모든 후보 태그가 빈 결과**, Metroidvania·Cooking·Sandbox·MMORPG 등은 대체 태그(Platformer, Management, Building, MMO)만 결과. 결과가 온 태그도 PUBG·Dota 2가 Simulation/Horror 상위 → 분류 신뢰 낮음 | 장르 상위 타이틀은 SteamSpy `all` + steamrankings 분류 조인으로 대체. 태그 결과는 JSON·GENRE_ANALYSIS §4에 참고로만 |
| SteamSpy `request=all` | 페이지 0·1·2·4·7·8·9 성공, **3·5·6은 "Too many connections"로 재실행 때마다(2~4회) 실패**. 페이지가 보유자 순 전체 목록도 아님(Valheim은 0~4페이지에 없음) | 벤치마크 21종을 풀에 합침. 풀 6,338개. 일부 큰 게임이 장르 상위 20에서 빠졌을 수 있음 |
| steamrankings.com | Node `fetch`에는 봇 확인 페이지(HTTP 202)를 반환 | 스크립트가 시스템 `curl`로 같은 공개 페이지를 받음(기록: `fetch_method: curl`). 사용자 제공 수치(Survival 28%, Bullet Heaven 25%, Metroidvania 25%, Cooking 25%, Colony 24%, 약 18,000종, 2023-01~2025-10)는 **원문과 일치 — 검증됨** (2026-11-20 업데이트판) |
| steamrankings MMO / Extraction / Battle Royale / Friend-slop | 사이트 분류에는 있으나 37개 순위표에 수치 없음 | 미확인 |
| SteamDB | 스크립트 403 (사전 확인) | 사용 안 함, 수동 링크만 |
| 한국·벨기에·네덜란드 규제 원문 | 한국은 보도·법무법인 자료로 확인, 벨기에·네덜란드 원문 URL은 이번 조사에서 미열람 | REVENUE_MODEL에 "원문 URL 미확인" 표기, 법률 자문 아님 |
| Steam 정책 페이지(수수료·환불·등록비) | 2026-11-27에 재열람하지 않음 | 결정 전 재확인 필요로 표기 |

## 출처

- Steam Web API: https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=<appid>
- Steam 스토어: https://store.steampowered.com/api/appdetails?appids=<appid>&cc=us&l=english
- SteamSpy API: https://steamspy.com/api.php (request=appdetails / tag / top100in2weeks / all) — 문서 https://steamspy.com/api.php
- steamrankings.com 장르 순위: https://steamrankings.com/genres/ (2026-11-20 업데이트), 분류 데이터 https://steamrankings.com/data/genres.json
- 참고(수치 미인용): Steam Niche Index https://www.steampageanalyzer.com/niches — "Open World Survival Craft 1,000리뷰 도달률 28.3%, Bullet Heaven 13.1%, 전체 4.2%" (2024-01~2025-06 출시작 기준, 이 조사에서 원문 미열람 → 미확인)
- 한국 확률형 아이템 표시 의무: https://www.asiae.co.kr/en/article/2024032208552867392 , https://www.shinkim.com/eng/media/newsletter/3206
- Steamworks 문서: https://partner.steamgames.com/doc/gettingstarted/appfee , https://partner.steamgames.com/doc/store/pricing/currencies , https://store.steampowered.com/steam_refunds/
- 수동 교차확인 전용(스크립트 403): https://steamdb.info/
