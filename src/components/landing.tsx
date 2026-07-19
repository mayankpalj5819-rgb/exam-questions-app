"use client";

import { useSession } from "next-auth/react";
import { useAppState } from "@/hooks/use-app-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Atom,
  FlaskConical,
  Calculator,
  Bookmark,
  Zap,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Target,
  TrendingUp,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";

const SUBJECT_CONFIG: Record<
  string,
  {
    icon: React.ReactNode;
    color: string;
    hoverColor: string;
    bgLight: string;
    bgDark: string;
    borderLight: string;
    borderDark: string;
    description: string;
    topics: string[];
  }
> = {
  physics: {
    icon: <Atom className="h-8 w-8" />,
    color: "text-orange-600 dark:text-orange-400",
    hoverColor: "hover:border-orange-300 dark:hover:border-orange-700",
    bgLight: "bg-orange-50",
    bgDark: "dark:bg-orange-950/30",
    borderLight: "border-orange-200",
    borderDark: "dark:border-orange-900/40",
    description: "Mechanics, Thermodynamics, Optics, Modern Physics & more",
    topics: ["Mechanics", "Waves", "Thermodynamics", "Optics"],
  },
  chemistry: {
    icon: <FlaskConical className="h-8 w-8" />,
    color: "text-emerald-600 dark:text-emerald-400",
    hoverColor: "hover:border-emerald-300 dark:hover:border-emerald-700",
    bgLight: "bg-emerald-50",
    bgDark: "dark:bg-emerald-950/30",
    borderLight: "border-emerald-200",
    borderDark: "dark:border-emerald-900/40",
    description: "Organic, Inorganic, Physical Chemistry & more",
    topics: ["Organic", "Inorganic", "Physical", "Analytical"],
  },
  mathematics: {
    icon: <Calculator className="h-8 w-8" />,
    color: "text-violet-600 dark:text-violet-400",
    hoverColor: "hover:border-violet-300 dark:hover:border-violet-700",
    bgLight: "bg-violet-50",
    bgDark: "dark:bg-violet-950/30",
    borderLight: "border-violet-200",
    borderDark: "dark:border-violet-900/40",
    description: "Calculus, Algebra, Coordinate Geometry & more",
    topics: ["Calculus", "Algebra", "Coordinate", "Probability"],
  },
};

