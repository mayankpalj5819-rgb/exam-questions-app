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

  // First extract and remove images
  const { cleanedHtml } = extractImagesFromHtml(html);

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

/**
 * Process plain text with LaTeX (for questionText, options, etc.)
 */
function processPlainText(text: string): string {
  if (!text) return "";

  let result = text;

  // Handle common scraped-data escape patterns
  result = result.replace(
    /(?<!\$)(?:\\\\)+(?![a-zA-Z])/g,
    (match) => {
      return match.length >= 4 ? "\\".repeat(Math.floor(match.length / 2)) : match;
    }
  );

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