"use client";

import Navbar from "@/components/Navbar";

export default function Market() {
  const listings = [
    {
      id: 1,
      title: "보안 분석 서비스",
      seller: "Guardian Inc.",
      price: 250,
      rating: 4.9,
      reviews: 1234,
      image: "🔒",
    },
    {
      id: 2,
      title: "실시간 모니터링",
      seller: "Monitor Labs",
      price: 180,
      rating: 4.7,
      reviews: 856,
      image: "📊",
    },
    {
      id: 3,
      title: "데이터 처리 엔진",
      seller: "Data Systems",
      price: 320,
      rating: 4.8,
      reviews: 1102,
      image: "⚙️",
    },
    {
      id: 4,
      title: "예측 분석 모듈",
      seller: "Analytics Co.",
      price: 420,
      rating: 4.6,
      reviews: 567,
      image: "🔮",
    },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#060608] text-white pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* 헤더 */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">🛒 마켓플레이스</h1>
            <p className="text-zinc-400">로봇 서비스와 도구를 거래하세요</p>
          </div>

          {/* 검색 & 필터 */}
          <div className="mb-8 flex gap-4">
            <input
              type="text"
              placeholder="서비스 검색..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-500"
            />
            <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white">
              <option>가격순</option>
              <option>인기순</option>
              <option>평점순</option>
            </select>
          </div>

          {/* 상품 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition cursor-pointer"
              >
                {/* 이미지 영역 */}
                <div className="bg-white/5 h-32 flex items-center justify-center text-4xl">
                  {item.image}
                </div>

                {/* 정보 */}
                <div className="p-4">
                  <h3 className="font-bold mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-zinc-400 mb-3">{item.seller}</p>

                  {/* 평점 */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-yellow-400">{item.rating}★</span>
                    <span className="text-xs text-zinc-400">({item.reviews})</span>
                  </div>

                  {/* 가격과 버튼 */}
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-blue-400">${item.price}</div>
                    <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition">
                      구매
                    </button>
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
