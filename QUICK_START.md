# 🤖 로봇플랫폼개발진행2 — 빠른 시작 가이드

**다른 Claude Code 세션에서 즉시 시작 가능**

---

## ⚡ 30초 온보딩

```bash
# 1️⃣ 프로젝트 진입
cd "C:\Users\현이\로봇플랫폼개발진행2"

# 2️⃣ 현재 상태 확인
git status
npm ls --depth=0

# 3️⃣ 개발 시작
npm run dev
```

---

## 📋 현재 상태

| 항목 | 상태 | 우선순위 |
|------|------|---------|
| 구조 | ❓ 정리 필요 | 🔴 높음 |
| 의존성 | ❓ 확인 필요 | 🔴 높음 |
| 비용 | ✓ $0 유지 | ✓ 확인됨 |
| 호스팅 | ✓ 무료 | ✓ 확인됨 |

---

## 🎯 하기 전에

**먼저 이것들을 확인하세요:**

```bash
# 1️⃣ 프로젝트 구조
ls -la

# 2️⃣ git 상태
git status
git log --oneline -5

# 3️⃣ 의존성
cat package.json | grep -E "\"(name|version|scripts)\""

# 4️⃣ 환경 설정
ls .env* 2>/dev/null || echo "환경 변수 없음"
```

---

## 💰 무료 개발 정책

```
✓ 승인 안 해도 되는 것:
  • Vercel (무료 tier)
  • Firebase Spark (무료)
  • GitHub (무료)
  • Google Cloud (무료 tier)

✗ 비용 발생할 수 있는 것:
  • Stripe (결제 기능)
  • Anthropic API (자동화)
  • OpenAI API
  • 기타 유료 서비스

⚠️ 규칙: 돈이 드는 것은 절대 금지
```

---

## 🚨 문제가 있으면

```bash
# 1️⃣ 현재 문제 진단
npm run build  # 빌드 확인
npm test       # 테스트 확인 (있으면)

# 2️⃣ 의존성 확인
npm audit      # 취약점 확인

# 3️⃣ 구조 확인
find . -type f -name "*.todo" -o -name "TODO*" | head
```

---

## 📌 주의사항

| ⚠️ 하지 마세요 | ✓ 대신 이렇게 |
|---|---|
| API 키 커밋 | 환경 변수로 관리 |
| node_modules 커밋 | .gitignore에 추가 |
| 자동 배포 | 수동 검토 후 배포 |
| 유료 기능 추가 | 먼저 확인 후 추가 |

---

## 📞 도움 필요하면

**즉시 확인해야 할 것:**

1. **구조 문제** → 파일 정리 문서 읽기
2. **의존성 문제** → package.json 정리
3. **빌드 실패** → 에러 메시지 복사해서 공유
4. **배포 막힘** → git status 확인

---

**준비 됐습니다. 지금 시작하세요!** 🚀
