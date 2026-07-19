"use client";

import { useMemo } from "react";
import katex from "katex";

interface MathTextProps {
  text: string;
  className?: string;
}

export function MathText({ text, className = "" }: MathTextProps) {
  const html = useMemo(() => {
    if (!text) return "";

    let result = text;

    // Process block math $$...$$
    result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false,
          trust: true,
          strict: false,
        });
      } catch {
        return `<span class="math-error">${math}</span>`;
      }
    });

    // Process inline math $...$
    result = result.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
          trust: true,
          strict: false,
        });
      } catch {
        return `<span class="math-error">${math}</span>`;
      }
    });

    // Convert newlines to <br>
    result = result.replace(/\n/g, "<br/>");

    return result;
  }, [text]);

  return (
    <div
      className={`math-text-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}