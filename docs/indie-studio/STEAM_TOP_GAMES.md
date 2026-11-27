# Steam 벤치마크 게임 21종 — 스냅샷 (2026-11-27)

- **조사 날짜:** 2026-11-27 (수집 시각 2026-11-27 01:32:24Z ~ 01:33:33Z, UTC)
- **원자료:** `docs/indie-studio/data/steam-snapshot-2026-11-27.json` (수집 스크립트 `tools/indie-studio/collect-steam.mjs`)
- **목적:** 루프·가격·DLC·플레이타임 구조 분석용. 우리 게임은 오리지널이며 이 게임들을 복제하지 않는다.

## 표기 규칙

| 라벨 | 뜻 |
|---|---|
| **실측(Steam API, 수집 시각)** | `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=<id>` 의 응답값. 수집 시각 한 순간의 동접. 시간대(UTC 01:3x = 한국 10:3x, 미국 저녁)에 따라 크게 달라진다. |
| **Steam 스토어(실측)** | `https://store.steampowered.com/api/appdetails?appids=<id>&cc=us` — 출시일, 미국 가격, DLC 개수, 개발사, 총 리뷰 수(`recommendations.total`). |
| **SteamSpy 추정** | `https://steamspy.com/api.php?request=appdetails&appid=<id>` — 보유자(owners)는 구간 추정치, `ccu`는 **전날 최고 동접**, 플레이타임은 분 단위 평균/중앙값 추정. |
| **분석 모델** | 아래 "판매량 대략 모델" 참고. 근사치이며 실제 매출이 아니다. |
| **미확인** | 수집 실패 또는 출처 없음. |

SteamDB는 스크립트 접근 시 403을 반환하므로 **SteamDB 수치는 사용하지 않았다.** 수동 교차확인용 링크: `https://steamdb.info/app/<appid>/charts/`.

## 1. 핵심 지표 표

동접 = 실측(Steam API, 2026-11-27 01:32~01:33Z). 리뷰 수·출시일·DLC·개발사·가격 = Steam 스토어. 보유자·긍정률·평균 플레이타임·태그 = SteamSpy 추정.

