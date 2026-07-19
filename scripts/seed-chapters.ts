import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({
  datasourceUrl: "file:/home/z/my-project/db/custom.db",
});

interface ChapterInfo {
  name: string;
  slug: string;
  category: string;
}

const subjects = [
  {
    name: "Physics",
    slug: "physics",
    icon: "Atom",
    color: "#ef4444",
    jeeMainChapters: [
      { name: "Units & Measurements", slug: "units-and-measurements", category: "Mechanics" },
      { name: "Vector Algebra", slug: "vector-algebra", category: "Mechanics" },
      { name: "Motion in a Straight Line", slug: "motion-in-a-straight-line", category: "Mechanics" },
      { name: "Motion in a Plane", slug: "motion-in-a-plane", category: "Mechanics" },
      { name: "Circular Motion", slug: "circular-motion", category: "Mechanics" },
      { name: "Laws of Motion", slug: "laws-of-motion", category: "Mechanics" },
      { name: "Work Power & Energy", slug: "work-power-and-energy", category: "Mechanics" },
      { name: "Center of Mass and Collision", slug: "center-of-mass", category: "Mechanics" },
      { name: "Rotational Motion", slug: "rotational-motion", category: "Mechanics" },
      { name: "Properties of Matter", slug: "properties-of-matter", category: "Mechanics" },
      { name: "Heat and Thermodynamics", slug: "heat-and-thermodynamics", category: "Mechanics" },
      { name: "Simple Harmonic Motion", slug: "simple-harmonic-motion", category: "Mechanics" },
      { name: "Waves", slug: "waves", category: "Mechanics" },
      { name: "Gravitation", slug: "gravitation", category: "Mechanics" },
      { name: "Electrostatics", slug: "electrostatics", category: "Electricity" },
      { name: "Current Electricity", slug: "current-electricity", category: "Electricity" },
      { name: "Capacitor", slug: "capacitor", category: "Electricity" },
      { name: "Magnetic Effect of Current", slug: "magnetic-effect-of-current", category: "Electricity" },
      { name: "Magnetic Properties of Matter", slug: "magnetic-properties-of-matter", category: "Electricity" },
      { name: "Electromagnetic Induction", slug: "electromagnetic-induction", category: "Electricity" },
      { name: "Alternating Current", slug: "alternating-current", category: "Electricity" },
      { name: "Electromagnetic Waves", slug: "electromagnetic-waves", category: "Electricity" },
      { name: "Wave Optics", slug: "wave-optics", category: "Optics" },
      { name: "Geometrical Optics", slug: "geometrical-optics", category: "Optics" },
      { name: "Atoms and Nuclei", slug: "atoms-and-nuclei", category: "Modern Physics" },
      { name: "Dual Nature of Radiation", slug: "dual-nature-of-radiation", category: "Modern Physics" },
      { name: "Semiconductor", slug: "semiconductor", category: "Modern Physics" },
      { name: "Communication Systems", slug: "communication-systems", category: "Modern Physics" },
    ] as ChapterInfo[],
    jeeAdvChapters: [
      { name: "Units & Measurements", slug: "units-and-measurements-adv", category: "General" },
      { name: "Kinematics", slug: "kinematics-adv", category: "Mechanics" },
      { name: "Newton's Laws of Motion", slug: "newtons-laws-adv", category: "Mechanics" },
      { name: "Work, Energy and Power", slug: "work-energy-adv", category: "Mechanics" },
      { name: "Center of Mass", slug: "center-of-mass-adv", category: "Mechanics" },
      { name: "Rotational Dynamics", slug: "rotational-dynamics-adv", category: "Mechanics" },
      { name: "Gravitation", slug: "gravitation-adv", category: "Mechanics" },
      { name: "Simple Harmonic Motion", slug: "shm-adv", category: "Mechanics" },
      { name: "Properties of Matter", slug: "properties-of-matter-adv", category: "Mechanics" },
      { name: "Wave Motion", slug: "wave-motion-adv", category: "Mechanics" },
      { name: "Heat and Thermodynamics", slug: "heat-thermo-adv", category: "Heat & Thermo" },
      { name: "Kinetic Theory of Gases", slug: "ktg-adv", category: "Heat & Thermo" },
      { name: "Coulomb's Law", slug: "coulombs-law-adv", category: "Electricity" },
      { name: "Electric Field & Potential", slug: "electric-field-adv", category: "Electricity" },
      { name: "Capacitance", slug: "capacitance-adv", category: "Electricity" },
      { name: "Current Electricity", slug: "current-electricity-adv", category: "Electricity" },
      { name: "Magnetic Effect of Current", slug: "magnetic-effect-adv", category: "Electricity" },
      { name: "Electromagnetic Induction", slug: "em-induction-adv", category: "Electricity" },
      { name: "Geometrical Optics", slug: "geometrical-optics-adv", category: "Optics" },
      { name: "Wave Optics", slug: "wave-optics-adv", category: "Optics" },
      { name: "Modern Physics", slug: "modern-physics-adv", category: "Modern Physics" },
    ] as ChapterInfo[],
  },
  {
    name: "Chemistry",
    slug: "chemistry",
    icon: "FlaskConical",
    color: "#22c55e",
    jeeMainChapters: [
      { name: "Atomic Structure", slug: "atomic-structure", category: "Physical Chemistry" },
      { name: "Chemical Bonding", slug: "chemical-bonding", category: "Physical Chemistry" },
      { name: "Chemical Thermodynamics", slug: "chemical-thermodynamics", category: "Physical Chemistry" },
      { name: "Solutions", slug: "solutions", category: "Physical Chemistry" },
      { name: "Equilibrium", slug: "equilibrium", category: "Physical Chemistry" },
      { name: "Redox Reactions", slug: "redox-reactions", category: "Physical Chemistry" },
      { name: "Electrochemistry", slug: "electrochemistry", category: "Physical Chemistry" },
      { name: "Chemical Kinetics", slug: "chemical-kinetics", category: "Physical Chemistry" },
      { name: "Solid State", slug: "solid-state", category: "Physical Chemistry" },
      { name: "Surface Chemistry", slug: "surface-chemistry", category: "Physical Chemistry" },
      { name: "Some Basic Concepts", slug: "some-basic-concepts", category: "Physical Chemistry" },
      { name: "States of Matter", slug: "states-of-matter", category: "Physical Chemistry" },
      { name: "IUPAC Nomenclature", slug: "iupac-nomenclature", category: "Organic Chemistry" },
      { name: "Isomerism", slug: "isomerism", category: "Organic Chemistry" },
      { name: "GOC", slug: "goc", category: "Organic Chemistry" },
      { name: "Hydrocarbons", slug: "hydrocarbons", category: "Organic Chemistry" },
      { name: "Alkyl Halides", slug: "alkyl-halides", category: "Organic Chemistry" },
      { name: "Alcohol, Phenol & Ether", slug: "alcohol-phenol-ether", category: "Organic Chemistry" },
      { name: "Aldehyde & Ketone", slug: "aldehyde-and-ketone", category: "Organic Chemistry" },
      { name: "Carboxylic Acid & Derivatives", slug: "carboxylic-acid-derivatives", category: "Organic Chemistry" },
      { name: "Amines", slug: "amines", category: "Organic Chemistry" },
      { name: "Biomolecules", slug: "biomolecules", category: "Organic Chemistry" },
      { name: "Polymers", slug: "polymers", category: "Organic Chemistry" },
      { name: "Periodic Table", slug: "periodic-table", category: "Inorganic Chemistry" },
      { name: "s-Block Elements", slug: "s-block-elements", category: "Inorganic Chemistry" },
      { name: "p-Block Elements", slug: "p-block-elements", category: "Inorganic Chemistry" },
      { name: "d & f Block Elements", slug: "d-and-f-block-elements", category: "Inorganic Chemistry" },
      { name: "Coordination Compounds", slug: "coordination-compounds", category: "Inorganic Chemistry" },
      { name: "Metallurgy", slug: "metallurgy", category: "Inorganic Chemistry" },
      { name: "Environmental Chemistry", slug: "environmental-chemistry", category: "Inorganic Chemistry" },
      { name: "Qualitative Analysis", slug: "qualitative-analysis", category: "Inorganic Chemistry" },
    ] as ChapterInfo[],
    jeeAdvChapters: [
      { name: "Atomic Structure", slug: "atomic-structure-adv", category: "Physical Chemistry" },
      { name: "Chemical Bonding", slug: "chemical-bonding-adv", category: "Physical Chemistry" },
      { name: "Chemical Thermodynamics", slug: "chemical-thermo-adv", category: "Physical Chemistry" },
      { name: "Solutions", slug: "solutions-adv", category: "Physical Chemistry" },
      { name: "Equilibrium", slug: "equilibrium-adv", category: "Physical Chemistry" },
      { name: "Electrochemistry", slug: "electrochemistry-adv", category: "Physical Chemistry" },
      { name: "Chemical Kinetics", slug: "chemical-kinetics-adv", category: "Physical Chemistry" },
      { name: "Solid State", slug: "solid-state-adv", category: "Physical Chemistry" },
      { name: "Surface Chemistry", slug: "surface-chemistry-adv", category: "Physical Chemistry" },
      { name: "Nuclear Chemistry", slug: "nuclear-chemistry-adv", category: "Physical Chemistry" },
      { name: "GOC", slug: "goc-adv", category: "Organic Chemistry" },
      { name: "Isomerism", slug: "isomerism-adv", category: "Organic Chemistry" },
      { name: "Hydrocarbons", slug: "hydrocarbons-adv", category: "Organic Chemistry" },
      { name: "Alkyl Halides", slug: "alkyl-halides-adv", category: "Organic Chemistry" },
      { name: "Alcohols & Ethers", slug: "alcohols-ethers-adv", category: "Organic Chemistry" },
      { name: "Carbonyl Compounds", slug: "carbonyl-compounds-adv", category: "Organic Chemistry" },
      { name: "Carboxylic Acids", slug: "carboxylic-acids-adv", category: "Organic Chemistry" },
      { name: "Amines", slug: "amines-adv", category: "Organic Chemistry" },
      { name: "Biomolecules", slug: "biomolecules-adv", category: "Organic Chemistry" },
      { name: "Periodic Table", slug: "periodic-table-adv", category: "Inorganic Chemistry" },
      { name: "s-Block", slug: "s-block-adv", category: "Inorganic Chemistry" },
      { name: "p-Block", slug: "p-block-adv", category: "Inorganic Chemistry" },
      { name: "d & f Block", slug: "d-f-block-adv", category: "Inorganic Chemistry" },
      { name: "Coordination Compounds", slug: "coordination-compounds-adv", category: "Inorganic Chemistry" },
      { name: "Qualitative Analysis", slug: "qualitative-analysis-adv", category: "Inorganic Chemistry" },
    ] as ChapterInfo[],
  },
  {
    name: "Mathematics",
    slug: "mathematics",
    icon: "Calculator",
    color: "#f59e0b",
    jeeMainChapters: [
      { name: "Sets", slug: "sets", category: "Algebra" },
      { name: "Relations & Functions", slug: "relations-and-functions", category: "Algebra" },
      { name: "Complex Numbers", slug: "complex-numbers", category: "Algebra" },
      { name: "Quadratic Equations", slug: "quadratic-equations", category: "Algebra" },
      { name: "Sequences & Series", slug: "sequences-and-series", category: "Algebra" },
      { name: "Binomial Theorem", slug: "binomial-theorem", category: "Algebra" },
      { name: "Permutations & Combinations", slug: "permutations-and-combinations", category: "Algebra" },
      { name: "Probability", slug: "probability", category: "Algebra" },
      { name: "Matrices & Determinants", slug: "matrices-and-determinants", category: "Algebra" },
      { name: "Mathematical Induction", slug: "mathematical-induction", category: "Algebra" },
      { name: "Statistics", slug: "statistics", category: "Algebra" },
      { name: "Straight Lines", slug: "straight-lines", category: "Coordinate Geometry" },
      { name: "Circles", slug: "circles", category: "Coordinate Geometry" },
      { name: "Conic Sections", slug: "conic-sections", category: "Coordinate Geometry" },
      { name: "Limits, Continuity and Differentiability", slug: "limits-continuity-and-differentiability", category: "Calculus" },
      { name: "Differentiation", slug: "differentiation", category: "Calculus" },
      { name: "Application of Derivatives", slug: "application-of-derivatives", category: "Calculus" },
      { name: "Indefinite Integrals", slug: "indefinite-integrals", category: "Calculus" },
      { name: "Definite Integration", slug: "definite-integration", category: "Calculus" },
      { name: "Area Under The Curves", slug: "area-under-the-curves", category: "Calculus" },
      { name: "Differential Equations", slug: "differential-equations", category: "Calculus" },
      { name: "Vectors", slug: "vectors", category: "3D Geometry" },
      { name: "3D Geometry", slug: "3d-geometry", category: "3D Geometry" },
      { name: "Trigonometric Functions", slug: "trigonometric-functions", category: "Trigonometry" },
      { name: "Trigonometric Equations", slug: "trigonometric-equations", category: "Trigonometry" },
      { name: "Inverse Trigonometry", slug: "inverse-trigonometry", category: "Trigonometry" },
      { name: "Properties of Triangles", slug: "properties-of-triangles", category: "Trigonometry" },
      { name: "Mathematical Reasoning", slug: "mathematical-reasoning", category: "Algebra" },
    ] as ChapterInfo[],
    jeeAdvChapters: [
      { name: "Sets & Relations", slug: "sets-relations-adv", category: "Algebra" },
      { name: "Functions", slug: "functions-adv", category: "Algebra" },
      { name: "Complex Numbers", slug: "complex-numbers-adv", category: "Algebra" },
      { name: "Quadratic Equations", slug: "quadratic-equations-adv", category: "Algebra" },
      { name: "Sequence & Series", slug: "sequence-series-adv", category: "Algebra" },
      { name: "Binomial Theorem", slug: "binomial-theorem-adv", category: "Algebra" },
      { name: "Permutations & Combinations", slug: "pnc-adv", category: "Algebra" },
      { name: "Probability", slug: "probability-adv", category: "Algebra" },
      { name: "Matrices & Determinants", slug: "matrices-determinants-adv", category: "Algebra" },
      { name: "Straight Lines", slug: "straight-lines-adv", category: "Coordinate Geometry" },
      { name: "Circles", slug: "circles-adv", category: "Coordinate Geometry" },
      { name: "Parabola", slug: "parabola-adv", category: "Coordinate Geometry" },
      { name: "Ellipse", slug: "ellipse-adv", category: "Coordinate Geometry" },
      { name: "Hyperbola", slug: "hyperbola-adv", category: "Coordinate Geometry" },
      { name: "Limits", slug: "limits-adv", category: "Calculus" },
      { name: "Continuity & Differentiability", slug: "continuity-diff-adv", category: "Calculus" },
      { name: "Differentiation", slug: "differentiation-adv", category: "Calculus" },
      { name: "Application of Derivatives", slug: "app-derivatives-adv", category: "Calculus" },
      { name: "Indefinite Integration", slug: "indefinite-int-adv", category: "Calculus" },
      { name: "Definite Integration", slug: "definite-int-adv", category: "Calculus" },
      { name: "Area Under Curves", slug: "area-curves-adv", category: "Calculus" },
      { name: "Differential Equations", slug: "diff-equations-adv", category: "Calculus" },
      { name: "Vectors", slug: "vectors-adv", category: "3D Geometry" },
      { name: "3D Geometry", slug: "3d-geometry-adv", category: "3D Geometry" },
      { name: "Trigonometry", slug: "trigonometry-adv", category: "Trigonometry" },
      { name: "Properties of Triangles", slug: "properties-triangles-adv", category: "Trigonometry" },
    ] as ChapterInfo[],
  },
];

