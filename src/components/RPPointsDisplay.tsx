"use client";

import { motion } from "framer-motion";
import { Zap, TrendingUp } from "lucide-react";

interface RPPointsDisplayProps {
  points: number;
  level?: number;
}

export default function RPPointsDisplay({ points, level = 1 }: RPPointsDisplayProps) {
  const nextLevelThreshold = level * 1000;
  const progressPercent = (points % 1000) / 10;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/50 rounded-xl p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-white">RP Points</span>
        </div>
        <span className="text-sm text-zinc-400">Lv.{level}</span>
      </div>

      {/* Points Display */}
      <div className="text-3xl font-bold text-blue-300 mb-2">
        {points.toLocaleString()}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/10 rounded-full h-2 mb-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-blue-400 to-cyan-400"
        />
      </div>

      {/* Level Info */}
      <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
        <span>{points % 1000} / 1000</span>
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Level {level} → {level + 1}
        </span>
      </div>

      {/* Earning Info */}
      <div className="text-xs text-zinc-500 bg-white/5 rounded-lg p-3 space-y-1">
        <div>
          <span className="text-zinc-400">게시물:</span> <span className="text-blue-300">+10 RP</span>
        </div>
        <div>
          <span className="text-zinc-400">댓글:</span> <span className="text-cyan-300">+5 RP</span>
        </div>
        <div>
          <span className="text-zinc-400">좋아요:</span> <span className="text-emerald-300">+1 RP</span>
        </div>
      </div>
    </motion.div>
  );
}
