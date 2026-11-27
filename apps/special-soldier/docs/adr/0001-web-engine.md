# ADR 0001 — 엔진: Three.js + Vite (UE5 아님)

- 상태: 채택 · 2026-11-11
- 맥락: 요구는 UE5였으나 개발 환경에 Unreal Engine이 없어 컴파일·실행 검증이 불가능했다. "검증되지 않은 것을 만들지 않는다"가 상위 원칙이다.
- 결정: 브라우저에서 실행·자동 테스트가 가능한 Three.js(WebGL2) + Vite. UE5는 `docs/UE5_ARCHITECTURE.md` 에 이행 설계로만 둔다.
- 결과: 헤드리스 E2E로 전 캠페인을 검증할 수 있다. Nanite/Lumen/Chaos 급 표현은 불가능하다.
