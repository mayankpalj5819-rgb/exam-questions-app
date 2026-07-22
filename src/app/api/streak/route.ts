import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const streaks = await db.streak.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      take: 30,
    });

    const dateSet = new Set(streaks.map((s) => s.date));

    let currentStreak = 0;
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

    // Last 30 days activity
    const activity: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const streak = streaks.find((s) => s.date === ds);
      activity[ds] = streak?.count || 0;
    }

    return NextResponse.json({ currentStreak, activity });
  } catch (err) {
    console.error("Streak error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}