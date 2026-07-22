"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import { useAppState } from "@/hooks/use-app-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Atom,
  FlaskConical,
  Calculator,
  Target,
  BarChart3,
  TrendingUp,
  Bookmark,
  Shuffle,
  Moon,
  Sun,
  Keyboard,
  Command,
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
  action: () => void;
}

function isInputFocused(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function QuickNavigate() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const { theme, setTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    setView,
    subjects,
    setSelectedSubject,
    setShortcutsHelpOpen,
    setSelectedChapter,
    setViewingAllQuestions,
  } = useAppState();

  const actions: QuickAction[] = [
    {
      id: "physics",
      label: "Go to Physics",
      description: "Browse physics questions",
      icon: <Atom className="h-4 w-4 text-orange-500" />,
      keywords: ["physics", "phy", "mechanics", "waves", "optics"],
      action: () => {
        const subject = subjects.find((s) => s.slug === "physics");
        if (subject) {
          setSelectedSubject(subject);
          setViewingAllQuestions(true);
          setView("questions");
        }
      },
    },
    {
      id: "chemistry",
      label: "Go to Chemistry",
      description: "Browse chemistry questions",
      icon: <FlaskConical className="h-4 w-4 text-emerald-500" />,
      keywords: ["chemistry", "chem", "organic", "inorganic", "physical"],
      action: () => {
        const subject = subjects.find((s) => s.slug === "chemistry");
        if (subject) {
          setSelectedSubject(subject);
          setViewingAllQuestions(true);
          setView("questions");
        }
      },
    },
    {
      id: "mathematics",
      label: "Go to Mathematics",
      description: "Browse mathematics questions",
      icon: <Calculator className="h-4 w-4 text-violet-500" />,
      keywords: ["math", "mathematics", "calculus", "algebra", "geometry"],
      action: () => {
        const subject = subjects.find((s) => s.slug === "mathematics");
        if (subject) {
          setSelectedSubject(subject);
          setViewingAllQuestions(true);
          setView("questions");
        }
      },
    },
    {
      id: "practice",
      label: "Open Practice Mode",
      description: "Start a practice session",
      icon: <Target className="h-4 w-4 text-amber-500" />,
      keywords: ["practice", "quiz", "test", "session"],
      action: () => setView("practice"),
    },
    {
      id: "analytics",
      label: "View Analytics",
      description: "See your performance analytics",
      icon: <BarChart3 className="h-4 w-4 text-amber-500" />,
      keywords: ["analytics", "stats", "statistics", "performance"],
      action: () => setView("analytics"),
    },
    {
      id: "progress",
      label: "View Progress",
      description: "Track your learning progress",
      icon: <TrendingUp className="h-4 w-4 text-amber-500" />,
      keywords: ["progress", "tracking", "streak", "history"],
      action: () => setView("progress"),
    },
    {
      id: "saved",
      label: "View Saved Questions",
      description: "Access your bookmarked questions",
      icon: <Bookmark className="h-4 w-4 text-amber-500" />,
      keywords: ["saved", "bookmark", "bookmarks", "favorites", "starred"],
      action: () => setView("saved"),
    },
    {
      id: "random",
      label: "Random Question",
      description: "Jump to a random question",
      icon: <Shuffle className="h-4 w-4 text-amber-500" />,
      keywords: ["random", "surprise", "lucky", "any"],
      action: () => {
        fetch("/api/random-question?exam=jee-main")
          .then((res) => res.json())
          .then((data) => {
            if (data?.id) {
              const subject = subjects.find(
                (s) => s.slug === data.subject?.slug
              );
              if (subject) {
                setSelectedSubject(subject);
                const chapter = subject.chapters.find(
                  (c) => c.slug === data.chapter?.slug
                );
                if (chapter) {
                  setSelectedChapter(chapter);
                }
                setViewingAllQuestions(true);
                setView("questions");
              }
            }
          })
          .catch(() => {
            // silently fail
          });
      },
    },
    {
      id: "theme",
      label: "Toggle Dark Mode",
      description: "Switch between light and dark themes",
      icon: <Moon className="h-4 w-4 text-amber-500 dark:hidden" />,
      keywords: ["theme", "dark", "light", "mode", "toggle", "appearance"],
      action: () => setTheme(theme === "dark" ? "light" : "dark"),
    },
    {
      id: "shortcuts",
      label: "Keyboard Shortcuts",
      description: "View all keyboard shortcuts",
      icon: <Keyboard className="h-4 w-4 text-amber-500" />,
      keywords: ["shortcuts", "keyboard", "keys", "help"],
      action: () => {
        setOpen(false);
        setTimeout(() => setShortcutsHelpOpen(true), 100);
      },
    },
  ];

  const filteredActions = search
    ? actions.filter(
        (a) =>
          a.label.toLowerCase().includes(search.toLowerCase()) ||
          a.description.toLowerCase().includes(search.toLowerCase()) ||
          a.keywords.some((k) => k.includes(search.toLowerCase()))
      )
    : actions;

  const executeAction = useCallback(
    (action: QuickAction) => {
      setOpen(false);
      setSearch("");
      action.action();
    },
    [subjects, setView, setSelectedSubject, setViewingAllQuestions, setSelectedChapter, setShortcutsHelpOpen, theme, setTheme]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // "/" to open
      if (e.key === "/" && !isInputFocused(e) && !open) {
        e.preventDefault();
        setOpen(true);
        return;
      }

      if (!open) return;

      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) =>
          i < filteredActions.length - 1 ? i + 1 : 0
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) =>
          i > 0 ? i - 1 : filteredActions.length - 1
        );
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const action = filteredActions[activeIndex];
        if (action) {
          executeAction(action);
        }
      }
    },
    [open, filteredActions, activeIndex, executeAction]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector("[data-active='true']");
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSearch("");
      }}
    >
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm shadow-amber-500/20">
              <Command className="h-4 w-4 text-white" />
            </div>
            Quick Navigate
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Type to search actions, use arrow keys and Enter to select
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2">
          <div className="relative">
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveIndex(0);
              }}
              placeholder="Search actions..."
              className="pl-9 h-10 bg-muted/50 border-border/60 focus-visible:ring-amber-500/30"
              autoFocus
            />
            <Command className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div
          ref={listRef}
          className="px-3 pb-4 max-h-[320px] overflow-y-auto"
          role="listbox"
        >
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No matching actions found
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredActions.map((action, index) => (
                <button
                  key={action.id}
                  data-active={index === activeIndex}
                  onClick={() => executeAction(action)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left transition-colors duration-100 ${
                    index === activeIndex
                      ? "bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200"
                      : "text-foreground/80 hover:bg-muted/60"
                  }`}
                  role="option"
                  aria-selected={index === activeIndex}
                >
                  <span
                    className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg ${
                      index === activeIndex
                        ? "bg-amber-200/70 dark:bg-amber-900/40"
                        : "bg-muted/70"
                    }`}
                  >
                    {action.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{action.label}</p>
                    <p
                      className={`text-xs truncate ${
                        index === activeIndex
                          ? "text-amber-700/70 dark:text-amber-400/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {action.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}