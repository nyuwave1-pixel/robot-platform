"use client";

import Navbar from "@/components/Navbar";

export default function Analytics() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#060608] text-white pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* 헤더 */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">📈 분석</h1>
            <p className="text-zinc-400">플랫폼 전체 분석 및 통계</p>
          </div>

          {/* 기간 선택 */}
          <div className="mb-8 flex gap-4">
            <button className="px-4 py-2 bg-blue-600 rounded-lg text-sm">1주</button>
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm">1개월</button>
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm">3개월</button>
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm">1년</button>
          </div>

          {/* 차트 영역 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="font-bold mb-4">거래량 추이</h2>
              <div className="h-64 bg-white/[0.02] rounded-lg flex items-center justify-center text-zinc-500">
                📊 차트 영역 (Chart.js 또는 Recharts 추가 가능)
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="font-bold mb-4">사용자 증가</h2>
              <div className="h-64 bg-white/[0.02] rounded-lg flex items-center justify-center text-zinc-500">
                📈 차트 영역 (Chart.js 또는 Recharts 추가 가능)
              </div>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-sm text-zinc-400 mb-2">일일 거래량</div>
              <div className="text-3xl font-bold mb-2">$12.3K</div>
              <div className="text-xs text-green-400">↑ 23% 증가</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-sm text-zinc-400 mb-2">주간 신규 사용자</div>
              <div className="text-3xl font-bold mb-2">456</div>
              <div className="text-xs text-green-400">↑ 18% 증가</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-sm text-zinc-400 mb-2">평균 거래 금액</div>
              <div className="text-3xl font-bold mb-2">$287</div>
              <div className="text-xs text-green-400">↑ 12% 증가</div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
