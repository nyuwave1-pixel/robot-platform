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

const CATEGORY_LABELS: Record<string, string> = {
  humanoid: "휴머노이드",
  industrial: "산업용",
  medical: "의료용",
  drone: "드론",
  ai: "AI/컴패니언",
  other: "기타",
};

export default function Dashboard() {
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

  // === 실제 데이터 집계 ===
  const total = robots.length;
  const avgTrust =
    total > 0
      ? (robots.reduce((s, r) => s + r.trustScore, 0) / total).toFixed(2)
      : "0";

  const byCategory = robots.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});
  const categoryCount = Object.keys(byCategory).length;

  const byCountry = robots.reduce<Record<string, number>>((acc, r) => {
    acc[r.country] = (acc[r.country] || 0) + 1;
    return acc;
  }, {});
  const topCountries = Object.entries(byCountry).sort((a, b) => b[1] - a[1]);
  const countryCount = topCountries.length;

  const byTech = robots.reduce<Record<string, number>>((acc, r) => {
    r.technology.forEach((t) => (acc[t] = (acc[t] || 0) + 1));
    return acc;
  }, {});
  const topTech = Object.entries(byTech).sort((a, b) => b[1] - a[1]);

  const topRated = [...robots].sort((a, b) => b.trustScore - a.trustScore).slice(0, 5);
  const maxCat = Math.max(1, ...Object.values(byCategory));

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#060608] text-white pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* 헤더 */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">📊 대시보드</h1>
            <p className="text-zinc-400">
              현재 데이터베이스에 등록된 로봇 {total}종의 실제 통계
            </p>
          </div>

          {loading ? (
            <p className="text-zinc-500">통계를 집계 중...</p>
          ) : (
            <>
              {/* KPI 카드 — 실제 집계값 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="text-sm text-zinc-400 mb-2">등록 로봇</div>
                  <div className="text-3xl font-bold">{total}</div>
                  <div className="text-xs text-zinc-500 mt-2">데이터베이스 총계</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="text-sm text-zinc-400 mb-2">카테고리</div>
                  <div className="text-3xl font-bold">{categoryCount}</div>
                  <div className="text-xs text-zinc-500 mt-2">분류된 유형 수</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="text-sm text-zinc-400 mb-2">평균 신뢰도</div>
                  <div className="text-3xl font-bold">{avgTrust}★</div>
                  <div className="text-xs text-zinc-500 mt-2">전체 평균</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="text-sm text-zinc-400 mb-2">제조 국가</div>
                  <div className="text-3xl font-bold">{countryCount}</div>
                  <div className="text-xs text-zinc-500 mt-2">등록된 국가 수</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* 카테고리 분포 (실제 막대) */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-6">카테고리 분포</h2>
                  <div className="space-y-4">
                    {Object.entries(byCategory)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cat, count]) => (
                        <div key={cat}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{CATEGORY_LABELS[cat] || cat}</span>
                            <span className="text-zinc-400">{count}종</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${(count / maxCat) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 국가 & 기술 */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-6">제조 국가 Top</h2>
                  <div className="space-y-3 mb-8">
                    {topCountries.slice(0, 5).map(([country, count]) => (
                      <div key={country} className="flex items-center justify-between">
                        <span className="text-sm">{country}</span>
                        <span className="text-sm font-semibold text-blue-400">{count}종</span>
                      </div>
                    ))}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-400 mb-3">핵심 기술 분포</h3>
                  <div className="flex flex-wrap gap-2">
                    {topTech.map(([tech, count]) => (
                      <span
                        key={tech}
                        className="text-xs bg-cyan-500/15 text-cyan-300 px-3 py-1 rounded-full"
                      >
                        {tech} · {count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 신뢰도 Top 5 (실제) */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-6">신뢰도 상위 로봇</h2>
                <div className="space-y-4">
                  {topRated.map((r, i) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between pb-4 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 font-mono text-sm w-5">{i + 1}</span>
                        <span className="text-2xl">{r.image}</span>
                        <div>
                          <div className="font-semibold">{r.name}</div>
                          <div className="text-sm text-zinc-400">
                            {CATEGORY_LABELS[r.category] || r.category} · {r.country}
                          </div>
                        </div>
                      </div>
                      <div className="text-blue-400 font-bold">{r.trustScore}★</div>
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
