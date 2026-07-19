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
 */
function renderKatexBlock(math: string): string {
  try {
    return katex.renderToString(math.trim(), {
      displayMode: true,
      throwOnError: false,
      trust: true,
      strict: false,
    });
  } catch {
    return `<span class="math-error">[Math Error: ${math.trim().slice(0, 50)}]</span>`;
  }
}

function renderKatexInline(math: string): string {
  try {
    return katex.renderToString(math.trim(), {
      displayMode: false,
      throwOnError: false,
      trust: true,
      strict: false,
    });
  } catch {
    return `<span class="math-error">[Math Error: ${math.trim().slice(0, 50)}]</span>`;
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
    return ""; // Remove img tags from HTML
  });
  return { cleanedHtml, imageUrls };
}

/**
 * Process full HTML content (questionHtml) that may contain
 * embedded LaTeX, tables, images, etc.
 */
export function processHtmlContent(html: string): string {
  if (!html) return "";

  // First extract and remove images
  const { cleanedHtml } = extractImagesFromHtml(html);

  // Process LaTeX within the HTML
  // We need to be careful to only process LaTeX within text nodes,
  // not inside HTML tags. Split by tags, process text parts.
  let result = cleanedHtml.replace(
    /(<[^>]*>)([^<]*)/g,
    (_match, tag, text) => {
      return tag + processLatexInString(text);
    }
  );

  // Also handle text that comes before any tag
  // The regex above handles text after tags; handle leading text
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
  // Convert \\ to \ for LaTeX commands (e.g., \\mu -> \mu, \\frac -> \frac)
  // But be careful: \\\\ should become \\ (literal backslash in math)
  // We only do this outside of math delimiters
  result = result.replace(
    /(?<!\$)(?:\\\\)+(?![a-zA-Z])/g,
    (match) => {
      // Replace pairs of backslashes with single backslash
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
    <div
      className={`math-text-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}