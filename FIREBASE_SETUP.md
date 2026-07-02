# 🔥 Firebase 설정 가이드

로봇플랫폼2를 완전히 작동시키기 위해 Firebase를 설정하세요.

## 1️⃣ Firebase 프로젝트 생성

### Step 1: Firebase 콘솔 접속
1. [Firebase 콘솔](https://console.firebase.google.com) 방문
2. **새 프로젝트 생성** 클릭
3. 프로젝트 이름: `robot-platform-dev2`
4. Google Analytics 활성화 (선택사항)
5. **프로젝트 생성** 클릭

### Step 2: 웹 앱 등록
1. Firebase 콘솔 → 프로젝트 설정
2. **웹** 아이콘 클릭
3. 앱 닉네임: `robot-platform-dev2`
4. **앱 등록** 클릭
5. SDK 정보가 표시됨 → **복사**하기

## 2️⃣ .env.local 파일 생성

프로젝트 루트에 `.env.local` 파일을 만드세요:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef...
```

### 예시 (복사 후 수정):
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=robot-platform-dev2.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=robot-platform-dev2
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=robot-platform-dev2.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

## 3️⃣ Authentication 활성화

### Email/Password 인증 활성화
1. Firebase 콘솔 → **Authentication**
2. **Sign-in method** 탭
3. **Email/Password** 활성화
4. **저장** 클릭

## 4️⃣ Firestore Database 생성

### Firestore 생성 (무료 Spark plan)
1. Firebase 콘솔 → **Firestore Database**
2. **데이터베이스 만들기** 클릭
3. **테스트 모드에서 시작** 선택
4. 위치: `asia-northeast1` (서울)
5. **만들기** 클릭

### Security Rules 설정 (중요!)
1. **Rules** 탭 클릭
2. 다음 규칙을 붙여넣기:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection: 자신의 문서만 접근
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Public collections: 모두 읽기, 인증된 사용자만 쓰기
    match /robots/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /market/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Default: 거부
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. **Publish** 클릭

## 5️⃣ 테스트

### 개발 서버 시작
```bash
npm run dev
# http://localhost:3001 접속
```

### 테스트 순서
1. **홈페이지** 접속 → 정상 로드 확인
2. **회원가입** → 새 계정 생성
3. **로그인** → 방금 생성한 계정으로 로그인
4. **대시보드** → 로그인 후 접근 가능 확인

## 6️⃣ Firebase Console에서 확인

### Users 확인
1. Firebase 콘솔 → **Authentication**
2. **Users** 탭에서 새로 만든 계정 확인

### Firestore 데이터 확인
1. Firebase 콘솔 → **Firestore Database**
2. **Data** 탭
3. `users` collection → 새 사용자 문서 확인

## 🚀 배포 준비

### Vercel 배포
```bash
npm run build
vercel login
vercel deploy
```

### Vercel 환경 변수 설정
1. Vercel 대시보드 → **Settings** → **Environment Variables**
2. `.env.local`의 모든 변수 추가
3. **Deploy** 클릭

## ⚠️ 주의사항

- ❌ `.env.local`을 git에 커밋하지 마세요 (`.gitignore` 확인)
- ❌ API 키를 코드에 하드코딩하지 마세요
- ✅ `NEXT_PUBLIC_*` 변수만 클라이언트에서 사용 가능
- ✅ 민감한 정보는 서버 환경 변수로 관리

## 📞 문제 해결

### "Cannot find module 'firebase/auth'"
```bash
npm install firebase
```

### "Firebase app not initialized"
- `.env.local` 파일 확인
- 모든 변수가 올바르게 입력되었는지 확인
- 개발 서버 재시작 (`npm run dev`)

### "Error: Permission denied"
- Firestore Rules 다시 확인
- Rules 문법 오류 확인

## ✅ 완료!

이제 로봇플랫폼2가 완전히 작동합니다! 🎉

다음 단계:
- RP 포인트 시스템 구현
- 마켓플레이스 거래 로직
- 사용자 프로필 편집
- 로봇 상세 페이지
