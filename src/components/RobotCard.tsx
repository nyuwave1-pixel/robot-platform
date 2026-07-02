"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

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

export default function RobotCard({ robot }: { robot: Robot }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all group cursor-pointer"
    >
      <div className="h-48 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 flex items-center justify-center relative overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="text-6xl"
        >
          {robot.image}
        </motion.div>
        <div className="absolute top-4 right-4 bg-blue-600/80 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold">
          {robot.year}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-3">
          <h3 className="text-xl font-bold mb-1 group-hover:text-blue-400 transition">
            {robot.name}
          </h3>
          <p className="text-xs text-zinc-500">{robot.country}</p>
        </div>

        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
          {robot.description}
        </p>

        <div className="mb-4">
          <span className="inline-block bg-cyan-600/20 text-cyan-400 text-xs px-3 py-1 rounded-full">
            {robot.category}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {robot.technology.slice(0, 3).map((tech) => (
            <span key={tech} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded">
              {tech}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-semibold">{robot.trustScore}</span>
          </div>
          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-xs rounded-lg transition">
            상세
          </button>
        </div>
      </div>
    </motion.div>
  );
}
