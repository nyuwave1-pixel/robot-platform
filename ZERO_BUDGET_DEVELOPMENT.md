# 💰 Zero Budget Development Guide

**돈 없이 완벽하게 개발하기**

---

## ✅ 무료로 가능한 것

### 호스팅 & 인프라
```
✓ Vercel (Next.js/React)
  - 무료 tier: 월 100GB bandwidth, unlimited deployments
  - 설정: vercel.json만 있으면 자동 배포

✓ Firebase (데이터베이스 + 호스팅)
  - Spark plan: 5GB 저장, 100 동시 연결
  - 제한 없는 무료 읽기/쓰기 (실제로는 일일 한도 있음)

✓ GitHub (코드 + CI/CD)
  - 2,000분/월 무료 Actions
  - 무제한 public/private repos

✓ Google Cloud (선택)
  - $300 무료 credit (3개월)
  - 이후 free tier로 전환 가능
```

### 개발 도구
```
✓ Visual Studio Code
  - 완전 무료
  - 확장 무료

✓ Node.js
  - 완전 무료
  - npm 포함

✓ Git + GitHub Desktop
  - 완전 무료

✓ Docker (로컬)
  - 완전 무료 (Docker Desktop)
  - 저장소 pull: 무료 (public)
```

### 데이터 & API
```
✓ Google Maps (무료 tier)
  - 월 $200 credit
  - Maps, Routes, Places

✓ OpenWeather (무료)
  - 1,000 calls/day
  - 현재 날씨, 예보

✓ REST API (공개)
  - JSONPlaceholder (테스트)
  - OpenAPI 3.0 specs (무료 API들)

✓ 데이터셋
  - Kaggle (무료)
  - Google Datasets
  - AWS Public Datasets
```

---

## ❌ 절대 금지 (비용 발생)

```
❌ Stripe (결제 처리)
   └─ 대신: PayPal Lite / Square (처음엔 무료)

❌ Anthropic API (자동화)
   └─ 대신: 무료 LLM (Llama, Mistral 로컬)

❌ OpenAI API (GPT)
   └─ 대신: Ollama (로컬 LLM)

❌ 유료 npm 패키지
   └─ 대신: 오픈소스만 사용

❌ 자동 배포 (과도한)
   └─ 대신: 수동 배포 (하루 1-2회)
```

---

## 🚀 추천 스택 (완전 무료)

### Frontend
```
✓ Next.js (Vercel 배포)
✓ React + TypeScript
✓ TailwindCSS (무료)
✓ Framer Motion (무료)
```

### Backend
```
✓ Node.js + Express
✓ Firebase Realtime DB (또는 Firestore)
✓ Supabase (PostgreSQL, 무료)
✓ PlanetScale (MySQL, 무료)
```

### 데이터
```
✓ Firebase
✓ Supabase
✓ MongoDB Atlas (무료)
✓ SQLite (로컬)
```

### 배포
```
✓ Vercel (Frontend)
✓ Railway (Backend, 월 $5 free credit)
✓ Render (무료 tier)
✓ Heroku (무료 tier 종료됨, 대신 Render)
```

---

## ⚡ 비용 최적화 팁

### 1️⃣ API 호출 줄이기
```javascript
// ❌ 나쁜 예: 매 요청마다 호출
const data = await fetchExpensiveAPI();

// ✓ 좋은 예: 캐싱
const cachedData = cache ? cache : await fetchAPI();
localStorage.setItem('cache', data);
```

### 2️⃣ 이미지 최적화
```
✓ 압축: TinyPNG (무료)
✓ 포맷: WebP로 변환
✓ CDN: Vercel 자체 CDN (무료 포함)
```

### 3️⃣ 데이터베이스 최적화
```
✓ 인덱싱: 쿼리 최적화
✓ 배치: 개별 요청 대신 배치
✓ 캐싱: Redis (로컬) 또는 메모리
```

### 4️⃣ 자동화 줄이기
```
❌ 매 5분마다 크론 작업
✓ 매 시간마다 1번
✓ 일일 배치 처리
```

---

## 📊 월간 비용 추정

```
현재 상태:
├─ 호스팅: $0 (Vercel 무료)
├─ 데이터: $0 (Firebase Spark)
├─ 도메인: $0 (GitHub Pages)
└─ 총합: $0 ✅

만약 이 사용했다면:
├─ Stripe (결제): ~$30
├─ Anthropic API: ~$50
├─ 추가 스토리지: ~$20
└─ 총합: ~$100/월

→ 무료로 유지: $0
```

---

## 🔧 구성 체크리스트

```
기본 설정 (모두 무료):
□ Node.js + npm
□ Git + GitHub
□ VS Code
□ .env.local (로컬만, 커밋 X)
□ .gitignore (node_modules, .env)

배포 설정:
□ Vercel (free tier)
□ Firebase (Spark plan)
□ GitHub Actions (2,000분/월)
□ domain 설정 (선택)

개발 시작:
□ npm install
□ npm run dev
□ localhost:3000 확인
```

---

## 🎯 제약 내에서 최대한 활용

```
1️⃣ 읽기 최적화
   - 데이터 캐싱
   - 적절한 쿼리 구조
   - 배치 읽기

2️⃣ 쓰기 최적화
   - 배치 쓰기
   - 필요한 필드만
   - 검증 강화

3️⃣ API 최적화
   - 로컬 mock 데이터
   - GraphQL (효율)
   - 페이지네이션

4️⃣ 테스트 전략
   - 로컬 테스트 우선
   - 자동화 최소화
   - 수동 QA 활용
```

---

## ⚠️ 주의사항

```
❌ 절대 하지 마세요:
   • API 키를 코드에 하드코딩
   • node_modules를 git에 커밋
   • .env 파일을 공개 저장소에 업로드
   • 자동 배포를 과도하게 설정
   • 무제한 API 호출

✓ 항상 하세요:
   • .env.local에 민감한 정보 저장
   • .gitignore에 추가
   • 환경 변수로 관리
   • 수동으로 검토 후 배포
   • API 호출 제한 설정
```

---

## 📞 도움 받기

문제 발생 시:

1. **비용 관련** → 이 가이드 참고
2. **배포 실패** → 무료 tier 제한 확인
3. **성능 저하** → 캐싱 추가
4. **데이터 부족** → 쿼리 최적화

---

**당신은 무료로 놀라운 것을 만들 수 있습니다.** 💪

제약은 창의성의 배경입니다.
