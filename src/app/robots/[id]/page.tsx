import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, MapPin, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";
import robotsData from "../../../../public/data/robots.json";

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
  url?: string;
}

const ROBOTS = robotsData as Robot[];

const CATEGORY_LABELS: Record<string, string> = {
  humanoid: "휴머노이드",
  industrial: "산업용",
  medical: "의료용",
  ai: "AI/컴패니언",
  drone: "드론",
  other: "기타",
};

// 48종 전부 빌드 시 정적 생성 → 각 로봇 페이지가 구글에 색인 가능
export function generateStaticParams() {
  return ROBOTS.map((r) => ({ id: r.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const robot = ROBOTS.find((r) => r.id === id);
  if (!robot) return { title: "로봇을 찾을 수 없습니다 | 로봇플랫폼" };
  return {
    title: `${robot.name} — ${CATEGORY_LABELS[robot.category] || robot.category} 로봇 | 로봇플랫폼`,
    description: `${robot.name}(${robot.country}, ${robot.year}): ${robot.description}`,
  };
}

export default async function RobotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const robot = ROBOTS.find((r) => r.id === id);
  if (!robot) notFound();

  const relatedRobots = ROBOTS.filter(
    (r) => r.category === robot.category && r.id !== robot.id
  ).slice(0, 3);

  // 구조화 데이터 (구글 리치 스니펫) — 사실 필드만, 허위 평점 없음
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: robot.name,
    description: robot.description,
    category: CATEGORY_LABELS[robot.category] || robot.category,
    countryOfOrigin: robot.country,
    releaseDate: String(robot.year),
    keywords: robot.technology.join(", "),
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Link
          href="/robots"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          갤러리로 돌아가기
        </Link>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        {/* Image */}
        <div className="relative h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600/20 to-cyan-600/20 flex items-center justify-center">
          <span className="text-[10rem] leading-none">{robot.image}</span>
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-5xl font-bold mb-4">{robot.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-full">
                <Star className="w-5 h-5 fill-white" />
                <span className="text-lg font-bold">{robot.trustScore} 신뢰도</span>
              </div>
              <span className="bg-white/10 px-4 py-2 rounded-full text-sm font-medium">
                {CATEGORY_LABELS[robot.category] || robot.category}
              </span>
            </div>
          </div>

          <p className="text-lg text-zinc-300 mb-8">{robot.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                <MapPin className="w-4 h-4" />
                국가
              </div>
              <p className="text-lg font-semibold">{robot.country}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                <Calendar className="w-4 h-4" />
                연도
              </div>
              <p className="text-lg font-semibold">{robot.year}</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">핵심 기술</h3>
            <div className="flex flex-wrap gap-2">
              {robot.technology.map((tech) => (
                <span
                  key={tech}
                  className="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <a
              href={
                robot.url ||
                `https://www.google.com/search?q=${encodeURIComponent(robot.name + " robot")}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-semibold transition"
            >
              <ExternalLink className="w-5 h-5" />
              {robot.url ? "공식 사이트" : "웹에서 검색"}
            </a>
          </div>
        </div>
      </section>

      {/* Related Robots */}
      {relatedRobots.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <h2 className="text-3xl font-bold mb-8">비슷한 로봇</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedRobots.map((r) => (
              <Link key={r.id} href={`/robots/${r.id}`}>
                <div className="group bg-white/5 border border-white/10 hover:border-blue-500/50 rounded-2xl overflow-hidden transition hover:-translate-y-2 duration-200">
                  <div className="h-32 flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-cyan-600/20">
                    <span className="text-5xl group-hover:scale-110 transition-transform">
                      {r.image}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 group-hover:text-blue-400 transition">
                      {r.name}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2">{r.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
