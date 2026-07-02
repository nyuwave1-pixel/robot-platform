import Link from "next/link";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-20">
      <section className="text-center mb-20">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          🤖 로봇플랫폼
        </h1>
        <p className="text-2xl text-gray-300 mb-4">
          Zero Budget으로 만드는 최고 품질의 로봇 플랫폼
        </p>
        <p className="text-lg text-gray-400 mb-8">
          Firebase + Vercel + Next.js = $0/월
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/about"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
          >
            시작하기
          </Link>
          <Link
            href="/docs"
            className="px-8 py-3 border border-gray-500 hover:border-gray-300 rounded-lg font-semibold transition"
          >
            문서 보기
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 mb-20">
        <div className="bg-slate-800 p-8 rounded-lg border border-slate-700">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-xl font-bold mb-3">빠른 개발</h3>
          <p className="text-gray-400">
            Next.js 14 + React 18로 빠르고 효율적인 개발
          </p>
        </div>
        <div className="bg-slate-800 p-8 rounded-lg border border-slate-700">
          <div className="text-4xl mb-4">💰</div>
          <h3 className="text-xl font-bold mb-3">완전 무료</h3>
          <p className="text-gray-400">
            Firebase Spark + Vercel 무료 호스팅. 월 $0
          </p>
        </div>
        <div className="bg-slate-800 p-8 rounded-lg border border-slate-700">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-xl font-bold mb-3">쉬운 배포</h3>
          <p className="text-gray-400">
            Git push 한 번으로 Vercel에 자동 배포
          </p>
        </div>
      </section>

      <section className="bg-slate-800 p-12 rounded-lg border border-slate-700 text-center">
        <h2 className="text-3xl font-bold mb-4">준비되셨나요?</h2>
        <p className="text-gray-400 mb-6">
          지금 바로 로봇플랫폼 개발을 시작하세요.
        </p>
        <Link
          href="/docs"
          className="inline-block px-8 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold transition"
        >
          개발 가이드 보기
        </Link>
      </section>
    </main>
  );
}
