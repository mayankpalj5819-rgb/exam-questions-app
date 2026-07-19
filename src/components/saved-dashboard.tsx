"use client";

import { useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAppState, type SavedQuestionData, type QuestionData } from "@/hooks/use-app-state";
import { QuestionCard } from "@/components/question-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bookmark,
  FileText,
  Loader2,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

export function SavedDashboard() {
  const { data: session } = useSession();
  const {
    savedQuestions,
    savedQuestionsLoading,
    savedSubjectFilter,
    setSavedSubjectFilter,
    setSavedQuestions,
    setSavedQuestionsLoading,
    toggleSavedQuestionId,
    setView,
  } = useAppState();

  const fetchSaved = useCallback(async () => {
    setSavedQuestionsLoading(true);
    try {
      const params = new URLSearchParams();
      if (savedSubjectFilter !== "all") {
        params.set("subject", savedSubjectFilter);
      }
      const res = await fetch(`/api/saved?${params}`);
      const data = await res.json();
      if (res.ok) {
        setSavedQuestions(data);
      }
    } catch (err) {
      console.error("Failed to fetch saved:", err);
    } finally {
      setSavedQuestionsLoading(false);
    }
  }, [savedSubjectFilter, setSavedQuestions, setSavedQuestionsLoading]);

  useEffect(() => {
    if (session?.user) {
      fetchSaved();
    }
  }, [session?.user, fetchSaved]);

  const handleUnsave = async (questionId: string) => {
    try {
      const res = await fetch(`/api/questions/save?questionId=${questionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toggleSavedQuestionId(questionId);
        setSavedQuestions(
          savedQuestions.filter((sq) => sq.questionId !== questionId)
        );
        toast.success("Question unsaved");
      }
    } catch {
      toast.error("Failed to unsave");
    }
  };

  const handleExportPDF = async () => {
    try {
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

  if (!session?.user) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Please log in</p>
          <p className="text-sm">Login to view your saved questions</p>
        </div>
      </div>
    );
  }

  const filteredSaved =
    savedSubjectFilter === "all"
      ? savedQuestions
      : savedQuestions.filter(
          (sq) => sq.question.subject.slug === savedSubjectFilter
        );

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 md:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-amber-600" />
              Saved Questions
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredSaved.length} question
              {filteredSaved.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs
              value={savedSubjectFilter}
              onValueChange={setSavedSubjectFilter}
            >
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3">
                  All
                </TabsTrigger>
                <TabsTrigger value="physics" className="text-xs px-3">
                  Physics
                </TabsTrigger>
                <TabsTrigger value="chemistry" className="text-xs px-3">
                  Chemistry
                </TabsTrigger>
                <TabsTrigger value="mathematics" className="text-xs px-3">
                  Math
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {savedQuestions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="text-xs"
              >
                <FileText className="mr-1 h-3 w-3" />
                Print
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-4">
        {savedQuestionsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : filteredSaved.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No saved questions</p>
            <p className="text-sm mb-4">
              {savedSubjectFilter !== "all"
                ? "No saved questions in this subject"
                : "Start saving questions while browsing"}
            </p>
            <Button
              variant="outline"
              onClick={() => setView("landing")}
            >
              Browse Questions
            </Button>
          </div>
        ) : (
          <>
            {filteredSaved.map((sq, i) => (
              <div key={sq.id} className="relative">
                <QuestionCard question={sq.question} index={i} />
                <div className="absolute top-2 right-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleUnsave(sq.questionId)}
                  >
                    <Bookmark className="h-4 w-4 fill-current text-amber-600" />
                  </Button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}