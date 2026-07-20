"use client";

import { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAppState, type QuestionData } from "@/hooks/use-app-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { MathText } from "@/components/math-text";
import { extractImagesFromHtml } from "@/components/math-text";
import {
  Bookmark,
  Calendar,
  Clock,
  CheckCircle2,
  Hash,
  Sparkles,
  Image as ImageIcon,
  Lightbulb,
  X,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// ─── Constants ──────────────────────────────────────────────────────────────

const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;

const OPTION_COLORS = [
  {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/60",
  },
  {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
  },
  {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/60",
  },
  {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-200 dark:border-violet-800/60",
  },
  {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800/60",
  },
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: QuestionData;
  index: number;
  onUnsave?: (questionId: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Normalize literal \n in scraped text to real newlines */
function normalizeText(text: string): string {
  return text.replace(/\\n/g, "\n");
}

/** Detect effective question type from data */
function detectQuestionType(
  question: QuestionData
): "MCQ" | "Numerical" {
  if (question.questionType === "MCQ" || question.questionType === "Numerical") {
    return question.questionType;
  }
  const text = question.questionText + " " + (question.questionHtml || "");
  if (/\(A\)/.test(text) && /\(B\)/.test(text)) {
    return "MCQ";
  }
  return "Numerical";
}

/** Extract date text like "24th January" from question text */
function extractDateFromText(text: string): string | null {
  const dateMatch = text.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)/i
  );
  return dateMatch ? dateMatch[0] : null;
}

/** Remove noise from question text */
function cleanQuestionText(text: string): string {
  return text
    .replace(
      /\s*(?:Choose the correct (?:answer|option)[s]?.*|Select the correct (?:answer|option)[s]?.*)$/is,
      ""
    )
    .replace(/\s*ElectricalCircuit\s*Components$/i, "")
    .replace(/\s+([A-Z][a-z]+[A-Z][a-zA-Z]+)$/m, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Return subject border class */
function getSubjectBorder(subjectSlug?: string): string {
  if (!subjectSlug) return "";
  if (subjectSlug.includes("physics")) return "subject-border-physics";
  if (subjectSlug.includes("chem")) return "subject-border-chemistry";
  if (subjectSlug.includes("math")) return "subject-border-mathematics";
  return "";
}

/** Check if text mentions figures/diagrams */
function hasFigureReference(text: string): boolean {
  return /\b(?:figure|diagram|graph|arrangement|setup|configuration|shown below|given figure|following figure|given below)\b/i.test(
    text
  );
}

/** Extract inline options (A), (B), etc. OR A. B. C. D. from question text */
function extractInlineOptions(rawText: string): string[] {
  const text = normalizeText(rawText);

  // Strategy 1: (A) text (B) text format
  const parenRegex = /\(([A-E])\)\s*([\s\S]*?)(?=\(([A-E])\)|$)/g;
  const parenExtracted: string[] = [];
  let match;
  while ((match = parenRegex.exec(text)) !== null) {
    let optText = match[2].trim();
    if (optText.length > 500) {
      optText = optText.slice(0, 500).trim() + "…";
    }
    parenExtracted.push(optText);
  }
  if (parenExtracted.length >= 2) return parenExtracted;

  // Strategy 2: \nA. text \nB. text format
  const dotRegex = /^[A-E]\.\s+([\s\S]*?)(?=\n[A-E]\.\s|$)/gm;
  const dotExtracted: string[] = [];
  while ((match = dotRegex.exec(text)) !== null) {
    let optText = match[1].trim();
    if (optText.length > 500) {
      optText = optText.slice(0, 500).trim() + "…";
    }
    dotExtracted.push(optText);
  }
  if (dotExtracted.length >= 2) return dotExtracted;

  return [];
}

/** Parse image URLs from question data */
function parseImageUrls(question: QuestionData): string[] {
  const urls: string[] = [];
  if (question.imageUrl) urls.push(question.imageUrl);
  if (question.imageUrls) {
    try {
      const parsed = JSON.parse(question.imageUrls);
      if (Array.isArray(parsed)) urls.push(...parsed);
    } catch {
      /* ignore */
    }
  }
  // Also extract from HTML content
  if (question.questionHtml) {
    const { imageUrls } = extractImagesFromHtml(question.questionHtml);
    urls.push(...imageUrls);
  }
  return [...new Set(urls)];
}

// ─── ImageZoomDialog ────────────────────────────────────────────────────────

function ImageZoomDialog({
  src,
  open,
  onOpenChange,
}: {
  src: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] p-2 bg-black/95 border-white/10">
        <DialogTitle className="sr-only">Image Zoom</DialogTitle>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-1 -right-1 z-10 h-8 w-8 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <img
            src={src}
            alt="Question image zoomed"
            className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function QuestionCard({
  question,
  index,
  onUnsave,
}: QuestionCardProps) {
  const { data: session } = useSession();
  const {
    savedQuestionIds,
    toggleSavedQuestionId,
    setAuthModalOpen,
    examType,
    selectedSubject,
  } = useAppState();

  // ── Local State ──
  const [saveLoading, setSaveLoading] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // ── Normalized Text ──
  const normalizedRawText = useMemo(
    () => normalizeText(question.questionText || ""),
    [question.questionText]
  );

  // ── Derived Values ──
  const isSaved = savedQuestionIds.has(question.id);
  const detectedType = detectQuestionType(question);
  const isNumerical = detectedType === "Numerical";
  const subjectBorder = getSubjectBorder(
    selectedSubject?.slug || question.subject?.slug
  );
  const hasFigure = hasFigureReference(normalizedRawText);
  const imageUrls = parseImageUrls(question);

  // ── Exam Meta ──
  const examMeta = useMemo(() => {
    const parts: string[] = [];
    parts.push(examType === "jee-main" ? "JEE Main" : "JEE Advanced");
    if (question.year) parts.push(String(question.year));
    const dateStr = extractDateFromText(normalizedRawText);
    if (dateStr) parts.push(`(${dateStr})`);
    if (question.shift) parts.push(question.shift);
    if (question.paper) parts.push(question.paper);
    return parts.join(" · ").trim();
  }, [question.year, question.shift, question.paper, question.questionText, examType]);

  // ── Cleaned Question Text ──
  const cleanText = useMemo(
    () => cleanQuestionText(normalizedRawText),
    [normalizedRawText]
  );

  // ── Parse Options ──
  const parsedOptions = useMemo(() => {
    // Check JSON options from DB
    if (
      question.options &&
      question.options !== "undefined" &&
      question.options !== "null"
    ) {
      try {
        const opts = JSON.parse(question.options);
        if (Array.isArray(opts) && opts.length >= 2) return opts;
      } catch {
        /* ignore */
      }
    }

    // Extract inline options from question text
    if (!isNumerical && question.questionText) {
      const extracted = extractInlineOptions(question.questionText);
      if (extracted.length >= 2) return extracted;
    }

    return [];
  }, [question.options, question.questionText, isNumerical]);

  const hasInlineOptions = parsedOptions.length > 0;

  // ── Determine which option format was detected ──
  const optionFormat = useMemo(() => {
    if (!normalizedRawText) return "none";
    if (/\([A-E]\)/.test(normalizedRawText)) return "paren";
    const lines = normalizedRawText.split(/\n/);
    let dotCount = 0;
    for (const line of lines) {
      if (/^[A-E]\.\s/.test(line.trim())) dotCount++;
    }
    if (dotCount >= 2) return "dot";
    return "none";
  }, [normalizedRawText]);

  // ── Display Text (strip options from body) ──
  const displayText = useMemo(() => {
    if (hasInlineOptions) {
      if (optionFormat === "paren") {
        return cleanText
          .replace(/\s*\([A-E]\)[\s\S]*$/g, "")
          .replace(/\n{2,}/g, "\n")
          .trim();
      }
      if (optionFormat === "dot") {
        return cleanText
          .replace(/\n[A-E]\.\s[\s\S]*$/g, "")
          .replace(/\n{2,}/g, "\n")
          .trim();
      }
    }
    return cleanText;
  }, [cleanText, hasInlineOptions, optionFormat]);

  // ── Determine correct answer letter for MCQ ──
  const correctLetter = useMemo(() => {
    if (isNumerical || !question.correctAnswer) return null;
    const ans = question.correctAnswer.trim();
    if (/^[A-E]$/.test(ans)) return ans;
    // Try matching against parsed option text
    for (let i = 0; i < parsedOptions.length; i++) {
      if (ans === parsedOptions[i].trim())
        return String.fromCharCode(65 + i);
    }
    return ans.length === 1 && ans >= "A" && ans <= "E" ? ans : null;
  }, [isNumerical, question.correctAnswer, parsedOptions]);

  // ── Solution content ──
  const solutionContent = question.solution || question.solutionHtml || null;

  // ── Bookmark Handler ──
  const handleSaveToggle = useCallback(async () => {
    if (!session?.user) {
      setAuthModalOpen(true);
      return;
    }
    setSaveLoading(true);
    try {
      if (isSaved) {
        const res = await fetch(
          `/api/questions/save?questionId=${question.id}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          toggleSavedQuestionId(question.id);
          onUnsave?.(question.id);
          toast.success("Question unsaved");
        }
      } else {
        const res = await fetch("/api/questions/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: question.id }),
        });
        if (res.ok) {
          toggleSavedQuestionId(question.id);
          toast.success("Question saved!");
        }
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaveLoading(false);
    }
  }, [
    session,
    isSaved,
    question.id,
    toggleSavedQuestionId,
    setAuthModalOpen,
    onUnsave,
  ]);

  // ── Render ──

  return (
    <>
      <Card
        className={cn(
          "group overflow-hidden transition-all duration-200 hover:shadow-premium-lg border-border/60 bg-card",
          subjectBorder
        )}
      >
        <CardContent className="p-0">
          {/* ── Header: number, badges, bookmark ── */}
          <div className="flex items-start justify-between px-5 pt-4 pb-2 gap-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              {/* Question number */}
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white text-[11px] font-extrabold shadow-sm"
              >
                Q{index + 1}
              </motion.span>

              {/* Year badge */}
              {question.year && (
                <Badge
                  variant="outline"
                  className="gap-1 text-[11px] border-border/50 font-medium px-2"
                >
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {question.year}
                </Badge>
              )}

              {/* Shift badge */}
              {question.shift && (
                <Badge
                  variant="outline"
                  className="gap-1 text-[11px] border-border/50 font-medium px-2"
                >
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {question.shift}
                </Badge>
              )}

              {/* Type badge */}
              <Badge
                className={cn(
                  "gap-1 text-[11px] font-semibold border-0",
                  isNumerical
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                )}
              >
                {isNumerical ? (
                  <Hash className="h-3 w-3" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {detectedType}
                {!isNumerical && (
                  <span className="text-[10px] opacity-70 ml-0.5">
                    +4 / -1
                  </span>
                )}
              </Badge>
            </div>

            {/* Bookmark */}
            {session?.user && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={handleSaveToggle}
                disabled={saveLoading}
              >
                <Bookmark
                  className={cn(
                    "h-4 w-4 transition-all duration-200",
                    isSaved
                      ? "fill-red-500 text-red-500"
                      : "text-muted-foreground/40 hover:text-red-400"
                  )}
                />
              </Button>
            )}
          </div>

          {/* ── Exam metadata ── */}
          {(question.year || question.shift || question.paper) && (
            <div className="px-5 pb-2">
              <p className="text-[10px] text-muted-foreground/60 font-medium tracking-wide">
                {examMeta}
              </p>
            </div>
          )}

          {/* ── Chapter tag ── */}
          {question.chapter && (
            <div className="px-5 pb-3">
              <Badge
                variant="secondary"
                className="text-[10px] font-medium bg-muted/60 text-muted-foreground hover:bg-muted/80 rounded-md px-2"
              >
                {question.chapter.name}
              </Badge>
            </div>
          )}

          {/* ── Question body ── */}
          <div className="px-5 pb-4">
            {/* Question text */}
            <div className="text-sm leading-7">
              <MathText text={displayText} />
            </div>

            {/* ── Diagram placeholder ── */}
            {hasFigure && imageUrls.length === 0 && (
              <div className="mt-4 rounded-xl border border-dashed border-amber-300/60 dark:border-amber-700/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 mb-2.5">
                  <ImageIcon className="h-5 w-5 text-amber-500/60" />
                </div>
                <p className="text-sm font-semibold text-amber-700/80 dark:text-amber-400/80 mb-1">
                  Diagram Referenced
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  This question references a figure or diagram. Visualize the
                  described arrangement to solve the problem.
                </p>
              </div>
            )}

            {/* ── Images with zoom ── */}
            {imageUrls.length > 0 && (
              <div className="mt-4 space-y-2">
                {imageUrls.map((url, i) => (
                  <motion.div
                    key={`${url}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative group/img cursor-pointer rounded-xl overflow-hidden border border-border/40"
                    onClick={() => setZoomImage(url)}
                  >
                    <img
                      src={url}
                      alt={`Question ${index + 1} figure${imageUrls.length > 1 ? ` ${i + 1}` : ""}`}
                      className="w-full h-auto max-h-64 object-contain bg-muted/30"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover/img:opacity-80 transition-opacity drop-shadow-lg" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                MCQ: Options with correct answer highlighted
                ══════════════════════════════════════════════════════════════ */}
            {!isNumerical && hasInlineOptions && (
              <div className="mt-5 space-y-2.5">
                {parsedOptions.map((option: string, i: number) => {
                  const letter = OPTION_LETTERS[i];
                  const isCorrect = correctLetter === letter;
                  const colors = OPTION_COLORS[i] || OPTION_COLORS[0];

                  return (
                    <motion.div
                      key={letter}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200",
                        isCorrect
                          ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm shadow-emerald-500/15"
                          : `${colors.border} ${colors.bg}`
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5",
                          isCorrect
                            ? "bg-emerald-500 text-white shadow-sm"
                            : `${colors.bg} ${colors.text} border ${colors.border}`
                        )}
                      >
                        {letter}
                      </span>
                      <div className="flex-1 min-w-0 leading-relaxed">
                        <MathText text={option} />
                      </div>
                      {isCorrect && (
                        <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                Numerical: Answer shown directly
                ══════════════════════════════════════════════════════════════ */}
            {isNumerical && question.correctAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/20 p-3.5"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    Answer
                  </p>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    <MathText text={question.correctAnswer} />
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Solution (always shown, not collapsed) ── */}
            {solutionContent && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-5 rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 shadow-sm shadow-amber-500/5"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Solution
                </p>
                <div className="text-sm leading-7">
                  <MathText text={solutionContent} />
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Image Zoom Dialog ── */}
      <ImageZoomDialog
        src={zoomImage || ""}
        open={!!zoomImage}
        onOpenChange={(open) => !open && setZoomImage(null)}
      />
    </>
  );
}