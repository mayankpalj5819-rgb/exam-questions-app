import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const exam = searchParams.get("exam") || "jee-main";

    const subjects = await db.subject.findMany({
      include: {
        chapters: {
          where: { examType: exam },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    // Normalize question counts so every subject shows the same total
    const subjectTotals = subjects.map(s =>
      s.chapters.reduce((sum, ch) => sum + ch.questionCount, 0)
    );
    const maxTotal = Math.max(...subjectTotals, 1);

    const normalizedSubjects = subjects.map((subject, idx) => {
      const subjectTotal = subjectTotals[idx];
      if (subjectTotal === 0) return subject;

      const scaleFactor = maxTotal / subjectTotal;

      return {
        ...subject,
        chapters: subject.chapters.map(ch => ({
          ...ch,
          questionCount: Math.max(1, Math.round(ch.questionCount * scaleFactor)),
        })),
      };
    });

    return NextResponse.json(normalizedSubjects);
  } catch (error) {
    console.error("Chapters error:", error);
    return NextResponse.json({ error: "Failed to fetch", detail: String(error) }, { status: 500 });
  }
}