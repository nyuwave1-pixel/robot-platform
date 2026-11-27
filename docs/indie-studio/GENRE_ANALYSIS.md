# 장르 분석 — 20개 장르 (2026-11-27)

- **조사 날짜:** 2026-11-27
- **원자료:** `data/steam-snapshot-2026-11-27.json` — `genre_top_joined`(장르별 상위 타이틀), `steamrankings_genres`(장르 성과 분포), `genres`(SteamSpy 태그 요청 결과, 참고용)
- **표기:** 보유자·리뷰·긍정률·가격 = **SteamSpy 추정**. $100K/$1M 확률·평균·중앙값·최대 인디 히트 = **외부 추정 (steamrankings.com/genres, 2026-11-20 업데이트)**. 개발 난이도 등 질적 열 = **판단**.

## 분석 방법

1. **장르 성과 분포 (외부 추정):** steamrankings.com/genres — "2023-01~2025-10 출시, $4.99 이상 인디 약 18,000종(안 팔린 게임 포함)"을 장르별로 나눠 $100K+·$1M+ 달성 비율, 평균·중앙값 매출(Steam 수수료 이후 추정), 연 출시 수, AA/AAA 매출 비중을 계산한 표. 사이트 설명상 전체 평균은 $100K+ 12%, $1M+ 3.1%. 이 사이트의 장르는 "게임 하나당 주 장르 하나"인 자체 분류(37개)다. 우리 20개 장르와 1:1이 아니어서 가장 가까운 장르에 대응시켰다(아래 표 "대응 장르").
2. **장르별 상위 타이틀 (SteamSpy 추정):** SteamSpy `request=tag`는 이번 수집에서 **쓸 수 없었다** — 20개 중 다수 태그가 빈 결과(`{}`)였고(Metroidvania, Roguelike, Deckbuilding, MMORPG, Tower Defense, Cooking, Sandbox 등), 결과가 온 태그도 PUBG·Dota 2가 "Simulation", "Horror" 상위에 오는 등 분류가 부정확했다. 그래서 다음 방법으로 대체했다:
   SteamSpy `request=all` 페이지 0·1·2·4·7·8·9(일부 페이지는 SteamSpy "Too many connections" 오류로 실패) + 벤치마크 21종 appdetails = **약 6,300개 앱 풀** → steamrankings `data/genres.json`의 게임별 주 장르로 분류 → SteamSpy 보유자 하한, 동률이면 리뷰 수 순으로 정렬해 상위 20개.
   **한계:** 풀이 Steam 전체가 아니다(SteamSpy `all` 페이지가 보유자 순 전체 목록이 아니고 실패 페이지도 있음). 그래서 상위 20에 빠진 큰 게임이 있을 수 있다(예: Megabonk, Slay the Spire 2·Silksong은 SteamSpy 보유자 값이 비어 있어 제외). "규모 라벨"은 steamrankings가 붙인 값(AA/AAA, 그리고 의미가 공개 설명에 없는 I/II/III — 미확인, `-`는 라벨 없음)이다.
3. **최근 상승작 (2024~2026):** steamrankings 각 장르 카드의 "Biggest indie releases, Jan 2023 to Oct 2025"(외부 추정 매출, 연도 포함)에서 2024~2025 출시작을 뽑았다. 2026년 출시작은 이 자료 범위 밖이라 우리 실측(동접)으로 확인된 것만 적었다(Slay the Spire 2).
4. **질적 비교 (판단):** 개발 난이도·기간·소규모 적합도·오픈소스 활용도·상업 경쟁력·차별화 여지는 위 수치 + 우리 조건(작은 AI 보조 팀, 웹 Three.js·Unity 6 경험, 브라우저 우선 첫 빌드)으로 매긴 판단이다. 오픈소스는 MIT/BSD/Zlib/Apache/CC0만 사용 가능(GPL은 학습용) — `docs/game-dev/genres/OPEN_SOURCE_CATALOG.md` 규칙.

## 1. 장르 성과 요약 (외부 추정: steamrankings.com/genres)

| 우리 장르 | 대응 장르 (steamrankings) | 등급·점수 | $100K+ | $1M+ | 평균 출시작 | 중앙값 | $100K+ 게임 전형 매출 | 연 인디 출시 | AA/AAA 매출 비중 | 출시 예정 인디 (위시 상위 3,000) |
|---|---|---|---:|---:|---|---|---|---:|---:|---:|
| Survival Crafting | Survival Craft | S 83 | 28% | 12% | $2.0M | $15k | $576k | 78 | 31% | 157 |
| Roguelike/Roguelite | Action Roguelite | B 52 | 11% | 3.3% | $204k | $3.1k | $451k | 457 | 10% | 116 |
| Bullet Heaven | Bullet Heaven (표본 작음) | S 85 | 25% | 9.7% | $559k | $19k | $666k | 40 | 3% | 20 |
| Metroidvania | Metroidvania (표본 작음) | S 84 | 25% | 11% | $720k | $7.8k | $718k | 51 | 4% | 90 |
| Deck Building | Roguelike Deckbuilder | A 69 | 21% | 7.4% | $254k | $11k | $409k | 76 | 6% | 27 |
| MMORPG | MMO / Online RPG | 미확인 (순위표에 없음) | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 |
| Open World RPG | RPG / Open World Action | B 56 / C 42 | 13% / 19% | 5.0% / 3.6% | $349k / $91k | $3.6k / $6.4k | $541k / $272k | 190 / 30 | 81% / 97% | 201 / 18 |
| Simulation | Management·Tycoon / Vehicle Sim | B 57 / B 64 | 22% / 19% | 4.4% / 6.9% | $220k / $329k | $11k / $5.9k | $377k / $395k | 72 / 82 | 17% / 61% | 56 / 68 |
| Farming Sim | Cozy / Life Sim (+ Steam 태그 Farming Sim) | A 66 (태그 S 80) | 22% (태그 19%) | 5.1% (태그 7.1%) | $270k (태그 $275k) | $8.6k | $408k | 167 | 26% (태그 44%) | 100 |
| Colony Sim | Colony Sim (표본 작음) | A 74 | 24% | 7.6% | $280k | $11k | $762k | 23 | 34% | 24 |
| Strategy/RTS | RTS / Strategy (+ 4X·Grand) | A 65 (4X D 31) | 21% (4X 9.2%) | 6.2% (2.4%) | $279k ($94k) | $3.8k ($3.8k) | $676k | 40 | 86% (82%) | 55 |
| Tower Defense | Tower Defense | C 32 | 8.3% | 1.8% | $77k | $1.5k | $431k | 115 | 39% | 17 |
| Tactical FPS | Shooter (Extraction은 순위표에 없음) | B 57 | 14% | 4.7% | $295k | $2.1k | $543k | 227 | 84% | 152 |
| Multiplayer Co-op | Co-op Horror / Party·Social | A 67 / B 62 | 31% / 11% | 7.1% / 7.1% | $1.0M / $741k | $18k / $2.6k | $255k / $5.4M | 54 / 30 | 37% / 9% | 60 / 25 |
| Sandbox | Sandbox / Physics (표본 작음) | B 61 | 20% | 5.8% | $204k | $4.1k | $499k | 43 | 19% | 36 |
| Puzzle | Puzzle | C 42 | 7.9% | 2.6% | $107k | $2.1k | $441k | 267 | 10% | 73 |
| Cooking/Restaurant | Cooking / Restaurant (표본 작음) | A 77 | 25% | 8.0% | $225k | $6.7k | $555k | 35 | 14% | 21 |
| Horror Survival | Horror (+ Co-op Horror) | C 39 | 13% | 2.2% | $120k | $4.5k | $340k | 484 | 78% | 216 |
| Automation/Factory | Automation / Factory | B 65 | **35%** | 4.4% | $202k | $24k | $486k | 24 | 35% | 18 |
| Action Adventure | Action-Adventure | D 25 | 7.0% | 1.9% | $60k | $1.6k | $403k | 415 | 89% | 180 |

참고: Steam 태그 기준(한 게임이 상위 10개 태그 모두에 들어가 겹침) — Roguelike Deckbuilder S 84 / 24%, Survival A 75 / 16%, Roguelite A 76 / 16%, Automation A 76 / 28%, Survival Horror B 62 / 15%, FPS A 67 / 13%, Tower Defense B 50 / 11%.

## 2. 비교표 — 최대 성공 · 최근 상승작 · 질적 판단

"최대 성공" = 우리 풀에서 SteamSpy 보유자 1위(SteamSpy 추정). "최근 상승작" = steamrankings 최대 인디 출시작 중 2024~2025년(외부 추정 매출). 오른쪽 6개 열은 **판단** (상/중/하, 개발 기간은 1~3인 + AI 보조 기준으로 1.0까지).

