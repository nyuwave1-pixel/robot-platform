'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Stat {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
}

const stats: Stat[] = [
  { label: '이 달 수익', value: 2350, prefix: '$' },
  { label: '활성 사용자', value: 12500 },
  { label: '거래된 RP', value: 850000 },
  { label: '기여금', value: 235, prefix: '$' },
];

function Counter({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const increment = target / (duration / 50);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 50);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

export default function Stats() {
  return (
    <section className="py-20 bg-slate-900 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-8">
        <motion.h2
          className="text-4xl font-bold text-robot-text text-center mb-16 font-poppins"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          📊 실시간 통계
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              className="bg-slate-800 rounded-lg p-8 border border-robot-gold/30 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <div className="text-4xl font-bold text-robot-gold mb-2 font-poppins">
                <Counter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </div>
              <p className="text-slate-400 font-lexend">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
