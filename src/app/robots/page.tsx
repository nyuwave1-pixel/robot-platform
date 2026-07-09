import type { Metadata } from "next";
import RobotsClient from "./RobotsClient";
import robotsData from "../../../public/data/robots.json";

export const metadata: Metadata = {
  title: "로봇 갤러리 — 48종 로봇 탐색",
  description:
    "휴머노이드·산업용·의료용·드론 등 세계 48종의 실제 로봇을 검색·카테고리·기술·신뢰도로 탐색하고 비교하세요.",
};

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

export default function RobotsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-20">
      <RobotsClient robots={robotsData as Robot[]} />
    </main>
  );
}