| 게임 (appid) | 현재 동접 (실측) | 전날 피크 (SteamSpy) | 보유자 (SteamSpy 추정) | 총 리뷰 (스토어) | 긍정률 (SteamSpy) | 가격 (US, 스토어) | 평균 / 중앙 플레이타임 (SteamSpy, 시간) | 출시일 (스토어) | DLC 수 | 개발사 |
|---|---:|---:|---|---:|---:|---|---|---|---:|---|
| Slay the Spire 2 (2868840) | 58,910 | 101,740 | **미확인** (SteamSpy 0..20,000·리뷰 0 반환 — 데이터 누락) | 236,327 | 미확인 | $24.99 | 79.0 / 45.2 | 2026-03-05 | 0 | Mega Crit |
| Slay the Spire (646570) | 3,847 | 7,995 | 5M..10M | 195,392 | 97.4% | $24.99 | 75.3 / 28.1 | 2019-01-23 | 1 | Mega Crit |
| Stardew Valley (413150) | 32,441 | 69,466 | 20M..50M | 907,903 | 98.5% | $14.99 | 85.0 / 27.2 | 2016-02-26 | 1 | ConcernedApe |
| Terraria (105600) | 17,981 | 32,677 | 20M..50M | 1,252,773 | 97.5% | $9.99 | 132.1 / 31.9 | 2011-05-16 | 2 | Re-Logic |
| Valheim (892970) | 23,841 | 41,646 | 20M..50M | 496,794 | 93.7% | $29.99 | 79.1 / 30.1 | 2026-09-09 (스토어 표기, 1.0 정식 출시일로 보임. 앞서 해보기 시작일은 스토어에 없음 → 미확인) | 1 | Iron Gate AB |
| Project Zomboid (108600) | 25,927 | 34,221 | 10M..20M | 379,327 | 94.3% | $24.99 | 73.5 / 16.0 | 2013-11-08 | 0 | The Indie Stone |
| RimWorld (294100) | 18,402 | 28,312 | 2M..5M | 212,447 | 97.9% | $34.99 | 382.9 / 75.4 | 2018-10-17 | 10 | Ludeon Studios |
| Balatro (2379780) | 6,052 | 7,182 | 2M..5M | 163,605 | 97.8% | $14.99 | 50.8 / 20.2 | 2024-02-20 | 1 | LocalThunk |
| Vampire Survivors (1794680) | 2,088 | 2,469 | 5M..10M | 254,130 | 98.4% | $4.99 | 34.5 / 18.4 | 2022-10-20 | 9 | poncle |
| Hollow Knight: Silksong (1030300) | 5,273 | 6,247 | **미확인** (SteamSpy 0..20,000·리뷰 0 반환) | 397,902 | 미확인 | $19.99 | 48.3 / 40.0 | 2025-09-04 | 1 | Team Cherry |
| Hollow Knight (367520) | 4,583 | 6,651 | 20M..50M | 510,603 | 97.0% | $14.99 | 33.6 / 15.1 | 2017-02-24 | 2 | Team Cherry |
| Don't Starve Together (322330) | 12,099 | 47,291 | 10M..20M | 381,831 | 94.9% | $14.99 | 49.8 / 9.0 | 2016-04-21 | 49 | Klei Entertainment |
| Hades II (1145350) | 2,694 | 3,435 | 5M..10M | 116,714 | 95.7% | $29.99 (수집 시 할인 $20.99) | 36.7 / 22.7 | 2025-09-25 | 1 | Supergiant Games |
| Dead Cells (588650) | 1,100 | 3,050 | 5M..10M | 157,855 | 97.0% | $24.99 | 43.6 / 14.7 | 2018-08-06 | 8 | Motion Twin |
| Factorio (427520) | 11,167 | 18,377 | 5M..10M | 198,135 | 97.6% | $35.00 | 199.6 / 56.5 | 2020-08-14 | 3 | Wube Software |
| Satisfactory (526870) | 10,896 | 17,832 | 10M..20M | 239,329 | 97.4% | $39.99 | 112.9 / 31.5 | 2024-09-10 (1.0) | 2 | Coffee Stain Studios |
| Lethal Company (1966720) | 2,438 | 3,606 | 10M..20M | 412,468 | 97.0% | $9.99 | 23.7 / 11.3 | 2023-10-23 | 0 | Zeekerss |
| Enshrouded (1203620) | 18,834 | 34,318 | 2M..5M | 105,557 | 86.4% | $39.99 | 49.6 / 23.9 | 2026-10-15 (스토어 표기, 1.0로 보임) | 2 | Keen Games |
| Brotato (1942280) | 6,713 | 19,226 | 2M..5M | 115,685 | 95.8% | $4.99 | 39.1 / 14.9 | 2023-06-23 | 3 | Blobfish |
| DAVE THE DIVER (1868140) | 1,764 | 5,470 | 5M..10M | 145,854 | 96.6% | $19.99 | 28.3 / 21.1 | 2023-06-28 | 7 | MINTROCKET |
| Cult of the Lamb (1313140) | 1,547 | 2,046 | 2M..5M | 114,730 | 95.8% | $24.99 | 19.8 / 13.1 | 2022-08-11 | 7 | Massive Monster |

- **동접 수집 성공:** 21/21. **SteamSpy appdetails 성공:** 21/21 응답, 단 Slay the Spire 2·Hollow Knight: Silksong은 보유자·리뷰가 비어 있어(0..20,000, 0/0) 실질 실패로 표기. **스토어 appdetails 성공:** 21/21.
- 플레이타임은 SteamSpy 분 단위 값을 60으로 나눈 것(소수 1자리). SteamSpy 가격(StS2 $19.99 등)이 스토어와 다른 경우 스토어 값을 썼다.
- Valheim / Enshrouded의 출시일은 스토어가 현재 보여 주는 날짜이며 앞서 해보기 시작일과 다르다. 앞서 해보기 시작일은 이 수집에서 확인되지 않았다(미확인).

