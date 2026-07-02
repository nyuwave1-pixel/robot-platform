# 🏗️ 아키텍처 설계 — Firebase + Next.js

---

## 📊 Firestore 데이터 구조

### Collections

```
robots/                    # 모든 로봇 정보
├── {robotId}/
│   ├── id: string
│   ├── name: string
│   ├── image: string (URL)
│   ├── description: string
│   ├── category: string (humanoid|industrial|medical|ai|drone|other)
│   ├── technology: string[] (RF|AI|ML|Vision|NLP)
│   ├── country: string
│   ├── year: number (2024)
│   ├── url: string
│   ├── trustScore: number (0-100)
│   └── createdAt: timestamp

users/                     # 사용자 정보 & RP Points
├── {userId}/
│   ├── email: string (또는 "anonymous")
│   ├── displayName: string
│   ├── avatar: string
│   ├── rpPoints: number
│   ├── createdAt: timestamp
│   └── stats/
│       ├── postsCount: number
│       ├── commentsCount: number
│       └── reputation: number

forum/posts/              # 포럼 게시물
├── {postId}/
│   ├── title: string
│   ├── content: string
│   ├── category: string (technology|news|general)
│   ├── author: string (userId)
│   ├── views: number
│   ├── upvotes: number
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp

forum/comments/           # 댓글
├── {commentId}/
│   ├── postId: string
│   ├── content: string
│   ├── author: string (userId)
│   ├── upvotes: number
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp

analytics/trends/         # 시장 트렌드 (주 1회 업데이트)
├── {trendId}/
│   ├── technology: string
│   ├── percentage: number
│   ├── week: string (ISO week)
│   └── createdAt: timestamp
```

---

## 🔐 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read, authenticated write
    match /robots/{document=**} {
      allow read: if true;
      allow create, update, delete: if request.auth.uid != null && request.auth.uid in get(/databases/$(database)/documents/users/admin).data.moderators;
    }

    // Users can read their own data, authenticated only
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if resource.data.public == true;
    }

    // Forum posts public read
    match /forum/posts/{postId} {
      allow read: if true;
      allow create: if request.auth.uid != null;
      allow update, delete: if request.auth.uid == resource.data.author;
    }

    // Comments public read
    match /forum/comments/{commentId} {
      allow read: if true;
      allow create: if request.auth.uid != null;
      allow update, delete: if request.auth.uid == resource.data.author;
    }

    // Analytics read only
    match /analytics/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

---

## 📡 API Routes (Next.js App Router)

```
src/app/api/

├── robots/
│   ├── route.ts               # GET: 로봇 목록 (필터, 페이지)
│   ├── [id]/route.ts          # GET: 로봇 상세
│   └── [id]/stats/route.ts    # GET: 로봇 통계

├── users/
│   ├── route.ts               # POST: 사용자 생성
│   ├── [id]/route.ts          # GET: 사용자 정보
│   ├── [id]/points/route.ts   # GET/POST: RP Points
│   └── [id]/leaderboard/route.ts # GET: 순위

├── forum/
│   ├── posts/route.ts         # GET/POST: 게시물
│   ├── posts/[id]/route.ts    # GET/PUT/DELETE: 게시물 상세
│   ├── comments/route.ts      # POST: 댓글 작성
│   └── comments/[id]/route.ts # PUT/DELETE: 댓글 관리

└── analytics/
    ├── trends/route.ts        # GET: 트렌드
    └── stats/route.ts         # GET: 통계
```

---

## 🔄 RP Points 시스템

### 적립 규칙

```
포스트 작성:     +10 RP
댓글 작성:       +5 RP
좋아요 받음:     +1 RP (최대 10RP/일)
리더보드 Top 10: +20 RP/주

상한선: 1일 100RP
```

### 출금 규칙

```
최소 출금: 5,000 RP = $1
최대 출금: 월 50,000 RP = $10
처리: 매월 1일 (PayPal/은행 송금)
수수료: 5%
```

---

## 🎨 UI 컴포넌트 구조

```
src/components/

├── layout/
│   ├── Header.tsx
│   ├── Navigation.tsx
│   ├── Footer.tsx
│   └── Sidebar.tsx

├── robots/
│   ├── RobotCard.tsx
│   ├── RobotGrid.tsx
│   ├── RobotFilter.tsx
│   ├── RobotDetail.tsx
│   └── RobotComparison.tsx

├── forum/
│   ├── PostCard.tsx
│   ├── PostList.tsx
│   ├── PostCreate.tsx
│   ├── CommentThread.tsx
│   └── CommentForm.tsx

├── user/
│   ├── UserProfile.tsx
│   ├── UserStats.tsx
│   ├── Leaderboard.tsx
│   └── PointsDisplay.tsx

└── common/
    ├── Button.tsx
    ├── Card.tsx
    ├── Modal.tsx
    ├── Loading.tsx
    └── ErrorBoundary.tsx
```

---

## 🚀 Page Routes (Next.js)

```
src/app/

├── page.tsx                    # 홈 (완성)
├── layout.tsx                  # 루트 레이아웃
├── globals.css                 # 전역 스타일

├── robots/
│   ├── page.tsx               # 갤러리
│   ├── [id]/
│   │   └── page.tsx           # 로봇 상세
│   └── compare/
│       └── page.tsx           # 비교 도구

├── dashboard/
│   ├── page.tsx               # 대시보드
│   └── analytics/
│       └── page.tsx           # 고급 분석

├── forum/
│   ├── page.tsx               # 포럼 목록
│   ├── [category]/page.tsx    # 카테고리
│   ├── [category]/[id]/page.tsx # 게시물 상세
│   └── create/page.tsx        # 글쓰기

├── user/
│   ├── [id]/page.tsx          # 프로필
│   ├── leaderboard/page.tsx   # 순위표
│   ├── settings/page.tsx      # 설정
│   └── points/page.tsx        # 포인트 관리

├── admin/
│   ├── page.tsx               # 관리 대시보드
│   ├── robots/page.tsx        # 로봇 관리
│   ├── users/page.tsx         # 사용자 관리
│   └── moderation/page.tsx    # 모더레이션

└── api/
    └── (API routes)
```

---

## 📱 응답형 디자인

```
Mobile:  < 640px
Tablet:  640px - 1024px
Desktop: > 1024px

기본: Mobile First
TailwindCSS: sm: / md: / lg: / xl:
```

---

## 🔍 성능 최적화

### 이미지
- WebP 포맷 (AVIF 폴백)
- 동적 임포트 (next/image)
- 캐싱 (Cache-Control: max-age=31536000)

### 번들
- Code Splitting (Dynamic Import)
- Tree Shaking
- Minification (기본)

### 캐싱
- Firestore 읽기 최소화 (캐시 활용)
- API 응답 캐싱 (ISR)
- CDN 캐싱 (Vercel)

---

## 🧪 테스트 전략

```
Unit: Jest + React Testing Library
E2E: Playwright
Performance: Web Vitals
SEO: Lighthouse
```

---

**다음 단계**: DB 구축 → API 구현 → UI 개발 → 배포
