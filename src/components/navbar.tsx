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
} from "lucide-react";

const SUBJECT_SLUGS = ["physics", "chemistry", "mathematics"];
const SUBJECT_LABELS: Record<string, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  mathematics: "Mathematics",
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 mr-4">
          {view === "questions" && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-1"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <button
            onClick={goHome}
            className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity"
          >
            <span className="text-amber-600">⚡</span>
            <span className="hidden sm:inline">JEE PYQ Vault</span>
            <span className="sm:hidden">PYQ</span>
          </button>
        </div>

        {/* Center: Subject tabs */}
        <nav className="hidden md:flex items-center gap-1 mx-auto">
          {SUBJECT_SLUGS.map((slug) => (
            <Button
              key={slug}
              variant={selectedSubject?.slug === slug && view === "questions" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleSubjectClick(slug)}
              className="text-sm font-medium"
            >
              {SUBJECT_LABELS[slug]}
            </Button>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 ml-auto">
          {session?.user && (
            <Button
              variant={view === "saved" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setView(view === "saved" ? "landing" : "saved")}
              className="relative"
            >
              <Bookmark className="h-5 w-5" />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">
                  {savedCount > 99 ? "99+" : savedCount}
                </span>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-amber-100 text-amber-700 text-sm font-semibold">
                      {session.user.name?.charAt(0)?.toUpperCase() ||
                        session.user.email?.charAt(0)?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">
                    {session.user.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setView("saved")}
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  Saved Questions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => setAuthModalOpen(true)}
            >
              <User className="mr-2 h-4 w-4" />
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}