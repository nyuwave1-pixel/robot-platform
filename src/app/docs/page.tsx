export default function Docs() {
  return (
    <div className="container mx-auto px-4 py-20">
      <h1 className="text-4xl font-bold mb-8">개발 문서</h1>
      <div className="max-w-3xl space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">🚀 빠른 시작</h2>
          <pre className="bg-slate-800 p-4 rounded border border-slate-700 overflow-x-auto">
            <code>{`# 1. 의존성 설치
npm install

# 2. 개발 서버 시작
npm run dev

# 3. http://localhost:3000 열기`}</code>
          </pre>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">📁 프로젝트 구조</h2>
          <pre className="bg-slate-800 p-4 rounded border border-slate-700 overflow-x-auto">
            <code>{`robot-platform-dev/
├── src/
│   ├── app/          # Next.js pages
│   ├── components/   # React components
│   └── lib/          # Utilities (Firebase)
├── public/           # Static assets
└── package.json`}</code>
          </pre>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">🔧 환경 변수</h2>
          <p className="text-gray-400 mb-3">
            .env.local 파일을 생성하고 Firebase 정보를 입력하세요:
          </p>
          <pre className="bg-slate-800 p-4 rounded border border-slate-700 overflow-x-auto">
            <code>{`NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project`}</code>
          </pre>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">🚢 배포</h2>
          <p className="text-gray-400 mb-3">Vercel에 배포하기:</p>
          <pre className="bg-slate-800 p-4 rounded border border-slate-700 overflow-x-auto">
            <code>{`# Vercel CLI 설치
npm install -g vercel

# 배포
vercel`}</code>
          </pre>
        </section>
      </div>
    </div>
  );
}
