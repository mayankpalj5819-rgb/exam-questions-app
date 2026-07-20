/**
 * fast-batch-solve.js — Batch solver with rate-limit handling
 * Usage: node scripts/fast-batch-solve.js --limit 500 --concurrency 3
 */
const ZAI = require('z-ai-web-dev-sdk').default;
const { PrismaClient } = require('@prisma/client');

const args = process.argv.slice(2);
let limit = 500;
let CONCURRENCY = 3;
let examArg = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limit') limit = parseInt(args[++i]) || 500;
  if (args[i] === '--concurrency') CONCURRENCY = parseInt(args[++i]) || 3;
  if (args[i] === '--exam') examArg = args[++i];
}

const db = new PrismaClient({ datasourceUrl: 'file:/home/z/my-project/db/custom.db' });
let zai = null;
let solved = 0, errors = 0, rateLimited = 0;
const start = Date.now();

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function parseResponse(raw) {
  try { const p = JSON.parse(raw.trim()); if (p.answer) return p; } catch {}
  const f = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (f) { try { return JSON.parse(f[1].trim()); } catch {} }
  const b = raw.match(/\{[\s\S]*\}/);
  if (b) { try { return JSON.parse(b[0]); } catch {} }
  const a = raw.match(/"answer"\s*:\s*"([^"]+)"/);
  if (a) return { answer: a[1], explanation: '' };
  return null;
}

async function solveWithRetry(question, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const sysPrompt = `JEE tutor. MCQ: {"answer":"A/B/C/D/E","explanation":"brief step-by-step"}. Numerical: {"answer":"number only","explanation":"brief"}. JSON only.`;
      let userPrompt = question.questionText || '';
      if (question.options && question.options !== 'undefined' && question.options !== 'null') {
        userPrompt += '\nOptions: ' + question.options;
      }

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: sysPrompt },
          { role: 'user', content: userPrompt },
        ],
        thinking: { type: 'disabled' },
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error('Empty response');

      const parsed = parseResponse(raw);
      if (!parsed?.answer) throw new Error('Parse failed');

      let answer = String(parsed.answer).trim();
      if (answer === 'undefined' || answer === 'null' || !answer) throw new Error('Empty answer');
      if (question.questionType === 'MCQ') {
        const m = answer.toUpperCase().match(/^([A-E])\b/);
        if (m) answer = m[1];
      }

      await db.question.update({
        where: { id: question.id },
        data: { correctAnswer: answer, solution: parsed.explanation || '' },
      });

      solved++;
      if (solved % 10 === 0) {
        const rate = (solved / (Date.now() - start) * 60000).toFixed(1);
        console.log(`[${((Date.now()-start)/1000).toFixed(0)}s] Solved: ${solved} | Errors: ${errors} | Rate: ${rate}/min`);
      }
      return true;
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('429') || msg.includes('Too many')) {
        rateLimited++;
        const delay = 2000 * Math.pow(2, attempt) + Math.random() * 1000;
        if (rateLimited <= 3 || rateLimited % 50 === 0) {
          console.log(`[429] Rate limited. Waiting ${Math.round(delay/1000)}s (attempt ${attempt+1}/${maxRetries})`);
        }
        await sleep(delay);
        continue;
      }
      errors++;
      if (errors <= 10) console.error(`[ERR] ${question.id?.slice(0,8)}: ${msg.slice(0,100)}`);
      return false;
    }
  }
  errors++;
  return false;
}

async function worker(queue) {
  while (true) {
    const q = queue.shift();
    if (!q) break;
    await solveWithRetry(q);
    // Small delay between requests to avoid rate limiting
    await sleep(300);
  }
}

async function main() {
  console.log('Initializing z-ai SDK...');
  zai = await ZAI.create();
  console.log('SDK ready.');

  const where = { correctAnswer: null };
  if (examArg) where.exam = examArg;
  const total = await db.question.count({ where });
  const effectiveLimit = Math.min(limit, total);
  console.log(`Unsolved: ${total}. Processing: ${effectiveLimit} with ${CONCURRENCY} workers.\n`);

  if (effectiveLimit === 0) { console.log('All done!'); await db.$disconnect(); return; }

  const allQuestions = [];
  let cursor = undefined;
  while (allQuestions.length < effectiveLimit) {
    const batch = await db.question.findMany({
      where,
      select: { id: true, questionText: true, options: true, questionType: true },
      take: Math.min(2000, effectiveLimit - allQuestions.length),
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
    });
    if (!batch.length) break;
    cursor = batch[batch.length - 1].id;
    allQuestions.push(...batch);
  }
  console.log(`Loaded ${allQuestions.length} questions. Starting...\n`);

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) workers.push(worker(allQuestions));
  await Promise.all(workers);

  const elapsed = ((Date.now() - start) / 1000);
  const rate = (solved / Math.max(elapsed, 1) * 60).toFixed(1);
  console.log(`\n${'='.repeat(50)}`);
  console.log(`DONE in ${Math.floor(elapsed/60)}m ${Math.floor(elapsed%60)}s | Solved: ${solved} | Errors: ${errors} | Rate: ${rate}/min`);
  console.log(`${'='.repeat(50)}`);
  await db.$disconnect();
}

main().catch(async (e) => { console.error('FATAL:', e); await db.$disconnect(); process.exit(1); });