"use client";

import { useMemo } from "react";
import { useAppState, type ChapterData, type SubjectData } from "@/hooks/use-app-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, BookOpen, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChapterSidebarProps {
  onChapterSelect: (chapter: ChapterData) => void;
  className?: string;
}

function ChapterItem({
  chapter,
  isActive,
  onSelect,
}: {
  chapter: ChapterData;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-all duration-150",
        isActive
          ? "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-medium"
          : "text-foreground/80 hover:bg-accent/50 hover:text-foreground"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-md transition-colors shrink-0",
          isActive
            ? "bg-amber-200 dark:bg-amber-800/50"
            : "bg-muted/50 group-hover:bg-muted"
        )}
      >
        <BookOpen
          className={cn(
            "h-3.5 w-3.5",
            isActive
              ? "text-amber-700 dark:text-amber-300"
              : "text-muted-foreground"
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate leading-tight">{chapter.name}</span>
      </div>
      {chapter.questionCount > 0 && (
        <Badge
          variant="secondary"
          className={cn(
            "h-5 min-w-5 px-1.5 text-[11px] font-bold justify-center rounded-md shrink-0 tabular-nums",
            isActive
              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
              : "bg-muted text-muted-foreground"
          )}
        >
          {chapter.questionCount}
        </Badge>
      )}
    </button>
  );
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

  const totalChapters = selectedSubject?.chapters?.length || 0;

  if (!selectedSubject) return null;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-5 border-b space-y-2">
        <h2 className="font-bold text-base capitalize tracking-tight">
          {selectedSubject.name}
        </h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {totalChapters} chapters
          </span>
          <span className="text-border">·</span>
          <span>{totalQuestions.toLocaleString()} questions</span>
        </div>
      </div>

      {/* Chapter list */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {Object.entries(chaptersByCategory).map(
            ([category, chapters]) => (
              <Collapsible key={category} defaultOpen>
                <CollapsibleTrigger className="group flex w-full items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
                  <span className="truncate">{category}</span>
                  <Badge
                    variant="secondary"
                    className="ml-auto h-4 min-w-4 px-1 text-[10px] font-bold justify-center rounded"
                  >
                    {chapters.length}
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mb-1">
                    {chapters.map((chapter) => (
                      <ChapterItem
                        key={chapter.id}
                        chapter={chapter}
                        isActive={selectedChapter?.id === chapter.id}
                        onSelect={() => {
                          onChapterSelect(chapter);
                          setSidebarOpen(false);
                        }}
                      />
                    ))}
                  </div>
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
          "hidden md:flex w-72 flex-col border-r bg-card/50 shrink-0 h-[calc(100vh-3.5rem)] sticky top-14",
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
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
        onClick={() => setSidebarOpen(false)}
      />
      {/* Drawer */}
      <div className="fixed top-14 left-0 z-50 w-72 h-[calc(100vh-3.5rem)] bg-card border-r shadow-2xl md:hidden overflow-hidden flex flex-col animate-in slide-in-from-left duration-200">
        <div className="px-5 py-5 border-b space-y-2">
          <h2 className="font-bold text-base capitalize tracking-tight">
            {selectedSubject.name}
          </h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="py-2">
            {Object.entries(chaptersByCategory).map(([category, chapters]) => (
              <Collapsible key={category} defaultOpen>
                <CollapsibleTrigger className="group flex w-full items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
                  <span className="truncate">{category}</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mb-1">
                    {chapters.map((chapter) => {
                      const isActive = selectedChapter?.id === chapter.id;
                      return (
                        <ChapterItem
                          key={chapter.id}
                          chapter={chapter}
                          isActive={isActive}
                          onSelect={() => {
                            onChapterSelect(chapter);
                            setSidebarOpen(false);
                          }}
                        />
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}