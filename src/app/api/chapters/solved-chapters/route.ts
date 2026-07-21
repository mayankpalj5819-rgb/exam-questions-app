import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const chapters = await db.question.groupBy({
      by: ["chapterId"],
      where: {
        chapterId: { not: null },
        solution: { not: null },
      },
    });

    const solvedChapterIds = new Set(
      chapters.map((c) => c.chapterId).filter(Boolean)
    );

    return NextResponse.json({ solvedChapterIds: [...solvedChapterIds] });
  } catch (error) {
    console.error("Solved chapters error:", error);
    return NextResponse.json({ solvedChapterIds: [] });
  }
}