const FEATURES = [
  {
    icon: <Target className="h-5 w-5" />,
    title: "Year-wise Questions",
    desc: "Filter by year, shift, and exam type",
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Track Progress",
    desc: "Save questions and revisit later",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Accurate Solutions",
    desc: "Verified answers with detailed explanations",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

export function Landing() {
  const { data: session } = useSession();
  const {
    subjects,
    examType,
    setExamType,
    setSelectedSubject,
    setView,
    setAuthModalOpen,
    savedCount,
  } = useAppState();

  const getSubjectChapterCount = (slug: string) => {
    const subject = subjects.find((s) => s.slug === slug);
    return subject?.chapters?.length || 0;
  };

  const getSubjectQuestionCount = (slug: string) => {
    const subject = subjects.find((s) => s.slug === slug);
    return (
      subject?.chapters?.reduce((sum, ch) => sum + ch.questionCount, 0) || 0
    );
  };

  const handleSubjectClick = (slug: string) => {
    const subject = subjects.find((s) => s.slug === slug);
    if (subject) {
      setSelectedSubject(subject);
      setView("questions");
    }
  };

  const totalQuestions = subjects.reduce(
    (sum, s) =>
      sum + s.chapters.reduce((cs, ch) => cs + ch.questionCount, 0),
    0
  );

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-amber-200/40 via-amber-100/20 to-transparent dark:from-amber-900/20 dark:via-amber-950/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-10 w-72 h-72 bg-orange-200/20 dark:bg-orange-900/10 rounded-full blur-3xl" />
          <div className="absolute top-32 left-10 w-60 h-60 bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 pt-12 pb-16 md:pt-20 md:pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-amber-200/80 dark:border-amber-700/50 bg-white/60 dark:bg-amber-950/30 backdrop-blur-sm shadow-sm"
            >
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500">
                <Zap className="h-3 w-3 text-white" />
              </div>
              <span className="text-amber-800 dark:text-amber-300 text-sm font-semibold">
                Previous Year Questions
              </span>
            </motion.div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-5 leading-[1.1]">
              JEE PYQ{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                  Vault
                </span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Your one-stop resource for JEE previous year questions with
              detailed solutions. Practice systematically, save what matters, and
              master every chapter.
            </p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4 sm:gap-8"
            >
              {[
                {
                  icon: <BookOpen className="h-5 w-5" />,
                  value: subjects.length,
                  label: "Subjects",
                },
                {
                  icon: <GraduationCap className="h-5 w-5" />,
                  value: totalQuestions.toLocaleString(),
                  label: "Questions",
                },
                {
                  icon: <Zap className="h-5 w-5" />,
                  value: "Free",
                  label: "Forever",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-border/50"
                >
                  <span className="text-amber-600 dark:text-amber-400">
                    {stat.icon}
                  </span>
                  <div className="text-left">
                    <p className="text-lg font-bold leading-tight">
                      {stat.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 pb-16 md:pb-24">
        {/* Saved Questions CTA */}
        {session?.user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10"
          >
            <Button
              variant="outline"
              className="border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400 gap-2 rounded-xl"
              onClick={() => setView("saved")}
            >
              <Bookmark className="h-4 w-4" />
              My Saved Questions
              {savedCount > 0 && (
                <Badge className="h-5 min-w-5 px-1.5 text-[10px] font-bold bg-amber-600 text-white border-0">
                  {savedCount}
                </Badge>
              )}
            </Button>
          </motion.div>
        )}

        {/* Exam Type Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <Tabs
            value={examType}
            onValueChange={(v) =>
              setExamType(v as "jee-main" | "jee-advanced")
            }
          >
            <TabsList className="mx-auto h-10">
              <TabsTrigger value="jee-main" className="px-5 text-sm font-medium">
                JEE Main
              </TabsTrigger>
              <TabsTrigger
                value="jee-advanced"
                className="px-5 text-sm font-medium"
              >
                JEE Advanced
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Subject Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {(["physics", "chemistry", "mathematics"] as const).map(
            (slug, index) => {
              const config = SUBJECT_CONFIG[slug];
              const chapterCount = getSubjectChapterCount(slug);
              const questionCount = getSubjectQuestionCount(slug);
              return (
                <motion.div
                  key={slug}
                  custom={index}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                >
                  <Card
                    className={`
                      cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5
                      border-2 ${config.borderLight} ${config.borderDark}
                      ${config.hoverColor} bg-card group
                    `}
                    onClick={() => handleSubjectClick(slug)}
                  >
                    <CardContent className="p-6">
                      <div
                        className={`
                          inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5
                          ${config.bgLight} ${config.bgDark} ${config.color}
                          transition-transform duration-300 group-hover:scale-110
                        `}
                      >
                        {config.icon}
                      </div>
                      <h3 className="text-xl font-bold mb-1.5 capitalize tracking-tight">
                        {slug}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        {config.description}
                      </p>

                      {/* Topic pills */}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {config.topics.map((topic) => (
                          <span
                            key={topic}
                            className={`
                              text-[11px] font-medium px-2 py-0.5 rounded-md
                              ${config.bgLight} ${config.bgDark} ${config.color}
                              opacity-70
                            `}
                          >
                            {topic}
                          </span>
                        ))}
                      </div>

                      {/* Bottom stats */}
                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="text-sm text-muted-foreground">
                          <span className="font-bold text-foreground">
                            {chapterCount}
                          </span>{" "}
                          chapters ·{" "}
                          <span className="font-bold text-foreground">
                            {questionCount.toLocaleString()}
                          </span>{" "}
                          Qs
                        </div>
                        <div
                          className={`
                            flex items-center justify-center w-8 h-8 rounded-lg transition-colors
                            ${config.bgLight} ${config.bgDark}
                            group-hover:translate-x-0.5 transition-transform duration-300
                          `}
                        >
                          <ArrowRight
                            className={`h-4 w-4 ${config.color}`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            }
          )}
        </div>

        {/* Features section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="text-center p-5 rounded-2xl bg-muted/30 border border-border/50"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mb-3">
                  {feature.icon}
                </div>
                <h4 className="text-sm font-bold mb-1">{feature.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Non-logged-in CTA */}
        {!session?.user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-14"
          >
            <div className="inline-block rounded-2xl bg-gradient-to-b from-muted/60 to-muted/20 border border-border/50 px-8 py-6">
              <p className="text-muted-foreground mb-4 text-sm">
                Create an account to save questions and track your progress
              </p>
              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md rounded-xl px-6 h-11 font-semibold"
                onClick={() => setAuthModalOpen(true)}
              >
                Get Started — It&apos;s Free
              </Button>
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}