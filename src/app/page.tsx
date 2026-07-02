"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap, Users, Sparkles } from "lucide-react";
import Link from "next/link";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-xl">
            🤖 로봇 AI
          </motion.div>
          <div className="flex gap-4">
            <Link href="/robots" className="text-sm text-zinc-400 hover:text-white transition">
              탐색
            </Link>
            <a href="https://ko-fi.com" target="_blank" className="text-sm bg-rose-600 hover:bg-rose-500 px-4 py-2 rounded-lg transition">
              후원하기
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto text-center"
        >
          {/* Pre-title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block mb-6"
          >
            <span className="text-sm font-medium text-blue-400 bg-blue-400/10 px-4 py-2 rounded-full">
              ✨ 글로벌 #1 로봇 AI 플랫폼
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            variants={container}
            initial="hidden"
            animate="show"
            className="text-6xl md:text-7xl font-bold mb-6 leading-tight"
          >
            <motion.span variants={item} className="block">
              로봇이 바꾸는
            </motion.span>
            <motion.span variants={item} className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              미래, 함께 봅시다
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={item}
            className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            세계 최신 로봇 기술부터 AI 트렌드까지,
            <br />
            투명하고 신뢰할 수 있는 정보를 제공합니다.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link
              href="/robots"
              className="group flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-xl font-semibold transition-all hover:gap-3"
            >
              로봇 탐색하기
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="https://ko-fi.com"
              target="_blank"
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-8 py-4 rounded-xl font-semibold border border-white/20 transition"
            >
              <Sparkles className="w-5 h-5" />
              우리를 지원하기
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div variants={item} className="grid grid-cols-3 gap-8 text-center">
            {[
              { number: "100+", label: "로봇 기술" },
              { number: "30+", label: "국가 데이터" },
              { number: "$0", label: "사용료" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-bold text-blue-400 mb-2">{stat.number}</div>
                <div className="text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-20 right-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute bottom-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-6 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-4xl font-bold text-center mb-16"
          >
            우리는 다릅니다
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "최고의 기술",
                desc: "Dyson처럼 엄격한 기술 기준으로 모든 데이터를 검증합니다",
              },
              {
                icon: Users,
                title: "투명한 수익",
                desc: "모든 수익 구조를 공개하고, 이익의 일부는 사회에 기여합니다",
              },
              {
                icon: Sparkles,
                title: "신뢰 기반 커뮤니티",
                desc: "사용자가 중심인 플랫폼으로 함께 성장합니다",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="group bg-white/5 border border-white/10 hover:border-blue-500/50 rounded-2xl p-8 transition-all hover:bg-blue-500/10"
              >
                <feature.icon className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-zinc-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold mb-6">지금 시작하세요</h2>
          <p className="text-lg text-zinc-400 mb-8">
            로봇 AI의 미래를 함께 탐색하고,
            <br />
            투명하고 신뢰할 수 있는 정보를 얻으세요.
          </p>
          <Link
            href="/robots"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 px-10 py-4 rounded-xl font-semibold transition"
          >
            로봇 갤러리 탐색 →
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto text-center text-zinc-500 text-sm">
          <p>🌍 투명 · 신뢰 · 사회 기여 · 로봇 AI</p>
          <p className="mt-4">© 2026 로봇 AI 플랫폼. 모든 것이 공개되어 있습니다.</p>
        </div>
      </footer>
    </main>
  );
}
