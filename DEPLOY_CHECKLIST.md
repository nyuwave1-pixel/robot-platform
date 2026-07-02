# ✅ 배포 체크리스트 (5분)

## 지금 할 일

### 1️⃣ GitHub 저장소 준비 (2분)

```bash
# 저장소 초기화 (아직 안 했으면)
git remote add origin https://github.com/{username}/robot-platform
git branch -M main
git push -u origin main
```

**또는** GitHub Desktop 사용:
- GitHub.com 접속 → New Repository
- 이름: `robot-platform`
- Desktop에서 Clone 후 Push

### 2️⃣ Vercel 배포 (3분)

**가장 빠른 방법:**
```bash
npm i -g vercel
vercel
```

**또는 Dashboard:**
1. vercel.com 접속
2. GitHub 로그인
3. "New Project"
4. 저장소 선택 (robot-platform)
5. "Deploy" 클릭
6. 완료! 🎉

### 3️⃣ 환경 변수 설정 (선택)

Vercel Dashboard → Settings → Environment Variables

나중에 Firebase 연결할 때 추가:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- 등등 (지금은 필수 아님)

### 4️⃣ 라이브 확인

배포 완료 후:
- `{project}.vercel.app` 방문
- 홈페이지 확인
- 갤러리 확인
- 완벽? ✓

---

## 배포 후 (바로 다음)

### 🎯 Phase 2 시작: 커뮤니티
- Firebase 인증
- RP Points
- 포럼 (게시물 + 댓글)

### 💰 수익 활성화
- Ko-fi 버튼 연결 ✓ (이미 있음)
- Google AdSense 신청
- Amazon Associates 설정

---

**당신은 준비되었습니다!** 🚀
