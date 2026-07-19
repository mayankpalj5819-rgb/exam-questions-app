"use client";

import { useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAppState, type ChapterData } from "@/hooks/use-app-state";
import { QuestionCard } from "@/components/question-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, BookOpen, Filter } from "lucide-react";

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

  if (!selectedChapter) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Select a chapter</p>
          <p className="text-sm">
            Choose a chapter from the sidebar to view questions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Chapter header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 md:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-bold text-lg">{selectedChapter.name}</h2>
            <p className="text-sm text-muted-foreground">
              {questionsTotal} question{questionsTotal !== 1 ? "s" : ""} found
            </p>
          </div>
          <Tabs
            value={questionTypeFilter}
            onValueChange={(v) =>
              setQuestionTypeFilter(v as "all" | "MCQ" | "Numerical")
            }
          >
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs px-3">
                <Filter className="mr-1 h-3 w-3" />
                All
              </TabsTrigger>
              <TabsTrigger value="MCQ" className="text-xs px-3">
                MCQ
              </TabsTrigger>
              <TabsTrigger value="Numerical" className="text-xs px-3">
                Numerical
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Questions */}
      <div className="p-4 md:p-6 space-y-4">
        {questionsLoading && questions.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No questions found</p>
            <p className="text-sm">
              Try selecting a different chapter or filter
            </p>
          </div>
        ) : (
          <>
            {questions.map((q, i) => (
              <QuestionCard key={q.id} question={q} index={i} />
            ))}

            {/* Load more */}
            {questionsPage < questionsTotalPages && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={questionsLoading}
                >
                  {questionsLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Load More Questions
                </Button>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground pt-2">
              Showing {questions.length} of {questionsTotal} questions
            </p>
          </>
        )}
      </div>
    </div>
  );
}