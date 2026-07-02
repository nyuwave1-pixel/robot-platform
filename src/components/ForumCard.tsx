"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, Eye, TrendingUp } from "lucide-react";

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

const categoryColors = {
  technology: "bg-blue-500/20 text-blue-300",
  news: "bg-amber-500/20 text-amber-300",
  general: "bg-purple-500/20 text-purple-300",
};

const categoryLabels = {
  technology: "기술",
  news: "뉴스",
  general: "일반",
};

export default function ForumCard({ post }: { post: ForumPost }) {
  return (
    <Link href={`/forum/${post.category}/${post.id}`}>
      <motion.div
        whileHover={{ x: 4 }}
        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-5 transition-all"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${categoryColors[post.category]}`}>
            {categoryLabels[post.category]}
          </span>
          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +{post.rpReward}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition line-clamp-2">
          {post.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
          {post.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {post.views}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {post.comments}
            </span>
          </div>
          <span className="text-zinc-600">{post.author}</span>
        </div>
      </motion.div>
    </Link>
  );
}
