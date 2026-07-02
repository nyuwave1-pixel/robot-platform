"use client";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4">🤖 로봇플랫폼</h1>
        <p className="text-zinc-400 mb-8 text-lg">
          무료 개발 환경에서 구축하는 차세대 로봇 플랫폼
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="text-2xl mb-2">✓</div>
            <h3 className="font-semibold mb-2">100% 무료</h3>
            <p className="text-sm text-zinc-400">
              Vercel + Firebase Spark으로 운영 비용 $0
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold mb-2">빠른 개발</h3>
            <p className="text-sm text-zinc-400">
              Next.js + TypeScript로 생산성 극대화
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="text-2xl mb-2">📚</div>
            <h3 className="font-semibold mb-2">완전한 문서</h3>
            <p className="text-sm text-zinc-400">
              온보딩부터 배포까지 모든 가이드 준비됨
            </p>
          </div>
        </div>

        <div className="text-sm text-zinc-500">
          <p>기술 스택: Next.js 14 | Firebase | TypeScript</p>
          <p className="mt-2">문서: QUICK_START.md | ONBOARDING.md | TROUBLESHOOTING.md</p>
        </div>
      </div>
    </main>
  );
}
