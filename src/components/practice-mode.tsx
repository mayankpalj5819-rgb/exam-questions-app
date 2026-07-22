"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useAppState, type QuestionData, type SubjectData } from "@/hooks/use-app-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MathText, extractImagesFromHtml } from "@/components/math-text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  ArrowLeft,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  SkipForward,
  RotateCcw,
  Home,
  Trophy,
  BookOpen,
  Flame,
  ChevronRight,
  Hash,
  Sparkles,
  Send,
  ZoomIn,
  Loader2,
  AlertCircle,
  X,
  FlaskConical,
  GraduationCap,
  Calculator,
  Pencil,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ──────────────────────────────────────────────────────────────

const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;
const OPTION_COLORS = [
  { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800/60" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800/60" },
  { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800/60" },
  { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800/60" },
  { bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800/60" },
];

const NUM_QUESTIONS_OPTIONS = [5, 10, 15, 20, 30];
const TIMER_OPTIONS = [
  { value: "0", label: "Off" },
  { value: "300", label: "5 min" },
  { value: "600", label: "10 min" },
  { value: "900", label: "15 min" },
  { value: "1800", label: "30 min" },
];

type QuestionType = "MCQ" | "Numerical" | "all";
type PracticePhase = "setup" | "quiz" | "results";

interface QuestionResult {
  questionId: string;
  userAnswer: string | null;
  isCorrect: boolean | null;
  isSkipped: boolean;
  timeTaken: number;
  question: QuestionData;
}

// ─── Helpers (reused from question-card) ────────────────────────────────────

function normalizeText(text: string): string {
  return text.replace(/\\n/g, "\n");
}

function detectQuestionType(question: QuestionData): "MCQ" | "Numerical" {
  if (question.questionType === "MCQ" || question.questionType === "Numerical") {
    return question.questionType;
  }
  const text = question.questionText + " " + (question.questionHtml || "");
  if (/\(A\)/.test(text) && /\(B\)/.test(text)) return "MCQ";
  return "Numerical";
}

function isAssertionReason(text: string): boolean {
  return /(?:Statement[\s-]?[I1]|Assertion|Reason)\s*[:\-]/i.test(text) &&
    /(?:Statement[\s-]?[I1Ii]+|Assertion|Reason)\s*[:\-]/i.test(text) &&
    /(?:In the light of (?:the )?above|choose the correct (?:answer|option) (?:from the options given below|from|given below)|choose the most appropriate)/i.test(text);
}

function getAROptions(text: string): string[] {
  if (/Assertion\s*\(?A?\)?/i.test(text) && /Reason\s*\(?R?\)?/i.test(text)) {
    return [
      "Both (A) and (R) are true and (R) is the correct explanation of (A)",
      "Both (A) and (R) are true but (R) is NOT the correct explanation of (A)",
      "(A) is true but (R) is false",
      "(A) is false but (R) is true",
    ];
  }
  return [
    "Both Statement I and Statement II are correct and Statement II is the correct explanation of Statement I",
    "Both Statement I and Statement II are correct but Statement II is NOT the correct explanation of Statement I",
    "Statement I is correct but Statement II is incorrect",
    "Statement I is incorrect but Statement II is correct",
  ];
}

function extractInlineOptions(normalizedText: string): string[] {
  const parenRegex = /\(([A-E])\)\s*([\s\S]*?)(?=\(([A-E])\)|$)/g;
  const parenExtracted: string[] = [];
  let match;
  while ((match = parenRegex.exec(normalizedText)) !== null) {
    let optText = match[2].trim();
    if (optText.length > 500) optText = optText.slice(0, 500) + "…";
    parenExtracted.push(optText);
  }
  if (parenExtracted.length >= 2) return parenExtracted;

  const dotRegex = /^[A-E]\.\s+([\s\S]*?)(?=\n[A-E]\.\s|$)/gm;
  const dotExtracted: string[] = [];
  while ((match = dotRegex.exec(normalizedText)) !== null) {
    let optText = match[1].trim();
    if (optText.length > 500) optText = optText.slice(0, 500) + "…";
    dotExtracted.push(optText);
  }
  if (dotExtracted.length >= 2) return dotExtracted;

  const firstOptMatch = normalizedText.match(/[\s:]\s*([A-E])\.\s/);
  if (firstOptMatch && firstOptMatch.index !== undefined) {
    const letterStart = normalizedText.indexOf(firstOptMatch[1] + ".", firstOptMatch.index);
    const optSection = normalizedText.slice(letterStart).replace(/\s*Choose the correct.*$/is, "").trim();
    const segments = optSection.split(/(?<=\.)\s+(?=[A-E]\.\s)/);
    const inlineExtracted: string[] = [];
    for (const seg of segments) {
      const m = seg.match(/^([A-E])\.\s+([\s\S]*)/);
      if (m) {
        let optText = m[2].trim();
        if (optText.length > 2 && optText.length <= 500) {
          inlineExtracted.push(optText);
        }
      }
    }
    if (inlineExtracted.length >= 2) return inlineExtracted;
  }

  return [];
}

function cleanQuestionText(text: string): string {
  return text
    .replace(/\s*(?:Choose the correct (?:answer|option)[s]?.*|Select the correct (?:answer|option)[s]?.*)$/is, "")
    .replace(/\s*ElectricalCircuit\s*Components$/i, "")
    .replace(/\s+([A-Z][a-z]+[A-Z][a-zA-Z]+)$/m, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseImageUrls(question: QuestionData): string[] {
  const urls: string[] = [];
  if (question.imageUrl) urls.push(question.imageUrl);
  if (question.imageUrls) {
    try {
      const parsed = JSON.parse(question.imageUrls);
      if (Array.isArray(parsed)) urls.push(...parsed);
    } catch { /* ignore */ }
  }
  if (question.questionHtml) {
    const { imageUrls } = extractImagesFromHtml(question.questionHtml);
    urls.push(...imageUrls);
  }
  return [...new Set(urls)];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function getSubjectIcon(slug: string) {
  if (slug?.includes("physics")) return FlaskConical;
  if (slug?.includes("chem")) return GraduationCap;
  if (slug?.includes("math")) return Calculator;
  return BookOpen;
}

// ─── Confetti Component ─────────────────────────────────────────────────────

function Confetti() {
  const colors = ["#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#f97316", "#06b6d4"];
  const pieces = useMemo(() =>
    Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece absolute"
          style={{
            left: `${p.left}%`,
            top: "-20px",
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}

// ─── Setup Screen ───────────────────────────────────────────────────────────

function SetupScreen({
  onStart,
  onBack,
}: {
  onStart: (settings: {
    subject: string;
    chapter: string;
    numQuestions: number;
    questionType: QuestionType;
    timerSeconds: number;
  }) => void;
  onBack: () => void;
}) {
  const { subjects } = useAppState();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [questionType, setQuestionType] = useState<QuestionType>("all");
  const [timerValue, setTimerValue] = useState("0");
  const [loading, setLoading] = useState(false);

  const currentSubjectData = useMemo(
    () => subjects.find((s) => s.slug === selectedSubject) || null,
    [subjects, selectedSubject]
  );

  const chapters = useMemo(
    () => currentSubjectData?.chapters || [],
    [currentSubjectData]
  );

  const handleStart = async () => {
    setLoading(true);
    try {
      await onStart({
        subject: selectedSubject,
        chapter: selectedChapter,
        numQuestions,
        questionType,
        timerSeconds: parseInt(timerValue),
      });
    } finally {
      setLoading(false);
    }
  };

  const subjectCards: { slug: string; name: string; icon: typeof FlaskConical; color: string; bg: string; darkBg: string }[] = [
    { slug: "physics", name: "Physics", icon: FlaskConical, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60", darkBg: "" },
    { slug: "chemistry", name: "Chemistry", icon: GraduationCap, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60", darkBg: "" },
    { slug: "mathematics", name: "Mathematics", icon: Calculator, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/60", darkBg: "" },
  ];

  const canStart = selectedSubject !== "" && !loading;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-start justify-center p-4 md:p-8 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl py-8"
      >
        {/* Back button */}
        <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }} className="mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 rounded-lg">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </motion.div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/30 text-amber-600 dark:text-amber-400 mb-4 shadow-sm">
            <Target className="h-7 w-7" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Practice Mode</h1>
          <p className="text-sm text-muted-foreground mt-2">Configure your practice session and test your skills</p>
        </div>

        {/* Subject selector */}
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3">Choose Subject</p>
          <div className="grid grid-cols-4 gap-2">
            {subjectCards.map((s) => {
              const Icon = s.icon;
              const isSelected = selectedSubject === s.slug;
              return (
                <motion.button
                  key={s.slug}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedSubject(isSelected ? "" : s.slug);
                    setSelectedChapter("");
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl border-2 transition-all cursor-pointer",
                    isSelected
                      ? `${s.bg} shadow-md`
                      : "border-border/60 bg-card hover:border-foreground/20 hover:bg-muted/30"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isSelected ? s.color : "text-muted-foreground")} />
                  <span className={cn("text-xs font-semibold", isSelected ? s.color : "text-muted-foreground")}>
                    {s.name}
                  </span>
                </motion.button>
              );
            })}
            {/* All Subjects */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedSubject(selectedSubject === "all" ? "" : "all");
                setSelectedChapter("");
              }}
              className={cn(
                "flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl border-2 transition-all cursor-pointer",
                selectedSubject === "all"
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 shadow-md"
                  : "border-border/60 bg-card hover:border-foreground/20 hover:bg-muted/30"
              )}
            >
              <BookOpen className={cn("h-5 w-5", selectedSubject === "all" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")} />
              <span className={cn("text-xs font-semibold", selectedSubject === "all" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                All
              </span>
            </motion.button>
          </div>
        </div>

        {/* Chapter selector */}
        {selectedSubject && selectedSubject !== "all" && chapters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <p className="text-sm font-semibold mb-3">Chapter (optional)</p>
            <Select value={selectedChapter} onValueChange={setSelectedChapter}>
              <SelectTrigger className="rounded-xl h-10">
                <SelectValue placeholder="All Chapters" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all">All Chapters</SelectItem>
                {chapters.map((ch) => (
                  <SelectItem key={ch.id} value={ch.id}>
                    <span className="flex items-center justify-between gap-4 w-full">
                      <span className="truncate">{ch.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{ch.questionCount}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}

        {/* Number of questions */}
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3">Number of Questions</p>
          <div className="flex flex-wrap gap-2">
            {NUM_QUESTIONS_OPTIONS.map((n) => (
              <motion.button
                key={n}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setNumQuestions(n)}
                className={cn(
                  "h-10 min-w-[52px] px-4 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer",
                  numQuestions === n
                    ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-600"
                    : "border-border/60 bg-card text-muted-foreground hover:border-foreground/20"
                )}
              >
                {n}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Question type */}
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3">Question Type</p>
          <div className="flex flex-wrap gap-2">
            {([
              { value: "all" as QuestionType, label: "All Types", icon: BookOpen },
              { value: "MCQ" as QuestionType, label: "MCQ Only", icon: Sparkles },
              { value: "Numerical" as QuestionType, label: "Numerical Only", icon: Hash },
            ]).map((t) => {
              const Icon = t.icon;
              const isSelected = questionType === t.value;
              return (
                <motion.button
                  key={t.value}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setQuestionType(t.value)}
                  className={cn(
                    "flex items-center gap-2 h-10 px-4 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer",
                    isSelected
                      ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-600"
                      : "border-border/60 bg-card text-muted-foreground hover:border-foreground/20"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Timer */}
        <div className="mb-8">
          <p className="text-sm font-semibold mb-3">Timer</p>
          <div className="flex flex-wrap gap-2">
            {TIMER_OPTIONS.map((t) => (
              <motion.button
                key={t.value}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setTimerValue(t.value)}
                className={cn(
                  "flex items-center gap-2 h-10 px-4 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer",
                  timerValue === t.value
                    ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-600"
                    : "border-border/60 bg-card text-muted-foreground hover:border-foreground/20"
                )}
              >
                <Clock className="h-4 w-4" />
                {t.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button
            onClick={handleStart}
            disabled={!canStart}
            size="lg"
            className={cn(
              "w-full h-12 rounded-xl text-base font-bold shadow-lg transition-all",
              canStart
                ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/25 hover:shadow-amber-500/40"
                : "bg-muted text-muted-foreground"
            )}
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading Questions...</>
            ) : (
              <><Play className="h-5 w-5 mr-2" /> Start Practice</>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Quiz Question Card (embedded in practice mode) ─────────────────────────

interface QuizQuestionProps {
  question: QuestionData;
  questionNumber: number;
  answerState: "idle" | "correct" | "incorrect";
  selectedOption: string | null;
  numericalInput: string;
  onSelectOption: (letter: string) => void;
  onNumericalChange: (val: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  onNext: () => void;
  isLastQuestion: boolean;
}

function QuizQuestionCard({
  question,
  questionNumber,
  answerState,
  selectedOption,
  numericalInput,
  onSelectOption,
  onNumericalChange,
  onSubmit,
  onSkip,
  onNext,
  isLastQuestion,
}: QuizQuestionProps) {
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const normalizedRawText = normalizeText(question.questionText || "");
  const detectedType = detectQuestionType(question);
  const isNumerical = detectedType === "Numerical";
  const isAR = isAssertionReason(normalizedRawText);
  const imageUrls = parseImageUrls(question);
  const hasAttempted = answerState !== "idle";

  const cleanText = cleanQuestionText(normalizedRawText);

  const displayText = useMemo(() => {
    let text = cleanText;
    if (isAR) {
      text = text.replace(/\s*(?:In the light of the above statements?,?\s*choose the correct answer from the options given below\.?|choose the most appropriate answer.*?from the options given below\.?)/gi, "").trim();
    }
    return text;
  }, [cleanText, isAR]);

  const parsedOptions = useMemo(() => {
    if (question.options && question.options !== "undefined" && question.options !== "null") {
      try {
        const opts = JSON.parse(question.options);
        if (Array.isArray(opts) && opts.length >= 2) return opts;
      } catch { /* ignore */ }
    }
    if (!isNumerical && normalizedRawText) {
      const extracted = extractInlineOptions(normalizedRawText);
      if (extracted.length >= 2) return extracted;
      if (isAR) return getAROptions(normalizedRawText);
    }
    return [];
  }, [question.options, normalizedRawText, isNumerical, isAR]);

  const hasInlineOptions = parsedOptions.length > 0;

  const optionFormat = useMemo(() => {
    if (!normalizedRawText) return "none";
    if (/\([A-E]\)/.test(normalizedRawText)) return "paren";
    const lines = normalizedRawText.split(/\n/);
    let dotCount = 0;
    for (const line of lines) { if (/^[A-E]\.\s/.test(line.trim())) dotCount++; }
    return dotCount >= 2 ? "dot" : "none";
  }, [normalizedRawText]);

  const finalDisplayText = useMemo(() => {
    if (isAR || !hasInlineOptions) return displayText;
    if (optionFormat === "paren") return displayText.replace(/\s*\([A-E]\)[\s\S]*$/g, "").replace(/\n{2,}/g, "\n").trim();
    if (optionFormat === "dot") return displayText.replace(/\n[A-E]\.\s[\s\S]*$/g, "").replace(/\n{2,}/g, "\n").trim();
    const inlineMatch = displayText.match(/[\s:]\s*[A-E]\.\s/);
    if (inlineMatch && inlineMatch.index !== undefined && inlineMatch.index > 0) {
      return displayText.slice(0, inlineMatch.index).replace(/\s*Choose the correct.*$/is, "").trim();
    }
    return displayText;
  }, [displayText, hasInlineOptions, optionFormat, isAR]);

  const correctLetter = useMemo(() => {
    if (isNumerical || !question.correctAnswer) return null;
    const ans = question.correctAnswer.trim().toUpperCase();
    if (/^[A-E]$/.test(ans)) return ans;
    for (let i = 0; i < parsedOptions.length; i++) {
      if (ans === parsedOptions[i].trim()) return String.fromCharCode(65 + i);
    }
    return null;
  }, [isNumerical, question.correctAnswer, parsedOptions]);

  const solutionContent = question.solution || question.solutionHtml || null;

  return (
    <>
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.25 }}
        className={cn(
          "rounded-2xl border bg-card overflow-hidden shadow-premium-lg",
          hasAttempted
            ? answerState === "correct"
              ? "border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200/50 dark:ring-emerald-800/30"
              : "border-red-300 dark:border-red-700 ring-1 ring-red-200/50 dark:ring-red-800/30"
            : "border-border/60"
        )}
      >
        {/* Question header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center justify-center h-8 min-w-8 px-2.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs font-extrabold shadow-sm"
            >
              Q.{questionNumber}
            </motion.span>
            {question.year && (
              <Badge variant="outline" className="text-[11px] border-border/50 font-medium px-2">
                {question.year}
              </Badge>
            )}
            <Badge className={cn(
              "gap-1 text-[11px] font-semibold border-0",
              isNumerical ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
            )}>
              {isNumerical ? <Hash className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
              {detectedType}
            </Badge>
            {question.chapter && (
              <Badge variant="secondary" className="text-[10px] font-medium bg-muted/60 text-muted-foreground rounded-md px-2 hidden sm:inline-flex">
                {question.chapter.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Question body */}
        <div className="px-5 pb-4">
          <div className="text-sm leading-7">
            <MathText text={finalDisplayText} />
          </div>

          {/* Images */}
          {imageUrls.length > 0 && (
            <div className="mt-4 space-y-2">
              {imageUrls.map((url, i) => (
                <motion.div
                  key={`${url}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative group/img cursor-pointer rounded-xl overflow-hidden border border-border/40"
                  onClick={() => setZoomImage(url)}
                >
                  <img src={url} alt={`Question ${questionNumber} figure`} className="w-full h-auto max-h-64 object-contain bg-muted/30" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover/img:opacity-80 transition-opacity drop-shadow-lg" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* MCQ Options with inline text */}
          {!isNumerical && hasInlineOptions && (
            <div className="mt-5 space-y-2.5">
              {parsedOptions.map((option: string, i: number) => {
                const letter = OPTION_LETTERS[i];
                const isThisCorrect = correctLetter === letter;
                const isSelected = selectedOption === letter;
                const colors = OPTION_COLORS[i] || OPTION_COLORS[0];

                if (hasAttempted) {
                  return (
                    <motion.div
                      key={letter}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200",
                        isThisCorrect
                          ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm shadow-emerald-500/15"
                          : isSelected
                            ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20"
                            : `${colors.border} ${colors.bg} opacity-60`
                      )}
                    >
                      <span className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5",
                        isThisCorrect ? "bg-emerald-500 text-white shadow-sm"
                          : isSelected ? "bg-red-500 text-white"
                          : `${colors.bg} ${colors.text} border ${colors.border}`
                      )}>
                        {letter}
                      </span>
                      <div className="flex-1 min-w-0 leading-relaxed">
                        <MathText text={option} />
                      </div>
                      {isThisCorrect && <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />}
                      {isSelected && !isThisCorrect && <XCircle className="h-[18px] w-[18px] shrink-0 text-red-500 dark:text-red-400 mt-0.5" />}
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={letter}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => onSelectOption(letter)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200 cursor-pointer hover:shadow-md active:scale-[0.99]",
                      isSelected
                        ? "border-foreground/30 bg-foreground/5 shadow-sm ring-2 ring-foreground/10"
                        : `${colors.border} ${colors.bg} hover:border-foreground/20`
                    )}
                  >
                    <span className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold mt-0.5 transition-all",
                      isSelected ? "bg-foreground text-background" : `${colors.bg} ${colors.text} border ${colors.border}`
                    )}>
                      {letter}
                    </span>
                    <div className="flex-1 min-w-0 leading-relaxed">
                      <MathText text={option} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Generic MCQ letter buttons (no inline options) */}
          {!isNumerical && !hasInlineOptions && (
            <div className="mt-5">
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3" />
                Options not available in text — select the correct letter
              </p>
              <div className="flex flex-wrap gap-2">
                {(OPTION_LETTERS.slice(0, 4) as readonly ["A", "B", "C", "D"]).map((letter) => {
                  const isThisCorrect = correctLetter === letter;
                  const isSelected = selectedOption === letter;

                  if (hasAttempted) {
                    return (
                      <motion.button
                        key={letter}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        disabled
                        className={cn(
                          "inline-flex items-center justify-center h-10 min-w-10 px-3.5 rounded-xl border-2 text-sm font-bold transition-all",
                          isThisCorrect
                            ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                            : isSelected ? "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                            : "border-border bg-muted/50 text-muted-foreground/40"
                        )}
                      >
                        {letter}
                        {isThisCorrect && <CheckCircle2 className="h-3.5 w-3.5 ml-1.5" />}
                        {isSelected && !isThisCorrect && <XCircle className="h-3.5 w-3.5 ml-1.5" />}
                      </motion.button>
                    );
                  }
                  return (
                    <motion.button
                      key={letter}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onSelectOption(letter)}
                      className={cn(
                        "inline-flex items-center justify-center h-10 min-w-10 px-3.5 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer",
                        isSelected ? "border-foreground bg-foreground text-background shadow-md"
                          : "border-border bg-card text-foreground hover:border-foreground/30 hover:shadow-sm"
                      )}
                    >
                      {letter}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Numerical Input */}
          {isNumerical && (
            <div className="mt-5">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="any"
                  placeholder="Enter your answer"
                  value={numericalInput}
                  onChange={(e) => onNumericalChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
                  disabled={hasAttempted}
                  className={cn(
                    "h-11 text-sm font-medium",
                    hasAttempted && answerState === "correct" && "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20",
                    hasAttempted && answerState === "incorrect" && "border-red-400 bg-red-50 dark:bg-red-950/20"
                  )}
                />
                {!hasAttempted && (
                  <Button onClick={onSubmit} disabled={!numericalInput.trim()} size="icon" className="h-11 w-11 shrink-0 rounded-xl">
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Submit Button for MCQ */}
          {!isNumerical && !hasAttempted && (
            <div className="mt-4">
              <Button onClick={onSubmit} disabled={!selectedOption} className="w-full h-10 rounded-xl font-semibold text-sm">
                <Send className="h-4 w-4 mr-2" />
                Submit Answer
              </Button>
            </div>
          )}

          {/* Answer Feedback */}
          <AnimatePresence>
            {hasAttempted && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{
                  opacity: 1, y: 0, scale: 1,
                  ...(answerState === "correct" ? { transition: { type: "spring", stiffness: 300, damping: 20 } } : {}),
                }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-4"
              >
                <div className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
                  answerState === "correct"
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300"
                )}>
                  {answerState === "correct" ? (
                    <><CheckCircle2 className="h-5 w-5" /> Correct!</>
                  ) : (
                    <><XCircle className="h-5 w-5" /> Incorrect</>
                  )}
                </div>

                {/* Show correct answer when wrong */}
                {answerState === "incorrect" && question.correctAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/80 dark:bg-emerald-950/10 px-4 py-3"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium text-muted-foreground">Correct Answer:</span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      <MathText text={question.correctAnswer} />
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Solution */}
          <AnimatePresence>
            {hasAttempted && solutionContent && (
              <motion.div
                initial={{ opacity: 0, y: 8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-5 overflow-hidden"
              >
                <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 shadow-sm shadow-amber-500/5">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3">
                    Solution
                  </p>
                  <div className="text-sm leading-7">
                    <MathText text={solutionContent} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons after answer */}
          {hasAttempted && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 flex gap-2"
            >
              {!isLastQuestion && (
                <Button onClick={onNext} className="flex-1 h-10 rounded-xl font-semibold text-sm">
                  Next Question
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </motion.div>
          )}

          {/* Skip button */}
          {!hasAttempted && (
            <div className="mt-4">
              <Button variant="ghost" onClick={onSkip} className="w-full h-10 rounded-xl text-sm text-muted-foreground hover:text-foreground gap-2">
                <SkipForward className="h-4 w-4" />
                Skip this question
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Image Zoom */}
      {zoomImage && (
        <div className="image-zoom-overlay" onClick={() => setZoomImage(null)}>
          <div className="relative">
            <Button variant="ghost" size="icon" className="absolute -top-1 -right-1 z-10 h-8 w-8 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white" onClick={() => setZoomImage(null)}>
              <X className="h-4 w-4" />
            </Button>
            <img src={zoomImage} alt="Question image zoomed" className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </>
  );
}

// ─── Quiz Screen ────────────────────────────────────────────────────────────

function QuizScreen({
  questions,
  timerDuration,
  onFinish,
  onEnd,
}: {
  questions: QuestionData[];
  timerDuration: number;
  onFinish: (results: QuestionResult[]) => void;
  onEnd: () => void;
}) {
  const { data: session } = useSession();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [numericalInput, setNumericalInput] = useState("");
  const [answerState, setAnswerState] = useState<"idle" | "correct" | "incorrect">("idle");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [ended, setEnded] = useState(false);

  const currentQuestion = questions[currentIndex];
  const score = results.filter((r) => r.isCorrect).length;
  const attempted = results.filter((r) => !r.isSkipped).length;

  // Timer
  useEffect(() => {
    if (ended) return;
    const interval = setInterval(() => {
      setElapsedTime((prev) => {
        if (timerDuration > 0 && prev >= timerDuration) {
          setEnded(true);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerDuration, ended]);

  // Auto-finish when timer ends
  useEffect(() => {
    if (ended && results.length > 0) {
      const timer = setTimeout(() => {
        const finalResults = [...results];
        // Add current question as skipped if not yet recorded
        if (finalResults.length < questions.length) {
          for (let i = finalResults.length; i < questions.length; i++) {
            finalResults.push({
              questionId: questions[i].id,
              userAnswer: null,
              isCorrect: null,
              isSkipped: true,
              timeTaken: 0,
              question: questions[i],
            });
          }
        }
        onFinish(finalResults);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ended]);

  const recordAnswer = useCallback(async (questionId: string, userAnswer: string | null, isCorrect: boolean | null, timeTaken: number) => {
    if (session?.user) {
      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, userAnswer, isCorrect, timeTaken }),
        });
      } catch { /* silent */ }
    }
  }, [session]);

  const handleSubmit = useCallback(async () => {
    if (answerState !== "idle" || !currentQuestion) return;

    const q = currentQuestion;
    const isNumerical = detectQuestionType(q) === "Numerical";
    let isCorrect: boolean;
    let userAnswer: string | null;

    if (isNumerical) {
      userAnswer = numericalInput.trim();
      if (!userAnswer) { toast.error("Enter your answer first"); return; }
      const correctAns = (q.correctAnswer || "").trim();
      const normalizeNum = (s: string) => {
        const n = parseFloat(s);
        return isNaN(n) ? s : String(n);
      };
      isCorrect = normalizeNum(userAnswer) === normalizeNum(correctAns);
    } else {
      if (!selectedOption) { toast.error("Select an option first"); return; }
      userAnswer = selectedOption;
      const ans = q.correctAnswer?.trim().toUpperCase() || "";
      let correctLetter: string | null = null;
      if (/^[A-E]$/.test(ans)) {
        correctLetter = ans;
      }
      isCorrect = selectedOption === correctLetter;
    }

    setAnswerState(isCorrect ? "correct" : "incorrect");

    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);

    const result: QuestionResult = {
      questionId: q.id,
      userAnswer,
      isCorrect,
      isSkipped: false,
      timeTaken,
      question: q,
    };

    setResults((prev) => [...prev, result]);
    await recordAnswer(q.id, userAnswer, isCorrect, timeTaken);
  }, [answerState, currentQuestion, numericalInput, selectedOption, questionStartTime, recordAnswer]);

  const handleNext = useCallback(() => {
    if (currentIndex >= questions.length - 1) {
      // Quiz finished
      const finalResults = [...results];
      if (finalResults.length < questions.length) {
        for (let i = finalResults.length; i < questions.length; i++) {
          finalResults.push({
            questionId: questions[i].id,
            userAnswer: null,
            isCorrect: null,
            isSkipped: true,
            timeTaken: 0,
            question: questions[i],
          });
        }
      }
      onFinish(finalResults);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setNumericalInput("");
    setAnswerState("idle");
    setQuestionStartTime(Date.now());
  }, [currentIndex, questions, results, onFinish]);

  const handleSkip = useCallback(() => {
    if (answerState !== "idle") return;

    const result: QuestionResult = {
      questionId: currentQuestion.id,
      userAnswer: null,
      isCorrect: null,
      isSkipped: true,
      timeTaken: 0,
      question: currentQuestion,
    };
    setResults((prev) => [...prev, result]);

    if (currentIndex >= questions.length - 1) {
      onFinish([...results, result]);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setNumericalInput("");
    setAnswerState("idle");
    setQuestionStartTime(Date.now());
  }, [answerState, currentQuestion, currentIndex, questions, results, onFinish]);

  const onSelectOption = (letter: string) => {
    if (answerState !== "idle") return;
    setSelectedOption(letter);
  };

  // Keyboard shortcuts (after all handler declarations)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (ended) return;

      // 1-5 for options
      if (answerState === "idle") {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 5) {
          const letters = ["A", "B", "C", "D", "E"];
          onSelectOption(letters[num - 1]);
          return;
        }

        // Enter to submit
        if (e.key === "Enter") {
          handleSubmit();
          return;
        }

        // S for skip
        if (e.key === "s" || e.key === "S") {
          handleSkip();
          return;
        }
      }

      // N for next (only after answering)
      if ((e.key === "n" || e.key === "N") && answerState !== "idle" && currentIndex < questions.length - 1) {
        handleNext();
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [answerState, currentIndex, questions, ended, handleSubmit, handleNext, handleSkip]);

  // Timer display
  const timerDisplay = timerDuration > 0
    ? formatTime(Math.max(0, timerDuration - elapsedTime))
    : formatTime(elapsedTime);
  const timerWarning = timerDuration > 0 && (timerDuration - elapsedTime) < 60;
  const timerDanger = timerDuration > 0 && (timerDuration - elapsedTime) < 30;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Top bar */}
      <div className="sticky top-14 z-10 glass-nav border-b border-border/60">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left: progress */}
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="sm" onClick={onEnd} className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-7 px-2 rounded-lg shrink-0">
                <X className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">End</span>
              </Button>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Question <span className="font-bold text-foreground">{currentIndex + 1}</span> of <span className="font-bold text-foreground">{questions.length}</span>
                </p>
                <div className="w-32 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>

            {/* Center: timer */}
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-mono font-bold tabular-nums",
              timerDanger ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400"
                : timerWarning ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400"
                : "bg-muted/50 border-border/60 text-foreground"
            )}>
              <Clock className={cn("h-3.5 w-3.5", (timerWarning || timerDanger) && "animate-pulse")} />
              {timerDisplay}
            </div>

            {/* Right: score */}
            <div className="flex items-center gap-2 text-sm shrink-0">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-bold">{score}</span>
              </div>
              <span className="text-muted-foreground/40">/</span>
              <span className="font-bold text-muted-foreground">{attempted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-start justify-center overflow-y-auto p-4 md:p-8">
        <div className="w-full max-w-2xl py-4">
          <AnimatePresence mode="wait">
            <QuizQuestionCard
              key={currentQuestion.id}
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              answerState={answerState}
              selectedOption={selectedOption}
              numericalInput={numericalInput}
              onSelectOption={onSelectOption}
              onNumericalChange={setNumericalInput}
              onSubmit={handleSubmit}
              onSkip={handleSkip}
              onNext={handleNext}
              isLastQuestion={currentIndex >= questions.length - 1}
            />
          </AnimatePresence>

          {/* Keyboard shortcuts hint */}
          <div className="mt-6 text-center">
            <p className="text-[10px] text-muted-foreground/40">
              Shortcuts: 1-5 select option · Enter submit · N next · S skip
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Results Screen ─────────────────────────────────────────────────────────

function ResultsScreen({
  results,
  timeTaken,
  onReviewMistakes,
  onTryAgain,
  onHome,
}: {
  results: QuestionResult[];
  timeTaken: number;
  onReviewMistakes: (mistakes: QuestionResult[]) => void;
  onTryAgain: () => void;
  onHome: () => void;
}) {
  const correct = results.filter((r) => r.isCorrect === true).length;
  const incorrect = results.filter((r) => r.isCorrect === false).length;
  const skipped = results.filter((r) => r.isSkipped).length;
  const total = results.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const showConfetti = percentage > 80;

  // Subject breakdown
  const subjectBreakdown = useMemo(() => {
    const map: Record<string, { name: string; total: number; correct: number; incorrect: number }> = {};
    for (const r of results) {
      const slug = r.question.subject?.slug || "other";
      const name = r.question.subject?.name || "Other";
      if (!map[slug]) map[slug] = { name, total: 0, correct: 0, incorrect: 0 };
      map[slug].total++;
      if (r.isCorrect === true) map[slug].correct++;
      if (r.isCorrect === false) map[slug].incorrect++;
    }
    return Object.values(map);
  }, [results]);

  const mistakes = results.filter((r) => r.isCorrect === false);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-start justify-center overflow-y-auto">
      {showConfetti && <Confetti />}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl p-4 md:p-8 py-8"
      >
        {/* Score display */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
            className={cn(
              "inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-4 shadow-lg",
              percentage >= 80 ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30"
                : percentage >= 50 ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30"
                : "bg-gradient-to-br from-red-400 to-red-600 shadow-red-500/30"
            )}
          >
            <Trophy className="h-12 w-12 text-white" />
          </motion.div>

          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            {correct}/{total}
            <span className="text-lg text-muted-foreground ml-2">({percentage}%)</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            {percentage >= 80 ? "Excellent work! 🎉" : percentage >= 50 ? "Good effort, keep practicing!" : "Keep going, practice makes perfect!"}
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{correct}</div>
            <p className="text-xs text-muted-foreground mt-1">Correct</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500 dark:text-red-400">{incorrect}</div>
            <p className="text-xs text-muted-foreground mt-1">Incorrect</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{skipped}</div>
            <p className="text-xs text-muted-foreground mt-1">Skipped</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold">{formatTime(timeTaken)}</div>
            <p className="text-xs text-muted-foreground mt-1">Time Taken</p>
          </Card>
        </div>

        {/* Subject breakdown */}
        {subjectBreakdown.length > 1 && (
          <Card className="p-5 mb-6">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Subject Breakdown
            </h3>
            <div className="space-y-3">
              {subjectBreakdown.map((s) => {
                const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                return (
                  <div key={s.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground text-xs">{s.correct}/{s.total} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Accuracy visualization */}
        <Card className="p-5 mb-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500" />
            Performance
          </h3>
          <div className="flex gap-1 h-4 rounded-full overflow-hidden bg-muted">
            {total > 0 && (
              <>
                <motion.div
                  className="bg-emerald-500 h-full rounded-l-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(correct / total) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                />
                <motion.div
                  className="bg-red-500 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(incorrect / total) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
                <motion.div
                  className="bg-muted-foreground/30 h-full rounded-r-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(skipped / total) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              </>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Correct</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Incorrect</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" /> Skipped</span>
          </div>
        </Card>

        {/* Action buttons */}
        <div className="space-y-3">
          {mistakes.length > 0 && (
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                onClick={() => onReviewMistakes(mistakes)}
                variant="outline"
                className="w-full h-11 rounded-xl font-semibold text-sm gap-2 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <XCircle className="h-4 w-4" />
                Review {mistakes.length} Mistake{mistakes.length > 1 ? "s" : ""}
              </Button>
            </motion.div>
          )}

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              onClick={onTryAgain}
              className="w-full h-11 rounded-xl font-semibold text-sm gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/25 hover:shadow-amber-500/40"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              onClick={onHome}
              variant="outline"
              className="w-full h-11 rounded-xl font-semibold text-sm gap-2"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Review Screen ──────────────────────────────────────────────────────────

function ReviewScreen({
  mistakes,
  onBack,
}: {
  mistakes: QuestionResult[];
  onBack: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="sticky top-14 z-10 glass-nav border-b border-border/60">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-7 px-2 rounded-lg">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Results
            </Button>
            <h2 className="text-sm font-bold">
              Reviewing {mistakes.length} Mistake{mistakes.length > 1 ? "s" : ""}
            </h2>
          </div>
          <Badge variant="outline" className="text-xs border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 gap-1">
            <XCircle className="h-3 w-3" />
            Incorrect
          </Badge>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
        {mistakes.map((m, i) => (
          <motion.div
            key={m.questionId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="rounded-2xl border border-red-200 dark:border-red-800/50 bg-card overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-2 gap-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-[11px] font-extrabold">
                    M{i + 1}
                  </span>
                  {m.question.year && (
                    <Badge variant="outline" className="text-[11px] border-border/50 font-medium px-2">
                      {m.question.year}
                    </Badge>
                  )}
                  {m.question.chapter && (
                    <Badge variant="secondary" className="text-[10px] font-medium bg-muted/60 text-muted-foreground rounded-md px-2">
                      {m.question.chapter.name}
                    </Badge>
                  )}
                </div>
                <div className="text-right text-xs">
                  {m.userAnswer && (
                    <p className="text-red-500 dark:text-red-400">
                      Your answer: <span className="font-bold">{m.userAnswer}</span>
                    </p>
                  )}
                  {m.question.correctAnswer && (
                    <p className="text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Correct: <span className="font-bold">{m.question.correctAnswer}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Question body */}
              <div className="px-5 py-4">
                <div className="text-sm leading-7">
                  <MathText text={normalizeText(m.question.questionText || "")} />
                </div>

                {/* Solution */}
                {(m.question.solution || m.question.solutionHtml) && (
                  <div className="mt-4 rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">Solution</p>
                    <div className="text-sm leading-7">
                      <MathText text={m.question.solution || m.question.solutionHtml || ""} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Practice Mode Component ───────────────────────────────────────────

export function PracticeMode() {
  const { data: session } = useSession();
  const { subjects, setView, examType, setPracticeQuestions, setPracticeActive, setPracticeScore, setPracticeTimer, setPracticeIndex, setPracticeSubject, setPracticeChapter } = useAppState();

  const [phase, setPhase] = useState<PracticePhase>("setup");
  const [quizQuestions, setQuizQuestions] = useState<QuestionData[]>([]);
  const [quizResults, setQuizResults] = useState<QuestionResult[]>([]);
  const [quizTimeTaken, setQuizTimeTaken] = useState(0);
  const [reviewMistakes, setReviewMistakes] = useState<QuestionResult[]>([]);
  const [showReview, setShowReview] = useState(false);

  // Store last settings for "Try Again"
  const [lastSettings, setLastSettings] = useState<{
    subject: string;
    chapter: string;
    numQuestions: number;
    questionType: QuestionType;
    timerSeconds: number;
  } | null>(null);

  const handleStart = useCallback(async (settings: {
    subject: string;
    chapter: string;
    numQuestions: number;
    questionType: QuestionType;
    timerSeconds: number;
  }) => {
    setLastSettings(settings);

    try {
      const params = new URLSearchParams({
        exam: examType,
        page: "1",
        limit: String(settings.numQuestions),
        sort: "newest",
      });

      if (settings.subject && settings.subject !== "all") {
        params.set("subject", settings.subject);
      }
      if (settings.chapter && settings.chapter !== "all") {
        params.set("chapterId", settings.chapter);
      }
      if (settings.questionType !== "all") {
        params.set("type", settings.questionType);
      }

      const res = await fetch(`/api/questions?${params}`);
      const data = await res.json();

      if (!res.ok || !data.questions || data.questions.length === 0) {
        toast.error("No questions found for the selected filters. Try different settings.");
        return;
      }

      // If we got fewer questions than requested, that's OK - just use what we got
      const questions = data.questions.slice(0, settings.numQuestions);

      // Shuffle the questions for variety
      const shuffled = [...questions].sort(() => Math.random() - 0.5);

      setQuizQuestions(shuffled);
      setPracticeQuestions(shuffled);
      setPracticeActive(true);
      setPracticeScore({ correct: 0, incorrect: 0, skipped: 0 });
      setPracticeTimer(settings.timerSeconds);
      setPracticeIndex(0);
      setPracticeSubject(settings.subject);
      setPracticeChapter(settings.chapter);
      setPhase("quiz");
    } catch (err) {
      console.error("Failed to fetch practice questions:", err);
      toast.error("Failed to load questions. Please try again.");
    }
  }, [examType, setPracticeQuestions, setPracticeActive, setPracticeScore, setPracticeTimer, setPracticeIndex, setPracticeSubject, setPracticeChapter]);

  const handleFinish = useCallback((results: QuestionResult[]) => {
    setQuizResults(results);
    setQuizTimeTaken(results.reduce((sum, r) => sum + r.timeTaken, 0));
    setPracticeActive(false);
    setPhase("results");
  }, [setPracticeActive]);

  const handleEnd = useCallback(() => {
    // End practice and show results with whatever answers we have so far
    setPracticeActive(false);
    // If we have questions loaded, show results even with 0 answers
    if (quizQuestions.length > 0) {
      // Build results from whatever was answered, mark rest as skipped
      const answeredIds = new Set(quizResults.map(r => r.questionId));
      const finalResults = [...quizResults];
      for (let i = 0; i < quizQuestions.length; i++) {
        if (!answeredIds.has(quizQuestions[i].id)) {
          finalResults.push({
            questionId: quizQuestions[i].id,
            userAnswer: null,
            isCorrect: null,
            isSkipped: true,
            timeTaken: 0,
            question: quizQuestions[i],
          });
        }
      }
      setQuizResults(finalResults);
      setPhase("results");
    } else {
      setPhase("setup");
      setQuizQuestions([]);
      setQuizResults([]);
    }
  }, [setPracticeActive, quizQuestions, quizResults]);

  const handleTryAgain = useCallback(() => {
    if (lastSettings) {
      handleStart(lastSettings);
    }
  }, [lastSettings, handleStart]);

  const handleReviewMistakes = useCallback((mistakes: QuestionResult[]) => {
    setReviewMistakes(mistakes);
    setShowReview(true);
  }, []);

  const handleHome = useCallback(() => {
    setPracticeActive(false);
    setView("landing");
  }, [setPracticeActive, setView]);

  // Login prompt for non-authenticated users (but still allow practice)
  useEffect(() => {
    if (!session?.user && phase === "setup") {
      // Show a subtle info, but don't block
    }
  }, [session, phase]);

  // Review screen
  if (showReview) {
    return (
      <ReviewScreen
        mistakes={reviewMistakes}
        onBack={() => setShowReview(false)}
      />
    );
  }

  if (phase === "quiz") {
    return (
      <QuizScreen
        questions={quizQuestions}
        timerDuration={lastSettings?.timerSeconds || 0}
        onFinish={handleFinish}
        onEnd={handleEnd}
      />
    );
  }

  if (phase === "results") {
    return (
      <ResultsScreen
        results={quizResults}
        timeTaken={quizTimeTaken}
        onReviewMistakes={handleReviewMistakes}
        onTryAgain={handleTryAgain}
        onHome={handleHome}
      />
    );
  }

  // Setup screen (default)
  return (
    <SetupScreen
      onStart={handleStart}
      onBack={() => setView("landing")}
    />
  );
}