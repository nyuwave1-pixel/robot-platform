# HEARTHVALE

오리지널 생활 시뮬레이션. 28일 한 계절 동안 24칸 밭에 작물 4종(순무·당근·딸기·호박)을 기르고, 마을 사람 3명(미라·토마스·주노)과 친해지면 혜택(기력 +2, 밭 갈기 기력 감소, 씨앗 할인)이 열린다.
날씨(맑음·비·폭풍)와 날마다 시세는 시드로 정해져 있어 같은 시드는 누구에게나 같은 계절이다. 점수 = 골드 + 하트 × 40.

- 실행: `npx --yes vite --port 5185` 또는 아무 정적 서버로 `index.html`
- 테스트: `node --test tests/*.test.mjs` (규칙·토큰·레벨 클리어 가능성·리플레이 검증)
- 규칙 `src/logic.js` · 레벨 `src/levels.js` (초원 마을·골짜기·가뭄 여름·빈손 출발) · 검증 `src/verify.js` (metric = 점수, 높을수록 좋음) · 탐욕 봇 `src/bot.js` (테스트용)
- 포털: `src/portal.js` — airobotphysical RP(등급), BIT PARK PP(검증 클리어) + **PP 상점**(벚꽃 테마·고양이·자유 모드, `game.json` `items`). 표준: `docs/game-dev/PORTAL_ECONOMY.md`
- 조작: 밭 칸 클릭(갈기 → 심기 → 물 → 수확), 1–5 도구, Z 잠자기
