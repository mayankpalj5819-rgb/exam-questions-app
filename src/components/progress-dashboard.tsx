"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  TrendingUp,
  Target,
  Flame,
  Trophy,
  ArrowLeft,
  CalendarDays,
  Atom,
  FlaskConical,
  Calculator,
  CheckCircle2,
  XCircle,
  LogIn,
  Activity,
  Clock,
} from "lucide-react";
import { useAppState, type ProgressData } from "@/hooks/use-app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ──────────────────────────────────────────────────────────────

interface StreakData {
  currentStreak: number;
  activity: Record<string, number>;
}

interface SubjectTotal {
  physics: number;
  chemistry: number;
  mathematics: number;
}

// ─── Subject Colors ─────────────────────────────────────────────────────

const SUBJECT_META: Record<string, { label: string; color: string; textColor: string; barColor: string; icon: React.ReactNode; bg: string }> = {
  physics: {
    label: "Physics",
    color: "text-orange-600 dark:text-orange-400",
    textColor: "text-orange-600 dark:text-orange-400",
    barColor: "bg-orange-500",
    bg: "bg-orange-500/10",
    icon: <Atom className="h-3.5 w-3.5" />,
  },
  chemistry: {
    label: "Chemistry",
    color: "text-emerald-600 dark:text-emerald-400",
    textColor: "text-emerald-600 dark:text-emerald-400",
    barColor: "bg-emerald-500",
    bg: "bg-emerald-500/10",
    icon: <FlaskConical className="h-3.5 w-3.5" />,
  },
  mathematics: {
    label: "Mathematics",
    color: "text-violet-600 dark:text-violet-400",
    textColor: "text-violet-600 dark:text-violet-400",
    barColor: "bg-violet-500",
    bg: "bg-violet-500/10",
    icon: <Calculator className="h-3.5 w-3.5" />,
  },
};

const TOTAL_QUESTIONS = 61991;

// ─── Helpers ────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function getHeatColor(count: number): string {
  if (count === 0) return "bg-muted/40 dark:bg-muted/20";
  if (count <= 3) return "bg-amber-200 dark:bg-amber-900/50";
  if (count <= 7) return "bg-amber-400 dark:bg-amber-700";
  return "bg-amber-600 dark:bg-amber-500";
}

// ─── Component ──────────────────────────────────────────────────────────

