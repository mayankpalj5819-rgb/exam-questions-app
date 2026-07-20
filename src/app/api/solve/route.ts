import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// In-memory cache: questionId → solution text
const solutionCache = new Map<string, { solution: string; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 500;

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

// Extract answer text from page content
function extractAnswerFromContent(html: string, questionText: string): string {
  // Try to find answer section in the page
  const lowerHtml = html.toLowerCase();
  
  // Look for answer patterns
  const answerPatterns = [
    /(?:answer|solution|explanation|correct\s*answer)[:\s]*([\s\S]{20,500}?)(?:<br|<p|<div|<\/div|$)/i,
    /(?:the\s+answer\s+is|correct\s+option|right\s+answer)[:\s]*([A-D][\s\S]{0,200})/i,
    /(?:answer\s*:\s*)([A-D][\s\S]{0,100})/i,
  ];

  for (const pattern of answerPatterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].trim().length > 10) {
      const cleaned = match[1]
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 800);
      return cleaned;
    }
  }

  // If no clear answer pattern, extract relevant paragraph
  // Find the most relevant section that discusses the answer
  const paragraphs = html.split(/<p[^>]*>|<br\s*\/?>/i).filter(p => p.trim().length > 30);
  
  // Score paragraphs by relevance to the question
  const questionWords = questionText
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3)
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
      bestParagraph = p.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 600);
    }
  }

  return bestParagraph || "Answer could not be extracted from the source. Try searching the question directly.";
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
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ solution: cached.solution, source: "cache" });
    }

    const zai = await getZAI();

    // Step 1: Search the web for this question
    // Clean the question text for search - take first 150 chars
    const searchQuery = questionText
      .replace(/\$\$[\s\S]*?\$\$/g, "") // Remove block math
      .replace(/\$[^\$]+\$/g, "") // Remove inline math
      .replace(/\n/g, " ")
      .trim()
      .slice(0, 200);

    let searchResults: Array<{ url: string; name: string; snippet: string; host_name: string }>;

    try {
      const searchResponse = await zai.functions.invoke("web_search", {
        query: `JEE question answer "${searchQuery}"`,
        num: 5,
      });
      searchResults = searchResponse || [];
    } catch {
      // Fallback search
      try {
        const searchResponse = await zai.functions.invoke("web_search", {
          query: searchQuery + " JEE answer solution",
          num: 5,
        });
        searchResults = searchResponse || [];
      } catch {
        searchResults = [];
      }
    }

    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json({
        solution: "No answer found online for this question. The question may be very recent or unique.",
        source: "not_found",
      });
    }

    // Step 2: Try to read the most relevant result
    // Prioritize educational sites
    const trustedDomains = [
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

    const sortedResults = [...searchResults].sort((a, b) => {
      const aTrusted = trustedDomains.some(d => a.host_name?.toLowerCase().includes(d)) ? 1 : 0;
      const bTrusted = trustedDomains.some(d => b.host_name?.toLowerCase().includes(d)) ? 1 : 0;
      return bTrusted - aTrusted;
    });

    let solution = "";
    let sourceUrl = "";
    let sourceName = "";

    for (const result of sortedResults.slice(0, 3)) {
      try {
        const pageResult = await zai.functions.invoke("page_reader", {
          url: result.url,
        });

        const pageHtml = pageResult?.data?.html || "";
        if (pageHtml.length < 50) continue;

        solution = extractAnswerFromContent(pageHtml, questionText);
        sourceUrl = result.url;
        sourceName = result.name || result.host_name;

        if (solution && solution.length > 30) break;
      } catch {
        continue;
      }
    }

    // Step 3: If we couldn't extract a good answer from pages, use search snippets
    if (!solution || solution.length < 30) {
      const snippets = searchResults
        .filter(r => r.snippet && r.snippet.length > 20)
        .map(r => `• ${r.snippet}`)
        .join("\n\n");

      solution = snippets
        ? `From web search results:\n\n${snippets}\n\nSource: ${searchResults[0]?.url || "N/A"}`
        : "Could not extract a clear answer. Try visiting the source directly.";
      sourceUrl = searchResults[0]?.url || "";
      sourceName = "Web Search";
    }

    // Store in cache
    solutionCache.set(questionId, { solution, timestamp: Date.now() });

    return NextResponse.json({
      solution,
      source: sourceName,
      sourceUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/solve] Error:", message);
    return NextResponse.json(
      { error: "Failed to find answer. Please try again." },
      { status: 500 }
    );
  }
}