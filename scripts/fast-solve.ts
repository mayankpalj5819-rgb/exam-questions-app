/**
 * fast-solve.ts — High-speed batch solver using z-ai CLI with true async concurrency.
 *
 * Usage:
 *   npx tsx scripts/fast-solve.ts --limit 500
 *   npx tsx scripts/fast-solve.ts --offset 500 --limit 500
 *   npx tsx scripts/fast-solve.ts  (solves all)
 */
import { PrismaClient } from '@prisma/client';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONCURRENCY = 15;
const TIMEOUT_MS = 45_000;

const SYSTEM_PROMPT = `You are a JEE expert. Solve the question. Return ONLY this JSON format, nothing else:
{"answer":"A","explanation":"brief step-by-step solution"}
Rules:
- For MCQ questions: answer must be a single letter A/B/C/D/E
- For Numerical questions: answer must be just the number (integer or decimal, no units, no text)
- Keep explanation concise but useful (2-4 sentences)
- Do NOT add any text outside the JSON`;

const db = new PrismaClient({
  datasourceUrl: 'file:/home/z/my-project/db/custom.db',
});

function parseArgs() {
  const args = process.argv.slice(2);
  let limit: number | undefined;
  let offset: number | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) { limit = parseInt(args[i + 1], 10); i++; }
    if (args[i] === '--offset' && args[i + 1]) { offset = parseInt(args[i + 1], 10); i++; }
  }
  return { limit, offset };
}

function callZAI(questionText: string, options?: string): Promise<{ answer: string; explanation: string } | null> {
  return new Promise((resolve) => {
    let prompt = questionText.slice(0, 3000); // truncate very long questions
    if (options?.trim()) prompt += `\n\nOptions:\n${options.slice(0, 2000)}`;

    const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const outFile = path.join(os.tmpdir(), `zai-${uid}.json`);

    const child = execFile('z-ai', [
      'chat', '--prompt', prompt, '--system', SYSTEM_PROMPT, '-o', outFile,
    ], { timeout: TIMEOUT_MS, encoding: 'utf-8' as const }, (err, stdout, stderr) => {
      if (err) {
        try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch {}
        if ((err as NodeJS.ErrnoException).killed) {
          resolve(null); // timeout
        } else {
          resolve(null);
        }
        return;
      }

      try {
        if (!fs.existsSync(outFile)) { resolve(null); return; }
        const raw = fs.readFileSync(outFile, 'utf-8').trim();
        if (!raw) { resolve(null); return; }

        const cliResp = JSON.parse(raw);
        let content = cliResp?.choices?.[0]?.message?.content || cliResp?.content || '';
        if (!content) { resolve(null); return; }

        // Extract JSON
        let jsonStr = content;
        const jm = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jm) jsonStr = jm[1].trim();
        else {
          const bm = content.match(/\{[\s\S]*\}/);
          if (bm) jsonStr = bm[0];
        }

        const parsed = JSON.parse(jsonStr);
        if (parsed.answer && typeof parsed.answer === 'string' && parsed.answer.trim().length > 0) {
          // Normalize MCQ answers
          let ans = parsed.answer.trim();
          const upper = ans.toUpperCase();
          if (/^[A-E]$/.test(upper)) ans = upper;
          else {
            const m = ans.match(/(?:option\s*)?([A-E])/i);
            if (m) ans = m[1].toUpperCase();
          }
          resolve({ answer: ans, explanation: parsed.explanation || '' });
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      } finally {
        try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch {}
      }
    });
  });
}

async function solveOne(q: { id: string; questionText: string; options: string | null; questionType: string }): Promise<boolean> {
  try {
    const result = await callZAI(q.questionText, q.options || undefined);
    if (!result) return false;

    await db.question.update({
      where: { id: q.id },
      data: { correctAnswer: result.answer, solution: result.explanation },
    });
    return true;
  } catch {
    return false;
  }
}

async function workerLoop(queue: Array<{ id: string; questionText: string; options: string | null; questionType: string }>, results: { solved: number; errors: number; done: number; total: number }) {
  while (true) {
    const q = queue.shift();
    if (!q) break;
    const ok = await solveOne(q);
    results.done++;
    if (ok) results.solved++;
    else results.errors++;
    if (results.done % 20 === 0 || results.done === results.total) {
      const pct = ((results.done / results.total) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = (results.solved / (Date.now() - startTime) * 60000).toFixed(1);
      process.stdout.write(`\r  Progress: ${results.done}/${results.total} (${pct}%) | Solved: ${results.solved} | Errors: ${results.errors} | ${rate} q/min | ${elapsed}s`);
    }
  }
}

const startTime = Date.now();

async function main() {
  const { limit, offset } = parseArgs();

  const where: Record<string, unknown> = { correctAnswer: null };
  const totalToSolve = await db.question.count({ where });

  let skip = offset || 0;
  let take = limit || totalToSolve;
  if (skip + take > totalToSolve) take = totalToSolve - skip;

  console.log(`\n  Fast Batch Solve: ${take} questions (skip=${skip}, total unsolved=${totalToSolve})`);
  console.log(`  Concurrency: ${CONCURRENCY} workers\n`);

  // Fetch all questions upfront
  const questions = await db.question.findMany({
    where,
    select: { id: true, questionText: true, options: true, questionType: true },
    skip,
    take,
    orderBy: { id: 'asc' },
  });

  console.log(`  Fetched ${questions.length} questions. Starting...\n`);

  const results = { solved: 0, errors: 0, done: 0, total: questions.length };
  const workers = Array.from({ length: Math.min(CONCURRENCY, questions.length) }, () =>
    workerLoop(questions, results),
  );

  await Promise.all(workers);

  console.log(`\n\n  ✅ Done! Solved: ${results.solved}, Errors: ${results.errors}, Time: ${((Date.now() - startTime) / 1000).toFixed(0)}s\n`);

  const remaining = await db.question.count({ where: { correctAnswer: null } });
  const withAnswer = await db.question.count({ where: { correctAnswer: { not: null } } });
  console.log(`  DB state: ${withAnswer} with answers, ${remaining} remaining\n`);

  await db.$disconnect();
}

main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });