# ⚡ 빠른 시작 가이드

## 🔧 설치 (처음 1회만)

```bash
cd C:\Users\현이\로봇플랫폼개발진행2
npm install
```

## 🚀 개발 시작

```bash
npm run dev
```

브라우저에서 **http://localhost:3000** 열기

## 📝 개발 명령어

```bash
# 개발 서버
npm run dev

# 타입 확인
npm run type-check

# 빌드 (배포 전)
npm run build

# 배포 (Vercel)
vercel --prod
```

## 🔐 환경 설정

1. Firebase 프로젝트 생성: https://console.firebase.google.com
2. `.env.local` 파일에 Firebase credentials 입력
3. 준비 완료!

## 📂 파일 구조

```
src/
├── app/              # Next.js pages
├── components/       # React components
├── lib/              # Firebase, types
└── contexts/         # React contexts (Auth)
```

## 🎯 다음 단계

1. npm install 완료 대기
2. npm run dev 실행
3. http://localhost:3000 확인
4. Firebase 설정
5. GitHub에 push
6. Vercel 배포

---

**모든 도구가 무료입니다! 💰**
