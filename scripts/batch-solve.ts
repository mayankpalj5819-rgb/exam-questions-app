/**
 * Batch Solve Script — run locally in sandbox only
 * Uses z-ai-web-dev-sdk LLM to pre-solve JEE questions and save to SQLite DB.
 * 
 * Usage:
 *   bun run scripts/batch-solve.ts --type MCQ --limit 50
 *   bun run scripts/batch-solve.ts --type Numerical --limit 50
 *   bun run scripts/batch-solve.ts --limit 100
 *   bun run scripts/batch-solve.ts --all
 */

import { PrismaClient } from "@prisma/client";
import ZAI from "z-ai-web-dev-sdk";
import { appendFileSync } from "fs";
import { resolve } from "path";

// File-based logging for background execution
const LOG_FILE = resolve(import.meta.dir, "../batch-solve.log");
function log(...args: any[]) {
  const msg = args.map(String).join(" ");
  process.stdout.write(msg + "\n");
  try { appendFileSync(LOG_FILE, msg + "\n"); } catch {}
}

const dbPath = resolve(import.meta.dir, "../db/custom.db");
const db = new PrismaClient({ datasourceUrl: `file:${dbPath}` });
const zai = await ZAI.create();

// Parse CLI args
const args = process.argv.slice(2);
let limit = 50;
let offset = 0;
let typeFilter: string | null = null;
let processAll = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--limit" && args[i + 1]) limit = parseInt(args[++i]);
  if (args[i] === "--offset" && args[i + 1]) offset = parseInt(args[++i]);
  if (args[i] === "--type" && args[i + 1]) typeFilter = args[++i];
  if (args[i] === "--all") processAll = true;
}

const DELAY_MS = 3000;

async function solveQuestion(q: { id: string; questionText: string; questionType: string; options?: string | null }) {
  const qType = q.questionType === "MCQ" ? "MCQ" : "Numerical";
  
  let optionsContext = "";
  if (qType === "MCQ" && q.questionText) {
    const optionRegex = /\(([A-E])\)\s*([\s\S]*?)(?=\([A-E]\)|$)/g;
    let match;
    const opts: string[] = [];
    while ((match = optionRegex.exec(q.questionText)) !== null) {
      opts.push(`(${match[1]}) ${match[2].trim()}`);
    }
    if (opts.length >= 2) optionsContext = `\n\nOptions:\n${opts.join("\n")}`;
  }

  const systemPrompt = `You are an expert JEE tutor. Solve the question accurately.

For MCQ: Reply with ONLY the correct option letter (A/B/C/D/E) on the first line, then a blank line, then a concise solution.
For Numerical: Reply with ONLY the numerical answer on the first line, then a blank line, then a concise solution.

RULES:
1. First line = answer only (letter for MCQ, decimal/integer for Numerical)
2. Blank line, then solution (3-8 lines)
3. Numerical: use decimal (0.5 not 1/2)
4. Be accurate — real JEE exam questions`;

  const userPrompt = `Solve this JEE ${qType} question:\n\n${q.questionText}${optionsContext}`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      thinking: { type: "disabled" },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error("Empty response");

    const lines = response.split("\n");
    const answerLine = lines[0].trim();
    const solutionLines = lines.slice(1).join("\n").trim();

    let correctAnswer = answerLine
      .replace(/^(?:Answer[:\s]*|Ans[:\s]*)/i, "")
      .trim()
      .toUpperCase()
      .replace(/[^A-E0-9.\-]/g, "");

    if (qType === "MCQ" && !/^[A-E]$/.test(correctAnswer)) {
      const letterMatch = answerLine.match(/([A-E])\b/);
      if (letterMatch) correctAnswer = letterMatch[1];
      else throw new Error(`Invalid MCQ answer: ${answerLine}`);
    }

    if (qType === "Numerical") {
      const numMatch = answerLine.match(/-?\d+\.?\d*/);
      if (numMatch) correctAnswer = numMatch[0];
      else throw new Error(`Invalid numerical answer: ${answerLine}`);
    }

    let solution = solutionLines
      .replace(/^(?:Answer[:\s]*|Ans[:\s]*)\s*[A-E0-9.\-]*\s*$/im, "")
      .trim();

    if (!solution || solution.length < 10) {
      solution = `The correct ${qType === "MCQ" ? "option is" : "answer is"} ${correctAnswer}.`;
    }

    return { correctAnswer, solution, success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function main() {
  log("=".repeat(60));
  log("JEE PYQ Batch Solver");
  log("=".repeat(60));

  const where: Record<string, unknown> = { correctAnswer: null };
  if (typeFilter) where.questionType = typeFilter;

  const totalUnsolved = await db.question.count({ where });
  log(`\nTotal unsolved questions: ${totalUnsolved}`);

  const questionsToSolve = processAll ? totalUnsolved : Math.min(limit, totalUnsolved - offset);
  log(`Processing: ${questionsToSolve} questions${offset > 0 ? ` (from #${offset})` : ""}${typeFilter ? ` (type: ${typeFilter})` : ""}\n`);

  if (questionsToSolve === 0) { log("No questions to solve!"); await db.$disconnect(); return; }

  const questions = await db.question.findMany({
    where,
    select: { id: true, questionText: true, questionType: true, options: true },
    skip: offset,
    take: processAll ? undefined : limit,
    orderBy: { createdAt: "asc" },
  });

  log(`Fetched ${questions.length} questions\n`);

  let solved = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const result = await solveQuestion(q);

    if (result.success && result.correctAnswer && result.solution) {
      try {
        await db.question.update({
          where: { id: q.id },
          data: { correctAnswer: result.correctAnswer, solution: result.solution },
        });
        solved++;
        log(`  ✅ #${i + 1} [${q.questionType}] Answer: ${result.correctAnswer}`);
      } catch (err) {
        failed++;
        log(`  ❌ #${i + 1} DB error: ${err}`);
      }
    } else {
      failed++;
      log(`  ❌ #${i + 1} Failed: ${(result as any).error || "No answer"}`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const progress = ((i + 1) / questions.length * 100).toFixed(1);
    const avgTime = ((Date.now() - startTime) / (i + 1) / 1000).toFixed(1);
    log(`  📊 ${progress}% | ✅${solved} ❌${failed} | ⏱${elapsed}s (avg ${avgTime}s/q)`);

    if (i < questions.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  log("\n" + "=".repeat(60));
  log(`DONE! Solved: ${solved} | Failed: ${failed} | Time: ${totalTime}s`);
  log("=".repeat(60));

  await db.$disconnect();
}

main().catch((err) => {
  log("Fatal error:", String(err));
  db.$disconnect();
  process.exit(1);
});