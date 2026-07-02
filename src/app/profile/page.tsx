"use client";

import Navbar from "@/components/Navbar";

export default function Profile() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#060608] text-white pt-20 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* 프로필 헤더 */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-4xl">
                👤
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">사용자 이름</h1>
                <p className="text-zinc-400 mb-4">가입일: 2024년 1월 15일</p>
                <div className="flex gap-6">
                  <div>
                    <div className="text-sm text-zinc-400">RP 잔액</div>
                    <div className="text-2xl font-bold text-blue-400">1,234 RP</div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-400">평점</div>
                    <div className="text-2xl font-bold">4.9★</div>
                  </div>
                </div>
              </div>
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg">
                프로필 수정
              </button>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex gap-4 mb-8 border-b border-white/10">
            <button className="px-4 py-3 border-b-2 border-blue-600 font-semibold">거래 내역</button>
            <button className="px-4 py-3 text-zinc-400 hover:text-white">내 상품</button>
            <button className="px-4 py-3 text-zinc-400 hover:text-white">찜한 상품</button>
            <button className="px-4 py-3 text-zinc-400 hover:text-white">설정</button>
          </div>

          {/* 거래 내역 */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold mb-1">거래 #{i}</h3>
                    <p className="text-sm text-zinc-400">2024년 7월 {i}일</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{250 + i * 50} RP</div>
                    <div className="text-sm text-green-400">완료</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