## 2. 상위 태그 (SteamSpy 추정, 득표순 상위 6)

| 게임 | 상위 태그 |
|---|---|
| Slay the Spire 2 | 미확인 (SteamSpy 태그 비어 있음) |
| Slay the Spire | Roguelike Deckbuilder, Card Game, Card Battler, Rogue-like, Deckbuilding, Turn-Based |
| Stardew Valley | Farming Sim, Pixel Graphics, Multiplayer, Life Sim, Relaxing, RPG |
| Terraria | Open World Survival Craft, Sandbox, Survival, Multiplayer, 2D, Pixel Graphics |
| Valheim | Open World Survival Craft, Survival, Online Co-Op, Open World, Multiplayer, Building |
| Project Zomboid | Survival, Zombies, Open World, Multiplayer, Open World Survival Craft, Sandbox |
| RimWorld | Colony Sim, Base-Building, Survival, Strategy, Sandbox, Management |
| Balatro | Card Game, Rogue-like, Roguelike Deckbuilder, Deckbuilding, Singleplayer, Pixel Graphics |
| Vampire Survivors | Action Roguelike, Bullet Hell, Rogue-lite, Pixel Graphics, Vampires, 2D |
| Hollow Knight: Silksong | 미확인 (SteamSpy 태그 비어 있음) |
| Hollow Knight | Metroidvania, Platformer, Souls-like, Difficult, Great Soundtrack, 2D |
| Don't Starve Together | Survival, Open World Survival Craft, Multiplayer, Co-op, Open World, Adventure |
| Hades II | Action, Rogue-like, Rogue-lite, Hack and Slash, Mythology, Action Roguelike |
| Dead Cells | Adventure, Rogue-like, Metroidvania, Action Roguelike, Pixel Graphics, 2D |
| Factorio | Automation, Base-Building, Resource Management, Sandbox, Crafting, Strategy |
| Satisfactory | Base-Building, Automation, Open World, Crafting, Multiplayer, Co-op |
| Lethal Company | Online Co-Op, Horror, First-Person, Co-op, Survival Horror, Funny |
| Enshrouded | Open World, Survival, Base-Building, Multiplayer, Online Co-Op, Crafting |
| Brotato | Rogue-like, Singleplayer, Bullet Hell, Action Roguelike, Local Co-Op, Bullet Heaven |
| DAVE THE DIVER | Pixel Graphics, Management, Casual, Adventure, Relaxing, Exploration |
| Cult of the Lamb | Base-Building, Action Roguelike, Cute, Cult, Singleplayer, Dungeon Crawler |

## 3. 판매량 대략 모델 (분석 모델 — 실제 매출 아님)

**방법 (Boxleiter식 리뷰 배수):** 판매 수 ≈ 총 리뷰 수 × 20 ~ 60. 순매출(개발사 수령 근사) ≈ 판매 수 × 미국 정가 × 0.30 ~ 0.45
(0.30~0.45는 할인 판매, 지역 가격, 환불, 세금, Steam 수수료 30%를 뭉뚱그린 **가정**이다). 하한은 배수 20·계수 0.30, 상한은 배수 60·계수 0.45.
오래된 게임·저가 게임·번들이 많았던 게임은 배수가 달라지므로 **자릿수 감만 보는 용도**다. 참고로 SteamSpy 보유자 구간과 비교하면
Terraria(20M..50M / 1.25M 리뷰)는 배수 16~40, RimWorld(2M..5M / 0.21M)는 9~24, Lethal Company(10M..20M / 0.41M)는 24~48로 게임마다 크게 다르다.

