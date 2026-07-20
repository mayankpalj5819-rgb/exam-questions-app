"use client";

import { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAppState, type QuestionData } from "@/hooks/use-app-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MathText } from "@/components/math-text";
import {
  Loader2,
  Bookmark,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Hash,
  Sparkles,
  Send,
  RotateCcw,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ──────────────────────────────────────────────────────────────

const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;

const OPTION_COLORS = [
  {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/60",
    selected:
      "border-amber-400 dark:border-amber-600 bg-amber-100 dark:bg-amber-950/60",
  },
  {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
    selected:
      "border-emerald-400 dark:border-emerald-600 bg-emerald-100 dark:bg-emerald-950/60",
  },
  {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/60",
    selected:
      "border-rose-400 dark:border-rose-600 bg-rose-100 dark:bg-rose-950/60",
  },
  {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-200 dark:border-violet-800/60",
    selected:
      "border-violet-400 dark:border-violet-600 bg-violet-100 dark:bg-violet-950/60",
  },
  {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800/60",
    selected:
      "border-sky-400 dark:border-sky-600 bg-sky-100 dark:bg-sky-950/60",
  },
];

const ASSERTION_REASON_OPTIONS = [
  "Both Statement-I and Statement-II are true and Statement-II is the correct explanation of Statement-I",
  "Both Statement-I and Statement-II are true but Statement-II is NOT the correct explanation of Statement-I",
  "Statement-I is true, Statement-II is false",
  "Statement-I is false, Statement-II is true",
];

// ─── Types ──────────────────────────────────────────────────────────────────

type AnswerState = "unanswered" | "checking" | "correct" | "wrong" | "no_answer";

interface QuestionCardProps {
  question: QuestionData;
  index: number;
  onUnsave?: (questionId: string) => void;
  onAnswerUpdate?: (
    questionId: string,
    correctAnswer: string,
    solution: string
  ) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Detect if question is assertion-reason type */
function isAssertionReason(text: string): boolean {
  return /Statement-I/i.test(text) && /Statement-II/i.test(text);
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
  return /\b(?:figure|diagram|circuit|graph|arrangement|setup|configuration|shown below|given below|given figure|following figure)\b/i.test(
    text
  );
}

/** Normalize numerical answer for comparison */
function normalizeNumericalAnswer(answer: string): string {
  return answer
    .replace(/\s/g, "")
    .replace(/^0+(?=.)/, "")
    .toLowerCase();
}

/** Extract inline options (A), (B), etc. from question text */
function extractInlineOptions(text: string): string[] {
  // Only extract from the portion after common option-intro phrases
  const introMatch = text.match(/(?:choose the correct|select the correct|options given|following options?|answer from the options)/i);
  const searchFrom = introMatch ? text.indexOf(introMatch[0]) : 0;
  const optionText = text.slice(searchFrom);

  const optionRegex = /\(([A-E])\)\s*([\s\S]*?)(?=\(([A-E])\)|$)/g;
  const extracted: string[] = [];
  let match;
  while ((match = optionRegex.exec(optionText)) !== null) {
    let optText = match[2].trim();
    // Limit option length to prevent capturing question body
    if (optText.length > 500) {
      optText = optText.slice(0, 500).trim() + "…";
    }
    extracted.push(optText);
  }
  return extracted;
}

/** Compare MCQ answers, accounting for various formats */
function isMcqAnswerMatch(
  userAnswer: string,
  correctAnswer: string
): boolean {
  const userNorm = userAnswer.trim().toUpperCase();
  const correctNorm = correctAnswer.trim().toUpperCase();

  // Direct letter match: A, B, C, D
  if (/^[A-E]$/.test(correctNorm) && userNorm === correctNorm) return true;

  // Answer might be like "Option A" or "(A)"
  if (
    /^[A-E]$/.test(correctNorm) &&
    (userNorm === `OPTION ${correctNorm}` ||
      userNorm === `(${correctNorm})`)
  )
    return true;

  // If both are longer text, compare trimmed
  if (userNorm === correctNorm) return true;

  // Numeric comparison in case both look numeric
  const userNum = parseFloat(userNorm);
  const correctNum = parseFloat(correctNorm);
  if (!isNaN(userNum) && !isNaN(correctNum) && userNum === correctNum)
    return true;

  return false;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function QuestionCard({
  question,
  index,
  onUnsave,
  onAnswerUpdate,
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
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [numericalInput, setNumericalInput] = useState("");
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  // Track AI-returned answer so we can show correct/wrong even after initial load
  const [aiCorrectAnswer, setAiCorrectAnswer] = useState<string | null>(null);
  const [aiSolution, setAiSolution] = useState<string | null>(null);

  // ── Derived Values ──
  const isSaved = savedQuestionIds.has(question.id);
  const detectedType = detectQuestionType(question);
  const isNumerical = detectedType === "Numerical";
  const isAssertion = !isNumerical && isAssertionReason(question.questionText);
  const subjectBorder = getSubjectBorder(selectedSubject?.slug || question.subject?.slug);
  const isAnswered = answerState !== "unanswered" && answerState !== "checking";
  const hasFigure = hasFigureReference(question.questionText || "");

  // Use AI-returned answer if available, otherwise fall back to DB
  const effectiveCorrectAnswer = aiCorrectAnswer || question.correctAnswer || null;
  const effectiveSolution = aiSolution || question.solution || question.solutionHtml || null;

  // ── Exam Meta ──
  const examMeta = useMemo(() => {
    const parts: string[] = [];
    parts.push(examType === "jee-main" ? "JEE Main" : "JEE Advanced");
    if (question.year) parts.push(String(question.year));
    const dateStr = extractDateFromText(question.questionText || "");
    if (dateStr) parts.push(`(${dateStr})`);
    if (question.shift) parts.push(question.shift);
    if (question.paper) parts.push(question.paper);
    return parts.join(" · ").trim();
  }, [question.year, question.shift, question.paper, question.questionText, examType]);

  // ── Clean Question Text ──
  const cleanText = useMemo(
    () => cleanQuestionText(question.questionText || ""),
    [question.questionText]
  );

  // ── Parse Options ──
  const parsedOptions = useMemo(() => {
    // Assertion-reason: use standard options
    if (isAssertion) return ASSERTION_REASON_OPTIONS;

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

    // No options found — return empty (will show generic letter buttons)
    return [];
  }, [question.options, question.questionText, isNumerical, isAssertion]);

  const hasInlineOptions = parsedOptions.length > 0;
  const showGenericOptions =
    !isNumerical && !isAssertion && !hasInlineOptions;

  // ── Display Text (strip options from body) ──
  const displayText = useMemo(() => {
    if (hasInlineOptions && !isAssertion) {
      return cleanText
        .replace(/\s*\([A-E]\)[\s\S]*$/g, "")
        .replace(/\n{2,}/g, "\n")
        .trim();
    }
    return cleanText;
  }, [cleanText, hasInlineOptions, isAssertion]);

  // ── Determine correct answer letter for MCQ ──
  const correctLetter = useMemo(() => {
    if (isNumerical || !effectiveCorrectAnswer) return null;
    const ans = effectiveCorrectAnswer.trim();
    if (/^[A-E]$/.test(ans)) return ans;
    // Try matching against parsed option text
    for (let i = 0; i < parsedOptions.length; i++) {
      if (ans === parsedOptions[i].trim())
        return String.fromCharCode(65 + i);
    }
    return ans.length === 1 && ans >= "A" && ans <= "E" ? ans : null;
  }, [isNumerical, effectiveCorrectAnswer, parsedOptions]);

  // ── Handlers ──

  const handleOptionSelect = useCallback(
    (letter: string) => {
      if (isAnswered) return;
      setSelectedOption(letter);
    },
    [isAnswered]
  );

  const handleCheckAnswer = useCallback(async () => {
    if (answerState !== "unanswered") return;

    const userAnswer = isNumerical
      ? numericalInput.trim()
      : selectedOption;
    if (!userAnswer) {
      toast.error(
        isNumerical
          ? "Please enter an answer"
          : "Please select an option"
      );
      return;
    }

    // If correctAnswer exists (DB or previously AI-returned), check directly
    if (effectiveCorrectAnswer) {
      if (isNumerical) {
        const match =
          normalizeNumericalAnswer(userAnswer) ===
          normalizeNumericalAnswer(effectiveCorrectAnswer);
        setAnswerState(match ? "correct" : "wrong");
      } else {
        const match = isMcqAnswerMatch(userAnswer, effectiveCorrectAnswer);
        setAnswerState(match ? "correct" : "wrong");
      }
      return;
    }

    // No answer available — call AI
    setAnswerState("checking");
    try {
      const payload: Record<string, unknown> = {
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        options:
          parsedOptions.length > 0 ? parsedOptions : null,
        userAnswer,
      };
      if (isAssertion) {
        payload.options = ASSERTION_REASON_OPTIONS;
      }

      const res = await fetch("/api/ai-solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.correctAnswer) {
        // Persist AI answer locally
        setAiCorrectAnswer(data.correctAnswer);
        if (data.explanation) {
          setAiSolution(data.explanation);
        }

        // Determine correct/wrong
        if (isNumerical) {
          const match =
            normalizeNumericalAnswer(userAnswer) ===
            normalizeNumericalAnswer(data.correctAnswer);
          setAnswerState(match ? "correct" : "wrong");
        } else {
          const match = isMcqAnswerMatch(
            userAnswer,
            data.correctAnswer
          );
          setAnswerState(match ? "correct" : "wrong");
        }

        // Notify parent so answer persists in app state
        onAnswerUpdate?.(
          question.id,
          data.correctAnswer,
          data.explanation || ""
        );
      } else {
        setAnswerState("no_answer");
      }
    } catch (err) {
      console.error("[QuestionCard] handleCheckAnswer error:", err);
      setAnswerState("no_answer");
      toast.error("Failed to get answer. Please try again.");
    }
  }, [
    answerState,
    isNumerical,
    numericalInput,
    selectedOption,
    effectiveCorrectAnswer,
    question.id,
    question.questionText,
    question.questionType,
    parsedOptions,
    isAssertion,
    onAnswerUpdate,
  ]);

  const handleReset = useCallback(() => {
    setSelectedOption(null);
    setAnswerState("unanswered");
    setNumericalInput("");
  }, []);

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

  // ── Option Style Helpers ──

  const getOptionContainerClass = useCallback(
    (letter: string, colorIndex: number) => {
      const colors = OPTION_COLORS[colorIndex] || OPTION_COLORS[0];
      const isCorrectOpt = correctLetter === letter;
      const isSelected = selectedOption === letter;

      if (answerState === "checking") {
        return cn(
          "flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200",
          isSelected
            ? `${colors.selected}`
            : `${colors.border} ${colors.bg}`,
          isSelected ? "cursor-wait" : "opacity-60"
        );
      }

      if (answerState === "no_answer") {
        if (isSelected) {
          return cn(
            "flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200",
            `${colors.selected}`
          );
        }
        return cn(
          "flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200 opacity-50",
          `${colors.border} ${colors.bg}`
        );
      }

      if (!isAnswered) {
        return cn(
          "flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200 cursor-pointer",
          `${colors.border} ${colors.bg}`,
          `hover:${colors.selected} hover:shadow-sm active:scale-[0.995]`,
          isSelected && `${colors.selected}`
        );
      }

      // Answered (correct or wrong)
      if (isCorrectOpt) {
        return cn(
          "flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200",
          "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm shadow-emerald-500/15"
        );
      }
      if (isSelected && !isCorrectOpt) {
        return cn(
          "flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200",
          "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/30 shadow-sm shadow-red-500/15"
        );
      }

      // Dimmed other options
      return cn(
        "flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200 opacity-50",
        `${colors.border} ${colors.bg}`
      );
    },
    [answerState, isAnswered, selectedOption, correctLetter]
  );

  const getLetterCircleClass = useCallback(
    (letter: string, colorIndex: number) => {
      const colors = OPTION_COLORS[colorIndex] || OPTION_COLORS[0];
      const isCorrectOpt = correctLetter === letter;
      const isSelected = selectedOption === letter;

      if (answerState === "checking") {
        if (isSelected) {
          return cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5",
            `${colors.text} bg-white/80 dark:bg-white/10 border ${colors.border}`
          );
        }
        return cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5 opacity-50",
          `${colors.bg} ${colors.text} border ${colors.border}`
        );
      }

      if (answerState === "no_answer") {
        if (isSelected) {
          return cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5",
            `${colors.text} bg-white/80 dark:bg-white/10 border ${colors.border}`
          );
        }
        return cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5 opacity-50",
          `${colors.bg} ${colors.text} border ${colors.border}`
        );
      }

      if (!isAnswered) {
        return cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5 transition-all duration-200",
          `${colors.bg} ${colors.text} border ${colors.border}`,
          isSelected && "bg-white/80 dark:bg-white/10 scale-105"
        );
      }

      if (isCorrectOpt) {
        return "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5 bg-emerald-500 text-white shadow-sm";
      }
      if (isSelected && !isCorrectOpt) {
        return "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5 bg-red-500 text-white shadow-sm";
      }

      return cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5",
        `${colors.bg} ${colors.text} border ${colors.border}`
      );
    },
    [answerState, isAnswered, selectedOption, correctLetter]
  );

  // Determine if check button should be enabled
  const canCheck =
    answerState === "unanswered" &&
    (isNumerical ? numericalInput.trim().length > 0 : selectedOption !== null);

  // ── Render ──

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-200 hover:shadow-premium-lg border-border/60 bg-card",
        subjectBorder,
        answerState === "correct" && "ring-1 ring-emerald-400/40",
        answerState === "wrong" && "ring-1 ring-red-400/40",
        answerState === "checking" && "ring-1 ring-amber-400/40"
      )}
    >
      <CardContent className="p-0">
        {/* ── Header: number, badges, bookmark ── */}
        <div className="flex items-start justify-between px-5 pt-4 pb-2 gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {/* Question number */}
            <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white text-[11px] font-extrabold shadow-sm">
              Q{index + 1}
            </span>

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
                  : isAssertion
                    ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
              )}
            >
              {isNumerical ? (
                <Hash className="h-3 w-3" />
              ) : isAssertion ? (
                <Sparkles className="h-3 w-3" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {isAssertion ? "A&R" : detectedType}
              {!isNumerical && (
                <span className="text-[10px] opacity-70 ml-0.5">
                  +4 / -1
                </span>
              )}
            </Badge>

            {/* Answer state badge */}
            <AnimatePresence mode="wait">
              {answerState === "correct" && (
                <motion.div
                  key="correct-badge"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge className="gap-1 text-[11px] font-bold border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Correct!
                  </Badge>
                </motion.div>
              )}
              {answerState === "wrong" && (
                <motion.div
                  key="wrong-badge"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge className="gap-1 text-[11px] font-bold border-0 bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
                    <XCircle className="h-3 w-3" />
                    Incorrect
                  </Badge>
                </motion.div>
              )}
              {answerState === "no_answer" && (
                <motion.div
                  key="no-answer-badge"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge className="gap-1 text-[11px] font-bold border-0 bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                    <AlertCircle className="h-3 w-3" />
                    {!isNumerical && selectedOption
                      ? `Answered: ${selectedOption}`
                      : "Answered"}
                  </Badge>
                </motion.div>
              )}
              {answerState === "checking" && (
                <motion.div
                  key="checking-badge"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge className="gap-1 text-[11px] font-bold border-0 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Solving with AI...
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
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
          {hasFigure && (
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

          {/* ══════════════════════════════════════════════════════════════
              MCQ: Extracted / Assertion-Reason Options
              ══════════════════════════════════════════════════════════════ */}
          {!isNumerical && hasInlineOptions && (
            <div className="mt-5 space-y-2.5">
              {parsedOptions.map((option: string, i: number) => {
                const letter = OPTION_LETTERS[i];
                const isCorrectOpt = correctLetter === letter;
                const isSelected = selectedOption === letter;
                return (
                  <div
                    key={letter}
                    className={getOptionContainerClass(letter, i)}
                    onClick={() => handleOptionSelect(letter)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Option ${letter}: ${option}`}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleOptionSelect(letter)
                    }
                  >
                    <span className={getLetterCircleClass(letter, i)}>
                      {letter}
                    </span>
                    <div className="flex-1 min-w-0 leading-relaxed">
                      <MathText text={option} />
                    </div>
                    {isAnswered &&
                      answerState !== "no_answer" &&
                      isCorrectOpt && (
                        <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                      )}
                    {isAnswered &&
                      answerState !== "no_answer" &&
                      isSelected &&
                      !isCorrectOpt && (
                        <XCircle className="h-[18px] w-[18px] shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
                      )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              MCQ: Generic Letter Buttons (no inline options)
              ══════════════════════════════════════════════════════════════ */}
          {showGenericOptions && (
            <div className="mt-5">
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                This question has no embedded options. Select a letter and AI
                will verify your answer.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {OPTION_LETTERS.map((letter, i) => {
                  const colors = OPTION_COLORS[i] || OPTION_COLORS[0];
                  const isCorrectOpt = correctLetter === letter;
                  const isSelected = selectedOption === letter;

                  let containerClass: string;
                  let circleClass: string;

                  if (answerState === "checking") {
                    containerClass = cn(
                      "flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm transition-all duration-200",
                      isSelected
                        ? `${colors.selected}`
                        : `${colors.border} ${colors.bg}`,
                      isSelected ? "cursor-wait" : "opacity-60"
                    );
                    circleClass = cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold",
                      isSelected
                        ? `${colors.text} bg-white/80 dark:bg-white/10 border ${colors.border}`
                        : `${colors.bg} ${colors.text} border ${colors.border}`
                    );
                  } else if (answerState === "no_answer") {
                    containerClass = cn(
                      "flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm transition-all duration-200",
                      isSelected
                        ? `${colors.selected}`
                        : `opacity-50 ${colors.border} ${colors.bg}`
                    );
                    circleClass = cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold",
                      isSelected
                        ? `${colors.text} bg-white/80 dark:bg-white/10 border ${colors.border}`
                        : `opacity-50 ${colors.bg} ${colors.text} border ${colors.border}`
                    );
                  } else if (!isAnswered) {
                    containerClass = cn(
                      "flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm transition-all duration-200 cursor-pointer",
                      `${colors.border} ${colors.bg}`,
                      `hover:${colors.selected} hover:shadow-sm active:scale-[0.97]`,
                      isSelected && `${colors.selected}`
                    );
                    circleClass = cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold transition-all duration-200",
                      `${colors.bg} ${colors.text} border ${colors.border}`,
                      isSelected && "bg-white/80 dark:bg-white/10 scale-110"
                    );
                  } else if (isCorrectOpt) {
                    containerClass =
                      "flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm transition-all duration-200 border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm shadow-emerald-500/15";
                    circleClass =
                      "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold bg-emerald-500 text-white shadow-sm";
                  } else if (isSelected && !isCorrectOpt) {
                    containerClass =
                      "flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm transition-all duration-200 border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/30 shadow-sm shadow-red-500/15";
                    circleClass =
                      "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold bg-red-500 text-white shadow-sm";
                  } else {
                    containerClass = cn(
                      "flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm transition-all duration-200 opacity-50",
                      `${colors.border} ${colors.bg}`
                    );
                    circleClass = cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold",
                      `${colors.bg} ${colors.text} border ${colors.border}`
                    );
                  }

                  return (
                    <div
                      key={letter}
                      className={containerClass}
                      onClick={() => handleOptionSelect(letter)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Option ${letter}`}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleOptionSelect(letter)
                      }
                    >
                      <span className={circleClass}>{letter}</span>
                      {isAnswered && answerState !== "no_answer" && isCorrectOpt && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                      {isAnswered && answerState !== "no_answer" && isSelected && !isCorrectOpt && (
                        <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              Numerical Input
              ══════════════════════════════════════════════════════════════ */}
          {isNumerical && (
            <div className="mt-5">
              {/* Input state (unanswered or checking) */}
              {(answerState === "unanswered" ||
                answerState === "checking") && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="Enter your answer..."
                      value={numericalInput}
                      onChange={(e) => setNumericalInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCheckAnswer()
                      }
                      disabled={answerState === "checking"}
                      className="h-11 pl-10 text-sm font-medium rounded-xl border-border/60 focus:border-amber-400 focus:ring-amber-400/20"
                    />
                  </div>
                  <Button
                    onClick={handleCheckAnswer}
                    disabled={!canCheck}
                    className="h-11 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold gap-2 shadow-sm disabled:opacity-50"
                  >
                    {answerState === "checking" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">
                      {answerState === "checking"
                        ? "Checking..."
                        : "Check"}
                    </span>
                  </Button>
                </div>
              )}

              {/* Answered state display */}
              {isAnswered && (
                <div className="space-y-3">
                  {/* User's answer */}
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3.5",
                      answerState === "correct" ||
                        answerState === "no_answer"
                        ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/20"
                        : "border-red-300 dark:border-red-700 bg-red-50/80 dark:bg-red-950/20"
                    )}
                  >
                    {answerState === "no_answer" ? (
                      <AlertCircle className="h-5 w-5 text-sky-500 dark:text-sky-400 shrink-0" />
                    ) : answerState === "correct" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">
                        {answerState === "no_answer"
                          ? "Your answer"
                          : "Your answer"}
                      </p>
                      <p
                        className={cn(
                          "text-sm font-bold",
                          answerState === "correct" ||
                            answerState === "no_answer"
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-red-700 dark:text-red-300 line-through"
                        )}
                      >
                        <MathText text={numericalInput} />
                      </p>
                    </div>
                  </div>

                  {/* Correct answer (show when wrong) */}
                  {answerState === "wrong" && effectiveCorrectAnswer && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/20 p-3.5"
                    >
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">
                          Correct answer
                        </p>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                          <MathText text={effectiveCorrectAnswer} />
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              Check Answer Button (MCQ only — shown below options)
              ══════════════════════════════════════════════════════════════ */}
          {!isNumerical && (
            <AnimatePresence mode="wait">
              {answerState === "unanswered" && (
                <motion.div
                  key="check-btn"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4 flex items-center justify-center"
                >
                  <Button
                    onClick={handleCheckAnswer}
                    disabled={!canCheck}
                    className={cn(
                      "rounded-xl font-semibold gap-2 shadow-sm disabled:opacity-40 transition-all duration-200",
                      selectedOption
                        ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white hover:shadow-md"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Check Answer
                  </Button>
                </motion.div>
              )}

              {answerState === "checking" && (
                <motion.div
                  key="checking-btn"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4 flex items-center justify-center"
                >
                  <Button disabled className="rounded-xl font-semibold gap-2 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-0">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Solving with AI...
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* ══════════════════════════════════════════════════════════════
              MCQ Answer Feedback
              ══════════════════════════════════════════════════════════════ */}
          {isAnswered && !isNumerical && answerState === "correct" && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-emerald-200/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-center"
              >
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Correct! Well done!
                </p>
              </motion.div>
            </AnimatePresence>
          )}

          {isAnswered && !isNumerical && answerState === "wrong" && correctLetter && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/20 p-3.5"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    Correct answer
                  </p>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    Option {correctLetter}
                    {parsedOptions.length > 0 &&
                      correctLetter.charCodeAt(0) - 65 <
                        parsedOptions.length && (
                        <span className="font-normal text-emerald-600 dark:text-emerald-400 ml-2 text-xs">
                          — {parsedOptions[correctLetter.charCodeAt(0) - 65].slice(0, 80)}
                          {parsedOptions[correctLetter.charCodeAt(0) - 65].length > 80
                            ? "..."
                            : ""}
                        </span>
                      )}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* No answer available info box */}
          {isAnswered && answerState === "no_answer" && (
            <div className="mt-3 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">
                Could not verify answer. The AI may not have enough context for
                this question.
              </p>
            </div>
          )}

          {/* ── Try Again ── */}
          {isAnswered && (
            <div className="mt-4 flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 rounded-lg"
              >
                <RotateCcw className="h-3 w-3" />
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* ── Solution Section (collapsible) ── */}
        {effectiveSolution && (
          <div className="border-t border-border/30">
            <button
              className={cn(
                "w-full flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-medium transition-colors",
                "text-amber-700 dark:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
              )}
              onClick={() => setSolutionOpen(!solutionOpen)}
              aria-expanded={solutionOpen}
            >
              {solutionOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              <Lightbulb className="h-3.5 w-3.5" />
              {solutionOpen ? "Hide Solution" : "Show Solution"}
            </button>

            <AnimatePresence>
              {solutionOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4">
                    <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 shadow-sm shadow-amber-500/5">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5" />
                        Solution
                      </p>
                      <div className="text-sm leading-7">
                        <MathText text={effectiveSolution} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}