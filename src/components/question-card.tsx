"use client";

import { useState, useMemo } from "react";
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
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
  Zap,
  Search,
  Maximize2,
  Hash,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Color palette for option circles
const OPTION_COLORS = [
  { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800/60" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800/60" },
  { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800/60" },
  { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800/60" },
  { bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800/60" },
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

function extractDateFromText(text: string): string | null {
  const dateMatch = text.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)/i
  );
  return dateMatch ? dateMatch[0] : null;
}

// Clean question text - remove trailing junk
function cleanQuestionText(text: string): string {
  return text
    // Remove trailing "Choose the correct..." and similar
    .replace(/\s*(?:Choose the correct (?:answer|option)[s]?.*|Select the correct (?:answer|option)[s]?.*)$/is, "")
    // Remove trailing chapter names like "ElectricalCircuit Components"
    .replace(/\s*ElectricalCircuit\s*Components$/i, "")
    // Remove trailing PascalCase junk (2+ words)
    .replace(/\s+([A-Z][a-z]+[A-Z][a-zA-Z]+)$/m, "")
    // Clean up whitespace
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
            src={url.startsWith('/') || url.startsWith('data:') ? url : '/api/image-proxy?url=' + encodeURIComponent(url)}
            alt={alt}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getSubjectBorder(subjectSlug?: string) {
  if (!subjectSlug) return "";
  if (subjectSlug.includes("physics")) return "subject-border-physics";
  if (subjectSlug.includes("chem")) return "subject-border-chemistry";
  if (subjectSlug.includes("math")) return "subject-border-mathematics";
  return "";
}

export function QuestionCard({ question, index, onUnsave }: QuestionCardProps) {
  const { data: session } = useSession();
  const {
    savedQuestionIds,
    toggleSavedQuestionId,
    setAuthModalOpen,
    examType,
    selectedSubject,
  } = useAppState();
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [solveLoading, setSolveLoading] = useState(false);
  const [webSolution, setWebSolution] = useState<{ solution: string; source?: string; sourceUrl?: string } | null>(null);
  const [webSolutionOpen, setWebSolutionOpen] = useState(false);

  const isSaved = savedQuestionIds.has(question.id);
  const detectedType = detectQuestionType(question);
  const isNumerical = detectedType === "Numerical";
  const subjectBorder = getSubjectBorder(selectedSubject?.slug);

  // Build exam metadata string
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
    const dateStr = extractDateFromText(question.questionText || "");
    if (dateStr) {
      parts.push(`(${dateStr})`);
    } else if (question.year) {
      parts.push("");
    }
    if (question.shift) {
      parts.push(question.shift);
    }
    return parts.join(" ").trim();
  }, [question.year, question.shift, question.questionText, examType]);

  // Clean the question text for display
  const cleanText = useMemo(() => cleanQuestionText(question.questionText || ""), [question.questionText]);

  // Parse options from text
  const parsedOptions = useMemo(() => {
    if (question.options && question.options !== "undefined" && question.options !== "null") {
      try {
        const opts = JSON.parse(question.options);
        if (Array.isArray(opts) && opts.length >= 2) return opts;
      } catch { /* ignore */ }
    }
    // Try to extract from question text
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

  // Proxy external image URLs through our API to avoid CORS/hotlinking issues
  const proxyUrl = (url: string) => {
    if (url.startsWith('/') || url.startsWith('data:')) return url;
    return '/api/image-proxy?url=' + encodeURIComponent(url);
  };

  // Collect all image URLs (from imageUrl, imageUrls, and questionHtml)
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
    // Also extract image src from questionHtml
    if (question.questionHtml) {
      const imgMatches = question.questionHtml.match(/src=["']([^"']+)["']/gi);
      if (imgMatches) {
        for (const match of imgMatches) {
          const srcMatch = match.match(/src=["']([^"']+)["']/i);
          if (srcMatch?.[1] && !urls.includes(srcMatch[1]) && !srcMatch[1].startsWith('data:')) {
            urls.push(srcMatch[1]);
          }
        }
      }
    }
    return urls;
  }, [question.imageUrl, question.imageUrls, question.questionHtml]);

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

  const handleSearchAnswer = async () => {
    if (webSolution) {
      setWebSolutionOpen((prev) => !prev);
      return;
    }

    setSolveLoading(true);
    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          questionText: cleanText,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setWebSolution({ solution: data.solution, source: data.source, sourceUrl: data.sourceUrl });
      setWebSolutionOpen(true);
      toast.success("Answer found!", {
        icon: <Search className="h-4 w-4 text-emerald-500" />,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to find answer");
    } finally {
      setSolveLoading(false);
    }
  };

  const handleImageLoad = (i: number) => {
    setImageLoaded((prev) => ({ ...prev, [i]: true }));
  };

  const handleImageError = (i: number) => {
    setImageErrors((prev) => ({ ...prev, [i]: true }));
  };

  // Remove options text from question body if options are parsed separately
  const displayText = useMemo(() => {
    if (parsedOptions.length >= 2) {
      // Remove the (A) (B) ... options from the question text
      return cleanText
        .replace(/\s*\([A-E]\)[\s\S]*$/g, "")
        .replace(/\n{2,}/g, "\n")
        .trim();
    }
    return cleanText;
  }, [cleanText, parsedOptions.length]);

  return (
    <>
      <Card className={`group overflow-hidden transition-all duration-200 hover:shadow-premium-lg border-border/60 bg-card ${subjectBorder}`}>
        <CardContent className="p-0">
          {/* Question meta header */}
          <div className="flex items-start justify-between px-5 pt-4 pb-2 gap-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white text-[11px] font-extrabold shadow-sm">
                Q{index + 1}
              </span>

              {question.year && (
                <Badge variant="outline" className="gap-1 text-[11px] border-border/50 font-medium px-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {question.year}
                </Badge>
              )}

              {question.shift && (
                <Badge variant="outline" className="gap-1 text-[11px] border-border/50 font-medium px-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {question.shift}
                </Badge>
              )}

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
                  <span className="text-[10px] opacity-70 ml-0.5">+4 / -1</span>
                )}
              </Badge>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
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
          </div>

          {/* Exam metadata line */}
          {(question.year || question.shift) && (
            <div className="px-5 pb-2">
              <p className="text-[10px] text-muted-foreground/60 font-medium tracking-wide">
                {examMeta}
              </p>
            </div>
          )}

          {/* Chapter tag */}
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

          {/* Question body */}
          <div className="px-5 pb-4">
            {/* Question text */}
            <div className="text-sm leading-7">
              <MathText text={displayText} />
            </div>

            {/* Images */}
            {allImageUrls.length > 0 && (
              <div className="mt-4 space-y-3">
                {allImageUrls.map((url, i) => (
                  <motion.div
                    key={i}
                    className={cn(
                      "relative rounded-xl overflow-hidden border border-border/50 bg-muted/30 cursor-zoom-in shadow-sm",
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
                          src={proxyUrl(url)}
                          alt={`Diagram ${i + 1} for question ${index + 1}`}
                          className="max-w-full h-auto mx-auto"
                          loading="lazy"
                          onLoad={() => handleImageLoad(i)}
                          onError={() => handleImageError(i)}
                        />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="h-7 w-7 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white shadow-md">
                            <Maximize2 className="h-3 w-3" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <div className="flex flex-col items-center gap-1.5">
                          <ImageIcon className="h-5 w-5" />
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
              <div className="mt-5 space-y-2.5">
                {parsedOptions.map((option: string, i: number) => {
                  const letter = String.fromCharCode(65 + i);
                  const isCorrect =
                    question.correctAnswer === letter ||
                    question.correctAnswer === option;
                  const colors = OPTION_COLORS[i] || OPTION_COLORS[0];
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200",
                        isCorrect
                          ? "border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/80 dark:bg-emerald-950/20 shadow-sm shadow-emerald-500/10"
                          : `${colors.border} ${colors.bg} hover:border-foreground/15 hover:shadow-sm`
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
                        <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Numerical answer */}
            {isNumerical && question.correctAnswer && (
              <div className="mt-4">
                <div className="flex items-center gap-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/20 p-3.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-sm font-medium">
                    Answer:{" "}
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      <MathText text={question.correctAnswer} />
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* Find Answer button (web search) */}
            <div className="mt-5 pt-4 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:text-emerald-800 dark:hover:text-emerald-300 h-9 rounded-lg transition-all duration-200"
                onClick={handleSearchAnswer}
                disabled={solveLoading}
              >
                {solveLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : webSolution ? (
                  <Search className="h-3.5 w-3.5" />
                ) : (
                  <Search className="h-3.5 w-3.5" />
                )}
                {solveLoading
                  ? "Searching..."
                  : webSolution
                    ? webSolutionOpen
                      ? "Hide Answer"
                      : "Show Answer"
                    : "Find Answer Online"}
              </Button>

              <AnimatePresence>
                {webSolution && webSolutionOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50/70 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10 p-4 shadow-sm shadow-emerald-500/5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <Search className="h-3 w-3" />
                          Answer
                        </p>
                        {webSolution.sourceUrl && (
                          <a
                            href={webSolution.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            {webSolution.source || "Source"}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                      <div className="text-sm leading-7 whitespace-pre-wrap">
                        {webSolution.solution}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Built-in solution section */}
          {(question.solution || question.solutionHtml) && (
            <div className="border-t border-border/30">
              <button
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-medium transition-colors",
                  "text-amber-700 dark:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                )}
                onClick={() => setSolutionOpen(!solutionOpen)}
              >
                {solutionOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                {solutionOpen ? "Hide Solution" : "Show Solution"}
              </button>

              <AnimatePresence>
                {solutionOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4">
                      <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 shadow-sm shadow-amber-500/5">
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