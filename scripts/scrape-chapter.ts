// scrape-chapter.ts - Scrape one chapter in chunks via agent-browser
// Usage: npx tsx scripts/scrape-chapter.ts <examType> <subject> <slug> <outputDir>
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const EXAM = process.argv[2];
const SUBJ = process.argv[3];
const SLUG = process.argv[4];
const DIR = process.argv[5] || "/tmp/scraped";

const URL = `https://questions.examside.com/past-years/jee/${EXAM}/${SUBJ}/${SLUG}`;
const OUT_FILE = path.join(DIR, `${EXAM}_${SUBJ}_${SLUG}.json`);

function run(args: string[], timeout = 20000): string {
  try {
    const r = spawnSync("agent-browser", args, {
      timeout,
      maxBuffer: 10 * 1024 * 1024,
      encoding: "utf-8",
    });
    return (r.stdout || "").trim();
  } catch {
    return "";
  }
}

function main() {
  fs.mkdirSync(DIR, { recursive: true });

  // Skip if already done
  if (fs.existsSync(OUT_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUT_FILE, "utf-8"));
      if (existing.q?.length > 0) {
        console.log(`SKIP ${SLUG} (${existing.q.length} done)`);
        return;
      }
    } catch {}
  }

  console.log(`SCRAPE ${SLUG}`);

  // Close any existing
  run(["close"], 10000);

  // Open page
  const openResult = run(["open", URL], 40000);
  if (!openResult.includes("http")) {
    console.log(`  FAIL: could not open ${URL}`);
    return;
  }

  // Wait
  run(["wait", "--load", "networkidle"], 20000);

  // Get count
  const countStr = run(["eval", 'document.querySelectorAll(\'a.flex.gap-2[href*="/past-years/jee/question/"]\').length']);
  const total = parseInt(countStr.replace(/"/g, "")) || 0;
  console.log(`  Found ${total} questions`);

  if (total === 0) {
    fs.writeFileSync(OUT_FILE, JSON.stringify({ q: [], n: 0 }));
    run(["close"], 10000);
    console.log(`  → 0 questions`);
    return;
  }

  // Extract in chunks of 45
  const CHUNK = 45;
  const allQuestions: any[] = [];

  for (let start = 0; start < total; start += CHUNK) {
    const end = Math.min(start + CHUNK, total);
    const jsCode = `(()=>{const cs=document.querySelectorAll('a.flex.gap-2[href*="/past-years/jee/question/"]');const r=[];for(let i=${start};i<${end};i++){const c=cs[i];if(!c)continue;const f=c.querySelector('.flex.flex-col');if(!f)continue;const t=f.children[0];if(!t)continue;r.push({t:t.textContent.trim().substring(0,1500),m:f.children[1]?f.children[1].textContent.trim():"",u:c.getAttribute("href")||"",i})}return JSON.stringify(r)})`;
    
    const output = run(["eval", jsCode], 20000);
    try {
      // Strip outer quotes if present
      let cleaned = output;
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\"/g, '\\"');
      }
      const chunk = JSON.parse(cleaned);
      if (Array.isArray(chunk)) {
        allQuestions.push(...chunk);
      }
    } catch (e: any) {
      console.log(`  Chunk ${start}-${end} parse error: ${e.message?.substring(0, 80)}`);
    }
    console.log(`  Chunk ${start}-${end}: ${allQuestions.length}/${total}`);
  }

  const result = { q: allQuestions, n: allQuestions.length };
  fs.writeFileSync(OUT_FILE, JSON.stringify(result));
  console.log(`  → Saved ${allQuestions.length} questions`);

  run(["close"], 10000);
}

main();