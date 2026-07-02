'use client';

import { motion } from 'framer-motion';

export default function CTA() {
  return (
    <section className="py-20 bg-robot-gradient">
      <div className="max-w-4xl mx-auto px-8 text-center">
        <motion.h2
          className="text-4xl font-bold text-robot-text mb-8 font-poppins"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          🚀 지금 시작하세요
        </motion.h2>

        <motion.p
          className="text-xl text-slate-300 mb-12 font-lexend"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          최고 수준의 로봇 AI 플랫폼에 참여하여 수익을 만들어보세요.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: '지금 시작하기', color: 'bg-robot-gold text-robot-dark' },
            { label: '게임 플레이', color: 'bg-robot-blue text-white' },
            { label: '개발자 문서', color: 'bg-slate-700 text-slate-200' },
          ].map((btn, i) => (
            <motion.button
              key={i}
              className={`py-3 px-6 rounded-lg font-bold font-poppins transition-all ${btn.color} hover:shadow-lg`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {btn.label}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
