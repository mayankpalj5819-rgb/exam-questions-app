"use client";

import { useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAppState, type SavedQuestionData, type QuestionData } from "@/hooks/use-app-state";
import { QuestionCard } from "@/components/question-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Bookmark,
  FileText,
  Loader2,
  BookOpen,
  Trash2,
  LayoutGrid,
  List,
  Atom,
  FlaskConical,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SavedDashboard() {
  const { data: session } = useSession();
  const {
    savedQuestions,
    savedQuestionsLoading,
    savedSubjectFilter,
    setSavedSubjectFilter,
    savedViewMode,
    setSavedViewMode,
    setSavedQuestions,
    setSavedQuestionsLoading,
    toggleSavedQuestionId,
    setSavedQuestionIds,
    setSavedCount,
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
        toast.success("Question removed from saved");
      }
    } catch {
      toast.error("Failed to unsave");
    }
  };

  const handleClearAll = async () => {
    try {
      const ids = savedQuestions.map((sq) => sq.questionId);
      // Use batch delete via individual calls
      const promises = ids.map((id) =>
        fetch(`/api/questions/save?questionId=${id}`, { method: "DELETE" })
      );
      await Promise.all(promises);
      setSavedQuestions([]);
      setSavedQuestionIds(new Set());
      setSavedCount(0);
      toast.success("All saved questions cleared");
    } catch {
      toast.error("Failed to clear saved questions");
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

  if (!session?.user) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-6"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted/60 mb-6">
            <Bookmark className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <p className="text-lg font-semibold mb-1">Please log in</p>
          <p className="text-sm">Login to view your saved questions</p>
        </motion.div>
      </div>
    );
  }

  const filteredSaved =
    savedSubjectFilter === "all"
      ? savedQuestions
      : savedQuestions.filter(
          (sq) => sq.question.subject.slug === savedSubjectFilter
        );

  const subjectCounts = {
    all: savedQuestions.length,
    physics: savedQuestions.filter((sq) => sq.question.subject.slug === "physics").length,
    chemistry: savedQuestions.filter((sq) => sq.question.subject.slug === "chemistry").length,
    mathematics: savedQuestions.filter((sq) => sq.question.subject.slug === "mathematics").length,
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b px-4 md:px-6 py-3">
        <div className="space-y-3">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/50 shrink-0">
                <Bookmark className="h-5.5 w-5.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-0.5">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  Saved Questions
                </h2>
                <p className="text-sm text-muted-foreground">
                  {savedQuestions.length === 0
                    ? "No questions saved yet"
                    : (
                      <span>
                        <span className="font-bold text-foreground text-base">{savedQuestions.length}</span>{" "}
                        question{savedQuestions.length !== 1 ? "s" : ""} saved for revision
                      </span>
                    )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* View mode toggle */}
              <div className="flex items-center border rounded-lg p-0.5">
                <button
                  onClick={() => setSavedViewMode("list")}
                  className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-md transition-colors",
                    savedViewMode === "list"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setSavedViewMode("grid")}
                  className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-md transition-colors",
                    savedViewMode === "grid"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>

              {filteredSaved.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPDF}
                    className="text-xs gap-1.5 h-8 rounded-lg"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Export PDF
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5 h-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Clear All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear all saved questions?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove all {savedQuestions.length} saved question{savedQuestions.length !== 1 ? "s" : ""}. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleClearAll}
                          className="bg-destructive text-white hover:bg-destructive/90"
                        >
                          Clear All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>

          {/* Subject filter tabs */}
          <Tabs
            value={savedSubjectFilter}
            onValueChange={setSavedSubjectFilter}
          >
            <TabsList className="h-9 p-0.5">
              <TabsTrigger value="all" className="text-xs px-3 gap-1.5 rounded-md h-8">
                All
                <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px] font-bold rounded">
                  {subjectCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="physics" className="text-xs px-3 gap-1.5 rounded-md h-8">
                <Atom className="h-3 w-3" />
                Physics
                <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px] font-bold rounded">
                  {subjectCounts.physics}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="chemistry" className="text-xs px-3 gap-1.5 rounded-md h-8">
                <FlaskConical className="h-3 w-3" />
                Chemistry
                <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px] font-bold rounded">
                  {subjectCounts.chemistry}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="mathematics" className="text-xs px-3 gap-1.5 rounded-md h-8">
                <Calculator className="h-3 w-3" />
                Math
                <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px] font-bold rounded">
                  {subjectCounts.mathematics}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6">
        {savedQuestionsLoading ? (
          <div className={cn(
            savedViewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"
          )}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-muted to-muted" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-9 rounded-md" />
                    <Skeleton className="h-5 w-14" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSaved.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted/60 mb-6">
              <Bookmark className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold mb-2">No saved questions</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto leading-relaxed">
              {savedSubjectFilter !== "all"
                ? "No saved questions in this subject"
                : "Start saving questions to review them later"}
            </p>
            <Button
              variant="outline"
              className="rounded-xl px-6"
              onClick={() => setView("landing")}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Questions
            </Button>
          </motion.div>
        ) : (
          <div className={cn(
            savedViewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 gap-4"
              : "space-y-4"
          )}>
            {filteredSaved.map((sq, i) => (
              <motion.div
                key={sq.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
              >
                <QuestionCard question={sq.question} index={i} onUnsave={handleUnsave} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}