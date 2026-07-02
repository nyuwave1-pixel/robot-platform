"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowRight, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* 404 Animation */}
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
        >
          404
        </motion.div>

        {/* Message */}
        <h1 className="text-4xl font-bold mb-4">페이지를 찾을 수 없습니다</h1>
        <p className="text-zinc-400 mb-8 text-lg">
          요청하신 페이지가 존재하지 않습니다. 다른 페이지로 이동해주세요.
        </p>

        {/* Quick Links */}
        <div className="space-y-3 mb-8">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition"
          >
            <Home className="w-5 h-5" />
            홈으로 돌아가기
          </Link>

          <Link
            href="/robots"
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl border border-white/20 transition"
          >
            <Search className="w-5 h-5" />
            갤러리 탐색
          </Link>

          <Link
            href="/forum"
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl border border-white/20 transition"
          >
            <ArrowRight className="w-5 h-5" />
            포럼 방문
          </Link>
        </div>

        {/* Easter Egg */}
        <p className="text-xs text-zinc-600">
          🤖 로봇이 이 페이지를 먹었나요?
        </p>
      </motion.div>
    </main>
  );
}
