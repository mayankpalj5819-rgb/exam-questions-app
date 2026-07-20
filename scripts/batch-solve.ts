/**
 * batch-solve.ts
 *
 * Solves JEE questions in batches using the z-ai CLI and saves answers to the database.
 *
 * Usage:
 *   npx tsx scripts/batch-solve.ts
 *   npx tsx scripts/batch-solve.ts --limit 10
 *   npx tsx scripts/batch-solve.ts --exam jee-advanced
 *   npx tsx scripts/batch-solve.ts --exam jee-main --limit 100
 */

import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ─── Configuration ───────────────────────────────────────────────
const BATCH_SIZE = 50;
const CONCURRENCY = 5;
const BATCH_DELAY_MS = 500;
const Z_AI_TIMEOUT_MS = 60_000;

const SYSTEM_PROMPT = `You are an expert JEE tutor. Solve the following JEE question. 
Return ONLY valid JSON: {"answer": "your answer here", "explanation": "brief explanation"}
For MCQ: answer should be the option letter (A, B, C, D, or E)
For Numerical: answer should be just the number (integer or decimal, no units)`;

// ─── Database ────────────────────────────────────────────────────
const db = new PrismaClient({
  datasourceUrl: 'file:/home/z/my-project/db/custom.db',
});

// ─── State ───────────────────────────────────────────────────────
let totalSolved = 0;
let totalErrors = 0;
let isShuttingDown = false;
const startTime = Date.now();

// ─── CLI Argument Parsing ────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  let limit: number | undefined;
  let exam: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && i + 1 < args.length) {
      limit = parseInt(args[i + 1], 10);
      if (isNaN(limit) || limit <= 0) {
        console.error(`[ERROR] Invalid --limit value: ${args[i + 1]}`);
        process.exit(1);
      }
      i++;
    } else if (args[i] === '--exam' && i + 1 < args.length) {
      exam = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: npx tsx scripts/batch-solve.ts [options]

Options:
  --limit <N>    Process only N questions (for testing)
  --exam <type>  Filter by exam type (e.g., jee-main, jee-advanced)
  --help, -h     Show this help message

Examples:
  npx tsx scripts/batch-solve.ts --limit 10
  npx tsx scripts/batch-solve.ts --exam jee-advanced
  npx tsx scripts/batch-solve.ts --exam jee-main --limit 100
`);
      process.exit(0);
    }
  }

  return { limit, exam };
}

// ─── Graceful Shutdown ───────────────────────────────────────────
function setupShutdownHandler() {
  const handler = async (signal: string) => {
    if (isShuttingDown) {
      console.log('\n[WARN] Already shutting down, forcing exit...');
      process.exit(1);
    }
    isShuttingDown = true;
    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`[SHUTDOWN] Received ${signal}. Saving progress and exiting...`);
    console.log(`${'='.repeat(60)}`);
    printSummary();
    await db.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => handler('SIGINT'));
  process.on('SIGTERM', () => handler('SIGTERM'));
}

// ─── Logging Utilities ───────────────────────────────────────────
function logSolved(questionId: string, answer: string) {
  totalSolved++;
  const shortId = questionId.length > 8 ? questionId.slice(0, 8) : questionId;
  console.log(`  [SOLVED] ${shortId}: Answer = ${answer}`);
}

function logError(questionId: string, error: string) {
  totalErrors++;
  const shortId = questionId.length > 8 ? questionId.slice(0, 8) : questionId;
  console.error(`  [ERROR] ${shortId}: ${error}`);
}

function logProgress(solved: number, total: number) {
  const pct = total > 0 ? ((solved / total) * 100).toFixed(2) : '0.00';
  console.log(`\n[Progress] ${solved}/${total} (${pct}%)`);
}

function printSummary() {
  const elapsed = Date.now() - startTime;
  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  console.log(`\n${'='.repeat(60)}`);
  console.log('  BATCH SOLVE SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Questions solved:   ${totalSolved}`);
  console.log(`  Errors:             ${totalErrors}`);
  console.log(`  Time elapsed:       ${minutes}m ${secs}s`);
  if (totalSolved > 0) {
    const avgPerMin = (totalSolved / (elapsed / 60_000)).toFixed(1);
    console.log(`  Throughput:         ~${avgPerMin} questions/min`);
  }
  console.log(`${'='.repeat(60)}\n`);
}

