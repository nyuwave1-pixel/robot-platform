"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white/5 border-b border-white/10 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-white flex items-center gap-2">
            🤖 로봇플랫폼
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 flex-1 ml-12">
            <Link href="/robots" className="text-zinc-400 hover:text-white transition">
              로봇
            </Link>
            <Link href="/market" className="text-zinc-400 hover:text-white transition">
              마켓
            </Link>
            <Link href="/dashboard" className="text-zinc-400 hover:text-white transition">
              대시보드
            </Link>
            <Link href="/analytics" className="text-zinc-400 hover:text-white transition">
              분석
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex gap-4">
            <Link
              href="/signin"
              className="px-4 py-2 text-zinc-400 hover:text-white transition"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
            >
              가입
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="space-y-4">
              <Link href="/robots" className="block text-zinc-400 hover:text-white">
                로봇
              </Link>
              <Link href="/market" className="block text-zinc-400 hover:text-white">
                마켓
              </Link>
              <Link href="/dashboard" className="block text-zinc-400 hover:text-white">
                대시보드
              </Link>
              <Link href="/signin" className="block text-zinc-400 hover:text-white">
                로그인
              </Link>
              <Link href="/signup" className="block w-full bg-blue-600 px-4 py-2 rounded-lg text-white text-center">
                가입
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
