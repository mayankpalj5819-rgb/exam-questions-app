"use client";

import { useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAppState, type ChapterData } from "@/hooks/use-app-state";
import { QuestionCard } from "@/components/question-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  BookOpen,
  Filter,
  GraduationCap,
  Layers,
  Inbox,
  ChevronDown,
  Sparkles,
  Hash,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function QuestionList() {
  const {
    selectedSubject,
    selectedChapter,
    questions,
    questionsLoading,
    questionsPage,
    questionsTotal,
    questionsTotalPages,
    questionTypeFilter,
    setQuestionTypeFilter,
    setQuestions,
    setQuestionsLoading,
    setQuestionsPage,
    setQuestionsTotal,
    setQuestionsTotalPages,
    appendQuestions,
    examType,
  } = useAppState();

  const { data: session } = useSession();

  const fetchQuestions = useCallback(
    async (page: number, append: boolean = false) => {
      if (!selectedChapter) return;
      setQuestionsLoading(true);
      try {
        const params = new URLSearchParams({
          chapterId: selectedChapter.id,
          subject: selectedSubject?.slug || "",
          exam: examType,
          page: String(page),
          limit: "50",
        });
        if (questionTypeFilter !== "all") {
          params.set("type", questionTypeFilter);
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
    [selectedChapter, selectedSubject?.slug, examType, questionTypeFilter, setQuestions, setQuestionsLoading, setQuestionsPage, setQuestionsTotal, setQuestionsTotalPages, appendQuestions]
  );

  // Re-fetch when chapter/filter changes
  useEffect(() => {
    if (selectedChapter) {
      fetchQuestions(1, false);
    }
  }, [selectedChapter, questionTypeFilter, fetchQuestions]);

  const loadMore = () => {
    if (questionsPage < questionsTotalPages && !questionsLoading) {
      fetchQuestions(questionsPage + 1, true);
    }
  };

  // Empty state: no chapter selected
  if (!selectedChapter) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-6"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-950/30 mb-6">
            <BookOpen className="h-10 w-10 text-amber-500/60" />
          </div>
          <h3 className="text-xl font-bold mb-2">Select a Chapter</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Choose a chapter from the sidebar to browse previous year JEE questions
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Sticky chapter header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b">
        <div className="px-4 md:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold tracking-tight">{selectedChapter.name}</h2>
                {selectedSubject && (
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-semibold uppercase tracking-wider"
                  >
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {examType === "jee-main" ? "JEE Main" : "JEE Advanced"}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                {questionsTotal > 0
                  ? `${questionsTotal.toLocaleString()} question${questionsTotal !== 1 ? "s" : ""} available`
                  : "Loading questions..."}
              </p>
            </div>

            <Tabs
              value={questionTypeFilter}
              onValueChange={(v) =>
                setQuestionTypeFilter(v as "all" | "MCQ" | "Numerical")
              }
            >
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-xs px-3 gap-1.5">
                  <Filter className="h-3 w-3" />
                  All
                </TabsTrigger>
                <TabsTrigger value="MCQ" className="text-xs px-3 gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  MCQ
                </TabsTrigger>
                <TabsTrigger value="Numerical" className="text-xs px-3 gap-1.5">
                  <Hash className="h-3 w-3" />
                  Numerical
                </TabsTrigger>
              </TabsList>
            </Tabs>
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
                    <Skeleton className="h-7 w-9 rounded-md" />
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
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted/60 mb-6">
              <Inbox className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Questions Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Try selecting a different chapter or changing the question type filter
            </p>
          </motion.div>
        ) : (
          <>
            {/* Showing count bar */}
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center mb-5"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/60 text-xs font-medium text-muted-foreground">
                  <span>
                    Showing{" "}
                    <span className="font-bold text-foreground">
                      {questions.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-foreground">
                      {questionsTotal.toLocaleString()}
                    </span>{" "}
                    questions
                  </span>
                  {questionsPage < questionsTotalPages && (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Question cards */}
            <div className="space-y-5">
              {questions.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                >
                  <QuestionCard question={q} index={i} />
                </motion.div>
              ))}
            </div>

            {/* Load more */}
            {questionsPage < questionsTotalPages && (
              <div className="flex justify-center pt-6">
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
                Showing {questions.length} of {questionsTotal.toLocaleString()} questions
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}