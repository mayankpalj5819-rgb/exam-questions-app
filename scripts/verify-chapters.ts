import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  datasourceUrl: "file:/home/z/my-project/db/custom.db",
});

// ===== THE CANONICAL EXAMSIDE SLUGS =====
const CANONICAL: Record<string, Record<string, { slug: string; name: string }[]>> = {
  "jee-main": {
    physics: [
      { slug: "units-and-dimensions", name: "Units & Dimensions" },
      { slug: "vectors", name: "Vectors" },
      { slug: "kinematics", name: "Kinematics" },
      { slug: "newtons-laws-of-motion", name: "Newton's Laws of Motion" },
      { slug: "work-power-and-energy", name: "Work, Power & Energy" },
      { slug: "center-of-mass-and-momentum", name: "Center of Mass & Momentum" },
      { slug: "rotational-motion", name: "Rotational Motion" },
      { slug: "gravitation", name: "Gravitation" },
      { slug: "properties-of-matter", name: "Properties of Matter" },
      { slug: "fluid-mechanics", name: "Fluid Mechanics" },
      { slug: "thermal-properties-of-matter", name: "Thermal Properties of Matter" },
      { slug: "thermodynamics", name: "Thermodynamics" },
      { slug: "kinetic-theory-of-gases", name: "Kinetic Theory of Gases" },
      { slug: "oscillations", name: "Oscillations" },
      { slug: "waves", name: "Waves" },
      { slug: "electrostatics", name: "Electrostatics" },
      { slug: "capacitance", name: "Capacitance" },
      { slug: "current-electricity", name: "Current Electricity" },
      { slug: "magnetic-effects-of-current", name: "Magnetic Effects of Current" },
      { slug: "electromagnetic-induction", name: "Electromagnetic Induction" },
      { slug: "alternating-current", name: "Alternating Current" },
      { slug: "electromagnetic-waves", name: "Electromagnetic Waves" },
      { slug: "ray-optics", name: "Ray Optics" },
      { slug: "wave-optics", name: "Wave Optics" },
      { slug: "dual-nature-of-radiation", name: "Dual Nature of Radiation" },
      { slug: "atoms-and-nuclei", name: "Atoms and Nuclei" },
      { slug: "electronic-devices", name: "Electronic Devices" },
      { slug: "communication-system", name: "Communication System" },
      { slug: "experimental-physics", name: "Experimental Physics" },
      { slug: "semiconductors", name: "Semiconductors" },
    ],
    chemistry: [
      { slug: "some-basic-concepts-of-chemistry", name: "Some Basic Concepts of Chemistry" },
      { slug: "atomic-structure", name: "Atomic Structure" },
      { slug: "chemical-bonding", name: "Chemical Bonding" },
      { slug: "states-of-matter", name: "States of Matter" },
      { slug: "chemical-thermodynamics", name: "Chemical Thermodynamics" },
      { slug: "equilibrium", name: "Equilibrium" },
      { slug: "redox-reactions", name: "Redox Reactions" },
      { slug: "solutions", name: "Solutions" },
      { slug: "electrochemistry", name: "Electrochemistry" },
      { slug: "chemical-kinetics", name: "Chemical Kinetics" },
      { slug: "surface-chemistry", name: "Surface Chemistry" },
      { slug: "periodic-table", name: "Periodic Table" },
      { slug: "hydrogen", name: "Hydrogen" },
      { slug: "s-block-elements", name: "s-Block Elements" },
      { slug: "p-block-elements", name: "p-Block Elements" },
      { slug: "d-and-f-block-elements", name: "d and f Block Elements" },
      { slug: "coordination-compounds", name: "Coordination Compounds" },
      { slug: "general-organic-chemistry", name: "General Organic Chemistry" },
      { slug: "hydrocarbons", name: "Hydrocarbons" },
      { slug: "organic-compounds-containing-halogens", name: "Organic Compounds Containing Halogens" },
      { slug: "organic-compounds-containing-oxygen", name: "Organic Compounds Containing Oxygen" },
      { slug: "organic-compounds-containing-nitrogen", name: "Organic Compounds Containing Nitrogen" },
      { slug: "polymers", name: "Polymers" },
      { slug: "biomolecules", name: "Biomolecules" },
      { slug: "chemistry-in-everyday-life", name: "Chemistry in Everyday Life" },
      { slug: "environmental-chemistry", name: "Environmental Chemistry" },
      { slug: "principles-related-to-practical-chemistry", name: "Practical Chemistry" },
      { slug: "iupac-nomenclature", name: "IUPAC Nomenclature" },
      { slug: "isomerism", name: "Isomerism" },
      { slug: "goc-concepts", name: "GOC Concepts" },
      { slug: "purification", name: "Purification" },
    ],
    mathematics: [
      { slug: "sets-and-relations", name: "Sets and Relations" },
      { slug: "complex-numbers", name: "Complex Numbers" },
      { slug: "quadratic-equations", name: "Quadratic Equations" },
      { slug: "sequences-and-series", name: "Sequences and Series" },
      { slug: "binomial-theorem", name: "Binomial Theorem" },
      { slug: "permutations-and-combinations", name: "Permutations and Combinations" },
      { slug: "mathematical-induction", name: "Mathematical Induction" },
      { slug: "limits-and-derivatives", name: "Limits and Derivatives" },
      { slug: "continuity-and-differentiability", name: "Continuity and Differentiability" },
      { slug: "applications-of-derivatives", name: "Applications of Derivatives" },
      { slug: "integrals", name: "Integrals" },
      { slug: "applications-of-integrals", name: "Applications of Integrals" },
      { slug: "differential-equations", name: "Differential Equations" },
      { slug: "coordinate-geometry-straight-lines", name: "Coordinate Geometry (Straight Lines)" },
      { slug: "circles", name: "Circles" },
      { slug: "conic-sections", name: "Conic Sections" },
      { slug: "three-dimensional-geometry", name: "Three Dimensional Geometry" },
      { slug: "vectors-3d", name: "Vectors 3D" },
      { slug: "statistics", name: "Statistics" },
      { slug: "probability", name: "Probability" },
      { slug: "mathematical-reasoning", name: "Mathematical Reasoning" },
      { slug: "matrices-and-determinants", name: "Matrices and Determinants" },
      { slug: "trigonometric-functions", name: "Trigonometric Functions" },
      { slug: "inverse-trigonometric-functions", name: "Inverse Trigonometric Functions" },
      { slug: "trigonometric-equations", name: "Trigonometric Equations" },
      { slug: "properties-of-triangles", name: "Properties of Triangles" },
      { slug: "heights-and-distances", name: "Heights and Distances" },
    ],
  },
  "jee-advanced": {
    physics: [
      { slug: "units-and-dimensions", name: "Units & Dimensions" },
      { slug: "vectors", name: "Vectors" },
      { slug: "kinematics", name: "Kinematics" },
      { slug: "newtons-laws-of-motion", name: "Newton's Laws of Motion" },
      { slug: "work-power-energy", name: "Work, Power & Energy" },
      { slug: "center-of-mass", name: "Center of Mass" },
      { slug: "rotational-motion", name: "Rotational Motion" },
      { slug: "gravitation", name: "Gravitation" },
      { slug: "properties-of-matter", name: "Properties of Matter" },
      { slug: "fluid-mechanics", name: "Fluid Mechanics" },
      { slug: "thermal-physics", name: "Thermal Physics" },
      { slug: "thermodynamics", name: "Thermodynamics" },
      { slug: "kinetic-theory", name: "Kinetic Theory" },
      { slug: "oscillations", name: "Oscillations" },
      { slug: "waves", name: "Waves" },
      { slug: "electrostatics", name: "Electrostatics" },
      { slug: "capacitance", name: "Capacitance" },
      { slug: "current-electricity", name: "Current Electricity" },
      { slug: "magnetic-effects", name: "Magnetic Effects" },
      { slug: "electromagnetic-induction", name: "Electromagnetic Induction" },
      { slug: "alternating-current", name: "Alternating Current" },
      { slug: "electromagnetic-waves", name: "Electromagnetic Waves" },
      { slug: "ray-optics", name: "Ray Optics" },
      { slug: "wave-optics", name: "Wave Optics" },
      { slug: "modern-physics", name: "Modern Physics" },
      { slug: "experimental-physics", name: "Experimental Physics" },
    ],
    chemistry: [
      { slug: "atomic-structure", name: "Atomic Structure" },
      { slug: "chemical-bonding", name: "Chemical Bonding" },
      { slug: "gaseous-state", name: "Gaseous State" },
      { slug: "chemical-thermodynamics", name: "Chemical Thermodynamics" },
      { slug: "chemical-equilibrium", name: "Chemical Equilibrium" },
      { slug: "ionic-equilibrium", name: "Ionic Equilibrium" },
      { slug: "redox", name: "Redox" },
      { slug: "solutions", name: "Solutions" },
      { slug: "electrochemistry", name: "Electrochemistry" },
      { slug: "chemical-kinetics", name: "Chemical Kinetics" },
      { slug: "surface-chemistry", name: "Surface Chemistry" },
      { slug: "solid-state", name: "Solid State" },
      { slug: "periodic-properties", name: "Periodic Properties" },
      { slug: "hydrogen", name: "Hydrogen" },
      { slug: "s-block", name: "s-Block" },
      { slug: "p-block", name: "p-Block" },
      { slug: "d-and-f-block", name: "d and f Block" },
      { slug: "coordination-compounds", name: "Coordination Compounds" },
      { slug: "general-organic-chemistry", name: "General Organic Chemistry" },
      { slug: "hydrocarbons", name: "Hydrocarbons" },
      { slug: "alkyl-halides", name: "Alkyl Halides" },
      { slug: "alcohols-ethers", name: "Alcohols & Ethers" },
      { slug: "aldehydes-ketones", name: "Aldehydes & Ketones" },
      { slug: "carboxylic-acids", name: "Carboxylic Acids" },
      { slug: "amines", name: "Amines" },
      { slug: "polymers", name: "Polymers" },
      { slug: "biomolecules", name: "Biomolecules" },
      { slug: "analytical-chemistry", name: "Analytical Chemistry" },
      { slug: "qualitative-analysis", name: "Qualitative Analysis" },
      { slug: "iupac", name: "IUPAC" },
      { slug: "isomerism", name: "Isomerism" },
      { slug: "goc", name: "GOC" },
    ],
    mathematics: [
      { slug: "sets-relations-functions", name: "Sets, Relations & Functions" },
      { slug: "complex-numbers", name: "Complex Numbers" },
      { slug: "quadratic-equations", name: "Quadratic Equations" },
      { slug: "sequences-series", name: "Sequences & Series" },
      { slug: "binomial-theorem", name: "Binomial Theorem" },
      { slug: "permutations-combinations", name: "Permutations & Combinations" },
      { slug: "mathematical-induction", name: "Mathematical Induction" },
      { slug: "limits-continuity-differentiability", name: "Limits, Continuity & Differentiability" },
      { slug: "derivatives", name: "Derivatives" },
      { slug: "applications-of-derivatives", name: "Applications of Derivatives" },
      { slug: "indefinite-integrals", name: "Indefinite Integrals" },
      { slug: "definite-integrals", name: "Definite Integrals" },
      { slug: "differential-equations", name: "Differential Equations" },
      { slug: "straight-lines", name: "Straight Lines" },
      { slug: "circles", name: "Circles" },
      { slug: "parabola", name: "Parabola" },
      { slug: "ellipse", name: "Ellipse" },
      { slug: "hyperbola", name: "Hyperbola" },
      { slug: "3d-geometry", name: "3D Geometry" },
      { slug: "vectors", name: "Vectors" },
      { slug: "statistics", name: "Statistics" },
      { slug: "probability", name: "Probability" },
      { slug: "matrices-determinants", name: "Matrices & Determinants" },
      { slug: "trigonometric-functions", name: "Trigonometric Functions" },
      { slug: "inverse-trigonometric-functions", name: "Inverse Trigonometric Functions" },
      { slug: "trigonometric-equations", name: "Trigonometric Equations" },
    ],
  },
};