| 장르 | 최대 성공 (보유자) | 최근 상승작 2024–2026 | 개발 난이도 | 개발 기간 | 소규모 적합 | 오픈소스 활용 | 상업 경쟁력 | 차별화 여지 |
|---|---|---|---|---|---|---|---|---|
| Survival Crafting | Rust / Unturned / Palworld (50M..100M) | Palworld $408M (2024), Pacific Drive $21M (2024), Bellwright $20M (2024), ASKA $8.7M (2024) | 상 | 18~30개월 | 중 | 중 (지형·물리·네트워킹 라이브러리) | 상 | 중 — 배경·세션 길이·협동 인원으로 |
| Roguelike/Roguelite | The Binding of Isaac: Rebirth (10M..20M) | Hades II $113M (steamrankings 연도 2024 = 앞서 해보기, 스토어 1.0 표기 2025-09-25), Ravenswatch $14M (2024), BALL x PIT $12M (2025) | 중 | 9~18개월 | 상 | 상 | 중 (연 457종, 중앙값 $3.1k) | 중 |
| Bullet Heaven | Vampire Survivors (5M..10M) | Megabonk $33M (2025), Deep Rock Galactic: Survivor $20M (2024), The Spell Brigade $6.4M (2024) | 하~중 | 4~9개월 | 상 | 상 | 상 (AA 3%) | 중 — 이동/조작 비틀기, 3D화 |
| Metroidvania | Hollow Knight (20M..50M) | Hollow Knight: Silksong $255M (2025), Nine Sols $40M (2024), ENDER MAGNOLIA $7.8M (2024) | 상 (레벨·전투 손맛) | 18~36개월 | 중 | 중 | 중 (상위 3종이 인디 매출 85%) | 하~중 |
| Deck Building | Slay the Spire (5M..10M) | Balatro $80M (2024); 2026년 Slay the Spire 2 — 수집 시각 동접 58,910 (실측) | 중 | 9~15개월 | 상 | 중 | 중 (AA 6%, StS2 점유) | 중 — 규칙 비틀기 하나가 핵심 |
| MMORPG | Lost Ark (50M..100M, AAA) | 미확인 (steamrankings 순위표 없음) | 최상 | 36개월+ | 하 | 중 | 하 | 하 |
| Open World RPG | Warframe (50M..100M, AAA) / AA·AAA 라벨 없는 1위: Grim Dawn (10M..20M) | DELTARUNE $106M (2025), Legend of Mortal $23M (2024) — 둘 다 오픈월드 아님 | 최상 | 36개월+ | 하 | 중 | 하 (AA/AAA 81~97%) | 하 |
| Simulation | War Thunder (20M..50M, AAA) / AA·AAA 라벨 없는 1위: BeamNG.drive (10M..20M), Schedule I (10M..20M) | Schedule I $192M (2025), Drive Beyond Horizons $15M (2025), Car Dealer Simulator $6.7M (2025) | 중 | 6~18개월 | 상 | 중 | 중 | 상 — 직업·소재 선택 폭이 넓음 |
| Farming Sim | Stardew Valley (20M..50M) | Fields of Mistria $15M (2024), Dinkum $13M (2025), Luma Island $7.4M (2024) | 중 (콘텐츠 양) | 18~30개월 | 중 | 중 | 중 (연 167종) | 중 — 배경·문화·장르 혼합 |
| Colony Sim | Fallout Shelter (5M..10M, AA) / AA·AAA 라벨 없는 1위: RimWorld (2M..5M) | Norland $8.9M (2024), The Crust $4.2M (2024) | 상 (시뮬레이션 깊이) | 18~36개월 | 중 | 중 | 중 (표본 작음) | 중 |
| Strategy/RTS | Mount & Blade II: Bannerlord (10M..20M, AA) | Sins of a Solar Empire II $12M (2024, 4X), Master of Command $4.0M (2025) | 상 (AI·밸런스·멀티) | 24개월+ | 하~중 | 중 | 하 (AA/AAA 86%) | 하~중 |
| Tower Defense | Plants vs. Zombies GOTY (2M..5M, AA) | Orcs Must Die! Deathtrap $4.0M (2025), Tower Dominion $3.0M (2025), Emberward $2.9M (2024) | 하~중 | 4~9개월 | 상 | 상 | 하 (8.3%, 연 +87%) | 중 — 장르 혼합 필요 |
| Tactical FPS | Counter-Strike 2 (200M..500M, AAA) | Bodycam $64M (2024), Witchfire $23M (2024) — PvE·비주얼 기믹 | 상 (네트코드·안티치트) | 18개월+ (+상시 운영) | 하 | 중 | 하 (AA/AAA 84%) | 하 |
| Multiplayer Co-op | Phasmophobia / Lethal Company / R.E.P.O. (10M..20M) | R.E.P.O. $114M (2025), Nuclear Nightmare $3.6M (2024), Species: Unknown $3.6M (2025) | 중 | 6~12개월 | 중~상 | 중 | 상 (Co-op Horror 31%) | 상 — 웃긴 상호작용 아이디어 |
| Sandbox | Terraria / Garry's Mod (20M..50M) | Tiny Glade $11M (2024), A Game About Digging A Hole $3.1M (2025) | 중~상 | 6~24개월 | 중 | 상 (물리 엔진) | 중 | 상 |
| Puzzle | Portal 2 (10M..20M, AAA) / AA·AAA 라벨 없는 1위: Human Fall Flat (10M..20M) | Blue Prince $9.5M (2025), Riven $3.2M (2024) | 하~중 (아이디어가 병목) | 3~12개월 | 상 | 상 | 하 (7.9%, 연 267종) | 중 — 단일 강한 아이디어만 통함 |
| Cooking/Restaurant | Overcooked! 2 (5M..10M) | Ale & Tale Tavern $4.3M (2024), Kebab Chefs! $4.2M (2024), Wrap House Simulator $1.5M (2025) | 하~중 | 4~12개월 | 상 | 중 | 중~상 (연 출시 +195% 급증) | 중 |
| Horror Survival | Phasmophobia / Dead by Daylight (10M..20M) | Mouthwashing $15M (2024), No, I'm not a Human $14M (2025), White Knuckle $8.3M (2025) | 중 | 4~12개월 | 상 | 중 | 중 (연 484종 혼잡) | 중 — 분위기·서사 |
| Automation/Factory | Satisfactory (10M..20M) | shapez 2 $14M (2024), Parcel Simulator $1.7M (2025), Little Rocket Lab $854k (2025) | 상 (시뮬레이션·성능) | 12~30개월 | 중 | 중 | 상 (35% $100K+) | 중 |
| Action Adventure | Resident Evil 4 (10M..20M, AAA) / AA·AAA 라벨 없는 1위: Stray (5M..10M) | Little Kitty, Big City $8.6M (2024), The Plucky Squire $2.8M (2024) | 상 | 18개월+ | 하 | 중 | 하 (7.0%, AA/AAA 89%) | 중 |

## 3. 장르별 상위 타이틀 (보유자 순, SteamSpy 추정)

풀: SteamSpy `request=all` 성공 페이지 + 벤치마크 21종 (수집 2026-11-27 01:33Z~01:5xZ), 분류: steamrankings `data/genres.json` 주 장르. 상위 20개 목표, 20개 미만이면 표시.

### Survival Crafting

steamrankings 분류: `survival-craft` · 풀 안 해당 타이틀 127개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Rust | Facepunch Studios | 50M..100M | 1,184,686 | 87% | $39.99 | AA |
| 2 | Unturned | Smartly Dressed Games | 50M..100M | 565,471 | 91% | 무료/미확인 | II |
| 3 | Palworld | Pocketpair | 50M..100M | 424,179 | 94.7% | $29.99 | III |
| 4 | Terraria | Re-Logic | 20M..50M | 1,252,431 | 97.5% | $9.99 | II |
| 5 | The Forest | Endnight Games Ltd | 20M..50M | 586,292 | 95.6% | $19.99 | III |
| 6 | Valheim | Iron Gate AB | 20M..50M | 493,495 | 93.7% | $29.99 | III |
| 7 | ARK: Survival Evolved | Studio Wildcard, Instinct Games, Efecto  | 10M..20M | 590,231 | 83.9% | $14.99 | AA |
| 8 | Don't Starve Together | Klei Entertainment | 10M..20M | 381,154 | 94.9% | $14.99 | III |
| 9 | Project Zomboid | The Indie Stone | 10M..20M | 378,006 | 94.3% | $24.99 | III |
| 10 | Raft | Redbeet Interactive | 10M..20M | 326,056 | 93.1% | $19.99 | III |
| 11 | Sons Of The Forest | Endnight Games Ltd | 10M..20M | 290,400 | 88.6% | $29.99 | III |
| 12 | DayZ | Bohemia Interactive | 5M..10M | 391,596 | 78.5% | $49.99 | AA |
| 13 | Subnautica | Unknown Worlds Entertainment | 5M..10M | 344,854 | 97.2% | $29.99 | III |
| 14 | No Man's Sky | Hello Games | 5M..10M | 322,196 | 84.2% | $59.99 | III |
| 15 | 7 Days to Die | The Fun Pimps | 5M..10M | 276,071 | 87.2% | $44.99 | AA |
| 16 | The Isle | Afterthought LLC | 5M..10M | 115,203 | 80.6% | $19.99 | II |
| 17 | Infestation: The New Z | Fredaikis AB | 5M..10M | 33,922 | 54.1% | 무료/미확인 | II |
| 18 | ASTRONEER | System Era Softworks | 2M..5M | 119,523 | 92% | $29.99 | III |
| 19 | The Long Dark | Hinterland Studio Inc. | 2M..5M | 111,864 | 89% | $19.99 | III |
| 20 | V Rising | Stunlock Studios | 2M..5M | 111,288 | 89.3% | $34.99 | AA |

### Roguelike/Roguelite

