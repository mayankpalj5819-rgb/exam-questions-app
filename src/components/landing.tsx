"use client";

import { useSession } from "next-auth/react";
import { useAppState } from "@/hooks/use-app-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Atom, FlaskConical, Calculator, Zap, ArrowRight, Search, Sparkles,
  FileDown, BarChart3, Moon, Smartphone, Wand2, BookOpen, Bookmark,
  CalendarRange, ChevronRight, ChevronDown, Users, GraduationCap,
} from "lucide-react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useRef, useEffect } from "react";
import { toast } from "sonner";

/* ─── Data ─── */

const SUBJECTS = [
  { slug: "physics", name: "Physics", icon: <Atom className="h-8 w-8" />,
    color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-900/40 hover:border-orange-300 dark:hover:border-orange-700",
    desc: "Mechanics, Thermodynamics, Optics, Modern Physics & more",
    topics: ["Mechanics", "Waves", "Thermodynamics", "Optics", "Electrodynamics"],
    fallback: { ch: 35 } },
  { slug: "chemistry", name: "Chemistry", icon: <FlaskConical className="h-8 w-8" />,
    color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-700",
    desc: "Organic, Inorganic, Physical Chemistry & more",
    topics: ["Organic", "Inorganic", "Physical", "Coordination", "Polymers"],
    fallback: { ch: 30 } },
  { slug: "mathematics", name: "Mathematics", icon: <Calculator className="h-8 w-8" />,
    color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-900/40 hover:border-violet-300 dark:hover:border-violet-700",
    desc: "Algebra, Calculus, Coordinate Geometry, Vectors & more",
    topics: ["Algebra", "Calculus", "Coordinate", "Vectors", "Probability"],
    fallback: { ch: 27 } },
] as const;

const FEATURES = [
  { icon: <Search className="h-5 w-5" />, title: "Web Answer Search", desc: "Find verified solutions from trusted educational sources online." },
  { icon: <Bookmark className="h-5 w-5" />, title: "Smart Bookmarks", desc: "Save questions for revision with subject and chapter filters." },
  { icon: <FileDown className="h-5 w-5" />, title: "PDF Export", desc: "Export saved questions as beautifully formatted printable PDFs." },
  { icon: <BarChart3 className="h-5 w-5" />, title: "Chapter Analytics", desc: "See topic weightage and exam pattern analysis at a glance." },
  { icon: <Moon className="h-5 w-5" />, title: "Dark Mode", desc: "Comfortable studying in any lighting condition." },
  { icon: <Smartphone className="h-5 w-5" />, title: "Mobile Friendly", desc: "Practice on the go with a fully responsive design." },
];

const YEAR_DATA = [
  {year:2002,count:1320},{year:2003,count:1480},{year:2004,count:1560},{year:2005,count:1620},
  {year:2006,count:1680},{year:2007,count:1740},{year:2008,count:1800},{year:2009,count:1860},
  {year:2010,count:1920},{year:2011,count:2040},{year:2012,count:2100},{year:2013,count:2160},
  {year:2014,count:2280},{year:2015,count:2400},{year:2016,count:2520},{year:2017,count:2640},
  {year:2018,count:2760},{year:2019,count:3120},{year:2020,count:3420},{year:2021,count:3660},
  {year:2022,count:3900},{year:2023,count:4080},{year:2024,count:4260},{year:2025,count:3900},
  {year:2026,count:880},
];

const STATS = [
  { value: 61991, suffix: "+", label: "Questions", icon: <BookOpen className="h-5 w-5" /> },
  { value: 174, suffix: "", label: "Chapters", icon: <GraduationCap className="h-5 w-5" /> },
  { value: 3, suffix: "", label: "Subjects", icon: <Atom className="h-5 w-5" /> },
  { value: 27, suffix: "+", label: "Years", icon: <CalendarRange className="h-5 w-5" /> },
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } } };

/* ─── Animated Counter ─── */

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) =>
    value >= 1000 ? `${Math.round(v).toLocaleString()}${suffix}` : `${Math.round(v)}${suffix}`
  );
  useEffect(() => {
    if (inView) { const c = animate(mv, value, { duration: 1.8, ease: "easeOut" }); return c.stop; }
  }, [inView, mv, value]);
  return <motion.span ref={ref}>{display}</motion.span>;
}

/* ─── Section Header ─── */

