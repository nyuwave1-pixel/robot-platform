# Asset ledger — SURVIVAL WORLD

웹판: 외부 에셋 없음. 지형·나무·바위·덤불·모닥불·벽·늑대는 three.js 기본 도형을 코드로 조합해 그립니다.
유니티판 모델: `blender/build_assets.py` 가 직접 만든 원본(`assets/survival.glb`) — 외부 에셋 아님.
외부 모델·텍스처·소리·글꼴을 들일 때는 `free-asset-pipeline` 스킬 절차(라이선스 확인 → 이 대장 → 게임에서 확인)를 따릅니다.

| 에셋 | 출처 | 만든 이 | 라이선스 | 받은 날 | 파일 · SHA-256 | 쓰는 곳 |
|---|---|---|---|---|---|---|
| Noto Sans KR Regular (부분 글꼴, 210자) | npm `@expo-google-fonts/noto-sans-kr@0.4.4` (Google Fonts 배포본) — 원본 `NotoSansKR_400Regular.ttf` b4a747e7…ef4 | Adobe / Google (Noto) | SIL OFL 1.1 (`apps/unity-studio/Assets/Survival/Fonts/OFL.txt`, https://openfontlicense.org) | 2026-11-27 | `apps/unity-studio/Assets/Survival/Fonts/NotoSansKR-Survival.ttf` d1f8567aa233f75cadd36e384276b0825d6098ef22cf791e06215671d1cc91e3 | 유니티판 IMGUI HUD 한글 (WebGL 기본 글꼴에 한글 없음). 다시 만들기: `apps/unity-studio/Tools~/gen-survival-font.py` |
