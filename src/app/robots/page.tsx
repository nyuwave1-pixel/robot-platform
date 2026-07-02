"use client";

import Navbar from "@/components/Navbar";

export default function Robots() {
  const robots = [
    { id: 1, name: "Sentinel-1", type: "보안", status: "활성", score: 4.9 },
    { id: 2, name: "Nexus-2", type: "분석", status: "활성", score: 4.7 },
    { id: 3, name: "Guardian-3", type: "모니터링", status: "대기중", score: 4.5 },
    { id: 4, name: "Analyzer-4", type: "데이터", status: "활성", score: 4.8 },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#060608] text-white pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* 헤더 */}
          <div className="mb-12 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">🤖 로봇 목록</h1>
              <p className="text-zinc-400">플랫폼에 등록된 모든 로봇을 관리하세요</p>
            </div>
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition">
              새 로봇 추가
            </button>
          </div>

          {/* 필터 */}
          <div className="flex gap-4 mb-8 flex-wrap">
            <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white">
              <option>모든 상태</option>
              <option>활성</option>
              <option>대기중</option>
            </select>
            <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white">
              <option>모든 타입</option>
              <option>보안</option>
              <option>분석</option>
              <option>모니터링</option>
            </select>
          </div>

          {/* 로봇 목록 */}
          <div className="space-y-4">
            {robots.map((robot) => (
              <div
                key={robot.id}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.08] transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <h3 className="font-bold text-lg">{robot.name}</h3>
                      <p className="text-sm text-zinc-400">{robot.type}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-sm text-zinc-400">상태</div>
                    <span
                      className={`text-sm font-semibold ${
                        robot.status === "활성" ? "text-green-400" : "text-yellow-400"
                      }`}
                    >
                      {robot.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-zinc-400">점수</div>
                    <div className="font-bold">{robot.score}★</div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                    상세보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
