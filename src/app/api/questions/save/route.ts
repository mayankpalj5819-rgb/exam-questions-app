import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { questionId, notes } = await req.json();

    if (!questionId) {
      return NextResponse.json({ error: "questionId required" }, { status: 400 });
    }

    const saved = await db.savedQuestion.upsert({
      where: {
        userId_questionId: { userId, questionId },
      },
      create: { userId, questionId, notes },
      update: notes !== undefined ? { notes } : {},
      include: {
        question: {
          select: { id: true, questionText: true, year: true, exam: true, questionType: true },
        },
      },
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json({ error: "questionId required" }, { status: 400 });
    }

    await db.savedQuestion.deleteMany({
      where: { userId, questionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unsave error:", error);
    return NextResponse.json({ error: "Failed to unsave" }, { status: 500 });
  }
}