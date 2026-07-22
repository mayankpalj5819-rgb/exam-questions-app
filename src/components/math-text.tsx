"use client";

import { useMemo } from "react";
import katex from "katex";

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Renders text containing LaTeX math expressions.
 * Handles:
 * - $...$ inline math
 * - $$...$$ block/display math
 * - HTML content with embedded LaTeX (for questionHtml)
 * - Escaped characters from scraped data
 * - Tables and other HTML structures
 * - MathML/SVG math elements (renders as-is for browser rendering)
 * - Bare LaTeX commands (auto-wrapped in $...$)
 * - Fill-in-blank markers (|||||| and ____)
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderKatexBlock(math: string): string {
  const trimmed = math.trim();
  try {
    return katex.renderToString(trimmed, {
      displayMode: true,
      throwOnError: false,
      trust: true,
      strict: false,
      macros: {
        "\\textbf": "\\mathbf{\\text{#1}}",
        "\\boldsymbol": "\\mathbf{#1}",
      },
    });
  } catch {
    // Try to render a simplified version
    try {
      const simplified = trimmed
        .replace(/\\(?:frac|sum|int|prod|lim|log|ln|sin|cos|tan|sqrt|vec|bar|hat|dot|ddot|tilde|overline|underline|overbrace|underbrace)\b/g, (match) => match);
      return katex.renderToString(simplified, {
        displayMode: true,
        throwOnError: false,
        trust: true,
        strict: false,
      });
    } catch {
      // Show original text gracefully instead of error message
      return `<span class="math-error">${escapeHtml(trimmed.slice(0, 120))}</span>`;
    }
  }
}

function renderKatexInline(math: string): string {
  const trimmed = math.trim();
  try {
    return katex.renderToString(trimmed, {
      displayMode: false,
      throwOnError: false,
      trust: true,
      strict: false,
      macros: {
        "\\textbf": "\\mathbf{\\text{#1}}",
        "\\boldsymbol": "\\mathbf{#1}",
      },
    });
  } catch {
    try {
      const simplified = trimmed
        .replace(/\\(?:frac|sum|int|prod|lim|log|ln|sin|cos|tan|sqrt|vec|bar|hat|dot|ddot|tilde|overline|underline|overbrace|underbrace)\b/g, (match) => match);
      return katex.renderToString(simplified, {
        displayMode: false,
        throwOnError: false,
        trust: true,
        strict: false,
      });
    } catch {
      // Show original text gracefully instead of error message
      return `<span class="math-error">${escapeHtml(trimmed.slice(0, 120))}</span>`;
    }
  }
}

/**
 * Process a string: convert LaTeX $...$ to KaTeX rendered HTML,
 * while leaving other HTML tags intact.
 */
function processLatexInString(input: string): string {
  let result = input;

  // Process block math $$...$$ (non-greedy, allows newlines)
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    return renderKatexBlock(math);
  });

  // Process inline math $...$ (non-greedy, no newlines inside)
  result = result.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    return renderKatexInline(math);
  });

  return result;
}

/**
 * Extract image URLs from HTML string and return cleaned HTML + URLs.
 */
export function extractImagesFromHtml(html: string): {
  cleanedHtml: string;
  imageUrls: string[];
} {
  const imageUrls: string[] = [];
  const cleanedHtml = html.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, (_, src) => {
    imageUrls.push(src);
    return "";
  });
  return { cleanedHtml, imageUrls };
}

/**
 * Process full HTML content (questionHtml) that may contain
 * embedded LaTeX, tables, images, MathML/SVG math, etc.
 */
export function processHtmlContent(html: string): string {
  if (!html) return "";

  // Fix double-backslash before LaTeX commands: \\mathrm → \mathrm
  let { cleanedHtml } = extractImagesFromHtml(html.replace(/\\\\(?=[a-zA-Z])/g, "\\"));

  // Wrap MathML elements with a class for better styling
  let result = cleanedHtml.replace(
    /<(math)[^>]*>/gi,
    '<$1 class="mathml-display" '
  );

  // Ensure SVG math elements from ExamSide render as-is with a class
  result = result.replace(
    /<svg([^>]*)class="([^"]*)"([^>]*)>/gi,
    (match, before, cls, after) => {
      const newCls = cls.includes("math-svg") ? cls : cls + " math-svg";
      return `<svg${before}class="${newCls}"${after}>`;
    }
  );
  // SVG without class
  result = result.replace(
    /<svg([^>]*)>/gi,
    (match, attrs) => {
      if (attrs.includes('class=')) return match;
      return `<svg class="math-svg"${attrs}>`;
    }
  );

  // Process LaTeX within the HTML
  // We need to be careful to only process LaTeX within text nodes,
  // not inside HTML tags. Split by tags, process text parts.
  result = result.replace(
    /(<[^>]*>)([^<]*)/g,
    (_match, tag, text) => {
      return tag + processLatexInString(text);
    }
  );

  // Also handle text that comes before any tag
  const leadingText = result.match(/^([^<]*)/)?.[0];
  if (leadingText) {
    result = processLatexInString(leadingText) + result.slice(leadingText.length);
  }

  // Clean up any double <br> tags
  result = result.replace(/(<br\s*\/?>)\s*(<br\s*\/?>)+/gi, "<br/>");

  // Wrap table elements for better styling
  result = result.replace(
    /<table/gi,
    '<div class="question-table-wrap"><table class="question-table"'
  );
  result = result.replace(
    /<\/table>/gi,
    "</table></div>"
  );

  return result;
}

