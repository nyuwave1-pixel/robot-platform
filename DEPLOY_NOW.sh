#!/bin/bash

# 🚀 로봇 플랫폼 빠른 배포 스크립트

echo "=========================================="
echo "🚀 Vercel 배포 시작"
echo "=========================================="

cd "C:\Users\현이\로봇플랫폼개발진행2"

# Step 1: 최종 커밋
echo "1️⃣ 최종 커밋..."
git add .
git commit -m "deploy: 최고 수준의 로봇 AI 플랫폼 준비 완료" || echo "이미 커밋됨"

# Step 2: Vercel 배포
echo "2️⃣ Vercel 배포 시작..."
echo ""
echo "다음 중 하나를 실행하세요:"
echo ""
echo "방법 A: Vercel CLI (추천)"
echo "  npm i -g vercel"
echo "  vercel"
echo ""
echo "방법 B: Vercel Dashboard"
echo "  1. vercel.com 접속"
echo "  2. GitHub 연동"
echo "  3. 이 저장소 선택"
echo "  4. Deploy 클릭"
echo ""
echo "=========================================="
echo "배포 완료 후 라이브 URL이 표시됩니다!"
echo "=========================================="
