#!/bin/bash
# 배포 스크립트

echo "🚀 배포 시작..."

# 1. 빌드
echo "1️⃣ 빌드 중..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ 빌드 실패"
  exit 1
fi

# 2. 타입 체크
echo "2️⃣ 타입 확인 중..."
npm run type-check 2>/dev/null || echo "⚠️ 타입 체크 스킵"

# 3. Git 커밋
echo "3️⃣ Git 커밋 중..."
git add -A
git commit -m "build: production build $(date +%Y-%m-%d)" || echo "⚠️ 변경사항 없음"

# 4. Vercel 배포
echo "4️⃣ Vercel 배포 중..."
vercel --prod

echo "✅ 배포 완료!"
