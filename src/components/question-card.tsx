"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useAppState, type QuestionData } from "@/hooks/use-app-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MathText, extractImagesFromHtml, processHtmlContent } from "@/components/math-text";
import {
  Heart,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface QuestionCardProps {
  question: QuestionData;
  index: number;
}

function detectQuestionType(question: QuestionData): "MCQ" | "Numerical" {
  // If the type is explicitly set, use it
  if (question.questionType === "MCQ" || question.questionType === "Numerical") {
    return question.questionType;
  }
  // Auto-detect: if options exist and have (A)(B) pattern, it's MCQ
  const text = question.questionText + " " + (question.questionHtml || "");
  if (/\(A\)/.test(text) && /\(B\)/.test(text)) {
    return "MCQ";
  }
  return "Numerical";
}

export function QuestionCard({ question, index }: QuestionCardProps) {
  const { data: session } = useSession();
  const {
    savedQuestionIds,
    toggleSavedQuestionId,
    setAuthModalOpen,
  } = useAppState();
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const isSaved = savedQuestionIds.has(question.id);
  const detectedType = detectQuestionType(question);
  const isNumerical = detectedType === "Numerical";

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
    // Try to extract options from questionText if it has (A) (B) pattern
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
    // Prefer questionHtml if available and has actual content
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
    // From imageUrl (legacy)
    if (question.imageUrl) urls.push(question.imageUrl);
    // From imageUrls (JSON string)
    if (question.imageUrls) {
      try {
        const parsed = JSON.parse(question.imageUrls);
        if (Array.isArray(parsed)) {
          for (const u of parsed) {
            if (typeof u === "string" && !urls.includes(u)) urls.push(u);
          }
        }
      } catch {
        // Maybe it's a single URL string
        if (!urls.includes(question.imageUrls)) urls.push(question.imageUrls);
      }
    }
    // From HTML-extracted images
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

  const handleImageLoad = (i: number) => {
    setImageLoaded((prev) => ({ ...prev, [i]: true }));
  };

  const handleImageError = (i: number) => {
    setImageErrors((prev) => ({ ...prev, [i]: true }));
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 dark:hover:shadow-amber-500/10 border-border/80 bg-card">
      {/* Gradient header bar */}
      <div className="relative h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 dark:from-amber-600 dark:via-orange-600 dark:to-amber-700" />

      <CardContent className="p-0">
        {/* Question meta header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Question number */}
            <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold">
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

          {/* Save button */}
          {session?.user && (
            <motion.div whileTap={{ scale: 0.85 }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                onClick={handleSaveToggle}
                disabled={saveLoading}
              >
                <motion.div
                  animate={
                    isSaved
                      ? { scale: [1, 1.3, 1] }
                      : {}
                  }
                  transition={{ duration: 0.3 }}
                >
                  <Heart
                    className={cn(
                      "h-5 w-5 transition-all duration-300",
                      isSaved
                        ? "fill-red-500 text-red-500 drop-shadow-sm"
                        : "text-muted-foreground/60 hover:text-red-400"
                    )}
                  />
                </motion.div>
              </Button>
            </motion.div>
          )}
        </div>

        {/* Chapter tag */}
        {question.chapter && (
          <div className="px-5 pb-3">
            <Badge
              variant="secondary"
              className="text-[11px] font-medium tracking-wide uppercase bg-muted/60 text-muted-foreground hover:bg-muted/80"
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
                <div
                  key={i}
                  className={cn(
                    "relative rounded-xl overflow-hidden border border-border/50 bg-muted/30 transition-opacity duration-500",
                    imageLoaded[i] ? "opacity-100" : "opacity-0"
                  )}
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
                    <img
                      src={url}
                      alt={`Diagram ${i + 1} for question ${index + 1}`}
                      className="max-w-full h-auto mx-auto"
                      loading="lazy"
                      onLoad={() => handleImageLoad(i)}
                      onError={() => handleImageError(i)}
                    />
                  ) : (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-1.5">
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-xs">Image unavailable</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Options for MCQ */}
          {!isNumerical && parsedOptions.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {parsedOptions.map((option: string, i: number) => {
                const letter = String.fromCharCode(65 + i);
                const isCorrect =
                  question.correctAnswer === letter ||
                  question.correctAnswer === option;
                return (
                  <motion.div
                    key={i}
                    initial={false}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.01 }}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border-2 p-3.5 text-sm transition-colors",
                      isCorrect
                        ? "border-emerald-400 bg-emerald-50/80 dark:border-emerald-600 dark:bg-emerald-950/30"
                        : "border-border/60 bg-background hover:border-amber-300/60 hover:bg-amber-50/50 dark:hover:border-amber-700/50 dark:hover:bg-amber-950/20"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors mt-0.5",
                        isCorrect
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-muted text-muted-foreground"
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
              <div className="flex items-center gap-3 rounded-xl border-2 border-emerald-400 bg-emerald-50/80 dark:border-emerald-600 dark:bg-emerald-950/30 p-4">
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
  );
}