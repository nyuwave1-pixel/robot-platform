# 스타일 챌린지 — 다른 뷰티·패션 게임 분석과 반영

다른 게임의 **시스템 원리만** 참고했다. 이름·캐릭터·아트·문구는 가져오지 않았고 테마·아이템 수치·화면은 모두 새로 만들었다.

## 조사한 것과 배운 점

| 관찰 | 출처 | 우리 게임에 반영 |
|---|---|---|
| 테마 라운드가 장르의 중심. 라운드마다 하나의 테마를 주고 그에 맞춰 꾸민다 | Dress to Impress 테마 가이드, IMVU Outfit Challenge, 나노빗 Runway Challenge | **오늘의 테마** 10종이 날마다 바뀐다 (모든 플레이어가 같은 날 같은 테마) |
| 점수 방식은 크게 둘: 태그 겹침(단순) / 아이템별 숫자 속성 × 테마 가중치(깊음) | Infinity Nikki 스타일링 가이드, Unity 패션 게임 개발 글 | 아이템마다 **5가지 스타일 수치(0~5)** × 테마 가중치 × 슬롯 가중치. 색 계열이 맞으면 보너스 |
| 숫자 게임은 플레이어가 "왜 이 점수인지" 알 수 있어야 한다 | Infinity Nikki 가이드 | **점수표 전부 공개**: 스타일별 막대, 아이템별 점수 |
| 같은 정답 반복은 지루함으로 이어진다 (콘텐츠 반복이 이탈 사유) | 메이크오버 게임 리뷰 분석 | **오늘의 트렌드**: 테마와 따로 도는 스타일 하나가 ×1.5 — 같은 테마라도 정답이 달라진다 |
| 개인화가 리텐션을 크게 올린다 (15~25%) / 평평한 출석 보상보다 점점 커지는 보상 | 2026 모바일 리텐션 가이드 | **스타일리스트 팁**: 내가 가진 아이템 중 점수를 가장 많이 올리는 한 수를 계산해 보여 주고 바로 입어 볼 수 있다. **연속 출전 보상**이 7일 주기로 커진다 |
| 좋아요·팔로워가 진행의 동력이지만 보상이 흩어지면 약해진다 | Fashion Dreamer 리뷰들 (Muse·좋아요 루프) | 순위 보상이 **코인 + 팔로워**로 기존 소셜 성장(팔로워)과 바로 연결 |
| 익명·투표 남용 방지 | IMVU 도움말 | 지금은 결정적 가상 라이벌(날짜 시드)로 심사 — 실제 투표는 서버가 생긴 뒤 단계 |

## 규칙
- 하루 3번 출전, 라운드마다 라이벌이 강해진다 (같은 날·라운드는 같은 상대).
- 순위 보상: 1등 220 코인·팔로워 30 … 5등 40 코인·팔로워 2. 연속 출전 하루 30코인씩(최대 7일분) + 7일마다 10젬.
- 100점 기준 = 슬롯마다 게임에 있는 가장 잘 맞는 아이템을 걸쳤을 때. 시작 아이템만으로는 테마에 따라 6~78점.
- 코드: `src/data/style.ts` (수치·점수), `src/store/life.ts` (`enterChallenge`), `src/ui/StyleChallenge.tsx`, 테스트 `tests/life.test.ts`.

## 출처
- [Infinity Nikki styling challenge guide — Inverse](https://inverse.com/gaming/infinity-nikki-styling-challenge-guide-cool-elegant-fresh-sexy-sweet)
- [Building a fashion game in Unity — DEV Community](https://dev.to/unitysourcecode/building-a-fashion-game-in-unity-outfit-matching-progression-3832)
- [Dress to Impress theme guide — BlueStacks](https://www.bluestacks.com/blog/game-guides/roblox/rl-dress-to-impress-theme-guide-outfit-ideas-en.html)
- [IMVU Outfit Challenge on Mobile](https://support.imvu.com/support/solutions/articles/154000243589-outfit-challenge-on-mobile)
- [Nanobit — What are runway challenges](https://nanobit.helpshift.com/hc/en/14-fashion-nation/faq/542-what-are-runway-challenges)
- [Mobile game retention strategies 2026 — Game Growth Advisor](https://gamegrowthadvisor.com/blog/2026-03-17-mobile-game-retention-strategies-2026/)
- [Glow Up: Four Lessons from Makeover Studio 3D — Kwalee](https://www.kwalee.com/blog/makeover-studio-3d-lessons)
- [Fashion Dreamer review — TechRadar](https://www.techradar.com/gaming/fashion-dreamer-review-fast-fashion), [Siliconera](https://www.siliconera.com/review-fashion-dreamer-isnt-very-style-savvy/)