function SectionHead({ badge, icon, title, sub }: { badge: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
      <Badge variant="secondary" className="mb-4 text-xs font-semibold px-3 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-0">
        {icon}{badge}
      </Badge>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">{sub}</p>
    </motion.div>
  );
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */

export function Landing() {
  const { data: session } = useSession();
  const { subjects, examType, setExamType, setSelectedSubject, setView, setAuthModalOpen, savedCount } = useAppState();

  const chCount = (slug: string) => subjects.find((s) => s.slug === slug)?.chapters?.length || 0;
  const qCount = (slug: string) => subjects.find((s) => s.slug === slug)?.chapters?.reduce((a, c) => a + c.questionCount, 0) || 0;

  const goTo = (slug: string) => {
    const s = subjects.find((x) => x.slug === slug);
    if (s) { setSelectedSubject(s); setView("questions"); }
  };

  const handleStart = () => {
    const p = subjects.find((s) => s.slug === "physics");
    if (p) { setSelectedSubject(p); setView("questions"); } else setView("questions");
  };

  const maxYear = Math.max(...YEAR_DATA.map((d) => d.count));

  return (
    <div className="flex-1 page-transition">

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="mesh-blob-1 absolute top-[-10%] left-[20%] w-[600px] h-[500px] bg-gradient-to-br from-amber-300/40 via-orange-200/30 to-yellow-200/20 dark:from-amber-800/20 dark:via-orange-900/15 dark:to-yellow-900/10 rounded-full blur-[100px]" />
          <div className="mesh-blob-2 absolute top-[10%] right-[10%] w-[500px] h-[400px] bg-gradient-to-bl from-orange-300/35 via-amber-200/25 to-red-200/15 dark:from-orange-800/18 dark:via-amber-900/12 dark:to-red-900/8 rounded-full blur-[90px]" />
          <div className="mesh-blob-3 absolute bottom-[-5%] left-[40%] w-[700px] h-[350px] bg-gradient-to-t from-amber-200/30 via-orange-100/20 to-yellow-300/15 dark:from-amber-900/15 dark:via-orange-950/10 dark:to-yellow-900/8 rounded-full blur-[110px]" />
          <div className="absolute inset-0 hero-pattern opacity-30 dark:opacity-15" />
        </div>

        <div className="container mx-auto px-4 pt-12 sm:pt-16 md:pt-24 pb-8 md:pb-14 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}>

            {/* Pill */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-amber-200/80 dark:border-amber-700/50 bg-white/70 dark:bg-amber-950/30 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500">
                <Zap className="h-3 w-3 text-white" />
              </div>
              <span className="text-amber-800 dark:text-amber-300 text-sm font-semibold tracking-wide">Previous Year Questions</span>
              <Badge variant="secondary" className="ml-1 text-[10px] font-bold px-2 h-5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-0">2026 Updated</Badge>
            </motion.div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.08]">
              JEE PYQ <span className="gradient-text">Vault</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              The most comprehensive JEE previous year question bank. Practice{" "}
              <span className="font-semibold text-foreground">61,991+ questions</span> across Physics, Chemistry &amp; Mathematics — systematically.
            </p>

            {/* Exam Type Toggle */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex justify-center mb-8">
              <Tabs value={examType} onValueChange={(v) => setExamType(v as "jee-main" | "jee-advanced")}>
                <TabsList className="h-11 p-1 rounded-2xl shadow-sm border border-border/40">
                  <TabsTrigger value="jee-main" className="px-6 text-sm font-medium rounded-xl">JEE Main</TabsTrigger>
                  <TabsTrigger value="jee-advanced" className="px-6 text-sm font-medium rounded-xl">JEE Advanced</TabsTrigger>
                </TabsList>
              </Tabs>
            </motion.div>

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="max-w-xl mx-auto mb-8">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60 group-focus-within:text-amber-500 transition-colors" />
                <Input placeholder="Search by topic, chapter, or keyword..." readOnly
                  className="h-12 pl-12 pr-20 rounded-2xl border-border/60 bg-white/80 dark:bg-white/5 backdrop-blur-sm text-base shadow-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 dark:focus:border-amber-700 transition-all" />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/80 text-[11px] font-medium text-muted-foreground border border-border/50">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" onClick={handleStart}
                  className="cta-pulse bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl px-10 h-14 text-lg font-bold transition-all duration-300 hover:-translate-y-0.5">
                  <Sparkles className="mr-2.5 h-5 w-5" />Start Practicing<ArrowRight className="ml-1.5 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" variant="outline" onClick={() => setView("analytics")}
                  className="rounded-2xl px-6 h-14 text-base font-medium border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400 gap-2 transition-all duration-300 hover:-translate-y-0.5">
                  <BarChart3 className="h-5 w-5" />View Analytics
                </Button>
              </motion.div>
            </motion.div>

            {/* Quick stats */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-3">
              {[
                { icon: <BookOpen className="h-4 w-4" />, val: "61,991+", lbl: "Questions", hl: true },
                { icon: <CalendarRange className="h-4 w-4" />, val: "2002–2026", lbl: "Years", hl: false },
                { icon: <Atom className="h-4 w-4" />, val: "3", lbl: "Subjects", hl: false },
                { icon: <GraduationCap className="h-4 w-4" />, val: "174", lbl: "Chapters", hl: false },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 + i * 0.06, duration: 0.4 }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border shadow-sm text-sm ${s.hl ? "glass glow-amber border-amber-300/50 dark:border-amber-700/40" : "bg-card border-border/40"}`}>
                  <span className={s.hl ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>{s.icon}</span>
                  <span className={`font-bold ${s.hl ? "gradient-text" : ""}`}>{s.val}</span>
                  <span className="text-muted-foreground text-xs">{s.lbl}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="flex justify-center pb-6">
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} className="text-muted-foreground/40">
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ ANIMATED STATS ═══ */}
      <section className="border-y border-border/40 bg-muted/30 dark:bg-muted/5">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <motion.div key={s.label} variants={fadeUp} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mb-3">{s.icon}</div>
                <p className="text-2xl sm:text-3xl font-black tracking-tight mb-0.5"><AnimatedCounter value={s.value} suffix={s.suffix} /></p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ SUBJECT CARDS ═══ */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <SectionHead badge="Browse Subjects" icon={<Atom className="mr-1.5 h-3 w-3" />} title="Choose Your Subject" sub="Dive into chapter-wise previous year questions for each subject" />
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {SUBJECTS.map((s) => {
            const qs = qCount(s.slug);
            const ch = chCount(s.slug);
            const showCh = ch > 0 ? ch : s.fallback.ch;
            return (
              <motion.div key={s.slug} variants={fadeUp}>
                <Card className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-2 ${s.border} bg-card group relative overflow-hidden`}
                  onClick={() => goTo(s.slug)}>
                  <CardContent className="p-6 relative">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 ${s.bg} ${s.color} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                      {s.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-1.5 tracking-tight">{s.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{s.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {s.topics.map((t) => (
                        <span key={t} className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md ${s.bg} ${s.color} opacity-70`}>{t}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-bold text-foreground">{showCh}</span> chapters ·{" "}
                        <span className="font-bold text-foreground">33.3%</span> weightage
                      </div>
                      <div className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 ${s.bg} group-hover:translate-x-1`}>
                        <ArrowRight className={`h-4 w-4 ${s.color} transition-transform duration-300 group-hover:translate-x-0.5`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ═══ YEAR DISTRIBUTION ═══ */}
      <section className="border-t border-border/40 bg-muted/20 dark:bg-muted/5 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <SectionHead badge="Comprehensive Coverage" icon={<CalendarRange className="mr-1.5 h-3 w-3" />} title="Questions by Year" sub="A massive collection spanning over two decades of JEE examinations" />
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} className="max-w-4xl mx-auto">
            <Card className="p-4 sm:p-6 border-border/50">
              <CardContent className="p-0">
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {YEAR_DATA.map((item, i) => {
                    const pct = (item.count / maxYear) * 100;
                    const isRecent = item.year >= 2022;
                    return (
                      <div key={item.year} className="flex items-center gap-3 group/bar">
                        <span className="text-xs sm:text-sm font-bold text-muted-foreground w-10 sm:w-12 text-right tabular-nums shrink-0 group-hover/bar:text-foreground transition-colors">{item.year}</span>
                        <div className="flex-1 h-7 sm:h-8 bg-muted/50 rounded-lg overflow-hidden relative">
                          <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: i * 0.02, ease: "easeOut" }}
                            className={`absolute inset-y-0 left-0 rounded-lg year-bar ${isRecent ? "bg-gradient-to-r from-orange-400 to-amber-500" : "bg-gradient-to-r from-amber-300/70 to-amber-400/70 dark:from-amber-600/50 dark:to-amber-500/50"}`} />
                        </div>
                        <span className={`text-[11px] sm:text-xs font-semibold tabular-nums w-10 sm:w-14 shrink-0 ${isRecent ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}>{item.count.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                  <span>2002 – 2026</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-amber-400 to-orange-500" /> Highlighted = 2022+
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <SectionHead badge="Powerful Features" icon={<Sparkles className="mr-1.5 h-3 w-3" />} title="Everything You Need" sub="Designed for serious JEE aspirants who want structured, efficient preparation" />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {FEATURES.map((f, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="h-full border-border/50 hover:border-amber-200/60 dark:hover:border-amber-800/40 hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">{f.icon}</div>
                    <h4 className="text-base font-bold mb-2">{f.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA (non-logged-in) ═══ */}
      {!session?.user && (
        <section className="container mx-auto px-4 pb-12 md:pb-20">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-center">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200/60 dark:border-amber-800/30 px-8 py-10 md:px-12 md:py-14">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-200/30 dark:bg-amber-800/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-200/30 dark:bg-orange-800/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25 mb-5">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 tracking-tight">Start Your JEE Journey</h3>
                <p className="text-muted-foreground mb-6 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                  Create a free account to save questions, track progress, and build a personalized revision plan.
                </p>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" onClick={() => setAuthModalOpen(true)}
                    className="cta-pulse bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg rounded-2xl px-8 h-12 font-semibold transition-all duration-300 hover:-translate-y-0.5">
                    Get Started — It&apos;s Free<ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-border/40 bg-muted/20 dark:bg-muted/5 py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-semibold text-foreground">JEE PYQ Vault</span>
              <span className="hidden sm:inline">· Built for JEE aspirants</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <button className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors" onClick={() => toast.info("About page coming soon!")}>About</button>
              <span className="text-border">·</span>
              <button className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors" onClick={() => toast.info("Contact page coming soon!")}>Contact</button>
              <span className="text-border">·</span>
              <button className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors" onClick={() => toast.info("GitHub link coming soon!")}>GitHub</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}