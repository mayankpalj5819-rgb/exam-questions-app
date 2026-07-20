/**
 * extract-answers.js
 * 
 * Extracts correct answers from question text where the answer is embedded
 * in the questionText field (e.g., "correct answer is A", "Ans: 42", etc.)
 * and updates the database.
 * 
 * Connects to: /home/z/my-project/db/custom.db (SQLite via Prisma)
 */

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasourceUrl: 'file:/home/z/my-project/db/custom.db' });

// ─── Configuration ───────────────────────────────────────────────
const BATCH_SIZE = 100;
const LOG_EVERY = 500;

// ─── Extraction patterns (in priority order) ─────────────────────

/**
 * Pattern 1: "correct answer is X" or "correct answer : X"
 * X can be a letter (A-E), number, fraction, or a short text value.
 * Excludes common false positives like "from the options given below"
 */
const PATTERN_CORRECT_ANSWER = /correct answer (?:is|:)\s*([A-E]|\d+[\.\d]*|\d+\/\d+)/i;

/**
 * Pattern 2: "correct option is (A/B/C/D)"
 * Extracts just the letter option.
 */
const PATTERN_CORRECT_OPTION = /correct option (?:is|:)\s*\(?([A-E])\)?/i;

/**
 * Pattern 3: "Ans: X" or "Answer: X" at the start of a line
 * X can be a letter, number, or fraction.
 */
const PATTERN_ANS_LINE = /^(?:Ans|Answer)\s*[:.]?\s*([A-E]|\d+[\.\d]*|\d+\/\d+)/im;

/**
 * Pattern 4: For questions ending with "is ____" or "is ______",
 * check if the next line contains a standalone answer value.
 */
const PATTERN_BLANK_LINE = /\bis\s*[_\-–—]+\s*$/im;

/**
 * Pattern 5: "The correct answer is" near the end of text
 */
const PATTERN_THE_CORRECT_ANSWER = /the correct answer is\s*([A-E]|\d+[\.\d]*|\d+\/\d+)/i;

// ─── False-positive filters ──────────────────────────────────────
const FALSE_POSITIVE_VALUES = new Set([
  'from', 'the', 'given', 'options', 'below', 'above',
  'following', 'these', 'those', 'them', 'which',
]);

/**
 * Clean up extracted answer text.
 */
function cleanAnswer(answer) {
  if (!answer) return null;
  let cleaned = answer.trim();
  // Remove trailing periods, commas, semicolons, colons
  cleaned = cleaned.replace(/[.,;:]+$/, '');
  // Remove surrounding parentheses/brackets if present
  cleaned = cleaned.replace(/^\s*[\(\[\{]+/, '').replace(/[\)\]\}]+\s*$/, '');
  cleaned = cleaned.trim();
  // Normalize letters to uppercase
  if (/^[a-e]$/.test(cleaned)) {
    cleaned = cleaned.toUpperCase();
  }
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Check if the extracted value is a known false positive.
 * Also checks context: if the value is "A" but the next text says "Assertion",
 * it's a false positive from "Assertion (A):" text.
 */
function isFalsePositive(value, fullText, matchIndex) {
  if (FALSE_POSITIVE_VALUES.has(value.toLowerCase())) return true;
  if (value.length === 0) return true;

  // Special case: if we extracted a single letter, check if it's actually
  // part of "Assertion (A):" or "Assertion : A" text on the next line
  if (/^[A-E]$/.test(value)) {
    const afterMatch = fullText.substring(matchIndex).substring(0, 100);
    if (/Assertion/i.test(afterMatch)) return true;
  }

  return false;
}

/**
 * Try to extract an answer from the question text using all patterns.
 * Returns the cleaned answer string or null.
 */
function extractAnswer(questionText) {
  const text = questionText;

  // ── Pattern 1: "correct answer is X" or "correct answer : X" ──
  const m1 = text.match(PATTERN_CORRECT_ANSWER);
  if (m1 && m1[1] && m1.index !== undefined) {
    const cleaned = cleanAnswer(m1[1]);
    if (cleaned && !isFalsePositive(cleaned, text, m1.index)) {
      return { answer: cleaned, pattern: 'correct answer is/:' };
    }
  }

  // ── Pattern 5: "The correct answer is X" (from end of text) ──
  // Check from the end of the text (last occurrence)
  const m5matches = [...text.matchAll(new RegExp(PATTERN_THE_CORRECT_ANSWER.source, 'gi'))];
  if (m5matches.length > 0) {
    // Take the last match (closest to end of text)
    const m5 = m5matches[m5matches.length - 1];
    const cleaned = cleanAnswer(m5[1]);
    if (cleaned && !isFalsePositive(cleaned, text, m5.index)) {
      return { answer: cleaned, pattern: 'the correct answer is' };
    }
  }

  // ── Pattern 2: "correct option is (A/B/C/D)" ──
  const m2matches = [...text.matchAll(new RegExp(PATTERN_CORRECT_OPTION.source, 'gi'))];
  for (const m2 of m2matches) {
    const cleaned = cleanAnswer(m2[1]);
    if (cleaned && !isFalsePositive(cleaned, text, m2.index)) {
      return { answer: cleaned, pattern: 'correct option is' };
    }
  }

  // ── Pattern 3: "Ans: X" or "Answer: X" on a line ──
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const m3 = trimmed.match(PATTERN_ANS_LINE);
    if (m3 && m3[1]) {
      const cleaned = cleanAnswer(m3[1]);
      if (cleaned && !FALSE_POSITIVE_VALUES.has(cleaned.toLowerCase())) {
        return { answer: cleaned, pattern: 'Ans/Answer:' };
      }
    }
  }

  // ── Pattern 4: "is ____" followed by a value on the next line ──
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    const nextLine = lines[i + 1].trim();
    if (PATTERN_BLANK_LINE.test(line) && nextLine.length > 0 && nextLine.length <= 30) {
      // Check if next line looks like a standalone answer
      const answerMatch = nextLine.match(/^([A-E]|\d+\.?\d*|\d+\/\d+|−?\d+\.?\d*)$/);
      if (answerMatch) {
        const cleaned = cleanAnswer(answerMatch[1]);
        if (cleaned) {
          return { answer: cleaned, pattern: 'blank-fill next line' };
        }
      }
    }
  }

  return null;
}

