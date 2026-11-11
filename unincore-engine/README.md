# UNI&CORE AI SEO & Auto Marketing Engine

제품 데이터 수집 → SEO 점검 → 키워드 발굴 → (연결 시) Gemini·Canva·Higgsfield·성과 수집 → 리포트를 매일 실행하는 엔진입니다.
**연결되지 않은 API는 성공으로 처리하지 않고 `waiting_connection`으로 기록합니다.**

## 현재 상태 (2026-11-10, 실제 실행 기준)

| 단계 | 상태 | 내용 |
|---|---|---|
| 1 사이트·제품 분석 | 완료 | us.unincore.com 제품 60개, 이미지 232장 수집 (robots.txt: Allow) |
| 2 DB·대시보드 | 부분 | 21개 테이블, 읽기 전용 대시보드. 편집 UI·사용자 권한은 없음 |
| 3 Gemini | 대기 | 키 인증(`x-goog-api-key`)과 모델 목록 호출은 확인. 생성 호출은 선불 크레딧 소진(402)으로 **미검증** |
| 4 SEO 엔진 | 부분 | promotion.unincore.com 15페이지 감사·메타 백업. 서치 콘솔 미연결 |
| 5 Canva·Higgsfield | 대기 | 키 없음. 작업 사양만 대기열 저장 |
| 6 자동 반영·승인 | 동작 | 승인 → 검증(길이·금지 표현) → `unincore-promotion/src/content/seo-overrides.json` 반영. 제목·설명·추가 FAQ만 가능. 실제 공개는 git push 후 배포 시점 |
| 7 Amazon 광고 | 대기 | Amazon Ads API 권한 필요 |
| 8 매일 실행 | 부분 | 파이프라인(잠금·재시도·로그) + GitHub Actions 워크플로 |
| 9 테스트·보안 | 부분 | 단위 테스트 10개, Basic 인증 |
| 10 운영 배포 | 미구현 | 호스팅·PostgreSQL 결정 필요 |

unincore.com(한국 본사 사이트)은 robots.txt 응답이 없어 수집하지 않았습니다.

## 실행

```bash
cd unincore-engine
pip install -r requirements.txt
python -m engine daily            # 전체 파이프라인 1회
python -m engine sync_products    # 개별 작업: connections | sync_products | seo_audit | discover_keywords | gemini_content | creatives | performance | report
python -m pytest -q
ENGINE_ADMIN_PASSWORD=... uvicorn engine.api:app --port 8100   # 대시보드 (user: admin)
```

- DB: 기본 SQLite `data/engine.db`. 운영은 `DATABASE_URL=postgresql+psycopg://...` (+ `pip install "psycopg[binary]"`).
- 리포트: `data/latest.json`, `data/reports/YYYY-MM-DD.json`.
- 스케줄: `.github/workflows/unincore-engine-daily.yml` (매일 01:00 KST). 단계별 시간은 `automation_schedules` 테이블에 있고
  `PATCH /api/schedule/<job>?local_time=HH:MM`으로 바꿀 수 있지만, **지금은 워크플로가 한 번에 순서대로 실행**하므로 시간값은 표시용입니다.

## API 없이 실제 데이터 넣기 (CSV)

```bash
# 서치 콘솔: 실적 → 내보내기 → Queries.csv
curl -u admin:$ENGINE_ADMIN_PASSWORD -H "Content-Type: text/csv" --data-binary @Queries.csv \
  "http://localhost:8100/api/import/gsc-queries?site=https://promotion.unincore.com"
# Amazon Ads: Sponsored Products 검색어 보고서 CSV
curl -u admin:$ENGINE_ADMIN_PASSWORD -H "Content-Type: text/csv" --data-binary @search-terms.csv \
  "http://localhost:8100/api/import/amazon-search-terms"
```

파일에 있는 값만 저장합니다(빈 칸은 NULL). 검색어는 제품명 단어가 2개 이상 겹칠 때만 제품에 연결됩니다.
승인: `GET /api/approvals`, `POST /api/approvals/<id>/approve|reject`.

