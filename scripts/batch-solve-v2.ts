// batch-solve-v2.ts — Parallel batch solver for JEE PYQ questions
// Usage: npx tsx scripts/batch-solve-v2.ts --chunk <chunkId> --total <totalChunks>
// Each chunk processes a subset of questions without solutions

import { PrismaClient } from "@prisma/client";
import ZAI from "z-ai-web-dev-sdk";

const db = new PrismaClient();

const args = process.argv.slice(2);
function getArg(name: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : "";
}

const CHUNK_ID = parseInt(getArg("chunk") || "0");
const TOTAL_CHUNKS = parseInt(getArg("total") || "1");
const BATCH_SIZE = 10; // questions per LLM batch
const DELAY_MS = 1500; // delay between batches
const LOG_FILE = `/home/z/my-project/batch-solve-chunk-${CHUNK_ID}.log`;

function log(msg: string) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [Chunk ${CHUNK_ID}] ${msg}`;
  console.log(line);
  require("fs").appendFileSync(LOG_FILE, line + "\n");
}

function normalizeText(text: string): string {
  return text.replace(/\\n/g, "\n").trim();
}

interface SolveResult {
  id: string;
  answer?: string;
  solution?: string;
}

async function solveBatch(zai: Awaited<ReturnType<typeof ZAI.create>>, questions: { id: string; questionText: string; questionType: string; correctAnswer?: string | null }[]): Promise<SolveResult[]> {
  const systemPrompt = `You are a JEE (Joint Entrance Examination) expert tutor. For each question, provide:
1. The correct answer (single letter A/B/C/D for MCQ, or a number for Numerical type)
2. A concise step-by-step solution using LaTeX for math ($...$ for inline, $$...$$ for display)

IMPORTANT: Respond with EXACTLY this format for each question, separated by ---:
ANSWER: <letter or number>
SOLUTION: <step-by-step solution>

Be accurate. Use proper physics/chemistry/mathematics reasoning.`;

  // Build batch prompt with up to BATCH_SIZE questions
  const questionBlocks = questions.map((q, i) => {
    const normQ = normalizeText(q.questionText);
    const typeHint = q.questionType === "MCQ" ? "[MCQ Type]" : "[Numerical Type]";
    return `Question ${i + 1} (ID: ${q.id.slice(-6)}): ${typeHint}\n${normQ}`;
  });

  const userMessage = `Solve these ${questions.length} JEE questions:\n\n${questionBlocks.join("\n\n---\n\n")}`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      thinking: { type: "disabled" },
    });

    const response = completion.choices[0]?.message?.content || "";

    // Parse individual answers from response
    const results: SolveResult[] = questions.map(q => ({ id: q.id }));
    const blocks = response.split(/---+/);

    for (const block of blocks) {
      const answerMatch = block.match(/ANSWER:\s*([A-D]|\d+\.?\d*)/i);
      const solutionMatch = block.match(/SOLUTION:\s*([\s\S]+?)(?=ANSWER:|$)/i);

      // Try to find which question this block belongs to
      for (let i = 0; i < questions.length; i++) {
        const shortId = questions[i].id.slice(-6);
        if (block.includes(shortId) || (answerMatch && blocks.indexOf(block) === i)) {
          if (answerMatch) {
            results[i].answer = answerMatch[1].trim().toUpperCase();
          }
          if (solutionMatch) {
            results[i].solution = solutionMatch[1].trim();
          }
          break;
        }
      }
    }

    return results;
  } catch (err) {
    log(`LLM error: ${err instanceof Error ? err.message : err}`);
    return questions.map(q => ({ id: q.id }));
  }
}

async function main() {
  log(`Starting chunk ${CHUNK_ID}/${TOTAL_CHUNKS}`);

  let zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
  try {
    zai = await ZAI.create();
    log("SDK initialized");
  } catch (err) {
    log(`FATAL: Cannot initialize SDK: ${err}`);
    process.exit(1);
  }

  // Get total unsolved count
  const totalUnsolved = await db.question.count({
    where: {
      OR: [
        { solution: null },
        { solution: "" },
      ],
    },
  });

  const perChunk = Math.ceil(totalUnsolved / TOTAL_CHUNKS);
  const skip = CHUNK_ID * perChunk;

  log(`Total unsolved: ${totalUnsolved}, this chunk: ~${perChunk} (skip ${skip})`);

  // Fetch questions for this chunk
  const questions = await db.question.findMany({
    where: {
      OR: [
        { solution: null },
        { solution: "" },
      ],
    },
    select: { id: true, questionText: true, questionType: true, correctAnswer: true },
    skip,
    take: perChunk,
    orderBy: { id: "asc" },
  });

  log(`Fetched ${questions.length} questions to solve`);

  let solved = 0;
  let errors = 0;

  // Process in batches
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(questions.length / BATCH_SIZE);

    log(`Batch ${batchNum}/${totalBatches} (${batch.length} questions)...`);

    const results = await solveBatch(zai, batch);

    // Save results to DB
    for (const result of results) {
      if (result.answer || result.solution) {
        try {
          const updateData: any = {};
          if (result.solution) updateData.solution = result.solution;
          if (result.answer && result.answer.length <= 10) {
            updateData.correctAnswer = result.answer;
          }
          await db.question.update({ where: { id: result.id }, data: updateData });
          solved++;
        } catch (err) {
          errors++;
          log(`DB error for ${result.id.slice(-6)}: ${err instanceof Error ? err.message : err}`);
        }
      } else {
        errors++;
      }
    }

    log(`Batch ${batchNum} done. Total solved: ${solved}, errors: ${errors}`);

    // Delay between batches
    if (i + BATCH_SIZE < questions.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  log(`\n=== CHUNK ${CHUNK_ID} COMPLETE ===`);
  log(`Solved: ${solved}/${questions.length}`);
  log(`Errors: ${errors}`);

  await db.$disconnect();
}

main().catch(err => {
  log(`FATAL: ${err}`);
  process.exit(1);
});