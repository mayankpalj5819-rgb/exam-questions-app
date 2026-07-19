import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const db = new PrismaClient({
  datasourceUrl: "file:/home/z/my-project/db/custom.db",
});

const BASE_URL = 'https://questions.examside.com/past-years/jee';

interface ScrapedQuestion {
  questionText: string;
  questionHtml: string;
  options: string[] | null;
  correctAnswer?: string;
  imageUrl?: string;
  imageUrls: string[];
  questionType: string;
  year: number;
  exam: string;
  shift: string;
  paper?: string;
  sourceUrl?: string;
  sourceOrder: number;
  chapterSlug: string;
  subjectSlug: string;
}

function extractYear(text: string): number | null {
  const match = text.match(/(\d{4})\s*(?:\(Online\)|\(Offline\))/);
  if (match) return parseInt(match[1]);
  const match2 = text.match(/JEE (?:Main|Advanced)\s+(\d{4})/);
  if (match2) return parseInt(match2[1]);
  return null;
}

function extractShift(text: string): string {
  if (text.includes('Morning Shift') || text.includes('Morning')) return 'Morning Shift';
  if (text.includes('Evening Shift') || text.includes('Evening')) return 'Evening Shift';
  if (text.includes('Afternoon Shift') || text.includes('Afternoon')) return 'Afternoon Shift';
  if (text.includes('Shift 1') || text.includes('Paper 1')) return 'Shift 1';
  if (text.includes('Shift 2') || text.includes('Paper 2')) return 'Shift 2';
  return '';
}

function extractPaper(text: string): string | null {
  if (text.includes('Paper 1')) return 'Paper 1';
  if (text.includes('Paper 2')) return 'Paper 2';
  return null;
}

