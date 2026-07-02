"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import RobotCard from "@/components/RobotCard";

interface Robot {
  id: string;
  name: string;
  image: string;
  description: string;
  category: string;
  technology: string[];
  country: string;
  year: number;
  trustScore: number;
}

const categories = [
  "humanoid",
  "industrial",
  "medical",
  "ai",
  "drone",
  "other",
];

const technologies = [
  "AI",
  "ML",
  "Vision",
  "NLP",
  "RF",
];

export default function RobotsPage() {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTech, setSelectedTech] = useState("all");

  // Load robots data
  useMemo(async () => {
    const res = await fetch("/data/robots.json");
    const data = await res.json();
    setRobots(data);
  }, []);

  // Filter robots
  const filtered = robots.filter((robot) => {
    const matchSearch =
      robot.name.toLowerCase().includes(search.toLowerCase()) ||
      robot.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      selectedCategory === "all" || robot.category === selectedCategory;
    const matchTech =
      selectedTech === "all" || robot.technology.includes(selectedTech);

    return matchSearch && matchCategory && matchTech;
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-20">
      {/* Header */}
      <section className="relative py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-bold mb-4">로봇 갤러리</h1>
            <p className="text-zinc-400 text-lg">
              세계 최신 로봇 기술, 한눈에 탐색
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 flex items-center gap-3 mb-8"
          >
            <Search className="w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="로봇 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent flex-1 outline-none text-white placeholder:text-zinc-500"
            />
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-4 mb-8"
          >
            {/* Category Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedCategory === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                모든 카테고리
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Tech Filter */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setSelectedTech("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedTech === "all"
                    ? "bg-cyan-600 text-white"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                모든 기술
              </button>
              {technologies.map((tech) => (
                <button
                  key={tech}
                  onClick={() => setSelectedTech(tech)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedTech === tech
                      ? "bg-cyan-600 text-white"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Results Count */}
          <p className="text-zinc-500 text-sm mb-6">
            {filtered.length}개의 로봇 발견
          </p>

          {/* Grid */}
          {filtered.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((robot, i) => (
                <motion.div
                  key={robot.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <RobotCard robot={robot} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <Filter className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
              <p className="text-zinc-400">
                조건에 맞는 로봇이 없습니다.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
