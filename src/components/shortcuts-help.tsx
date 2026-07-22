"use client";

import { useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useAppState } from "@/hooks/use-app-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Command,
  ArrowRight,
  ArrowLeft,
  Home,
  Target,
  BarChart3,
  Bookmark,
  Moon,
  Sun,
  Search,
  Keyboard,
  CornerDownLeft,
  SkipForward,
  ChevronUp,
} from "lucide-react";

interface ShortcutEntry {
  keys: string[];
  description: string;
  icon?: React.ReactNode;
}

interface ShortcutSection {
  title: string;
  shortcuts: ShortcutEntry[];
}

const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: "General",
    shortcuts: [
      {
        keys: ["⌘K", "Ctrl+K"],
        description: "Search Questions",
        icon: <Search className="h-3.5 w-3.5" />,
      },
      {
        keys: ["?"],
        description: "Show Shortcuts",
        icon: <Keyboard className="h-3.5 w-3.5" />,
      },
      {
        keys: ["/"],
        description: "Quick Navigate",
        icon: <Command className="h-3.5 w-3.5" />,
      },
      {
        keys: ["Esc"],
        description: "Close Dialog / Go Back",
      },
    ],
  },
  {
    title: "Questions",
    shortcuts: [
      {
        keys: ["→", "PageDown"],
        description: "Next Page",
        icon: <ArrowRight className="h-3.5 w-3.5" />,
      },
      {
        keys: ["←", "PageUp"],
        description: "Scroll to Top",
        icon: <ChevronUp className="h-3.5 w-3.5" />,
      },
      {
        keys: ["1-5"],
        description: "Select Option (A–E)",
      },
      {
        keys: ["Enter"],
        description: "Submit Answer",
        icon: <CornerDownLeft className="h-3.5 w-3.5" />,
      },
      {
        keys: ["N"],
        description: "Next Question",
        icon: <SkipForward className="h-3.5 w-3.5" />,
      },
      {
        keys: ["S"],
        description: "Skip Question",
      },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      {
        keys: ["H"],
        description: "Home / Landing",
        icon: <Home className="h-3.5 w-3.5" />,
      },
      {
        keys: ["P"],
        description: "Practice Mode",
        icon: <Target className="h-3.5 w-3.5" />,
      },
      {
        keys: ["G"],
        description: "Analytics",
        icon: <BarChart3 className="h-3.5 w-3.5" />,
      },
      {
        keys: ["B"],
        description: "Bookmarks / Saved",
        icon: <Bookmark className="h-3.5 w-3.5" />,
      },
      {
        keys: ["D"],
        description: "Dark/Light Mode Toggle",
        icon: <Moon className="h-3.5 w-3.5 dark:hidden" />,
      },
    ],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-1.5 rounded-md bg-muted border border-border/80 text-[11px] font-mono font-medium text-foreground/80 shadow-[0_1px_0_1px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_0_1px_rgba(255,255,255,0.04)]">
      {children}
    </kbd>
  );
}

export function ShortcutsHelp() {
  const { shortcutsHelpOpen, setShortcutsHelpOpen } = useAppState();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "?" && !isInputFocused(e)) {
        e.preventDefault();
        setShortcutsHelpOpen(!shortcutsHelpOpen);
      }
      if (e.key === "Escape" && shortcutsHelpOpen) {
        setShortcutsHelpOpen(false);
      }
    },
    [shortcutsHelpOpen, setShortcutsHelpOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Dialog open={shortcutsHelpOpen} onOpenChange={setShortcutsHelpOpen}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm shadow-amber-500/20">
              <Keyboard className="h-4 w-4 text-white" />
            </div>
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Navigate faster with keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {SHORTCUT_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between gap-3 py-1.5 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors duration-150"
                  >
                    <div className="flex items-center gap-2.5 text-sm">
                      {shortcut.icon && (
                        <span className="text-muted-foreground">
                          {shortcut.icon}
                        </span>
                      )}
                      <span className="text-foreground/90">
                        {shortcut.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && (
                            <span className="text-[10px] text-muted-foreground/60 mx-0.5">
                              /
                            </span>
                          )}
                          <Kbd>{key}</Kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function isInputFocused(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement;
  const tag = target.tagName;
  if (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  ) {
    return true;
  }
  return false;
}