// ---------------------------------------------------------------------------
// Bare LaTeX wrapping logic
// ---------------------------------------------------------------------------

/** LaTeX command names that should trigger auto-wrapping in bare text. */
const BARE_LATEX_CMDS = [
  // Text formatting in math
  'mathrm', 'text', 'mathbf', 'vec', 'bar', 'hat', 'boldsymbol',
  // Fractions & roots
  'frac', 'sqrt', 'cfrac', 'dfrac', 'tfrac',
  // Big operators
  'sum', 'int', 'prod', 'lim',
  // Trigonometric / logarithmic
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'log', 'ln', 'exp', 'lg',
  // Lowercase Greek
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta',
  'theta', 'vartheta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi',
  'rho', 'sigma', 'tau', 'upsilon', 'phi', 'varphi', 'chi', 'psi', 'omega',
  // Uppercase Greek
  'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Phi', 'Psi', 'Omega',
  // Binary / relational operators
  'times', 'div', 'pm', 'mp', 'cdot', 'cdots', 'ldots', 'dots',
  // Delimiters
  'left', 'right',
  // Decorations
  'underbrace', 'overbrace', 'overline', 'underline',
  'dot', 'ddot', 'tilde', 'partial', 'nabla', 'infty', 'degree',
  // Spacing
  'quad', 'qquad',
  // Relations
  'neq', 'leq', 'geq', 'approx', 'equiv', 'sim', 'simeq', 'propto',
  // Geometry / set theory
  'angle', 'perp', 'parallel',
  'in', 'notin', 'subset', 'supset', 'subseteq', 'supseteq',
  'cup', 'cap', 'forall', 'exists',
  // Arrows
  'rightarrow', 'leftarrow', 'Rightarrow', 'Leftarrow', 'to',
  'gg', 'll', 'hbar',
].join('|');

/**
 * Wraps bare LaTeX commands (those not already inside `$...$` or `$$...$$`)
 * with `$...$` delimiters so KaTeX can render them.
 *
 * Three-pass approach:
 * 1. Replace existing `$...$` / `$$...$$` with unique placeholders
 * 2. Find bare LaTeX "math islands" and wrap them in `$...$`
 * 3. Restore the original `$...$` / `$$...$$` regions
 */
function wrapBareLatex(text: string): string {
  const protectedRegions: string[] = [];
  let result = text;

  // ---- Pass 1: protect existing $$...$$ and $...$ ----
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math: string) => {
    const idx = protectedRegions.length;
    protectedRegions.push('$$' + math + '$$');
    return `\x00P${idx}\x00`;
  });

  result = result.replace(/\$([^\$\n]+?)\$/g, (_, math: string) => {
    const idx = protectedRegions.length;
    protectedRegions.push('$' + math + '$');
    return `\x00P${idx}\x00`;
  });

  // ---- Pass 2: find and wrap bare LaTeX ----
  // Early exit if no backslash at all (no bare LaTeX possible)
  if (result.includes('\\')) {
    result = wrapBareLatexPass(result);
  }

  // ---- Pass 3: restore protected regions ----
  for (let i = protectedRegions.length - 1; i >= 0; i--) {
    result = result.replace(`\x00P${i}\x00`, protectedRegions[i]);
  }

  return result;
}

/**
 * The actual "math island" detection pass.
 * Called after existing $...$ regions have been replaced with placeholders.
 */
