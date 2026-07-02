import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const user = {
    id,
    name: "User " + id,
    email: `user${id}@example.com`,
    rpPoints: Math.floor(Math.random() * 10000),
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + id,
  };

  return NextResponse.json(user);
}
