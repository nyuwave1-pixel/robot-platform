import { MetadataRoute } from "next";
import robots from "../../public/data/robots.json";

const BASE_URL = "https://robot-platform-parkjong-s-projects.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/robots",
    "/forum",
    "/market",
    "/leaderboard",
    "/analytics",
    "/about",
    "/docs",
    "/pricing",
    "/blog",
    "/stats",
    "/signin",
    "/signup",
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
