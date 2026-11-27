# QA 체크리스트

요청서의 QA 항목과 자동 검사의 대응표입니다. 자동 검사 결과는 `npm run qa`가 생성하는 `exports/QA_REPORT.md`에 기록되고, 사람이 눈으로 확인할 항목은 `exports/_sheets/` 컨택트 시트로 봅니다.

| 요청 항목 | 자동 검사 | 사람 확인 |
|---|---|---|
| 각 사이즈의 정확한 픽셀 크기 | `png-pixels`, `jpg-pixels` (규격과 1px 단위 일치) | — |
| 인쇄물의 정확한 mm 크기 | `media=size+bleed`, `trimbox`, `bleedbox` (±0.2mm) | — |
| 로고와 제품 패키지 동일성 | 로고는 공식 SVG 패스를 그대로 사용, `product-aspect` (비율 오차 0.1% 미만) | 시트에서 라벨·골드 캡 확인 |
| 3개 언어 문구 정확성 | `glyphs` (누락 글리프 0) | 시트에서 언어별 카피 확인 |
| 중국어 폰트 정상 표시 | `glyphs`, Noto Serif/Sans SC 내장 아웃라인 | 시트 확인 |
| 텍스트 잘림·겹침 없음 | `layout` (text-fit, overlap-text, overlap-product, outside-safe, outside-trim) | — |
| 이미지 왜곡 없음 | `product-aspect` | — |
| 임상 수치와 주석 정확성 | `clinical-footnote` (임상 캠페인은 각주 필수), 수치는 공식 자료로 고정 | — |
| 28일 고지 | `story-disclaimer` | — |
| 모바일 가독성 | 최소 글자 크기 규칙 (모바일 소셜 각주 17 / 본문 25 / 헤드라인 40px), `layout` | 시트 확인 |
| 인쇄 색상 모드 | `cmyk` (모든 이미지 DeviceCMYK), 벡터도 CMYK | 출력소 교정쇄 |
| 재단 여유와 안전영역 | `trimbox`, `bleedbox`, `outside-safe` | — |
| 글자 아웃라인 | `fonts-outlined` (PDF 내 폰트 0개) | — |
| 해상도 | `raster-ppi` (규격 dpi ±2), `source-resolution` (원본 ppi 표시) | 대형물은 PRINT_GUIDE 참고 |
| 파일 정상 열림 | PNG·JPG·PDF·SVG를 다시 열어 파싱, `svg-self-contained` | — |
| 플랫폼 용량 제한 | `file-size` (JPG ≤ maxKB) | — |
| QR 정상 작동 | `qr-scan` (렌더 결과에서 디코드 → 언어별 URL 일치) | 실물 스캔 |