| 게임 | 총 리뷰 (스토어 실측) | 판매 수 모델 | 순매출 모델 |
|---|---:|---|---|
| Slay the Spire 2 | 236,327 | 4.7M ~ 14.2M | $35M ~ $160M |
| Slay the Spire | 195,392 | 3.9M ~ 11.7M | $29M ~ $132M |
| Stardew Valley | 907,903 | 18.2M ~ 54.5M | $82M ~ $368M |
| Terraria | 1,252,773 | 25.1M ~ 75.2M | $75M ~ $338M |
| Valheim | 496,794 | 9.9M ~ 29.8M | $89M ~ $402M |
| Project Zomboid | 379,327 | 7.6M ~ 22.8M | $57M ~ $256M |
| RimWorld | 212,447 | 4.2M ~ 12.7M | $45M ~ $201M (본편만, DLC 10종 제외) |
| Balatro | 163,605 | 3.3M ~ 9.8M | $15M ~ $66M |
| Vampire Survivors | 254,130 | 5.1M ~ 15.2M | $8M ~ $34M (본편만, DLC 9종 제외) |
| Hollow Knight: Silksong | 397,902 | 8.0M ~ 23.9M | $48M ~ $215M |
| Hollow Knight | 510,603 | 10.2M ~ 30.6M | $46M ~ $207M |
| Don't Starve Together | 381,831 | 7.6M ~ 22.9M | $34M ~ $155M (본편만, DLC/스킨 49종 제외) |
| Hades II | 116,714 | 2.3M ~ 7.0M | $21M ~ $95M |
| Dead Cells | 157,855 | 3.2M ~ 9.5M | $24M ~ $107M |
| Factorio | 198,135 | 4.0M ~ 11.9M | $42M ~ $187M |
| Satisfactory | 239,329 | 4.8M ~ 14.4M | $57M ~ $258M |
| Lethal Company | 412,468 | 8.2M ~ 24.7M | $25M ~ $111M |
| Enshrouded | 105,557 | 2.1M ~ 6.3M | $25M ~ $114M |
| Brotato | 115,685 | 2.3M ~ 6.9M | $3.5M ~ $16M |
| DAVE THE DIVER | 145,854 | 2.9M ~ 8.8M | $17M ~ $79M |
| Cult of the Lamb | 114,730 | 2.3M ~ 6.9M | $17M ~ $77M |

## 4. 관찰 (판단, 수치 아님)

- **Slay the Spire 2**(2026-03-05 출시, 앞서 해보기 여부는 이 수집에서 미확인)는 수집 시각 동접 58,910으로 21종 중 1위. 덱빌더 장르에서 후속작이 1편 대비 동접 약 15배(58,910 vs 3,847, 같은 순간 실측)를 끌고 있다 — 같은 장르에 지금 신작을 내면 이 게임과 정면으로 비교된다는 뜻이다.
- **장기 롱테일:** Stardew(2016)·Terraria(2011)·Project Zomboid(2013)·RimWorld(2018)는 출시 후 8~15년이 지나도 동접 1.8만~3.2만(실측). 공통점은 샌드박스/시뮬레이션 루프 + 무료 대형 업데이트 또는 유료 확장 + 모드.
- **플레이타임:** 콜로니 심·자동화(RimWorld 평균 383시간, Factorio 200시간)가 가장 길고, 서바이버류·액션 로그라이트(20~45시간)가 짧다. 저가($4.99) 서바이버류는 짧은 플레이타임을 낮은 가격으로 맞춘다.
- **DLC 구조:** DLC가 많은 게임은 두 부류다 — 코스메틱/스킨 대량(DST 49개), 콘텐츠 확장(RimWorld 10개, Vampire Survivors 9개, Dead Cells 8개). Lethal Company·Project Zomboid·StS2는 DLC 0.
- **협동 서바이벌의 동접 변동:** DST는 전날 피크 47,291 vs 수집 순간 12,099 — 협동 게임은 시간대(저녁) 의존이 커서 "현재 동접" 한 번으로 규모를 판단하면 안 된다.
- **긍정률:** 21종 중 SteamSpy 긍정률 90% 미만은 Enshrouded(86.4%) 하나. 성공한 인디는 대개 95% 이상.

