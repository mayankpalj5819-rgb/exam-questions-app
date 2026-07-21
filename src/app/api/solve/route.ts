import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// In-memory cache: questionId → { solution, timestamp }
const solutionCache = new Map<string, { solution: string; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;
const TIMEOUT_MS = 45_000;

let zaiInstance: Awaited<ReturnType<typeof import("z-ai-web-dev-sdk").default.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      zaiInstance = await ZAI.create();
    } catch {
      return null;
    }
  }
  return zaiInstance;
}

function pruneCache() {
  if (solutionCache.size > MAX_CACHE_SIZE) {
    const keys = [...solutionCache.keys()];
    for (let i = 0; i < 50 && i < keys.length; i++) {
      solutionCache.delete(keys[i]);
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms / 1000}s`)), ms),
    ),
  ]);
}

function normalizeLatex(text: string): string {
  return text.replace(/\\n/g, "\n").trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, questionText, questionType, correctAnswer } = body as {
      questionId?: string;
      questionText?: string;
      questionType?: string;
      correctAnswer?: string;
    };

    if (!questionId || !questionText) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check DB first — maybe solution was added since page load
    if (questionId) {
      try {
        const q = await db.question.findUnique({ where: { id: questionId }, select: { solution: true } });
        if (q?.solution) {
          return NextResponse.json({ success: true, solution: q.solution, source: "database" });
        }
      } catch { /* ignore DB errors */ }
    }

    // 2. Check in-memory cache
    pruneCache();
    const cached = solutionCache.get(questionId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ success: true, solution: cached.solution, source: "cache" });
    }

    // 3. Try LLM
    const zai = await getZAI();
    if (zai) {
      try {
        const normalizedQ = normalizeLatex(questionText);
        const typeHint = questionType === "MCQ"
          ? `This is a multiple choice question. The correct answer is ${correctAnswer || "unknown"}.`
          : questionType === "Numerical"
            ? `This is a numerical type question. The correct answer is ${correctAnswer || "unknown"}. Provide a step-by-step solution.`
            : "Provide a step-by-step solution.";

        const systemPrompt = `You are an expert JEE (Joint Entrance Examination) tutor. Solve the given JEE physics/chemistry/mathematics question with clear step-by-step explanation. Use LaTeX notation for mathematical expressions (wrap in $ for inline, $$ for display). Be concise but thorough. The answer should end with a clear conclusion.`;

        const userMessage = `${typeHint}\n\nQuestion:\n${normalizedQ}`;

        const completion = await withTimeout(
          zai.chat.completions.create({
            messages: [
              { role: "assistant", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            thinking: { type: "disabled" },
          }),
          TIMEOUT_MS,
        );

        const solution = completion.choices[0]?.message?.content;
        if (solution && solution.trim().length > 20) {
          // Cache it
          solutionCache.set(questionId, { solution: solution.trim(), timestamp: Date.now() });

          // Also save to DB for future use
          try {
            await db.question.update({
              where: { id: questionId },
              data: { solution: solution.trim() },
            });
          } catch { /* ignore DB write errors */ }

          return NextResponse.json({ success: true, solution: solution.trim(), source: "ai" });
        }
      } catch (llmErr) {
        console.error("[/api/solve] LLM failed:", llmErr instanceof Error ? llmErr.message : llmErr);
      }
    }

    // 4. LLM not available (production/Render) — return graceful message
    return NextResponse.json({
      success: false,
      error: "AI solver is not available on this deployment. Solutions are being added regularly — check back later or search the web for this question.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/solve] Error:", message);
    return NextResponse.json(
      { success: false, error: "Failed to generate solution. Please try again later." },
      { status: 500 },
    );
  }
}