async function main() {
  const subjects = await db.subject.findMany();
  const subjectMap: Record<string, string> = {};
  subjects.forEach((s) => (subjectMap[s.slug] = s.id));

  const dbChapters = await db.chapter.findMany({
    include: { subject: true, _count: { select: { questions: true } } },
    orderBy: [{ examType: "asc" }, { subject: { name: "asc" } }, { name: "asc" }],
  });

  // Build a lookup: (examType, subjectSlug, slug) => chapter
  const dbLookup = new Map<string, (typeof dbChapters)[number]>();
  for (const ch of dbChapters) {
    const key = `${ch.examType}::${ch.subject.slug}::${ch.slug}`;
    dbLookup.set(key, ch);
  }

  console.log("=".repeat(80));
  console.log("CHAPTER VERIFICATION REPORT");
  console.log("=".repeat(80));
  console.log(`\nTotal chapters in DB: ${dbChapters.length}`);
  console.log(`Subjects in DB: ${subjects.map((s) => s.slug).join(", ")}`);

  // Count by exam/subject
  const counts = new Map<string, number>();
  for (const ch of dbChapters) {
    const key = `${ch.examType}/${ch.subject.slug}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  console.log("\n--- Current DB Counts ---");
  for (const [key, count] of [...counts.entries()].sort()) {
    console.log(`  ${key}: ${count} chapters`);
  }

  // Now compare against canonical
  let totalExpected = 0;
  let totalMatching = 0;
  let totalMissing = 0;
  let totalExtra = 0;
  const missing: { exam: string; subject: string; slug: string; name: string }[] = [];
  const extra: { exam: string; subject: string; slug: string; name: string; questionCount: number }[] = [];
  const matching: { exam: string; subject: string; slug: string }[] = [];

  for (const [examType, subjects_] of Object.entries(CANONICAL)) {
    for (const [subjectSlug, chapters] of Object.entries(subjects_)) {
      for (const ch of chapters) {
        totalExpected++;
        const key = `${examType}::${subjectSlug}::${ch.slug}`;
        if (dbLookup.has(key)) {
          totalMatching++;
          matching.push({ exam: examType, subject: subjectSlug, slug: ch.slug });
        } else {
          totalMissing++;
          missing.push({ exam: examType, subject: subjectSlug, slug: ch.slug, name: ch.name });
        }
      }
    }
  }

  // Find extra chapters (in DB but not in canonical)
  const canonicalKeys = new Set<string>();
  for (const [examType, subjects_] of Object.entries(CANONICAL)) {
    for (const [subjectSlug, chapters] of Object.entries(subjects_)) {
      for (const ch of chapters) {
        canonicalKeys.add(`${examType}::${subjectSlug}::${ch.slug}`);
      }
    }
  }

  for (const [key, ch] of dbLookup) {
    if (!canonicalKeys.has(key)) {
      totalExtra++;
      extra.push({
        exam: ch.examType,
        subject: ch.subject.slug,
        slug: ch.slug,
        name: ch.name,
        questionCount: ch._count.questions,
      });
    }
  }

  console.log(`\n--- Comparison ---`);
  console.log(`  Expected (canonical): ${totalExpected}`);
  console.log(`  Matching slugs:      ${totalMatching}`);
  console.log(`  Missing from DB:     ${totalMissing}`);
  console.log(`  Extra in DB:         ${totalExtra}`);
  console.log(`  Current DB total:    ${dbChapters.length}`);
  console.log(`  Target total:        ${totalExpected}`);

  if (missing.length > 0) {
    console.log(`\n--- MISSING CHAPTERS (${missing.length}) ---`);
    for (const m of missing) {
      console.log(`  [${m.exam}/${m.subject}] ${m.slug} (${m.name})`);
    }
  }

  if (extra.length > 0) {
    console.log(`\n--- EXTRA CHAPTERS IN DB (${extra.length}) ---`);
    for (const e of extra) {
      console.log(`  [${e.exam}/${e.subject}] ${e.slug} ("${e.name}") [${e.questionCount} questions]`);
    }
  }

  // Summary by exam/subject
  console.log(`\n--- Detailed Breakdown ---`);
  for (const [examType, subjects_] of Object.entries(CANONICAL)) {
    for (const [subjectSlug, chapters] of Object.entries(subjects_)) {
      const inDb = chapters.filter(
        (ch) => dbLookup.has(`${examType}::${subjectSlug}::${ch.slug}`)
      ).length;
      const missingCount = chapters.length - inDb;
      const status = missingCount === 0 ? "✅" : `❌ missing ${missingCount}`;
      console.log(
        `  ${examType}/${subjectSlug}: ${inDb}/${chapters.length} ${status}`
      );
    }
  }

  // Export missing data as JSON for fix script
  if (missing.length > 0 || extra.length > 0) {
    console.log(`\n--- ACTION NEEDED ---`);
    if (missing.length > 0) {
      console.log(`  Need to ADD ${missing.length} chapters`);
    }
    if (extra.length > 0) {
      const extraWithQuestions = extra.filter((e) => e.questionCount > 0);
      const extraWithoutQuestions = extra.filter((e) => e.questionCount === 0);
      console.log(`  Need to REMOVE ${extra.length} stale chapters`);
      console.log(`    - ${extraWithQuestions.length} have linked questions (careful!)`);
      console.log(`    - ${extraWithoutQuestions.length} have no questions (safe to remove)`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());