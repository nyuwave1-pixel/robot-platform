# 🔧 Troubleshooting — 문제 해결 가이드

**자주 발생하는 문제와 해결책**

---

## 🚨 문제 1: npm install 실패

### 증상
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

### 원인
- Node 버전 불일치
- 의존성 충돌
- 캐시 손상

### 해결책
```bash
# 1단계: 캐시 정리
npm cache clean --force

# 2단계: 의존성 초기화
rm -rf node_modules package-lock.json

# 3단계: 다시 설치 (legacy peer deps 무시)
npm install --legacy-peer-deps

# 4단계: 여전히 실패?
npm install --no-save --no-optional
```

### 최후의 수단
```bash
# Node 버전 확인
node --version

# nvm으로 버전 변경 (설치 필요)
nvm install 18
nvm use 18
npm install
```

---

## 🚨 문제 2: 빌드 실패 (npm run build)

### 증상
```
Error: Failed to compile
SyntaxError: Unexpected token
```

### 진단
```bash
# 1단계: 에러 메시지 전체 확인
npm run build 2>&1 | tail -100

# 2단계: 파일 체크
npm run lint

# 3단계: 타입 체크 (TypeScript 사용 시)
npx tsc --noEmit
```

### 일반적인 원인 & 해결책

#### a) 문법 오류
```
❌ import X from "path"
✓ import { X } from "path"
```

#### b) 모듈 누락
```bash
# 설치 확인
npm ls [모듈명]

# 재설치
npm install [모듈명]
```

#### c) 버전 충돌
```bash
# 특정 버전으로 다운그레이드
npm install [모듈명]@[버전]
```

---

## 🚨 문제 3: 개발 서버 실행 안 됨 (npm run dev)

### 증상
```
Error: listen EADDRINUSE: address already in use :::3000
```

### 원인
- 포트 3000이 이미 사용 중

### 해결책

#### Windows
```bash
# 포트 사용 프로세스 찾기
netstat -ano | findstr :3000

# 프로세스 종료
taskkill /PID [PID] /F

# 다른 포트 사용
npm run dev -- --port 3001
```

#### Mac/Linux
```bash
# 포트 사용 프로세스 찾기
lsof -i :3000

# 프로세스 종료
kill -9 [PID]
```

---

## 🚨 문제 4: 배포 실패 (Vercel)

### 증상
```
Build failed
404 Not Found
```

### 원인 & 해결책

| 원인 | 해결책 |
|------|--------|
| 환경 변수 누락 | Vercel dashboard에서 설정 |
| 빌드 스크립트 오류 | `npm run build` 로컬에서 테스트 |
| .gitignore로 중요 파일 제외 | .vercelignore 확인 |
| Node 버전 불일치 | vercel.json에서 nodeVersion 설정 |
| 메모리 부족 | 의존성 최적화 (불필요한 패키지 제거) |

### 배포 전 체크리스트
```bash
# 1️⃣ 로컬 빌드 성공 확인
npm run build
npm start  # 빌드 결과물 실행

# 2️⃣ 환경 변수 확인
cat .env.local  # ⚠️ 비밀키는 표시 안 함

# 3️⃣ git 상태 확인
git status  # 의도치 않은 파일 없는지

# 4️⃣ 최신 코드 푸시
git push origin main

# 5️⃣ Vercel 배포 모니터링
vercel logs
```

---

## 🚨 문제 5: Firebase 연결 실패

### 증상
```
Error: Firebase App named "[DEFAULT]" already exists
Firebase: No Firebase App '[DEFAULT]' has been created
```

### 원인
- Firebase 초기화 중복
- 환경 변수 누락
- Firebase 설정 오류

### 해결책

#### 초기화 중복 제거
```javascript
// ❌ 나쁜 예
import { initializeApp } from "firebase/app";
initializeApp(config);  // 여러 파일에서 호출

// ✓ 좋은 예 - 한 파일에서만 초기화
// src/firebase.ts 또는 src/lib/firebase.ts
export const app = initializeApp(config);

// 다른 파일에서는 import만
import { app } from "@/lib/firebase";
```

#### 환경 변수 확인
```bash
# .env.local 파일 확인
cat .env.local

# 필수 항목:
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

---

## 🚨 문제 6: Git 충돌

### 증상
```
CONFLICT (content): Merge conflict in file.ts
```

### 해결책

#### 충돌 파일 확인
```bash
git status  # 충돌 파일 목록

