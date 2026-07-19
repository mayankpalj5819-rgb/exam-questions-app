import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const saved = await db.savedQuestion.findMany({
      where: { userId },
      include: {
        question: {
          include: {
            subject: { select: { name: true, slug: true } },
            chapter: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by subject
    const grouped: Record<string, typeof saved> = {};
    for (const sq of saved) {
      const subj = sq.question.subject.name;
      if (!grouped[subj]) grouped[subj] = [];
      grouped[subj].push(sq);
    }

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>JEE PYQ Vault - Saved Questions</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.18.0/dist/katex.min.css">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #1a1a1a; }
    h1 { text-align: center; color: #d97706; margin-bottom: 0.5rem; }
    .date { text-align: center; color: #666; font-size: 0.875rem; margin-bottom: 2rem; }
    h2 { color: #d97706; border-bottom: 2px solid #fbbf24; padding-bottom: 0.25rem; margin-top: 2rem; }
    .question { margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; page-break-inside: avoid; }
    .q-meta { font-size: 0.8rem; color: #666; margin-bottom: 0.5rem; }
    .q-text { margin-bottom: 0.5rem; line-height: 1.6; }
    .option { padding: 0.25rem 0; }
    .correct { background: #ecfdf5; color: #065f46; padding: 0.25rem 0.5rem; border-radius: 4px; }
    .solution { background: #fffbeb; padding: 0.75rem; border-radius: 4px; margin-top: 0.5rem; font-size: 0.9rem; }
    img { max-width: 100%; height: auto; }
    @media print { body { padding: 1rem; } .question { border: 1px solid #ddd; } }
  </style>
</head>
<body>
  <h1>JEE PYQ Vault — Saved Questions</h1>
  <p class="date">Generated on ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</p>`;

    let qNum = 0;
    for (const [subject, questions] of Object.entries(grouped)) {
      html += `<h2>${subject}</h2>`;
      for (const sq of questions) {
        qNum++;
        const q = sq.question;
        let optionsHtml = "";
        if (q.options) {
          try {
            const opts = JSON.parse(q.options);
            if (Array.isArray(opts)) {
              optionsHtml = opts
                .map(
                  (opt: string, i: number) =>
                    `<div class="option">${String.fromCharCode(65 + i)}. ${opt}</div>`
                )
                .join("");
            }
          } catch {
            // ignore
          }
        }

        let answerHtml = "";
        if (q.correctAnswer) {
          answerHtml = `<div class="correct"><strong>Answer:</strong> ${q.correctAnswer}</div>`;
        }

        let solutionHtml = "";
        if (q.solution) {
          solutionHtml = `<div class="solution"><strong>Solution:</strong> ${q.solution}</div>`;
        }

        const meta = [
          q.year ? `Year: ${q.year}` : "",
          q.shift ? `Shift: ${q.shift}` : "",
          q.questionType,
          q.chapter?.name,
        ]
          .filter(Boolean)
          .join(" | ");

        html += `<div class="question">
  <div class="q-meta">Q${qNum}. ${meta}</div>
  <div class="q-text">${q.questionText}</div>
  ${q.imageUrl ? `<img src="${q.imageUrl}" alt="diagram">` : ""}
  ${optionsHtml}
  ${answerHtml}
  ${solutionHtml}
</div>`;
      }
    }

    html += `</body></html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Export PDF error:", error);
    return NextResponse.json(
      { error: "Failed to export" },
      { status: 500 }
    );
  }
}