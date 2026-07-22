import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject");
  const exam = searchParams.get("exam") || "jee-main";
  const chapterId = searchParams.get("chapterId");
  const type = searchParams.get("type");

  try {
    const where: Record<string, unknown> = { exam };
    if (subject) {
      const sub = await db.subject.findUnique({ where: { slug: subject } });
      if (sub) where.subjectId = sub.id;
    }
    if (chapterId) where.chapterId = chapterId;
    if (type) where.questionType = type;

    const total = await db.question.count({ where });
    if (total === 0) {
      return NextResponse.json({ error: "No questions found" }, { status: 404 });
    }

    const skip = Math.floor(Math.random() * total);
    const question = await db.question.findFirst({
      where,
      skip,
      include: {
        subject: { select: { name: true, slug: true } },
        chapter: { select: { name: true, slug: true } },
      },
    });

    if (!question) {
      return NextResponse.json({ error: "No question found" }, { status: 404 });
    }

    return NextResponse.json({ question });
  } catch (err) {
    console.error("Random question error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
