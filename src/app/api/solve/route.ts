import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// In-memory cache: questionId → solution text
const solutionCache = new Map<string, { solution: string; source: string; sourceUrl: string; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 500;
const TIMEOUT_MS = 30_000; // 30 second timeout

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

function pruneCache() {
  if (solutionCache.size > MAX_CACHE_SIZE) {
    const firstKey = solutionCache.keys().next().value;
    if (firstKey !== undefined) solutionCache.delete(firstKey);
  }
}

/** Race a promise against a timeout, rejecting if it takes too long */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms),
    ),
  ]);
}

/** Clean question text for use as a search query */
function cleanForSearch(text: string): string {
  return text
    .replace(/\$\$[\s\S]*?\$\$/g, "") // Remove block math
    .replace(/\$[^\$]+\$/g, "") // Remove inline math
    .replace(/\n/g, " ")
    .trim()
    .slice(0, 200);
}

/** Extract a concise answer from raw HTML page content */
function extractAnswerFromContent(html: string, questionText: string): string {
  // Look for answer/solution patterns in the HTML
  const answerPatterns = [
    /(?:answer|solution|explanation|correct\s*answer)[:\s]*([\s\S]{20,500}?)(?:<br|<p|<div|<\/div|$)/i,
    /(?:the\s+answer\s+is|correct\s+option|right\s+answer)[:\s]*([A-D][\s\S]{0,200})/i,
    /(?:answer\s*:\s*)([A-D][\s\S]{0,100})/i,
  ];

  for (const pattern of answerPatterns) {
    const match = html.match(pattern);
    const captured = match?.[1]?.trim();
    if (captured && captured.length > 10) {
      return captured
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 800);
    }
  }

  // Fallback: find the most relevant paragraph that discusses the answer
  const paragraphs = html.split(/<p[^>]*>|<br\s*\/?>/i).filter((p) => p.trim().length > 30);
  const questionWords = questionText
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 10);

  let bestParagraph = "";
  let bestScore = 0;

  for (const p of paragraphs.slice(0, 20)) {
    const cleanP = p.replace(/<[^>]*>/g, " ").toLowerCase();
    let score = 0;
    for (const word of questionWords) {
      if (cleanP.includes(word)) score++;
    }
    // Bonus for answer-related keywords
    if (/answer|solution|correct|therefore|hence|option/i.test(cleanP)) score += 3;
    if (score > bestScore) {
      bestScore = score;
      bestParagraph = p
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 600);
    }
  }

  return bestParagraph || "Answer could not be extracted from the source. Try searching the question directly.";
}

/** Domains we trust to have quality JEE solutions */
const TRUSTED_DOMAINS = [
  "examside",
  "doubtnut",
  "toppr",
  "byjus",
  "vedantu",
  "unacademy",
  "physicswallah",
  "pw",
  "career360",
  "collegedekho",
  "esaral",
  "motion",
  "allen",
  "fiitjee",
  "brilliant",
  "iitianacademy",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, questionText } = body as {
      questionId?: string;
      questionText?: string;
    };

    // Validate required fields
    if (!questionId || !questionText || typeof questionText !== "string") {
      return NextResponse.json(
        { error: "questionId and questionText are required" },
        { status: 400 },
      );
    }

    if (questionText.trim().length === 0) {
      return NextResponse.json(
        { error: "questionText must not be empty" },
        { status: 400 },
      );
    }

    // Check cache first
    pruneCache();
    const cached = solutionCache.get(questionId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        solution: cached.solution,
        source: "cache",
        sourceUrl: cached.sourceUrl,
      });
    }

    // Initialise SDK (also respects the 30s outer timeout)
    const zai = await withTimeout(getZAI(), TIMEOUT_MS, "SDK init");

    // Step 1 — Search the web for this question
    const searchQuery = cleanForSearch(questionText);
    const fullQuery = `${searchQuery} JEE answer solution`;

    let searchResults: Array<{ url: string; name: string; snippet: string; host_name: string }>;

    try {
      searchResults = await withTimeout(
        zai.functions.invoke("web_search", { query: fullQuery, num: 5 }) as Promise<typeof searchResults>,
        15_000,
        "Web search",
      );
    } catch (searchErr) {
      // Retry with a shorter, simpler query
      try {
        searchResults = await withTimeout(
          zai.functions.invoke("web_search", { query: `JEE question answer "${searchQuery}"`, num: 5 }) as Promise<typeof searchResults>,
          15_000,
          "Web search retry",
        );
      } catch {
        return NextResponse.json({
          solution: "Search timed out or failed. The question may be too long — try a shorter version or search manually.",
          source: "error",
          sourceUrl: "",
        });
      }
    }

    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json({
        solution: "No answer found online for this question. The question may be very recent or unique. Try searching manually.",
        source: "not_found",
        sourceUrl: "",
      });
    }

    // Step 2 — Prioritise trusted educational domains
    const sortedResults = [...searchResults].sort((a, b) => {
      const aTrusted = TRUSTED_DOMAINS.some((d) => a.host_name?.toLowerCase().includes(d)) ? 1 : 0;
      const bTrusted = TRUSTED_DOMAINS.some((d) => b.host_name?.toLowerCase().includes(d)) ? 1 : 0;
      return bTrusted - aTrusted;
    });

    // Step 3 — Read the top 2-3 results and try to extract an answer
    let solution = "";
    let sourceUrl = "";
    let sourceName = "";

    for (const result of sortedResults.slice(0, 3)) {
      try {
        const pageResult = await withTimeout(
          zai.functions.invoke("page_reader", { url: result.url }) as Promise<{ code?: number; data?: { html?: string } }>,
          10_000,
          "Page read",
        );

        const pageHtml = pageResult?.data?.html || "";
        if (pageHtml.length < 50) continue;

        solution = extractAnswerFromContent(pageHtml, questionText);
        sourceUrl = result.url;
        sourceName = result.name || result.host_name;

        if (solution && solution.length > 30) break;
      } catch {
        continue; // Skip this result, try next
      }
    }

    // Step 4 — Fallback to search snippets if page reading didn't yield a good answer
    if (!solution || solution.length < 30) {
      const snippets = searchResults
        .filter((r) => r.snippet && r.snippet.length > 20)
        .map((r) => `• ${r.snippet}`)
        .join("\n\n");

      solution = snippets
        ? `From web search results:\n\n${snippets}`
        : "Could not extract a clear answer from the sources. Try visiting the source directly.";
      sourceUrl = searchResults[0]?.url || "";
      sourceName = "Web Search";
    }

    // Store in cache
    solutionCache.set(questionId, {
      solution,
      source: sourceName,
      sourceUrl,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      solution,
      source: sourceName,
      sourceUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/solve] Error:", message);

    // Differentiate timeout errors
    if (message.includes("timed out")) {
      return NextResponse.json(
        { error: "Request timed out. The search took too long — please try again." },
        { status: 504 },
      );
    }

    return NextResponse.json(
      { error: "Failed to find answer. Please try again later." },
      { status: 500 },
    );
  }
}