"use client";

import { motion } from "framer-motion";
import { Trophy, TrendingUp, Medal } from "lucide-react";
import Link from "next/link";

interface LeaderboardEntry {
  rank: number;
  name: string;
  rpPoints: number;
  level: number;
  postsCount: number;
  commentsCount: number;
  reputation: number;
}

const LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    name: "TechMaster2024",
    rpPoints: 5240,
    level: 5,
    postsCount: 28,
    commentsCount: 142,
    reputation: 4.9,
  },
  {
    rank: 2,
    name: "RobotFan2024",
    rpPoints: 2450,
    level: 2,
    postsCount: 12,
    commentsCount: 47,
    reputation: 4.8,
  },
  {
    rank: 3,
    name: "AIEnthusiast",
    rpPoints: 1880,
    level: 1,
    postsCount: 9,
    commentsCount: 38,
    reputation: 4.7,
  },
  {
    rank: 4,
    name: "FutureVibes",
    rpPoints: 1650,
    level: 1,
    postsCount: 7,
    commentsCount: 33,
    reputation: 4.6,
  },
  {
    rank: 5,
    name: "CyberNinja",
    rpPoints: 1420,
    level: 1,
    postsCount: 6,
    commentsCount: 28,
    reputation: 4.5,
  },
];

const getMedalColor = (rank: number) => {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-gray-400";
  if (rank === 3) return "text-orange-400";
  return "text-zinc-500";
};

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-20">
      {/* Header */}
      <section className="relative py-12 px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <Trophy className="w-10 h-10 text-yellow-400" />
            <h1 className="text-4xl font-bold">커뮤니티 랭킹</h1>
          </motion.div>
          <p className="text-zinc-400">
            가장 활발한 커뮤니티 멤버들을 확인하세요
          </p>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-4">
          {LEADERBOARD.map((entry, i) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative group ${
                entry.rank <= 3 ? "bg-white/10" : "bg-white/5"
              } border border-white/10 rounded-xl p-6 hover:bg-white/15 transition`}
            >
              <div className="flex items-center gap-6">
                {/* Rank */}
                <div className="flex-shrink-0 text-center">
                  <Medal className={`w-8 h-8 mx-auto mb-2 ${getMedalColor(entry.rank)}`} />
                  <div className="text-2xl font-bold">#{entry.rank}</div>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <Link href={`/user/${entry.name}`}>
                    <h3 className="text-xl font-bold hover:text-blue-400 transition cursor-pointer">
                      {entry.name}
                    </h3>
                  </Link>
                  <div className="grid grid-cols-4 gap-4 mt-2 text-sm text-zinc-400">
                    <span>Lv. {entry.level}</span>
                    <span>게시물: {entry.postsCount}</span>
                    <span>댓글: {entry.commentsCount}</span>
                    <span>평점: {entry.reputation}</span>
                  </div>
                </div>

                {/* Points */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-3xl font-bold text-blue-400">
                    {entry.rpPoints.toLocaleString()}
                  </div>
                  <div className="text-xs text-zinc-500 flex items-center gap-1 justify-end">
                    <TrendingUp className="w-3 h-3" />
                    RP Points
                  </div>
                </div>
              </div>

              {/* Rank Badge Background */}
              {entry.rank <= 3 && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/10 to-transparent pointer-events-none opacity-50" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-white/10">
        <h2 className="text-2xl font-bold mb-6">전체 통계</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "총 사용자", value: "1,240" },
            { label: "총 게시물", value: "542" },
            { label: "총 댓글", value: "3,847" },
            { label: "평균 평점", value: "4.6⭐" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6 text-center"
            >
              <div className="text-3xl font-bold text-blue-400 mb-2">{stat.value}</div>
              <div className="text-sm text-zinc-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
