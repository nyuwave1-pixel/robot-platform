"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { collection, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";

interface MarketItem {
  id: string;
  title: string;
  seller: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
}

// Firestore 접근 불가 시 폴백 데이터
const SAMPLE_LISTINGS: MarketItem[] = [
  { id: "1", title: "보안 분석 서비스", seller: "Guardian Inc.", price: 250, rating: 4.9, reviews: 1234, image: "🔒" },
  { id: "2", title: "실시간 모니터링", seller: "Monitor Labs", price: 180, rating: 4.7, reviews: 856, image: "📊" },
  { id: "3", title: "데이터 처리 엔진", seller: "Data Systems", price: 320, rating: 4.8, reviews: 1102, image: "⚙️" },
  { id: "4", title: "예측 분석 모듈", seller: "Analytics Co.", price: 420, rating: 4.6, reviews: 567, image: "🔮" },
];

type SortKey = "price" | "reviews" | "rating";

export default function Market() {
  const [listings, setListings] = useState<MarketItem[]>(SAMPLE_LISTINGS);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("reviews");

  // Firestore에서 실제 상품 로드 (실패·미설정 시 샘플 유지)
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const load = async () => {
      try {
        const snapshot = await getDocs(collection(db, "market"));
        if (snapshot.empty) return;
        const loaded = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title ?? ""),
            seller: String(data.seller ?? ""),
            price: Number(data.price ?? 0),
            rating: Number(data.rating ?? 0),
            reviews: Number(data.reviews ?? 0),
            image: String(data.image ?? "📦"),
          };
        });
        setListings(loaded);
      } catch {
        // Firestore 접근 실패 시 샘플 데이터 그대로 사용
      }
    };
    load();
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? listings.filter(
          (it) =>
            it.title.toLowerCase().includes(q) ||
            it.seller.toLowerCase().includes(q)
        )
      : listings;
    return [...filtered].sort((a, b) => {
      if (sortBy === "price") return a.price - b.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return b.reviews - a.reviews;
    });
  }, [listings, search, sortBy]);

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-500"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white"
            >
              <option value="price">가격순</option>
              <option value="reviews">인기순</option>
              <option value="rating">평점순</option>
            </select>
          </div>

          {/* 결과 수 */}
          <p className="text-zinc-500 text-sm mb-6">{visible.length}개의 상품</p>

          {/* 상품 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visible.map((item) => (
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

          {visible.length === 0 && (
            <div className="text-center py-20 text-zinc-400">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
