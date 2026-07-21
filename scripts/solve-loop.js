// solve-loop.js — Robust continuous solver
const fs = require("fs");
const LOG = "/home/z/my-project/solve-progress.log";
function log(m) { 
  const line = `[${new Date().toISOString()}] ${m}`; 
  console.log(line); 
  try { fs.appendFileSync(LOG, line + "\n"); } catch {} 
}

async function main() {
  log("START");
  const { PrismaClient } = require("@prisma/client");
  const db = new PrismaClient();
  const ZAI = require("z-ai-web-dev-sdk").default;
  const zai = await ZAI.create();
  log("SDK ready");

  let solved = 0, failed = 0, total = 0, cursor = "";
  const MAX = 5000, DELAY = 2000;

  while (total < MAX) {
    const qs = await db.question.findMany({
      where: { OR: [{ solution: null }, { solution: "" }] },
      select: { id: true, questionText: true, questionType: true },
      take: 3, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: "asc" },
    });
    if (!qs.length) { log("ALL DONE"); break; }
    cursor = qs[qs.length - 1].id;
    total += qs.length;

    // Solve each question individually for reliability
    for (const q of qs) {
      const txt = q.questionText.replace(/\\n/g, "\n").slice(0, 700);
      const typeHint = q.questionType === "MCQ" 
        ? "This is MCQ. Answer must be exactly one letter: A, B, C, or D." 
        : "This is Numerical type. Answer must be a number (integer or decimal).";

      try {
        const comp = await Promise.race([
          zai.chat.completions.create({
            messages: [
              { role: "assistant", content: `You are a JEE expert tutor. Solve the question.
${typeHint}

You MUST respond in this EXACT format (no markdown, no headers):
ANSWER: <single letter A/B/C/D or a number>
SOLUTION: <your step-by-step solution with $LaTeX$ math>` },
              { role: "user", content: txt },
            ],
            thinking: { type: "disabled" },
          }),
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 30000)),
        ]);

        const resp = comp.choices[0]?.message?.content || "";
        
        // Extract answer - first line after ANSWER:
        const ansLine = (resp.match(/ANSWER:\s*(.+)/i) || [])[1]?.trim() || "";
        // Clean: just get a letter or number
        let answer = null;
        const letterMatch = ansLine.match(/^([A-Da-d])\b/);
        const numMatch = ansLine.match(/^(\d+\.?\d*)/);
        if (letterMatch) answer = letterMatch[1].toUpperCase();
        else if (numMatch) answer = numMatch[1];
        
        // Extract solution - everything after SOLUTION:
        const solMatch = resp.match(/SOLUTION:\s*([\s\S]+)/i);
        let solution = solMatch ? solMatch[1].trim() : "";

        // If no explicit SOLUTION marker, use the whole response minus the answer line
        if (!solution && resp.length > 30) {
          solution = resp.replace(/ANSWER:.*\n?/i, "").trim().slice(0, 2000);
        }

        const data = {};
        if (solution.length > 15) data.solution = solution.slice(0, 2000);
        if (answer) data.correctAnswer = answer;

        if (Object.keys(data).length) {
          await db.question.update({ where: { id: q.id }, data });
          solved++;
        } else { failed++; }
      } catch(e) {
        log(`Err: ${e.message?.slice(0, 60)}`);
        failed++;
      }
    }

    log(`${solved}✓ ${failed}✗ | ${total}/${MAX} | ${cursor.slice(-6)}`);
    await new Promise(r => setTimeout(r, DELAY));
  }

  log(`COMPLETE: ${solved} solved, ${failed} failed`);
  await db.$disconnect();
}

main().catch(e => { log("FATAL: " + e.message); process.exit(1); });