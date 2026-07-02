export default function Stats() {
  return (
    <div className="container mx-auto px-4 py-20">
      <h1 className="text-4xl font-bold mb-12">통계</h1>
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 text-center">
          <p className="text-gray-400 mb-3">총 사용자</p>
          <p className="text-4xl font-bold text-blue-400">15,234</p>
        </div>
        <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 text-center">
          <p className="text-gray-400 mb-3">로봇 목록</p>
          <p className="text-4xl font-bold text-blue-400">500+</p>
        </div>
        <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 text-center">
          <p className="text-gray-400 mb-3">포럼 포스트</p>
          <p className="text-4xl font-bold text-blue-400">8,942</p>
        </div>
        <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 text-center">
          <p className="text-gray-400 mb-3">활성 커뮤니티</p>
          <p className="text-4xl font-bold text-blue-400">24/7</p>
        </div>
      </div>
    </div>
  );
}