function extractLatexFromHtml(html: string): string {
  // Extract $$...$$ block math
  let text = html;
  // Convert MathML to LaTeX placeholders (we'll keep the raw text which contains LaTeX)
  // Remove script/style tags
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // Keep the text content which already has $$...$$ from examside
  // But also clean up HTML tags while preserving LaTeX
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

async function scrapeChapter(subjectSlug: string, chapterSlug: string, examType: string): Promise<ScrapedQuestion[]> {
  const url = `${BASE_URL}/${examType}/${subjectSlug}/${chapterSlug}`;
  console.log(`  Scraping: ${url}`);

  try {
    // Open the page
    execSync(`agent-browser open "${url}" 2>&1`, { timeout: 30000, stdio: 'pipe' });
    execSync('agent-browser wait --load networkidle 2>&1', { timeout: 20000, stdio: 'pipe' });

    // Extract questions using JavaScript
    const result = execSync(
      `agent-browser eval "
        const main = document.querySelector('main');
        if (!main) { console.log('NO_MAIN'); process.exit(0); }
        
        // Find all question cards - they are links containing question content
        const links = main.querySelectorAll('a[href*=\"/past-years/jee/question/\"]');
        const questions = [];
        
        links.forEach((link, idx) => {
          const text = link.textContent || '';
          const html = link.innerHTML || '';
          
          // Extract year from text
          const yearMatch = text.match(/JEE (?:Main|Advanced) (?:\\(Online\\) |\\(Offline\\) )?(\\d{4})/);
          const year = yearMatch ? parseInt(yearMatch[1]) : null;
          
          // Extract shift
          let shift = '';
          if (text.includes('Morning Shift')) shift = 'Morning Shift';
          else if (text.includes('Evening Shift')) shift = 'Evening Shift';
          else if (text.includes('Afternoon Shift')) shift = 'Afternoon Shift';
          else if (text.includes('Shift 1')) shift = 'Shift 1';
          else if (text.includes('Shift 2')) shift = 'Shift 2';
          
          // Extract exam type from text
          const isAdvanced = text.includes('JEE Advanced');
          
          // Extract image URLs
          const imgs = link.querySelectorAll('img');
          const imageUrls = [];
          imgs.forEach(img => {
            const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
            if (src && !src.includes('avatar') && !src.includes('favicon') && !src.includes('logo')) {
              imageUrls.push(src);
            }
          });
          
          // Extract question text (cleaned)
          let questionText = text;
          // Remove year/shift info from the beginning for cleaner text
          questionText = questionText.replace(/^\\d+\\s*/, '');
          questionText = questionText.replace(/JEE (?:Main|Advanced).*?(?=\\n|\\s{2,}|$)/, '').trim();
          
          // Extract MCQ options if present
          const optionRegex = /\\(([A-D])\\)\\s*([^()]+?)(?=\\s*\\([B-D]\\)|$)/g;
          const options = [];
          const allText = link.innerText || '';
          const lines = allText.split('\\n').map(l => l.trim()).filter(Boolean);
          
          // Try to find options at the end of the question
          let inOptions = false;
          let optionLabels = ['A', 'B', 'C', 'D'];
          let currentOptions: string[] = [];
          
          for (const line of lines) {
            if (optionLabels.some(l => line.startsWith(l + ')') || line.startsWith(l + '.'))) {
              inOptions = true;
              const optText = line.replace(/^[A-D][\\).]\\s*/, '').trim();
              if (optText) currentOptions.push(optText);
            } else if (inOptions) {
              // After options section, stop
              if (line.includes('JEE') || line.includes('Shift')) break;
              if (currentOptions.length > 0) {
                currentOptions[currentOptions.length - 1] += ' ' + line;
              }
            }
          }
          
          if (currentOptions.length >= 2) {
            // Found options
          }
          
          // Get the href for source URL
          const href = link.getAttribute('href') || '';
          
          questions.push({
            questionText: questionText.substring(0, 5000),
            questionHtml: html.substring(0, 10000),
            options: currentOptions.length >= 2 ? currentOptions : null,
            imageUrls: imageUrls,
            imageUrl: imageUrls[0] || null,
            questionType: currentOptions.length >= 2 ? 'mcq-single' : 'numerical',
            year: year,
            exam: isAdvanced ? 'jee-advanced' : 'jee-main',
            shift: shift,
            sourceUrl: href ? 'https://questions.examside.com' + href : null,
            sourceOrder: idx,
          });
        });
        
        console.log(JSON.stringify(questions));
      " 2>&1`,
      { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
    ).toString();

    if (result.includes('NO_MAIN')) {
      console.log('  No main content found');
      return [];
    }

    // Find the JSON in the output (after "JSON.stringify(questions)")
    const jsonMatch = result.match(/\[[\s\S]*\](?!\s*\])/);
    if (!jsonMatch) {
      console.log('  No questions found in output');
      return [];
    }

    const questions: ScrapedQuestion[] = JSON.parse(jsonMatch[0]);
    console.log(`  Found ${questions.length} questions`);
    return questions;

  } catch (error: any) {
    console.log(`  Error: ${error.message?.substring(0, 100)}`);
    return [];
  }
}

async function saveQuestions(questions: ScrapedQuestion[], subjectSlug: string, chapterSlug: string, examType: string) {
  const subject = await db.subject.findUnique({ where: { slug: subjectSlug } });
  if (!subject) {
    console.log(`  Subject not found: ${subjectSlug}`);
    return 0;
  }

  const chapter = await db.chapter.findFirst({
    where: { slug: chapterSlug, subjectId: subject.id, examType },
  });

  let saved = 0;
  for (const q of questions) {
    try {
      // Skip questions without year
      if (!q.year) continue;

      await db.question.create({
        data: {
          questionText: q.questionText,
          questionHtml: q.questionHtml,
          options: q.options ? JSON.stringify(q.options) : null,
          imageUrl: q.imageUrl,
          imageUrls: q.imageUrls.length > 0 ? JSON.stringify(q.imageUrls) : null,
          questionType: q.questionType,
          year: q.year,
          exam: q.exam,
          shift: q.shift,
          paper: q.paper,
          subjectId: subject.id,
          chapterId: chapter?.id,
          sourceUrl: q.sourceUrl,
          sourceOrder: q.sourceOrder,
        },
      });
      saved++;
    } catch (err: any) {
      if (!err.message?.includes('Unique')) {
        // Skip unique constraint errors silently
      }
    }
  }

  // Update chapter question count
  if (chapter) {
    const count = await db.question.count({ where: { chapterId: chapter.id } });
    await db.chapter.update({ where: { id: chapter.id }, data: { questionCount: count } });
  }

  return saved;
}

async function main() {
  // Get chapters to scrape
  const targetSubject = process.argv[2]; // physics, chemistry, or mathematics
  const targetExam = process.argv[3] || 'jee-main';
  const maxChapters = parseInt(process.argv[4] || '999');

  const chapters = await db.chapter.findMany({
    where: { examType: targetExam },
    include: { subject: true },
    orderBy: [{ subject: { name: 'asc' } }, { name: 'asc' }],
  });

  const filtered = targetSubject
    ? chapters.filter(c => c.subject.slug === targetSubject)
    : chapters;

  const toScrape = filtered.slice(0, maxChapters);
  console.log(`Scraping ${toScrape.length} chapters for ${targetExam}${targetSubject ? ` (${targetSubject})` : ''}\n`);

  let totalQuestions = 0;

  for (const chapter of toScrape) {
    console.log(`\n[${chapter.subject.name}] ${chapter.name}:`);
    const questions = await scrapeChapter(chapter.subject.slug, chapter.slug, chapter.examType);

    if (questions.length > 0) {
      const saved = await saveQuestions(questions, chapter.subject.slug, chapter.slug, chapter.examType);
      totalQuestions += saved;
      console.log(`  Saved ${saved} questions`);
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n✨ Done! Total questions scraped: ${totalQuestions}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());