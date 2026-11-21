# GitHub 오픈소스 의존성

이 게임은 GitHub 저장소의 코드를 복사해 넣지 않고, npm 패키지로만 씁니다. 엔진(Three.js + React Three Fiber)은 그대로 유지합니다.

| 저장소 | 쓰는 방식 | 라이선스 | 비고 |
|---|---|---|---|
| [mrdoob/three.js](https://github.com/mrdoob/three.js) | npm `three` | MIT | 렌더러, GLTFLoader(EXT_texture_webp 포함), RGBELoader |
| [pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber) | npm | MIT | |
| [pmndrs/drei](https://github.com/pmndrs/drei) | npm | MIT | `Environment` 로 Poly Haven HDRI 를 불러온다 |
| [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) · [react-postprocessing](https://github.com/pmndrs/react-postprocessing) | npm | Zlib · MIT | |
| [pmndrs/zustand](https://github.com/pmndrs/zustand) | npm | MIT | |
| [supabase/supabase-js](https://github.com/supabase/supabase-js) | npm `@supabase/realtime-js` | MIT | 월드 광장 실시간 접속 |

## 검토했지만 적용하지 않은 것
| 저장소 | 판단 |
|---|---|
| tranek/GASDocumentation, Lyra, UE5 스타터 템플릿 | Unreal Engine 전용 — 이 게임은 웹(Three.js)이라 해당 없음 |
| A19200332/awesome-game-assets, jjones26/free-and-open-source-game-dev-resources | LICENSE 없음 → 링크 참고만, 내용 복사 안 함 |
| ellisonleao/magictools (MIT), madjin/awesome-cc0 (CC0) | 출처 목록으로만 참고 |
