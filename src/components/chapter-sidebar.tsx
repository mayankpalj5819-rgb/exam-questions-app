"use client";

import { useMemo } from "react";
import { useAppState, type ChapterData, type SubjectData } from "@/hooks/use-app-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronRight,
  BookOpen,
  Layers,
  Search,
  X,
  ArrowLeft,
  List,
  Hash,
  Inbox,
} from "lucide-react";
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
        "group flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-all duration-150 relative",
        isActive
          ? "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-semibold"
          : "text-foreground/80 hover:bg-accent/50 hover:text-foreground",
        isActive && "border-l-[3px] border-amber-500 dark:border-amber-400 -ml-[3px] pl-[calc(1rem-3px)]"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-md transition-all duration-150 shrink-0",
          isActive
            ? "bg-amber-200 dark:bg-amber-800/50 shadow-sm"
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
        <span
          className={cn(
            "text-xs font-bold tabular-nums shrink-0 px-2 py-0.5 rounded-md",
            isActive
              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
              : "bg-muted text-muted-foreground"
          )}
        >
          {chapter.questionCount}
        </span>
      )}
    </button>
  );
}

function SidebarContent({
  onChapterSelect,
  onBackToSubjects,
  onAllQuestions,
}: {
  onChapterSelect: (chapter: ChapterData) => void;
  onBackToSubjects: () => void;
  onAllQuestions: () => void;
}) {
  const {
    selectedSubject,
    selectedChapter,
    viewingAllQuestions,
    sidebarSearch,
    setSidebarSearch,
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

  const filteredChaptersByCategory = useMemo(() => {
    if (!sidebarSearch.trim()) return chaptersByCategory;
    const search = sidebarSearch.toLowerCase();
    const filtered: Record<string, ChapterData[]> = {};
    for (const [cat, chapters] of Object.entries(chaptersByCategory)) {
      const matching = chapters.filter((ch) =>
        ch.name.toLowerCase().includes(search)
      );
      if (matching.length > 0) {
        filtered[cat] = matching;
      }
    }
    return filtered;
  }, [chaptersByCategory, sidebarSearch]);

  const totalQuestions = selectedSubject?.chapters?.reduce(
    (sum, ch) => sum + ch.questionCount,
    0
  ) || 0;

  const totalChapters = selectedSubject?.chapters?.length || 0;

  if (!selectedSubject) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/60 space-y-3">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onBackToSubjects();
            setSidebarOpen(false);
          }}
          className="h-7 px-2 -ml-2 text-xs text-muted-foreground hover:text-foreground gap-1.5 mb-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Subjects
        </Button>

        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base capitalize tracking-tight flex items-center gap-2">
            {selectedSubject.name}
          </h2>
          {selectedSubject.slug === "physics" && <div className="w-2 h-2 rounded-full bg-orange-500" />}
          {selectedSubject.slug === "chemistry" && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
          {selectedSubject.slug === "mathematics" && <div className="w-2 h-2 rounded-full bg-violet-500" />}
        </div>

        {/* Prominent stats */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/40">
            <Layers className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground leading-none">Questions</p>
              <p className="text-sm font-bold tabular-nums leading-tight">{totalQuestions.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/40">
            <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground leading-none">Chapters</p>
              <p className="text-sm font-bold tabular-nums leading-tight">{totalChapters}</p>
            </div>
          </div>
        </div>

        {/* Search within chapters */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input
            placeholder="Search chapters..."
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            className="h-8 pl-8 pr-7 text-xs rounded-lg bg-muted/50 border-border/50"
          />
          {sidebarSearch && (
            <button
              onClick={() => setSidebarSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Chapter list */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {/* "All Questions" option at top */}
          <button
            onClick={() => {
              onAllQuestions();
              setSidebarOpen(false);
            }}
            className={cn(
              "group flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-all duration-150 border-b border-border/50 mb-1 relative",
              viewingAllQuestions
                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-semibold"
                : "text-foreground/80 hover:bg-accent/50 hover:text-foreground",
              viewingAllQuestions && "border-l-[3px] border-amber-500 dark:border-amber-400 -ml-[3px] pl-[calc(1rem-3px)]"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-6 h-6 rounded-md transition-all duration-150 shrink-0",
                viewingAllQuestions
                  ? "bg-amber-200 dark:bg-amber-800/50 shadow-sm"
                  : "bg-muted/50 group-hover:bg-muted"
              )}
            >
              <Inbox
                className={cn(
                  "h-3.5 w-3.5",
                  viewingAllQuestions
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-muted-foreground"
                )}
              />
            </div>
            <span className="min-w-0 flex-1 truncate leading-tight font-medium">
              All Questions
            </span>
            <span
              className={cn(
                "text-xs font-bold tabular-nums shrink-0 px-2 py-0.5 rounded-md",
                viewingAllQuestions
                  ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {totalQuestions}
            </span>
          </button>

          {Object.keys(filteredChaptersByCategory).length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No chapters found</p>
            </div>
          ) : (
            Object.entries(filteredChaptersByCategory).map(
              ([category, chapters]) => (
                <Collapsible key={category} defaultOpen>
                  <CollapsibleTrigger className="group flex w-full items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronRight className="h-3 w-3 shrink-0 transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
                    <span className="truncate">{category}</span>
                    <span className="ml-auto text-[10px] font-bold tabular-nums text-muted-foreground/70">
                      {chapters.length}
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mb-1">
                      {chapters.map((chapter) => (
                        <ChapterItem
                          key={chapter.id}
                          chapter={chapter}
                          isActive={selectedChapter?.id === chapter.id && !viewingAllQuestions}
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
            )
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function ChapterSidebar({ onChapterSelect, className }: ChapterSidebarProps) {
  const { selectedSubject, setSelectedSubject, setViewingAllQuestions, setView } = useAppState();

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setView("landing");
  };

  const handleAllQuestions = () => {
    setViewingAllQuestions(true);
  };

  if (!selectedSubject) return null;

  const sidebarContent = (
    <SidebarContent
      onChapterSelect={onChapterSelect}
      onBackToSubjects={handleBackToSubjects}
      onAllQuestions={handleAllQuestions}
    />
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex w-72 flex-col border-r border-border/60 bg-card/80 shrink-0 h-[calc(100vh-3.5rem)] sticky top-14",
          className
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar handled by MobileChapterSidebar */}
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
    sidebarOpen,
    setSidebarOpen,
    setSelectedSubject,
    setView,
    setViewingAllQuestions,
  } = useAppState();

  if (!sidebarOpen || !selectedSubject) return null;

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setView("landing");
    setSidebarOpen(false);
  };

  const handleAllQuestions = () => {
    setViewingAllQuestions(true);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
        onClick={() => setSidebarOpen(false)}
      />
      {/* Drawer */}
      <div className="fixed top-14 left-0 z-50 w-72 h-[calc(100vh-3.5rem)] bg-card border-r shadow-2xl md:hidden overflow-hidden flex flex-col animate-in slide-in-from-left duration-200">
        <SidebarContent
          onChapterSelect={onChapterSelect}
          onBackToSubjects={handleBackToSubjects}
          onAllQuestions={handleAllQuestions}
        />
      </div>
    </>
  );
}