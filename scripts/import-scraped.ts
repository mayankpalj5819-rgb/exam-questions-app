import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient({
  datasourceUrl: "file:/home/z/my-project/db/custom.db",
});

function parseYear(meta: string): number | null {
  const m = meta.match(/(20\d{2})/);
  return m ? parseInt(m[1]) : null;
}

function parseShift(meta: string): string {
  if (meta.includes("Morning")) return "Morning Shift";
  if (meta.includes("Evening")) return "Evening Shift";
  if (meta.includes("Afternoon")) return "Afternoon Shift";
  if (meta.includes("Shift 1") || meta.includes("Paper 1")) return "Shift 1";
  if (meta.includes("Shift 2") || meta.includes("Paper 2")) return "Shift 2";
  return "";
}

function detectType(text: string): string {
  if (/\(A\)/.test(text) && /\(B\)/.test(text)) return "MCQ";
  if (text.includes("Choose the correct") || text.includes("correct answer")) return "MCQ";
  return "Numerical";
}

async function main() {
  const dir = process.argv[2] || "/tmp/scraped";
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort();
  
  console.log(`Importing ${files.length} files from ${dir}`);

  // Build lookups
  const allChapters = await db.chapter.findMany({ include: { subject: true } });
  const chapterMap = new Map<string, any>();
  for (const ch of allChapters) {
    chapterMap.set(`${ch.examType}_${ch.subject.slug}_${ch.slug}`, ch);
  }
  const subjectMap = new Map<string, any>();
  for (const ch of allChapters) {
    if (!subjectMap.has(ch.subject.slug)) subjectMap.set(ch.subject.slug, ch.subject);
  }

  let totalImported = 0;
  let totalSkipped = 0;

  for (const file of files) {
    // Parse: exam_subject_slug.json
    const base = file.replace(".json", "");
    const first_ = base.indexOf("_");
    const exam = base.substring(0, first_); // "jee-main" or "jee-advanced"
    const rest = base.substring(first_ + 1);
    const second_ = rest.indexOf("_");
    const subject = rest.substring(0, second_); // "physics"
    const slug = rest.substring(second_ + 1); // "electrostatics"

    let data: any;
    try {
      data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    } catch { continue; }

    // Support both {q: [...]} and {questions: [...]} formats
    const questions = data.q || data.questions || [];
    if (!questions.length) continue;

    const subj = subjectMap.get(subject);
    if (!subj) { console.log(`  SKIP ${file}: no subject ${subject}`); continue; }

    const chapter = chapterMap.get(`${exam}_${subject}_${slug}`);

    let saved = 0, skipped = 0;
    for (const q of questions) {
      const text = q.t || q.qt || q.questionText || "";
      const meta = q.m || q.meta || q.metaText || "";
      const url = q.u || q.url || q.sourceUrl || "";
      const year = parseYear(meta);
      if (!year || year < 2000 || year > 2026) { skipped++; continue; }

      const shift = parseShift(meta);
      const questionType = detectType(text);
      const examType = meta.includes("Advanced") ? "jee-advanced" : exam;

      try {
        await db.question.create({
          data: {
            questionText: text,
            questionType,
            year,
            exam: examType,
            shift: shift || null,
            subjectId: subj.id,
            chapterId: chapter?.id || null,
            sourceUrl: url ? `https://questions.examside.com${url}` : null,
            sourceOrder: q.i ?? q.sourceOrder ?? 0,
          },
        });
        saved++;
      } catch { skipped++; }
    }

    // Update chapter count
    if (chapter) {
      const count = await db.question.count({ where: { chapterId: chapter.id } });
      await db.chapter.update({ where: { id: chapter.id }, data: { questionCount: count } });
    }

    totalImported += saved;
    totalSkipped += skipped;
    console.log(`  ${file}: ${saved} imported, ${skipped} skipped`);
  }

  console.log(`\n✅ Total: ${totalImported} imported, ${totalSkipped} skipped`);
  const dbCount = await db.question.count();
  console.log(`📊 DB now has ${dbCount} questions`);
}

main().catch(console.error).finally(() => db.$disconnect());