export function ProgressDashboard() {
  const { data: session, status } = useSession();
  const { setView, setAuthModalOpen } = useAppState();

  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [subjectTotals, setSubjectTotals] = useState<SubjectTotal>({ physics: 0, chemistry: 0, mathematics: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/progress");
      if (!res.ok) throw new Error("Failed to fetch progress");
      const data = await res.json();
      setProgress(data);
    } catch (err) {
      console.error("Progress fetch error:", err);
      setError("Failed to load progress data");
    }
  }, [session?.user?.id]);

  const fetchStreak = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/streak");
      if (!res.ok) throw new Error("Failed to fetch streak");
      const data = await res.json();
      setStreakData(data);
    } catch (err) {
      console.error("Streak fetch error:", err);
    }
  }, [session?.user?.id]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats/year-distribution");
      if (res.ok) {
        const data = await res.json();
        setSubjectTotals({
          physics: data.subjectCounts?.physics || 0,
          chemistry: data.subjectCounts?.chemistry || 0,
          mathematics: data.subjectCounts?.mathematics || 0,
        });
      }
    } catch {
      // fallback to 0
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }
    if (status === "authenticated") {
      setLoading(true);
      Promise.all([fetchProgress(), fetchStreak(), fetchStats()]).finally(() => setLoading(false));
    }
  }, [status, fetchProgress, fetchStreak, fetchStats]);

  // ─── Not logged in state ──────────────────────────────────────────────
  if (status === "unauthenticated" || (!session?.user && status !== "loading")) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-5 max-w-sm"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/30 text-amber-600 dark:text-amber-400 mx-auto">
            <Activity className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Progress Dashboard</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Track your accuracy, streaks, and subject-wise performance. Sign in to get started with your personalized analytics.
          </p>
          <Button
            onClick={() => setAuthModalOpen(true)}
            className="rounded-xl px-8 h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/20"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Login to Track Progress
          </Button>
        </motion.div>
      </div>
    );
  }

  // ─── Loading state ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1">
        <div className="sticky top-14 z-10 glass-nav border-b border-border/60">
          <div className="px-4 md:px-6 py-3 flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-60" />
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-52 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-3"
        >
          <p className="text-lg font-semibold">Something went wrong</p>
          <p className="text-sm text-muted-foreground">{error || "Could not load progress data"}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Try again</Button>
        </motion.div>
      </div>
    );
  }

  const p = progress;
  const overallPct = Math.round((p.totalAnswered / TOTAL_QUESTIONS) * 100 * 10) / 10;

  // Heatmap data for last 30 days
  const heatmapDays: { date: Date; count: number; dayLabel: string }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    heatmapDays.push({
      date: d,
      count: streakData?.activity?.[ds] || 0,
      dayLabel: dayNames[d.getDay()],
    });
  }

  const totalActivity30 = heatmapDays.reduce((a, d) => a + d.count, 0);

  // Recent answers (max 10)
  const recentAnswers = (p.recentAnswers || []).slice(0, 10);

  // ─── SVG Progress Ring ────────────────────────────────────────────────
  const ringSize = 180;
  const ringStroke = 10;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (overallPct / 100) * ringCircumference;

  return (
    <div className="flex-1">
      {/* ─── Header ─── */}
      <div className="sticky top-14 z-10 glass-nav border-b border-border/60">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("landing")}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 rounded-lg"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <div>
              <h1 className="text-base font-bold tracking-tight flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-500" />
                Your Progress
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Personal analytics & performance tracking
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* ─── Top Stats Row (4 cards) ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card className="shadow-premium hover:shadow-premium-lg transition-shadow duration-300">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                    <Target className="h-4 w-4" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl md:text-3xl font-black tabular-nums">{p.totalAnswered.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Questions Attempted</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="shadow-premium hover:shadow-premium-lg transition-shadow duration-300">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                    <Target className="h-4 w-4" />
                  </div>
                  {/* Circular accuracy indicator using conic-gradient */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: `conic-gradient(#f59e0b 0% ${p.accuracy}%, rgba(0,0,0,0.06) ${p.accuracy}% 100%)`,
                    }}
                  >
                    <div className="w-7 h-7 rounded-full bg-card flex items-center justify-center">
                      <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">{p.accuracy}%</span>
                    </div>
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-black tabular-nums">{p.accuracy}%</p>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Accuracy</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-premium hover:shadow-premium-lg transition-shadow duration-300">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                    <Flame className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-black tabular-nums flex items-baseline gap-1">
                  {p.currentStreak}
                  <span className="text-sm font-semibold text-muted-foreground">days</span>
                </p>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Current Streak</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="shadow-premium hover:shadow-premium-lg transition-shadow duration-300">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                    <Trophy className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-black tabular-nums flex items-baseline gap-1">
                  {p.longestStreak}
                  <span className="text-sm font-semibold text-muted-foreground">days</span>
                </p>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Longest Streak</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ─── Middle Row: Heatmap + Progress Ring ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
          {/* Activity Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <Card className="shadow-premium">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-amber-500" />
                  Activity (Last 30 Days)
                  <Badge variant="secondary" className="text-[10px] font-medium ml-auto">
                    {totalActivity30} questions
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {/* Day labels column + 30 day grid */}
                  <div className="inline-flex gap-0.5 min-w-full">
                    {/* We show Mon, Wed, Fri labels */}
                    <div className="flex flex-col justify-between py-0.5 pr-1.5 text-[10px] text-muted-foreground font-medium shrink-0 w-6">
                      <span className="h-[14px] leading-[14px] flex items-center" />
                      <span className="h-[14px] leading-[14px] flex items-center" />
                      <span className="h-[14px] leading-[14px] flex items-center">Mon</span>
                      <span className="h-[14px] leading-[14px] flex items-center" />
                      <span className="h-[14px] leading-[14px] flex items-center">Wed</span>
                      <span className="h-[14px] leading-[14px] flex items-center" />
                      <span className="h-[14px] leading-[14px] flex items-center">Fri</span>
                    </div>
                    <div className="flex gap-[3px] flex-1">
                      {heatmapDays.map((day, i) => {
                        const dayOfWeek = day.date.getDay();
                        // Show label placeholder rows for Mon(1), Wed(3), Fri(5)
                        const showLabel = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
                        return (
                          <div key={i} className="flex flex-col gap-[3px]">
                            {/* Render 7 rows to represent days of week, highlight the actual day */}
                            {Array.from({ length: 7 }).map((_, row) => {
                              const actualDayOfWeek = (i + row) % 7;
                              // The day we want to show
                              if (row === dayOfWeek) {
                                return (
                                  <motion.div
                                    key={row}
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.3 + i * 0.015 }}
                                    className={`w-[14px] h-[14px] rounded-[3px] ${getHeatColor(day.count)} cursor-default`}
                                    title={`${day.date.toLocaleDateString()}: ${day.count} questions`}
                                  />
                                );
                              }
                              return <div key={row} className="w-[14px] h-[14px]" />;
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-[2px] bg-muted/40 dark:bg-muted/20" />
                    <div className="w-3 h-3 rounded-[2px] bg-amber-200 dark:bg-amber-900/50" />
                    <div className="w-3 h-3 rounded-[2px] bg-amber-400 dark:bg-amber-700" />
                    <div className="w-3 h-3 rounded-[2px] bg-amber-600 dark:bg-amber-500" />
                  </div>
                  <span>More</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Overall Progress Ring */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-2"
          >
            <Card className="shadow-premium h-full">
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Overall Completion
                </p>
                <div className="relative">
                  <svg width={ringSize} height={ringSize} className="-rotate-90">
                    {/* Background circle */}
                    <circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={ringRadius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={ringStroke}
                      className="text-muted/30 dark:text-muted/15"
                    />
                    {/* Progress circle */}
                    <motion.circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={ringRadius}
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth={ringStroke}
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      initial={{ strokeDashoffset: ringCircumference }}
                      animate={{ strokeDashoffset: ringOffset }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black tabular-nums">{overallPct}%</span>
                    <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight mt-0.5">
                      {p.totalAnswered.toLocaleString()} of {TOTAL_QUESTIONS.toLocaleString()}
                      <br />
                      questions attempted
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ─── Subject-wise Breakdown ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-premium">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Atom className="h-4 w-4 text-amber-500" />
                Subject-wise Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["physics", "chemistry", "mathematics"].map((slug) => {
                  const meta = SUBJECT_META[slug];
                  const breakdown = p.subjectBreakdown?.find((s) => s.subject === slug);
                  const total = subjectTotals[slug as keyof SubjectTotal] || 0;
                  const attempted = breakdown?.total || 0;
                  const accuracy = breakdown?.accuracy || 0;
                  const chapters = breakdown?.chaptersAttempted || 0;
                  const progressPct = total > 0 ? Math.round((attempted / total) * 100) : 0;

                  return (
                    <motion.div
                      key={slug}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + ["physics", "chemistry", "mathematics"].indexOf(slug) * 0.06 }}
                      className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${meta.bg} ${meta.color}`}>
                            {meta.icon}
                          </div>
                          <span className="text-sm font-bold">{meta.label}</span>
                        </div>
                        <Badge variant="secondary" className={`text-[10px] font-bold px-2 ${meta.bg} ${meta.color} border-0`}>
                          {accuracy}%
                        </Badge>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-muted-foreground">
                            {attempted} / {total.toLocaleString()}
                          </span>
                          <span className="text-[11px] font-semibold tabular-nums">{progressPct}%</span>
                        </div>
                        <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.6, delay: 0.4 + ["physics", "chemistry", "mathematics"].indexOf(slug) * 0.06 }}
                            className={`h-full rounded-full ${meta.barColor}`}
                          />
                        </div>
                      </div>

                      {/* Mini stats */}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {attempted} attempted
                        </span>
                        <span className="flex items-center gap-1">
                          <FlaskConical className="h-3 w-3" />
                          {chapters} chapters
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Recent Activity Feed ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-premium">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Recent Activity
                <Badge variant="secondary" className="text-[10px] font-medium ml-auto">
                  Last {recentAnswers.length} answers
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentAnswers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm">No activity yet</p>
                  <p className="text-[11px] mt-1">Start answering questions to see your activity here</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {recentAnswers.map((answer, i) => {
                    const subjectMeta = answer.subject
                      ? SUBJECT_META[answer.subject.toLowerCase()]
                      : null;
                    return (
                      <motion.div
                        key={answer.id || i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + i * 0.03 }}
                        className="flex items-start gap-3 p-3 rounded-xl border border-border/30 bg-muted/15 hover:bg-muted/30 transition-colors"
                      >
                        {/* Correct/incorrect icon */}
                        <div className={`shrink-0 mt-0.5 ${answer.isCorrect ? "text-emerald-500" : "text-red-500"}`}>
                          {answer.isCorrect ? (
                            <CheckCircle2 className="h-4.5 w-4.5" />
                          ) : (
                            <XCircle className="h-4.5 w-4.5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium leading-relaxed line-clamp-2">
                            {answer.questionText || "Question text not available"}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {subjectMeta && (
                              <Badge variant="secondary" className={`text-[9px] font-semibold px-1.5 py-0 ${subjectMeta.bg} ${subjectMeta.color} border-0`}>
                                {subjectMeta.label}
                              </Badge>
                            )}
                            {answer.chapter && (
                              <span className="text-[10px] text-muted-foreground">{answer.chapter}</span>
                            )}
                            {answer.year && (
                              <span className="text-[10px] text-muted-foreground">{answer.year}</span>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                          {timeAgo(answer.createdAt)}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}