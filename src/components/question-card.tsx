"use client";

import { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAppState, type QuestionData } from "@/hooks/use-app-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { MathText, extractImagesFromHtml } from "@/components/math-text";
import {
  Bookmark,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Hash,
  Sparkles,
  Lightbulb,
  X,
  ZoomIn,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ──────────────────────────────────────────────────────────────

const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;

type AnswerState = "idle" | "correct" | "incorrect";

const OPTION_COLORS = [
  { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800/60" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800/60" },
  { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800/60" },
  { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800/60" },
  { bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800/60" },
];

// Standard Assertion/Reason options for JEE
function getAROptions(text: string): string[] {
  // Detect if question uses "Assertion (A)" / "Reason (R)" format
  if (/Assertion\s*\(?A?\)?/i.test(text) && /Reason\s*\(?R?\)?/i.test(text)) {
    return [
      "Both (A) and (R) are true and (R) is the correct explanation of (A)",
      "Both (A) and (R) are true but (R) is NOT the correct explanation of (A)",
      "(A) is true but (R) is false",
      "(A) is false but (R) is true",
    ];
  }
  // Default: Statement I / Statement II format
  return [
    "Both Statement I and Statement II are correct and Statement II is the correct explanation of Statement I",
    "Both Statement I and Statement II are correct but Statement II is NOT the correct explanation of Statement I",
    "Statement I is correct but Statement II is incorrect",
    "Statement I is incorrect but Statement II is correct",
  ];
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: QuestionData;
  index: number;
  onUnsave?: (questionId: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text.replace(/\\n/g, "\n");
}

function detectQuestionType(question: QuestionData): "MCQ" | "Numerical" {
  if (question.questionType === "MCQ" || question.questionType === "Numerical") {
    return question.questionType;
  }
  const text = question.questionText + " " + (question.questionHtml || "");
  if (/\(A\)/.test(text) && /\(B\)/.test(text)) return "MCQ";
  return "Numerical";
}

function extractDateFromText(text: string): string | null {
  const m = text.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)/i
  );
  return m ? m[0] : null;
}

function cleanQuestionText(text: string): string {
  return text
    .replace(/\s*(?:Choose the correct (?:answer|option)[s]?.*|Select the correct (?:answer|option)[s]?.*)$/is, "")
    .replace(/\s*ElectricalCircuit\s*Components$/i, "")
    .replace(/\s+([A-Z][a-z]+[A-Z][a-zA-Z]+)$/m, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getSubjectBorder(subjectSlug?: string): string {
  if (!subjectSlug) return "";
  if (subjectSlug.includes("physics")) return "subject-border-physics";
  if (subjectSlug.includes("chem")) return "subject-border-chemistry";
  if (subjectSlug.includes("math")) return "subject-border-mathematics";
  return "";
}

/** Detect if the question is Assertion/Reason type */
function isAssertionReason(text: string): boolean {
  return /(?:Statement[\s-]?[I1]|Assertion|Reason)\s*[:\-]/i.test(text) &&
    /(?:Statement[\s-]?[I1Ii]+|Assertion|Reason)\s*[:\-]/i.test(text) &&
    /(?:In the light of (?:the )?above|choose the correct (?:answer|option) (?:from the options given below|from|given below)|choose the most appropriate)/i.test(text);
}

/**
 * Extract inline options from question text.
 * IMPORTANT: Must receive NORMALIZED text (with real \n, not literal \\n)
 */
function extractInlineOptions(normalizedText: string): string[] {
  // Pattern 1: (A) text (B) text (C) text ...
  const parenRegex = /\(([A-E])\)\s*([\s\S]*?)(?=\(([A-E])\)|$)/g;
  const parenExtracted: string[] = [];
  let match;
  while ((match = parenRegex.exec(normalizedText)) !== null) {
    let optText = match[2].trim();
    if (optText.length > 500) optText = optText.slice(0, 500) + "…";
    parenExtracted.push(optText);
  }
  if (parenExtracted.length >= 2) return parenExtracted;

  // Pattern 2: A. text \n B. text \n C. text ... (each on its own line)
  const dotRegex = /^[A-E]\.\s+([\s\S]*?)(?=\n[A-E]\.\s|$)/gm;
  const dotExtracted: string[] = [];
  while ((match = dotRegex.exec(normalizedText)) !== null) {
    let optText = match[1].trim();
    if (optText.length > 500) optText = optText.slice(0, 500) + "…";
    dotExtracted.push(optText);
  }
  if (dotExtracted.length >= 2) return dotExtracted;

  // Pattern 3: A. text B. text C. text (all inline on same line or mixed)
  // Handles: "A. Electrostatic field lines... B. The electric field... C. ..."
  const firstOptMatch = normalizedText.match(/(?:^|[\s:])\s*([A-E])\.\s+/);
  if (firstOptMatch) {
    // Find the start position of the first option
    const firstOptIdx = normalizedText.indexOf(firstOptMatch[0]) + firstOptMatch[0].length - firstOptMatch[0].trimStart().length;
    const optSection = normalizedText.slice(firstOptIdx).replace(/\s*Choose the correct.*$/is, "").trim();
    // Split on option boundaries: end of sentence then space then new option letter
    const segments = optSection.split(/(?<=\.)\s+(?=[A-E]\.\s)/);
    const inlineExtracted: string[] = [];
    for (const seg of segments) {
      const m = seg.match(/^([A-E])\.\s+([\s\S]*)/);
      if (m) {
        let optText = m[2].trim();
        if (optText.length > 2 && optText.length <= 500) {
          inlineExtracted.push(optText);
        }
      }
    }
    if (inlineExtracted.length >= 2) {
      return inlineExtracted;
    }
  }

  return [];
}

function parseImageUrls(question: QuestionData): string[] {
  const urls: string[] = [];
  if (question.imageUrl) urls.push(question.imageUrl);
  if (question.imageUrls) {
    try {
      const parsed = JSON.parse(question.imageUrls);
      if (Array.isArray(parsed)) urls.push(...parsed);
    } catch { /* ignore */ }
  }
  if (question.questionHtml) {
    const { imageUrls } = extractImagesFromHtml(question.questionHtml);
    urls.push(...imageUrls);
  }
  return [...new Set(urls)];
}

// ─── ImageZoomDialog ────────────────────────────────────────────────────────

function ImageZoomDialog({ src, open, onOpenChange }: { src: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] p-2 bg-black/95 border-white/10">
        <DialogTitle className="sr-only">Image Zoom</DialogTitle>
        <div className="relative">
          <Button variant="ghost" size="icon" className="absolute -top-1 -right-1 z-10 h-8 w-8 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
          <img src={src} alt="Question image zoomed" className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function QuestionCard({ question, index, onUnsave }: QuestionCardProps) {
  const { data: session } = useSession();
  const { savedQuestionIds, toggleSavedQuestionId, setAuthModalOpen, examType, selectedSubject } = useAppState();

  // Answer state
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [numericalInput, setNumericalInput] = useState("");

  // AI Solve state
  const [aiSolving, setAiSolving] = useState(false);
  const [aiSolution, setAiSolution] = useState<string | null>(null);

  // UI state
  const [saveLoading, setSaveLoading] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const normalizedRawText = useMemo(() => normalizeText(question.questionText || ""), [question.questionText]);
  const isSaved = savedQuestionIds.has(question.id);
  const detectedType = detectQuestionType(question);
  const isNumerical = detectedType === "Numerical";
  const subjectBorder = getSubjectBorder(selectedSubject?.slug || question.subject?.slug);
  const imageUrls = parseImageUrls(question);

  const hasAttempted = answerState !== "idle";
  const isAR = isAssertionReason(normalizedRawText);

  // Exam metadata line
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

  const cleanText = useMemo(() => cleanQuestionText(normalizedRawText), [normalizedRawText]);

  // For Assertion/Reason questions, strip the "choose the correct answer" line from display
  const displayText = useMemo(() => {
    let text = cleanText;
    if (isAR) {
      text = text.replace(/\s*(?:In the light of the above statements?,?\s*choose the correct answer from the options given below\.?|choose the most appropriate answer.*?from the options given below\.?)/gi, "").trim();
    }
    return text;
  }, [cleanText, isAR]);

  // Parse options: JSON field → inline from NORMALIZED text → A/R standard → empty
  const parsedOptions = useMemo(() => {
    // 1. Try JSON field
    if (question.options && question.options !== "undefined" && question.options !== "null") {
      try {
        const opts = JSON.parse(question.options);
        if (Array.isArray(opts) && opts.length >= 2) return opts;
      } catch { /* ignore */ }
    }

    if (!isNumerical && normalizedRawText) {
      // 2. Try inline extraction from NORMALIZED text (not raw)
      const extracted = extractInlineOptions(normalizedRawText);
      if (extracted.length >= 2) return extracted;

      // 3. Assertion/Reason standard options
      if (isAR) return getAROptions(normalizedRawText);
    }
    return [];
  }, [question.options, normalizedRawText, isNumerical, isAR]);

  const hasInlineOptions = parsedOptions.length > 0;

  const optionFormat = useMemo(() => {
    if (!normalizedRawText) return "none";
    if (/\([A-E]\)/.test(normalizedRawText)) return "paren";
    const lines = normalizedRawText.split(/\n/);
    let dotCount = 0;
    for (const line of lines) { if (/^[A-E]\.\s/.test(line.trim())) dotCount++; }
    return dotCount >= 2 ? "dot" : "none";
  }, [normalizedRawText]);

  // For display text: remove inline options if they were extracted (non-A/R)
  const finalDisplayText = useMemo(() => {
    if (isAR || !hasInlineOptions || isAR) return displayText;
    if (optionFormat === "paren") return displayText.replace(/\s*\([A-E]\)[\s\S]*$/g, "").replace(/\n{2,}/g, "\n").trim();
    if (optionFormat === "dot") return displayText.replace(/\n[A-E]\.\s[\s\S]*$/g, "").replace(/\n{2,}/g, "\n").trim();
    return displayText;
  }, [displayText, hasInlineOptions, optionFormat, isAR]);

  // Determine the correct letter for highlighting
  const correctLetter = useMemo(() => {
    if (isNumerical || !question.correctAnswer) return null;
    const ans = question.correctAnswer.trim().toUpperCase();
    if (/^[A-E]$/.test(ans)) return ans;
    // Match against option text
    for (let i = 0; i < parsedOptions.length; i++) {
      if (ans === parsedOptions[i].trim()) return String.fromCharCode(65 + i);
    }
    return null;
  }, [isNumerical, question.correctAnswer, parsedOptions]);

  const solutionContent = question.solution || question.solutionHtml || aiSolution || null;

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleOptionSelect = useCallback((letter: string) => {
    if (hasAttempted) return;
    setSelectedOption(letter);
  }, [hasAttempted]);

  const handleCheckAnswer = useCallback(() => {
    if (hasAttempted) return;

    if (isNumerical) {
      const userAns = numericalInput.trim();
      if (!userAns) { toast.error("Enter your answer first"); return; }
      const correctAns = (question.correctAnswer || "").trim();
      const normalizeNum = (s: string) => {
        const n = parseFloat(s);
        return isNaN(n) ? s : String(n);
      };
      const isCorrect = normalizeNum(userAns) === normalizeNum(correctAns);
      setAnswerState(isCorrect ? "correct" : "incorrect");
    } else {
      if (!selectedOption) { toast.error("Select an option first"); return; }
      const isCorrect = selectedOption === correctLetter;
      setAnswerState(isCorrect ? "correct" : "incorrect");
    }
  }, [hasAttempted, isNumerical, numericalInput, selectedOption, correctLetter, question.correctAnswer]);

  const handleReset = useCallback(() => {
    setAnswerState("idle");
    setSelectedOption(null);
    setNumericalInput("");
    setAiSolution(null);
  }, []);

  const handleAiSolve = useCallback(async () => {
    if (aiSolving || aiSolution) return;
    setAiSolving(true);
    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          questionText: question.questionText,
          questionType: detectedType,
          correctAnswer: question.correctAnswer,
        }),
      });
      const data = await res.json();
      if (data.success && data.solution) {
        setAiSolution(data.solution);
        // Also update the answer if we didn't have one
        if (!question.correctAnswer && data.answer) {
          toast.info(`Answer: ${data.answer}`);
        }
      } else {
        toast.error(data.error || "Failed to generate solution");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setAiSolving(false);
    }
  }, [aiSolving, aiSolution, question.id, question.questionText, question.correctAnswer, detectedType]);

  const handleSaveToggle = useCallback(async () => {
    if (!session?.user) { setAuthModalOpen(true); return; }
    setSaveLoading(true);
    try {
      if (isSaved) {
        const res = await fetch(`/api/questions/save?questionId=${question.id}`, { method: "DELETE" });
        if (res.ok) { toggleSavedQuestionId(question.id); onUnsave?.(question.id); toast.success("Question unsaved"); }
      } else {
        const res = await fetch("/api/questions/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId: question.id }) });
        if (res.ok) { toggleSavedQuestionId(question.id); toast.success("Question saved!"); }
      }
    } catch { toast.error("Something went wrong"); }
    finally { setSaveLoading(false); }
  }, [session, isSaved, question.id, toggleSavedQuestionId, setAuthModalOpen, onUnsave]);

  return (
    <>
      <Card className={cn("group overflow-hidden transition-all duration-200 hover:shadow-premium-lg border-border/60 bg-card", subjectBorder)}>
        <CardContent className="p-0">
          {/* Header: number, badges, bookmark */}
          <div className="flex items-start justify-between px-5 pt-4 pb-2 gap-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white text-[11px] font-extrabold shadow-sm"
              >
                Q{index + 1}
              </motion.span>
              {question.year && (
                <Badge variant="outline" className="gap-1 text-[11px] border-border/50 font-medium px-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />{question.year}
                </Badge>
              )}
              {question.shift && (
                <Badge variant="outline" className="gap-1 text-[11px] border-border/50 font-medium px-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />{question.shift}
                </Badge>
              )}
              <Badge className={cn("gap-1 text-[11px] font-semibold border-0", isNumerical ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400")}>
                {isNumerical ? <Hash className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                {detectedType}
                {!isNumerical && <span className="text-[10px] opacity-70 ml-0.5">+4 / -1</span>}
              </Badge>
              {isAR && (
                <Badge variant="outline" className="text-[10px] font-medium border-violet-300/60 text-violet-600 dark:text-violet-400 dark:border-violet-700/40">
                  Assertion / Reason
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {hasAttempted && (
                <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-[11px] text-muted-foreground hover:text-foreground px-2 rounded-lg">
                  Retry
                </Button>
              )}
              {session?.user && (
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30" onClick={handleSaveToggle} disabled={saveLoading}>
                  <Bookmark className={cn("h-4 w-4 transition-all duration-200", isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground/40 hover:text-red-400")} />
                </Button>
              )}
            </div>
          </div>

          {/* Exam metadata line */}
          {(question.year || question.shift || question.paper) && (
            <div className="px-5 pb-2">
              <p className="text-[10px] text-muted-foreground/60 font-medium tracking-wide">{examMeta}</p>
            </div>
          )}

          {/* Chapter tag */}
          {question.chapter && (
            <div className="px-5 pb-3">
              <Badge variant="secondary" className="text-[10px] font-medium bg-muted/60 text-muted-foreground hover:bg-muted/80 rounded-md px-2">
                {question.chapter.name}
              </Badge>
            </div>
          )}

          {/* Question body */}
          <div className="px-5 pb-4">
            {/* Question text */}
            <div className="text-sm leading-7">
              <MathText text={finalDisplayText} />
            </div>

            {/* Images (only if we actually have image URLs) */}
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
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover/img:opacity-80 transition-opacity drop-shadow-lg" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ─── MCQ Options ─────────────────────────────────────────────── */}
            {!isNumerical && hasInlineOptions && (
              <div className="mt-5 space-y-2.5">
                {parsedOptions.map((option: string, i: number) => {
                  const letter = OPTION_LETTERS[i];
                  const isThisCorrect = correctLetter === letter;
                  const isSelected = selectedOption === letter;
                  const colors = OPTION_COLORS[i] || OPTION_COLORS[0];

                  // After attempt: highlight correct/incorrect
                  if (hasAttempted) {
                    return (
                      <motion.div
                        key={letter}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200",
                          isThisCorrect
                            ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm shadow-emerald-500/15"
                            : isSelected
                              ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20"
                              : `${colors.border} ${colors.bg} opacity-60`
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5",
                            isThisCorrect
                              ? "bg-emerald-500 text-white shadow-sm"
                              : isSelected
                                ? "bg-red-500 text-white"
                                : `${colors.bg} ${colors.text} border ${colors.border}`
                          )}
                        >
                          {letter}
                        </span>
                        <div className="flex-1 min-w-0 leading-relaxed">
                          <MathText text={option} />
                        </div>
                        {isThisCorrect && <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />}
                        {isSelected && !isThisCorrect && <XCircle className="h-[18px] w-[18px] shrink-0 text-red-500 dark:text-red-400 mt-0.5" />}
                      </motion.div>
                    );
                  }

                  // Before attempt: clickable
                  return (
                    <motion.div
                      key={letter}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleOptionSelect(letter)}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200 cursor-pointer hover:shadow-md active:scale-[0.99]",
                        isSelected
                          ? "border-foreground/30 bg-foreground/5 shadow-sm ring-2 ring-foreground/10"
                          : `${colors.border} ${colors.bg} hover:border-foreground/20`
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5 transition-all",
                          isSelected
                            ? "bg-foreground text-background"
                            : `${colors.bg} ${colors.text} border ${colors.border}`
                        )}
                      >
                        {letter}
                      </span>
                      <div className="flex-1 min-w-0 leading-relaxed">
                        <MathText text={option} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ─── Generic MCQ buttons (no inline options and not A/R) ─────── */}
            {!isNumerical && !hasInlineOptions && (
              <div className="mt-5">
                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" />
                  Options not available in text — select the correct letter
                </p>
                <div className="flex flex-wrap gap-2">
                  {OPTION_LETTERS.map((letter) => {
                    const isThisCorrect = correctLetter === letter;
                    const isSelected = selectedOption === letter;

                    if (hasAttempted) {
                      return (
                        <motion.button
                          key={letter}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          disabled
                          className={cn(
                            "inline-flex items-center justify-center h-10 min-w-10 px-3.5 rounded-xl border-2 text-sm font-bold transition-all",
                            isThisCorrect
                              ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                              : isSelected
                                ? "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                                : "border-border bg-muted/50 text-muted-foreground/40"
                          )}
                        >
                          {letter}
                          {isThisCorrect && <CheckCircle2 className="h-3.5 w-3.5 ml-1.5" />}
                          {isSelected && !isThisCorrect && <XCircle className="h-3.5 w-3.5 ml-1.5" />}
                        </motion.button>
                      );
                    }

                    return (
                      <motion.button
                        key={letter}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOptionSelect(letter)}
                        className={cn(
                          "inline-flex items-center justify-center h-10 min-w-10 px-3.5 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer",
                          isSelected
                            ? "border-foreground bg-foreground text-background shadow-md"
                            : "border-border bg-card text-foreground hover:border-foreground/30 hover:shadow-sm"
                        )}
                      >
                        {letter}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── Numerical Input ─────────────────────────────────────────── */}
            {isNumerical && (
              <div className="mt-5">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="any"
                    placeholder="Enter your answer (integer or decimal)"
                    value={numericalInput}
                    onChange={(e) => setNumericalInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCheckAnswer(); }}
                    disabled={hasAttempted}
                    className={cn(
                      "h-11 text-sm font-medium",
                      hasAttempted && answerState === "correct" && "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 focus-visible:ring-emerald-400",
                      hasAttempted && answerState === "incorrect" && "border-red-400 bg-red-50 dark:bg-red-950/20 focus-visible:ring-red-400"
                    )}
                  />
                  {!hasAttempted && (
                    <Button
                      onClick={handleCheckAnswer}
                      disabled={!numericalInput.trim()}
                      size="icon"
                      className="h-11 w-11 shrink-0 rounded-xl"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* ─── Submit Button (MCQ with options) ────────────────────────── */}
            {!isNumerical && hasInlineOptions && !hasAttempted && (
              <div className="mt-4">
                <Button
                  onClick={handleCheckAnswer}
                  disabled={!selectedOption}
                  className="w-full h-10 rounded-xl font-semibold text-sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Answer
                </Button>
              </div>
            )}

            {/* ─── Submit Button (MCQ generic letters) ─────────────────────── */}
            {!isNumerical && !hasInlineOptions && !hasAttempted && (
              <div className="mt-4">
                <Button
                  onClick={handleCheckAnswer}
                  disabled={!selectedOption}
                  className="w-full h-10 rounded-xl font-semibold text-sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Answer
                </Button>
              </div>
            )}

            {/* ─── Answer Result Badge ─────────────────────────────────────── */}
            <AnimatePresence>
              {hasAttempted && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4"
                >
                  <div className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
                    answerState === "correct"
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300"
                      : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300"
                  )}>
                    {answerState === "correct" ? (
                      <><CheckCircle2 className="h-5 w-5" /> Correct! 🎉</>
                    ) : (
                      <><XCircle className="h-5 w-5" /> Incorrect</>
                    )}
                  </div>

                  {/* Show correct answer when wrong */}
                  {answerState === "incorrect" && question.correctAnswer && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/80 dark:bg-emerald-950/10 px-4 py-3"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-xs font-medium text-muted-foreground">Correct Answer:</span>
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                        <MathText text={question.correctAnswer} />
                      </span>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Solution (visible only after attempt) ──────────────────── */}
            <AnimatePresence>
              {hasAttempted && solutionContent && (
                <motion.div
                  initial={{ opacity: 0, y: 8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-5 overflow-hidden"
                >
                  <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 shadow-sm shadow-amber-500/5">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5" />
                      Solution
                      {aiSolution && <span className="font-normal normal-case tracking-normal text-[10px] text-muted-foreground ml-1">(AI Generated)</span>}
                    </p>
                    <div className="text-sm leading-7">
                      <MathText text={solutionContent} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* No solution available — show AI Solve button */}
            {hasAttempted && !solutionContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4"
              >
                <div className="rounded-xl border border-dashed border-muted-foreground/20 bg-muted/30 px-4 py-3 text-center">
                  <p className="text-xs text-muted-foreground mb-2">Solution not available for this question</p>
                  <Button
                    onClick={handleAiSolve}
                    disabled={aiSolving}
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs gap-1.5"
                  >
                    {aiSolving ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating Solution...</>
                    ) : (
                      <><Sparkles className="h-3.5 w-3.5" /> Get AI Solution</>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Zoom Dialog */}
      <ImageZoomDialog
        src={zoomImage || ""}
        open={!!zoomImage}
        onOpenChange={(open) => !open && setZoomImage(null)}
      />
    </>
  );
}