# 🚀 배포 가이드 — Vercel

---

## 준비 체크리스트

```
✓ 로컬 빌드 성공 (npm run build)
✓ 홈페이지 완성
✓ 로봇 갤러리 완성
✓ 데이터 준비 (public/data/robots.json)
✓ Git 준비 완료

다음: Vercel 배포
```

---

## 1️⃣ Vercel 배포 (5분)

### Step 1: GitHub에 Push
```bash
cd "C:\Users\현이\로봇플랫폼개발진행2"

# GitHub 저장소 생성 (이미 있으면 스킵)
git remote add origin https://github.com/{username}/robot-platform
git branch -M main
git push -u origin main
```

### Step 2: Vercel 연결
```bash
# Vercel CLI 설치 (선택)
npm i -g vercel

# 또는 Vercel Dashboard에서:
1. vercel.com 접속
2. "New Project" 클릭
3. GitHub 저장소 선택
4. Deploy 클릭
```

### Step 3: 환경 변수 설정 (Vercel Dashboard)
```
Settings > Environment Variables

추가할 변수들 (Firebase 설정):
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID

저장 후 "Redeploy" 클릭
```

---

## 2️⃣ 도메인 설정 (선택, 10분)

### 무료 도메인
```
Vercel에서 무료로 제공: {project}.vercel.app

또는 Custom Domain 추가:
Settings > Domains > Add > {your-domain}.com
```

### 커스텀 도메인 (GoDaddy, Namecheap 등)
```
1. 도메인 구매 ($10-15/년)
2. Vercel Dashboard에 DNS 설정 추가
3. DNS 레코드 업데이트
4. 배포 완료
```

---

## 3️⃣ 라이브 확인

```
배포 후 즉시:
1. {project}.vercel.app 방문
2. 홈페이지 확인
3. /robots 갤러리 확인
4. 로봇 클릭해서 상세 페이지 확인
```

---

## 🔍 배포 후 체크리스트

```
□ 홈페이지 로드 성공
□ 로봇 갤러리 데이터 표시
□ 필터 작동
□ 상세 페이지 로드
□ 모바일 반응형 확인
□ Ko-fi 버튼 클릭 가능

문제 발생 시:
- Vercel Dashboard > Deployments > 최신 배포 클릭
- "Logs" 탭에서 에러 확인
```

---

## 📊 성능 최적화

배포 후 최적화:

```bash
# 1. Lighthouse 점수 확인
- Vercel Analytics 확인
- Google PageSpeed Insights

# 2. 이미지 최적화
- 이미지 WebP 포맷
- 동적 import 추가

# 3. 캐싱 설정
- Vercel cache-control 헤더
- CDN 캐싱 (기본 활성화)
```

---

## 🎯 다음 단계 (배포 후)

### Phase 1 마무리 (주 1-2 완료)
```
✓ 홈페이지
✓ 갤러리
□ 대시보드 (선택)

현재: 배포 진행 중
```

### Phase 2 시작 (주 3-4)
```
□ Firebase 인증
□ RP Points
□ 포럼
```

### Phase 3 (주 5-6)
```
□ Premium 구독
□ AI 예측
```

---

## 💚 수익 준비

배포 후 활성화:

```
1. Ko-fi 설정 (지금)
   - 홈페이지에 후원 버튼 (이미 있음)
   - Ko-fi.com 가입
   - 링크 업데이트

2. Google AdSense (주 2-3)
   - 트래픽 확보 후 신청
   - 배너 위치 최적화

3. Amazon Associates (주 3-4)
   - 로봇 제품 제휴 링크
   - 갤러리에 추가
```

---

## 📈 모니터링

배포 후 추적:

```
Vercel Analytics:
- 페이지 뷰
- 로딩 시간
- 에러율

Google Analytics:
- 사용자 수
- 반송률
- 세션 시간
```

---

**배포 준비 완료!**
**이제 세상에 공개할 준비가 됐습니다.** 🚀
