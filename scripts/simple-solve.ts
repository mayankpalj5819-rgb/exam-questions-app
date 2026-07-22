import { PrismaClient } from '@prisma/client';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const WORKERS = 3, DELAY = 600, TIMEOUT = 50_000, RETRIES = 2;
const SYS = `JEE expert. Return ONLY JSON no markdown: {"answer":"A","explanation":"brief solution"}\nMCQ: answer=A/B/C/D/E. Numerical: answer=number only.`;
const db = new PrismaClient({ datasourceUrl: 'file:/home/z/my-project/db/custom.db' });
const limit = parseInt(process.argv[2] || '200');

function zai(prompt: string): Promise<{ answer: string; explanation: string } | null> {
  return new Promise(res => {
    const f = path.join(os.tmpdir(), `z${Date.now()}-${Math.random().toString(36).slice(2, 6)}.json`);
    execFile('z-ai', ['chat', '--prompt', prompt.slice(0, 4000), '--system', SYS, '-o', f],
      { timeout: TIMEOUT, encoding: 'utf-8' as const }, () => {
        try {
          if (!fs.existsSync(f)) { res(null); return; }
          const raw = fs.readFileSync(f, 'utf-8').trim();
          if (!raw) { res(null); return; }
          const c = JSON.parse(raw).choices?.[0]?.message?.content || '';
          if (!c) { res(null); return; }
          let js = c;
          const fm = c.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (fm) js = fm[1].trim();
          else { const bm = c.match(/\{[\s\S]*\}/); if (bm) js = bm[0]; }
          const p = JSON.parse(js);
          if (!p.answer) { res(null); return; }
          let a = p.answer.trim().toUpperCase();
          const m = a.match(/([A-E])/);
          res(m ? { answer: m[1], explanation: p.explanation || '' } : { answer: p.answer.trim(), explanation: p.explanation || '' });
        } catch { res(null); }
        finally { try { fs.unlinkSync(f); } catch { } }
      });
  });
}

const wait = ms => new Promise(r => setTimeout(r, ms));
let ok = 0, fail = 0, done = 0;

async function solve(q: { id: string; questionText: string; options: string | null }) {
  try {
    let p = q.questionText.slice(0, 3500);
    if (q.options?.trim()) p += `\nOptions: ${q.options.slice(0, 1000)}`;
    for (let i = 0; i < RETRIES; i++) {
      await wait(DELAY);
      const r = await zai(p);
      if (!r) continue;
      try { await db.question.update({ where: { id: q.id }, data: { correctAnswer: r.answer, solution: r.explanation } }); ok++; return; } catch { }
    }
    fail++;
  } catch { fail++; }
}

async function main() {
  const qs = await db.question.findMany({
    where: { correctAnswer: null },
    select: { id: true, questionText: true, options: true },
    orderBy: { id: 'asc' },
    take: limit,
  });
  console.log(`Solving ${qs.length} questions with ${WORKERS} workers...`);
  const queue = [...qs];
  await Promise.all(Array.from({ length: Math.min(WORKERS, qs.length) }, () => (async () => {
    while (queue.length > 0) {
      try { await solve(queue.shift()!); done++; if (done % 10 === 0) process.stdout.write(`\r${done}/${qs.length} ok=${ok} fail=${fail} `); }
      catch { done++; fail++; }
    }
  })()));
  console.log(`\nDone: ${ok} solved, ${fail} failed`);
  const rem = await db.question.count({ where: { correctAnswer: null } });
  console.log(`DB: ${61991 - rem} total answered, ${rem} remaining`);
  await db.$disconnect();
}

main().catch(async e => { console.error(e); await db.$disconnect(); process.exit(1); });