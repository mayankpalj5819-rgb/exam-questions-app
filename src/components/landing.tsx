"use client";

import { useSession } from "next-auth/react";
import { useAppState } from "@/hooks/use-app-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    description: string;
  }
> = {
  physics: {
    icon: <Atom className="h-8 w-8" />,
    color: "text-orange-600 dark:text-orange-400",
    hoverColor: "hover:border-orange-300 dark:hover:border-orange-700",
    bgLight: "bg-orange-50",
    bgDark: "dark:bg-orange-950/30",
    description: "Mechanics, Thermodynamics, Optics, Modern Physics & more",
  },
  chemistry: {
    icon: <FlaskConical className="h-8 w-8" />,
    color: "text-emerald-600 dark:text-emerald-400",
    hoverColor: "hover:border-emerald-300 dark:hover:border-emerald-700",
    bgLight: "bg-emerald-50",
    bgDark: "dark:bg-emerald-950/30",
    description: "Organic, Inorganic, Physical Chemistry & more",
  },
  mathematics: {
    icon: <Calculator className="h-8 w-8" />,
    color: "text-purple-600 dark:text-purple-400",
    hoverColor: "hover:border-purple-300 dark:hover:border-purple-700",
    bgLight: "bg-purple-50",
    bgDark: "dark:bg-purple-950/30",
    description: "Calculus, Algebra, Coordinate Geometry & more",
  },
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
  } = useAppState();

  const getSubjectChapterCount = (slug: string) => {
    const subject = subjects.find((s) => s.slug === slug);
    return subject?.chapters?.length || 0;
  };

  const getSubjectQuestionCount = (slug: string) => {
    const subject = subjects.find((s) => s.slug === slug);
    return subject?.chapters?.reduce((sum, ch) => sum + ch.questionCount, 0) || 0;
  };

  const handleSubjectClick = (slug: string) => {
    const subject = subjects.find((s) => s.slug === slug);
    if (subject) {
      setSelectedSubject(subject);
      setView("questions");
    }
  };

  const totalQuestions = subjects.reduce(
    (sum, s) => sum + s.chapters.reduce((cs, ch) => cs + ch.questionCount, 0),
    0
  );

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-amber-50/80 via-background to-background dark:from-amber-950/20 dark:via-background dark:to-background">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-sm font-medium">
              <Zap className="h-4 w-4" />
              Previous Year Questions
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
              JEE PYQ <span className="text-amber-600">Vault</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Access a comprehensive collection of JEE previous year questions
              with detailed solutions. Practice, save, and master every chapter.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-600" />
                <span>
                  <strong className="text-foreground">{subjects.length}</strong> Subjects
                </span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-amber-600" />
                <span>
                  <strong className="text-foreground">
                    {totalQuestions.toLocaleString()}
                  </strong>{" "}
                  Questions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-600" />
                <span>Free to use</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-10 md:py-16">
        {/* Saved Questions CTA */}
        {session?.user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Button
              variant="outline"
              className="border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400"
              onClick={() => setView("saved")}
            >
              <Bookmark className="mr-2 h-4 w-4" />
              My Saved Questions
            </Button>
          </motion.div>
        )}

        {/* Exam Type Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Tabs
            value={examType}
            onValueChange={(v) => setExamType(v as "jee-main" | "jee-advanced")}
          >
            <TabsList className="mx-auto">
              <TabsTrigger value="jee-main">JEE Main</TabsTrigger>
              <TabsTrigger value="jee-advanced">JEE Advanced</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Subject Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {(["physics", "chemistry", "mathematics"] as const).map(
            (slug, index) => {
              const config = SUBJECT_CONFIG[slug];
              const chapterCount = getSubjectChapterCount(slug);
              const questionCount = getSubjectQuestionCount(slug);
              return (
                <motion.div
                  key={slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${config.hoverColor} border-2`}
                    onClick={() => handleSubjectClick(slug)}
                  >
                    <CardContent className="p-6">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${config.bgLight} ${config.bgDark} ${config.color}`}
                      >
                        {config.icon}
                      </div>
                      <h3 className="text-xl font-bold mb-1 capitalize">
                        {slug}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {config.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {chapterCount}
                          </span>{" "}
                          chapters ·{" "}
                          <span className="font-semibold text-foreground">
                            {questionCount.toLocaleString()}
                          </span>{" "}
                          questions
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            }
          )}
        </div>

        {/* Non-logged-in CTA */}
        {!session?.user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <p className="text-muted-foreground mb-3">
              Create an account to save questions and track your progress
            </p>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => setAuthModalOpen(true)}
            >
              Get Started — It&apos;s Free
            </Button>
          </motion.div>
        )}
      </section>
    </div>
  );
}