"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useAppState, type QuestionData } from "@/hooks/use-app-state";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/math-text";
import {
  Heart,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: QuestionData;
  index: number;
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

  const isSaved = savedQuestionIds.has(question.id);
  const isNumerical = question.questionType === "Numerical";

  const parsedOptions = question.options
    ? (() => {
        try {
          const opts = JSON.parse(question.options);
          return Array.isArray(opts) ? opts : [];
        } catch {
          return [];
        }
      })()
    : [];

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

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Q{index + 1}
          </span>
          {question.year && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="mr-1 h-3 w-3" />
              {question.year}
            </Badge>
          )}
          {question.shift && (
            <Badge variant="outline" className="text-xs">
              <Clock className="mr-1 h-3 w-3" />
              {question.shift}
            </Badge>
          )}
          <Badge
            className={cn(
              "text-xs",
              isNumerical
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950"
            )}
          >
            {question.questionType}
          </Badge>
          {question.chapter && (
            <Badge variant="secondary" className="text-xs">
              {question.chapter.name}
            </Badge>
          )}
          {session?.user && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8"
              onClick={handleSaveToggle}
              disabled={saveLoading}
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-colors",
                  isSaved
                    ? "fill-red-500 text-red-500"
                    : "text-muted-foreground hover:text-red-400"
                )}
              />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Question text */}
        <div className="text-sm leading-relaxed">
          <MathText text={question.questionText} />
        </div>

        {/* Image */}
        {question.imageUrl && (
          <div className="rounded-lg overflow-hidden border bg-muted/30">
            <img
              src={question.imageUrl}
              alt="Question diagram"
              className="max-w-full h-auto mx-auto"
              loading="lazy"
            />
          </div>
        )}

        {/* Options for MCQ */}
        {!isNumerical && parsedOptions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {parsedOptions.map((option: string, i: number) => {
              const letter = String.fromCharCode(65 + i);
              const isCorrect =
                question.correctAnswer === letter ||
                question.correctAnswer === option;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border p-3 text-sm",
                    isCorrect &&
                      "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold border",
                      isCorrect
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {letter}
                  </span>
                  <div className="flex-1 min-w-0">
                    <MathText text={option} />
                  </div>
                  {isCorrect && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Numerical answer */}
        {isNumerical && question.correctAnswer && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30 p-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">
              Answer:{" "}
              <MathText text={question.correctAnswer} />
            </span>
          </div>
        )}
      </CardContent>

      {/* Solution toggle */}
      {(question.solution || question.solutionHtml) && (
        <CardFooter className="pt-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
            onClick={() => setSolutionOpen(!solutionOpen)}
          >
            {solutionOpen ? (
              <ChevronUp className="mr-1 h-4 w-4" />
            ) : (
              <ChevronDown className="mr-1 h-4 w-4" />
            )}
            {solutionOpen ? "Hide Solution" : "Show Solution"}
          </Button>
          {solutionOpen && (
            <div className="mt-3 w-full rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
              <p className="font-semibold mb-2 text-amber-700 dark:text-amber-400">
                Solution
              </p>
              <MathText
                text={question.solutionHtml || question.solution || ""}
              />
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}