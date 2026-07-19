import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({
  datasourceUrl: "file:/home/z/my-project/db/custom.db",
});

interface ScrapedQ {
  y: number; // year
  s: string; // shift
  t: string; // text
  im: string[]; // images
  h: string; // href
}

async function importQuestions(
  filePath: string,
  subjectSlug: string,
  chapterSlug: string,
  examType: string
) {
  const raw = require('fs').readFileSync(filePath, 'utf-8');
  const wrapper = JSON.parse(raw);
  const data: ScrapedQ[] = JSON.parse(wrapper.data.result);

  const subject = await db.subject.findUnique({ where: { slug: subjectSlug } });
  if (!subject) {
    console.log(`Subject not found: ${subjectSlug}`);
    return;
  }

  const chapter = await db.chapter.findFirst({
    where: { slug: chapterSlug, subjectId: subject.id, examType },
  });

  let imported = 0;
  for (const q of data) {
    if (!q.y || q.y < 2000) continue; // Skip non-questions

    // Check if question text is too short (probably not a real question)
    if (q.t.length < 20) continue;

    // Determine type: if text contains options pattern, it's MCQ
    const isMCQ = /^[A-D][\).]/.test(q.t.trim()) || 
                  (q.t.includes('(A)') || q.t.includes('(B)'));
    const qType = isMCQ ? 'mcq-single' : 'numerical';

    try {
      await db.question.create({
        data: {
          questionText: q.t,
          questionHtml: q.t, // We'll use the text with LaTeX
          options: null, // Options are embedded in text for now
          imageUrl: q.im.length > 0 ? q.im[0] : null,
          imageUrls: q.im.length > 0 ? JSON.stringify(q.im) : null,
          questionType: qType,
          year: q.y,
          exam: examType,
          shift: q.s || null,
          subjectId: subject.id,
          chapterId: chapter?.id || null,
          sourceUrl: q.h ? `https://questions.examside.com${q.h}` : null,
          sourceOrder: imported,
        },
      });
      imported++;
    } catch (err: any) {
      // Skip duplicates silently
    }
  }

  // Update chapter count
  if (chapter) {
    const count = await db.question.count({ where: { chapterId: chapter.id } });
    await db.chapter.update({ where: { id: chapter.id }, data: { questionCount: count } });
  }

  console.log(`Imported ${imported} questions into ${subjectSlug}/${chapterSlug}`);
}

// Parse args
const filePath = process.argv[2];
const subjectSlug = process.argv[3];
const chapterSlug = process.argv[4];
const examType = process.argv[5] || 'jee-main';

if (!filePath || !subjectSlug || !chapterSlug) {
  console.log('Usage: bun run scripts/import-questions.ts <json-file> <subject> <chapter-slug> <exam-type>');
  process.exit(1);
}

importQuestions(filePath, subjectSlug, chapterSlug, examType)
  .catch(console.error)
  .finally(() => db.$disconnect());