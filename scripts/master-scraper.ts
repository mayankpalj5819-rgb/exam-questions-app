import { PrismaClient } from "@prisma/client";
import { spawnSync } from "child_process";

const db = new PrismaClient({
  datasourceUrl: "file:/home/z/my-project/db/custom.db",
});

function runAB(args: string[], timeoutMs = 20000): { stdout: string; stderr: string; ok: boolean } {
  try {
    const r = spawnSync("agent-browser", args, {
      timeout: timeoutMs,
      maxBuffer: 50 * 1024 * 1024,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return {
      stdout: (r.stdout || "").trim(),
      stderr: (r.stderr || "").trim(),
      ok: r.status === 0 && !r.error,
    };
  } catch (e: any) {
    return { stdout: "", stderr: e.message || "unknown", ok: false };
  }
}

function parseYear(meta: string): number | null {
  const m = meta.match(/(20\d{2})/);
  return m ? parseInt(m[1]) : null;
}

function parseShift(meta: string): string {
  if (meta.includes("Morning")) return "Morning Shift";
  if (meta.includes("Evening")) return "Evening Shift";
  if (meta.includes("Afternoon")) return "Afternoon Shift";
  if (meta.includes("Shift 1") || meta.includes("Paper 1")) return "Shift 1";
  if (meta.includes("Shift 2") || meta.includes("Paper 2")) return "Shift 2";
  return "";
}

function detectQuestionType(html: string): string {
  if (html.includes("(A)") && html.includes("(B)")) return "MCQ";
  if (html.match(/\(A\)/) && html.match(/\(B\)/)) return "MCQ";
  if (html.includes("Choose the correct")) return "MCQ";
  if (html.includes("correct answer")) return "MCQ";
  return "Numerical";
}

const EXTRACT_JS = `(() => {
  const m = document.querySelector("main");
  if (!m) return JSON.stringify({error: "NO_MAIN"});
  const cards = m.querySelectorAll('a.flex.gap-2[href*="/past-years/jee/question/"]');
  const questions = [];
  cards.forEach((card, idx) => {
    try {
      const href = card.getAttribute("href") || "";
      const flexCol = card.querySelector(".flex.flex-col");
      if (!flexCol) return;
      const contentDiv = flexCol.children[0];
      if (!contentDiv) return;
      const questionHtml = contentDiv.innerHTML;
      const questionText = contentDiv.textContent.trim();
      const metaDiv = flexCol.children[1];
      const metaText = metaDiv ? metaDiv.textContent.trim() : "";
      const imgs = card.querySelectorAll("img");
      const imageUrls = [];
      imgs.forEach(img => {
        const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
        if (src && src.length > 20 && !src.includes("favicon") && !src.includes("logo") && !src.includes("avatar")) {
          imageUrls.push(src);
        }
      });
      if (questionText.length < 10) return;
      questions.push({
        questionHtml: questionHtml.substring(0, 20000),
        questionText: questionText.substring(0, 5000),
        imageUrls,
        imageUrl: imageUrls[0] || null,
        metaText,
        sourceUrl: href,
        sourceOrder: idx,
      });
    } catch(e) {}
  });
  return JSON.stringify({questions, total: questions.length});
})()`;

function extractQuestionsFromPage(): { questions: any[]; total: number; error?: string } | null {
  // Use spawnSync with argument array - no shell, so no quoting issues
  const r = spawnSync("agent-browser", ["eval", EXTRACT_JS], {
    timeout: 15000,
    maxBuffer: 50 * 1024 * 1024,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  const output = (r.stdout || "").trim();
  const errOutput = (r.stderr || "").trim();

  if (r.error) {
    console.log(`  Eval spawn error: ${r.error.message}`);
    return null;
  }

  if (errOutput) {
    console.log(`  Eval stderr: ${errOutput.substring(0, 200)}`);
  }

  if (!output) {
    console.log(`  Eval returned empty output`);
    return null;
  }

  try {
    return JSON.parse(output);
  } catch {
    console.log(`  JSON parse failed. Output (${output.length} chars): ${output.substring(0, 300)}`);
    return null;
  }
}

async function scrapeChapter(
  examType: string,
  subjectSlug: string,
  chapterSlug: string
): Promise<number> {
  const url = `https://questions.examside.com/past-years/jee/${examType}/${subjectSlug}/${chapterSlug}`;
  console.log(`  Opening: ${url}`);

  // Open the page
  const openR = runAB(["open", url], 35000);
  if (!openR.ok) {
    console.log(`  Failed to open page: ${openR.stderr.substring(0, 120)}`);
    // Try closing and reopening
    runAB(["close"], 10000);
    const retry = runAB(["open", url], 35000);
    if (!retry.ok) {
      console.log(`  Retry also failed: ${retry.stderr.substring(0, 120)}`);
      return 0;
    }
  }

  // Wait for network idle
  const waitR = runAB(["wait", "--load", "networkidle"], 15000);
  if (!waitR.ok) {
    console.log(`  Wait failed: ${waitR.stderr.substring(0, 120)}`);
  }

  // Extract questions
  const parsed = extractQuestionsFromPage();

  if (!parsed || parsed.error || !parsed.questions?.length) {
    console.log(`  No questions found: ${parsed?.error || (parsed ? "empty" : "eval failed")}`);
    return 0;
  }

  // Get subject and chapter from DB
  const subject = await db.subject.findUnique({
    where: { slug: subjectSlug },
  });
  if (!subject) {
    console.log(`  Subject not found: ${subjectSlug}`);
    return 0;
  }

  const chapter = await db.chapter.findFirst({
    where: { slug: chapterSlug, subjectId: subject.id, examType },
  });

  let saved = 0;
  let skipped = 0;
  for (const q of parsed.questions) {
    const year = parseYear(q.metaText);
    if (!year || year < 2000 || year > 2026) continue;

    const shift = parseShift(q.metaText);
    const questionType = detectQuestionType(q.questionHtml);
    const exam = q.metaText.includes("Advanced") ? "jee-advanced" : "jee-main";

    try {
      await db.question.create({
        data: {
          questionText: q.questionText,
          questionHtml: q.questionHtml,
          imageUrl: q.imageUrl,
          imageUrls: q.imageUrls.length > 0 ? JSON.stringify(q.imageUrls) : null,
          questionType,
          year,
          exam,
          shift: shift || null,
          subjectId: subject.id,
          chapterId: chapter?.id,
          sourceUrl: q.sourceUrl ? `https://questions.examside.com${q.sourceUrl}` : null,
          sourceOrder: q.sourceOrder,
        },
      });
      saved++;
    } catch (e: any) {
      skipped++;
    }
  }

  // Update chapter question count
  if (chapter) {
    const count = await db.question.count({ where: { chapterId: chapter.id } });
    await db.chapter.update({
      where: { id: chapter.id },
      data: { questionCount: count },
    });
  }

  console.log(`  → Found ${parsed.questions.length} cards, ${saved} saved, ${skipped} dupes`);
  return saved;
}

async function main() {
  const examType = process.argv[2] || "jee-main";
  const subjectSlug = process.argv[3];
  const startIdx = parseInt(process.argv[4] || "0");
  const count = parseInt(process.argv[5] || "999");

  const chapters = await db.chapter.findMany({
    where: { examType },
    include: { subject: true },
    orderBy: [{ subject: { name: "asc" } }, { name: "asc" }],
  });

  let toScrape = subjectSlug
    ? chapters.filter((c) => c.subject.slug === subjectSlug)
    : chapters;

  // Apply batch slicing
  const batchSlice = toScrape.slice(startIdx, startIdx + count);
  console.log(
    `Scraping batch [${startIdx}..${startIdx + batchSlice.length - 1}] of ${toScrape.length} chapters for ${examType}${subjectSlug ? ` (${subjectSlug})` : ""}\n`
  );

  let totalSaved = 0;
  let totalChapters = 0;
  let emptyChapters = 0;
  let errorChapters = 0;

  for (const chapter of batchSlice) {
    console.log(`\n[${startIdx + totalChapters + 1}/${toScrape.length}] [${chapter.subject.name}] ${chapter.name} (${chapter.slug}):`);
    try {
      const saved = await scrapeChapter(examType, chapter.subject.slug, chapter.slug);
      totalSaved += saved;
      if (saved === 0) emptyChapters++;
      console.log(`  ✓ Saved ${saved} questions (batch total: ${totalSaved})`);
    } catch (e: any) {
      errorChapters++;
      console.log(`  ✗ Error: ${e.message?.substring(0, 200)}`);
      // Try to close browser on error
      try { runAB(["close"], 10000); } catch {}
    }
    totalChapters++;

    // Small delay between requests
    await new Promise((r) => setTimeout(r, 200));
  }

  // Always close browser at end of batch
  try { runAB(["close"], 10000); } catch {}

  console.log(
    `\n✨ Batch done! Scraped ${totalChapters} chapters, ${totalSaved} total questions saved this batch`
  );
  console.log(`   ${emptyChapters} empty, ${errorChapters} errors`);

  // Print total DB count
  const totalCount = await db.question.count();
  console.log(`   Total questions in DB: ${totalCount}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());