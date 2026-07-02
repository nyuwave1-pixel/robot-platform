import { NextResponse } from "next/server";

// Mock forum posts
const POSTS = [
  {
    id: 1,
    title: "Best Robot for Beginners 2024",
    author: "robotfan",
    category: "robots",
    replies: 24,
    views: 1250,
    createdAt: "2024-07-01",
  },
  {
    id: 2,
    title: "Comparing Spot vs Go2",
    author: "techguru",
    category: "robots",
    replies: 18,
    views: 980,
    createdAt: "2024-06-30",
  },
];

export async function GET() {
  return NextResponse.json(POSTS);
}

export async function POST(request: Request) {
  const data = await request.json();
  return NextResponse.json({ success: true, id: Date.now(), ...data }, { status: 201 });
}
