"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white/5 border-t border-white/10 py-12 px-6 mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4">🤖 로봇플랫폼</h3>
            <p className="text-sm text-zinc-400">
              세계 최신 로봇 기술을 투명하게 공유합니다
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">탐색</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/robots" className="hover:text-white">로봇</Link></li>
              <li><Link href="/market" className="hover:text-white">마켓</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">대시보드</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">커뮤니티</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><a href="#" className="hover:text-white">포럼</a></li>
              <li><a href="#" className="hover:text-white">디스코드</a></li>
              <li><a href="#" className="hover:text-white">깃허브</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">지원</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><a href="https://ko-fi.com" target="_blank" className="hover:text-white">Ko-fi 후원</a></li>
              <li><a href="#" className="hover:text-white">문서</a></li>
              <li><a href="#" className="hover:text-white">연락처</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-zinc-500">
            <p>© 2026 로봇 AI 플랫폼. 모든 것이 공개되어 있습니다.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white">이용약관</a>
              <a href="#" className="hover:text-white">개인정보</a>
              <a href="#" className="hover:text-white">라이센스</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
