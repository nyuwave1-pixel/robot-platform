import { NextResponse } from "next/server";

export async function GET() {
  // Mock data - Replace with Firebase query later
  const robots = [
    { id: 1, name: "Spot", brand: "Boston Dynamics", price: 74500 },
    { id: 2, name: "H1", brand: "Unitree", price: 90000 },
    { id: 3, name: "Go2", brand: "Unitree", price: 1600 },
  ];
  return NextResponse.json(robots);
}

export async function POST(request: Request) {
  const data = await request.json();
  return NextResponse.json({ success: true, data }, { status: 201 });
}
