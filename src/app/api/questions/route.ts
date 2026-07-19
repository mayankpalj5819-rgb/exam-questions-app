import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chapterId = searchParams.get("chapterId");
    const subjectSlug = searchParams.get("subject");
    const exam = searchParams.get("exam") || "jee-main";
    const year = searchParams.get("year");
    const type = searchParams.get("type");
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!chapterId && !subjectSlug) {
      return NextResponse.json(
        { error: "chapterId or subject is required" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { exam };

    if (chapterId) {
      where.chapterId = chapterId;
    }

    if (subjectSlug) {
      const subject = await db.subject.findUnique({
        where: { slug: subjectSlug },
      });
      if (subject) where.subjectId = subject.id;
    }

    if (year) {
      where.year = parseInt(year);
    }

    if (type) {
      where.questionType = type;
    }

    // Build orderBy based on sort parameter
    let orderBy: Prisma.QuestionOrderByWithRelationInput[];
    if (sort === "oldest") {
      orderBy = [{ year: "asc" }, { sourceOrder: "asc" }];
    } else {
      orderBy = [{ year: "desc" }, { sourceOrder: "asc" }];
    }

    const [questions, total] = await Promise.all([
      db.question.findMany({
        where,
        include: {
          subject: { select: { name: true, slug: true } },
          chapter: { select: { name: true, slug: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.question.count({ where }),
    ]);

    return NextResponse.json({ questions, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Questions error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}