import { MetadataRoute } from "next";
import robots from "../../public/data/robots.json";

const BASE_URL = "https://www.airobotphysical.com/robot-platform";

export default function sitemap(): MetadataRoute.Sitemap {
  // noindex 페이지(로그인·예시 화면)는 넣지 않는다 — 사이트맵은 색인 요청 목록
  const staticRoutes = [
    "",
    "/robots",
    "/forum",
    "/market",
    "/leaderboard",
    "/about",
    "/docs",
    "/pricing",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: (path === "" || path === "/forum" ? "daily" : "weekly") as
      | "daily"
      | "weekly",
    priority: path === "" ? 1 : path === "/robots" ? 0.9 : 0.7,
  }));

  const robotRoutes = (robots as { id: string }[]).map((robot) => ({
    url: `${BASE_URL}/robots/${robot.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...robotRoutes];
}
