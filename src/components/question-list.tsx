"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useAppState, type ChapterData } from "@/hooks/use-app-state";
import { QuestionCard } from "@/components/question-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  BookOpen,
  Filter,
  GraduationCap,
  Layers,
  ChevronDown,
  Sparkles,
  Hash,
  ArrowUpDown,
  Calendar,
  FileText,
  ArrowLeft,
  BookMarked,
  SearchX,
  FlaskConical,
  Calculator,
  FolderSearch,
  PenLine,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Subject icon map for illustrations
function getSubjectIcon(slug: string) {
  if (slug?.includes("physics")) return FlaskConical;
  if (slug?.includes("chem")) return GraduationCap;
  if (slug?.includes("math")) return Calculator;
  return BookOpen;
}

export function QuestionList() {
  const {
    selectedSubject,
    selectedChapter,
    viewingAllQuestions,
    questions,
    questionsLoading,
    questionsPage,
    questionsTotal,
    questionsTotalPages,
    questionTypeFilter,
    setQuestionTypeFilter,
    yearFilter,
    setYearFilter,
    sortOrder,
    setSortOrder,
    setQuestions,
    setQuestionsLoading,
    setQuestionsPage,
    setQuestionsTotal,
    setQuestionsTotalPages,
    appendQuestions,
    examType,
    setSelectedChapter,
    setSelectedSubject,
    subjects,
  } = useAppState();

  const { data: session } = useSession();

  // Stats for solution progress badge
  const [stats, setStats] = useState<{ total: number; withSolution: number; withAnswer: number } | null>(null);
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  // Fix: displayTotal now uses the real API total instead of maxSubjectTotal
  const displayTotal = questionsTotal;

  // Generate year options from 2000-2026
  const yearOptions = useMemo(() => {
    const years: { value: string; label: string }[] = [
      { value: "all", label: "All Years" },
    ];
    for (let y = 2026; y >= 2000; y--) {
      years.push({ value: String(y), label: String(y) });
    }
    return years;
  }, []);

  const fetchQuestions = useCallback(
    async (page: number, append: boolean = false) => {
      if (!selectedChapter && !viewingAllQuestions) return;
      setQuestionsLoading(true);
      try {
        const params = new URLSearchParams({
          subject: selectedSubject?.slug || "",
          exam: examType,
          page: String(page),
          limit: "50",
          sort: sortOrder,
        });
        if (selectedChapter) {
          params.set("chapterId", selectedChapter.id);
        }
        if (questionTypeFilter === "withSolutions") {
          params.set("hasSolution", "true");
        } else if (questionTypeFilter !== "all") {
          params.set("type", questionTypeFilter);
        }
        if (yearFilter && yearFilter !== "all") {
          params.set("year", yearFilter);
        }
        const res = await fetch(`/api/questions?${params}`);
        const data = await res.json();
        if (res.ok) {
          if (append) {
            appendQuestions(data.questions);
          } else {
            setQuestions(data.questions);
          }
          setQuestionsTotal(data.total);
          setQuestionsTotalPages(data.totalPages);
          setQuestionsPage(data.page);
        }
      } catch (err) {
        console.error("Failed to fetch questions:", err);
      } finally {
        setQuestionsLoading(false);
      }
    },
    [selectedChapter, viewingAllQuestions, selectedSubject?.slug, examType, questionTypeFilter, yearFilter, sortOrder, setQuestions, setQuestionsLoading, setQuestionsPage, setQuestionsTotal, setQuestionsTotalPages, appendQuestions]
  );

  // Re-fetch when chapter/filter/sort changes
  useEffect(() => {
    if (selectedChapter || viewingAllQuestions) {
      fetchQuestions(1, false);
    }
  }, [selectedChapter, viewingAllQuestions, questionTypeFilter, yearFilter, sortOrder, fetchQuestions]);

  // Keyboard shortcuts for pagination
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        if (questionsPage < questionsTotalPages && !questionsLoading) {
          fetchQuestions(questionsPage + 1, true);
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        // Scroll to top on "previous page" equivalent
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [questionsPage, questionsTotalPages, questionsLoading, fetchQuestions]);

  const loadMore = () => {
    if (questionsPage < questionsTotalPages && !questionsLoading) {
      fetchQuestions(questionsPage + 1, true);
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.info("Generating PDF, please wait...");
      const res = await fetch("/api/export-pdf");
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) {
        win.onload = () => {
          win.print();
        };
      }
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  const handleBackToSubjects = () => {
    setSelectedChapter(null);
    setSelectedSubject(null);
  };

  const displayTitle = viewingAllQuestions
    ? `${selectedSubject?.name} — All Questions`
    : selectedChapter?.name || "";

  // Progress percentage
  const progressPercent = questionsTotal > 0
    ? Math.min((questions.length / questionsTotal) * 100, 100)
    : 0;

  // Subject icon
  const SubjectIcon = getSubjectIcon(selectedSubject?.slug || "");

  // Empty state: no chapter selected and not viewing all
  if (!selectedChapter && !viewingAllQuestions) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-6"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 mb-6 shadow-sm">
            <BookOpen className="h-12 w-12 text-amber-500/50" />
          </div>
          <h3 className="text-xl font-bold mb-2">Select a Chapter</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Choose a chapter from the sidebar to browse previous year JEE questions
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Physics</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Chemistry</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <Calculator className="h-3.5 w-3.5" />
              <span>Mathematics</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Sticky chapter header */}
      <div className="sticky top-14 z-10 glass-nav border-b border-border/60">
        <div className="px-4 md:px-6 py-3">
          <div className="space-y-3">
            {/* Title row */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Back to Subjects button */}
                  <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToSubjects}
                      className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-7 px-2 rounded-lg -ml-2 transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Subjects</span>
                    </Button>
                  </motion.div>

                  <h2 className="text-lg font-bold tracking-tight">{displayTitle}</h2>
                  {selectedSubject && (
                    <Badge
                      variant="secondary"
                      className="text-[11px] font-semibold uppercase tracking-wider rounded-md"
                    >
                      <SubjectIcon className="h-3 w-3 mr-1" />
                      {selectedSubject.name}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="text-[11px] font-semibold uppercase tracking-wider rounded-md border-border/60"
                  >
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {examType === "jee-main" ? "JEE Main" : "JEE Advanced"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    {displayTotal > 0
                      ? `${displayTotal.toLocaleString()} question${displayTotal !== 1 ? "s" : ""} available`
                      : "Loading questions..."}
                  </p>
                  {/* Solution progress badge */}
                  {stats && stats.withSolution > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[11px] font-medium rounded-full border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 gap-1 px-2.5"
                    >
                      <PenLine className="h-3 w-3" />
                      {stats.withSolution.toLocaleString()}/{stats.total.toLocaleString()} solved
                    </Badge>
                  )}
                </div>
              </div>

              {/* Export button */}
              {questions.length > 0 && session?.user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  className="text-xs gap-1.5 shrink-0 h-8 rounded-lg"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Export PDF
                </Button>
              )}
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Question type filter */}
              <Tabs
                value={questionTypeFilter}
                onValueChange={(v) =>
                  setQuestionTypeFilter(v as "all" | "MCQ" | "Numerical" | "withSolutions")
                }
              >
                <TabsList className="h-8 p-0.5">
                  <TabsTrigger value="all" className="text-xs px-2.5 gap-1 rounded-md h-7">
                    <Filter className="h-3 w-3" />
                    All
                  </TabsTrigger>
                  <TabsTrigger value="MCQ" className="text-xs px-2.5 gap-1 rounded-md h-7">
                    <Sparkles className="h-3 w-3" />
                    MCQ
                  </TabsTrigger>
                  <TabsTrigger value="Numerical" className="text-xs px-2.5 gap-1 rounded-md h-7">
                    <Hash className="h-3 w-3" />
                    Numerical
                  </TabsTrigger>
                  <TabsTrigger value="withSolutions" className="text-xs px-2.5 gap-1 rounded-md h-7">
                    <PenLine className="h-3 w-3" />
                    <span className="hidden sm:inline">With</span> Solutions
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Year filter */}
              <Select value={yearFilter || "all"} onValueChange={setYearFilter}>
                <SelectTrigger className="h-8 w-[130px] text-xs rounded-lg">
                  <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {yearOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort order */}
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}>
                <SelectTrigger className="h-8 w-[140px] text-xs rounded-lg">
                  <ArrowUpDown className="h-3 w-3 mr-1 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Progress bar */}
            {questions.length > 0 && questionsTotal > questions.length && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Showing{" "}
                    <span className="font-semibold text-foreground">{questions.length}</span>{" "}
                    of{" "}
                    <span className="font-semibold text-foreground">{displayTotal.toLocaleString()}</span>{" "}
                    questions
                  </span>
                  <span className="tabular-nums">{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Questions content */}
      <div className="p-4 md:p-6">
        {/* Loading state */}
        {questionsLoading && questions.length === 0 ? (
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-muted to-muted" />
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-5 w-14" />
                    <Skeleton className="h-5 w-14" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : questions.length === 0 ? (
          /* Empty state with illustration */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-muted to-muted/60 dark:from-muted/40 dark:to-muted/20 mb-6 shadow-sm">
              <FolderSearch className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Questions Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed mb-6">
              {questionTypeFilter !== "all" || yearFilter
                ? "Try changing the filters to see more questions"
                : "This chapter doesn't have any questions yet"}
            </p>
            <div className="flex items-center justify-center gap-2">
              {(questionTypeFilter !== "all" || yearFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuestionTypeFilter("all");
                    setYearFilter("");
                  }}
                  className="gap-2 text-xs rounded-lg"
                >
                  <SearchX className="h-3.5 w-3.5" />
                  Clear Filters
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToSubjects}
                className="gap-2 text-xs rounded-lg text-muted-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Subjects
              </Button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Showing count (when all loaded or no more) */}
            {questionsTotal <= questions.length && (
              <div className="flex items-center justify-center mb-5">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/60 text-xs font-medium text-muted-foreground">
                  <span>
                    <span className="font-bold text-foreground">
                      {displayTotal.toLocaleString()}
                    </span>{" "}
                    questions loaded
                  </span>
                </div>
              </div>
            )}

            {/* Question cards */}
            <div className="space-y-5">
              {questions.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                >
                  <QuestionCard question={q} index={i} />
                </motion.div>
              ))}
            </div>

            {/* Load more */}
            {questionsPage < questionsTotalPages && (
              <div className="flex justify-center pt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={loadMore}
                  disabled={questionsLoading}
                  className="gap-2 rounded-xl px-8 border-dashed"
                >
                  {questionsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Load More Questions
                </Button>
              </div>
            )}

            {/* Bottom count */}
            <div className="text-center pt-4 pb-2">
              <span className="text-xs text-muted-foreground/60">
                Showing {questions.length} of {displayTotal.toLocaleString()} questions
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}