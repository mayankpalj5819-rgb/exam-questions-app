import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");

    const where: Record<string, unknown> = { userId };

    if (subject) {
      where.question = { subject: { slug: subject } };
    }

    const saved = await db.savedQuestion.findMany({
      where,
      include: {
        question: {
          include: {
            subject: { select: { name: true, slug: true } },
            chapter: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error("Saved error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}