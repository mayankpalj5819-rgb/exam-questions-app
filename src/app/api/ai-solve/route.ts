import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SolveRequestBody {
  questionId: string;
  questionText: string;
  questionType: string;
  options?: string[] | null;
  userAnswer?: string;
}

interface SolveResponse {
  correctAnswer: string;
  explanation: string;
  solved: boolean;
}

interface ParsedAnswer {
  answer: string;
  explanation: string;
}

// ---------------------------------------------------------------------------
// Rate limiter – in-memory, 10 requests per minute per IP
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];

  // Prune stale entries
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(ip, recent);
    return true;
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

function buildSystemPrompt(questionType: string, options?: string[] | null): string {
  const mcqSection = `
For MCQ questions:
- Analyze each option carefully
- The answer must be a single option letter: A, B, C, D, or E
- Return ONLY a JSON object: {"answer": "A", "explanation": "brief step-by-step explanation"}`;

  const numericalSection = `
For Numerical questions:
- Show step-by-step working in your explanation
- The answer should be a simple number (integer or decimal) with no units
- Return ONLY a JSON object: {"answer": "3.14", "explanation": "brief step-by-step explanation"}`;

  const typeInstruction =
    questionType === "MCQ" ? mcqSection : numericalSection;

  const optionsText =
    options && options.length > 0
      ? `\n\nThe options are:\n${options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n")}`
      : "";

  return `You are an expert JEE (Joint Entrance Examination) physics, chemistry, and mathematics tutor.
Solve the given JEE question accurately.${typeInstruction}

IMPORTANT RULES:
- Always respond with valid JSON only. No markdown, no code fences, no extra text.
- The JSON must have exactly two keys: "answer" and "explanation".
- Keep the explanation concise but complete (2-5 sentences).${optionsText}`;
}

function buildUserPrompt(
  questionText: string,
  userAnswer?: string,
): string {
  let prompt = questionText;
  if (userAnswer) {
    prompt += `\n\nThe user answered: "${userAnswer}". Confirm if correct and provide the right answer.`;
  }
  return prompt;
}

// ---------------------------------------------------------------------------
// Response parser – robust extraction of JSON from various LLM outputs
// ---------------------------------------------------------------------------

function parseAIResponse(raw: string): ParsedAnswer | null {
  // 1. Try direct JSON parse
  try {
    const parsed = JSON.parse(raw.trim());
    if (typeof parsed.answer === "string" && typeof parsed.explanation === "string") {
      return { answer: parsed.answer.trim(), explanation: parsed.explanation.trim() };
    }
  } catch {
    // Fall through to other strategies
  }

  // 2. Try extracting JSON from markdown code fences
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      if (typeof parsed.answer === "string" && typeof parsed.explanation === "string") {
        return { answer: parsed.answer.trim(), explanation: parsed.explanation.trim() };
      }
    } catch {
      // Fall through
    }
  }

  // 3. Try finding a JSON object anywhere in the response
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      const parsed = JSON.parse(braceMatch[0]);
      if (typeof parsed.answer === "string" && typeof parsed.explanation === "string") {
        return { answer: parsed.answer.trim(), explanation: parsed.explanation.trim() };
      }
    } catch {
      // Fall through
    }
  }

  // 4. Last resort – try to find "answer": "..." pattern
  const answerMatch = raw.match(/"answer"\s*:\s*"([^"]+)"/);
  const explanationMatch = raw.match(/"explanation"\s*:\s*"([\s\S]*?)(?:"\s*[,}])/);
  if (answerMatch) {
    return {
      answer: answerMatch[1].trim(),
      explanation: explanationMatch?.[1]?.trim() ?? "AI-generated solution",
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Normalize answer to a clean format
// ---------------------------------------------------------------------------

function normalizeAnswer(answer: string, questionType: string): string {
  if (questionType === "MCQ") {
    // Accept both "A" and "Option A" etc – normalize to just the letter
    const match = answer.trim().toUpperCase().match(/^([A-E])\b/);
    if (match) return match[1];
    return answer.trim();
  }
  // Numerical – strip common unit-like suffixes
  return answer.trim();
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // --- Rate limiting ---
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 10 requests per minute." },
      { status: 429 },
    );
  }

  // --- Parse body ---
  let body: SolveRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { questionId, questionText, questionType, options, userAnswer } = body;

  if (!questionId || !questionText || !questionType) {
    return NextResponse.json(
      { error: "Missing required fields: questionId, questionText, questionType" },
      { status: 400 },
    );
  }

  const validType = questionType === "MCQ" || questionType === "Numerical";
  if (!validType) {
    return NextResponse.json(
      { error: "questionType must be 'MCQ' or 'Numerical'" },
      { status: 400 },
    );
  }

  // --- Step 1: Check DB for cached answer ---
  try {
    const existing = await db.question.findUnique({
      where: { id: questionId },
      select: { correctAnswer: true, solution: true },
    });

    if (existing?.correctAnswer) {
      const response: SolveResponse = {
        correctAnswer: existing.correctAnswer,
        explanation: existing.solution ?? "Solution not available",
        solved: false, // false = was cached, not freshly solved
      };
      return NextResponse.json(response);
    }
  } catch (error) {
    console.error("[ai-solve] DB lookup error:", error);
    // Continue to AI solve even if DB lookup fails
  }

  // --- Step 2: Call LLM ---
  let parsed: ParsedAnswer;
  try {
    const zai = await ZAI.create();

    const systemPrompt = buildSystemPrompt(questionType, options);
    const userPrompt = buildUserPrompt(questionText, userAnswer);

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      thinking: { type: "disabled" },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json(
        { error: "AI returned an empty response" },
        { status: 502 },
      );
    }

    parsed = parseAIResponse(rawContent);
    if (!parsed) {
      console.error("[ai-solve] Failed to parse AI response:", rawContent.slice(0, 300));
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("[ai-solve] LLM call error:", error);
    return NextResponse.json(
      { error: "AI service unavailable. Please try again later." },
      { status: 503 },
    );
  }

  // --- Step 3: Normalize & save to DB ---
  const correctAnswer = normalizeAnswer(parsed.answer, questionType);

  try {
    await db.question.update({
      where: { id: questionId },
      data: {
        correctAnswer,
        solution: parsed.explanation,
      },
    });
  } catch (error) {
    console.error("[ai-solve] DB save error:", error);
    // Still return the answer even if DB save fails
  }

  // --- Step 4: Return result ---
  const response: SolveResponse = {
    correctAnswer,
    explanation: parsed.explanation,
    solved: true, // true = freshly solved by AI
  };

  return NextResponse.json(response);
}