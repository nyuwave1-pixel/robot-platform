import Button from "@/components/Button";
import Card from "@/components/Card";

export default function Pricing() {
  return (
    <div className="container mx-auto px-4 py-20">
      <h1 className="text-4xl font-bold mb-4 text-center">가격 정책</h1>
      <p className="text-gray-400 text-center mb-12">모든 기능이 완전히 무료입니다</p>
      <div className="grid md:grid-cols-3 gap-8">
        <Card>
          <h3 className="text-2xl font-bold mb-4">기본</h3>
          <p className="text-3xl font-bold text-blue-400 mb-6">무료</p>
          <ul className="space-y-3 mb-6 text-gray-300">
            <li>✓ 로봇 갤러리</li>
            <li>✓ 커뮤니티 포럼</li>
          </ul>
          <Button>시작하기</Button>
        </Card>
        <Card>
          <h3 className="text-2xl font-bold mb-4">프리미엄</h3>
          <p className="text-3xl font-bold text-blue-400 mb-6">무료</p>
          <ul className="space-y-3 mb-6 text-gray-300">
            <li>✓ 기본 기능</li>
            <li>✓ RP Points 보너스</li>
            <li>✓ 우선 지원</li>
          </ul>
          <Button>시작하기</Button>
        </Card>
        <Card>
          <h3 className="text-2xl font-bold mb-4">엔터프라이즈</h3>
          <p className="text-3xl font-bold text-blue-400 mb-6">무료</p>
          <ul className="space-y-3 mb-6 text-gray-300">
            <li>✓ 프리미엄 기능</li>
            <li>✓ API 접근</li>
            <li>✓ 맞춤 지원</li>
          </ul>
          <Button>시작하기</Button>
        </Card>
      </div>
    </div>
  );
}
