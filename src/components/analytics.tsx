"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  ArrowLeft,
  BookOpen,
  Layers,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useAppState, type ExamType } from "@/hooks/use-app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubjectStat {
  name: string;
  slug: string;
  questionCount: number;
  chapterCount: number;
  avgPerChapter: number;
}

interface ChapterWeightage {
  subject: string;
  subjectSlug: string;
  chapter: string;
  chapterSlug: string;
  questionCount: number;
  percentage: number;
}

interface YearDistribution {
  year: number;
  physics: number;
  chemistry: number;
  mathematics: number;
  total: number;
}

interface QuestionTypeDistribution {
  subject: string;
  mcq: number;
  numerical: number;
}

interface AnalyticsData {
  subjectStats: SubjectStat[];
  chapterWeightage: ChapterWeightage[];
  yearDistribution: YearDistribution[];
  questionTypeDistribution: QuestionTypeDistribution[];
}

// ─── Color mapping ───────────────────────────────────────────────────────────

const SUBJECT_COLORS: Record<
  string,
  { bg: string; text: string; bar: string; border: string; light: string }
> = {
  physics: {
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    bar: "bg-orange-500",
    border: "border-orange-500/20",
    light: "bg-orange-500/20",
  },
  chemistry: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    border: "border-emerald-500/20",
    light: "bg-emerald-500/20",
  },
  mathematics: {
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    bar: "bg-violet-500",
    border: "border-violet-500/20",
    light: "bg-violet-500/20",
  },
};

function getSubjectColors(slug: string) {
  return (
    SUBJECT_COLORS[slug.toLowerCase()] || {
      bg: "bg-muted",
      text: "text-muted-foreground",
      bar: "bg-muted-foreground",
      border: "border-border",
      light: "bg-muted",
    }
  );
}

function getSubjectBarClass(slug: string) {
  const colors = getSubjectColors(slug);
  return colors.bar;
}

// ─── Animated counter hook ───────────────────────────────────────────────────

