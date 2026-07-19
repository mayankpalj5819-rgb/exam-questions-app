import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// In-memory cache: questionId → solution text
const solutionCache = new Map<string, string>();

// Reusable ZAI instance
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

const SYSTEM_PROMPT =
  "You are a JEE exam expert. Provide a clear, step-by-step solution to this JEE question. Use LaTeX formatting with $...$ for inline math and $$...$$ for display math. Be concise but thorough.";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Periodically prune stale cache entries (every 10 min)
let lastPrune = Date.now();
function pruneCache() {
  const now = Date.now();
  if (now - lastPrune > 10 * 60 * 1000) {
    lastPrune = now;
    for (const [key, _val] of solutionCache) {
      // We only store the solution string, so we evict on a simple size cap instead
      if (solutionCache.size > 500) {
        // Delete oldest entries (first inserted)
        const firstKey = solutionCache.keys().next().value;
        if (firstKey !== undefined) solutionCache.delete(firstKey);
      } else {
        break;
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, questionText } = body as {
      questionId?: string;
      questionText?: string;
    };

    if (!questionId || !questionText || typeof questionText !== "string") {
      return NextResponse.json(
        { error: "questionId and questionText are required" },
        { status: 400 }
      );
    }

    if (questionText.trim().length === 0) {
      return NextResponse.json(
        { error: "questionText must not be empty" },
        { status: 400 }
      );
    }

    // Check cache
    pruneCache();
    const cached = solutionCache.get(questionId);
    if (cached) {
      return NextResponse.json({ solution: cached });
    }

    const zai = await getZAI();

    // Build prompt
    const userMessage = `${SYSTEM_PROMPT}\n\nQuestion: ${questionText}`;

    // Call LLM with 30s timeout
    const solution = await Promise.race([
      zai.chat.completions.create({
        messages: [
          {
            role: "assistant",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: questionText,
          },
        ],
        thinking: { type: "disabled" },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("AI generation timed out (30s)")),
          30_000
        )
      ),
    ]);

    const responseText = solution.choices[0]?.message?.content;

    if (!responseText || responseText.trim().length === 0) {
      return NextResponse.json(
        { error: "AI returned an empty response" },
        { status: 502 }
      );
    }

    // Store in cache
    solutionCache.set(questionId, responseText.trim());

    return NextResponse.json({ solution: responseText.trim() });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Handle timeout specifically
    if (message.includes("timed out")) {
      return NextResponse.json(
        { error: "AI generation timed out. Please try again." },
        { status: 504 }
      );
    }

    console.error("[/api/solve] Error:", message);
    return NextResponse.json(
      { error: "Failed to generate solution. Please try again." },
      { status: 500 }
    );
  }
}