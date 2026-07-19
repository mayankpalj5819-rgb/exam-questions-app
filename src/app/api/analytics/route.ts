import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// Simple in-memory cache with 5-minute TTL
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exam = searchParams.get("exam") || "jee-main";

    // Check cache first
    const cacheKey = `analytics-${exam}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // 1. Fetch all chapters with subject info for this exam type
    const chapters = await db.chapter.findMany({
      where: { examType: exam },
      include: {
        subject: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { questionCount: "desc" },
    });

    // 2. Get total question count for the exam
    const totalQuestions = await db.question.count({
      where: { exam },
    });

    if (totalQuestions === 0) {
      const emptyResult = {
        subjectStats: [],
        chapterWeightage: [],
        yearDistribution: [],
        questionTypeDistribution: [],
      };
      setCache(cacheKey, emptyResult);
      return NextResponse.json(emptyResult);
    }

    // 3. Calculate subject stats
    const subjectMap = new Map<
      string,
      {
        name: string;
        slug: string;
        questionCount: number;
        chapterCount: number;
      }
    >();

    for (const ch of chapters) {
      const existing = subjectMap.get(ch.subject.slug);
      if (existing) {
        existing.questionCount += ch.questionCount;
        existing.chapterCount += 1;
      } else {
        subjectMap.set(ch.subject.slug, {
          name: ch.subject.name,
          slug: ch.subject.slug,
          questionCount: ch.questionCount,
          chapterCount: 1,
        });
      }
    }

    const subjectStats = Array.from(subjectMap.values()).map((s) => ({
      name: s.name,
      slug: s.slug,
      questionCount: s.questionCount,
      chapterCount: s.chapterCount,
      avgPerChapter:
        s.chapterCount > 0 ? Math.round(s.questionCount / s.chapterCount) : 0,
    }));

    // 4. Build chapter weightage (percentage relative to total questions)
    const chapterWeightage = chapters.map((ch) => ({
      subject: ch.subject.name,
      subjectSlug: ch.subject.slug,
      chapter: ch.name,
      chapterSlug: ch.slug,
      questionCount: ch.questionCount,
      percentage:
        totalQuestions > 0
          ? parseFloat(((ch.questionCount / totalQuestions) * 100).toFixed(2))
          : 0,
    }));

    // Sort by weightage descending
    chapterWeightage.sort((a, b) => b.questionCount - a.questionCount);

    // 5. Year distribution - group by year and subject
    const yearSubjectGroups = await db.question.groupBy({
      by: ["year", "subjectId"],
      where: { exam, year: { not: null } },
      _count: { id: true },
    });

    // Fetch subjects for lookup
    const allSubjects = await db.subject.findMany({
      select: { id: true, name: true, slug: true },
    });
    const subjectLookup = new Map(
      allSubjects.map((s) => [s.id, { name: s.name, slug: s.slug }])
    );

    // Aggregate by year
    const yearMap = new Map<
      number,
      { physics: number; chemistry: number; mathematics: number; total: number }
    >();

    for (const group of yearSubjectGroups) {
      const year = group.year!;
      const sub = subjectLookup.get(group.subjectId);
      if (!sub) continue;

      const existing = yearMap.get(year) || {
        physics: 0,
        chemistry: 0,
        mathematics: 0,
        total: 0,
      };

      const count = group._count.id;
      const slug = sub.slug.toLowerCase();

      if (slug === "physics") existing.physics += count;
      else if (slug === "chemistry") existing.chemistry += count;
      else if (slug === "mathematics") existing.mathematics += count;

      existing.total += count;
      yearMap.set(year, existing);
    }

    const yearDistribution = Array.from(yearMap.entries())
      .map(([year, counts]) => ({
        year,
        ...counts,
      }))
      .sort((a, b) => a.year - b.year);

    // 6. Question type distribution per subject
    const typeSubjectGroups = await db.question.groupBy({
      by: ["questionType", "subjectId"],
      where: { exam },
      _count: { id: true },
    });

    const typeMap = new Map<
      string,
      { mcq: number; numerical: number; total: number }
    >();

    for (const group of typeSubjectGroups) {
      const sub = subjectLookup.get(group.subjectId);
      if (!sub) continue;

      const existing = typeMap.get(sub.slug) || {
        mcq: 0,
        numerical: 0,
        total: 0,
      };

      const count = group._count.id;
      const qType = group.questionType.toLowerCase();

      if (qType === "mcq" || qType === "multiple choice") {
        existing.mcq += count;
      } else {
        existing.numerical += count;
      }

      existing.total += count;
      typeMap.set(sub.slug, existing);
    }

    const questionTypeDistribution = Array.from(typeMap.entries()).map(
      ([slug, counts]) => {
        const sub = subjectLookup.values().find((s) => s.slug === slug);
        return {
          subject: sub?.name || slug,
          mcq: counts.mcq,
          numerical: counts.numerical,
        };
      }
    );

    const result = {
      subjectStats,
      chapterWeightage,
      yearDistribution,
      questionTypeDistribution,
    };

    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Analytics API error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}