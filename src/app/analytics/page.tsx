"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

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

export default function Analytics() {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/robots.json")
      .then((r) => r.json())
      .then((data) => {
        setRobots(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const total = robots.length;

  // 연도별 등장 추이
  const byYear = robots.reduce<Record<number, number>>((acc, r) => {
    acc[r.year] = (acc[r.year] || 0) + 1;
    return acc;
  }, {});
  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => a - b);
  const maxYear = Math.max(1, ...Object.values(byYear));

  // 기술 채택률
  const byTech = robots.reduce<Record<string, number>>((acc, r) => {
    r.technology.forEach((t) => (acc[t] = (acc[t] || 0) + 1));
    return acc;
  }, {});
  const techEntries = Object.entries(byTech).sort((a, b) => b[1] - a[1]);

  // 신뢰도 분포 (버킷)
  const buckets = [
    { label: "4.8 – 5.0", min: 4.8, max: 5.01 },
    { label: "4.5 – 4.8", min: 4.5, max: 4.8 },
    { label: "4.0 – 4.5", min: 4.0, max: 4.5 },
    { label: "4.0 미만", min: 0, max: 4.0 },
  ].map((b) => ({
    ...b,
    count: robots.filter((r) => r.trustScore >= b.min && r.trustScore < b.max).length,
  }));
  const maxBucket = Math.max(1, ...buckets.map((b) => b.count));

  const newest = [...robots].sort((a, b) => b.year - a.year).slice(0, 5);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#060608] text-white pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">📈 분석</h1>
            <p className="text-zinc-400">
              등록된 로봇 {total}종의 연도·기술·신뢰도 추이 분석
            </p>
          </div>

          {loading ? (
            <p className="text-zinc-500">데이터 분석 중...</p>
          ) : (
            <>
              {/* 연도별 등장 추이 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-bold mb-6">연도별 로봇 등장 추이</h2>
                <div className="flex items-end justify-between gap-3 h-56">
                  {years.map((y) => (
                    <div key={y} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div className="text-sm font-bold text-blue-400 mb-2">{byYear[y]}</div>
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-lg transition-all"
                        style={{ height: `${(byYear[y] / maxYear) * 100}%` }}
                      />
                      <div className="text-xs text-zinc-400 mt-2">{y}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* 기술 채택률 */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-6">기술 채택률</h2>
                  <div className="space-y-4">
                    {techEntries.map(([tech, count]) => (
                      <div key={tech}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{tech}</span>
                          <span className="text-zinc-400">
                            {count}종 ({Math.round((count / total) * 100)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full transition-all"
                            style={{ width: `${(count / total) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 신뢰도 분포 */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-6">신뢰도 분포</h2>
                  <div className="space-y-4">
                    {buckets.map((b) => (
                      <div key={b.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{b.label}</span>
                          <span className="text-zinc-400">{b.count}종</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${(b.count / maxBucket) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 최신 로봇 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-6">최신 등록 로봇</h2>
                <div className="space-y-4">
                  {newest.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between pb-4 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{r.image}</span>
                        <div>
                          <div className="font-semibold">{r.name}</div>
                          <div className="text-sm text-zinc-400">{r.country}</div>
                        </div>
                      </div>
                      <div className="text-sm font-mono text-blue-400">{r.year}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
