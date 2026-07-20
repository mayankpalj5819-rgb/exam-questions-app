"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAppState, type SubjectData, type ChapterData } from "@/hooks/use-app-state";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Clock,
  X,
  FileQuestion,
  Calendar,
  BookOpen,
  Layers,
  Tag,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const RECENT_SEARCHES_KEY = "jeepyq-recent-searches";
const MAX_RECENT = 5;

interface SearchResult {
  id: string;
  questionText: string;
  year: number | null;
  questionType: string;
  subject: { name: string; slug: string };
  chapter: { name: string; slug: string } | null;
}

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (!query.trim()) return;
  try {
    const recent = getRecentSearches().filter(
      (r) => r.toLowerCase() !== query.toLowerCase()
    );
    recent.unshift(query.trim());
    localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(recent.slice(0, MAX_RECENT))
    );
  } catch {
    // ignore
  }
}

function removeRecentSearch(query: string) {
  try {
    const recent = getRecentSearches().filter(
      (r) => r.toLowerCase() !== query.toLowerCase()
    );
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
  } catch {
    // ignore
  }
}

const SUBJECT_COLORS: Record<string, string> = {
  physics: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  chemistry: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  mathematics: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800",
};

function getSubjectColorClass(slug: string): string {
  return SUBJECT_COLORS[slug] || "bg-secondary text-secondary-foreground border-border";
}

export function SearchDialog() {
  const { data: session } = useSession();
  const {
    searchOpen,
    setSearchOpen,
    examType,
    subjects,
    setSelectedSubject,
    setSelectedChapter,
    setView,
  } = useAppState();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches when dialog opens
  useEffect(() => {
    if (searchOpen) {
      setRecentSearches(getRecentSearches());
      // Focus input with a slight delay for animation
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Reset state when dialog closes
      setQuery("");
      setResults([]);
      setTotal(0);
      setLoading(false);
      setHasSearched(false);
    }
  }, [searchOpen]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setTotal(0);
        setHasSearched(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery.trim())}&exam=${examType}&limit=10`
        );
        const data = await res.json();
        if (res.ok) {
          setResults(data.results || []);
          setTotal(data.total || 0);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [examType]
  );

  // Debounced search
  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleResultClick = (result: SearchResult) => {
    // Save search to recent
    if (query.trim()) {
      saveRecentSearch(query.trim());
    }

    // Find the subject from the store
    const subject = subjects.find((s) => s.slug === result.subject.slug);
    if (subject) {
      // Set the subject (this also clears chapter/questions)
      setSelectedSubject(subject);

      // Find the chapter within the subject
      if (result.chapter) {
        const chapter = subject.chapters.find(
          (c) => c.slug === result.chapter!.slug
        );
        if (chapter) {
          setSelectedChapter(chapter);
        }
      }
    }

    // Switch to questions view
    setView("questions");

    // Close dialog
    setSearchOpen(false);
  };

  const handleRecentClick = (recent: string) => {
    setQuery(recent);
    performSearch(recent);
    inputRef.current?.focus();
  };

  const handleRecentRemove = (e: React.MouseEvent, recent: string) => {
    e.stopPropagation();
    removeRecentSearch(recent);
    setRecentSearches(getRecentSearches());
  };

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent
        className="sm:max-w-[640px] p-0 gap-0 overflow-hidden top-[15%] translate-y-0 sm:top-[20%]"
        showCloseButton={false}
      >
        {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">Search Questions</DialogTitle>

        {/* Search Input */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="h-[18px] w-[18px] text-amber-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search questions... (e.g. kinematics, integration, organic)"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchOpen(false);
              }
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setTotal(0);
                setHasSearched(false);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[420px] overflow-hidden">
          <ScrollArea className="h-full max-h-[420px]">
            <div className="p-2">
              <AnimatePresence mode="wait">
                {/* Loading State */}
                {loading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-1 px-2 py-3"
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-2.5 py-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex gap-2 pt-1">
                          <Skeleton className="h-5 w-12 rounded-full" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-5 w-20 rounded-full" />
                          <Skeleton className="h-5 w-14 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Results */}
                {!loading && hasSearched && results.length > 0 && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {total} {total === 1 ? "result" : "results"} found
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      {results.map((result, index) => (
                        <motion.button
                          key={result.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.15 }}
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left p-3 rounded-xl hover:bg-muted/80 transition-colors group cursor-pointer"
                        >
                          <p className="text-sm leading-relaxed text-foreground line-clamp-2 mb-2">
                            {result.questionText}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {result.year && (
                              <Badge
                                variant="outline"
                                className="text-[11px] px-1.5 py-0 h-5 font-medium gap-1 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                              >
                                <Calendar className="h-2.5 w-2.5" />
                                {result.year}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[11px] px-1.5 py-0 h-5 font-medium gap-1 ${getSubjectColorClass(result.subject.slug)}`}
                            >
                              <BookOpen className="h-2.5 w-2.5" />
                              {result.subject.name}
                            </Badge>
                            {result.chapter && (
                              <Badge
                                variant="outline"
                                className="text-[11px] px-1.5 py-0 h-5 font-medium gap-1"
                              >
                                <Layers className="h-2.5 w-2.5" />
                                {result.chapter.name}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="text-[11px] px-1.5 py-0 h-5 font-medium gap-1"
                            >
                              <Tag className="h-2.5 w-2.5" />
                              {result.questionType}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all ml-auto shrink-0" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Empty State */}
                {!loading && hasSearched && results.length === 0 && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex flex-col items-center justify-center py-12 px-4"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-muted mb-4">
                      <FileQuestion className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      No results found
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                      Try different keywords or check your spelling
                    </p>
                  </motion.div>
                )}

                {/* Recent Searches (shown when no query and not loading) */}
                {!loading && !hasSearched && !query && (
                  <motion.div
                    key="recent"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {recentSearches.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-muted-foreground px-2 py-1.5 flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          Recent searches
                        </p>
                        <div className="space-y-0.5">
                          {recentSearches.map((recent) => (
                            <button
                              key={recent}
                              onClick={() => handleRecentClick(recent)}
                              className="flex items-center w-full text-left px-3 py-2 rounded-xl hover:bg-muted/80 transition-colors group"
                            >
                              <Clock className="h-3.5 w-3.5 text-muted-foreground mr-2.5 shrink-0" />
                              <span className="text-sm text-foreground flex-1 truncate">
                                {recent}
                              </span>
                              <button
                                onClick={(e) => handleRecentRemove(e, recent)}
                                className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                                aria-label={`Remove ${recent} from recent searches`}
                              >
                                <X className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tips section */}
                    <div className="mt-4 px-2">
                      <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3 text-amber-500" />
                          Search tips
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1 ml-5">
                          <li className="list-disc">Try topic names like &ldquo;kinematics&rdquo; or &ldquo;integration&rdquo;</li>
                          <li className="list-disc">Search for specific concepts like &ldquo;electromagnetic induction&rdquo;</li>
                          <li className="list-disc">Find questions by year, e.g. &ldquo;2024&rdquo;</li>
                        </ul>
                      </div>
                    </div>

                    {/* Footer hint */}
                    <div className="flex items-center justify-center gap-4 mt-4 py-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>
                        Navigate
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">↵</kbd>
                        Open
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">esc</kbd>
                        Close
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Bottom bar */}
        <div className="border-t px-4 py-2 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Searching {examType === "jee-main" ? "JEE Main" : "JEE Advanced"} questions
          </p>
          <div className="flex items-center gap-1">
            <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
            <span className="hidden sm:inline text-[10px] text-muted-foreground">
              to toggle
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}