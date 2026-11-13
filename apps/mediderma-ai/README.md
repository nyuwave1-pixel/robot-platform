# MEDIDERMA AI SKIN ANALYSIS

회원가입 없이 얼굴 사진 한 장으로 13개 얼굴 영역의 피부 표면 특징을 관찰하고, 더마홈(RF · 울트라소닉 · 이온토포레시스) 맞춤 케어와 4·8·12주 가상 시뮬레이션을 보여 주는 웹 앱.

- **사진은 브라우저 안에서만 처리된다.** 서버·외부 AI 로 전송하지 않는다.
- 분석 지수는 RGB 사진 기반 관찰 지수이며 **임상 검증 전**이다. 의료적 진단이 아니다.
- 설계·한계·테스트 결과: [`docs/mediderma-ai`](../../docs/mediderma-ai/00_README.md)

## 실행

```bash
npm install
npm run dev            # http://localhost:3200
npm run typecheck && npm test
npm run build && npm run start
```

환경변수는 [`.env.example`](.env.example) 참고. 외부 AI API 키는 필요 없다.

| 변수 | 용도 |
|---|---|
| `ADMIN_PASSWORD` | `/admin` 비밀번호(8자 이상). 없으면 관리자 비활성 |
| `DATABASE_URL` | PostgreSQL. 없으면 `.data/store.json` (서버리스에서는 영속되지 않음) |

## 구조

```
src/lib/analysis/   분석 엔진 (types · zones · engine · quality · calibration · compare · simulate · neck · provider)
src/lib/care/       더마홈 지식베이스(공식 자료 기반) · 추천 규칙
src/lib/i18n/       ko(기준) en ja zh es vi ru
src/lib/client/     세션 · 기기 내 기록(IndexedDB) · 익명 통계 · 리포트 저장
src/server/         저장소 어댑터(PostgreSQL / 파일) · 관리자 인증 · 통계
src/app/            / · /analyze · /compare · /history · /privacy · /admin · /api/*
tests/unit          vitest (41)
tests/e2e           실제 브라우저 검증 스위트 (53)
public/models       MediaPipe Face Landmarker 모델 (Apache-2.0, 자체 호스팅)
```

## 배포 메모

- Vercel: Root Directory 를 `apps/mediderma-ai` 로 지정. 통계·관리자 설정을 쓰려면 `DATABASE_URL` 필수.
- Docker: `docker build -t mediderma-ai apps/mediderma-ai` (이 저장소에서는 빌드 검증을 하지 못했다).
- 카메라 촬영은 HTTPS 에서만 동작한다.