function useAnimatedCounter(target: number, duration: number = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    let cancelled = false;
    const increment = target / (duration / 16);
    // Use a single interval that handles all cases
    const timer = setInterval(() => {
      if (cancelled) return;
      if (target === 0) {
        setCount(0);
        clearInterval(timer);
        return;
      }
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [target, duration]);

  return count;
}

// ─── Animated number display ─────────────────────────────────────────────────

function AnimatedNumber({ value }: { value: number }) {
  const animated = useAnimatedCounter(value);
  return <>{animated.toLocaleString("en-IN")}</>;
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Subject cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>

      {/* Chapter weightage skeleton */}
      <Skeleton className="h-8 w-56" />
      <div className="rounded-xl border p-4">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40 flex-1" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>

      {/* Year distribution skeleton */}
      <Skeleton className="h-8 w-44" />
      <div className="rounded-xl border p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-6 flex-1 rounded" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>

      {/* Question type skeleton */}
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Subject overview card ───────────────────────────────────────────────────

function SubjectCard({
  stat,
  index,
}: {
  stat: SubjectStat;
  index: number;
}) {
  const colors = getSubjectColors(stat.slug);
  const Icon = stat.slug === "physics" ? TrendingUp : stat.slug === "chemistry" ? BookOpen : Layers;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className={`border ${colors.border} overflow-hidden`}>
        <div className={`h-1 ${colors.bar}`} />
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${colors.bg}`}>
              <Icon className={`h-5 w-5 ${colors.text}`} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{stat.name}</h3>
              <p className="text-xs text-muted-foreground">
                {stat.chapterCount} chapters
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-2xl font-bold tracking-tight">
                <AnimatedNumber value={stat.questionCount} />
              </p>
              <p className="text-xs text-muted-foreground">Total Questions</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                ~<AnimatedNumber value={stat.avgPerChapter} /> Q/chapter
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Chapter weightage table ─────────────────────────────────────────────────

type SortField = "chapter" | "questionCount" | "percentage";
type SortDir = "asc" | "desc";

function SortIcon({
  field,
  activeField,
  dir,
}: {
  field: SortField;
  activeField: SortField;
  dir: SortDir;
}) {
  if (activeField !== field) return <ChevronUp className="h-3 w-3 opacity-30" />;
  return dir === "asc" ? (
    <ChevronUp className="h-3 w-3" />
  ) : (
    <ChevronDown className="h-3 w-3" />
  );
}

function ChapterWeightageTable({
  chapters,
  subjectFilter,
}: {
  chapters: ChapterWeightage[];
  subjectFilter: string;
}) {
  const [sortField, setSortField] = useState<SortField>("percentage");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let list = subjectFilter === "all"
      ? chapters
      : chapters.filter((c) => c.subjectSlug === subjectFilter);
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === "chapter") cmp = a.chapter.localeCompare(b.chapter);
      else if (sortField === "questionCount") cmp = a.questionCount - b.questionCount;
      else cmp = a.percentage - b.percentage;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [chapters, subjectFilter, sortField, sortDir]);

  const maxPercentage = useMemo(
    () => Math.max(...chapters.map((c) => c.percentage), 1),
    [chapters]
  );

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Table header */}
      <div className="hidden md:grid md:grid-cols-[1fr_1.2fr_100px_100px_1fr] gap-2 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <button onClick={() => toggleSort("chapter")} className="flex items-center gap-1 hover:text-foreground transition-colors w-fit">
          Subject <SortIcon field="chapter" activeField={sortField} dir={sortDir} />
        </button>
        <button onClick={() => toggleSort("chapter")} className="flex items-center gap-1 hover:text-foreground transition-colors w-fit">
          Chapter <SortIcon field="chapter" activeField={sortField} dir={sortDir} />
        </button>
        <button onClick={() => toggleSort("questionCount")} className="flex items-center gap-1 hover:text-foreground transition-colors w-fit text-right justify-end">
          Questions <SortIcon field="questionCount" activeField={sortField} dir={sortDir} />
        </button>
        <button onClick={() => toggleSort("percentage")} className="flex items-center gap-1 hover:text-foreground transition-colors w-fit text-right justify-end">
          Weightage <SortIcon field="percentage" activeField={sortField} dir={sortDir} />
        </button>
        <span>Distribution</span>
      </div>

      {/* Mobile header - just column names */}
      <div className="md:hidden grid grid-cols-[1fr_80px] gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <span>Chapter</span>
        <span className="text-right">Weight</span>
      </div>

      {/* Rows */}
      <div className="max-h-96 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filtered.map((ch, i) => {
            const colors = getSubjectColors(ch.subjectSlug);
            const barWidth = (ch.percentage / maxPercentage) * 100;
            return (
              <motion.div
                key={`${ch.subjectSlug}-${ch.chapterSlug}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.5) }}
                className="group border-b last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                {/* Desktop row */}
                <div className="hidden md:grid md:grid-cols-[1fr_1.2fr_100px_100px_1fr] gap-2 px-4 py-3 items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${colors.bar}`}
                    />
                    <span className="text-muted-foreground text-xs">
                      {ch.subject}
                    </span>
                  </div>
                  <span className="font-medium truncate">{ch.chapter}</span>
                  <span className="text-right tabular-nums">
                    {ch.questionCount.toLocaleString("en-IN")}
                  </span>
                  <span className={`text-right font-medium tabular-nums ${colors.text}`}>
                    {ch.percentage}%
                  </span>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${colors.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.6, delay: Math.min(i * 0.02, 0.5) }}
                    />
                  </div>
                </div>

                {/* Mobile row */}
                <div className="md:hidden px-4 py-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${colors.bar}`}
                    />
                    <span className="font-medium text-sm truncate">{ch.chapter}</span>
                    <span className={`ml-auto text-xs font-semibold tabular-nums ${colors.text}`}>
                      {ch.percentage}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                    <span className="text-xs text-muted-foreground">
                      {ch.subject} &middot; {ch.questionCount} Q
                    </span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${colors.bar}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.6, delay: Math.min(i * 0.02, 0.5) }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No chapters found for this filter.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Year distribution chart ─────────────────────────────────────────────────