## API 연결 (환경변수 / GitHub Secrets)

| Provider | 변수 | 얻는 곳 |
|---|---|---|
| Gemini | `GEMINI_API_KEY` (`GEMINI_MODEL` 선택) | Google AI Studio → API keys |
| Search Console · GA4 | `GSC_SERVICE_ACCOUNT_JSON`, `GSC_SITE_URL`, `GA4_PROPERTY_ID` | Google Cloud 서비스 계정 → 서치 콘솔·GA4에 사용자로 추가 |
| Naver | `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` | developers.naver.com (DataLab). 서치어드바이저 성과 API는 공개되지 않음 |
| Canva | `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`, `CANVA_REFRESH_TOKEN` | canva.com/developers (Connect API, OAuth) |
| Higgsfield | `HIGGSFIELD_API_KEY` | Higgsfield 계정 (API 제공 여부·크레딧 확인 필요) |
| Amazon Ads | `AMAZON_ADS_CLIENT_ID/SECRET/REFRESH_TOKEN/PROFILE_ID` | Amazon Ads API 승인 후 LWA 앱 |

키는 코드·DB에 저장하지 않습니다. 환경변수(또는 Secrets Manager)로만 읽습니다.

## 원칙

- 검색량·경쟁도·순위·전환은 실제 소스가 있을 때만 기록 (없으면 NULL, 화면엔 "미연결").
- 사실(`kind=fact`)과 AI 문구(`kind=ai`) 분리. 원본 제품 이미지는 `locked`.
- 가격·성분·인증·임상 수치 변경은 `approval_requests.protected`로 항상 수동 승인 대상.
- Amazon 광고 데이터(`amazon_campaigns`)와 검색 성과(`search_performance`)는 별도 테이블.
- 쇼핑몰 수집은 robots.txt 확인 후 요청 간 0.4초 간격.

## 홍보 이미지 (creatives)

`python -m engine creatives` 는 외부 API 없이 자체 템플릿 렌더러(`creatives/render.mjs`, node + playwright)로 제품당 3종(Pinterest 1000×1500, Instagram 1080×1350, Story 1080×1920) PNG를 `data/creatives/` 에 만듭니다.

- 제품 사진은 프로모션 사이트의 공식 사진을 크기만 맞춰 그대로 씁니다(자르기·보정·AI 재생성 없음).
- 문구는 `creatives/copy.json` 에만 있으며, 사이트에 이미 있는 사실만 허용합니다(가격·할인·평점·리뷰·임상 수치 금지, 테스트로 검증).
- Canva / Higgsfield API는 계속 `waiting_connection` 으로 보고됩니다. Canva AI 생성은 제품 사진을 다른 병으로 바꿔 그려 사용하지 않습니다.

## 운영 DB (PostgreSQL / Supabase)

기본은 로컬 SQLite(`data/engine.db`)입니다. `DATABASE_URL` 을 PostgreSQL 주소로 주면 그대로 PostgreSQL을 씁니다. `postgres://`, `postgresql://` 로 시작하는 주소(Supabase가 주는 형식)도 자동으로 맞춰 읽습니다.

1. Supabase 프로젝트의 Connect → **Session pooler** 주소를 복사합니다(GitHub Actions는 IPv4라서 Direct 주소가 아니라 pooler 주소를 써야 합니다).
2. GitHub 저장소 Settings → Secrets → Actions 에 `ENGINE_DATABASE_URL` 로 저장합니다. 주소는 채팅이나 저장소 파일에 쓰지 않습니다.
3. 첫 실행 때 21개 테이블이 자동 생성되고, `data/approvals.json` 의 승인 기록이 복원됩니다.

2026-11-11 PostgreSQL 16에서 `python -m engine daily` 전체를 실행해 확인했습니다(제품 60, 이미지 232, 키워드 269, 페이지 15, 승인 4).
