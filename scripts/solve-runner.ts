/**
 * solve-runner.ts — Resilient batch solver with retries using z-ai CLI.
 * Handles rate limits with backoff. Runs until stopped or all solved.
 *
 * Usage:
 *   npx tsx scripts/solve-runner.ts --limit 1000
 *   npx tsx scripts/solve-runner.ts  (all remaining)
 */
import { PrismaClient } from '@prisma/client';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONCURRENCY = 3;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 800;
const TIMEOUT_MS = 45_000;

const SYSTEM_PROMPT = `You are a JEE expert. Solve the question. Return ONLY valid JSON, no markdown:
{"answer":"A","explanation":"brief solution"}
MCQ: answer = letter A/B/C/D/E. Numerical: answer = number only, no units.`;

const db = new PrismaClient({ datasourceUrl: 'file:/home/z/my-project/db/custom.db' });

function parseArgs() {
  const args = process.argv.slice(2);
  let limit: number | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) { limit = parseInt(args[i + 1]); i++; }
  }
  return { limit };
}

function callZAI(prompt: string): Promise<{ answer: string; explanation: string } | null> {
  return new Promise((resolve) => {
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const outFile = path.join(os.tmpdir(), `zai-${uid}.json`);

    execFile('z-ai', ['chat', '--prompt', prompt.slice(0, 4000), '--system', SYSTEM_PROMPT, '-o', outFile],
      { timeout: TIMEOUT_MS, encoding: 'utf-8' as const },
      (err) => {
        try {
          if (err) { resolve(null); return; }
          if (!fs.existsSync(outFile)) { resolve(null); return; }
          const raw = fs.readFileSync(outFile, 'utf-8').trim();
          if (!raw) { resolve(null); return; }

          const cliResp = JSON.parse(raw);
          let content = cliResp?.choices?.[0]?.message?.content || '';
          if (!content) { resolve(null); return; }

          // Extract JSON
          let js = content;
          const fm = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (fm) js = fm[1].trim();
          else { const bm = content.match(/\{[\s\S]*\}/); if (bm) js = bm[0]; }

          const p = JSON.parse(js);
          if (p.answer?.trim()) {
            let ans = p.answer.trim().toUpperCase();
            const m = ans.match(/^([A-E])\b/) || ans.match(/([A-E])/);
            resolve({ answer: m ? m[1] : p.answer.trim(), explanation: p.explanation || '' });
          } else { resolve(null); }
        } catch { resolve(null); }
        finally { try { fs.unlinkSync(outFile); } catch {} }
      }
    );
  });
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function solveWithRetry(
  q: { id: string; questionText: string; options: string | null; questionType: string },
  stats: { solved: number; errors: number; done: number; total: number },
) {
  let prompt = q.questionText.slice(0, 3500);
  if (q.options?.trim()) prompt += `\n\nOptions:\n${q.options.slice(0, 1500)}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await delay(300); // space out requests to avoid rate limits
    if (attempt > 0) await delay(BASE_DELAY_MS * (attempt + 1)); // backoff

    const result = await callZAI(prompt);
    if (!result) continue;

    try {
      await db.question.update({
        where: { id: q.id },
        data: { correctAnswer: result.answer, solution: result.explanation },
      });
      stats.solved++;
      return;
    } catch { /* db error, retry */ }
  }
  stats.errors++;
}

async function workerLoop(
  queue: Array<{ id: string; questionText: string; options: string | null; questionType: string }>,
  stats: { solved: number; errors: number; done: number; total: number },
) {
  while (true) {
    const q = queue.shift();
    if (!q) break;
    await solveWithRetry(q, stats);
    stats.done++;
    if (stats.done % 10 === 0 || stats.done === stats.total) {
      const pct = ((stats.done / stats.total) * 100).toFixed(1);
      const s = ((Date.now() - startTime) / 1000).toFixed(0);
      const r = stats.solved > 0 ? (stats.solved / (Date.now() - startTime) * 60000).toFixed(1) : '0';
      process.stdout.write(`\r  [${stats.done}/${stats.total} ${pct}%] ✅${stats.solved} ❌${stats.errors} | ${r}/min | ${s}s    `);
    }
  }
}

const startTime = Date.now();

async function main() {
  const { limit } = parseArgs();
  const totalUnsolved = await db.question.count({ where: { correctAnswer: null } });

  const questions = await db.question.findMany({
    where: { correctAnswer: null },
    select: { id: true, questionText: true, options: true, questionType: true },
    orderBy: { id: 'asc' },
    take: limit || 100000,
  });

  console.log(`\n  🚀 Solve Runner | Workers: ${CONCURRENCY} | Queue: ${questions.length} | Remaining: ${totalUnsolved}\n`);

  const stats = { solved: 0, errors: 0, done: 0, total: questions.length };
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, questions.length) }, () => workerLoop(questions, stats)),
  );

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\n\n  ✅ Done! ${stats.solved}/${stats.total} solved in ${elapsed}s\n`);

  const rem = await db.question.count({ where: { correctAnswer: null } });
  const ans = await db.question.count({ where: { correctAnswer: { not: null } } });
  console.log(`  DB: ${ans} answered, ${rem} remaining\n`);

  await db.$disconnect();
}

main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });