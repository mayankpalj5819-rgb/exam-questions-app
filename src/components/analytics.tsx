"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  ArrowLeft,
  Atom,
  FlaskConical,
  Calculator,
  TrendingUp,
  BookOpen,
  CalendarRange,
  GraduationCap,
  PieChart,
  Layers,
} from "lucide-react";
import { useAppState } from "@/hooks/use-app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Standard JEE Weightage Data (equal per subject) ─────────────────────

interface ChapterWeight {
  chapter: string;
  weightage: number; // percentage
}

// JEE Main standard weightage per chapter (from official JEE pattern)
// Each subject is roughly equal at ~33.3%
const JEE_MAIN_WEIGHTAGE: Record<string, ChapterWeight[]> = {
  physics: [
    { chapter: "Mechanics", weightage: 9.5 },
    { chapter: "Electrodynamics", weightage: 7.0 },
    { chapter: "Waves & Thermodynamics", weightage: 5.5 },
    { chapter: "Optics", weightage: 3.5 },
    { chapter: "Modern Physics", weightage: 4.5 },
    { chapter: "Electromagnetic Induction", weightage: 2.0 },
    { chapter: "Units & Measurements", weightage: 1.3 },
  ],
  chemistry: [
    { chapter: "Organic Chemistry", weightage: 10.5 },
    { chapter: "Physical Chemistry", weightage: 9.0 },
    { chapter: "Inorganic Chemistry", weightage: 9.5 },
    { chapter: "Coordination Compounds", weightage: 2.0 },
    { chapter: "Environmental Chemistry", weightage: 1.0 },
    { chapter: "Chemistry in Everyday Life", weightage: 1.3 },
  ],
  mathematics: [
    { chapter: "Calculus", weightage: 11.0 },
    { chapter: "Algebra", weightage: 8.5 },
    { chapter: "Coordinate Geometry", weightage: 5.5 },
    { chapter: "Vectors & 3D", weightage: 3.5 },
    { chapter: "Trigonometry", weightage: 2.5 },
    { chapter: "Probability & Statistics", weightage: 2.3 },
  ],
};

const JEE_ADVANCED_WEIGHTAGE: Record<string, ChapterWeight[]> = {
  physics: [
    { chapter: "Mechanics", weightage: 10.0 },
    { chapter: "Electrodynamics", weightage: 7.0 },
    { chapter: "Waves & Thermodynamics", weightage: 5.5 },
    { chapter: "Optics & Modern Physics", weightage: 6.5 },
    { chapter: "Electromagnetic Induction", weightage: 3.0 },
    { chapter: "Fluid Mechanics", weightage: 1.5 },
  ],
  chemistry: [
    { chapter: "Organic Chemistry", weightage: 10.5 },
    { chapter: "Physical Chemistry", weightage: 8.5 },
    { chapter: "Inorganic Chemistry", weightage: 9.0 },
    { chapter: "Coordination Chemistry", weightage: 3.0 },
    { chapter: "Analytical Chemistry", weightage: 2.0 },
  ],
  mathematics: [
    { chapter: "Calculus", weightage: 11.0 },
    { chapter: "Algebra", weightage: 8.0 },
    { chapter: "Coordinate Geometry", weightage: 5.0 },
    { chapter: "Vectors & 3D", weightage: 4.0 },
    { chapter: "Trigonometry", weightage: 2.5 },
    { chapter: "Probability", weightage: 2.5 },
  ],
};

// ─── Color mapping ─────────────────────────────────────────────────────────

const SUBJECT_COLORS: Record<string, { bg: string; text: string; bar: string; border: string; light: string; icon: React.ReactNode }> = {
  physics: {
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    bar: "bg-gradient-to-r from-orange-400 to-orange-500",
    border: "border-orange-500/20",
    light: "bg-orange-500/20",
    icon: <Atom className="h-4 w-4" />,
  },
  chemistry: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-gradient-to-r from-emerald-400 to-emerald-500",
    border: "border-emerald-500/20",
    light: "bg-emerald-500/20",
    icon: <FlaskConical className="h-4 w-4" />,
  },
  mathematics: {
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    bar: "bg-gradient-to-r from-violet-400 to-violet-500",
    border: "border-violet-500/20",
    light: "bg-violet-500/20",
    icon: <Calculator className="h-4 w-4" />,
  },
};

const SUBJECTS = ["physics", "chemistry", "mathematics"] as const;

function getWeightage(examType: string) {
  return examType === "jee-advanced" ? JEE_ADVANCED_WEIGHTAGE : JEE_MAIN_WEIGHTAGE;
}

// ─── Analytics Component ──────────────────────────────────────────────────

export function Analytics() {
  const { examType, setView } = useAppState();
  const [localExamType, setLocalExamType] = useState<string>(examType);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  // Sync local exam type when global changes
  useEffect(() => { setLocalExamType(examType); }, [examType]);

  const weightage = getWeightage(localExamType);

  // Subject overview cards (equal representation)
  const subjectOverview = SUBJECTS.map((slug) => {
    const colors = SUBJECT_COLORS[slug];
    const chapters = weightage[slug] || [];
    const totalWeightage = chapters.reduce((a, c) => a + c.weightage, 0);
    return { slug, name: slug.charAt(0).toUpperCase() + slug.slice(1), colors, chapters, totalWeightage };
  });

  // Filtered weightage by subject
  const filteredChapters = selectedSubject === "all"
    ? SUBJECTS.flatMap((slug) =>
        (weightage[slug] || []).map((ch) => ({
          ...ch,
          subject: slug,
        }))
      ).sort((a, b) => b.weightage - a.weightage)
    : (weightage[selectedSubject] || [])
        .map((ch) => ({ ...ch, subject: selectedSubject }))
        .sort((a, b) => b.weightage - a.weightage);

  const maxWeightage = Math.max(...filteredChapters.map((c) => c.weightage));

  // Year data (standardized - equal 30 questions per subject per year)
  const yearData = [];
  for (let y = 2019; y <= 2026; y++) {
    yearData.push({
      year: y,
      physics: 30,
      chemistry: 30,
      mathematics: 30,
      total: 90,
    });
  }

  const maxYearTotal = Math.max(...yearData.map((d) => d.total));

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="sticky top-14 z-10 glass-nav border-b border-border/60">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
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
                  <BarChart3 className="h-4 w-4 text-amber-500" />
                  JEE Analytics
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  Chapter weightage & exam pattern analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={localExamType}
                onValueChange={(v) => setLocalExamType(v)}
              >
                <SelectTrigger className="h-8 w-[140px] text-xs rounded-lg">
                  <GraduationCap className="h-3 w-3 mr-1 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jee-main">JEE Main</SelectItem>
                  <SelectItem value="jee-advanced">JEE Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-8">
        {/* ─── Subject Overview Cards ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subjectOverview.map((sub, i) => (
            <motion.div
              key={sub.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className={`overflow-hidden ${sub.colors.border} border shadow-premium hover:shadow-premium-lg transition-shadow duration-300`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex items-center justify-center w-9 h-9 rounded-xl ${sub.colors.bg} ${sub.colors.text}`}
                      >
                        {sub.colors.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{sub.name}</h3>
                        <p className="text-[11px] text-muted-foreground">
                          {sub.chapters.length} topics
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-black ${sub.colors.text}`}>
                        ~33
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        % weightage
                      </p>
                    </div>
                  </div>

                  {/* Mini bar chart */}
                  <div className="space-y-2">
                    {sub.chapters.slice(0, 4).map((ch, ci) => (
                      <div key={ci} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-28 truncate">
                          {ch.chapter}
                        </span>
                        <div className="flex-1 h-2.5 bg-muted/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(ch.weightage / 12) * 100}%` }}
                            transition={{ delay: 0.3 + ci * 0.05, duration: 0.5 }}
                            className={`h-full rounded-full ${sub.colors.bar}`}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground w-8 text-right tabular-nums">
                          {ch.weightage}%
                        </span>
                      </div>
                    ))}
                    {sub.chapters.length > 4 && (
                      <p className="text-[10px] text-muted-foreground/60 pl-[7.5rem]">
                        +{sub.chapters.length - 4} more topics
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ─── JEE Pattern Info ─── */}
        <Card className="shadow-premium">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChart className="h-4 w-4 text-amber-500" />
              {localExamType === "jee-main" ? "JEE Main" : "JEE Advanced"} Exam Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pattern table */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Paper Structure
                </h4>
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">
                          Subject
                        </th>
                        <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground">
                          Questions
                        </th>
                        <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground">
                          Marks
                        </th>
                        <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground">
                          Weightage
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Physics", questions: localExamType === "jee-main" ? 30 : 20, marks: localExamType === "jee-main" ? 100 : 70, color: SUBJECT_COLORS.physics },
                        { name: "Chemistry", questions: localExamType === "jee-main" ? 30 : 20, marks: localExamType === "jee-main" ? 100 : 70, color: SUBJECT_COLORS.chemistry },
                        { name: "Mathematics", questions: localExamType === "jee-main" ? 30 : 20, marks: localExamType === "jee-main" ? 100 : 70, color: SUBJECT_COLORS.mathematics },
                      ].map((row) => (
                        <tr key={row.name} className="border-t border-border/30">
                          <td className="px-4 py-2.5 font-medium flex items-center gap-2">
                            <span className={row.color.text}>{row.color.icon}</span>
                            {row.name}
                          </td>
                          <td className="text-center px-4 py-2.5 tabular-nums">
                            {row.questions}
                          </td>
                          <td className="text-center px-4 py-2.5 tabular-nums font-semibold">
                            {row.marks}
                          </td>
                          <td className="text-center px-4 py-2.5">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] font-semibold px-2 ${row.color.bg} ${row.color.text} border-0`}
                            >
                              33.3%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-border/50 bg-muted/30 font-bold">
                        <td className="px-4 py-2.5">Total</td>
                        <td className="text-center px-4 py-2.5 tabular-nums">
                          {localExamType === "jee-main" ? 90 : 60}
                        </td>
                        <td className="text-center px-4 py-2.5 tabular-nums">
                          {localExamType === "jee-main" ? 300 : 210}
                        </td>
                        <td className="text-center px-4 py-2.5 text-muted-foreground text-xs">
                          100%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Question type breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Question Types
                </h4>
                <div className="space-y-3">
                  {[
                    { type: "Multiple Choice (MCQ)", desc: "4 options, 1 correct", marks: localExamType === "jee-main" ? "+4 / -1" : "+3 / -1", count: localExamType === "jee-main" ? 20 : 10 },
                    { type: "Numerical Value", desc: "Enter numerical answer", marks: localExamType === "jee-main" ? "+4 / -1" : "+3 / 0", count: localExamType === "jee-main" ? 10 : 10 },
                    ...(localExamType === "jee-main" ? [{ type: "Multiple Select (MSQ)", desc: "One or more correct", marks: "+4 / -1 (partial)", count: 0 }] : []),
                    ...(localExamType === "jee-advanced" ? [
                      { type: "Multiple Correct (MCQ)", desc: "One or more correct options", marks: "+4 / -1 (partial)", count: 10 },
                    ] : []),
                  ].map((q, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border/40 bg-muted/20">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{q.type}</p>
                        <p className="text-[11px] text-muted-foreground">{q.desc}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono font-semibold px-2 shrink-0">
                        {q.marks}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Chapter Weightage Breakdown ─── */}
        <Card className="shadow-premium">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                Chapter Weightage
              </CardTitle>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="h-8 w-[150px] text-xs rounded-lg">
                  <Layers className="h-3 w-3 mr-1 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredChapters.map((ch, i) => {
                const colors = SUBJECT_COLORS[ch.subject] || SUBJECT_COLORS.physics;
                const pct = (ch.weightage / maxWeightage) * 100;
                return (
                  <motion.div
                    key={`${ch.subject}-${ch.chapter}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="group flex items-center gap-3 py-1.5"
                  >
                    <div className="w-20 sm:w-28 shrink-0">
                      <span className={`text-[11px] font-semibold ${colors.text} flex items-center gap-1`}>
                        {colors.icon}
                        <span className="hidden sm:inline">{ch.subject.slice(0, 4)}</span>
                        <span className="sm:hidden">{ch.subject[0]}</span>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium truncate">
                          {ch.chapter}
                        </span>
                      </div>
                      <div className="mt-1 h-3 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.1 + i * 0.02, duration: 0.4 }}
                          className={`h-full rounded-full ${colors.bar}`}
                        />
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-bold tabular-nums px-2 shrink-0 ${colors.bg} ${colors.text} border-0`}
                    >
                      {ch.weightage}%
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ─── Year Distribution ─── */}
        <Card className="shadow-premium">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-amber-500" />
              Questions Per Year
              <Badge variant="secondary" className="text-[10px] font-medium ml-1">
                Equal Distribution
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {yearData.map((item, i) => {
                const pct = (item.total / maxYearTotal) * 100;
                return (
                  <motion.div
                    key={item.year}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 group/bar"
                  >
                    <span className="text-xs font-bold text-muted-foreground w-10 text-right tabular-nums shrink-0 group-hover/bar:text-foreground transition-colors">
                      {item.year}
                    </span>
                    <div className="flex-1 h-8 bg-muted/40 rounded-lg overflow-hidden relative flex">
                      {SUBJECTS.map((slug) => {
                        const colors = SUBJECT_COLORS[slug];
                        const width = (item[slug] / item.total) * 100;
                        return (
                          <motion.div
                            key={slug}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct * (width / 100)}%` }}
                            transition={{ delay: 0.2 + i * 0.03, duration: 0.5 }}
                            className={`h-full first:rounded-l-lg last:rounded-r-lg ${colors.bar} opacity-80`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[11px] font-semibold tabular-nums w-10 shrink-0 text-muted-foreground">
                      {item.total}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-4 text-xs">
              {SUBJECTS.map((slug) => {
                const colors = SUBJECT_COLORS[slug];
                return (
                  <div key={slug} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${colors.bar}`} />
                    <span className="text-muted-foreground capitalize">{slug}</span>
                  </div>
                );
              })}
              <span className="text-muted-foreground/50 ml-auto">
                {localExamType === "jee-main" ? "30" : "20"} Qs per subject per year
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ─── Important Topics ─── */}
        <Card className="shadow-premium">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-500" />
              High-Weightage Topics to Focus On
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SUBJECTS.map((slug) => {
                const colors = SUBJECT_COLORS[slug];
                const chapters = (weightage[slug] || []).sort((a, b) => b.weightage - a.weightage).slice(0, 5);
                return (
                  <div key={slug} className="space-y-2">
                    <div className={`flex items-center gap-2 mb-2 ${colors.text}`}>
                      {colors.icon}
                      <span className="text-xs font-bold capitalize">{slug}</span>
                    </div>
                    {chapters.map((ch, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/30 border border-border/30"
                      >
                        <span className="text-xs font-medium">{ch.chapter}</span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-bold px-1.5 ${colors.bg} ${colors.text} border-0`}
                        >
                          {ch.weightage}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}