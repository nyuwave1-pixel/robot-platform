# 🚀 로봇플랫폼개발진행2 — 온보딩 (다른 Claude Code 세션용)

**새로운 Claude Code 탭/세션에서 즉시 시작하기**

---

## 0️⃣ 이 문서를 읽고 있다면

✅ 당신은 로봇플랫폼개발진행2 프로젝트에 참여하고 있습니다.

✅ 이 프로젝트는 **돈이 없는 상태**에서 진행됩니다.

✅ 모든 것이 **무료**입니다.

✅ 당신을 **완전히 신뢰**합니다.

---

## 1️⃣ 지금 해야 할 것 (순서대로)

### Step 1: 프로젝트 진입
```bash
# 터미널 열기
cd "C:\Users\현이\로봇플랫폼개발진행2"

# 현재 상태 확인
git status
```

### Step 2: 구조 파악
```bash
# 프로젝트 폴더 구조
ls -la

# package.json 확인
cat package.json | head -30

# 최근 커밋 확인
git log --oneline -10
```

### Step 3: 현재 문제 파악
```bash
# 가능한 에러 파일 찾기
find . -name "*.error" -o -name "*.todo" -o -name "ERROR*"

# npm 의존성 상태
npm ls

# 빌드 상태
npm run build 2>&1 | tail -20
```

### Step 4: 문서 읽기
```
다음 문서들을 읽으세요:
1. QUICK_START.md (이 폴더)
2. ZERO_BUDGET_DEVELOPMENT.md (예산 가이드)
3. 프로젝트의 README.md (있으면)
```

---

## 2️⃣ 개발 시작하기

### 의존성 설치
```bash
npm install --legacy-peer-deps
# 또는
npm ci

# 성공하면:
npm list --depth=0
```

### 개발 서버 시작
```bash
npm run dev
# 브라우저에서 localhost:3000 확인
```

### 코드 수정하기
```bash
# 편집기에서 파일 수정
# 저장하면 자동으로 핫 리로드됨
```

### 커밋하기
```bash
git add .
git commit -m "feat: 설명"
git push origin main
```

---

## 3️⃣ 비용 규칙 (중요!)

### ✓ 무료로 사용 가능
```
• Vercel 배포
• Firebase Spark plan
• GitHub Actions (2,000분/월)
• Google Cloud 무료 tier
• 오픈소스 npm 패키지
• 로컬 개발
```

### ✗ 절대 금지
```
• Stripe/Paypal (결제 기능) - 먼저 물어보기
• Anthropic API (자동화) - 필요 없음
• OpenAI API - 필요 없음
• 유료 npm 패키지 - 무료 대체 찾기
• 과도한 배포 자동화 - 수동 배포
```

---

## 4️⃣ 문제 해결

### 빌드 실패
```bash
# 1단계: 에러 메시지 확인
npm run build

# 2단계: 의존성 초기화
rm -rf node_modules package-lock.json
npm install

# 3단계: 여전히 실패? 
# → 에러 메시지를 복사해서 Claude에 물어보세요
```

### 배포 실패
```bash
# 1단계: 로컬에서 정상인지 확인
npm run dev

# 2단계: 빌드 확인
npm run build

# 3단계: 여전히 실패?
# → 에러 로그를 Claude에 보내세요
```

### 의존성 충돌
```bash
# 무료 대체 찾기
npm search [패키지명]

# 또는 ZERO_BUDGET_DEVELOPMENT.md 참고
```

---

## 5️⃣ 개발 흐름

```
1️⃣ 기능 계획
   • 다음에 뭘 할지 명확히 하기

2️⃣ 로컬 개발
   • npm run dev
   • 코드 수정
   • 브라우저에서 테스트

3️⃣ 커밋
   • git add .
   • git commit -m "..."
   • git push

4️⃣ 배포
   • Vercel 자동 배포 (또는 수동)
   • 프로덕션 확인

5️⃣ 모니터링
   • 에러 확인
   • 성능 확인
   • 사용자 피드백
```

---

## 6️⃣ 유용한 명령어

```bash
# 개발 서버 시작
npm run dev

# 빌드 (배포 전)
npm run build

# 테스트 (있으면)
npm test

# 린트/포맷
npm run lint
npm run format

# 의존성 업데이트 확인
npm outdated

# 의존성 보안 확인
npm audit

# 전체 정리
npm ci
npm run build
```

---

## 7️⃣ 중요한 파일들

```
프로젝트 루트:
├─ package.json       (의존성, 스크립트)
├─ .env.local         (로컬 비밀키 - 커밋 X)
├─ .gitignore         (버전 관리 제외)
├─ README.md          (프로젝트 설명)
└─ src/               (코드)

절대 커밋하면 안 됨:
❌ node_modules/
❌ .env.local
❌ .env (민감한 정보)
❌ dist/ (빌드 결과물)
❌ .next/ (Next.js 캐시)
```

---

## 8️⃣ 도움 받기

문제가 있으면:

```
1️⃣ 에러 메시지 복사
   npm run build 2>&1 | tail -50

2️⃣ 현재 상태 확인
   git status
   git log --oneline -5
   npm ls

3️⃣ Claude에 공유
   "다음 에러가 발생합니다:
    [에러 메시지]
   
   현재 상태:
   [위의 명령어 결과]"
```

---

## 9️⃣ 안내사항

```
✅ 당신은:
   • 완전히 신뢰받고 있습니다
   • 돈 걱정 없이 개발할 수 있습니다
   • 필요하면 언제든 물어볼 수 있습니다
   • 실수해도 괜찮습니다

⚠️ 주의할 것:
   • 비용이 드는 서비스는 절대 금지
   • API 키는 절대 공개하지 말기
   • .env 파일은 git에 올리지 말기
   • 확실하지 않으면 물어보기

🎯 목표:
   • 무료로 최고의 플랫폼 만들기
   • 모든 개발 단계 문서화
   • 다른 개발자도 쉽게 참여할 수 있게
```

---

## 🔟 다음 단계

```
완료했으면:
1. npm install
2. npm run dev
3. localhost:3000 확인
4. 첫 번째 기능 구현

막혔으면:
• 에러 메시지 복사
• Claude에 물어보기
• QUICK_START.md 다시 읽기
```

---

**당신은 준비됐습니다. 시작하세요!** 🚀

모든 게 잘될 거예요. 난 너를 믿어.