steamrankings 분류: `roguelite` · 풀 안 해당 타이틀 155개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | The Binding of Isaac: Rebirth | Nicalis, Inc., Edmund McMillen | 10M..20M | 429,805 | 96.6% | $14.99 | II |
| 2 | ELDEN RING NIGHTREIGN | FromSoftware, Inc. | 10M..20M | 130,817 | 83.4% | $39.99 | AAA |
| 3 | Hades | Supergiant Games | 5M..10M | 288,280 | 98% | $6.24 | III |
| 4 | Risk of Rain 2 | Hopoo Games | 5M..10M | 243,268 | 93.9% | $8.24 | III |
| 5 | Dead Cells | Motion Twin | 5M..10M | 157,833 | 97% | $24.99 | III |
| 6 | Hades II | Supergiant Games | 5M..10M | 116,600 | 95.7% | $20.99 | III |
| 7 | Cult of the Lamb | Massive Monster | 2M..5M | 114,341 | 95.8% | $24.99 | III |
| 8 | Gunfire Reborn | Gunfire Reborn Studio | 2M..5M | 88,769 | 93.1% | $19.99 | III |
| 9 | Enter the Gungeon | Dodge Roll | 2M..5M | 79,773 | 95.2% | $14.99 | II |
| 10 | FTL: Faster Than Light | Subset Games | 2M..5M | 63,159 | 94.8% | $9.99 | II |
| 11 | Skul: The Hero Slayer | SOUTHPAW GAMES | 2M..5M | 51,001 | 93.4% | $9.99 | II |
| 12 | The Binding of Isaac | Edmund McMillen, Florian Himsl | 2M..5M | 49,414 | 94.5% | $2.49 | I |
| 13 | Darkest Dungeon II | Red Hook Studios | 2M..5M | 24,676 | 74.8% | $12.39 | III |
| 14 | Neon Abyss | Veewo Games | 2M..5M | 19,737 | 86.1% | $19.99 | III |
| 15 | Dome Keeper | Bippinbits | 2M..5M | 19,447 | 92.5% | $4.49 | I |
| 16 | Children of Morta | Dead Mage | 2M..5M | 18,631 | 88.7% | $21.99 | III |
| 17 | Lost Castle / 失落城堡 | Hunter Studio | 2M..5M | 18,485 | 87% | $9.99 | I |
| 18 | Moonlighter | Digital Sun | 2M..5M | 17,436 | 82.5% | $19.99 | II |
| 19 | Wizard of Legend | Contingent99 | 2M..5M | 17,363 | 91.2% | $4.79 | II |
| 20 | 暖雪 Warm Snow | BadMudStudio | 1M..2M | 35,407 | 92.9% | $17.99 | II |

### Bullet Heaven

steamrankings 분류: `bullet-heaven` · 풀 안 해당 타이틀 21개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Vampire Survivors | poncle | 5M..10M | 253,804 | 98.4% | $4.99 | I |
| 2 | Brotato | Blobfish | 2M..5M | 115,102 | 95.8% | $4.99 | I |
| 3 | HoloCure - Save the Fans! | KayAnimate | 2M..5M | 40,988 | 99% | 무료/미확인 | II |
| 4 | Deep Rock Galactic: Survivor | Funday Games | 1M..2M | 46,852 | 86.1% | $6.49 | II |
| 5 | 20 Minutes Till Dawn | flanne | 1M..2M | 27,993 | 90% | $4.99 | I |
| 6 | Halls of Torment | Chasing Carrots | 500K..1M | 31,136 | 95.3% | $6.66 | II |
| 7 | Soulstone Survivors | Game Smithing Limited | 500K..1M | 25,935 | 91.2% | $14.99 | II |
| 8 | Death Must Die | Realm Archive | 500K..1M | 21,042 | 90% | $6.99 | II |
| 9 | Yet Another Zombie Survivors | Awesome Games Studio | 500K..1M | 15,315 | 91.7% | $8.24 | II |
| 10 | Jotunnslayer: Hordes of Hel | Games Farm, ARTillery | 200K..500K | 3,967 | 82.5% | $8.99 | III |
| 11 | Spirit Hunters: Infinite Horde | Creature Cauldron | 200K..500K | 1,564 | 78.9% | $7.99 | - |
| 12 | Scarlet Tower | Pyxeralia LLC | 100K..200K | 2,231 | 82.4% | $3.49 | - |
| 13 | Conquest Dark | Eldritch Sword Games | 100K..200K | 1,580 | 92.7% | $9.99 | - |
| 14 | KILL KNIGHT | PlaySide | 100K..200K | 1,576 | 94.2% | $14.99 | - |
| 15 | Extremely Powerful Capybaras | Studio Bravarda | 100K..200K | 1,070 | 64.4% | $5.99 | - |
| 16 | Run Build Pew! | Knight Owl Games | 100K..200K | 543 | 73.5% | $2.99 | - |
| 17 | Sodaman | Tape Corps | 100K..200K | 486 | 79.4% | $7.99 | - |
| 18 | Geometry Arena | 011 Games | 50K..100K | 2,386 | 96.6% | $5.99 | - |
| 19 | Survivors of the Dawn | indieGiant | 50K..100K | 667 | 77.1% | $7.99 | - |
| 20 | Choo Choo Survivor | GTGD | 50K..100K | 542 | 86% | $2.99 | - |

### Metroidvania

steamrankings 분류: `metroidvania` · 풀 안 해당 타이틀 56개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Hollow Knight | Team Cherry | 20M..50M | 510,424 | 97% | $14.99 | III |
| 2 | Ori and the Blind Forest: Definitive Edition | Moon Studios GmbH | 2M..5M | 63,758 | 94.9% | $4.99 | III |
| 3 | Blasphemous | The Game Kitchen | 2M..5M | 55,966 | 90.3% | $24.99 | III |
| 4 | ENDER LILIES: Quietus of the Knights | Live Wire, Adglobe | 1M..2M | 43,766 | 93.8% | $24.99 | III |
| 5 | Nine Sols | RedCandleGames | 1M..2M | 41,530 | 94.5% | $29.99 | III |
| 6 | ASTLIBRA Revision | KEIZO | 1M..2M | 30,842 | 95% | $24.99 | II |
| 7 | Bloodstained: Ritual of the Night | ArtPlay | 1M..2M | 29,880 | 93.3% | $39.99 | AA |
| 8 | Dust: An Elysian Tail | Humble Hearts LLC | 1M..2M | 14,299 | 95.1% | $2.99 | II |
| 9 | ANIMAL WELL | Billy Basso | 500K..1M | 23,156 | 95.6% | $24.99 | II |
| 10 | Salt and Sanctuary | Ska Studios | 500K..1M | 20,206 | 89.1% | $17.99 | II |
| 11 | Blasphemous 2 | The Game Kitchen | 500K..1M | 17,661 | 91.2% | $29.99 | III |
| 12 | Pseudoregalia | rittzler | 500K..1M | 17,341 | 97% | $5.99 | I |
| 13 | Touhou Luna Nights | Team Ladybug, WSS playground | 500K..1M | 13,868 | 97.3% | $17.99 | II |
| 14 | Rabi-Ribi | CreSpirit, GemaYue | 500K..1M | 10,780 | 95.2% | $17.99 | II |
| 15 | ENDER MAGNOLIA: Bloom in the Mist | Adglobe, Live Wire | 200K..500K | 17,527 | 95.4% | $24.99 | III |
| 16 | Afterimage | Aurogon Shanghai | 200K..500K | 8,404 | 77.7% | $24.99 | III |
| 17 | Axiom Verge | Thomas Happ Games LLC | 200K..500K | 6,064 | 90.9% | $4.99 | II |
| 18 | GRIME | Clover Bite | 200K..500K | 5,788 | 85.3% | $24.99 | III |
| 19 | Gensokyo Night Festival | WSS playground, tea_basira | 200K..500K | 4,566 | 76.1% | $12.99 | II |
| 20 | Prince of Persia The Lost Crown | Ubisoft Montpellier | 200K..500K | 3,983 | 85.1% | $29.99 | AA |

### Deck Building

steamrankings 분류: `deckbuilder` · 풀 안 해당 타이틀 29개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Slay the Spire | Mega Crit | 5M..10M | 193,761 | 97.4% | $24.99 | II |
| 2 | Balatro | LocalThunk | 2M..5M | 163,538 | 97.8% | $14.99 | I |
| 3 | Inscryption | Daniel Mullins Games | 2M..5M | 136,730 | 96.8% | $19.99 | II |
| 4 | Library Of Ruina | ProjectMoon | 1M..2M | 41,987 | 94.7% | $29.99 | III |
| 5 | 9 Kings | Sad Socket | 1M..2M | 23,827 | 92.5% | $9.99 | I |
| 6 | Monster Train | Shiny Shoe | 500K..1M | 20,006 | 96% | $24.99 | III |
| 7 | Peglin | Red Nexus Games Inc. | 500K..1M | 16,782 | 83.3% | $19.99 | II |
| 8 | Griftlands | Klei Entertainment | 500K..1M | 13,500 | 93.7% | $19.99 | III |
| 9 | Friends vs Friends | Brainwash Gang | 200K..500K | 13,313 | 83.1% | $2.49 | II |
| 10 | Chrono Ark | Al Fine | 200K..500K | 12,724 | 90.6% | $24.99 | II |
| 11 | Tainted Grail: Conquest | Questline | 200K..500K | 7,601 | 90.4% | $19.99 | II |
| 12 | Black Book | Morteshka | 200K..500K | 6,021 | 92.6% | $24.99 | II |
| 13 | Gordian Quest | Mixed Realms, SwagSoft Studios | 200K..500K | 5,784 | 89.2% | $5.99 | II |
| 14 | HELLCARD | Thing Trunk | 200K..500K | 3,845 | 85.9% | $24.99 | II |
| 15 | Vault of the Void | Spider Nest Games | 200K..500K | 2,734 | 92.8% | $17.99 | - |
| 16 | Guild of Dungeoneering Ultimate Edition | Gambrinous | 200K..500K | 2,570 | 77% | $19.99 | - |
| 17 | Star Realms | Wise Wizard Games, LLC | 200K..500K | 2,069 | 86.7% | 무료/미확인 | - |
| 18 | Dominion | Temple Gates Games | 200K..500K | 1,928 | 86.3% | 무료/미확인 | - |
| 19 | Ascension: Deckbuilding Game | Playdek, Inc. | 200K..500K | 1,574 | 89.2% | $9.99 | - |
| 20 | DICEOMANCER | 超厚皮猪猪 Ultra Piggy Studio | 100K..200K | 4,696 | 97.3% | $14.99 | I |

