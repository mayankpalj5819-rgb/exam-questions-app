"use client";

import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useAppState } from "@/hooks/use-app-state";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bookmark,
  LogOut,
  Moon,
  Sun,
  User,
  Menu,
  Search,
  Home,
  BookOpen,
  Atom,
  FlaskConical,
  Calculator,
  GraduationCap,
  BarChart3,
} from "lucide-react";

const SUBJECT_CONFIG: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  physics: {
    icon: <Atom className="h-4 w-4" />,
    label: "Physics",
    color: "text-orange-500",
  },
  chemistry: {
    icon: <FlaskConical className="h-4 w-4" />,
    label: "Chemistry",
    color: "text-emerald-500",
  },
  mathematics: {
    icon: <Calculator className="h-4 w-4" />,
    label: "Mathematics",
    color: "text-violet-500",
  },
};

function ExamSwitcher({
  examType,
  setExamType,
  className,
}: {
  examType: string;
  setExamType: (v: "jee-main" | "jee-advanced") => void;
  className?: string;
}) {
  return (
    <Tabs
      value={examType}
      onValueChange={(v) => setExamType(v as "jee-main" | "jee-advanced")}
    >
      <TabsList
        className={
          "h-9 p-1 gap-0.5 bg-muted/80 backdrop-blur-sm " + className
        }
      >
        <TabsTrigger
          value="jee-main"
          className="text-xs font-semibold px-3 py-1 rounded-md h-7 data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-amber-400 transition-all duration-200"
        >
          JEE Main
        </TabsTrigger>
        <TabsTrigger
          value="jee-advanced"
          className="text-xs font-semibold px-3 py-1 rounded-md h-7 data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-amber-400 transition-all duration-200"
        >
          JEE Advanced
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function NavbarButton({
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "secondary" : "ghost"}
          size="icon"
          onClick={onClick}
          className="relative h-9 w-9 rounded-lg group"
        >
          <span
            className={`transition-colors duration-200 ${
              active
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground group-hover:text-foreground"
            }`}
          >
            {icon}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-1 h-[18px] min-w-[18px] px-1 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-[10px] font-bold text-white shadow-sm pointer-events-none">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
          {active && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-amber-500" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

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
    <header className="sticky top-0 z-50 w-full border-b border-border/60 glass-nav shadow-sm shadow-black/[0.03] dark:shadow-black/20">
      <div className="flex h-14 items-center px-4 md:px-6">
        {/* ── Left: Mobile Menu + Logo ── */}
        <div className="flex items-center gap-2 mr-2 lg:mr-4 shrink-0">
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
            <SheetContent side="left" className="w-72 p-0 bg-card">
              <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/60">
                <SheetTitle className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
                    <GraduationCap className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-base tracking-tight">
                    JEE PYQ{" "}
                    <span className="text-amber-600 dark:text-amber-400">
                      Vault
                    </span>
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="py-3 px-3">
                {/* Exam toggle in mobile */}
                <div className="px-2 mb-4">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                    Exam Type
                  </p>
                  <ExamSwitcher
                    examType={examType}
                    setExamType={setExamType}
                    className="w-full"
                  />
                </div>

                {/* Nav items */}
                <nav className="space-y-0.5">
                  <button
                    onClick={goHome}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive("landing")
                        ? "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 shadow-sm"
                        : "hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Home
                      className={`h-4 w-4 ${
                        isActive("landing")
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    />
                    Home
                  </button>

                  {(["physics", "chemistry", "mathematics"] as const).map((slug) => {
                    const config = SUBJECT_CONFIG[slug];
                    const isSubjectActive =
                      selectedSubject?.slug === slug && isActive("questions");
                    return (
                      <button
                        key={slug}
                        onClick={() => handleSubjectClick(slug)}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                          isSubjectActive
                            ? "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 shadow-sm"
                            : "hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        <span
                          className={
                            isSubjectActive
                              ? "text-amber-600 dark:text-amber-400"
                              : config.color
                          }
                        >
                          {config.icon}
                        </span>
                        {config.label}
                      </button>
                    );
                  })}
                </nav>

                {session?.user && (
                  <>
                    <div className="my-3 border-t border-border/60" />
                    <button
                      onClick={handleSavedClick}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        isActive("saved")
                          ? "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 shadow-sm"
                          : "hover:bg-accent"
                      }`}
                    >
                      <Bookmark
                        className={`h-4 w-4 ${
                          isActive("saved")
                            ? "text-amber-500"
                            : "text-muted-foreground"
                        }`}
                      />
                      Saved Questions
                      {savedCount > 0 && (
                        <Badge className="ml-auto h-5 min-w-5 px-1.5 text-[10px] font-bold bg-amber-600 text-white border-0">
                          {savedCount > 99 ? "99+" : savedCount}
                        </Badge>
                      )}
                    </button>
                  </>
                )}

                <div className="my-3 border-t border-border/60" />
                <button
                  onClick={handleAnalyticsClick}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive("analytics")
                      ? "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 shadow-sm"
                      : "hover:bg-accent"
                  }`}
                >
                  <BarChart3
                    className={`h-4 w-4 ${
                      isActive("analytics")
                        ? "text-amber-500"
                        : "text-muted-foreground"
                    }`}
                  />
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
              <BookOpen className="h-[18px] w-[18px]" />
            </Button>
          )}

          {/* Logo */}
          <button
            onClick={goHome}
            className="flex items-center gap-2 group hover:opacity-80 transition-all duration-200"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm shadow-amber-500/20 group-hover:shadow-amber-500/30 transition-shadow duration-200">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-bold text-[15px] tracking-tight">
                JEE PYQ{" "}
                <span className="text-amber-600 dark:text-amber-400">
                  Vault
                </span>
              </span>
            </div>
            <span className="sm:hidden font-bold text-sm text-amber-600 dark:text-amber-400">
              PYQ
            </span>
          </button>
        </div>

        {/* ── Center: Exam Toggle + Subject tabs (desktop) ── */}
        <nav className="hidden md:flex items-center gap-3 flex-1 ml-2 lg:ml-4">
          {/* Exam type toggle — the most important control */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none">
              Exam
            </span>
            <ExamSwitcher examType={examType} setExamType={setExamType} />
          </div>

          <div className="h-8 w-px bg-border/80 self-center" />

          {/* Subject tabs */}
          <div className="flex items-center gap-1">
            {(["physics", "chemistry", "mathematics"] as const).map((slug) => {
              const config = SUBJECT_CONFIG[slug];
              const isSubjectActive =
                selectedSubject?.slug === slug && isActive("questions");
              return (
                <button
                  key={slug}
                  onClick={() => handleSubjectClick(slug)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isSubjectActive
                      ? "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 shadow-sm shadow-amber-500/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <span
                    className={
                      isSubjectActive
                        ? "text-amber-600 dark:text-amber-400"
                        : config.color
                    }
                  >
                    {config.icon}
                  </span>
                  {config.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Right: Actions ── */}
        <div className="flex items-center gap-0.5 ml-auto shrink-0">
          {/* Analytics button */}
          <NavbarButton
            icon={<BarChart3 className="h-[18px] w-[18px]" />}
            label="Analytics"
            active={isActive("analytics")}
            onClick={handleAnalyticsClick}
          />

          {/* Saved questions button with count badge */}
          {session?.user && (
            <NavbarButton
              icon={<Bookmark className="h-[18px] w-[18px]" />}
              label="Saved Questions"
              active={isActive("saved")}
              onClick={handleSavedClick}
              badge={savedCount}
            />
          )}

          {/* Search */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="h-9 w-9 rounded-lg group"
              >
                <Search className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              Search (&#8984;K)
            </TooltipContent>
          </Tooltip>

          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 rounded-lg group"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-muted-foreground group-hover:text-foreground" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-muted-foreground group-hover:text-foreground" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </TooltipContent>
          </Tooltip>

          {/* User / Login */}
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full p-0 ml-1 ring-offset-2 ring-offset-background hover:ring-2 hover:ring-amber-200 dark:hover:ring-amber-800 transition-all duration-200"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-amber-200 dark:ring-amber-800">
                    <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold">
                      {session.user.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
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
                <DropdownMenuItem
                  onClick={handleSavedClick}
                  className="gap-2.5"
                >
                  <Bookmark className="h-4 w-4" />
                  Saved Questions
                  {savedCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-auto text-[10px] font-bold px-1.5 h-5 min-w-5"
                    >
                      {savedCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleAnalyticsClick}
                  className="gap-2.5"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="gap-2.5 text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm shadow-amber-500/20 h-9 px-4 rounded-lg font-medium ml-1.5 transition-all duration-200 hover:shadow-md hover:shadow-amber-500/25"
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