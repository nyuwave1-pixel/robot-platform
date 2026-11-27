# Unity 슬라이스 전용 에셋 라이선스 대장

웹 게임과 같이 쓰는 에셋(Freesound 소리, Poly Haven 사진 텍스처, Blender GLB)은 웹 게임 대장
[`apps/special-soldier/docs/ASSET_LICENSES.md`](../special-soldier/docs/ASSET_LICENSES.md)에 있습니다(웹 크레딧 화면 테스트가 그 대장을 검사함).
여기에는 **Unity 슬라이스에서만 쓰는 에셋**만 적습니다.

| 에셋 | 개수 | 라이선스 | 출처 표기 | 위치 | 받는 법 |
|---|---|---|---|---|---|
| Quaternius Universal Animation Library [Standard] (병사 애니메이션, 2026-11-25) | 1 파일(동작 43개, 9개 사용) | CC0 1.0 | 없음(작가 표기 권장: Quaternius) | `apps/unity-studio/Assets/ThirdParty/Quaternius/UAL/UAL1_Standard.fbx` + `License.txt` | `apps/unity-studio/Tools~/fetch-ual.mjs` (itch.io 무료 받기, SHA-256 검증) |
| Poly Haven HDRI 하늘 (Unity 슬라이스, 2026-11-25) | 5 | CC0 1.0 | 없음 | `apps/unity-studio/Assets/Resources/Sky/sky_*.hdr` (1K) | `apps/unity-studio/Tools~/fetch-hdris.mjs` (MD5 검증) |

| 에셋 | 출처 | 작성자 | 라이선스 | 받은 날 | 검증 | 쓰임 |
|---|---|---|---|---|---|---|
| kloofendal_48d_partly_cloudy_puresky (HDRI 1K) | Poly Haven | Poly Haven | CC0 1.0 | 2026-11-25 | MD5 `c69498687e876bf68d2a8b8a62234eb9` | Unity 하늘 — 맑은 낮(day) |
| kloppenheim_06_puresky (HDRI 1K) | Poly Haven | Poly Haven | CC0 1.0 | 2026-11-25 | MD5 `995d68b1656f26452572645c0ffe898b` | Unity 하늘 — 새벽(dawn) |
| overcast_soil_puresky (HDRI 1K) | Poly Haven | Poly Haven | CC0 1.0 | 2026-11-25 | MD5 `7fbca6264f4618a787092b9e1679a578` | Unity 하늘 — 폭풍(storm) |
| belfast_sunset_puresky (HDRI 1K) | Poly Haven | Poly Haven | CC0 1.0 | 2026-11-25 | MD5 `38890f597727936a44d17a97f7f73354` | Unity 하늘 — 해 질 녘(dusk) |
| qwantani_night_puresky (HDRI 1K) | Poly Haven | Poly Haven | CC0 1.0 | 2026-11-25 | MD5 `e8691211295e505f77c8c3bdcf3055d9` | Unity 하늘 — 밤(night) |
| UAL1_Standard.fbx (Universal Animation Library [Standard], Unity용 FBX, 루트 모션 없음) | https://quaternius.itch.io/universal-animation-library (팩 소개 https://quaternius.com/packs/universalanimationlibrary.html) | Quaternius | CC0 1.0 (팩 안 `License.txt`, itch.io 페이지 "Creative Commons Zero v1.0 Universal") | 2026-11-25 | SHA-256 `21b32d912da3cb93426d974fb945e86f5b2e86970acd2ce89905e0fbf9f1dcc2` (zip `cc73fc4e495b82958207316596317a3f40b9fa38065bde1027937452da537724`) | Unity 적 병사 동작 — Idle·Walk·Jog·Sprint·Crouch Idle/Fwd·Hit Chest/Head·Death01 (`Runtime/SoldierAnimator.cs`) |
