'use client';

import { motion } from 'framer-motion';

const features = [
  {
    title: '126개 AI 로봇',
    desc: '각 로봇이 살아있는 느낌',
    icon: '🤖',
  },
  {
    title: '실시간 에이전트 경제',
    desc: '돈이 흐르는 투명한 시스템',
    icon: '💰',
  },
  {
    title: '투명한 수익 분배',
    desc: '100% 수익 공개',
    icon: '📊',
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-robot-dark">
      <div className="max-w-6xl mx-auto px-8">
        <motion.h2
          className="text-4xl font-bold text-robot-text text-center mb-16 font-poppins"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          우리가 만드는 것
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              className="bg-slate-800 rounded-xl p-8 border border-slate-700 hover:border-robot-gold transition-colors"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: i * 0.2 }}
              whileHover={{ y: -8 }}
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-bold text-robot-text mb-2 font-poppins">
                {feature.title}
              </h3>
              <p className="text-slate-400 font-lexend">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
