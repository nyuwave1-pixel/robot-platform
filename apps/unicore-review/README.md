# UNI&CORE 1ST BIRTHDAY CREAM — 구매 후기 이벤트 사이트

`https://unipromotion.unincore.com` — 이벤트 페이지(`/`)와 관리자 화면(`/admin`)을 한 사이트에 담은 독립 프로젝트입니다. 벌스데이 브랜드 사이트·더마홈 어드민과 코드·데이터가 분리되어 있습니다.

| 구성 | 위치 | 실행 환경 |
|---|---|---|
| 이벤트 페이지 | `src/` (Next.js) | Vercel 프로젝트 `unicore-review` |
| 관리자 화면 | `public/admin/` (정적 HTML + `promo.js`) | 〃 (`/admin`) |
| 접수·관리 API | `backend/` → 번들 `supabase/functions/birthday-review/index.ts` | Supabase Edge Function `birthday-review` |
| DB | `backend/sql/001_init.sql` | Supabase Postgres, 전용 스키마 `birthday_review` (Data API 비노출, RLS 켬) |
| 사진 | — | Supabase Storage 비공개 버킷 `birthday-review-images` |

## 관리자
- `/admin` → 개인 계정 로그인(이메일 + 비밀번호, 5회 실패 시 15분 잠금). 최초 1회는 설정 코드로 본사 최고 관리자 계정을 만듭니다. 2단계 인증(TOTP)은 API 에 남아 있으나 화면에서는 요구하지 않습니다(요청에 따라 제외).
- 역할: 본사 최고 관리자(전체) · 프로모션 운영 담당(검토·사진·지급) · 총판 관리자(자기 총판 코드의 참여자 조회, 연락처 가림) · 조회 전용
- 메뉴: 프로모션 대시보드 / 벌스데이 크림 후기 이벤트(기간·정책·총판 링크·재참여 예외·파기) / 이벤트 참여자 관리 / 후기 및 사진 관리 / 우수 후기 선정 관리 / 사은품 지급 관리 / 이벤트 통계 및 보고서 / 관리자 계정·권한
- 총판 링크: `/?d=총판코드`

## 개발
```bash
# 1) API (시험용 PostgreSQL 필요 — 운영 DB 와 무관)
cd backend && npm install
PROMO_TEST_PG_URL=postgres://user:pw@127.0.0.1:5432/review_local npm run serve   # http://localhost:8899/birthday-review
# 2) 사이트
cd .. && npm install
NEXT_PUBLIC_REVIEW_API=http://localhost:8899/birthday-review npm run dev         # http://localhost:3100
#    관리자: http://localhost:3100/admin?api=http://localhost:8899/birthday-review  (설정 코드: local-setup-code)
```
- 테스트: `cd backend && PROMO_TEST_PG_URL=postgres://…/postgres npm test` — 17개 시나리오(접수·중복·권한·사진·선정·지급·파기, 동시성 포함)
- API 배포: `cd backend && npm run build` 로 번들을 만든 뒤 `supabase/functions/birthday-review/index.ts` 를 Edge Function 으로 배포(verify_jwt 끔 — 함수가 자체 인증)
- 화면 문구: `src/data/reviewEvent.ts`. 제품 설명은 브랜드 사이트의 공식 원문(`src/data/{product,ingredients,howto,clinical}.ts`)을 그대로 씁니다.

## 운영 메모
- 허용 출처: Edge Function 비밀값 `BR_ALLOWED_ORIGINS`(쉼표 구분, 기본 `https://unipromotion.unincore.com`). `BR_TEST_ORIGINS` 출처의 접수는 테스트로 분리 저장됩니다.
- 암호화 키 = DB 의 무작위 값 + Supabase 서비스 키의 해시. **서비스 키(JWT secret)를 교체하면 기존 휴대폰·주소 암호문을 읽지 못합니다.** 교체가 필요하면 먼저 `BR_SECRET_KEY` 로 키를 고정하는 절차가 필요합니다.
- 사진은 올리기 전에 브라우저가 긴 변 1600px 로 줄이고(EXIF 제거), 서버가 형식·구조를 다시 검증하고 메타데이터를 한 번 더 지웁니다. 관리자 화면이 발급하는 5분짜리 서명 URL 로만 열립니다.
- 개인정보 파기: 관리자 화면 > 벌스데이 크림 후기 이벤트 > 보유 기간 만료·파기 (자동 실행 없음).
- 롤백: Vercel 이전 배포로 되돌리기 / 접수만 중단은 관리자 화면에서 `접수 마감` / DB 전체 제거는 `backend/sql/001_init.down.sql`(먼저 백업).

## 연동되지 않은 것
- 유니앤코어 공식몰 회원 대조(회원번호는 참여자 입력값이며 관리자가 직접 확인), 당첨·배송 알림 자동 발송(문자·알림톡), 프로틴 쉐이크 제품 이미지.
