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
import { MathText, extractImagesFromHtml, processHtmlContent } from "@/components/math-text";
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  Hash,
  Maximize2,
  Wand2,
  Loader2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Color palette for option circles (amber/warm tones, no blue/indigo)
const OPTION_COLORS = [
  { bg: "bg-amber-100 dark:bg-amber-950/60", text: "text-amber-700 dark:text-amber-300", correct: "bg-emerald-500 text-white" },
  { bg: "bg-orange-100 dark:bg-orange-950/60", text: "text-orange-700 dark:text-orange-300", correct: "bg-emerald-500 text-white" },
  { bg: "bg-rose-100 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", correct: "bg-emerald-500 text-white" },
  { bg: "bg-teal-100 dark:bg-teal-950/60", text: "text-teal-700 dark:text-teal-300", correct: "bg-emerald-500 text-white" },
];

interface QuestionCardProps {
  question: QuestionData;
  index: number;
  onUnsave?: (questionId: string) => void;
}

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

// Extract date-like info from questionText (e.g., "8th April")
function extractDateFromText(text: string): string | null {
  const dateMatch = text.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)/i
  );
  return dateMatch ? dateMatch[0] : null;
}

function ImageZoomDialog({
  url,
  alt,
  open,
  onOpenChange,
}: {
  url: string;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-auto p-0 border-0 bg-black/95 backdrop-blur-xl sm:max-w-[95vw]">
        <DialogTitle className="sr-only">Image Preview</DialogTitle>
        <div className="relative flex items-center justify-center p-2">
          <img
            src={url}
            alt={alt}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function QuestionCard({ question, index, onUnsave }: QuestionCardProps) {
  const { data: session } = useSession();
  const {
    savedQuestionIds,
    toggleSavedQuestionId,
    setAuthModalOpen,
    examType,
  } = useAppState();
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [solveLoading, setSolveLoading] = useState(false);
  const [localSolution, setLocalSolution] = useState<string | null>(null);
  const [aiSolutionOpen, setAiSolutionOpen] = useState(false);

  const isSaved = savedQuestionIds.has(question.id);
  const detectedType = detectQuestionType(question);
  const isNumerical = detectedType === "Numerical";

  // Build exam metadata string with date info
  const examMeta = useMemo(() => {
    const parts: string[] = [];
    if (examType === "jee-main") {
      parts.push("JEE Main");
    } else {
      parts.push("JEE Advanced");
    }
    if (question.year) {
      parts.push(String(question.year));
    }

    // Try to extract date from questionText
    const dateStr = extractDateFromText(question.questionText || "");
    if (dateStr) {
      parts.push(`(${dateStr})`);
    } else {
      parts.push("(Online)");
    }

    if (question.shift) {
      parts.push(question.shift);
    }
    return parts.join(" ");
  }, [question.year, question.shift, question.questionText, examType]);

  // Parse options
  const parsedOptions = useMemo(() => {
    if (question.options) {
      try {
        const opts = JSON.parse(question.options);
        return Array.isArray(opts) ? opts : [];
      } catch {
        return [];
      }
    }
    if (!isNumerical && question.questionText) {
      const optionRegex = /\(([A-D])\)\s*([\s\S]*?)(?=\([A-D]\)|$)/g;
      const extracted: string[] = [];
      let match;
      while ((match = optionRegex.exec(question.questionText)) !== null) {
        extracted.push(match[2].trim());
      }
      if (extracted.length >= 2) return extracted;
    }
    return [];
  }, [question.options, question.questionText, isNumerical]);

  // Process questionHtml for rendering
  const questionContent = useMemo(() => {
    if (question.questionHtml && question.questionHtml.trim().length > 10) {
      const { cleanedHtml, imageUrls: htmlImageUrls } = extractImagesFromHtml(question.questionHtml);
      const processed = processHtmlContent(cleanedHtml);
      return { html: processed, htmlImageUrls };
    }
    return { html: null, htmlImageUrls: [] as string[] };
  }, [question.questionHtml]);

  // Collect all image URLs
  const allImageUrls = useMemo(() => {
    const urls: string[] = [];
    if (question.imageUrl) urls.push(question.imageUrl);
    if (question.imageUrls) {
      try {
        const parsed = JSON.parse(question.imageUrls);
        if (Array.isArray(parsed)) {
          for (const u of parsed) {
            if (typeof u === "string" && !urls.includes(u)) urls.push(u);
          }
        }
      } catch {
        if (!urls.includes(question.imageUrls)) urls.push(question.imageUrls);
      }
    }
    for (const u of questionContent.htmlImageUrls) {
      if (!urls.includes(u)) urls.push(u);
    }
    return urls;
  }, [question.imageUrl, question.imageUrls, questionContent.htmlImageUrls]);

  const handleSaveToggle = async () => {
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
  };

  const handleGenerateSolution = useCallback(async () => {
    // If already generated, just toggle visibility
    if (localSolution) {
      setAiSolutionOpen((prev) => !prev);
      return;
    }

    setSolveLoading(true);
    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          questionText: question.questionText,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setLocalSolution(data.solution);
      setAiSolutionOpen(true);
      toast.success("Solution generated!", {
        icon: <Zap className="h-4 w-4 text-amber-500" />,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate solution");
    } finally {
      setSolveLoading(false);
    }
  }, [localSolution, question.id, question.questionText]);

  const handleImageLoad = (i: number) => {
    setImageLoaded((prev) => ({ ...prev, [i]: true }));
  };

  const handleImageError = (i: number) => {
    setImageErrors((prev) => ({ ...prev, [i]: true }));
  };

  return (
    <>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/8 dark:hover:shadow-amber-500/10 border-border/80 bg-card hover:-translate-y-0.5">
        {/* Gradient header bar */}
        <div className="relative h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 dark:from-amber-600 dark:via-orange-600 dark:to-amber-700" />

        <CardContent className="p-0">
          {/* Question meta header */}
          <div className="flex items-start justify-between px-5 pt-4 pb-2 gap-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              {/* Question number badge */}
              <span className="inline-flex items-center justify-center h-8 min-w-8 px-2.5 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs font-extrabold shadow-md shadow-amber-500/25">
                Q{index + 1}
              </span>

              {/* Year badge */}
              {question.year && (
                <Badge
                  variant="outline"
                  className="gap-1 text-xs border-border/60 font-medium"
                >
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {question.year}
                </Badge>
              )}

              {/* Shift badge */}
              {question.shift && (
                <Badge
                  variant="outline"
                  className="gap-1 text-xs border-border/60 font-medium"
                >
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {question.shift}
                </Badge>
              )}

              {/* Question type badge */}
              <Badge
                className={cn(
                  "gap-1 text-xs font-semibold border-0 shadow-sm",
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
              </Badge>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {session?.user && (
                <motion.div whileTap={{ scale: 0.85 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    onClick={handleSaveToggle}
                    disabled={saveLoading}
                  >
                    <motion.div
                      animate={isSaved ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <Bookmark
                        className={cn(
                          "h-4.5 w-4.5 transition-all duration-300",
                          isSaved
                            ? "fill-red-500 text-red-500 drop-shadow-sm"
                            : "text-muted-foreground/50 hover:text-red-400"
                        )}
                      />
                    </motion.div>
                  </Button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Exam metadata line */}
          {(question.year || question.shift) && (
            <div className="px-5 pb-2">
              <p className="text-[11px] text-muted-foreground/70 font-medium tracking-wide">
                {examMeta}
              </p>
            </div>
          )}

          {/* Chapter tag */}
          {question.chapter && (
            <div className="px-5 pb-3">
              <Badge
                variant="secondary"
                className="text-[11px] font-medium tracking-wide bg-muted/60 text-muted-foreground hover:bg-muted/80 rounded-md"
              >
                {question.chapter.name}
              </Badge>
            </div>
          )}

          {/* Question body */}
          <div className="px-5 pb-4">
            {/* Question text / HTML */}
            {questionContent.html ? (
              <div
                className="text-sm leading-7 question-body-html"
                dangerouslySetInnerHTML={{ __html: questionContent.html }}
              />
            ) : (
              <div className="text-sm leading-7">
                <MathText text={question.questionText} />
              </div>
            )}

            {/* Images */}
            {allImageUrls.length > 0 && (
              <div className="mt-4 space-y-3">
                {allImageUrls.map((url, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.01 }}
                    className={cn(
                      "relative rounded-xl overflow-hidden border border-border/50 bg-muted/30 transition-all duration-300 group/img cursor-zoom-in shadow-sm hover:shadow-md",
                      imageLoaded[i] ? "opacity-100" : "opacity-0"
                    )}
                    onClick={() => setZoomedImage(url)}
                  >
                    {!imageErrors[i] && !imageLoaded[i] && (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ImageIcon className="h-8 w-8 animate-pulse" />
                          <span className="text-xs">Loading image...</span>
                        </div>
                      </div>
                    )}
                    {!imageErrors[i] ? (
                      <>
                        <img
                          src={url}
                          alt={`Diagram ${i + 1} for question ${index + 1}`}
                          className="max-w-full h-auto mx-auto"
                          loading="lazy"
                          onLoad={() => handleImageLoad(i)}
                          onError={() => handleImageError(i)}
                        />
                        <div className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                          <div className="h-8 w-8 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white shadow-md">
                            <Maximize2 className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <div className="flex flex-col items-center gap-1.5">
                          <ImageIcon className="h-6 w-6" />
                          <span className="text-xs">Image unavailable</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Options for MCQ */}
            {!isNumerical && parsedOptions.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {parsedOptions.map((option: string, i: number) => {
                  const letter = String.fromCharCode(65 + i);
                  const isCorrect =
                    question.correctAnswer === letter ||
                    question.correctAnswer === option;
                  const colors = OPTION_COLORS[i] || OPTION_COLORS[0];
                  return (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.008 }}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border-2 p-3 text-sm transition-all duration-200",
                        isCorrect
                          ? "border-emerald-400 bg-emerald-50/80 dark:border-emerald-600 dark:bg-emerald-950/30 shadow-sm shadow-emerald-500/10"
                          : "border-border/60 bg-background hover:border-amber-300/60 hover:bg-amber-50/50 dark:hover:border-amber-700/50 dark:hover:bg-amber-950/20"
                      )}
                    >
                      {/* Colored circle for option letter */}
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold transition-all mt-0.5",
                          isCorrect
                            ? colors.correct
                            : `${colors.bg} ${colors.text}`
                        )}
                      >
                        {letter}
                      </span>
                      <div className="flex-1 min-w-0 leading-relaxed">
                        <MathText text={option} />
                      </div>
                      {isCorrect && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Numerical answer */}
            {isNumerical && question.correctAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <div className="flex items-center gap-3 rounded-xl border-2 border-emerald-400 bg-emerald-50/80 dark:border-emerald-600 dark:bg-emerald-950/30 p-4 shadow-sm shadow-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-sm font-medium">
                    Answer:{" "}
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      <MathText text={question.correctAnswer} />
                    </span>
                  </span>
                </div>
              </motion.div>
            )}

            {/* Generate Solution button */}
            <div className="mt-4 pt-3 border-t border-border/40">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-xs text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 h-8 rounded-lg transition-colors"
                onClick={handleGenerateSolution}
                disabled={solveLoading}
              >
                {solveLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                {solveLoading
                  ? "Generating..."
                  : localSolution
                    ? aiSolutionOpen
                      ? "Hide AI Solution"
                      : "Show AI Solution"
                    : "Generate AI Solution"}
              </Button>

              {/* AI-generated solution collapsible */}
              <AnimatePresence>
                {localSolution && aiSolutionOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/70 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                        <Wand2 className="h-3 w-3" />
                        AI-Generated Solution
                      </p>
                      <div className="text-sm leading-7">
                        <MathText text={localSolution} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Solution section */}
          {(question.solution || question.solutionHtml) && (
            <div className="border-t border-border/50">
              <button
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium transition-colors",
                  "text-amber-700 dark:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                )}
                onClick={() => setSolutionOpen(!solutionOpen)}
              >
                {solutionOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {solutionOpen ? "Hide Solution" : "Show Solution"}
              </button>

              <AnimatePresence>
                {solutionOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5">
                      <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3">
                          Solution
                        </p>
                        <div className="text-sm leading-7">
                          <MathText
                            text={question.solutionHtml || question.solution || ""}
                          />
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
      <ImageZoomDialog
        url={zoomedImage || ""}
        alt="Question diagram"
        open={!!zoomedImage}
        onOpenChange={(open) => !open && setZoomedImage(null)}
      />
    </>
  );
}