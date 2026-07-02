"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, Eye, ThumbsUp, Share2 } from "lucide-react";
import Link from "next/link";

export default function ForumDetailPage({ params }: { params: { category: string; id: string } }) {
  const [comments, setComments] = useState<any[]>([
    {
      id: "1",
      author: "TechLover",
      content: "정말 좋은 분석입니다! 동의합니다.",
      rpReward: 5,
      createdAt: "2026-07-02",
      likes: 12,
    },
    {
      id: "2",
      author: "RobotFan",
      content: "이 부분이 더 자세히 설명되면 좋을 것 같아요.",
      rpReward: 5,
      createdAt: "2026-07-02",
      likes: 8,
    },
  ]);

  const [newComment, setNewComment] = useState("");

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: Math.random().toString(36),
      author: "당신",
      content: newComment,
      rpReward: 5,
      createdAt: new Date().toISOString().split("T")[0],
      likes: 0,
    };

    setComments([...comments, comment]);
    setNewComment("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-20">
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          포럼으로 돌아가기
        </Link>
      </div>

      {/* Post */}
      <section className="max-w-4xl mx-auto px-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-8"
        >
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                기술
              </span>
              <span className="text-xs text-zinc-500">2026-07-02</span>
            </div>

            <h1 className="text-4xl font-bold mb-4">
              Tesla Optimus vs Boston Atlas - 어떤 로봇이 미래일까?
            </h1>

            <p className="text-zinc-400 text-lg mb-6">
              두 최고의 휴머노이드 로봇을 깊이 있게 비교 분석합니다. 기술력, 가격, 활용도 측면에서...
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 py-6 border-t border-b border-white/10">
            <span className="flex items-center gap-2 text-zinc-400">
              <Eye className="w-4 h-4" />
              1,240 조회
            </span>
            <span className="flex items-center gap-2 text-zinc-400">
              <MessageCircle className="w-4 h-4" />
              {comments.length} 댓글
            </span>
            <span className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
              <span>+50 RP</span>
            </span>
          </div>

          {/* Author */}
          <div className="flex items-center gap-4 mt-6 pt-6">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold">
              R
            </div>
            <div>
              <div className="font-semibold">RobotFan</div>
              <div className="text-sm text-zinc-400">2026-07-02 작성</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Comments Section */}
      <section className="max-w-4xl mx-auto px-6 mb-12">
        <h2 className="text-2xl font-bold mb-6">댓글 ({comments.length})</h2>

        {/* New Comment Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleAddComment}
          className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8"
        >
          <label className="block text-sm font-medium mb-3 text-zinc-300">
            댓글 작성 (+5 RP)
          </label>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="좋은 댓글을 남겨주세요..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-blue-500/50 transition min-h-[100px] resize-none"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="mt-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            댓글 작성
          </button>
        </motion.form>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment, i) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6"
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">
                    {comment.author[0]}
                  </div>
                  <div>
                    <div className="font-semibold">{comment.author}</div>
                    <div className="text-xs text-zinc-500">{comment.createdAt}</div>
                  </div>
                </div>
                <span className="bg-cyan-600/20 text-cyan-300 text-xs font-semibold px-2 py-1 rounded">
                  +{comment.rpReward} RP
                </span>
              </div>

              {/* Comment Content */}
              <p className="text-zinc-300 mb-4">{comment.content}</p>

              {/* Comment Actions */}
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <button className="flex items-center gap-1 hover:text-blue-400 transition">
                  <ThumbsUp className="w-4 h-4" />
                  {comment.likes}
                </button>
                <button className="flex items-center gap-1 hover:text-blue-400 transition">
                  <Share2 className="w-4 h-4" />
                  공유
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