## 5. 참고: SteamSpy 최근 2주 Top 100 중 전날 피크 동접 상위 20 (SteamSpy 추정)

출처: `https://steamspy.com/api.php?request=top100in2weeks` (수집 2026-11-27 01:33:33Z). 이 목록은 SteamSpy가 순위 없이(appid 순) 주므로 전날 피크 동접 순으로 다시 정렬했다. 대형 F2P/AAA 위주여서 인디 벤치마크로는 쓰지 않는다.

| # | 게임 | 개발사 | 전날 피크 | 보유자 (추정) | 가격 |
|---:|---|---|---:|---|---:|
| 1 | Counter-Strike: Global Offensive (CS2) | Valve | 1,191,632 | 200M..500M | 무료 |
| 2 | Dota 2 | Valve | 755,705 | 200M..500M | 무료 |
| 3 | PUBG: BATTLEGROUNDS | PUBG Corporation | 752,777 | 100M..200M | 무료 |
| 4 | ROB RUN | Kefir | 414,264 | 10M..20M | 무료 |
| 5 | Apex Legends | Respawn | 237,676 | 100M..200M | 무료 |
| 6 | Phantom Blade Zero | S-GAME | 156,733 | 20M..50M | $59.99 |
| 7 | Grand Theft Auto V Enhanced | Rockstar North | 123,433 | 5M..10M | $19.79 |
| 8 | Wallpaper Engine | Wallpaper Engine Team | 109,368 | 20M..50M | $4.99 |
| 9 | Team Fortress 2 | Valve | 103,558 | 100M..200M | 무료 |
| 10 | Rust | Facepunch Studios | 84,543 | 50M..100M | $39.99 |
| 11 | Stardew Valley | ConcernedApe | 70,292 | 20M..50M | $14.99 |
| 12 | Cyberpunk 2077 | CD PROJEKT RED | 68,388 | 20M..50M | $59.99 |
| 13 | Red Dead Redemption 2 | Rockstar Games | 68,307 | 10M..20M | $14.99 |
| 14 | War Thunder | Gaijin | 67,239 | 20M..50M | 무료 |
| 15 | Rainbow Six Siege | Ubisoft Montreal | 62,562 | 20M..50M | 무료 |
| 16 | Dead by Daylight | Behaviour | 62,485 | 10M..20M | $19.99 |
| 17 | Path of Exile | Grinding Gear Games | 62,121 | 20M..50M | 무료 |
| 18 | Geometry Dash | RobTop Games | 61,971 | 10M..20M | $4.99 |
| 19 | NARAKA: BLADEPOINT | 24 Entertainment | 60,037 | 10M..20M | 무료 |
| 20 | Warframe | Digital Extremes | 59,275 | 50M..100M | 무료 |

주의: ROB RUN(신작 무료, 보유자 10M..20M)처럼 신규 무료 게임은 SteamSpy 추정이 크게 빗나갈 수 있다. 교차확인 전에는 인용하지 말 것.

## 6. 출처 URL

- Steam Web API 동접: `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=<appid>`
- SteamSpy: `https://steamspy.com/api.php?request=appdetails&appid=<appid>`, `https://steamspy.com/api.php?request=top100in2weeks`
- Steam 스토어: `https://store.steampowered.com/api/appdetails?appids=<appid>&cc=us&l=english`
- 수동 교차확인(스크립트 미사용): `https://steamdb.info/app/<appid>/charts/`
- 각 요청의 정확한 URL·수집 시각은 JSON의 `games.<appid>.{current_players,steamspy,store}.{url,fetched_at}`에 있다.