function YearDistributionChart({ data }: { data: YearDistribution[] }) {
  const maxTotal = useMemo(
    () => Math.max(...data.map((d) => d.total), 1),
    [data]
  );

  return (
    <div className="rounded-xl border p-4 md:p-6 space-y-3">
      {data.map((d, i) => (
        <motion.div
          key={d.year}
          className="flex items-center gap-3 md:gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <span className="text-sm font-medium tabular-nums w-12 md:w-14 text-right flex-shrink-0">
            {d.year}
          </span>
          <div className="flex-1 flex h-7 md:h-8 rounded-md overflow-hidden bg-muted">
            {d.physics > 0 && (
              <motion.div
                className="bg-orange-500 h-full flex items-center justify-center"
                initial={{ width: 0 }}
                animate={{
                  width: `${(d.physics / maxTotal) * 100}%`,
                }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
              >
                <span className="text-[10px] md:text-xs font-medium text-white px-1 truncate">
                  {d.physics}
                </span>
              </motion.div>
            )}
            {d.chemistry > 0 && (
              <motion.div
                className="bg-emerald-500 h-full flex items-center justify-center"
                initial={{ width: 0 }}
                animate={{
                  width: `${(d.chemistry / maxTotal) * 100}%`,
                }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
              >
                <span className="text-[10px] md:text-xs font-medium text-white px-1 truncate">
                  {d.chemistry}
                </span>
              </motion.div>
            )}
            {d.mathematics > 0 && (
              <motion.div
                className="bg-violet-500 h-full flex items-center justify-center"
                initial={{ width: 0 }}
                animate={{
                  width: `${(d.mathematics / maxTotal) * 100}%`,
                }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
              >
                <span className="text-[10px] md:text-xs font-medium text-white px-1 truncate">
                  {d.mathematics}
                </span>
              </motion.div>
            )}
          </div>
          <span className="text-sm font-semibold tabular-nums w-12 md:w-16 text-right flex-shrink-0">
            {d.total.toLocaleString("en-IN")}
          </span>
        </motion.div>
      ))}

      {data.length === 0 && (
        <div className="py-8 text-center text-muted-foreground text-sm">
          No year data available.
        </div>
      )}

      {/* Legend */}
      {data.length > 0 && (
        <div className="flex flex-wrap gap-4 pt-3 border-t mt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-3 h-3 rounded-sm bg-orange-500" />
            Physics
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            Chemistry
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-3 h-3 rounded-sm bg-violet-500" />
            Mathematics
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Question type breakdown card ────────────────────────────────────────────

function QuestionTypeCard({
  data,
  index,
}: {
  data: QuestionTypeDistribution;
  index: number;
}) {
  const total = data.mcq + data.numerical;
  const mcqPct = total > 0 ? ((data.mcq / total) * 100).toFixed(1) : "0";
  const numPct = total > 0 ? ((data.numerical / total) * 100).toFixed(1) : "0";

  const slugMap: Record<string, string> = {
    Physics: "physics",
    Chemistry: "chemistry",
    Mathematics: "mathematics",
  };
  const slug = slugMap[data.subject] || "";
  const colors = getSubjectColors(slug);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className={`border ${colors.border}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{data.subject}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stacked bar */}
          <div className="h-6 rounded-md overflow-hidden flex bg-muted">
            <motion.div
              className="h-full bg-orange-500 flex items-center justify-center"
              initial={{ width: 0 }}
              animate={{ width: `${mcqPct}%` }}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
            >
              <span className="text-[10px] font-bold text-white px-1">
                {mcqPct}%
              </span>
            </motion.div>
            <motion.div
              className="h-full bg-rose-400 flex items-center justify-center"
              initial={{ width: 0 }}
              animate={{ width: `${numPct}%` }}
              transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
            >
              <span className="text-[10px] font-bold text-white px-1">
                {numPct}%
              </span>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
                <span className="text-xs text-muted-foreground">MCQ</span>
              </div>
              <p className="text-lg font-bold tabular-nums">
                {data.mcq.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground">{mcqPct}%</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
                <span className="text-xs text-muted-foreground">Numerical</span>
              </div>
              <p className="text-lg font-bold tabular-nums">
                {data.numerical.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground">{numPct}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Analytics component ────────────────────────────────────────────────

export function Analytics() {
  const { examType, setExamType, setView } = useAppState();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?exam=${examType}`);
      if (!res.ok) {
        throw new Error("Failed to fetch analytics data");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [examType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset subject filter when exam type changes
  useEffect(() => {
    setSubjectFilter("all");
  }, [examType]);

  const handleExamChange = (value: string) => {
    setExamType(value as ExamType);
  };

  return (
    <div className="flex-1">
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView("landing")}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                JEE Analytics
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tabs
              value={examType}
              onValueChange={handleExamChange}
            >
              <TabsList className="h-9">
                <TabsTrigger value="jee-main" className="text-xs px-3">
                  JEE Main
                </TabsTrigger>
                <TabsTrigger value="jee-advanced" className="text-xs px-3">
                  JEE Advanced
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchData}
              disabled={loading}
              className="h-9 w-9"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </motion.div>

        {/* ── Content ────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {loading && !data && <AnalyticsSkeleton key="skeleton" />}

          {error && !loading && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-muted-foreground text-center">{error}</p>
              <Button variant="outline" onClick={fetchData}>
                Try Again
              </Button>
            </motion.div>
          )}

          {data && !loading && (
            <motion.div
              key={examType}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Subject Overview Cards */}
              {data.subjectStats.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4">
                    Subject Overview
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.subjectStats.map((stat, i) => (
                      <SubjectCard key={stat.slug} stat={stat} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {/* Chapter Weightage Table */}
              {data.chapterWeightage.length > 0 && (
                <section>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h2 className="text-lg font-semibold">
                      Chapter Weightage
                    </h2>
                    <Tabs
                      value={subjectFilter}
                      onValueChange={setSubjectFilter}
                    >
                      <TabsList className="h-8">
                        <TabsTrigger
                          value="all"
                          className="text-xs px-3 h-7"
                        >
                          All
                        </TabsTrigger>
                        <TabsTrigger
                          value="physics"
                          className="text-xs px-3 h-7"
                        >
                          Physics
                        </TabsTrigger>
                        <TabsTrigger
                          value="chemistry"
                          className="text-xs px-3 h-7"
                        >
                          Chemistry
                        </TabsTrigger>
                        <TabsTrigger
                          value="mathematics"
                          className="text-xs px-3 h-7"
                        >
                          Mathematics
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <ChapterWeightageTable
                    chapters={data.chapterWeightage}
                    subjectFilter={subjectFilter}
                  />
                </section>
              )}

              {/* Year Distribution */}
              {data.yearDistribution.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4">
                    Year-wise Distribution
                  </h2>
                  <YearDistributionChart data={data.yearDistribution} />
                </section>
              )}

              {/* Question Type Breakdown */}
              {data.questionTypeDistribution.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4">
                    Question Type Breakdown
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.questionTypeDistribution.map((qtd, i) => (
                      <QuestionTypeCard key={qtd.subject} data={qtd} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {/* Empty state when all sections are empty */}
              {data.subjectStats.length === 0 &&
                data.chapterWeightage.length === 0 &&
                data.yearDistribution.length === 0 &&
                data.questionTypeDistribution.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <BarChart3 className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground text-center">
                      No analytics data available for {examType.replace("-", " ").toUpperCase()}.
                    </p>
                  </div>
                )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}