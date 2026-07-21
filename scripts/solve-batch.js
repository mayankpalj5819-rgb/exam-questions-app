// solve-batch.js — Fast batch solver, 5 questions per LLM call
const fs = require("fs");
const LOG = "/home/z/my-project/solve-progress.log";
function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); try { fs.appendFileSync(LOG, l+"\n"); } catch {} }

async function main() {
  log("START");
  const { PrismaClient } = require("@prisma/client");
  const db = new PrismaClient();
  const ZAI = require("z-ai-web-dev-sdk").default;
  const zai = await ZAI.create();
  log("SDK ready");

  let solved = 0, failed = 0, total = 0, cursor = "";
  const BATCH = 5, DELAY = 1200, MAX = 5000;

  while (total < MAX) {
    const qs = await db.question.findMany({
      where: { OR: [{ solution: null }, { solution: "" }] },
      select: { id: true, questionText: true, questionType: true },
      take: BATCH, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: "asc" },
    });
    if (!qs.length) { log("ALL DONE"); break; }
    cursor = qs[qs.length - 1].id;
    total += qs.length;

    const blocks = qs.map((q, i) => `[Q${i+1}] (${q.questionType}):\n${q.questionText.replace(/\\n/g, "\n").slice(0, 500)}`).join("\n\n---\n\n");

    try {
      const comp = await Promise.race([
        zai.chat.completions.create({
          messages: [
            { role: "assistant", content: `Solve ALL ${BATCH} JEE questions below. For EACH question, provide exactly:
[Q1]
ANSWER: <A or B or C or D for MCQ, or a number for Numerical>
SOLUTION: <concise steps with $LaTeX$>

Rules:
- Answer MUST be a single letter (A/B/C/D) or a number only
- Solution should be 3-8 lines max
- Do NOT use markdown headers (###)
- Do NOT skip any question` },
            { role: "user", content: blocks },
          ],
          thinking: { type: "disabled" },
        }),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 50000)),
      ]);

      const resp = comp.choices[0]?.message?.content || "";
      
      // Split by [Q<digit>] markers
      const parts = resp.split(/\[Q\d+\]/).filter(Boolean);
      
      for (let j = 0; j < qs.length; j++) {
        const part = parts[j] || "";
        // Extract answer
        let answer = null;
        const ansMatch = part.match(/ANSWER:\s*([A-Da-d]|\d+\.?\d*)/i);
        if (ansMatch) answer = ansMatch[1].trim().toUpperCase();
        
        // Extract solution (everything after SOLUTION: until next [Q or end)
        let solution = "";
        const solMatch = part.match(/SOLUTION:\s*([\s\S]+?)(?=\[Q\d+\]|$)/i);
        if (solMatch) solution = solMatch[1].trim().replace(/[*#`]/g, "").slice(0, 2000);
        // Fallback: if no SOLUTION marker, take everything after ANSWER line
        if (!solution && part.length > 30) {
          const afterAns = part.replace(/ANSWER:.*\n?/i, "").trim();
          if (afterAns.length > 15) solution = afterAns.slice(0, 2000);
        }

        const data = {};
        if (solution.length > 15) data.solution = solution;
        if (answer && answer.length <= 10) data.correctAnswer = answer;

        if (Object.keys(data).length) {
          try { await db.question.update({ where: { id: qs[j].id }, data }); solved++; } catch { failed++; }
        } else { failed++; }
      }
    } catch(e) {
      log(`Err: ${e.message?.slice(0, 60)}`);
      failed += qs.length;
    }

    log(`${solved}✓ ${failed}✗ | ${total}/${MAX} | ${cursor.slice(-6)}`);
    await new Promise(r => setTimeout(r, DELAY));
  }

  log(`COMPLETE: ${solved} solved, ${failed} failed`);
  await db.$disconnect();
}

main().catch(e => { log("FATAL: " + e.message); process.exit(1); });