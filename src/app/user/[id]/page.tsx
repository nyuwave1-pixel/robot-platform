"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Award, TrendingUp, MessageSquare, Heart } from "lucide-react";
import Link from "next/link";
import RPPointsDisplay from "@/components/RPPointsDisplay";

interface UserProfile {
  id: string;
  displayName: string;
  avatar: string;
  bio: string;
  rpPoints: number;
  level: number;
  joinDate: string;
  stats: {
    postsCount: number;
    commentsCount: number;
    likesCount: number;
    reputation: number;
  };
}

// 샘플 사용자 프로필
const SAMPLE_USER: UserProfile = {
  id: "user-1",
  displayName: "RobotFan2024",
  avatar: "🤖",
  bio: "로봇과 AI 기술에 열정적인 개발자. 글로벌 로봇 커뮤니티 활동가.",
  rpPoints: 2450,
  level: 2,
  joinDate: "2026-06-15",
  stats: {
    postsCount: 12,
    commentsCount: 47,
    likesCount: 156,
    reputation: 4.8,
  },
};

export default function UserProfilePage({ params }: any) {
  const user = SAMPLE_USER; // 실제로는 params.id로 사용자 조회

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-20">
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/forum" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition">
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </Link>
      </div>

      {/* Profile Header */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-6 mb-12"
      >
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/50 rounded-2xl p-8">
          {/* Avatar & Name */}
          <div className="flex items-start gap-8 mb-8">
            <div className="text-7xl">{user.avatar}</div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{user.displayName}</h1>
              <p className="text-zinc-400 mb-4">{user.bio}</p>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-zinc-500">가입일: {user.joinDate}</span>
                <span className="flex items-center gap-2 bg-blue-600 px-3 py-1 rounded-full font-semibold">
                  <Award className="w-4 h-4" />
                  Level {user.level}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "게시물", value: user.stats.postsCount, icon: MessageSquare },
              { label: "댓글", value: user.stats.commentsCount, icon: MessageSquare },
              { label: "좋아요", value: user.stats.likesCount, icon: Heart },
              { label: "평점", value: user.stats.reputation, icon: Award },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 rounded-lg p-4 text-center">
                <stat.icon className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* RP Points Section */}
      <section className="max-w-4xl mx-auto px-6 mb-12">
        <h2 className="text-2xl font-bold mb-6">RP Points 현황</h2>
        <RPPointsDisplay points={user.rpPoints} level={user.level} />
      </section>

      {/* Activity Section */}
      <section className="max-w-4xl mx-auto px-6 mb-12">
        <h2 className="text-2xl font-bold mb-6">최근 활동</h2>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/8 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold mb-1">
                    "Tesla Optimus vs Boston Atlas" 게시물에 댓글
                  </h3>
                  <p className="text-sm text-zinc-400">정말 좋은 분석입니다!</p>
                </div>
                <span className="text-xs text-zinc-500">2일 전</span>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <span className="text-xs bg-cyan-600/20 text-cyan-300 px-2 py-1 rounded">
                  +5 RP
                </span>
                <span className="text-xs text-zinc-600 flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  12
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Achievements */}
      <section className="max-w-4xl mx-auto px-6 mb-12">
        <h2 className="text-2xl font-bold mb-6">뱃지 & 성취</h2>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { emoji: "🌟", label: "신입 환영" },
            { emoji: "💬", label: "100 댓글" },
            { emoji: "❤️", label: "100 좋아요" },
            { emoji: "🚀", label: "10 게시물" },
            { emoji: "🎯", label: "Level 2" },
            { emoji: "👑", label: "명성 4.5+" },
          ].map((badge) => (
            <motion.div
              key={badge.label}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="bg-white/5 border border-blue-500/30 rounded-xl p-6 text-center hover:bg-blue-500/20 transition cursor-pointer"
            >
              <div className="text-3xl mb-2">{badge.emoji}</div>
              <div className="text-xs font-semibold text-zinc-300">{badge.label}</div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
