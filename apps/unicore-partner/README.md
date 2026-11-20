# UNI&CORE PARTNER — 사업자 화이트라벨 홈페이지 플랫폼

UNI&CORE 사업자가 이름·사진·사업장·연락처·SNS를 입력하면, 선택한 디자인 엔진으로 개인 브랜드 홈페이지가 만들어지고
본사 승인 후 `도메인/@아이디` 주소와 QR 코드로 공개됩니다.

## 구성 (1차 MVP)
| 화면 | 주소 | 내용 |
|---|---|---|
| 소개 | `/` | 플랫폼 소개, 가입 |
| 로그인·가입 | `/login` | 이메일+비밀번호 (Supabase Auth), 인증 메일 링크는 `/auth/callback` |
| 사업자 스튜디오 | `/studio` | 주소 만들기 → 정보·사진·SNS 입력, 디자인 선택, 섹션 숨김·순서(끌어서 이동), 공식 제품 선택, QR 저장, 모바일/태블릿/PC 실시간 미리보기, 되돌리기 |
| 공개 페이지 | `/@아이디` (= `/p/아이디`) | 승인된 페이지만. 동적 메타·OG·Twitter·canonical, JSON-LD(Person·LocalBusiness·Product·Breadcrumb), 모바일 하단 상담 버튼 |
| 본사 관리 | `/hq` | 사업자 승인·비공개, 공식 제품 등록·수정(모든 사업자 페이지에 즉시 반영) |
| 검색 | `/sitemap.xml`, `/robots.txt` | 승인된 페이지 자동 포함 |

디자인 엔진: **Luxury Black**(블랙×샴페인 골드, 세리프, 아치형 인물 마스크) · **Premium White**(화이트 스튜디오, 얇은 산세리프, 사각 마스크).
모션: 글자 단위 등장(Split text), 블러 해제 등장, 이미지 마스크 등장, 마우스 패럴랙스, 스크롤 연동 히어로 전환, 자석 버튼, 무한 마퀴. 모두 '동작 줄이기' 설정을 따릅니다.

## 보안 (DB 가 최종 보장)
- 행 단위 보안(RLS): 사업자는 **자기 페이지만** 읽기·쓰기. 비로그인 방문자는 **승인된 페이지의 공개 열만**(소유자 ID 제외).
- 트리거: 사업자는 승인 상태·소유자를 바꿀 수 없음. 승인 후 주소를 바꾸면 자동으로 재심사 대기.
- 공식 제품: 본사 관리자만 수정. 사업자는 고르기만 가능(이름·이미지·인증·임상 문구 변경 불가).
- 입력 검증: 화면 + DB CHECK 제약 이중 검사. 링크는 `https://` 만 허용(`javascript:` 차단).
- 사진: 본인 폴더에만 업로드, JPG/PNG/WEBP·5MB 제한(저장소 설정), 파일 앞부분(매직 넘버) 검사.
- JSON-LD 는 `<` 이스케이프, 모든 텍스트는 React 이스케이프. 관리 화면은 검색 제외(noindex).

스키마 전체: [`supabase/schema.sql`](supabase/schema.sql) — 기존 ERP 테이블과 섞이지 않도록 `site_` 접두사.

## 실행
```bash
npm install
npm run dev        # http://localhost:3300
```
환경 변수(선택, 없으면 현재 프로젝트 기본값): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`(기본 `https://partner.unincore.com`).

## 테스트
실제 Supabase + 실제 브라우저로 30개 항목(로그인·편집·업로드·미리보기·권한 침범 시도·승인·SEO·모바일)을 검사합니다.
```bash
npm run build && npm start &
E2E_A_EMAIL=… E2E_B_EMAIL=… E2E_HQ_EMAIL=… E2E_PASSWORD=… npm run e2e -- ./shots
```

## 운영 전 해야 할 일
1. Vercel 새 프로젝트(루트 `apps/unicore-partner`) + 도메인 `partner.unincore.com` (후이즈 CNAME → `cname.vercel-dns.com`)
2. Supabase Auth 설정: Site URL / Redirect URL 에 실제 도메인 추가, 인증 메일 발송용 SMTP 연결(기본 메일은 발송량 제한)
3. 본사 관리자 지정: `supabase/schema.sql` 맨 아래 SQL

## 다음 단계 (아직 구현되지 않음)
디자인 엔진 3종 추가(Futuristic 3D·Beauty Editorial·Corporate Premium), 3D/WebGL 히어로, 상담 신청 폼·관리, 방문 통계,
디자인 버전 기록·복원, 영상·배너 섹션, 사업자별 브랜드 컬러, 사업자별 OG 이미지 생성, 커스텀 도메인, 다국어.
