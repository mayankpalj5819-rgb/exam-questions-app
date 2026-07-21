// batch-solve.js — Fast batch solver (plain JS, no TS compilation)
// Usage: node scripts/batch-solve.js --chunk <id> --total <chunks>

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : "";
}

const CHUNK = parseInt(getArg("chunk") || "0");
const TOTAL = parseInt(getArg("total") || "1");
const BATCH = 5;
const DELAY = 2000;
const LOG = `/home/z/my-project/solve-chunk-${CHUNK}.log`;

function log(m) {
  const line = `[${new Date().toISOString()}] [C${CHUNK}] ${m}`;
  console.log(line);
  try { fs.appendFileSync(LOG, line + "\n"); } catch {}
}

async function main() {
  log("Starting...");
  
  const { PrismaClient } = require("@prisma/client");
  const db = new PrismaClient();
  
  let ZAI;
  try {
    ZAI = require("z-ai-web-dev-sdk").default;
  } catch(e) {
    log("FATAL: Cannot load SDK");
    process.exit(1);
  }
  
  let zai;
  try {
    zai = await ZAI.create();
    log("SDK ready");
  } catch(e) {
    log("FATAL: SDK init failed: " + e.message);
    process.exit(1);
  }

  const where = { OR: [{ solution: null }, { solution: "" }] };
  const total = await db.question.count({ where });
  const perChunk = Math.ceil(total / TOTAL);
  const skip = CHUNK * perChunk;
  
  log(`Unsolved: ${total}, my share: ~${perChunk} (offset ${skip})`);

  const questions = await db.question.findMany({
    where,
    select: { id: true, questionText: true, questionType: true, correctAnswer: true },
    skip,
    take: perChunk,
    orderBy: { id: "asc" },
  });

  log(`Fetched ${questions.length} questions`);
  let solved = 0, failed = 0;

  for (let i = 0; i < questions.length; i += BATCH) {
    const batch = questions.slice(i, i + BATCH);
    const bn = Math.floor(i / BATCH) + 1;
    const bt = Math.ceil(questions.length / BATCH);

    const qBlocks = batch.map((q, idx) => {
      const txt = q.questionText.replace(/\\n/g, "\n").slice(0, 800);
      return `Q${idx+1}[${q.id.slice(-5)}] (${q.questionType}): ${txt}`;
    });

    const prompt = `Solve these JEE questions. For each, give ANSWER and SOLUTION.
Format:
Q1
ANSWER: <A/B/C/D or number>
SOLUTION: <steps>

${qBlocks.join("\n---\n")}`;

    try {
      const comp = await Promise.race([
        zai.chat.completions.create({
          messages: [
            { role: "assistant", content: "You are a JEE expert. Solve physics/chemistry/math questions. Use $ for inline LaTeX. Be concise but thorough." },
            { role: "user", content: prompt },
          ],
          thinking: { type: "disabled" },
        }),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 45000)),
      ]);

      const resp = comp.choices[0]?.message?.content || "";
      const parts = resp.split(/Q\d+\s*\[/);

      for (let j = 0; j < batch.length; j++) {
        const part = parts[j + 1] || parts[parts.length - 1] || "";
        const ansMatch = part.match(/ANSWER:\s*([A-Da-d]|\d+\.?\d*)/i);
        const solMatch = part.match(/SOLUTION:\s*([\s\S]+?)(?=Q\d|$)/i);

        const answer = ansMatch ? ansMatch[1].trim().toUpperCase() : null;
        const solution = solMatch ? solMatch[1].trim().slice(0, 2000) : null;

        if (answer || solution) {
          const data = {};
          if (solution) data.solution = solution;
          if (answer && answer.length <= 10) data.correctAnswer = answer;
          
          try {
            await db.question.update({ where: { id: batch[j].id }, data });
            solved++;
          } catch(e) { failed++; }
        } else {
          failed++;
        }
      }

      log(`Batch ${bn}/${bt}: +${solved} solved, ${failed} failed`);
    } catch(e) {
      log(`Batch ${bn} error: ${e.message}`);
      failed += batch.length;
    }

    if (i + BATCH < questions.length) {
      await new Promise(r => setTimeout(r, DELAY));
    }
  }

  log(`DONE: ${solved} solved, ${failed} failed out of ${questions.length}`);
  await db.$disconnect();
}

main().catch(e => { log("FATAL: " + e.message); process.exit(1); });