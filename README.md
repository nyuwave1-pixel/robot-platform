# 🤖 로봇플랫폼 개발 (Zero Budget)

완전히 무료로 개발하는 로봇 플랫폼

## 📋 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 시작
npm run dev

# 3. 브라우저에서 열기
# http://localhost:3000
```

## 🛠️ 스택 (모두 무료)

- **Frontend**: Next.js 14 + React 18 + TypeScript + TailwindCSS
- **Database**: Firebase (Spark plan, 무료)
- **Hosting**: Vercel (무료)
- **Version Control**: GitHub (무료)

## 📁 프로젝트 구조

```
robot-platform-dev/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   └── lib/              # Utilities
├── public/               # Static assets
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.js
```

## 🚀 배포

### Vercel (추천, 무료)
```bash
npm install -g vercel
vercel
# 또는 GitHub에 push하면 자동 배포
```

### Firebase (선택사항)
```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
```

## 📚 문서

- [ONBOARDING.md](./ONBOARDING.md) - 온보딩 가이드
- [QUICK_START.md](./QUICK_START.md) - 빠른 시작
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 문제 해결
- [ZERO_BUDGET_DEVELOPMENT.md](./ZERO_BUDGET_DEVELOPMENT.md) - 무료 개발 전략

## 💰 비용

**$0/월** ✅

- Vercel: 무료 (무제한 배포)
- Firebase: 무료 (Spark plan)
- GitHub: 무료 (public repo)

## 🎯 개발 가이드라인

- ✅ 무료 API만 사용
- ✅ 환경 변수로 설정 관리
- ✅ 배치 최적화 (API 호출 줄이기)
- ✅ 캐싱 활용

## 🔗 유용한 링크

- [Next.js 문서](https://nextjs.org/docs)
- [Firebase 무료 한도](https://firebase.google.com/pricing)
- [Vercel 배포](https://vercel.com/docs)

---

**당신은 무료로 놀라운 것을 만들 수 있습니다.** 💪
