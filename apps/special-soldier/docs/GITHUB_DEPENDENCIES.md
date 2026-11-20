# 코드 의존성 (GitHub / npm)

| 패키지 | 버전 | 라이선스 | 저장소 | 용도 | 배포물에 포함 |
|---|---|---|---|---|---|
| three | 0.170.0 | MIT | https://github.com/mrdoob/three.js | 렌더러, GLTFLoader, 후처리 | 예 |
| vite | 5.4.x | MIT | https://github.com/vitejs/vite | 빌드 | 아니오 |
| vite-plugin-singlefile | 2.3.4 | MIT | https://github.com/richardtallent/vite-plugin-singlefile | 단일 HTML 빌드 | 아니오 |
| electron | 33.4.x | MIT | https://github.com/electron/electron | 데스크톱 래퍼 | 래퍼 빌드에만 |
| @electron/packager | 18.4.x | BSD-2-Clause | https://github.com/electron/packager | 래퍼 패키징 | 아니오 |
| playwright (테스트 실행 환경, package.json 밖) | 1.65 | Apache-2.0 | https://github.com/microsoft/playwright | E2E 테스트 | 아니오 |

외부 저장소의 코드를 복사해 넣은 것은 없다.

## 검토했지만 아직 넣지 않은 것 (ASSET_RESEARCH.md §3)

| 저장소 | 라이선스 | 보류 이유 |
|---|---|---|
| isaac-mason/navcat | MIT | v0.15에서 검토 후 미사용: 월드가 높이맵 + 축 정렬 박스라 자체 그리드 A*(`src/game/nav.js`, 의존성 없음, 단일 HTML 빌드 영향 없음)로 충분. 외부 코드 복사 없음 |
| donmccurdy/glTF-Transform + zeux/meshoptimizer | MIT | v0.14에서 검토 후 보류: 양자화된 정점이 게임의 `mergeGeometries`(같은 배열 타입 요구)와 피벗 처리를 깨뜨릴 위험, GLB는 이미 번들 gzip 안에 있어 이득이 작음 |
| N8python/n8ao · pmndrs/postprocessing | CC0 · Zlib | 실제 GPU 측정 후 결정 |
| tranek/GASDocumentation 등 UE 전용 3종 | MIT | 엔진이 달라 해당 없음 |
