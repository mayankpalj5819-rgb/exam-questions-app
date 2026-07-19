"use client";

import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useAppState, type SubjectData } from "@/hooks/use-app-state";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bookmark,
  LogOut,
  Moon,
  Sun,
  User,
  Menu,
  Zap,
} from "lucide-react";

const SUBJECT_SLUGS = ["physics", "chemistry", "mathematics"];
const SUBJECT_LABELS: Record<string, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  mathematics: "Mathematics",
};

const SUBJECT_ICONS: Record<string, string> = {
  physics: "⚛",
  chemistry: "🧪",
  mathematics: "📐",
};

export function Navbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const {
    view,
    setView,
    selectedSubject,
    subjects,
    setSelectedSubject,
    savedCount,
    setAuthModalOpen,
    setSidebarOpen,
  } = useAppState();

  const goHome = () => {
    setView("landing");
    setSelectedSubject(null);
  };

  const handleSubjectClick = (slug: string) => {
    const subject = subjects.find((s) => s.slug === slug);
    if (subject) {
      setSelectedSubject(subject);
      setView("questions");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        {/* Left: Logo */}
        <div className="flex items-center gap-2.5 mr-6">
          {view === "questions" && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-0.5 h-9 w-9 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <button
            onClick={goHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
              <Zap className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="hidden sm:inline font-bold text-base tracking-tight">
              JEE PYQ{" "}
              <span className="text-amber-600 dark:text-amber-400">Vault</span>
            </span>
            <span className="sm:hidden font-bold text-sm text-amber-600 dark:text-amber-400">
              PYQ
            </span>
          </button>
        </div>

        {/* Center: Subject tabs (desktop) */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {SUBJECT_SLUGS.map((slug) => {
            const isActive =
              selectedSubject?.slug === slug && view === "questions";
            return (
              <button
                key={slug}
                onClick={() => handleSubjectClick(slug)}
                className={`
                  relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }
                `}
              >
                <span className="text-base leading-none">{SUBJECT_ICONS[slug]}</span>
                {SUBJECT_LABELS[slug]}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 ml-auto">
          {session?.user && (
            <Button
              variant={view === "saved" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setView(view === "saved" ? "landing" : "saved")}
              className="relative h-9 w-9 rounded-lg"
            >
              <Bookmark
                className={`h-[18px] w-[18px] transition-colors ${
                  view === "saved"
                    ? "text-amber-600 dark:text-amber-400"
                    : ""
                }`}
              />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4.5 min-w-[18px] px-1 flex items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white shadow-sm">
                  {savedCount > 99 ? "99+" : savedCount}
                </span>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 rounded-lg"
          >
            <Sun className="h-4.5 w-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4.5 w-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full p-0 ml-0.5"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-amber-200 dark:ring-amber-800 ring-offset-2 ring-offset-background">
                    <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold">
                      {session.user.name?.charAt(0)?.toUpperCase() ||
                        session.user.email?.charAt(0)?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-semibold">
                    {session.user.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session.user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setView("saved")} className="gap-2">
                  <Bookmark className="h-4 w-4" />
                  Saved Questions
                  {savedCount > 0 && (
                    <span className="ml-auto text-xs font-semibold text-muted-foreground">
                      {savedCount}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="gap-2 text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm h-9 px-4 rounded-lg font-medium ml-1"
              onClick={() => setAuthModalOpen(true)}
            >
              <User className="mr-1.5 h-4 w-4" />
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}