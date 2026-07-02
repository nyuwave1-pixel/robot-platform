"use client";

import Navbar from "@/components/Navbar";

export default function Dashboard() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#060608] text-white pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* 헤더 */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">📊 대시보드</h1>
            <p className="text-zinc-400">로봇 플랫폼의 핵심 지표를 한눈에 봅시다</p>
          </div>

          {/* KPI 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-sm text-zinc-400 mb-2">활성 로봇</div>
              <div className="text-3xl font-bold">1,234</div>
              <div className="text-xs text-green-400 mt-2">↑ 12% 증가</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-sm text-zinc-400 mb-2">총 거래량</div>
              <div className="text-3xl font-bold">$45.2K</div>
              <div className="text-xs text-green-400 mt-2">↑ 8% 증가</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-sm text-zinc-400 mb-2">활성 사용자</div>
              <div className="text-3xl font-bold">5,678</div>
              <div className="text-xs text-green-400 mt-2">↑ 15% 증가</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-sm text-zinc-400 mb-2">평균 점수</div>
              <div className="text-3xl font-bold">4.8★</div>
              <div className="text-xs text-blue-400 mt-2">↑ 0.2 증가</div>
            </div>
          </div>

          {/* 최근 활동 */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">최근 활동</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between pb-4 border-b border-white/5 last:border-0">
                  <div>
                    <div className="font-semibold">로봇 #{i}이 새로운 작업을 완료했습니다</div>
                    <div className="text-sm text-zinc-400">몇 분 전</div>
                  </div>
                  <div className="text-green-400">+$100</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
