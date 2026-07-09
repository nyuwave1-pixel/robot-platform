import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AdSlot from "@/components/AdSlot";
import robotsData from "../../public/data/robots.json";

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

export const metadata: Metadata = {
  // title은 layout의 default 사용 (중복 접미사 방지)
  description:
    "휴머노이드·산업·의료·드론 등 48종의 실제 로봇을 탐색하고 비교하는 로봇 정보 플랫폼.",
};

export default function Home() {
  const robots = robotsData as Robot[];
  const total = robots.length;
  const countries = new Set(robots.map((r) => r.country)).size;
  const categories = new Set(robots.map((r) => r.category)).size;
  const featured = [...robots].sort((a, b) => b.trustScore - a.trustScore).slice(0, 6);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#060608] text-white">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 pt-24 pb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            세계의 로봇을 한 곳에서
          </h1>
          <p className="text-xl text-zinc-300 mb-4">
            휴머노이드부터 산업·의료·드론까지 — 최신 로봇 기술을 탐색하고 비교하세요
          </p>

          {/* 실제 통계 칩 (서버 렌더) */}
          <div className="flex flex-wrap gap-4 justify-center my-8">
            <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4">
              <div className="text-3xl font-bold text-blue-400">{total}</div>
              <div className="text-xs text-zinc-500">등록 로봇</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4">
              <div className="text-3xl font-bold text-cyan-400">{categories}</div>
              <div className="text-xs text-zinc-500">카테고리</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4">
              <div className="text-3xl font-bold text-emerald-400">{countries}</div>
              <div className="text-xs text-zinc-500">제조 국가</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/robots"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
            >
              로봇 갤러리 탐색
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-3 border border-white/20 hover:border-white/40 rounded-lg font-semibold transition"
            >
              통계 대시보드
            </Link>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4">
          <AdSlot variant="banner" className="mb-16" />
        </div>

        {/* 주목받는 로봇 (서버 렌더) */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-3xl font-bold">주목받는 로봇</h2>
            <Link href="/robots" className="text-blue-400 hover:text-blue-300 text-sm">
              전체 보기 →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((r) => (
              <Link key={r.id} href={`/robots/${r.id}`}>
                <div className="group bg-white/5 border border-white/10 hover:border-blue-500/50 rounded-2xl overflow-hidden transition h-full">
                  <div className="h-32 flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-cyan-600/20 text-5xl">
                    {r.image}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold group-hover:text-blue-400 transition">{r.name}</h3>
                      <span className="text-sm text-yellow-500 shrink-0">{r.trustScore}★</span>
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{r.description}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span>{r.country}</span>
                      <span>·</span>
                      <span>{r.year}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-4 pb-24">
          <div className="bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-white/10 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">지금 탐색을 시작하세요</h2>
            <p className="text-zinc-400 mb-6">검색·필터·정렬로 원하는 로봇을 빠르게 찾아보세요.</p>
            <Link
              href="/robots"
              className="inline-block px-8 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold transition"
            >
              로봇 갤러리 열기
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