// ─── Main execution ──────────────────────────────────────────────

async function main() {
  console.log('=== Answer Extraction Script ===');
  console.log('Connecting to database...');

  // Fetch all questions that potentially contain answers
  // We scan all questions with null correctAnswer since patterns
  // like "Ans:" might exist outside the "correct answer" keyword set
  const totalQuestions = await p.question.count({
    where: { correctAnswer: null }
  });
  console.log(`Total questions with null correctAnswer: ${totalQuestions}`);

  // First, identify candidate questions (those containing "correct answer"
  // or "correct option" as specified in the task)
  const candidateCount = await p.question.count({
    where: {
      correctAnswer: null,
      OR: [
        { questionText: { contains: 'correct answer' } },
        { questionText: { contains: 'correct option' } },
      ]
    }
  });
  console.log(`Candidate questions (contain "correct answer/option"): ${candidateCount}`);

  // Fetch all candidates
  let cursor = undefined;
  const BATCH = BATCH_SIZE;
  let processed = 0;
  let updated = 0;
  let failed = 0;
  const patternStats = {};

  console.log(`\nProcessing in batches of ${BATCH}...\n`);

  while (true) {
    const questions = await p.question.findMany({
      where: {
        correctAnswer: null,
        OR: [
          { questionText: { contains: 'correct answer' } },
          { questionText: { contains: 'correct option' } },
        ]
      },
      select: { id: true, questionText: true },
      take: BATCH,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' }
    });

    if (questions.length === 0) break;
    cursor = questions[questions.length - 1].id;

    for (const question of questions) {
      processed++;
      try {
        const result = extractAnswer(question.questionText);

        if (result) {
          await p.question.update({
            where: { id: question.id },
            data: { correctAnswer: result.answer }
          });
          updated++;
          patternStats[result.pattern] = (patternStats[result.pattern] || 0) + 1;
        }
      } catch (err) {
        failed++;
        console.error(`  ERROR updating ${question.id}: ${err.message}`);
      }

      if (processed % LOG_EVERY === 0) {
        console.log(`  Progress: ${processed}/${candidateCount} processed, ${updated} answers extracted`);
      }
    }
  }

  // ─── Summary ─────────────────────────────────────────────────
  console.log('\n=== Extraction Summary ===');
  console.log(`Questions scanned:       ${processed}`);
  console.log(`Answers extracted:       ${updated}`);
  console.log(`Failed updates:          ${failed}`);
  console.log(`No extractable answer:   ${processed - updated - failed}`);
  console.log('\nBreakdown by pattern:');
  for (const [pattern, count] of Object.entries(patternStats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${pattern}: ${count}`);
  }

  // Verify final state
  const remainingNull = await p.question.count({ where: { correctAnswer: null } });
  const totalWithAnswer = await p.question.count({ where: { correctAnswer: { not: null } } });
  console.log(`\nDatabase state after update:`);
  console.log(`  Questions with correctAnswer: ${totalWithAnswer}`);
  console.log(`  Questions still null:         ${remainingNull}`);
}

main()
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await p.$disconnect();
    console.log('\nDone.');
  });