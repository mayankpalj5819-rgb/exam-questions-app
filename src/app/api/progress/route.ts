import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST: Record an answer
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { questionId, userAnswer, isCorrect, timeTaken } = body;

  if (!questionId) {
    return NextResponse.json({ error: "questionId required" }, { status: 400 });
  }

  try {
    const answer = await db.userAnswer.upsert({
      where: { userId_questionId: { userId: session.user.id, questionId } },
      update: { userAnswer, isCorrect, timeTaken, createdAt: new Date() },
      create: { userId: session.user.id, questionId, userAnswer, isCorrect, timeTaken },
    });

    // Update streak
    const today = new Date().toISOString().split("T")[0];
    await db.streak.upsert({
      where: { userId_date: { userId: session.user.id, date: today } },
      update: { count: { increment: 1 } },
      create: { userId: session.user.id, date: today, count: 1 },
    });

    return NextResponse.json({ success: true, answer });
  } catch (err) {
    console.error("Failed to record answer:", err);
    return NextResponse.json({ error: "Failed to record" }, { status: 500 });
  }
}

// GET: Fetch user progress stats
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const totalAnswered = await db.userAnswer.count({
      where: { userId: session.user.id },
    });

    const correctAnswers = await db.userAnswer.count({
      where: { userId: session.user.id, isCorrect: true },
    });

    const incorrectAnswers = await db.userAnswer.count({
      where: { userId: session.user.id, isCorrect: false },
    });

    // Chapter-level progress
    const chapterProgress = await db.userAnswer.groupBy({
      by: ["questionId"],
      where: { userId: session.user.id },
    });

    // Get streak info
    const today = new Date().toISOString().split("T")[0];
    const streaks = await db.streak.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
    });

    let currentStreak = 0;
    const dateSet = new Set(streaks.map((s) => s.date));

    // Calculate current streak from today backwards
    const checkDate = new Date();
    while (true) {
      const ds = checkDate.toISOString().split("T")[0];
      if (dateSet.has(ds)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const longestStreak = streaks.length > 0 ? Math.max(...streaks.map((s) => s.count)) : 0;

    // Subject-level stats
    const answersWithQuestion = await db.userAnswer.findMany({
      where: { userId: session.user.id },
      include: { question: { include: { subject: true, chapter: true } } },
    });

    const subjectStats: Record<string, { total: number; correct: number; chapters: Set<string> }> = {};
    for (const a of answersWithQuestion) {
      const slug = a.question.subject?.slug || "unknown";
      if (!subjectStats[slug]) {
        subjectStats[slug] = { total: 0, correct: 0, chapters: new Set() };
      }
      subjectStats[slug].total++;
      if (a.isCorrect) subjectStats[slug].correct++;
      if (a.question.chapterId) subjectStats[slug].chapters.add(a.question.chapterId);
    }

    const subjectBreakdown = Object.entries(subjectStats).map(([slug, stats]) => ({
      subject: slug,
      total: stats.total,
      correct: stats.correct,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      chaptersAttempted: stats.chapters.size,
    }));

    // Recent answers (last 20)
    const recentAnswers = await db.userAnswer.findMany({
      where: { userId: session.user.id },
      include: { question: { include: { subject: true, chapter: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      totalAnswered,
      correctAnswers,
      incorrectAnswers,
      accuracy: totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0,
      currentStreak,
      longestStreak,
      subjectBreakdown,
      recentAnswers: recentAnswers.map((a) => ({
        id: a.id,
        questionId: a.questionId,
        questionText: a.question.questionText?.slice(0, 150),
        userAnswer: a.userAnswer,
        isCorrect: a.isCorrect,
        timeTaken: a.timeTaken,
        createdAt: a.createdAt,
        subject: a.question.subject?.name,
        chapter: a.question.chapter?.name,
        questionType: a.question.questionType,
        year: a.question.year,
      })),
    });
  } catch (err) {
    console.error("Failed to fetch progress:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}