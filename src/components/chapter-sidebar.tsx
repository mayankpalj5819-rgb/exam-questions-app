"use client";

import { useMemo } from "react";
import { useAppState, type ChapterData, type SubjectData } from "@/hooks/use-app-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChapterSidebarProps {
  onChapterSelect: (chapter: ChapterData) => void;
  className?: string;
}

export function ChapterSidebar({ onChapterSelect, className }: ChapterSidebarProps) {
  const {
    selectedSubject,
    selectedChapter,
    sidebarOpen,
    setSidebarOpen,
  } = useAppState();

  const chaptersByCategory = useMemo(() => {
    if (!selectedSubject?.chapters) return {};
    const grouped: Record<string, ChapterData[]> = {};
    for (const chapter of selectedSubject.chapters) {
      const cat = chapter.category || "Other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(chapter);
    }
    return grouped;
  }, [selectedSubject]);

  const totalQuestions = selectedSubject?.chapters?.reduce(
    (sum, ch) => sum + ch.questionCount,
    0
  ) || 0;

  if (!selectedSubject) return null;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b">
        <h2 className="font-bold text-lg capitalize">{selectedSubject.name}</h2>
        <p className="text-sm text-muted-foreground">
          {selectedSubject.chapters.length} chapters · {totalQuestions} questions
        </p>
      </div>

      {/* Chapter list */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {Object.entries(chaptersByCategory).map(
            ([category, chapters]) => (
              <Collapsible key={category} defaultOpen>
                <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  <span className="truncate">{category}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {chapters.map((chapter) => {
                    const isActive = selectedChapter?.id === chapter.id;
                    return (
                      <button
                        key={chapter.id}
                        onClick={() => {
                          onChapterSelect(chapter);
                          setSidebarOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent",
                          isActive &&
                            "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-medium"
                        )}
                      >
                        <BookOpen className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <span className="block truncate">{chapter.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {chapter.questionCount} Q
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex w-72 flex-col border-r bg-card shrink-0 h-[calc(100vh-3.5rem)] sticky top-14",
          className
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar handled by parent Sheet */}
    </>
  );
}

export function MobileChapterSidebar({
  onChapterSelect,
}: {
  onChapterSelect: (chapter: ChapterData) => void;
}) {
  const {
    selectedSubject,
    selectedChapter,
    sidebarOpen,
    setSidebarOpen,
  } = useAppState();

  const chaptersByCategory = useMemo(() => {
    if (!selectedSubject?.chapters) return {};
    const grouped: Record<string, ChapterData[]> = {};
    for (const chapter of selectedSubject.chapters) {
      const cat = chapter.category || "Other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(chapter);
    }
    return grouped;
  }, [selectedSubject]);

  if (!sidebarOpen || !selectedSubject) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 md:hidden"
        onClick={() => setSidebarOpen(false)}
      />
      {/* Drawer */}
      <div className="fixed top-14 left-0 z-50 w-72 h-[calc(100vh-3.5rem)] bg-card border-r shadow-xl md:hidden overflow-hidden flex flex-col">
        <div className="px-4 py-4 border-b">
          <h2 className="font-bold text-lg capitalize">
            {selectedSubject.name}
          </h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="py-2">
            {Object.entries(chaptersByCategory).map(([category, chapters]) => (
              <Collapsible key={category} defaultOpen>
                <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  <span className="truncate">{category}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {chapters.map((chapter) => {
                    const isActive = selectedChapter?.id === chapter.id;
                    return (
                      <button
                        key={chapter.id}
                        onClick={() => {
                          onChapterSelect(chapter);
                          setSidebarOpen(false);
                        }}
                        className="flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent"
                      >
                        <BookOpen className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <span
                            className={`block truncate ${isActive ? "font-medium text-amber-700 dark:text-amber-400" : ""}`}
                          >
                            {chapter.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {chapter.questionCount} Q
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}