function wrapBareLatexPass(text: string): string {
  // Build a regex that matches a contiguous "math island" — a run of
  // math-like tokens that contains at least one bare LaTeX command from
  // the BARE_LATEX_CMDS list.
  //
  // Token types:
  //  1. \command{...}  with up to 1 level of nested braces
  //  2. Numbers (integer or decimal)
  //  3. Standalone single letters (not part of a word)
  //  4. Math operators / punctuation
  //  5. Horizontal whitespace (spaces / tabs — NOT newlines)
  //
  // The lookbehind / lookahead on the single-letter alternative prevents
  // matching letters that are part of English words.

  const bareMathRegex = new RegExp(
    '(' +
    '(?:' +
      // LaTeX command with optional brace arguments (1 level of nesting)
      '\\\\(?:' + BARE_LATEX_CMDS + ')\\b(?:\\{(?:[^{}]|\\{[^{}]*\\})*\\})*' +
      '|' +
      // Number
      '\\d+\\.?\\d*' +
      '|' +
      // Standalone single letter (not adjacent to other letters or placeholders)
      '(?<![a-zA-Z\\x00\\x01])[a-zA-Z](?![a-zA-Z\\x00\\x01])' +
      '|' +
      // Math operators and punctuation
      '[+\\-*/=<>^_.()\\[\\]{},:;!?]' +
      '|' +
      // Horizontal whitespace (spaces / tabs only — not newlines)
      '[ \\t]+' +
    ')+' +
    ')',
    'g'
  );

  // Non-global regex to check whether a matched island contains a bare command
  const bareCmdCheck = new RegExp('\\\\(?:' + BARE_LATEX_CMDS + ')\\b');

  return text.replace(bareMathRegex, (match) => {
    // Only wrap if the island actually contains a known bare LaTeX command
    if (bareCmdCheck.test(match)) {
      const trimmed = match.trim();
      if (trimmed.length > 0) {
        const leadingWs = match.match(/^[ \t]*/)?.[0] ?? '';
        const trailingWs = match.match(/[ \t]*$/)?.[0] ?? '';
        return leadingWs + '$' + trimmed + '$' + trailingWs;
      }
    }
    return match;
  });
}

// ---------------------------------------------------------------------------
// Plain-text processing (the main function being enhanced)
// ---------------------------------------------------------------------------

/** HTML used for fill-in-the-blank markers. */
const BLANK_HTML =
  '<span class="inline-block border-b-2 border-muted-foreground/40 min-w-[3em]">&nbsp;</span>';

/**
 * Process plain text with LaTeX (for questionText, options, etc.)
 *
 * In addition to the existing $...$ / $$...$$ handling, this function now:
 *  - Replaces `||||||` (4+ pipes) and `____` (4+ underscores) with styled blanks
 *  - Auto-wraps bare LaTeX commands in `$...$` before KaTeX processing
 */
function processPlainText(text: string): string {
  if (!text) return "";

  let result = text;

  // Fix double-backslash before known LaTeX commands: \\mathrm → \mathrm
  // The scraped data often has \\command instead of \command
  result = result.replace(
    /\\\\(?=[a-zA-Z_])/g,
    "\\"
  );

  // Handle common scraped-data escape patterns (for non-command backslashes)
  result = result.replace(
    /(?<!\$)(?:\\\\)+(?![a-zA-Z_])/g,
    (match) => {
      return match.length >= 4 ? "\\".repeat(Math.floor(match.length / 2)) : match;
    }
  );

  // ---- Replace fill-in-blank markers with protected placeholders ----
  const blankPlaceholders: string[] = [];

  // Bare |||| (4+ pipes)
  result = result.replace(/\|{4,}/g, () => {
    const idx = blankPlaceholders.length;
    blankPlaceholders.push(BLANK_HTML);
    return `\x01B${idx}\x01`;
  });

  // Bare ____ (4+ underscores, not inside $...$)
  result = result.replace(/(?<!\$)_{4,}(?!\$)/g, () => {
    const idx = blankPlaceholders.length;
    blankPlaceholders.push(BLANK_HTML);
    return `\x01B${idx}\x01`;
  });

  // Escaped blanks inside $...$: $\_\_\_\_$ or $\\_\\_\\_\\_$
  result = result.replace(/\$(?:\\_){4,}\$/g, () => {
    const idx = blankPlaceholders.length;
    blankPlaceholders.push(BLANK_HTML);
    return `\x01B${idx}\x01`;
  });

  // Also handle double-escaped: $\\_\\_\\_\\_$ (before the \\ → \ fix above,
  // these become $\_\_\_\_$)
  result = result.replace(/\$(?:\\_){3,}\$/g, () => {
    const idx = blankPlaceholders.length;
    blankPlaceholders.push(BLANK_HTML);
    return `\x01B${idx}\x01`;
  });

  // ---- Wrap bare LaTeX in $...$ (protects existing $...$ internally) ----
  result = wrapBareLatex(result);

  // ---- Restore blank placeholders ----
  for (let i = blankPlaceholders.length - 1; i >= 0; i--) {
    result = result.replace(`\x01B${i}\x01`, blankPlaceholders[i]);
  }

  // Process block math $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    return renderKatexBlock(math);
  });

  // Process inline math $...$
  result = result.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    return renderKatexInline(math);
  });

  // Convert newlines to <br>
  result = result.replace(/\n/g, "<br/>");

  return result;
}

export function MathText({ text, className = "" }: MathTextProps) {
  const html = useMemo(() => {
    if (!text) return "";

    // If text contains HTML tags (but not just <br/>), use HTML processor
    const hasHtmlTags = /<(?!br\s*\/?>)[a-zA-Z][^>]*>/.test(text);

    if (hasHtmlTags) {
      return processHtmlContent(text);
    }

    return processPlainText(text);
  }, [text]);

  if (!html) return null;

  return (
    <span
      className={`math-text-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}