### MMORPG

steamrankings 분류: `mmo` · 풀 안 해당 타이틀 114개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Lost Ark | Smilegate RPG | 50M..100M | 203,197 | 70.3% | 무료/미확인 | AAA |
| 2 | Trove | gamigo US Inc. | 10M..20M | 92,822 | 79.8% | 무료/미확인 | AA |
| 3 | The Elder Scrolls Online | ZeniMax Online Studios | 5M..10M | 134,878 | 82.2% | $4.99 | AAA |
| 4 | Albion Online | Sandbox Interactive GmbH | 5M..10M | 95,021 | 78.3% | 무료/미확인 | AA |
| 5 | STAR WARS: The Old Republic | Broadsword | 5M..10M | 76,162 | 89.6% | 무료/미확인 | AAA |
| 6 | Neverwinter | Cryptic Studios | 5M..10M | 39,815 | 77.4% | 무료/미확인 | AA |
| 7 | FINAL FANTASY XIV Online | Square Enix | 2M..5M | 79,431 | 86.3% | $19.99 | AAA |
| 8 | Black Desert | Pearl Abyss | 2M..5M | 63,532 | 75.3% | $0.99 | AAA |
| 9 | Realm of the Mad God Exalt | Wild Shadow Studios, Deca Live Operation | 2M..5M | 47,920 | 82.8% | 무료/미확인 | II |
| 10 | EVE Online | CCP | 2M..5M | 39,990 | 73.3% | 무료/미확인 | AAA |
| 11 | Stay Out | MOBITECH LLC | 2M..5M | 31,996 | 69.7% | 무료/미확인 | II |
| 12 | Bless Unleashed | VALOFE | 2M..5M | 31,114 | 52.9% | 무료/미확인 | AA |
| 13 | Guild Wars 2 | ArenaNet® | 2M..5M | 30,451 | 88.3% | 무료/미확인 | AAA |
| 14 | Legends of IdleOn - Idle MMO | Lavaflame2 | 2M..5M | 30,391 | 77% | 무료/미확인 | II |
| 15 | RuneScape  | Jagex Ltd | 2M..5M | 27,648 | 81.6% | 무료/미확인 | AA |
| 16 | Spiral Knights | Grey Havens | 2M..5M | 24,285 | 83.8% | 무료/미확인 | III |
| 17 | The Lord of the Rings Online | Standing Stone Games | 2M..5M | 23,526 | 81.5% | 무료/미확인 | AA |
| 18 | DC Universe Online | Dimensional Ink Games | 2M..5M | 22,182 | 80.6% | 무료/미확인 | AAA |
| 19 | Star Trek Online | Cryptic Studios | 2M..5M | 21,561 | 79.3% | 무료/미확인 | AA |
| 20 | Old School RuneScape | Jagex Ltd | 2M..5M | 21,138 | 82.9% | 무료/미확인 | AA |

### Open World RPG

