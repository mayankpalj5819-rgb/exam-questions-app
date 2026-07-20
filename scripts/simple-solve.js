/**
 * Simple single-worker batch solver
 * node scripts/simple-solve.js
 */
const ZAI = require('z-ai-web-dev-sdk').default;
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient({ datasourceUrl: 'file:/home/z/my-project/db/custom.db' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

function parseResponse(raw) {
  try { const p = JSON.parse(raw.trim()); if (p.answer != null) return { answer: String(p.answer), explanation: p.explanation || '' }; } catch {}
  const f = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (f) { try { const p = JSON.parse(f[1].trim()); if (p.answer != null) return { answer: String(p.answer), explanation: p.explanation || '' }; } catch {} }
  const b = raw.match(/\{[\s\S]*\}/);
  if (b) { try { const p = JSON.parse(b[0]); if (p.answer != null) return { answer: String(p.answer), explanation: p.explanation || '' }; } catch {} }
  const a = raw.match(/"answer"\s*:\s*"([^"]+)"/);
  if (a) return { answer: a[1], explanation: '' };
  return null;
}

async function main() {
  console.log('Init SDK...');
  const zai = await ZAI.create();
  
  const total = await db.question.count({ where: { correctAnswer: null } });
  console.log(`Unsolved: ${total}`);
  
  let cursor = undefined;
  let processed = 0;
  let solved = 0, errs = 0;
  const startTime = Date.now();
  
  while (processed < 10000) {
    const questions = await db.question.findMany({
      where: { correctAnswer: null },
      select: { id: true, questionText: true, options: true, questionType: true },
      take: 100,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
    });
    if (!questions.length) break;
    cursor = questions[questions.length - 1].id;
    
    for (const q of questions) {
      let success = false;
      for (let retry = 0; retry < 3 && !success; retry++) {
        try {
          const sys = q.questionType === 'MCQ' 
            ? 'JEE expert. Return {"answer":"A/B/C/D/E","explanation":"brief"}. JSON only.'
            : 'JEE expert. Return {"answer":"number only no units","explanation":"brief"}. JSON only.';
          let prompt = q.questionText || '';
          if (q.options && q.options !== 'undefined' && q.options !== 'null') prompt += '\nOptions: ' + q.options;
          
          const c = await zai.chat.completions.create({
            messages: [{ role: 'assistant', content: sys }, { role: 'user', content: prompt }],
            thinking: { type: 'disabled' },
          });
          
          const raw = c.choices[0]?.message?.content;
          if (!raw) throw new Error('Empty');
          
          const parsed = parseResponse(raw);
          if (!parsed?.answer) throw new Error('No parse');
          
          let ans = parsed.answer.trim();
          if (q.questionType === 'MCQ') { const m = ans.match(/^([A-E])\b/i); if (m) ans = m[1].toUpperCase(); }
          
          await db.question.update({ where: { id: q.id }, data: { correctAnswer: ans, solution: parsed.explanation } });
          solved++;
          success = true;
        } catch (e) {
          if (e.message?.includes('429')) {
            console.log(`[429] Backing off 15s...`);
            await sleep(15000);
          } else {
            errs++;
            success = true; // Don't retry non-429 errors
          }
        }
      }
      processed++;
      if (processed % 5 === 0) {
        const rate = (solved / Math.max((Date.now()-startTime)/60000, 0.1)).toFixed(1);
        console.log(`[${processed}] Solved:${solved} Err:${errs} Rate:${rate}/min`);
      }
      await sleep(500); // Rate limit protection
    }
  }
  
  console.log(`\nDone. Solved:${solved} Errs:${errs}`);
  await db.$disconnect();
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });