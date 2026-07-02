"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, User, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    try {
      // Firebase 익명 로그인 (나중에 연결)
      const userData = {
        uid: Math.random().toString(36).substr(2, 9),
        displayName: "Anonymous User",
        email: null,
        rpPoints: 0,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      setMessage("✓ 익명으로 로그인되었습니다!");
      setTimeout(() => (window.location.href = "/forum"), 1500);
    } catch (error) {
      setMessage("❌ 로그인 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Firebase 이메일 로그인 (나중에 연결)
      const userData = {
        uid: Math.random().toString(36).substr(2, 9),
        displayName: displayName || email.split("@")[0],
        email,
        rpPoints: 0,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      setMessage("✓ 로그인 성공!");
      setTimeout(() => (window.location.href = "/forum"), 1500);
    } catch (error) {
      setMessage("❌ 로그인 실패");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center px-6 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <LogIn className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold">로그인</h1>
          </div>
          <p className="text-zinc-400">로봇 AI 커뮤니티에 참여하세요</p>
        </div>

        {/* Anonymous Login */}
        <motion.button
          whileHover={{ y: -2 }}
          onClick={handleAnonymousLogin}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl mb-6 transition flex items-center justify-center gap-2"
        >
          <User className="w-5 h-5" />
          {isLoading ? "처리 중..." : "익명으로 시작하기"}
        </motion.button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-900 text-zinc-500">또는</span>
          </div>
        </div>

        {/* Email Login */}
        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-400">
                닉네임 (선택)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-blue-500/50 transition"
                placeholder="로봇팬"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-400">
              이메일
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-12 text-white placeholder:text-zinc-500 outline-none focus:border-blue-500/50 transition"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-400">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-12 text-white placeholder:text-zinc-500 outline-none focus:border-blue-500/50 transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ y: -2 }}
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            {isLoading ? "처리 중..." : isLogin ? "로그인" : "가입"}
          </motion.button>
        </form>

        {/* Toggle */}
        <div className="text-center text-sm text-zinc-400">
          {isLogin ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-400 hover:text-blue-300 ml-1 font-semibold transition"
          >
            {isLogin ? "가입하기" : "로그인"}
          </button>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-4 rounded-xl text-center text-sm ${
              message.startsWith("✓")
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-red-500/20 text-red-300"
            }`}
          >
            {message}
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-white/10 text-center text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-300 transition">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
