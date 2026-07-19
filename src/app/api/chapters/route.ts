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

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Chapters error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}