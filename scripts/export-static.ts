import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  const outDir = path.join(process.cwd(), "static-deploy", "data");
  fs.mkdirSync(outDir, { recursive: true });

  // Export subjects with chapters
  const subjects = await prisma.subject.findMany({
    include: {
      chapters: {
        include: { _count: { select: { questions: true } } },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      },
    },
  });

  // Format subjects for static export
  const subjectsData = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    icon: s.icon,
    color: s.color,
    chapters: s.chapters.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      category: c.category,
      examType: c.examType,
      questionCount: c._count.questions,
    })),
  }));

  fs.writeFileSync(
    path.join(outDir, "subjects.json"),
    JSON.stringify(subjectsData, null, 2)
  );
  console.log(`Exported ${subjects.length} subjects with ${subjects.reduce((a, s) => a + s.chapters.length, 0)} chapters`);

  // Export questions in batches (to keep JSON files manageable)
  const totalQuestions = await prisma.question.count();
  console.log(`Total questions: ${totalQuestions}`);

  // Export all questions (for a 4.5k question dataset, a single JSON is fine)
  const questions = await prisma.question.findMany({
    select: {
      id: true,
      questionText: true,
      questionHtml: true,
      options: true,
      correctAnswer: true,
      solution: true,
      solutionHtml: true,
      imageUrl: true,
      imageUrls: true,
      questionType: true,
      year: true,
      exam: true,
      shift: true,
      paper: true,
      language: true,
      subjectId: true,
      chapterId: true,
      sourceUrl: true,
      subject: { select: { name: true, slug: true } },
      chapter: { select: { name: true, slug: true } },
    },
    orderBy: [{ year: "desc" }, { id: "asc" }],
  });

  fs.writeFileSync(
    path.join(outDir, "questions.json"),
    JSON.stringify(questions, null, 2)
  );
  console.log(`Exported ${questions.length} questions`);

  // Stats
  const bySubject: Record<string, number> = {};
  const byYear: Record<string, number> = {};
  for (const q of questions) {
    bySubject[q.subject.name] = (bySubject[q.subject.name] || 0) + 1;
    if (q.year) byYear[q.year] = (byYear[q.year] || 0) + 1;
  }
  console.log("\nBy subject:", bySubject);
  console.log("\nBy year:", byYear);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
