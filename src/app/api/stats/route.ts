import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [total, withSolution, withAnswer] = await Promise.all([
      db.question.count(),
      db.question.count({ where: { solution: { not: null } } }),
      db.question.count({ where: { correctAnswer: { not: null } } }),
    ]);

    return NextResponse.json({ total, withSolution, withAnswer });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}