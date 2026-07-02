"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white/5 border-b border-white/10 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link href="/" className="text-xl font-bold text-white flex items-center gap-2">
            🤖 로봇플랫폼
          </Link>

          {/* 네비게이션 링크 */}
          <div className="hidden md:flex gap-8">
            <Link href="/dashboard" className="text-zinc-400 hover:text-white transition">
              대시보드
            </Link>
            <Link href="/robots" className="text-zinc-400 hover:text-white transition">
              로봇
            </Link>
            <Link href="/market" className="text-zinc-400 hover:text-white transition">
              마켓
            </Link>
            <Link href="/analytics" className="text-zinc-400 hover:text-white transition">
              분석
            </Link>
          </div>

          {/* 우측 버튼 */}
          <div className="flex gap-4">
            <Link
              href="/profile"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
            >
              프로필
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
