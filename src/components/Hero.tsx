'use client';

import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="min-h-screen bg-robot-gradient flex items-center justify-center relative overflow-hidden">
      {/* 3D Robot Background Animation */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" viewBox="0 0 400 400">
          {/* Simplified Robot silhouette with rotating effect */}
          <g className="animate-spin" style={{ animationDuration: '20s' }}>
            <rect x="150" y="80" width="100" height="120" fill="none" stroke="#3b82f6" strokeWidth="2" rx="10" />
            <circle cx="200" cy="120" r="35" fill="none" stroke="#3b82f6" strokeWidth="2" />
            <rect x="130" y="200" width="30" height="100" fill="none" stroke="#fbbf24" strokeWidth="2" />
            <rect x="240" y="200" width="30" height="100" fill="none" stroke="#fbbf24" strokeWidth="2" />
          </g>
        </svg>
      </div>

      {/* RF Energy Wave Animation */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border-2 border-robot-gold"
            initial={{ width: 100, height: 100, opacity: 0.8 }}
            animate={{ width: 400, height: 400, opacity: 0 }}
            transition={{
              duration: 3,
              delay: i * 0.6,
              repeat: Infinity,
            }}
          />
        ))}
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 text-center text-robot-text"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <h1 className="text-6xl font-bold font-poppins mb-4">
          🤖 로봇 AI의 미래
        </h1>
        <p className="text-2xl text-slate-400 font-lexend mb-8">
          의료급 기술을 플랫폼에서
        </p>
        
        <motion.button
          className="px-8 py-4 bg-robot-gold text-robot-dark font-bold rounded-lg font-poppins text-lg hover:shadow-lg shadow-lg hover:shadow-robot-gold/50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          시작하기 →
        </motion.button>
      </motion.div>
    </section>
  );
}
