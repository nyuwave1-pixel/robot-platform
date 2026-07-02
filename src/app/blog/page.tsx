import Link from "next/link";
import Card from "@/components/Card";

export default function Blog() {
  const posts = [
    { slug: "robot-2024", title: "2024 로봇 시장 전망", date: "2024-07-01", excerpt: "올해의 로봇 기술 트렌드" },
    { slug: "spot-review", title: "Spot 완전 리뷰", date: "2024-06-28", excerpt: "Boston Dynamics Spot 상세 분석" },
    { slug: "getting-started", title: "로봇 개발 시작하기", date: "2024-06-25", excerpt: "초보자를 위한 가이드" },
  ];

  return (
    <div className="container mx-auto px-4 py-20">
      <h1 className="text-4xl font-bold mb-12">블로그</h1>
      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.slug}>
            <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
            <p className="text-gray-400 mb-3">{post.excerpt}</p>
            <p className="text-sm text-gray-500">{post.date}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
