"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import ForumCard from "@/components/ForumCard";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";

interface ForumPost {
  id: string;
  title: string;
  description: string;
  category: "technology" | "news" | "general";
  author: string;
  views: number;
  comments: number;
  rpReward: number;
  createdAt: string;
}

// 샘플 데이터
const SAMPLE_POSTS: ForumPost[] = [
  {
    id: "1",
    title: "Tesla Optimus vs Boston Atlas - 어떤 로봇이 미래일까?",
    description: "두 최고의 휴머노이드 로봇을 비교 분석합니다.",
    category: "technology",
    author: "RobotFan",
    views: 1240,
    comments: 45,
    rpReward: 50,
    createdAt: "2026-07-02",
  },
  {
    id: "2",
    title: "2026년 로봇 시장 동향 분석",
    description: "최신 로봇 기술 트렌드와 시장 전망을 분석합니다.",
    category: "news",
    author: "TechAnalyst",
    views: 2100,
    comments: 78,
    rpReward: 100,
    createdAt: "2026-07-01",
  },
  {
    id: "3",
    title: "로봇 플랫폼에서 함께 성장하는 커뮤니티",
    description: "투명하고 신뢰할 수 있는 로봇 AI 정보 공유 플랫폼",
    category: "general",
    author: "Admin",
    views: 450,
    comments: 23,
    rpReward: 30,
    createdAt: "2026-07-02",
  },
];

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>(SAMPLE_POSTS);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "technology" | "news" | "general">("all");

  // Firestore에서 실제 토론 로드 (실패·미설정 시 샘플 데이터 유지)
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const load = async () => {
      try {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return;
        const loaded = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title ?? ""),
            description: String(data.description ?? ""),
            category: (["technology", "news", "general"].includes(data.category)
              ? data.category
              : "general") as ForumPost["category"],
            author: String(data.author ?? "익명"),
            views: Number(data.views ?? 0),
            comments: Number(data.comments ?? 0),
            rpReward: Number(data.rpReward ?? 0),
            createdAt: String(data.createdAt ?? ""),
          };
        });
        setPosts(loaded);
      } catch {
        // Firestore 접근 실패 시 샘플 데이터 그대로 사용
      }
    };
    load();
  }, []);

  const filtered = selectedCategory === "all" ? posts : posts.filter((p) => p.category === selectedCategory);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-20">
      {/* Header */}
      <section className="relative py-12 px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-8 h-8 text-blue-400" />
                <h1 className="text-4xl font-bold">커뮤니티 포럼</h1>
              </div>
              <p className="text-zinc-400">로봇 AI에 대해 함께 토론하고, RP Points로 보상받으세요</p>
            </div>
            <Link
              href="/forum/create"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-semibold transition"
            >
              <Plus className="w-5 h-5" />
              새 토론
            </Link>
          </motion.div>

          {/* Filters */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mt-8 flex gap-3">
            {(["all", "technology", "news", "general"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedCategory === cat ? "bg-blue-600 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                {cat === "all" && "모든 토론"}
                {cat === "technology" && "기술"}
                {cat === "news" && "뉴스"}
                {cat === "general" && "일반"}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Posts */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <p className="text-zinc-500 text-sm mb-6">{filtered.length}개의 토론</p>

        <div className="space-y-4">
          {filtered.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ForumCard post={post} />
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
