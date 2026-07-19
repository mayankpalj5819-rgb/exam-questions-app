import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const exam = searchParams.get("exam") || "jee-main";
    const limitParam = parseInt(searchParams.get("limit") || "10");
    const limit = Math.min(Math.max(limitParam, 1), 50);

    if (!q.trim()) {
      return NextResponse.json({ results: [], total: 0 });
    }

    const where = {
      exam,
      questionText: { contains: q.trim() },
    };

    const [results, total] = await Promise.all([
      db.question.findMany({
        where,
        select: {
          id: true,
          questionText: true,
          year: true,
          questionType: true,
          subject: { select: { name: true, slug: true } },
          chapter: { select: { name: true, slug: true } },
        },
        orderBy: { year: "desc" },
        take: limit,
      }),
      db.question.count({ where }),
    ]);

    return NextResponse.json({ results, total });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}