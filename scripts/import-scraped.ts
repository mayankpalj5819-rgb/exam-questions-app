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
  
  console.log(`Importing ${files.length} scraped files from ${dir}`);

  // Build chapter lookup
  const allChapters = await db.chapter.findMany({ include: { subject: true } });
  const chapterMap = new Map<string, any>();
  for (const ch of allChapters) {
    const key = `${ch.examType}_${ch.subject.slug}_${ch.slug}`;
    chapterMap.set(key, ch);
  }

  const subjectMap = new Map<string, any>();
  for (const ch of allChapters) {
    if (!subjectMap.has(ch.subject.slug)) subjectMap.set(ch.subject.slug, ch.subject);
  }

  let totalImported = 0;
  let totalDupes = 0;
  let totalErrors = 0;

  for (const file of files) {
    // Parse filename: examtype_subject_chapterSlug.json
    const base = file.replace(".json", "");
    const parts = base.split("_"); // e.g., jee-main_physics_electrostatics
    if (parts.length < 3) continue;
    
    const examType = parts[0] + "_" + parts[1]; // jee-main
    const subjectSlug = parts[2]; // physics
    const chapterSlug = parts.slice(3).join("_"); // electrostatics (handle slugs with hyphens)

    const filePath = path.join(dir, file);
    let data: any;
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      data = JSON.parse(raw);
    } catch {
      console.log(`  SKIP ${file}: parse error`);
      continue;
    }

    if (!data.questions?.length) continue;

    const subject = subjectMap.get(subjectSlug);
    if (!subject) {
      console.log(`  SKIP ${file}: no subject ${subjectSlug}`);
      continue;
    }

    const chapterKey = `${examType}_${subjectSlug}_${chapterSlug}`;
    const chapter = chapterMap.get(chapterKey);

    let saved = 0;
    let skipped = 0;
    for (const q of data.questions) {
      const year = parseYear(q.meta);
      if (!year || year < 2000 || year > 2026) { skipped++; continue; }

      const shift = parseShift(q.meta);
      const questionType = detectType(q.qt);
      // Determine exam from metadata
      const exam = q.meta?.includes("Advanced") ? "jee-advanced" : examType;

      try {
        await db.question.create({
          data: {
            questionText: q.qt,
            questionHtml: null, // We only scraped text, not HTML
            imageUrl: q.imgs?.[0] || null,
            imageUrls: q.imgs?.length > 0 ? JSON.stringify(q.imgs) : null,
            questionType,
            year,
            exam,
            shift: shift || null,
            subjectId: subject.id,
            chapterId: chapter?.id || null,
            sourceUrl: q.url ? `https://questions.examside.com${q.url}` : null,
            sourceOrder: q.i,
          },
        });
        saved++;
      } catch {
        skipped++;
      }
    }

    // Update chapter count
    if (chapter) {
      const count = await db.question.count({ where: { chapterId: chapter.id } });
      await db.chapter.update({ where: { id: chapter.id }, data: { questionCount: count } });
    }

    totalImported += saved;
    totalDupes += skipped;
    console.log(`  ${file}: ${saved} imported, ${skipped} skipped`);
  }

  console.log(`\n✅ Total: ${totalImported} imported, ${totalDupes} dupes/errors`);
  
  const dbCount = await db.question.count();
  console.log(`📊 DB now has ${dbCount} questions`);
}

main().catch(console.error).finally(() => db.$disconnect());