steamrankings 분류: `rpg` + `open-world-action` + `arpg-loot` · 풀 안 해당 타이틀 461개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Warframe | Digital Extremes | 50M..100M | 684,039 | 87.8% | 무료/미확인 | AAA |
| 2 | Cyberpunk 2077 | CD PROJEKT RED | 20M..50M | 911,194 | 87.8% | $59.99 | AAA |
| 3 | The Witcher 3: Wild Hunt — Remastered | CD PROJEKT RED | 20M..50M | 850,708 | 96.4% | $49.99 | AAA |
| 4 | ELDEN RING | FromSoftware, Inc. | 20M..50M | 838,961 | 93.2% | $59.99 | AAA |
| 5 | Baldur's Gate 3 | Larian Studios | 20M..50M | 766,598 | 96.8% | $41.99 | AAA |
| 6 | Destiny 2 | Bungie | 20M..50M | 665,239 | 78.8% | 무료/미확인 | AAA |
| 7 | Path of Exile | Grinding Gear Games | 20M..50M | 251,360 | 89% | 무료/미확인 | AA |
| 8 | Red Dead Redemption 2 | Rockstar Games | 10M..20M | 874,972 | 92.7% | $14.99 | AAA |
| 9 | Dying Light | Techland | 10M..20M | 378,136 | 95.2% | $24.99 | AA |
| 10 | Mount & Blade II: Bannerlord | TaleWorlds Entertainment | 10M..20M | 233,822 | 87.8% | $49.99 | AA |
| 11 | Borderlands 2 | Gearbox Software, Aspyr (Mac), Aspyr (Li | 10M..20M | 211,166 | 89.9% | $5.99 | AAA |
| 12 | The Elder Scrolls V: Skyrim | Bethesda Game Studios | 10M..20M | 180,960 | 94.5% | $19.99 | AAA |
| 13 | Grim Dawn | Crate Entertainment | 10M..20M | 94,246 | 93.3% | $4.99 | III |
| 14 | Undertale | tobyfox | 5M..10M | 314,569 | 96.6% | $9.99 | II |
| 15 | Fallout 4 | Bethesda Game Studios | 5M..10M | 292,627 | 81.9% | $4.99 | AAA |
| 16 | Grand Theft Auto V Enhanced | Rockstar North | 5M..10M | 233,793 | 84.5% | $19.79 | AAA |
| 17 | The Elder Scrolls V: Skyrim Special Edition | Bethesda Game Studios | 5M..10M | 225,220 | 94.4% | $16.49 | AAA |
| 18 | Fallout: New Vegas | Obsidian Entertainment | 5M..10M | 213,663 | 95.9% | $2.49 | AAA |
| 19 | 鬼谷八荒 Tale of Immortal | 鬼谷工作室 | 5M..10M | 190,330 | 56.8% | $19.99 | III |
| 20 | Grand Theft Auto IV: The Complete Edition | Rockstar North, Rockstar Toronto | 5M..10M | 187,041 | 83.7% | $19.99 | AAA |

### Simulation

steamrankings 분류: `vehicle-sim` + `management` + `job-sim` · 풀 안 해당 타이틀 212개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | War Thunder | Gaijin Entertainment | 20M..50M | 805,968 | 71.2% | 무료/미확인 | AAA |
| 2 | Euro Truck Simulator 2 | SCS Software | 10M..20M | 770,808 | 97.4% | $19.99 | AA |
| 3 | BeamNG.drive | BeamNG | 10M..20M | 402,406 | 97.2% | $24.99 | III |
| 4 | Schedule I | TVGS | 10M..20M | 295,532 | 97.8% | $19.99 | I |
| 5 | DAVE THE DIVER | MINTROCKET | 5M..10M | 145,481 | 96.6% | $19.99 | III |
| 6 | Supermarket Together | DeadDevsTellNoLies | 5M..10M | 102,120 | 94.3% | 무료/미확인 | I |
| 7 | Prison Architect | Introversion Software, Double Eleven | 5M..10M | 59,956 | 89% | $7.49 | II |
| 8 | DCS World Steam Edition | Eagle Dynamics SA | 5M..10M | 41,620 | 85% | 무료/미확인 | AA |
| 9 | American Truck Simulator | SCS Software | 2M..5M | 168,717 | 97% | $19.99 | AA |
| 10 | My Summer Car | Amistech Games | 2M..5M | 110,329 | 94.9% | $14.99 | II |
| 11 | House Flipper | Empyrean | 2M..5M | 93,018 | 94% | $24.99 | II |
| 12 | Elite Dangerous | Frontier Developments | 2M..5M | 83,080 | 76.5% | $9.99 | AA |
| 13 | Planet Zoo | Frontier Developments | 2M..5M | 81,800 | 90.8% | $16.49 | AA |
| 14 | Supermarket Simulator | Nokta Games | 2M..5M | 80,252 | 92.1% | $11.99 | I |
| 15 | Farming Simulator 22 | GIANTS Software | 2M..5M | 70,109 | 93.1% | $19.99 | AA |
| 16 | Farming Simulator 19 | GIANTS Software | 2M..5M | 64,808 | 94.5% | $14.99 | AA |
| 17 | Plague Inc: Evolved | Ndemic Creations | 2M..5M | 60,407 | 94.2% | $14.99 | II |
| 18 | Planet Coaster | Frontier Developments, Aspyr (Mac) | 2M..5M | 59,572 | 91% | $44.99 | AA |
| 19 | Lobotomy Corporation / Monster Management Simulation | ProjectMoon | 2M..5M | 54,334 | 94.4% | $24.99 | II |
| 20 | TCG Card Shop Simulator | OPNeon Games | 2M..5M | 49,745 | 96.3% | $19.99 | I |

### Farming Sim

steamrankings 분류: `life-sim` · 풀 안 해당 타이틀 70개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Stardew Valley | ConcernedApe | 20M..50M | 907,439 | 98.5% | $14.99 | II |
| 2 | The Sims 4 | Maxis | 10M..20M | 203,281 | 86.3% | 무료/미확인 | AAA |
| 3 | Slime Rancher | Monomi Park | 2M..5M | 141,129 | 98% | $19.99 | III |
| 4 | Graveyard Keeper | Lazy Bear Games | 2M..5M | 40,469 | 86.2% | $19.99 | II |
| 5 | The Sims 3 | The Sims Studio, Maxis | 2M..5M | 31,200 | 85.8% | $19.99 | AAA |
| 6 | Volcano Princess | 养蛋人 Egg Hatcher | 1M..2M | 45,533 | 97.8% | $10.99 | II |
| 7 | Slime Rancher 2 | Monomi Park | 1M..2M | 44,576 | 94.5% | $29.99 | III |
| 8 | Medieval Dynasty | Render Cube | 1M..2M | 43,779 | 90.1% | $34.99 | III |
| 9 | Ranch Simulator: Build, Hunt, Farm | Toxic Dog | 1M..2M | 41,647 | 79.1% | $3.74 | II |
| 10 | Fields of Mistria | NPC Studio | 1M..2M | 35,779 | 97% | $13.99 | II |
| 11 | inZOI | inZOI Studio | 1M..2M | 30,859 | 78% | $39.99 | AAA |
| 12 | Summer Memories | Dojin Otome | 1M..2M | 24,459 | 92.5% | $19.99 | I |
| 13 | Chinese Parents | 墨鱼玩游戏 | 1M..2M | 23,302 | 91.2% | $9.99 | II |
| 14 | Sun Haven | Pixel Sprout Studios | 1M..2M | 22,326 | 79.9% | $24.99 | II |
| 15 | Farm Together | Milkstone Studios | 1M..2M | 17,658 | 94% | $19.99 | II |
| 16 | My Time at Portia | Pathea Games | 500K..1M | 34,916 | 91.5% | $29.99 | III |
| 17 | My Time at Sandrock | Pathea Games | 500K..1M | 24,313 | 88.1% | $39.99 | III |
| 18 | Disney Dreamlight Valley | Gameloft | 500K..1M | 22,659 | 92.1% | $23.99 | AA |
| 19 | Coral Island | Stairway Games | 500K..1M | 22,281 | 89.3% | $29.99 | III |
| 20 | Youtubers Life | UPLAY Online | 500K..1M | 13,745 | 77.7% | $19.99 | II |

### Colony Sim

steamrankings 분류: `colony` · 풀 안 해당 타이틀 23개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Fallout Shelter | Bethesda Game Studios | 5M..10M | 83,798 | 87.8% | 무료/미확인 | AA |
| 2 | RimWorld | Ludeon Studios | 2M..5M | 212,328 | 97.9% | $34.99 | III |
| 3 | Oxygen Not Included | Klei Entertainment | 2M..5M | 137,226 | 96.8% | $7.49 | III |
| 4 | Kenshi | Lo-Fi Games | 2M..5M | 99,802 | 95.5% | $11.99 | II |
| 5 | This War of Mine | 11 bit studios | 2M..5M | 82,259 | 93.8% | $19.99 | III |
| 6 | Banished | Shining Rock Software LLC | 2M..5M | 37,999 | 90.1% | $19.99 | II |
| 7 | Craft The World | Dekovir Entertainment, Sibear Games | 500K..1M | 15,178 | 88.7% | $18.99 | II |
| 8 | Mind Over Magic | Sparkypants | 200K..500K | 3,477 | 88.2% | $14.99 | III |
| 9 | Clanfolk | MinMax Games Ltd. | 200K..500K | 3,108 | 91.1% | $29.99 | I |
| 10 | Flotsam | Pajama Llama Games | 200K..500K | 2,746 | 77% | $24.99 | II |
| 11 | Hammerting | Warpzone Studios | 200K..500K | 2,518 | 57.5% | $4.99 | - |
| 12 | Judgment: Apocalypse Survival Simulation | Suncrash | 200K..500K | 2,215 | 80.9% | $19.99 | - |
| 13 | Hammerting | Warpzone Studios | 200K..500K | 1,737 | 57.5% | $24.99 | - |
| 14 | The Crust | VEOM Studio | 100K..200K | 2,603 | 76.9% | $19.19 | II |
| 15 | Stardeus | Kodo Linija | 100K..200K | 1,343 | 87.8% | $29.99 | - |
| 16 | Townsmen - A Kingdom Rebuilt | HandyGames | 100K..200K | 1,237 | 69.6% | $3.99 | - |
| 17 | Worshippers of Cthulhu | Crazy Goat Games | 100K..200K | 1,094 | 86.7% | $24.99 | - |
| 18 | Dwarfs!? | Power of 2 | 100K..200K | 1,040 | 77.2% | $9.99 | - |
| 19 | The Settlers : Heritage of Kings - History Edition | Ubisoft Blue Byte | 100K..200K | 747 | 84.5% | $11.99 | - |
| 20 | Dungeon Village | Kairosoft Co.,Ltd | 100K..200K | 716 | 88.7% | $8.99 | - |

### Strategy/RTS

steamrankings 분류: `rts` + `4x-grand` · 풀 안 해당 타이틀 205개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Mount & Blade II: Bannerlord | TaleWorlds Entertainment | 10M..20M | 233,822 | 87.8% | $49.99 | AA |
| 2 | Sid Meier’s Civilization VI | Firaxis Games, Aspyr (Mac), Aspyr (Linux | 5M..10M | 278,060 | 86.3% | $5.99 | AAA |
| 3 | Hearts of Iron IV | Paradox Development Studio | 5M..10M | 265,768 | 90% | $14.99 | AA |
| 4 | Age of Empires II: Definitive Edition | World's Edge, Forgotten Empires, Capture | 5M..10M | 161,207 | 95% | $23.44 | AA |
| 5 | Sid Meier's Civilization V | Firaxis Games, Aspyr (Mac), Aspyr (Linux | 5M..10M | 128,596 | 95.5% | $29.99 | AAA |
| 6 | Europa Universalis IV | Paradox Development Studio, Paradox Tint | 5M..10M | 92,348 | 86.4% | $11.99 | AA |
| 7 | Age of Empires II (Retired) | Skybox Labs, Hidden Path Entertainment,  | 5M..10M | 85,003 | 95.8% | $19.99 | AA |
| 8 | Company of Heroes 2 | Relic Entertainment, Feral Interactive ( | 5M..10M | 69,259 | 80.8% | $19.99 | AA |
| 9 | Stellaris | Paradox Development Studio | 2M..5M | 140,165 | 85.6% | $14.99 | AA |
| 10 | Mount & Blade: Warband | TaleWorlds Entertainment | 2M..5M | 135,948 | 97.8% | $19.99 | III |
| 11 | Total War: WARHAMMER III | CREATIVE ASSEMBLY, Feral Interactive | 2M..5M | 108,418 | 72.7% | $8.99 | AAA |
| 12 | Crusader Kings III | Paradox Development Studio | 2M..5M | 95,286 | 90.3% | $14.99 | AA |
| 13 | Total War: WARHAMMER II | CREATIVE ASSEMBLY, Feral Interactive (Ma | 2M..5M | 85,195 | 92.9% | $14.99 | AAA |
| 14 | Crusader Kings II | Paradox Development Studio | 2M..5M | 74,019 | 90.3% | 무료/미확인 | AA |
| 15 | Age of Empires IV: Anniversary Edition | World's Edge, Relic Entertainment, Forgo | 2M..5M | 73,472 | 85.9% | $13.99 | AA |
| 16 | Total War: THREE KINGDOMS | CREATIVE ASSEMBLY, Feral Interactive (Ma | 2M..5M | 63,524 | 82% | $11.99 | AAA |
| 17 | Total War: ROME II - Emperor Edition | CREATIVE ASSEMBLY, Feral Interactive | 2M..5M | 55,134 | 87.2% | $7.49 | AAA |
| 18 | Northgard: Definitive Edition | Shiro Games | 2M..5M | 54,698 | 85.2% | $34.99 | III |
| 19 | They Are Billions | Numantian Games | 2M..5M | 46,473 | 85.1% | $26.99 | II |
| 20 | Men of War: Assault Squad 2 | Digitalmindsoft | 2M..5M | 35,865 | 91.6% | $29.99 | III |

### Tower Defense

steamrankings 분류: `tower-defense` · 풀 안 해당 타이틀 88개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Plants vs. Zombies GOTY Edition | PopCap Games, Inc. | 2M..5M | 145,178 | 97.7% | $4.99 | AA |
| 2 | They Are Billions | Numantian Games | 2M..5M | 46,473 | 85.1% | $26.99 | II |
| 3 | Dungeon Defenders II | Chromatic Games | 2M..5M | 22,207 | 77.2% | 무료/미확인 | III |
| 4 | Dome Keeper | Bippinbits | 2M..5M | 19,447 | 92.5% | $4.49 | I |
| 5 | Kingdom Rush  - Tower Defense | Ironhide Game Studio | 2M..5M | 17,458 | 97.3% | $4.99 | II |
| 6 | Orcs Must Die! 2 | Robot Entertainment | 2M..5M | 12,953 | 92% | $14.99 | III |
| 7 | Bloons TD Battles | Ninja Kiwi | 1M..2M | 29,335 | 90.7% | 무료/미확인 | III |
| 8 | Mindustry | AnukenDev | 1M..2M | 25,373 | 95.8% | $9.99 | II |
| 9 | Thronefall | GrizzlyGames, Mythwright | 1M..2M | 23,463 | 96% | $6.49 | I |
| 10 | The Riftbreaker | EXOR Studios | 1M..2M | 22,423 | 90.7% | $29.99 | III |
| 11 | The Last Spell | Ishtar Games | 1M..2M | 13,417 | 91.4% | $7.49 | III |
| 12 | Legion TD 2 - Multiplayer Tower Defense | AutoAttack Games | 1M..2M | 12,749 | 86.6% | $24.99 | II |
| 13 | Dungeon Defenders | Chromatic Games | 1M..2M | 12,250 | 93.1% | $14.99 | III |
| 14 | Bloons TD 5 | Ninja Kiwi | 1M..2M | 10,843 | 94.7% | $9.99 | II |
| 15 | Kingdom Rush Frontiers - Tower Defense | Ironhide Game Studio | 500K..1M | 10,514 | 96.6% | $4.99 | III |
| 16 | Rock of Ages | ACE Team | 200K..500K | 3,784 | 91.8% | $2.99 | II |
| 17 | ENDLESS Dungeon - Definitive Edition | AMPLITUDE Studios | 200K..500K | 3,604 | 65.3% | $14.99 | AA |
| 18 | Orcs Must Die! Deathtrap | Robot Entertainment | 200K..500K | 3,338 | 71.5% | $29.99 | III |
| 19 | Element TD 2 - Tower Defense | Element Studios | 200K..500K | 3,013 | 89.6% | $14.99 | - |
| 20 | Nordhold | StunForge | 200K..500K | 2,140 | 89.9% | $19.99 | II |

### Tactical FPS

steamrankings 분류: `shooter` + `extraction` · 풀 안 해당 타이틀 382개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Counter-Strike: Global Offensive | Valve | 200M..500M | 10,006,379 | 85.7% | 무료/미확인 | AAA |
| 2 | Team Fortress 2 | Valve | 100M..200M | 1,261,271 | 91.1% | 무료/미확인 | AAA |
| 3 | Tom Clancy's Rainbow Six Siege | Ubisoft Montreal | 20M..50M | 1,575,332 | 82% | 무료/미확인 | AAA |
| 4 | HELLDIVERS 2 | Arrowhead Game Studios | 20M..50M | 859,292 | 74.2% | $29.99 | AA |
| 5 | Left 4 Dead 2 | Valve | 20M..50M | 827,644 | 97.6% | $9.99 | AAA |
| 6 | War Thunder | Gaijin Entertainment | 20M..50M | 805,968 | 71.2% | 무료/미확인 | AAA |
| 7 | Destiny 2 | Bungie | 20M..50M | 665,239 | 78.8% | 무료/미확인 | AAA |
| 8 | Counter-Strike | Valve | 20M..50M | 170,983 | 97% | $9.99 | AA |
| 9 | PAYDAY 2 | OVERKILL - a Starbreeze Studio., Sidetra | 10M..20M | 446,701 | 89.9% | $9.99 | AA |
| 10 | Paladins | Evil Mojo Games | 10M..20M | 345,245 | 85.1% | 무료/미확인 | AA |
| 11 | Deep Rock Galactic | Ghost Ship Games | 10M..20M | 306,256 | 97.3% | $29.99 | III |
| 12 | Battlefield 2042 | DICE | 10M..20M | 260,631 | 49.3% | $2.99 | AAA |
| 13 | Half-Life 2 | Valve | 10M..20M | 205,640 | 97.7% | $9.99 | AAA |
| 14 | Halo Infinite | 343 Industries | 10M..20M | 181,463 | 69.3% | 무료/미확인 | AAA |
| 15 | World of Warships | Wargaming Group Limited | 10M..20M | 159,600 | 76.6% | 무료/미확인 | AAA |
| 16 | World of Tanks Blitz | Wargaming Group Limited | 10M..20M | 154,119 | 77.8% | 무료/미확인 | AA |
| 17 | Counter-Strike: Source | Valve | 10M..20M | 136,388 | 96.4% | $9.99 | AA |
| 18 | Half-Life | Valve | 10M..20M | 118,866 | 96.6% | $9.99 | AA |
| 19 | ROB RUN | Kefir | 10M..20M | 110,392 | 49.5% | 무료/미확인 | - |
| 20 | World of Tanks | Wargaming Group Limited | 10M..20M | 102,698 | 79.4% | 무료/미확인 | AAA |

### Multiplayer Co-op

steamrankings 분류: `co-op-horror` + `friend-slop` + `party` · 풀 안 해당 타이틀 90개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Phasmophobia | Kinetic Games | 10M..20M | 688,233 | 94.6% | $19.99 | II |
| 2 | Lethal Company | Zeekerss | 10M..20M | 412,450 | 97% | $9.99 | I |
| 3 | R.E.P.O. | semiwork | 10M..20M | 355,136 | 96.1% | $9.99 | II |
| 4 | Human Fall Flat | No Brakes Games | 10M..20M | 176,264 | 94.6% | $19.99 | II |
| 5 | SCP: Secret Laboratory | Northwood Studios | 5M..10M | 236,783 | 91% | 무료/미확인 | II |
| 6 | Crab Game | Dani | 5M..10M | 150,839 | 91.3% | 무료/미확인 | I |
| 7 | Stumble Guys | Scopely | 5M..10M | 139,961 | 85.1% | 무료/미확인 | AA |
| 8 | Stick Fight: The Game | Landfall West | 5M..10M | 100,063 | 93.6% | $1.99 | I |
| 9 | No More Room in Hell | No More Room in Hell Team | 5M..10M | 77,042 | 89.9% | 무료/미확인 | II |
| 10 | Overcooked! 2 | Ghost Town Games Ltd., Team17 | 5M..10M | 62,955 | 90.8% | $24.99 | III |
| 11 | Escape the Backrooms | Fancy Games, Blackbird Interactive | 2M..5M | 141,953 | 89.9% | $9.99 | II |
| 12 | Buckshot Roulette | Mike Klubnika | 2M..5M | 113,148 | 95.1% | $2.99 | I |
| 13 | The Outlast Trials | Red Barrels | 2M..5M | 104,583 | 92.4% | $39.99 | AA |
| 14 | Content Warning | Zorro, Wilnyl, Philip, thePetHen, Skog | 2M..5M | 73,523 | 93% | $4.95 | II |
| 15 | DEVOUR | Straight Back Games | 2M..5M | 69,132 | 90.8% | $9.99 | II |
| 16 | Party Animals | Recreate Games | 2M..5M | 56,984 | 81.4% | $19.99 | III |
| 17 | Chained Together | Anegar Games, Lab42 | 2M..5M | 55,765 | 89.8% | $4.99 | I |
| 18 | Gang Beasts | Boneloaf, Rocket Science | 2M..5M | 55,592 | 86% | $7.99 | II |
| 19 | One-armed robber | Duhndal | 2M..5M | 55,018 | 91.2% | 무료/미확인 | II |
| 20 | Gorilla Tag | Another Axiom Inc. | 2M..5M | 53,902 | 93.5% | $19.99 | II |

### Sandbox

steamrankings 분류: `sandbox` · 풀 안 해당 타이틀 74개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Terraria | Re-Logic | 20M..50M | 1,252,431 | 97.5% | $9.99 | II |
| 2 | Garry's Mod | Facepunch Studios | 20M..50M | 1,102,830 | 97% | $9.99 | III |
| 3 | VRChat | VRChat Inc. | 20M..50M | 276,675 | 73.4% | 무료/미확인 | AA |
| 4 | BeamNG.drive | BeamNG | 10M..20M | 402,406 | 97.2% | $24.99 | III |
| 5 | People Playground | mestiez | 5M..10M | 302,680 | 97.5% | $9.99 | II |
| 6 | Totally Accurate Battle Simulator | Landfall | 5M..10M | 145,718 | 97.9% | $6.79 | III |
| 7 | Scrap Mechanic | Axolot Games | 5M..10M | 111,069 | 92.1% | $28.99 | III |
| 8 | Teardown | Tuxedo Labs | 2M..5M | 129,452 | 96% | $29.99 | II |
| 9 | Kerbal Space Program | Squad | 2M..5M | 122,412 | 95.8% | $9.99 | III |
| 10 | My Summer Car | Amistech Games | 2M..5M | 110,329 | 94.9% | $14.99 | II |
| 11 | Space Engineers | Keen Software House | 2M..5M | 100,991 | 89.6% | $19.99 | AA |
| 12 | Ravenfield | SteelRaven7 | 2M..5M | 77,070 | 96.8% | $17.99 | II |
| 13 | SPORE | Maxis™ | 2M..5M | 67,538 | 92.6% | $3.99 | AAA |
| 14 | Blade and Sorcery | WarpFrog | 2M..5M | 59,566 | 96.6% | $29.99 | II |
| 15 | Goat Simulator | Coffee Stain Studios | 2M..5M | 54,924 | 90.7% | $9.99 | II |
| 16 | Besiege | Spiderling Studios | 2M..5M | 48,233 | 95.2% | $14.99 | II |
| 17 | Tabletop Simulator | Berserk Games | 2M..5M | 47,346 | 95.9% | $19.99 | II |
| 18 | BLOCKADE 3D | Novalink | 2M..5M | 25,083 | 58.8% | 무료/미확인 | II |
| 19 | Stormworks: Build and Rescue | Geometa | 1M..2M | 55,326 | 90.8% | $24.99 | II |
| 20 | Brick Rigs | Fluppisoft GmbH | 1M..2M | 54,739 | 95% | $19.99 | II |

### Puzzle

steamrankings 분류: `puzzle` · 풀 안 해당 타이틀 182개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Portal 2 | Valve | 10M..20M | 393,462 | 98.7% | $9.99 | AAA |
| 2 | Human Fall Flat | No Brakes Games | 10M..20M | 176,264 | 94.6% | $19.99 | II |
| 3 | Portal | Valve | 5M..10M | 175,828 | 98.5% | $9.99 | AA |
| 4 | Poppy Playtime | Mob Entertainment | 5M..10M | 145,008 | 88.1% | 무료/미확인 | III |
| 5 | Helltaker | vanripper | 2M..5M | 128,509 | 97.7% | 무료/미확인 | I |
| 6 | Mirror 2: Project X | KAGAMI Ⅱ WORKs | 2M..5M | 111,090 | 24.5% | $1.99 | I |
| 7 | Outer Wilds | Mobius Digital | 2M..5M | 91,740 | 95.5% | $12.49 | III |
| 8 | Papers, Please | Lucas Pope | 2M..5M | 73,897 | 97.4% | $9.99 | I |
| 9 | INSIDE | Playdead | 2M..5M | 70,565 | 97.1% | $24.99 | III |
| 10 | LIMBO | Playdead | 2M..5M | 41,104 | 91.4% | $12.49 | II |
| 11 | We Were Here | Total Mayhem Games | 2M..5M | 33,720 | 89.1% | 무료/미확인 | I |
| 12 | The Escapists 2 | Team17, Mouldy Toof Studios | 2M..5M | 26,665 | 90.9% | $1.99 | III |
| 13 | PICO PARK | TECOPARK | 2M..5M | 23,831 | 91.4% | $3.49 | I |
| 14 | Untitled Goose Game | House House | 2M..5M | 23,105 | 95.9% | $7.99 | II |
| 15 | Hacknet | Team Fractal Alligator | 2M..5M | 16,992 | 93.9% | $1.49 | I |
| 16 | Trine 2: Complete Story | Frozenbyte | 2M..5M | 15,297 | 95.2% | $19.99 | III |
| 17 | OneShot | Future Cat LLC | 1M..2M | 60,280 | 98.2% | $9.99 | II |
| 18 | Firework | Shiying Studio | 1M..2M | 41,364 | 97.7% | $9.99 | I |
| 19 | Brothers - A Tale of Two Sons | Starbreeze Studios AB | 1M..2M | 33,755 | 94.4% | $14.99 | III |
| 20 | Return of the Obra Dinn | Lucas Pope | 1M..2M | 33,058 | 96.6% | $19.99 | II |

### Cooking/Restaurant

steamrankings 분류: `cooking` · 풀 안 해당 타이틀 16개 → **상위 16개뿐 (20개 미만)**

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Overcooked! 2 | Ghost Town Games Ltd., Team17 | 5M..10M | 62,955 | 90.8% | $24.99 | III |
| 2 | PlateUp! | It's happening | 1M..2M | 19,383 | 94.5% | $4.99 | II |
| 3 | Overcooked | Ghost Town Games Ltd. | 1M..2M | 13,640 | 89.7% | $16.99 | II |
| 4 | Touhou Mystia's Izakaya | 二色幽紫蝶, Re零同人社 | 500K..1M | 29,949 | 98.5% | $5.99 | II |
| 5 | Cooking Simulator | Big Cheese Studio | 500K..1M | 17,909 | 84.9% | $4.99 | II |
| 6 | Papa's Freezeria Deluxe | Flipline Studios | 200K..500K | 12,474 | 99.3% | $5.99 | I |
| 7 | Kebab Chefs! - Restaurant Simulator | Biotech Gameworks | 200K..500K | 6,576 | 85.9% | $17.99 | I |
| 8 | Fast Food Simulator | No Ceiling Games | 200K..500K | 5,773 | 93.9% | $14.99 | I |
| 9 | Venba | Visai Games | 200K..500K | 2,577 | 92.3% | $14.99 | II |
| 10 | Shawarma Legend | Eyad Alshafei | 200K..500K | 0 | 미확인 | $2.99 | - |
| 11 | Good Pizza, Great Pizza - Cozy Cooking Simulator | TapBlaze | 100K..200K | 6,393 | 87.5% | $5.99 | I |
| 12 | The Supper | White Blanket Games | 100K..200K | 4,121 | 98.6% | 무료/미확인 | I |
| 13 | Chef Life: A Restaurant Simulator | Cyanide Studio | 100K..200K | 2,126 | 85% | $5.99 | - |
| 14 | Chef RPG | World 2 Studio | 100K..200K | 1,743 | 87.9% | $19.99 | II |
| 15 | TasteMaker | Jelle Booij | 100K..200K | 1,275 | 83.8% | $11.99 | - |
| 16 | Star Chef: Cooking & Restaurant Game | 99Games Online Pvt. Ltd. | 100K..200K | 361 | 57.3% | 무료/미확인 | - |

### Horror Survival

steamrankings 분류: `horror` + `co-op-horror` · 풀 안 해당 타이틀 346개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Phasmophobia | Kinetic Games | 10M..20M | 688,233 | 94.6% | $19.99 | II |
| 2 | Dead by Daylight | Behaviour Interactive Inc. | 10M..20M | 686,012 | 78.5% | $19.99 | AA |
| 3 | Lethal Company | Zeekerss | 10M..20M | 412,450 | 97% | $9.99 | I |
| 4 | R.E.P.O. | semiwork | 10M..20M | 355,136 | 96.1% | $9.99 | II |
| 5 | Resident Evil 4 | CAPCOM Co., Ltd. | 10M..20M | 196,419 | 97.4% | $39.99 | AAA |
| 6 | SCP: Secret Laboratory | Northwood Studios | 5M..10M | 236,783 | 91% | 무료/미확인 | II |
| 7 | Doki Doki Literature Club! | Team Salvato | 5M..10M | 231,097 | 96.5% | 무료/미확인 | I |
| 8 | Poppy Playtime | Mob Entertainment | 5M..10M | 145,008 | 88.1% | 무료/미확인 | III |
| 9 | Cry of Fear | Team Psykskallar | 5M..10M | 89,125 | 88.7% | 무료/미확인 | II |
| 10 | No More Room in Hell | No More Room in Hell Team | 5M..10M | 77,042 | 89.9% | 무료/미확인 | II |
| 11 | Escape the Backrooms | Fancy Games, Blackbird Interactive | 2M..5M | 141,953 | 89.9% | $9.99 | II |
| 12 | MiSide | AIHASTO | 2M..5M | 123,863 | 97.7% | $14.99 | I |
| 13 | Resident Evil Village | CAPCOM Co., Ltd. | 2M..5M | 109,565 | 95.7% | $39.99 | AAA |
| 14 | Outlast | Red Barrels | 2M..5M | 107,466 | 96.7% | $14.99 | III |
| 15 | The Outlast Trials | Red Barrels | 2M..5M | 104,583 | 92.4% | $39.99 | AA |
| 16 | Resident Evil 7 Biohazard | CAPCOM Co., Ltd. | 2M..5M | 90,295 | 95.4% | $19.99 | AAA |
| 17 | Resident Evil 4 (2005) | Capcom | 2M..5M | 79,954 | 94.5% | $19.99 | AAA |
| 18 | DEVOUR | Straight Back Games | 2M..5M | 69,132 | 90.8% | $9.99 | II |
| 19 | Outlast 2 | Red Barrels | 2M..5M | 55,352 | 90.8% | $19.99 | III |
| 20 | Five Nights at Freddy's | Scott Cawthon | 2M..5M | 54,223 | 94.2% | $4.99 | I |

### Automation/Factory

steamrankings 분류: `automation` · 풀 안 해당 타이틀 27개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Satisfactory | Coffee Stain Studios | 10M..20M | 239,004 | 97.4% | $39.99 | III |
| 2 | Factorio | Wube Software LTD. | 5M..10M | 194,320 | 97.6% | $35.00 | III |
| 3 | Dyson Sphere Program | Youthcat Studio | 2M..5M | 84,067 | 97.4% | $19.99 | II |
| 4 | Hydroneer | Foulball Hangover | 1M..2M | 27,404 | 85.6% | $14.99 | II |
| 5 | Mindustry | AnukenDev | 1M..2M | 25,373 | 95.8% | $9.99 | II |
| 6 | shapez 2 - Factory | tobspr Games | 500K..1M | 14,608 | 97% | $29.99 | III |
| 7 | shapez | Tobias Springer | 500K..1M | 14,437 | 96.1% | $9.99 | I |
| 8 | Rusty's Retirement | Mister Morris Games | 500K..1M | 13,995 | 96.8% | $4.19 | I |
| 9 | FOUNDRY | Channel 3 Entertainment | 200K..500K | 2,783 | 78.9% | $29.99 | II |
| 10 | Infinifactory | Zachtronics | 200K..500K | 2,414 | 94.9% | $12.49 | - |
| 11 | Big Pharma | Twice Circled | 200K..500K | 1,883 | 77.4% | $24.99 | - |
| 12 | EXAPUNKS | Zachtronics | 200K..500K | 1,766 | 94.9% | $19.99 | - |
| 13 | The Farmer Was Replaced | Timon Herzog | 200K..500K | 1,543 | 97% | $9.99 | - |
| 14 | Cash Cleaner Simulator | Mind Control Games | 100K..200K | 2,923 | 88.3% | $19.99 | - |
| 15 | Techtonica | Fire Hose Games | 100K..200K | 2,832 | 67.2% | $29.99 | III |
| 16 | The Crust | VEOM Studio | 100K..200K | 2,603 | 76.9% | $19.19 | II |
| 17 | Automation Empire | DOG HOGGLER | 100K..200K | 2,593 | 66.1% | $29.99 | II |
| 18 | Outpath | David Moralejo Sánchez | 100K..200K | 2,572 | 94.4% | $14.99 | - |
| 19 | Plan B: Terraform | Gaddy Games | 100K..200K | 2,425 | 91.5% | $15.99 | II |
| 20 | Voxel Tycoon | Voxel Tycoon | 100K..200K | 1,679 | 79.8% | $24.99 | - |

### Action Adventure

steamrankings 분류: `action-adventure` · 풀 안 해당 타이틀 454개

| # | 게임 | 개발사 | 보유자 (SteamSpy 추정) | 리뷰 수 | 긍정률 | 가격 | 규모 라벨 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | Resident Evil 4 | CAPCOM Co., Ltd. | 10M..20M | 196,419 | 97.4% | $39.99 | AAA |
| 2 | Sea of Thieves: 2026 Edition | Rare Ltd | 5M..10M | 323,823 | 88.9% | $13.99 | AAA |
| 3 | Tomb Raider Game of the Year | Crystal Dynamics, Eidos-Montréal, Feral  | 5M..10M | 176,312 | 95.9% | $19.99 | AAA |
| 4 | Stray | BlueTwelve Studio | 5M..10M | 159,462 | 97.2% | $14.99 | III |
| 5 | DAVE THE DIVER | MINTROCKET | 5M..10M | 145,481 | 96.6% | $19.99 | III |
| 6 | God of War | Santa Monica Studio, Jetpack Interactive | 5M..10M | 131,564 | 95.9% | $19.99 | AAA |
| 7 | Rise of the Tomb Raider | Crystal Dynamics, Eidos-Montréal, Feral  | 5M..10M | 129,794 | 94.2% | $29.99 | AAA |
| 8 | Devil May Cry 5 | CAPCOM Co., Ltd. | 5M..10M | 120,777 | 96.2% | $7.49 | AAA |
| 9 | MORDHAU | Triternion | 5M..10M | 91,655 | 80.3% | $29.99 | III |
| 10 | Warhammer: Vermintide 2 | Fatshark | 5M..10M | 91,265 | 84.7% | $29.99 | AA |
| 11 | STAR WARS Jedi: Fallen Order | Respawn Entertainment | 2M..5M | 154,859 | 88.2% | $7.99 | AAA |
| 12 | A Way Out | Hazelight Studios | 2M..5M | 79,097 | 87.3% | $5.99 | AA |
| 13 | Shadow of the Tomb Raider: Definitive Edition | Eidos-Montréal, Crystal Dynamics, Nixxes | 2M..5M | 73,130 | 84.8% | $39.99 | AAA |
| 14 | METAL GEAR RISING: REVENGEANCE | PlatinumGames | 2M..5M | 69,493 | 96.1% | $29.99 | AA |
| 15 | Dishonored | Arkane Studios | 2M..5M | 68,214 | 97.6% | $2.49 | AAA |
| 16 | ARMORED CORE VI FIRES OF RUBICON | FromSoftware, Inc. | 2M..5M | 67,507 | 91.6% | $59.99 | AAA |
| 17 | Hellblade: Senua's Sacrifice | Ninja Theory | 2M..5M | 67,088 | 90.1% | $29.99 | III |
| 18 | Katana ZERO | Askiisoft | 2M..5M | 66,745 | 98% | $14.99 | II |
| 19 | Batman: Arkham Asylum Game of the Year Edition | Rocksteady Studios | 2M..5M | 63,443 | 96.2% | $2.99 | AAA |
| 20 | HITMAN World of Assassination | IO Interactive A/S | 2M..5M | 61,122 | 87.8% | $27.99 | AA |

## 4. SteamSpy 태그 요청 결과 (참고용, 신뢰 낮음)

`https://steamspy.com/api.php?request=tag&tag=<Tag>` — 시도한 태그와 결과 수. 빈 결과는 `{}` 응답.

| 우리 장르 | 시도한 태그 (결과 수) | 채택 태그 | 결과 상위 5 (보유자 순) |
|---|---|---|---|
| Survival Crafting | Open World Survival Craft (0), Survival (387) | Survival (n=387) | PUBG: BATTLEGROUNDS, Apex Legends, Rust, Unturned, Palworld |
| Roguelike/Roguelite | Roguelite (0), Roguelike (0), Rogue-lite (211) | Rogue-lite (n=211) | The Binding of Isaac: Rebirth, Don't Starve Together, ELDEN RING NIGHTREIGN, Hades, Vampire Survivors |
| Bullet Heaven | Bullet Heaven (0), Survivors-like (0), Auto Battler (0), Bullet Hell (0) | 실패 | - |
| Metroidvania | Metroidvania (0), Platformer (174) | Platformer (n=174) | Terraria, Hollow Knight, Brawlhalla, Geometry Dash, Portal 2 |
| Deck Building | Deckbuilding (0), Card Battler (0), Deckbuilder (0), Card Game (0) | 실패 | - |
| MMORPG | MMORPG (0), MMO (2) | MMO (n=2) | Grand Theft Auto IV: The Complete Edition, FlatOut 2 |
| Open World RPG | Open World (0), RPG (0), Action RPG (234) | Action RPG (n=234) | Dota 2, Black Myth: Wukong, Warframe, Lost Ark, The Witcher 3: Wild Hunt — Remastered |
| Simulation | Simulation (797) | Simulation (n=797) | Dota 2, PUBG: BATTLEGROUNDS, Rust, Tom Clancy's Rainbow Six Siege, Garry's Mod |
| Farming Sim | Farming Sim (0), Life Sim (81) | Life Sim (n=81) | Stardew Valley, The Sims 4, Supermarket Together, MiSide, Cookie Clicker |
| Colony Sim | Colony Sim (47) | Colony Sim (n=47) | Prison Architect, RimWorld, Oxygen Not Included, Cult of the Lamb, Frostpunk |
| Strategy/RTS | RTS (0), Strategy (724) | Strategy (n=724) | Counter-Strike: Global Offensive, Dota 2, PUBG: BATTLEGROUNDS, Marvel Rivals, Tom Clancy's Rainbow Six Siege |
| Tower Defense | Tower Defense (0), Tower+Defense (0) | 실패 | - |
| Tactical FPS | Tactical (248) | Tactical (n=248) | Counter-Strike: Global Offensive, PUBG: BATTLEGROUNDS, Team Fortress 2, Apex Legends, Tom Clancy's Rainbow Six Siege |
| Multiplayer Co-op | Online Co-Op (448) | Online Co-Op (n=448) | Counter-Strike: Global Offensive, Dota 2, PUBG: BATTLEGROUNDS, Team Fortress 2, Rust |
| Sandbox | Sandbox (0), Building (231) | Building (n=231) | Rust, Palworld, Terraria, Garry's Mod, Stardew Valley |
| Puzzle | Puzzle (368) | Puzzle (n=368) | Portal 2, It Takes Two, Half-Life 2, Human Fall Flat, Life is Strange 2 |
| Cooking/Restaurant | Cooking (0), Food (0), Management (268) | Management (n=268) | Euro Truck Simulator 2, Schedule I, Sid Meier’s Civilization VI, Cities: Skylines, Factorio |
| Horror Survival | Survival Horror (0), Horror (493) | Horror (n=493) | PUBG: BATTLEGROUNDS, Apex Legends, Unturned, Tom Clancy's Rainbow Six Siege, Wallpaper Engine |
| Automation/Factory | Automation (94) | Automation (n=94) | Palworld, Schedule I, Satisfactory, Factorio, ASTRONEER |
| Action Adventure | Action-Adventure (237) | Action-Adventure (n=237) | Black Myth: Wukong, Lethal Company, Portal 2, Schedule I, Sons Of The Forest |

결과가 온 태그도 Counter-Strike·PUBG·Dota 2가 "Simulation", "Strategy", "Horror" 상위에 오는 등 장르 대표성이 낮아 위 표에 쓰지 않았다.

## 출처

- https://steamrankings.com/genres/ , https://steamrankings.com/data/genres.json (2026-11-27 수집)
- https://steamspy.com/api.php?request=all&page=<n> , https://steamspy.com/api.php?request=tag&tag=<Tag> , https://steamspy.com/api.php?request=appdetails&appid=<id>
- 각 요청 URL·시각: `data/steam-snapshot-2026-11-27.json`
