import { db } from "@/lib/firebase";
import { doc, updateDoc, increment, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, reason } = body;
    if (!userId || !amount || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { rpBalance: increment(amount) });
    await addDoc(collection(db, "rpTransactions"), {
      userId, amount, reason, timestamp: new Date(), type: amount > 0 ? "earn" : "spend",
    });
    return NextResponse.json({ success: true, message: "RP updated", amount, reason });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }
    const q = query(collection(db, "rpTransactions"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ transactions, count: transactions.length });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
