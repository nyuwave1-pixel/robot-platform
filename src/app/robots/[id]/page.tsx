"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Star, MapPin, Calendar, ExternalLink, Share2 } from "lucide-react";
import Link from "next/link";

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
  url: string;
}

export default function RobotDetailPage({ params }: { params: { id: string } }) {
  const [robot, setRobot] = useState<Robot | null>(null);
  const [allRobots, setAllRobots] = useState<Robot[]>([]);

  useEffect(() => {
    const loadRobots = async () => {
      const res = await fetch("/data/robots.json");
      const data = await res.json();
      setAllRobots(data);
      const found = data.find((r: Robot) => r.id === params.id);
      setRobot(found);
    };
    loadRobots();
  }, [params.id]);

  if (!robot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center pt-20">
        <p>로봇 정보를 로드 중...</p>
      </div>
    );
  }

  const relatedRobots = allRobots.filter(
    (r) =>
      r.category === robot.category &&
      r.id !== robot.id
  ).slice(0, 3);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-20">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Link href="/robots" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition">
          <ArrowLeft className="w-4 h-4" />
          갤러리로 돌아가기
        </Link>
      </div>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 mb-20"
      >
        {/* Image */}
        <div className="relative h-96 rounded-2xl overflow-hidden">
          <img
            src={robot.image}
            alt={robot.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          {/* Title */}
          <div className="mb-6">
            <h1 className="text-5xl font-bold mb-4">{robot.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-full">
                <Star className="w-5 h-5 fill-white" />
                <span className="text-lg font-bold">{robot.trustScore} 신뢰도</span>
              </div>
              <span className="bg-white/10 px-4 py-2 rounded-full text-sm font-medium">
                {robot.category}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-lg text-zinc-300 mb-8">{robot.description}</p>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                <MapPin className="w-4 h-4" />
                국가
              </div>
              <p className="text-lg font-semibold">{robot.country}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                <Calendar className="w-4 h-4" />
                연도
              </div>
              <p className="text-lg font-semibold">{robot.year}</p>
            </div>
          </div>

          {/* Technology */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">핵심 기술</h3>
            <div className="flex flex-wrap gap-2">
              {robot.technology.map((tech) => (
                <span
                  key={tech}
                  className="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <a
              href={robot.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-semibold transition"
            >
              <ExternalLink className="w-5 h-5" />
              공식 사이트
            </a>
            <button className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-semibold border border-white/20 transition">
              <Share2 className="w-5 h-5" />
              공유
            </button>
          </div>
        </div>
      </motion.section>

      {/* Related Robots */}
      {relatedRobots.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <h2 className="text-3xl font-bold mb-8">비슷한 로봇</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedRobots.map((r) => (
              <Link key={r.id} href={`/robots/${r.id}`}>
                <motion.div
                  whileHover={{ y: -8 }}
                  className="group bg-white/5 border border-white/10 hover:border-blue-500/50 rounded-2xl overflow-hidden"
                >
                  <div className="h-32 overflow-hidden bg-slate-700">
                    <img
                      src={r.image}
                      alt={r.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 group-hover:text-blue-400 transition">
                      {r.name}
                    </h3>
                    <p className="text-xs text-zinc-400">{r.description}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
