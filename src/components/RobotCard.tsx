"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star, MapPin, Zap } from "lucide-react";

interface Robot {
  id: string;
  name: string;
  image: string;
  description: string;
  technology: string[];
  country: string;
  year: number;
  trustScore: number;
}

export default function RobotCard({ robot }: { robot: Robot }) {
  return (
    <Link href={`/robots/${robot.id}`}>
      <motion.div
        whileHover={{ y: -8 }}
        className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-2xl overflow-hidden transition-all duration-300"
      >
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900">
          <img
            src={robot.image}
            alt={robot.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
          
          {/* Trust Score Badge */}
          <div className="absolute top-4 right-4 bg-blue-600 text-white rounded-full p-3 flex items-center gap-1">
            <Star className="w-4 h-4 fill-white" />
            <span className="text-sm font-bold">{robot.trustScore}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
            {robot.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
            {robot.description}
          </p>

          {/* Tech Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {robot.technology.slice(0, 2).map((tech) => (
              <span
                key={tech}
                className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full"
              >
                {tech}
              </span>
            ))}
            {robot.technology.length > 2 && (
              <span className="text-xs text-zinc-500">
                +{robot.technology.length - 2}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {robot.country}
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {robot.year}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
