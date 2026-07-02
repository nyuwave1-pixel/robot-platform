export default function About() {
  return (
    <div className="container mx-auto px-4 py-20">
      <h1 className="text-4xl font-bold mb-8">로봇플랫폼 소개</h1>
      <div className="max-w-3xl">
        <p className="text-lg text-gray-300 mb-6">
          로봇플랫폼은 Zero Budget으로 만드는 최고 품질의 로봇 개발 플랫폼입니다.
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-4">우리의 철학</h2>
        <ul className="space-y-3 text-gray-400">
          <li>✅ 완전 무료 스택 (Firebase + Vercel)</li>
          <li>✅ 최고 품질의 코드 (TypeScript + TailwindCSS)</li>
          <li>✅ 빠른 개발 (Next.js 14)</li>
          <li>✅ 쉬운 배포 (Vercel + GitHub)</li>
        </ul>
        <h2 className="text-2xl font-bold mt-8 mb-4">기술 스택</h2>
        <ul className="space-y-3 text-gray-400">
          <li>Frontend: Next.js 14, React 18, TypeScript, TailwindCSS</li>
          <li>Backend: Firebase (Realtime DB / Firestore)</li>
          <li>Auth: Firebase Authentication</li>
          <li>Hosting: Vercel (Frontend), Firebase (Backend)</li>
          <li>Version Control: GitHub</li>
        </ul>
      </div>
    </div>
  );
}
