"use client";

import { useSession } from "next-auth/react";
import { useAppState } from "@/hooks/use-app-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Search,
  Star,
  CalendarRange,
  ChevronRight,
  Sparkles,
  Users,
  FileDown,
  BrainCircuit,
  Save,
  LayoutGrid,
  Eye,
  RotateCcw,
  BookMarked,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";

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
    gradient: string;
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
    topics: ["Mechanics", "Waves", "Thermodynamics", "Optics", "Electrodynamics"],
    gradient: "from-orange-500 to-amber-500",
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
    topics: ["Organic", "Inorganic", "Physical", "Analytical", "Solutions"],
    gradient: "from-emerald-500 to-teal-500",
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
    topics: ["Calculus", "Algebra", "Coordinate", "Probability", "Trigonometry"],
    gradient: "from-violet-500 to-purple-500",
  },
};

const FEATURES = [
  {
    icon: <CalendarRange className="h-6 w-6" />,
    title: "Year-wise PYQs",
    desc: "Access questions organized by year, shift, and session. Go back to 2000 or focus on recent papers.",
  },
  {
    icon: <Save className="h-6 w-6" />,
    title: "Save & Bookmark",
    desc: "Bookmark tricky questions for later. Build a personal collection of questions to revise before exam day.",
  },
  {
    icon: <BrainCircuit className="h-6 w-6" />,
    title: "AI Solutions",
    desc: "Get AI-powered step-by-step solutions. Understand the reasoning, not just the answer.",
  },
  {
    icon: <FileDown className="h-6 w-6" />,
    title: "PDF Export",
    desc: "Export your saved questions or any chapter's PYQs as beautifully formatted PDFs for offline practice.",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: <LayoutGrid className="h-6 w-6" />,
    title: "Browse",
    desc: "Pick a subject and chapter to explore questions",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800/40",
  },
  {
    step: 2,
    icon: <Eye className="h-6 w-6" />,
    title: "Practice",
    desc: "Solve questions with filters for year, type, and more",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800/40",
  },
  {
    step: 3,
    icon: <BookMarked className="h-6 w-6" />,
    title: "Save",
    desc: "Bookmark questions you want to revisit later",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800/40",
  },
  {
    step: 4,
    icon: <RotateCcw className="h-6 w-6" />,
    title: "Revise",
    desc: "Revisit saved questions and strengthen weak areas",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800/40",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
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
    savedCount,
    setSelectedChapter,
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

  const handleStartPracticing = () => {
    const physics = subjects.find((s) => s.slug === "physics");
    if (physics) {
      setSelectedSubject(physics);
      setView("questions");
    }
  };

  const totalQuestions = subjects.reduce(
    (sum, s) =>
      sum + s.chapters.reduce((cs, ch) => cs + ch.questionCount, 0),
    0
  );

  const totalChapters = subjects.reduce(
    (sum, s) => sum + s.chapters.length,
    0
  );

  // Compute year distribution
  const yearDistribution = useMemo(() => {
    const years = [
      { year: 2026, count: 25 },
      { year: 2025, count: 30 },
      { year: 2024, count: 28 },
      { year: 2023, count: 24 },
      { year: 2022, count: 26 },
      { year: 2021, count: 22 },
      { year: 2020, count: 20 },
      { year: 2019, count: 18 },
    ];
    const maxCount = Math.max(...years.map((y) => y.count));
    return years.map((y) => ({
      ...y,
      percentage: Math.round((y.count / maxCount) * 100),
    }));
  }, []);

  return (
    <div className="flex-1 page-transition">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 -z-10">
          <div className="mesh-blob-1 absolute top-[-10%] left-[20%] w-[600px] h-[500px] bg-gradient-to-br from-amber-300/40 via-orange-200/30 to-yellow-200/20 dark:from-amber-800/20 dark:via-orange-900/15 dark:to-yellow-900/10 rounded-full blur-[100px]" />
          <div className="mesh-blob-2 absolute top-[10%] right-[10%] w-[500px] h-[400px] bg-gradient-to-bl from-orange-300/35 via-amber-200/25 to-red-200/15 dark:from-orange-800/18 dark:via-amber-900/12 dark:to-red-900/8 rounded-full blur-[90px]" />
          <div className="mesh-blob-3 absolute bottom-[-5%] left-[40%] w-[700px] h-[350px] bg-gradient-to-t from-amber-200/30 via-orange-100/20 to-yellow-300/15 dark:from-amber-900/15 dark:via-orange-950/10 dark:to-yellow-900/8 rounded-full blur-[110px]" />
          <div className="absolute inset-0 hero-pattern opacity-30 dark:opacity-15" />
        </div>

        <div className="container mx-auto px-4 pt-12 sm:pt-16 md:pt-24 pb-12 md:pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-amber-200/80 dark:border-amber-700/50 bg-white/70 dark:bg-amber-950/30 backdrop-blur-sm shadow-sm"
            >
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500">
                <Zap className="h-3 w-3 text-white" />
              </div>
              <span className="text-amber-800 dark:text-amber-300 text-sm font-semibold tracking-wide">
                Previous Year Questions
              </span>
              <Badge variant="secondary" className="ml-1 text-[10px] font-bold px-2 h-5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-0">
                2026 Updated
              </Badge>
            </motion.div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.08]">
              JEE PYQ{" "}
              <span className="gradient-text">Vault</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Your one-stop resource for JEE previous year questions with
              detailed solutions. Practice systematically, save what matters, and
              master every chapter.
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="max-w-xl mx-auto mb-10"
            >
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60 group-focus-within:text-amber-500 transition-colors" />
                <Input
                  placeholder="Search by topic, chapter, or keyword..."
                  className="h-12 pl-12 pr-4 rounded-2xl border-border/60 bg-white/80 dark:bg-white/5 backdrop-blur-sm text-base shadow-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 dark:focus:border-amber-700 transition-all"
                  readOnly
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/80 text-[11px] font-medium text-muted-foreground border border-border/50">
                  ⌘K
                </kbd>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14"
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  className="cta-pulse bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl px-10 h-14 text-lg font-bold transition-all duration-300 hover:-translate-y-0.5"
                  onClick={handleStartPracticing}
                >
                  <Sparkles className="mr-2.5 h-5 w-5" />
                  Start Practicing
                  <ArrowRight className="ml-1.5 h-5 w-5" />
                </Button>
              </motion.div>

              {session?.user && (
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-2xl px-6 h-14 text-base font-medium border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400 gap-2 transition-all duration-300 hover:-translate-y-0.5"
                  onClick={() => setView("saved")}
                >
                  <Bookmark className="h-5 w-5" />
                  My Saved Questions
                  {savedCount > 0 && (
                    <Badge className="h-6 min-w-6 px-1.5 text-[11px] font-bold bg-amber-600 text-white border-0 shadow-sm">
                      {savedCount}
                    </Badge>
                  )}
                </Button>
              )}
            </motion.div>

            {/* Dynamic Stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
            >
              {[
                {
                  icon: <BookOpen className="h-5 w-5" />,
                  value: totalQuestions > 0 ? `${(totalQuestions / 1000).toFixed(1)}k+` : "10,000+",
                  label: "Questions",
                  highlight: true,
                },
                {
                  icon: <CalendarRange className="h-5 w-5" />,
                  value: "2000–2026",
                  label: "Years Covered",
                  highlight: false,
                },
                {
                  icon: <GraduationCap className="h-5 w-5" />,
                  value: "All 3",
                  label: "Subjects",
                  highlight: false,
                },
                {
                  icon: <Zap className="h-5 w-5" />,
                  value: totalChapters > 0 ? totalChapters : "90+",
                  label: "Chapters",
                  highlight: false,
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 + i * 0.07, duration: 0.4 }}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-sm ${
                    stat.highlight
                      ? "glass glow-amber border-amber-300/50 dark:border-amber-700/40"
                      : "bg-card border-border/40"
                  }`}
                >
                  <span className={stat.highlight ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                    {stat.icon}
                  </span>
                  <div className="text-left">
                    <p className={`text-lg font-bold leading-tight ${stat.highlight ? "gradient-text" : ""}`}>
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== EXAM TYPE TOGGLE ===== */}
      <section className="container mx-auto px-4 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <Tabs
            value={examType}
            onValueChange={(v) =>
              setExamType(v as "jee-main" | "jee-advanced")
            }
          >
            <TabsList className="mx-auto h-11 p-1 rounded-2xl">
              <TabsTrigger value="jee-main" className="px-6 text-sm font-medium rounded-xl">
                JEE Main
              </TabsTrigger>
              <TabsTrigger value="jee-advanced" className="px-6 text-sm font-medium rounded-xl">
                JEE Advanced
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>
      </section>

      {/* ===== SUBJECT CARDS ===== */}
      <section className="container mx-auto px-4 pb-16 md:pb-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto"
        >
          {(["physics", "chemistry", "mathematics"] as const).map(
            (slug, index) => {
              const config = SUBJECT_CONFIG[slug];
              const chapterCount = getSubjectChapterCount(slug);
              const questionCount = getSubjectQuestionCount(slug);
              return (
                <motion.div key={slug} variants={staggerItem}>
                  <Card
                    className={`
                      cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2
                      border-2 ${config.borderLight} ${config.borderDark}
                      ${config.hoverColor} bg-card group relative overflow-hidden
                    `}
                    onClick={() => handleSubjectClick(slug)}
                  >
                    {/* Subtle gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-[0.03] dark:group-hover:opacity-[0.06] transition-opacity duration-500`} />

                    <CardContent className="p-6 relative">
                      <div
                        className={`
                          inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5
                          ${config.bgLight} ${config.bgDark} ${config.color}
                          transition-transform duration-300 group-hover:scale-110
                          shadow-sm
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
                              text-[11px] font-medium px-2.5 py-0.5 rounded-md
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
                            flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300
                            ${config.bgLight} ${config.bgDark}
                            group-hover:translate-x-1
                          `}
                        >
                          <ArrowRight
                            className={`h-4 w-4 ${config.color} transition-transform duration-300 group-hover:translate-x-0.5`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            }
          )}
        </motion.div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="border-t border-border/40 bg-muted/20 dark:bg-muted/5 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4 text-xs font-semibold px-3 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-0">
              <Zap className="mr-1.5 h-3 w-3" />
              Simple Workflow
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">How It Works</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Four simple steps to supercharge your JEE preparation
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto"
          >
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                variants={staggerItem}
                className={`${i < 3 ? "step-connector" : ""}`}
              >
                <Card className="h-full border-border/50 hover:border-amber-200/60 dark:hover:border-amber-800/40 hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-5">
                    {/* Step number + icon */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${step.bg} ${step.color} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                        {step.icon}
                      </div>
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs font-black shadow-sm">
                        {step.step}
                      </div>
                    </div>
                    <h4 className="text-base font-bold mb-1.5">{step.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4 text-xs font-semibold px-3 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-0">
              <Star className="mr-1.5 h-3 w-3" />
              Powerful Features
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Everything You Need</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Designed for serious JEE aspirants who want structured, efficient preparation
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto"
          >
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
              >
                <Card className="h-full border-border/50 hover:border-amber-200/60 dark:hover:border-amber-800/40 hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                      {feature.icon}
                    </div>
                    <h4 className="text-base font-bold mb-2">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== YEAR DISTRIBUTION VISUAL ===== */}
      <section className="border-t border-border/40 bg-muted/20 dark:bg-muted/5 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-4 text-xs font-semibold px-3 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-0">
                <CalendarRange className="mr-1.5 h-3 w-3" />
                Comprehensive Coverage
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Year-wise Coverage</h2>
              <p className="text-sm text-muted-foreground">
                Comprehensive collection spanning over two decades of JEE examinations
              </p>
            </div>
            <Card className="p-6 border-border/50">
              <CardContent className="p-0">
                <div className="space-y-3">
                  {yearDistribution.map((item) => (
                    <div key={item.year} className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground w-12 text-right tabular-nums">
                        {item.year}
                      </span>
                      <div className="flex-1 h-8 bg-muted/50 rounded-lg overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.percentage}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                          className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 year-bar"
                        />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground w-6 tabular-nums">
                        {item.count}+
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ===== NON-LOGGED-IN CTA ===== */}
      {!session?.user && (
        <section className="container mx-auto px-4 pb-16 md:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200/60 dark:border-amber-800/30 px-8 py-10 md:px-12 md:py-14">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-200/30 dark:bg-amber-800/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-200/30 dark:bg-orange-800/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25 mb-5">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 tracking-tight">
                  Start Your JEE Journey
                </h3>
                <p className="text-muted-foreground mb-6 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                  Create a free account to save questions, track your progress, and build a personalized revision plan.
                </p>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    className="cta-pulse bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg rounded-2xl px-8 h-12 font-semibold transition-all duration-300 hover:-translate-y-0.5"
                    onClick={() => setAuthModalOpen(true)}
                  >
                    Get Started — It&apos;s Free
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border/40 bg-muted/20 dark:bg-muted/5">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight">
                JEE PYQ <span className="text-amber-600 dark:text-amber-400">Vault</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Built for JEE aspirants. Practice smarter, not harder.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                Free Forever
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                {totalQuestions > 0 ? `${totalQuestions.toLocaleString()}+ Questions` : "10,000+ Questions"}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}