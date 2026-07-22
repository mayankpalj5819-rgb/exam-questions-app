import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    // Get year-wise question counts grouped by subject
    const yearData = await db.$queryRaw<
      {
        year: number;
        subject: string;
        count: bigint;
      }[]
    >(Prisma.sql`
      SELECT 
        q."year",
        s.slug as subject,
        COUNT(*) as count
      FROM "Question" q
      JOIN "Subject" s ON q."subjectId" = s.id
      WHERE q."year" IS NOT NULL
      GROUP BY q."year", s.slug
      ORDER BY q."year" ASC, s.slug ASC
    `);

    // Get MCQ vs Numerical distribution
    const typeDistribution = await db.$queryRaw<
      {
        questionType: string;
        count: bigint;
      }[]
    >(Prisma.sql`
      SELECT "questionType", COUNT(*) as count
      FROM "Question"
      GROUP BY "questionType"
    `);

    // Get top 10 chapters by question count
    const topChapters = await db.$queryRaw<
      {
        chapterName: string;
        subjectSlug: string;
        count: bigint;
      }[]
    >(Prisma.sql`
      SELECT 
        c.name as "chapterName",
        s.slug as "subjectSlug",
        COUNT(q.id) as count
      FROM "Question" q
      JOIN "Chapter" c ON q."chapterId" = c.id
      JOIN "Subject" s ON q."subjectId" = s.id
      WHERE q."chapterId" IS NOT NULL
      GROUP BY c.name, s.slug
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get subject-wise total question counts
    const subjectTotals = await db.$queryRaw<
      {
        subject: string;
        total: bigint;
      }[]
    >(Prisma.sql`
      SELECT 
        s.slug as subject,
        COUNT(q.id) as total
      FROM "Question" q
      JOIN "Subject" s ON q."subjectId" = s.id
      GROUP BY s.slug
    `);

    // Transform year data into the expected format
    const yearMap = new Map<number, { physics: number; chemistry: number; mathematics: number; total: number }>();

    for (const row of yearData) {
      const year = row.year;
      if (!yearMap.has(year)) {
        yearMap.set(year, { physics: 0, chemistry: 0, mathematics: 0, total: 0 });
      }
      const entry = yearMap.get(year)!;
      const count = Number(row.count);
      if (row.subject === "physics") entry.physics = count;
      else if (row.subject === "chemistry") entry.chemistry = count;
      else if (row.subject === "mathematics") entry.mathematics = count;
      entry.total += count;
    }

    const years = Array.from(yearMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, data]) => ({ year, ...data }));

    // Transform type distribution
    const typeMap: Record<string, number> = {};
    let totalQuestions = 0;
    for (const row of typeDistribution) {
      const count = Number(row.count);
      typeMap[row.questionType] = count;
      totalQuestions += count;
    }

    // Transform top chapters
    const chapters = topChapters.map((row) => ({
      chapter: row.chapterName,
      subject: row.subjectSlug,
      count: Number(row.count),
    }));

    // Transform subject totals
    const subjectCounts: Record<string, number> = {};
    for (const row of subjectTotals) {
      subjectCounts[row.subject] = Number(row.total);
    }

    return NextResponse.json({
      years,
      typeDistribution: typeMap,
      typeTotal: totalQuestions,
      topChapters: chapters,
      subjectCounts,
    });
  } catch (error) {
    console.error("Year distribution error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}