// ─── z-ai CLI Caller ─────────────────────────────────────────────
function callZAI(questionText: string, options?: string): {
  answer: string;
  explanation: string;
} | null {
  if (isShuttingDown) return null;

  // Build the prompt
  let prompt = questionText;
  if (options && options.trim()) {
    prompt += `\n\nOptions:\n${options}`;
  }

  // Unique temp file for output
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const outputFile = path.join(os.tmpdir(), `zai-out-${uid}.json`);

  try {
    // Use spawnSync with direct args — no shell escaping needed
    const result = spawnSync('z-ai', [
      'chat',
      '--prompt', prompt,
      '--system', SYSTEM_PROMPT,
      '-o', outputFile,
    ], {
      timeout: Z_AI_TIMEOUT_MS,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8' as const,
    });

    // Check for non-zero exit or signal
    if (result.status !== 0 && result.status !== null) {
      const stderr = (result.stderr || '').trim().slice(0, 200);
      throw new Error(`z-ai exited with code ${result.status}: ${stderr}`);
    }
    if (result.error) {
      if ((result.error as NodeJS.ErrnoException).killed) {
        throw new Error(`z-ai CLI timed out after ${Z_AI_TIMEOUT_MS / 1000}s`);
      }
      throw new Error(`z-ai spawn error: ${result.error.message}`);
    }

    // Read the output file
    if (!fs.existsSync(outputFile)) {
      return null;
    }

    const rawOutput = fs.readFileSync(outputFile, 'utf-8').trim();

    if (!rawOutput) {
      return null;
    }

    // Parse the z-ai CLI output format (OpenAI-compatible):
    // { "choices": [{ "message": { "content": "..." } }] }
    let content = '';
    try {
      const cliResponse = JSON.parse(rawOutput);
      content =
        cliResponse?.choices?.[0]?.message?.content ||
        cliResponse?.content ||
        '';
    } catch {
      // Fallback: raw content
      content = rawOutput;
    }

    if (!content) {
      return null;
    }

    // Extract JSON from the content — LLM often wraps in ```json ... ```
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // Try to find a raw JSON object
      const braceMatch = content.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonStr = braceMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr);

    if (parsed.answer && typeof parsed.answer === 'string' && parsed.answer.trim().length > 0) {
      return {
        answer: parsed.answer.trim(),
        explanation: parsed.explanation || '',
      };
    }

    return null;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes('timed out') || errMsg.includes('ETIMEDOUT') || errMsg.includes('killed')) {
      throw new Error(`z-ai CLI timed out after ${Z_AI_TIMEOUT_MS / 1000}s`);
    }
    throw new Error(`z-ai CLI failed: ${errMsg}`);
  } finally {
    // Clean up temp file
    try {
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ─── Process a Single Question ───────────────────────────────────
async function solveQuestion(
  questionId: string,
  questionText: string,
  options: string | null,
  questionType: string,
) {
  if (isShuttingDown) return false;

  try {
    const result = callZAI(questionText, options || undefined);

    if (!result) {
      logError(questionId, 'Failed to parse response or empty answer');
      return false;
    }

    // Validate MCQ answer format
    if (questionType === 'mcq' || questionType === 'mcq-multiple') {
      const answerUpper = result.answer.toUpperCase();
      if (!/^[A-E]$/.test(answerUpper)) {
        // Try to extract a letter from the answer
        const letterMatch = result.answer.match(/([A-E])/i);
        if (letterMatch) {
          result.answer = letterMatch[1].toUpperCase();
        }
      }
    }

    // Save to database
    await db.question.update({
      where: { id: questionId },
      data: {
        correctAnswer: result.answer,
        solution: result.explanation,
      },
    });

    logSolved(questionId, result.answer);
    return true;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logError(questionId, errMsg);
    return false;
  }
}

// ─── Concurrency Limiter ─────────────────────────────────────────
async function processConcurrently(
  tasks: Array<() => Promise<boolean>>,
  concurrency: number,
): Promise<{ solved: number; errors: number }> {
  let solved = 0;
  let errors = 0;
  let index = 0;

  async function worker() {
    while (index < tasks.length && !isShuttingDown) {
      const currentIndex = index++;
      const success = await tasks[currentIndex]();
      if (success) {
        solved++;
      } else {
        errors++;
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => worker(),
  );

  await Promise.all(workers);
  return { solved, errors };
}

// ─── Delay Utility ───────────────────────────────────────────────
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  const { limit, exam } = parseArgs();

  // Setup graceful shutdown
  setupShutdownHandler();

  console.log(`${'='.repeat(60)}`);
  console.log('  JEE Batch Answer Generation Script');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Batch size:      ${BATCH_SIZE}`);
  console.log(`  Concurrency:     ${CONCURRENCY}`);
  console.log(`  Batch delay:     ${BATCH_DELAY_MS}ms`);
  if (limit) console.log(`  Limit:           ${limit} questions`);
  if (exam) console.log(`  Exam filter:     ${exam}`);
  console.log(`${'='.repeat(60)}\n`);

  // Build where clause
  const where: Record<string, unknown> = {
    correctAnswer: null,
  };
  if (exam) {
    where.exam = exam;
  }

  // Count total questions to process
  const totalToSolve = await db.question.count({ where });
  const effectiveLimit = limit ? Math.min(limit, totalToSolve) : totalToSolve;

  console.log(`[INFO] Total questions without answers${exam ? ` (${exam})` : ''}: ${totalToSolve}`);
  console.log(`[INFO] Questions to process this run: ${effectiveLimit}`);
  console.log(`[INFO] Estimated time at ~${CONCURRENCY * (60_000 / (Z_AI_TIMEOUT_MS / 1000 * 0.8)).toFixed(0)} questions/min: ~${Math.ceil(effectiveLimit / (CONCURRENCY * (60_000 / (Z_AI_TIMEOUT_MS / 1000 * 0.8))))} minutes\n`);

  if (effectiveLimit === 0) {
    console.log('[INFO] No questions to process. All done!');
    await db.$disconnect();
    return;
  }

  let cursor: string | undefined = undefined;
  let processedCount = 0;
  let batchNumber = 0;
  let cumulativeSolved = 0;

  // Process in batches
  while (processedCount < effectiveLimit && !isShuttingDown) {
    batchNumber++;
    const remaining = effectiveLimit - processedCount;
    const take = Math.min(BATCH_SIZE, remaining);

    // Fetch a batch of unsolved questions
    const questions = await db.question.findMany({
      where,
      select: {
        id: true,
        questionText: true,
        options: true,
        questionType: true,
      },
      take,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
    });

    if (questions.length === 0) break;
    cursor = questions[questions.length - 1].id;

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`  Batch #${batchNumber}: ${questions.length} questions (Q ${processedCount + 1}–${processedCount + questions.length})`);
    console.log(`${'─'.repeat(50)}`);

    // Build task array for concurrent processing
    const tasks = questions.map(
      (q) =>
        () =>
          solveQuestion(q.id, q.questionText, q.options, q.questionType),
    );

    // Process with limited concurrency
    const batchResult = await processConcurrently(tasks, CONCURRENCY);
    cumulativeSolved += batchResult.solved;
    processedCount += questions.length;

    // Log progress
    logProgress(cumulativeSolved, effectiveLimit);

    // Delay between batches
    if (processedCount < effectiveLimit && !isShuttingDown) {
      await delay(BATCH_DELAY_MS);
    }
  }

  // Final summary
  console.log();
  printSummary();

  // Verify final state
  const remainingNull = await db.question.count({ where: { correctAnswer: null } });
  const totalWithAnswer = await db.question.count({ where: { correctAnswer: { not: null } } });
  console.log(`  Database state:`);
  console.log(`    Questions with answer:  ${totalWithAnswer}`);
  console.log(`    Questions still null:   ${remainingNull}\n`);

  await db.$disconnect();
  console.log('Done.');
}

main().catch(async (err) => {
  console.error('[FATAL]', err);
  await db.$disconnect();
  process.exit(1);
});
