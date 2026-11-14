# 배포 및 DNS 설정 가이드

> 참고(2026-11-04): 관리자(CMS)·/api 기능은 제거되었습니다. 이 문서의 관리자 관련 내용은 이전 버전 기준입니다.

## 0. 사전 확인 (기존 환경)

이번 작업 환경에서는 `unincore.com`과 `amazon.com`에 네트워크로 접근할 수 없었습니다. 그래서 다음 항목은 **직접 확인**해야 합니다.

| 항목 | 확인 방법 | 비고 |
|---|---|---|
| unincore.com DNS 관리 위치 | 도메인 등록업체(가비아, Cafe24, Route53, Cloudflare 등) | 서브도메인 CNAME 1개만 추가하면 됩니다 |
| 기존 메인 사이트 호스팅 | 기존 사이트는 수정하지 않음 | `promotion.` 서브도메인만 사용합니다 |
| CAA 레코드 | `dig CAA unincore.com` | CAA가 있으면 `letsencrypt.org`를 허용해야 합니다 |

## 1-A. Netlify 배포 (현재 사용 중인 호스팅)

Netlify 팀 `nyuwave1`에 프로젝트 **`unincore-promotion`**을 만들어 두었습니다(https://app.netlify.com/projects/unincore-promotion).

**Git 연결 (권장, 푸시하면 자동 배포)**
1. Netlify → unincore-promotion → Project configuration → Build & deploy → **Link repository** → GitHub `nyuwave1-pixel/robot-platform`을 선택합니다.
2. **Base directory: `unincore-promotion`**, Build command: `npm run build`, Publish directory: `.next`를 지정합니다(`netlify.toml`에서 자동 적용). Production branch는 PR 병합 전이면 `claude/awesome-gauss-5kqwk2`, 병합 후면 `main`입니다.
3. 저장소는 **Netlify Blobs**를 자동으로 사용합니다. Redis는 필요 없습니다.
4. 등록된 환경변수: `STORAGE_DRIVER=blobs`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_SESSION_SECRET`/`ADMIN_PASSWORD`/`EDITOR_PASSWORD`(secret, production 컨텍스트).
5. 도메인: Domain management → Add domain `promotion.unincore.com` → DNS에 `CNAME promotion → unincore-promotion.netlify.app`을 추가합니다. SSL은 자동으로 발급됩니다.

> Netlify Blobs의 클릭 통계는 이벤트 1건당 1개 키(append-only)로 저장합니다. 하루 수만 건 이상이면 대시보드 조회가 느려질 수 있으므로, 대량 트래픽 분석은 GA4를 기준으로 보십시오.

## 1-B. Vercel 프로젝트 생성 (대안)

1. Vercel → **Add New → Project** → 이 GitHub 저장소를 선택합니다.
2. **Root Directory**를 `unincore-promotion`으로 지정합니다(중요). 기존 robot-platform 프로젝트와 별개의 프로젝트가 됩니다.
3. Framework는 Next.js(자동 감지), Build는 `npm run build`, Region은 `iad1`(미국 동부)입니다.

## 2. 저장소 (CMS 및 클릭 통계)

Vercel → Storage → **Marketplace → Upstash for Redis**를 만들고 프로젝트에 연결합니다.
연결하면 `KV_REST_API_URL`과 `KV_REST_API_TOKEN`이 자동으로 들어갑니다.

> 저장소가 없어도 사이트는 기본 콘텐츠로 정상 동작합니다. 다만 CMS 저장과 대시보드 통계는 동작하지 않습니다.

## 3. 환경변수

| 변수 | 필수 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ✅ | `https://promotion.unincore.com` |
| `ADMIN_SESSION_SECRET` | ✅ | 32자 이상의 임의 문자열 (`openssl rand -base64 48`) |
| `ADMIN_PASSWORD` | ✅ | 관리자 비밀번호(10자 이상). 아이디는 `admin` |
| `EDITOR_PASSWORD` |  | 에디터 비밀번호(10자 이상). 아이디는 `editor`. 추적 ID와 ASIN은 수정할 수 없습니다 |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | ✅ | 2단계에서 자동 생성 |
| `NEXT_PUBLIC_GA4_ID` / `NEXT_PUBLIC_GTM_ID` / `NEXT_PUBLIC_META_PIXEL_ID` |  | 기본값. CMS → Settings 값이 우선합니다 |
| `META_CAPI_ACCESS_TOKEN` |  | Meta Conversions API (Events Manager에서 발급) |
| `META_CAPI_TEST_EVENT_CODE` |  | CAPI 테스트할 때만 사용 |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` |  | Search Console HTML 태그 값 |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` |  | Bing Webmaster `msvalidate.01` 값 |
| `NEXT_PUBLIC_META_DOMAIN_VERIFICATION` |  | Meta Business 도메인 인증 값 |

## 4. 도메인 연결 (DNS)

1. Vercel 프로젝트 → Settings → **Domains** → `promotion.unincore.com`을 추가합니다.
2. DNS 관리 화면에서 아래 레코드를 추가합니다.

| Type | Host / Name | Value | TTL |
|---|---|---|---|
| CNAME | `promotion` | `cname.vercel-dns.com.` (Vercel 화면에 표시된 값 사용) | 300~3600 |

3. Vercel에 **Valid Configuration**이 표시되면 SSL 인증서(Let's Encrypt)가 자동 발급됩니다.
4. Cloudflare를 쓴다면 처음에는 프록시(주황 구름)를 **끄고(DNS only)** 연결합니다.

기존 `unincore.com`이나 `www` 레코드는 **건드리지 않습니다.**

## 5. 출시 체크리스트

- [ ] `/admin` 로그인 → 대시보드의 **Launch checklist** 항목을 모두 해소합니다
- [ ] 3개 ASIN을 실제 Amazon 페이지에서 확인한 뒤 CMS에서 "ASIN verified"를 체크합니다 (**미확인 상태로 광고를 집행하지 마십시오**)
- [ ] Amazon Attribution 링크(채널별)를 등록합니다
- [ ] GA4 / GTM / Meta Pixel ID를 입력하고 GA4 DebugView와 Meta Events Manager에서 이벤트를 확인합니다
- [ ] Search Console과 Bing에 도메인을 등록하고 `https://promotion.unincore.com/sitemap.xml`을 제출합니다
- [ ] Meta Business Manager에서 도메인을 인증합니다(Aggregated Event Measurement)
- [ ] 실제 제품 사진과 OG 이미지로 교체합니다(CMS → Hero / SEO)
- [ ] 검증 자료(임상, 판매량, pH)를 확보한 항목만 Verified로 전환합니다
- [ ] BFCM 시작(11/19 PST) 전에 Amazon Deal/쿠폰이 실제로 등록되었는지 확인합니다

## 6. 보안 권장 (Vercel)

- Vercel Firewall → `/api/admin/login`에 Rate Limit 규칙을 추가합니다(예: IP당 분당 10회)
- 필요하면 `/admin/*`에 IP 허용 목록을 설정합니다
- 비밀번호를 바꾸려면 환경변수를 변경하고 재배포합니다. `ADMIN_SESSION_SECRET`을 바꾸면 모든 세션이 강제로 로그아웃됩니다