# 또는 VS Code에서 보기
# - 초록색: 수용할 버전 (Current Change)
# - 파란색: 다른 버전 (Incoming Change)
```

#### 수동 해결
```bash
# 충돌 마크 제거 후
git add [충돌파일]
git commit -m "fix: merge conflict"
```

#### 전체 재설정 (위험)
```bash
# 원격 브랜치로 초기화
git reset --hard origin/main
```

---

## 🚨 문제 7: 의존성 업데이트 문제

### 증상
```
npm ERR! peer dep missing
npm WARN optional SKIPPING OPTIONAL DEPENDENCY
```

### 무시해도 되는가?
```
✓ WARN optional: 대부분 무시 가능
❌ ERR peer dep: 설치 필요

# 무시하고 싶으면
npm install --legacy-peer-deps
```

### 안전한 업데이트
```bash
# 현재 버전 확인
npm outdated

# 안전한 업데이트만 (patch/minor)
npm update

# 특정 패키지 업데이트
npm install [패키지명]@latest

# 버전 확인
npm list [패키지명]
```

---

## 🚨 문제 8: TypeScript 에러

### 증상
```
Type '...' is not assignable to type '...'
Property '...' is missing
```

### 해결책

#### 1️⃣ 타입 확인
```bash
# 타입 체크만 실행
npx tsc --noEmit

# 상세 에러 보기
npx tsc --noEmit --pretty false
```

#### 2️⃣ any 타입으로 임시 해결
```typescript
// ❌ 임시방편
const x: any = data;

// ✓ 올바른 방법
interface DataType {
  field: string;
}
const x: DataType = data;
```

#### 3️⃣ tsconfig.json 확인
```bash
cat tsconfig.json

# 필요하면 strict 모드 비활성화 (권장 안 함)
"strict": false
```

---

## 🚨 문제 9: 메모리/성능 문제

### 증상
```
JavaScript heap out of memory
Build taking too long
Server unresponsive
```

### 해결책

```bash
# 1️⃣ 의존성 확인
npm ls --depth=0
npm audit  # 취약점 & 크기 확인

# 2️⃣ 불필요한 패키지 제거
npm uninstall [패키지명]

# 3️⃣ 빌드 캐시 정리
rm -rf .next node_modules
npm install

# 4️⃣ 메모리 증가 (최후의 수단)
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

---

## 🚨 문제 10: 환경 변수 누락

### 증상
```
Error: Cannot read property 'xxx' of undefined
process.env.XXX is undefined
```

### 확인
```bash
# 로컬 환경 변수 확인
cat .env.local
echo $NEXT_PUBLIC_API_KEY  # Unix
echo %NEXT_PUBLIC_API_KEY% # Windows

# Vercel에서 설정했나?
vercel env list
```

### 추가하기
```bash
# .env.local에 추가 (로컬)
echo "NEXT_PUBLIC_API_KEY=value" >> .env.local

# Vercel에 추가
vercel env add NEXT_PUBLIC_API_KEY
```

---

## 📞 디버깅 팁

### 1️⃣ 로그 확인
```bash
# 빌드 로그 전체 출력
npm run build 2>&1 > build.log
cat build.log

# Vercel 로그
vercel logs [project-name]
```

### 2️⃣ 단계별 테스트
```bash
# 각 단계를 개별로 실행
npm run lint     # 코드 스타일
npm run type-check  # 타입 확인
npm run build    # 빌드
npm start        # 실행
```

### 3️⃣ 의존성 트리 확인
```bash
# 특정 패키지의 의존성 확인
npm ls [패키지명]

# 중복 찾기
npm ls | grep "deduped"
```

---

## 🎯 도움을 받을 때

**다음 정보를 함께 제공하세요:**

```
1. 에러 메시지 (전체)
   npm run build 2>&1 | tail -100

2. 현재 상태
   npm ls --depth=0
   npm --version
   node --version

3. 환경 정보
   cat .env.local | grep -v SECRET

4. git 상태
   git status
   git log --oneline -5
```

---

## ✅ 확인 체크리스트

모든 것이 작동하는지 확인:

```
□ npm install 성공
□ npm run dev 실행
□ localhost:3000 열림
□ 페이지 로딩됨
□ npm run build 성공
□ git push 성공
□ Vercel 배포 중
□ 프로덕션 URL 접속 가능
```

---

**문제 해결됐습니다!** 🎉

더 필요하면 언제든 물어보세요.
