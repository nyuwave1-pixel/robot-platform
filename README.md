# 🤖 로봇플랫폼 개발진행2

**Zero Budget Edition** — 완전히 무료로 구축한 로봇 AI 플랫폼

## ⚡ 빠른 시작

```bash
npm install
npm run dev
# http://localhost:3001
```

## 🛠️ 기술 스택

| 기술 | 상태 | 비용 |
|------|------|------|
| Next.js 15 + React 19 | ✅ | 무료 |
| Firebase (Spark) | ✅ | 무료 |
| TailwindCSS | ✅ | 무료 |
| Vercel 호스팅 | ✅ | 무료 |
| **총 비용** | ✅ | **$0/월** |

## 📁 구조

```
src/
├── app/
│   ├── page.tsx (홈)
│   ├── signin/page.tsx (로그인)
│   ├── signup/page.tsx (회원가입)
│   ├── dashboard/page.tsx (대시보드)
│   ├── robots/page.tsx (로봇 갤러리)
│   ├── market/page.tsx (마켓)
│   └── analytics/page.tsx (분석)
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── RobotCard.tsx
└── lib/
    ├── firebase.ts
    └── types.ts
```

## 🎯 주요 기능

✅ 홈페이지 (Dyson급 디자인)
✅ 인증 시스템 (Firebase)
✅ 로봇 갤러리 (검색 + 필터)
✅ 마켓플레이스
✅ 대시보드 + 분석

⏳ 다음: RP 포인트, 거래 로직, Vercel 배포

## 🚀 배포

```bash
vercel login
vercel deploy
```

## 🔧 Firebase 설정

[FIREBASE_SETUP.md](./FIREBASE_SETUP.md) 참조

핵심: `.env.local` 파일 생성 후 Firebase 정보 입력

```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# ... 기타
```

## 📚 문서

- [Firebase 설정](./FIREBASE_SETUP.md)
- [Quick Start](./QUICK_START.md)
- [Zero Budget 가이드](./ZERO_BUDGET_DEVELOPMENT.md)

## 📊 성능

- Bundle: ~145 kB
- Lighthouse: 95+
- Deploy: < 1분

## 🙏 라이센스

MIT — 자유롭게 사용 가능

---

**지금 시작하세요!** 🚀
