"use client";

import { useState, useMemo } from "react";
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
import { MathText } from "@/components/math-text";
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Maximize2,
  Hash,
  Sparkles,
  Send,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Color palette for option circles ─────────────────────────────────────
const OPTION_COLORS = [
  { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800/60", selected: "border-amber-400 dark:border-amber-600 bg-amber-100 dark:bg-amber-950/60" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800/60", selected: "border-emerald-400 dark:border-emerald-600 bg-emerald-100 dark:bg-emerald-950/60" },
  { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800/60", selected: "border-rose-400 dark:border-rose-600 bg-rose-100 dark:bg-rose-950/60" },
  { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800/60", selected: "border-violet-400 dark:border-violet-600 bg-violet-100 dark:bg-violet-950/60" },
  { bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800/60", selected: "border-sky-400 dark:border-sky-600 bg-sky-100 dark:bg-sky-950/60" },
];

// ─── Types ─────────────────────────────────────────────────────────────────

type AnswerState = "unanswered" | "correct" | "wrong" | "no_answer";

interface QuestionCardProps {
  question: QuestionData;
  index: number;
  onUnsave?: (questionId: string) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function detectQuestionType(question: QuestionData): "MCQ" | "Numerical" {
  if (question.questionType === "MCQ" || question.questionType === "Numerical") {
    return question.questionType;
  }
  const text = question.questionText + " " + (question.questionHtml || "");
  if (/\(A\)/.test(text) && /\(B\)/.test(text)) {
    return "MCQ";
  }
  return "Numerical";
}

function extractDateFromText(text: string): string | null {
  const dateMatch = text.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)/i
  );
  return dateMatch ? dateMatch[0] : null;
}

function cleanQuestionText(text: string): string {
  return text
    .replace(/\s*(?:Choose the correct (?:answer|option)[s]?.*|Select the correct (?:answer|option)[s]?.*)$/is, "")
    .replace(/\s*ElectricalCircuit\s*Components$/i, "")
    .replace(/\s+([A-Z][a-z]+[A-Z][a-zA-Z]+)$/m, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getSubjectBorder(subjectSlug?: string) {
  if (!subjectSlug) return "";
  if (subjectSlug.includes("physics")) return "subject-border-physics";
  if (subjectSlug.includes("chem")) return "subject-border-chemistry";
  if (subjectSlug.includes("math")) return "subject-border-mathematics";
  return "";
}

function hasFigureReference(text: string): boolean {
  return /\b(?:figure|diagram|circuit|graph|arrangement|setup|configuration|shown below|given below|given figure|following figure)\b/i.test(text);
}

function normalizeNumericalAnswer(answer: string): string {
  return answer.replace(/\s/g, "").replace(/^0+(?=.)/, "");
}

function ImageZoomDialog({ url, alt, open, onOpenChange }: { url: string; alt: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-auto p-0 border-0 bg-black/95 backdrop-blur-xl sm:max-w-[95vw]">
        <DialogTitle className="sr-only">Image Preview</DialogTitle>
        <div className="relative flex items-center justify-center p-2">
          <img src={url.startsWith("/") || url.startsWith("data:") ? url : "/api/image-proxy?url=" + encodeURIComponent(url)} alt={alt} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function QuestionCard({ question, index, onUnsave }: QuestionCardProps) {
  const { data: session } = useSession();
  const { savedQuestionIds, toggleSavedQuestionId, setAuthModalOpen, examType, selectedSubject } = useAppState();

  // ── State ──
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [numericalInput, setNumericalInput] = useState("");
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // ── Derived ──
  const isSaved = savedQuestionIds.has(question.id);
  const detectedType = detectQuestionType(question);
  const isNumerical = detectedType === "Numerical";
  const subjectBorder = getSubjectBorder(selectedSubject?.slug);
  const isAnswered = answerState !== "unanswered";
  const hasAnswer = !!question.correctAnswer;
  const hasFigure = hasFigureReference(question.questionText || "");

  // Build exam metadata
  const examMeta = useMemo(() => {
    const parts: string[] = [];
    parts.push(examType === "jee-main" ? "JEE Main" : "JEE Advanced");
    if (question.year) parts.push(String(question.year));
    const dateStr = extractDateFromText(question.questionText || "");
    if (dateStr) parts.push(`(${dateStr})`);
    if (question.shift) parts.push(question.shift);
    return parts.join(" ").trim();
  }, [question.year, question.shift, question.questionText, examType]);

  const cleanText = useMemo(() => cleanQuestionText(question.questionText || ""), [question.questionText]);

  // Parse options
  const parsedOptions = useMemo(() => {
    if (question.options && question.options !== "undefined" && question.options !== "null") {
      try {
        const opts = JSON.parse(question.options);
        if (Array.isArray(opts) && opts.length >= 2) return opts;
      } catch { /* ignore */ }
    }
    if (!isNumerical && question.questionText) {
      const optionRegex = /\(([A-E])\)\s*([\s\S]*?)(?=\([A-E]\)|$)/g;
      const extracted: string[] = [];
      let match;
      while ((match = optionRegex.exec(question.questionText)) !== null) {
        extracted.push(match[2].trim());
      }
      if (extracted.length >= 2) return extracted;
    }
    return [];
  }, [question.options, question.questionText, isNumerical]);

  // Determine correct answer letter for MCQ
  const correctLetter = useMemo(() => {
    if (isNumerical || !question.correctAnswer) return null;
    // If correctAnswer is a single letter
    if (/^[A-E]$/.test(question.correctAnswer.trim())) return question.correctAnswer.trim();
    // If correctAnswer matches an option text, find the letter
    for (let i = 0; i < parsedOptions.length; i++) {
      if (question.correctAnswer.trim() === parsedOptions[i].trim()) return String.fromCharCode(65 + i);
    }
    return question.correctAnswer.trim();
  }, [isNumerical, question.correctAnswer, parsedOptions]);

  // Image URLs
  const allImageUrls = useMemo(() => {
    const urls: string[] = [];
    if (question.imageUrl) urls.push(question.imageUrl);
    if (question.imageUrls) {
      try {
        const parsed = JSON.parse(question.imageUrls);
        if (Array.isArray(parsed)) for (const u of parsed) { if (typeof u === "string" && !urls.includes(u)) urls.push(u); }
      } catch { if (!urls.includes(question.imageUrls)) urls.push(question.imageUrls); }
    }
    if (question.questionHtml) {
      const imgMatches = question.questionHtml.match(/src=["']([^"']+)["']/gi);
      if (imgMatches) {
        for (const match of imgMatches) {
          const srcMatch = match.match(/src=["']([^"']+)["']/i);
          if (srcMatch?.[1] && !urls.includes(srcMatch[1]) && !srcMatch[1].startsWith("data:")) urls.push(srcMatch[1]);
        }
      }
    }
    return urls;
  }, [question.imageUrl, question.imageUrls, question.questionHtml]);

  // Display text (remove options from body)
  const displayText = useMemo(() => {
    if (parsedOptions.length >= 2) {
      return cleanText.replace(/\s*\([A-E]\)[\s\S]*$/g, "").replace(/\n{2,}/g, "\n").trim();
    }
    return cleanText;
  }, [cleanText, parsedOptions.length]);

  // ── Handlers ──

  const handleOptionClick = (letter: string) => {
    if (isAnswered) return;
    setSelectedOption(letter);
    if (!hasAnswer) {
      setAnswerState("no_answer");
    } else if (correctLetter && letter === correctLetter) {
      setAnswerState("correct");
    } else {
      setAnswerState("wrong");
    }
  };

  const handleNumericalSubmit = () => {
    if (isAnswered || !numericalInput.trim()) return;
    if (!hasAnswer) {
      setAnswerState("no_answer");
      return;
    }
    const userAns = normalizeNumericalAnswer(numericalInput.trim());
    const correctAns = normalizeNumericalAnswer(question.correctAnswer!.trim());
    if (userAns === correctAns) {
      setAnswerState("correct");
    } else {
      setAnswerState("wrong");
    }
  };

  const handleReset = () => {
    setSelectedOption(null);
    setAnswerState("unanswered");
    setNumericalInput("");
  };

  const handleSaveToggle = async () => {
    if (!session?.user) { setAuthModalOpen(true); return; }
    setSaveLoading(true);
    try {
      if (isSaved) {
        const res = await fetch(`/api/questions/save?questionId=${question.id}`, { method: "DELETE" });
        if (res.ok) { toggleSavedQuestionId(question.id); toast.success("Question unsaved"); }
      } else {
        const res = await fetch("/api/questions/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId: question.id }) });
        if (res.ok) { toggleSavedQuestionId(question.id); toast.success("Question saved!"); }
      }
    } catch { toast.error("Something went wrong"); }
    finally { setSaveLoading(false); }
  };

  // ── Get option style based on answer state ──

  const getOptionStyle = (letter: string, i: number) => {
    const colors = OPTION_COLORS[i] || OPTION_COLORS[0];
    const isCorrectOpt = correctLetter === letter;
    const isSelected = selectedOption === letter;

    if (!isAnswered) {
      // Unanswered state - hoverable
      return cn(
        "flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200 cursor-pointer",
        `${colors.border} ${colors.bg} hover:${colors.selected} hover:shadow-sm active:scale-[0.99]`
      );
    }

    // No answer available in database - show selection without correct/wrong
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

    if (isCorrectOpt) {
      // Correct answer - always green
      return cn(
        "flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200",
        "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm shadow-emerald-500/15"
      );
    }

    if (isSelected && !isCorrectOpt) {
      // Wrong selection - red
      return cn(
        "flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200",
        "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/30 shadow-sm shadow-red-500/15"
      );
    }

    // Other options when answered - dimmed
    return cn(
      "flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200 opacity-50",
      `${colors.border} ${colors.bg}`
    );
  };

  const getOptionLetterStyle = (letter: string, i: number) => {
    const colors = OPTION_COLORS[i] || OPTION_COLORS[0];
    const isCorrectOpt = correctLetter === letter;
    const isSelected = selectedOption === letter;

    if (!isAnswered) {
      return cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5 transition-all duration-200", `${colors.bg} ${colors.text} border ${colors.border}`);
    }
    // No answer available in database
    if (answerState === "no_answer") {
      if (isSelected) {
        return cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5", `${colors.text} bg-white/80 dark:bg-white/10 border ${colors.border}`);
      }
      return cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5 opacity-50", `${colors.bg} ${colors.text} border ${colors.border}`);
    }
    if (isCorrectOpt) {
      return "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5 bg-emerald-500 text-white shadow-sm";
    }
    if (isSelected && !isCorrectOpt) {
      return "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5 bg-red-500 text-white shadow-sm";
    }
    return cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5", `${colors.bg} ${colors.text} border ${colors.border}`);
  };

  return (
    <>
      <Card className={cn("group overflow-hidden transition-all duration-200 hover:shadow-premium-lg border-border/60 bg-card", subjectBorder, isAnswered && answerState === "correct" && "ring-1 ring-emerald-400/40", isAnswered && answerState === "wrong" && "ring-1 ring-red-400/40")}>
        <CardContent className="p-0">
          {/* ── Question meta header ── */}
          <div className="flex items-start justify-between px-5 pt-4 pb-2 gap-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white text-[11px] font-extrabold shadow-sm">
                Q{index + 1}
              </span>

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

              {/* Answer status badge */}
              {isAnswered && answerState === "no_answer" && !isNumerical && (
                <Badge className="gap-1 text-[11px] font-bold border-0 bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                  Your answer: {selectedOption}
                </Badge>
              )}
              {isAnswered && answerState === "no_answer" && isNumerical && (
                <Badge className="gap-1 text-[11px] font-bold border-0 bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                  Answered
                </Badge>
              )}
              {isAnswered && answerState !== "no_answer" && (
                <Badge className={cn("gap-1 text-[11px] font-bold border-0", answerState === "correct" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300")}>
                  {answerState === "correct" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {answerState === "correct" ? "Correct!" : "Incorrect"}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              {session?.user && (
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30" onClick={handleSaveToggle} disabled={saveLoading}>
                  <Bookmark className={cn("h-4 w-4 transition-all duration-200", isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground/40 hover:text-red-400")} />
                </Button>
              )}
            </div>
          </div>

          {/* ── Exam metadata ── */}
          {(question.year || question.shift) && (
            <div className="px-5 pb-2">
              <p className="text-[10px] text-muted-foreground/60 font-medium tracking-wide">{examMeta}</p>
            </div>
          )}

          {/* ── Chapter tag ── */}
          {question.chapter && (
            <div className="px-5 pb-3">
              <Badge variant="secondary" className="text-[10px] font-medium bg-muted/60 text-muted-foreground hover:bg-muted/80 rounded-md px-2">{question.chapter.name}</Badge>
            </div>
          )}

          {/* ── Question body ── */}
          <div className="px-5 pb-4">
            {/* Question text */}
            <div className="text-sm leading-7">
              <MathText text={displayText} />
            </div>

            {/* ── Diagram placeholder ── */}
            {hasFigure && allImageUrls.length === 0 && (
              <div className="mt-4 rounded-xl border border-dashed border-amber-300/60 dark:border-amber-700/40 bg-amber-50/50 dark:bg-amber-950/20 p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 mb-3">
                  <ImageIcon className="h-6 w-6 text-amber-500/60" />
                </div>
                <p className="text-sm font-semibold text-amber-700/80 dark:text-amber-400/80 mb-1">Diagram Referenced</p>
                <p className="text-xs text-muted-foreground leading-relaxed">This question references a figure or diagram. Visualize the described arrangement to solve the problem.</p>
              </div>
            )}

            {/* ── Actual images (if any exist in DB) ── */}
            {allImageUrls.length > 0 && (
              <div className="mt-4 space-y-3">
                {allImageUrls.map((url, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden border border-border/50 bg-muted/30 cursor-zoom-in shadow-sm" onClick={() => setZoomedImage(url)}>
                    <img
                      src={url.startsWith("/") || url.startsWith("data:") ? url : "/api/image-proxy?url=" + encodeURIComponent(url)}
                      alt={`Diagram ${i + 1}`}
                      className="max-w-full h-auto mx-auto"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-7 w-7 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white shadow-md">
                        <Maximize2 className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── MCQ Options (interactive) ── */}
            {!isNumerical && parsedOptions.length > 0 && (
              <div className="mt-5 space-y-2.5">
                {parsedOptions.map((option: string, i: number) => {
                  const letter = String.fromCharCode(65 + i);
                  const isCorrectOpt = correctLetter === letter;
                  return (
                    <div key={i} className={getOptionStyle(letter, i)} onClick={() => handleOptionClick(letter)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && handleOptionClick(letter)}>
                      <span className={getOptionLetterStyle(letter, i)}>{letter}</span>
                      <div className="flex-1 min-w-0 leading-relaxed">
                        <MathText text={option} />
                      </div>
                      {isAnswered && answerState !== "no_answer" && isCorrectOpt && <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />}
                      {isAnswered && answerState !== "no_answer" && selectedOption === letter && !isCorrectOpt && <XCircle className="h-4.5 w-4.5 shrink-0 text-red-500 dark:text-red-400 mt-0.5" />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Numerical Input (interactive) ── */}
            {isNumerical && (
              <div className="mt-5">
                {!isAnswered ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="Type your answer (e.g. 42, 3.14, -2)..."
                        value={numericalInput}
                        onChange={(e) => setNumericalInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleNumericalSubmit()}
                        className="h-11 pl-10 text-sm font-medium rounded-xl border-border/60 focus:border-amber-400 focus:ring-amber-400/20"
                      />
                    </div>
                    <Button onClick={handleNumericalSubmit} disabled={!numericalInput.trim()} className="h-11 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold gap-2 shadow-sm">
                      <Send className="h-4 w-4" />
                      <span className="hidden sm:inline">Check</span>
                    </Button>
                  </div>
                ) : answerState === "no_answer" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
                      <Hash className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Your answer</p>
                        <p className="text-sm font-bold text-foreground">
                          <MathText text={numericalInput} />
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* User's answer */}
                    <div className={cn(
                      "flex items-center gap-3 rounded-xl border p-3.5",
                      answerState === "correct"
                        ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/20"
                        : "border-red-300 dark:border-red-700 bg-red-50/80 dark:bg-red-950/20"
                    )}>
                      {answerState === "correct" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Your answer</p>
                        <p className={cn("text-sm font-bold", answerState === "correct" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300 line-through")}>
                          <MathText text={numericalInput} />
                        </p>
                      </div>
                    </div>

                    {/* Correct answer (show when wrong) */}
                    {answerState === "wrong" && question.correctAnswer && (
                      <div className="flex items-center gap-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/20 p-3.5">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground mb-0.5">Correct answer</p>
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                            <MathText text={question.correctAnswer} />
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Correct answer reveal for MCQ (show when wrong) ── */}
            {isAnswered && !isNumerical && answerState === "wrong" && correctLetter && (
              <AnimatePresence>
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/20 p-3.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Correct answer</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Option {correctLetter}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* ── MCQ correct answer confirmation (show when right) ── */}
            {isAnswered && !isNumerical && answerState === "correct" && (
              <AnimatePresence>
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-3 text-center">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Correct! Well done!
                  </p>
                </motion.div>
              </AnimatePresence>
            )}

            {/* ── No answer available info box ── */}
            {isAnswered && answerState === "no_answer" && (
              <div className="mt-3 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">Correct answer not available in database</p>
              </div>
            )}

            {/* ── Reset button ── */}
            {isAnswered && (
              <div className="mt-4 flex items-center justify-center">
                <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 rounded-lg">
                  <RotateCcw className="h-3 w-3" />
                  Try Again
                </Button>
              </div>
            )}
          </div>

          {/* ── Built-in solution section ── */}
          {(question.solution || question.solutionHtml) && (
            <div className="border-t border-border/30">
              <button
                className={cn("w-full flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-medium transition-colors", "text-amber-700 dark:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20")}
                onClick={() => setSolutionOpen(!solutionOpen)}
              >
                {solutionOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {solutionOpen ? "Hide Solution" : "Show Solution"}
              </button>

              <AnimatePresence>
                {solutionOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="px-5 pb-4">
                      <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 shadow-sm shadow-amber-500/5">
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3">Solution</p>
                        <div className="text-sm leading-7">
                          <MathText text={question.solutionHtml || question.solution || ""} />
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

      {/* Image Zoom Dialog */}
      <ImageZoomDialog url={zoomedImage || ""} alt="Question diagram" open={!!zoomedImage} onOpenChange={(open) => !open && setZoomedImage(null)} />
    </>
  );
}
