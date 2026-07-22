/**
 * sdk-solve.ts — Ultra-fast batch solver using z-ai-web-dev-sdk directly (no CLI overhead).
 * Run multiple instances with different --offset for parallelism.
 *
 * Usage:
 *   npx tsx scripts/sdk-solve.ts --limit 1000
 *   npx tsx scripts/sdk-solve.ts --offset 0 --limit 2000    (instance 1)
 *   npx tsx scripts/sdk-solve.ts --offset 2000 --limit 2000  (instance 2)
 */
import { PrismaClient } from '@prisma/client';
import ZAI from 'z-ai-web-dev-sdk';

const CONCURRENCY = 20;

const SYSTEM_PROMPT = `You are a JEE expert tutor. Solve the given JEE question.
Return ONLY valid JSON with no markdown fences: {"answer":"...","explanation":"..."}
Rules:
- For MCQ: answer = single letter A/B/C/D/E
- For Numerical: answer = number only (integer or decimal, no units)
- explanation = 2-4 sentence concise solution`;

const db = new PrismaClient({ datasourceUrl: 'file:/home/z/my-project/db/custom.db' });

function parseArgs() {
  const args = process.argv.slice(2);
  let limit: number | undefined, offset: number | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) { limit = parseInt(args[i + 1]); i++; }
    if (args[i] === '--offset' && args[i + 1]) { offset = parseInt(args[i + 1]); i++; }
  }
  return { limit, offset };
}

function parseResponse(raw: string): { answer: string; explanation: string } | null {
  // Try direct JSON
  try {
    const p = JSON.parse(raw.trim());
    if (p.answer && typeof p.answer === 'string') return { answer: p.answer.trim(), explanation: p.explanation || '' };
  } catch {}

  // Extract from code fences
  const fm = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fm) try { const p = JSON.parse(fm[1].trim()); if (p.answer) return { answer: p.answer.trim(), explanation: p.explanation || '' }; } catch {}

  // Find JSON object
  const bm = raw.match(/\{[\s\S]*\}/);
  if (bm) try { const p = JSON.parse(bm[0]); if (p.answer) return { answer: p.answer.trim(), explanation: p.explanation || '' }; } catch {}

  // Regex fallback
  const am = raw.match(/"answer"\s*:\s*"([^"]+)"/);
  if (am) return { answer: am[1].trim(), explanation: '' };

  return null;
}

function normalizeAnswer(ans: string, qType: string): string {
  const a = ans.trim().toUpperCase();
  if (qType === 'MCQ' || qType === 'mcq') {
    const m = a.match(/^([A-E])\b/);
    if (m) return m[1];
  }
  // For MCQ without clean letter, try extracting
  if (qType === 'MCQ' || qType === 'mcq') {
    const m = ans.match(/([A-E])/i);
    if (m) return m[1].toUpperCase();
  }
  return ans.trim();
}

let zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function solveOne(q: { id: string; questionText: string; options: string | null; questionType: string }): Promise<boolean> {
  try {
    if (!zai) zai = await ZAI.create();

    let prompt = q.questionText.slice(0, 4000);
    if (q.options?.trim()) prompt += `\n\nOptions:\n${q.options.slice(0, 2000)}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      thinking: { type: 'disabled' },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return false;

    const parsed = parseResponse(raw);
    if (!parsed) return false;

    const answer = normalizeAnswer(parsed.answer, q.questionType);

    await db.question.update({
      where: { id: q.id },
      data: { correctAnswer: answer, solution: parsed.explanation },
    });
    return true;
  } catch {
    return false;
  }
}

async function workerLoop(
  queue: Array<{ id: string; questionText: string; options: string | null; questionType: string }>,
  stats: { solved: number; errors: number; done: number; total: number },
) {
  while (true) {
    const q = queue.shift();
    if (!q) break;
    const ok = await solveOne(q);
    stats.done++;
    if (ok) stats.solved++; else stats.errors++;
    if (stats.done % 25 === 0 || stats.done === stats.total) {
      const pct = ((stats.done / stats.total) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = stats.done > 0 ? (stats.solved / (Date.now() - startTime) * 60000).toFixed(1) : '0';
      process.stdout.write(`\r  [${stats.done}/${stats.total} ${pct}%] Solved: ${stats.solved} | Fail: ${stats.errors} | ${rate}/min | ${elapsed}s   `);
    }
  }
}

const startTime = Date.now();

async function main() {
  const { limit, offset } = parseArgs();
  const totalUnsolved = await db.question.count({ where: { correctAnswer: null } });

  // Get unsolved question IDs
  const unsolvedIds = await db.question.findMany({
    where: { correctAnswer: null },
    select: { id: true },
    orderBy: { id: 'asc' },
    skip: offset || 0,
    take: limit || 100000,
  });

  console.log(`\n  SDK Batch Solver`);
  console.log(`  Workers: ${CONCURRENCY} | Batch: ${unsolvedIds.length} | Remaining: ${totalUnsolved}\n`);

  // Fetch full question data
  const questions = await db.question.findMany({
    where: { id: { in: unsolvedIds.map(q => q.id) } },
    select: { id: true, questionText: true, options: true, questionType: true },
    orderBy: { id: 'asc' },
  });

  const stats = { solved: 0, errors: 0, done: 0, total: questions.length };
  const workers = Array.from({ length: Math.min(CONCURRENCY, questions.length) }, () =>
    workerLoop(questions, stats),
  );

  await Promise.all(workers);

  console.log(`\n\n  ✅ Done! Solved: ${stats.solved}/${stats.total} in ${((Date.now() - startTime) / 1000).toFixed(0)}s\n`);

  const remaining = await db.question.count({ where: { correctAnswer: null } });
  const withAns = await db.question.count({ where: { correctAnswer: { not: null } } });
  console.log(`  DB: ${withAns} answered, ${remaining} remaining\n`);

  await db.$disconnect();
}

main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });