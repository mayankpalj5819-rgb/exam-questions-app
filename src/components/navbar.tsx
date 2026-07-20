"use client";

import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useAppState, type SubjectData } from "@/hooks/use-app-state";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Bookmark,
  LogOut,
  Moon,
  Sun,
  User,
  Menu,
  Zap,
  Search,
  Home,
  BookOpen,
  Atom,
  FlaskConical,
  Calculator,
  X,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SUBJECT_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  physics: { icon: <Atom className="h-4 w-4" />, label: "Physics" },
  chemistry: { icon: <FlaskConical className="h-4 w-4" />, label: "Chemistry" },
  mathematics: { icon: <Calculator className="h-4 w-4" />, label: "Mathematics" },
};

export function Navbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const {
    view,
    setView,
    examType,
    setExamType,
    selectedSubject,
    subjects,
    setSelectedSubject,
    savedCount,
    setAuthModalOpen,
    setSidebarOpen,
    setSearchOpen,
    mobileMenuOpen,
    setMobileMenuOpen,
  } = useAppState();

  const goHome = () => {
    setView("landing");
    setSelectedSubject(null);
    setMobileMenuOpen(false);
  };

  const handleSubjectClick = (slug: string) => {
    const subject = subjects.find((s) => s.slug === slug);
    if (subject) {
      setSelectedSubject(subject);
      setView("questions");
      setMobileMenuOpen(false);
    }
  };

  const handleSavedClick = () => {
    setView(view === "saved" ? "landing" : "saved");
    setMobileMenuOpen(false);
  };

  const handleAnalyticsClick = () => {
    setView(view === "analytics" ? "landing" : "analytics");
    setMobileMenuOpen(false);
  };

  const isActive = (targetView: string) => view === targetView;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        {/* Left: Mobile Menu + Logo */}
        <div className="flex items-center gap-2 mr-4">
          {/* Mobile hamburger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 rounded-lg"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="px-5 pt-5 pb-3 border-b">
                <SheetTitle className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-base tracking-tight">
                    JEE PYQ <span className="text-amber-600 dark:text-amber-400">Vault</span>
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="py-3 px-3">
                {/* Exam toggle in mobile */}
                <div className="px-2 mb-4">
                  <Tabs
                    value={examType}
                    onValueChange={(v) => setExamType(v as "jee-main" | "jee-advanced")}
                  >
                    <TabsList className="w-full h-9 p-1">
                      <TabsTrigger value="jee-main" className="flex-1 text-xs font-medium rounded-lg">
                        JEE Main
                      </TabsTrigger>
                      <TabsTrigger value="jee-advanced" className="flex-1 text-xs font-medium rounded-lg">
                        JEE Advanced
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Nav items */}
                <nav className="space-y-1">
                  <button
                    onClick={goHome}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive("landing")
                        ? "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300"
                        : "hover:bg-accent"
                    }`}
                  >
                    <Home className={`h-4 w-4 ${isActive("landing") ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
                    Home
                  </button>

                  {(["physics", "chemistry", "mathematics"] as const).map((slug) => {
                    const config = SUBJECT_CONFIG[slug];
                    const isSubjectActive = selectedSubject?.slug === slug && isActive("questions");
                    return (
                      <button
                        key={slug}
                        onClick={() => handleSubjectClick(slug)}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isSubjectActive
                            ? "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300"
                            : "hover:bg-accent"
                        }`}
                      >
                        <span className={isSubjectActive ? "text-amber-600 dark:text-amber-400" : slug === "physics" ? "text-orange-500" : slug === "chemistry" ? "text-emerald-500" : "text-violet-500"}>
                          {config.icon}
                        </span>
                        {config.label}
                      </button>
                    );
                  })}
                </nav>

                {session?.user && (
                  <>
                    <div className="my-3 border-t" />
                    <button
                      onClick={handleSavedClick}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive("saved")
                          ? "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300"
                          : "hover:bg-accent"
                      }`}
                    >
                      <Bookmark className={`h-4 w-4 ${isActive("saved") ? "text-amber-500" : "text-muted-foreground"}`} />
                      Saved Questions
                      {savedCount > 0 && (
                        <Badge className="ml-auto h-5 min-w-5 px-1.5 text-[10px] font-bold bg-amber-600 text-white border-0">
                          {savedCount > 99 ? "99+" : savedCount}
                        </Badge>
                      )}
                    </button>
                  </>
                )}

                <div className="my-3 border-t" />
                <button
                  onClick={handleAnalyticsClick}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive("analytics")
                      ? "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300"
                      : "hover:bg-accent"
                  }`}
                >
                  <BarChart3 className={`h-4 w-4 ${isActive("analytics") ? "text-amber-500" : "text-muted-foreground"}`} />
                  Analytics
                </button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Questions sidebar toggle (mobile) */}
          {view === "questions" && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <BookOpen className="h-4.5 w-4.5" />
            </Button>
          )}

          {/* Logo */}
          <button
            onClick={goHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
              <Zap className="h-4 w-4 text-white" />
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

        {/* Center: Exam Toggle + Subject tabs (desktop) */}
        <nav className="hidden md:flex items-center gap-2 flex-1 ml-4">
          {/* Exam type toggle */}
          <Tabs
            value={examType}
            onValueChange={(v) => setExamType(v as "jee-main" | "jee-advanced")}
          >
            <TabsList className="h-8 p-0.5 mr-1">
              <TabsTrigger value="jee-main" className="text-[11px] font-semibold px-2.5 py-1 rounded-md h-7">
                JEE Main
              </TabsTrigger>
              <TabsTrigger value="jee-advanced" className="text-[11px] font-semibold px-2.5 py-1 rounded-md h-7">
                JEE Adv.
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="h-5 w-px bg-border" />

          {/* Subject tabs */}
          <div className="flex items-center gap-0.5 ml-1">
            {(["physics", "chemistry", "mathematics"] as const).map((slug) => {
              const config = SUBJECT_CONFIG[slug];
              const isSubjectActive =
                selectedSubject?.slug === slug && isActive("questions");
              return (
                <button
                  key={slug}
                  onClick={() => handleSubjectClick(slug)}
                  className={`
                    relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      isSubjectActive
                        ? "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }
                  `}
                >
                  {config.icon}
                  {config.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Analytics button */}
          <Button
            variant={isActive("analytics") ? "secondary" : "ghost"}
            size="icon"
            onClick={handleAnalyticsClick}
            className="relative h-9 w-9 rounded-lg"
            title="Analytics"
          >
            <BarChart3
              className={`h-[18px] w-[18px] transition-colors ${
                isActive("analytics")
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              }`}
            />
          </Button>

          {/* Saved questions button with count badge */}
          <Button
            variant={isActive("saved") ? "secondary" : "ghost"}
            size="icon"
            onClick={handleSavedClick}
            className="relative h-9 w-9 rounded-lg"
            title="Saved Questions"
          >
            <Bookmark
              className={`h-[18px] w-[18px] transition-colors ${
                isActive("saved")
                  ? "text-amber-600 dark:text-amber-400"
                  : ""
              }`}
            />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 h-[18px] min-w-[18px] px-1 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-[10px] font-bold text-white shadow-sm">
                {savedCount > 99 ? "99+" : savedCount}
              </span>
            )}
          </Button>

          {/* Search icon button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="h-9 w-9 rounded-lg"
            title="Search (⌘K)"
          >
            <Search className="h-[18px] w-[18px] text-muted-foreground" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 rounded-lg"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User / Login */}
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
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold">
                      {session.user.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={goHome} className="gap-2.5">
                  <Home className="h-4 w-4" />
                  Home
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSavedClick} className="gap-2.5">
                  <Bookmark className="h-4 w-4" />
                  Saved Questions
                  {savedCount > 0 && (
                    <Badge variant="secondary" className="ml-auto text-[10px] font-bold px-1.5 h-5 min-w-5">
                      {savedCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="gap-2.5 text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm h-9 px-4 rounded-lg font-medium ml-1 transition-all duration-200 hover:shadow-md"
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