async function seed() {
  console.log("Seeding subjects and chapters...\n");

  for (const subject of subjects) {
    const dbSubject = await db.subject.upsert({
      where: { slug: subject.slug },
      create: { name: subject.name, slug: subject.slug, icon: subject.icon, color: subject.color },
      update: { name: subject.name, icon: subject.icon, color: subject.color },
    });
    console.log(`Subject: ${dbSubject.name}`);

    for (const ch of subject.jeeMainChapters) {
      await db.chapter.upsert({
        where: { slug_subjectId_examType: { slug: ch.slug, subjectId: dbSubject.id, examType: "jee-main" } },
        create: { name: ch.name, slug: ch.slug, category: ch.category, subjectId: dbSubject.id, examType: "jee-main" },
        update: { name: ch.name, category: ch.category },
      });
    }
    console.log(`  JEE Main: ${subject.jeeMainChapters.length} chapters`);

    for (const ch of subject.jeeAdvChapters) {
      await db.chapter.upsert({
        where: { slug_subjectId_examType: { slug: ch.slug, subjectId: dbSubject.id, examType: "jee-advanced" } },
        create: { name: ch.name, slug: ch.slug, category: ch.category, subjectId: dbSubject.id, examType: "jee-advanced" },
        update: { name: ch.name, category: ch.category },
      });
    }
    console.log(`  JEE Advanced: ${subject.jeeAdvChapters.length} chapters\n`);
  }

  console.log("Seeding complete!");

  const totalChapters = await db.chapter.count();
  console.log(`Total chapters: ${totalChapters}`);
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect());