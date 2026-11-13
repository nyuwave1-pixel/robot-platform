# 02. UX · 아키텍처

## 1. 사용자 흐름 (구현 기준)

| STEP | 화면 | 구현 |
|---|---|---|
| 01 | 메인 접속 `/` | 랜딩: 3D 얼굴 스캔, 첫 화면 업로드 박스 |
| 02–03 | 분석 시작 · 촬영/업로드 `/analyze` | 필수 동의 → 파일 선택·드래그·카메라, 목 사진(선택) |
| 04 | 얼굴 인식 · 품질 검사 | 미달이면 사유와 촬영 가이드만 보여 주고 점수를 만들지 않음 |
| 05 | AI 피부 분석 | 기기 내 실행, 진행 단계 표시 |
| (설문) | 피부 설문 (선택) | 건조·유분·민감·당김·트러블, 목표, 습관, 사용 제품, 기기 사용 제한 자가 확인 |
| 06 | 영역별 결과 | 2D/3D 얼굴 맵, 히트맵, 영역 선택 상세, TOP 5 |
| 07 | 더마홈 맞춤 케어 | 기능별 추천(근거·주의), DAY/NIGHT 루틴, 제품 |
| 08 | 가상 시뮬레이션 | CURRENT / 4 / 8 / 12 WEEKS + 슬라이더 |
| 09 | 리포트 저장 | PDF · PNG · (동의 시) 기기 내 기록 |
| 10 | 제품·무료 체험 | 공식몰 상품 페이지, 무료 체험, 파트너 문의 |
| — | 전후 비교 `/compare`, 기록 `/history`, 개인정보 `/privacy`, 관리자 `/admin` | |

## 2. 시스템 구조

```
브라우저 (모든 이미지 처리)                         서버 (Next.js Route Handlers)
┌──────────────────────────────────────────┐     ┌────────────────────────────────┐
│ UploadBox ─ blobToCanvas (EXIF 보정)      │     │ /api/events   익명 이벤트 수집   │
│   │                                      │     │ /api/config   공개 운영 설정     │
│ Provider(local-cv)                       │     │ /api/report   텍스트 신고        │
│   ├ MediaPipe Face Landmarker (WASM,CPU) │     │ /api/admin/*  인증·통계·설정     │
│   ├ quality.ts  품질 판정                 │────▶│        │                        │
│   ├ engine.ts   영역 지표·신뢰도          │익명  │   Store 어댑터                  │
│   └ → AnalysisResult(JSON) + VisualData  │이벤트│   ├ PostgreSQL (DATABASE_URL)   │
│ recommend.ts  케어 플랜 (규칙)            │     │   └ JSON 파일 (.data)           │
│ simulate.ts   가상 시뮬레이션             │     └────────────────────────────────┘
│ compare.ts    전후 비교                   │      이미지·랜드마크·점수는 서버로 가지 않는다
│ IndexedDB     (동의 시) 기기 내 기록       │
└──────────────────────────────────────────┘
```

### AI Provider 어댑터 (`src/lib/analysis/provider.ts`)

```ts
interface SkinAnalysisProvider {
  id: string; version: string;
  kind: "on-device" | "remote" | "mock";
  transmitsImage: boolean;                 // true 면 별도 동의 없이는 실행하지 않는다
  analyze(input, onProgress): Promise<{ result: AnalysisResult; visual: VisualData | null }>;
}
```

- `local-cv` (기본): 이 저장소에 구현된 기기 내 엔진.
- `mock`: 개발 빌드에서만 등록. 숫자를 만들지 않고 전부 null, `isMock: true` → 화면 상단 MOCK 배너 강제.
- 원격 Provider(서버 모델·외부 Vision API)는 **구현하지 않았다.** 추가 시 `registerProvider` 로 등록하고 `transmitsImage: true` 로 선언하면 되지만, 현재 `runFaceAnalysis` 는 전송형 Provider 실행을 막는다(전송 동의 플로우가 없기 때문). 06 문서의 선행 조건을 먼저 해결해야 한다.

### 결과 스키마

`src/lib/analysis/types.ts` 의 `AnalysisResult` 가 표준이다. 지시서 17항의 구조(sessionId, modelVersion, imageQuality, analysis.zones[], careRecommendations, simulation)를 포함하고, 다음을 추가했다: `isMock`, `provider.imageLeftDevice`, `validation.status`, `analysis.needsRetake / measurable / notMeasurable`, 영역별 `nullReason`. 측정할 수 없는 값은 `null` 이다.

## 3. 지시서 기술 스택과의 차이

| 지시서 | 실제 | 이유 |
|---|---|---|
| Next.js, React, TypeScript, Tailwind, Framer Motion, Three.js, R3F, Recharts | 그대로 사용 | |
| MediaPipe, Face Landmark, Skin Segmentation | MediaPipe Face Landmarker + 랜드마크 폴리곤·피부색 마스크 | 별도 세그멘테이션 모델 없이 폴리곤 + 색 유사도로 피부 마스크 구성 |
| OpenCV, Python, FastAPI, PyTorch | **미사용** — 동일 연산을 TypeScript 로 구현 | 사진을 서버로 보내지 않는 구조를 택함(개인정보·비용·지연). 서버 모델은 Provider 로 추가 가능 |
| Vision AI API | **미사용** | 지시서 5항 "이미지를 LLM에 넘겨 임의 점수 출력 금지". 외부 전송 동의·국외 이전 검토가 선행돼야 함 |
| PostgreSQL | 사용 (`postgres` 드라이버) | 로컬 PostgreSQL 16 에서 E2E 검증 |
| Prisma | **미사용** | 테이블 3개(이벤트·KV·신고)라 SQL 직접 사용. 스키마: `apps/mediderma-ai/db/schema.sql` |
| Redis, Background Job Queue | **미사용** | 서버에 무거운 작업·이미지 큐가 없음 |
| 임시 이미지 스토리지·암호화 | 해당 없음 | 서버에 이미지가 없음. 기기 내 기록은 IndexedDB(브라우저 저장소, 별도 암호화 없음) |
| Docker, GitHub Actions | Dockerfile·워크플로 작성 | **Docker 빌드는 이 환경에서 실행하지 못함**(데몬 없음). CI 는 PR 에서 처음 실행됨 |
| Vercel/AWS, Cloudflare, 모니터링 | **미설정** | 배포 대상 결정 필요 |

## 4. 더마홈 지식베이스 출처

`src/lib/care/knowledge.ts` 와 `locales/*.ts` 의 `kb.*`. 2026-11-13 에 아래에서 직접 확인한 내용만 담았다.

- dermahome.unincore.com — TECHNOLOGY 3종 설명, CARE GUIDE 페이스 루틴 1-1/1-2/1-3/2-1/2-2 (기능·시간·제품·부위별 방향), "미스트는 마무리에 필수"
- derma-partners.unincore.com/guide.html — 사용 5단계, FAQ(맨 피부 사용 금지, 주 1~3회 이내, 출력), 사용하면 안 되는 경우, "의료기기가 아님"
- 가이드북 PDF 5·7쪽 — 시그니처 루틴(이온토포레시스 기구는 눈가 제외), 주의사항
- www.unincore.com 공식몰 — 상품명·상세 URL (productSeq 50, 40, 27, 37, 43, 61, 492)

**공식 문구에서 바꾼 점 (확인 요청):** 부위별 방향 안내의 괄호 설명 중 효능으로 읽힐 수 있는 표현("노폐물 배출", "다크서클 & 붓기 완화", "V라인", "리프팅", "탄력 강화" 등)은 방향 정보만 남기고 뺐다. 원문 그대로 싣기를 원하면 `ko.ts` 의 `kb.routines.*.directions` 만 고치면 된다. 가격은 변동되므로 싣지 않았다. 헤어·바디 루틴은 얼굴 분석 범위 밖이라 넣지 않았다.
