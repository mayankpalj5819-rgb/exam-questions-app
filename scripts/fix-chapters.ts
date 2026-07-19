import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  datasourceUrl: "file:/home/z/my-project/db/custom.db",
});

// ===== THE CANONICAL EXAMSIDE SLUGS (ground truth from task) =====
const CANONICAL: Record<string, Record<string, { slug: string; name: string; category: string }[]>> = {
  "jee-main": {
    physics: [
      { slug: "units-and-dimensions", name: "Units & Dimensions", category: "Mechanics" },
      { slug: "vectors", name: "Vectors", category: "Mechanics" },
      { slug: "kinematics", name: "Kinematics", category: "Mechanics" },
      { slug: "newtons-laws-of-motion", name: "Newton's Laws of Motion", category: "Mechanics" },
      { slug: "work-power-and-energy", name: "Work, Power & Energy", category: "Mechanics" },
      { slug: "center-of-mass-and-momentum", name: "Center of Mass & Momentum", category: "Mechanics" },
      { slug: "rotational-motion", name: "Rotational Motion", category: "Mechanics" },
      { slug: "gravitation", name: "Gravitation", category: "Mechanics" },
      { slug: "properties-of-matter", name: "Properties of Matter", category: "Mechanics" },
      { slug: "fluid-mechanics", name: "Fluid Mechanics", category: "Mechanics" },
      { slug: "thermal-properties-of-matter", name: "Thermal Properties of Matter", category: "Thermal" },
      { slug: "thermodynamics", name: "Thermodynamics", category: "Thermal" },
      { slug: "kinetic-theory-of-gases", name: "Kinetic Theory of Gases", category: "Thermal" },
      { slug: "oscillations", name: "Oscillations", category: "Waves" },
      { slug: "waves", name: "Waves", category: "Waves" },
      { slug: "electrostatics", name: "Electrostatics", category: "Electricity" },
      { slug: "capacitance", name: "Capacitance", category: "Electricity" },
      { slug: "current-electricity", name: "Current Electricity", category: "Electricity" },
      { slug: "magnetic-effects-of-current", name: "Magnetic Effects of Current", category: "Electricity" },
      { slug: "electromagnetic-induction", name: "Electromagnetic Induction", category: "Electricity" },
      { slug: "alternating-current", name: "Alternating Current", category: "Electricity" },
      { slug: "electromagnetic-waves", name: "Electromagnetic Waves", category: "Optics" },
      { slug: "ray-optics", name: "Ray Optics", category: "Optics" },
      { slug: "wave-optics", name: "Wave Optics", category: "Optics" },
      { slug: "dual-nature-of-radiation", name: "Dual Nature of Radiation", category: "Modern Physics" },
      { slug: "atoms-and-nuclei", name: "Atoms and Nuclei", category: "Modern Physics" },
      { slug: "electronic-devices", name: "Electronic Devices", category: "Modern Physics" },
      { slug: "communication-system", name: "Communication System", category: "Modern Physics" },
      { slug: "experimental-physics", name: "Experimental Physics", category: "General" },
      { slug: "semiconductors", name: "Semiconductors", category: "Modern Physics" },
    ],
    chemistry: [
      { slug: "some-basic-concepts-of-chemistry", name: "Some Basic Concepts of Chemistry", category: "Physical Chemistry" },
      { slug: "atomic-structure", name: "Atomic Structure", category: "Physical Chemistry" },
      { slug: "chemical-bonding", name: "Chemical Bonding", category: "Physical Chemistry" },
      { slug: "states-of-matter", name: "States of Matter", category: "Physical Chemistry" },
      { slug: "chemical-thermodynamics", name: "Chemical Thermodynamics", category: "Physical Chemistry" },
      { slug: "equilibrium", name: "Equilibrium", category: "Physical Chemistry" },
      { slug: "redox-reactions", name: "Redox Reactions", category: "Physical Chemistry" },
      { slug: "solutions", name: "Solutions", category: "Physical Chemistry" },
      { slug: "electrochemistry", name: "Electrochemistry", category: "Physical Chemistry" },
      { slug: "chemical-kinetics", name: "Chemical Kinetics", category: "Physical Chemistry" },
      { slug: "surface-chemistry", name: "Surface Chemistry", category: "Physical Chemistry" },
      { slug: "periodic-table", name: "Periodic Table", category: "Inorganic Chemistry" },
      { slug: "hydrogen", name: "Hydrogen", category: "Inorganic Chemistry" },
      { slug: "s-block-elements", name: "s-Block Elements", category: "Inorganic Chemistry" },
      { slug: "p-block-elements", name: "p-Block Elements", category: "Inorganic Chemistry" },
      { slug: "d-and-f-block-elements", name: "d and f Block Elements", category: "Inorganic Chemistry" },
      { slug: "coordination-compounds", name: "Coordination Compounds", category: "Inorganic Chemistry" },
      { slug: "general-organic-chemistry", name: "General Organic Chemistry", category: "Organic Chemistry" },
      { slug: "hydrocarbons", name: "Hydrocarbons", category: "Organic Chemistry" },
      { slug: "organic-compounds-containing-halogens", name: "Organic Compounds Containing Halogens", category: "Organic Chemistry" },
      { slug: "organic-compounds-containing-oxygen", name: "Organic Compounds Containing Oxygen", category: "Organic Chemistry" },
      { slug: "organic-compounds-containing-nitrogen", name: "Organic Compounds Containing Nitrogen", category: "Organic Chemistry" },
      { slug: "polymers", name: "Polymers", category: "Organic Chemistry" },
      { slug: "biomolecules", name: "Biomolecules", category: "Organic Chemistry" },
      { slug: "chemistry-in-everyday-life", name: "Chemistry in Everyday Life", category: "Organic Chemistry" },
      { slug: "environmental-chemistry", name: "Environmental Chemistry", category: "Inorganic Chemistry" },
      { slug: "principles-related-to-practical-chemistry", name: "Practical Chemistry", category: "Inorganic Chemistry" },
      { slug: "iupac-nomenclature", name: "IUPAC Nomenclature", category: "Organic Chemistry" },
      { slug: "isomerism", name: "Isomerism", category: "Organic Chemistry" },
      { slug: "goc-concepts", name: "GOC Concepts", category: "Organic Chemistry" },
      { slug: "purification", name: "Purification", category: "Organic Chemistry" },
    ],
    mathematics: [
      { slug: "sets-and-relations", name: "Sets and Relations", category: "Algebra" },
      { slug: "complex-numbers", name: "Complex Numbers", category: "Algebra" },
      { slug: "quadratic-equations", name: "Quadratic Equations", category: "Algebra" },
      { slug: "sequences-and-series", name: "Sequences and Series", category: "Algebra" },
      { slug: "binomial-theorem", name: "Binomial Theorem", category: "Algebra" },
      { slug: "permutations-and-combinations", name: "Permutations and Combinations", category: "Algebra" },
      { slug: "mathematical-induction", name: "Mathematical Induction", category: "Algebra" },
      { slug: "limits-and-derivatives", name: "Limits and Derivatives", category: "Calculus" },
      { slug: "continuity-and-differentiability", name: "Continuity and Differentiability", category: "Calculus" },
      { slug: "applications-of-derivatives", name: "Applications of Derivatives", category: "Calculus" },
      { slug: "integrals", name: "Integrals", category: "Calculus" },
      { slug: "applications-of-integrals", name: "Applications of Integrals", category: "Calculus" },
      { slug: "differential-equations", name: "Differential Equations", category: "Calculus" },
      { slug: "coordinate-geometry-straight-lines", name: "Coordinate Geometry (Straight Lines)", category: "Coordinate Geometry" },
      { slug: "circles", name: "Circles", category: "Coordinate Geometry" },
      { slug: "conic-sections", name: "Conic Sections", category: "Coordinate Geometry" },
      { slug: "three-dimensional-geometry", name: "Three Dimensional Geometry", category: "Coordinate Geometry" },
      { slug: "vectors-3d", name: "Vectors 3D", category: "Coordinate Geometry" },
      { slug: "statistics", name: "Statistics", category: "Algebra" },
      { slug: "probability", name: "Probability", category: "Algebra" },
      { slug: "mathematical-reasoning", name: "Mathematical Reasoning", category: "Algebra" },
      { slug: "matrices-and-determinants", name: "Matrices and Determinants", category: "Algebra" },
      { slug: "trigonometric-functions", name: "Trigonometric Functions", category: "Trigonometry" },
      { slug: "inverse-trigonometric-functions", name: "Inverse Trigonometric Functions", category: "Trigonometry" },
      { slug: "trigonometric-equations", name: "Trigonometric Equations", category: "Trigonometry" },
      { slug: "properties-of-triangles", name: "Properties of Triangles", category: "Trigonometry" },
      { slug: "heights-and-distances", name: "Heights and Distances", category: "Trigonometry" },
    ],
  },
  "jee-advanced": {
    physics: [
      { slug: "units-and-dimensions", name: "Units & Dimensions", category: "General" },
      { slug: "vectors", name: "Vectors", category: "Mechanics" },
      { slug: "kinematics", name: "Kinematics", category: "Mechanics" },
      { slug: "newtons-laws-of-motion", name: "Newton's Laws of Motion", category: "Mechanics" },
      { slug: "work-power-energy", name: "Work, Power & Energy", category: "Mechanics" },
      { slug: "center-of-mass", name: "Center of Mass", category: "Mechanics" },
      { slug: "rotational-motion", name: "Rotational Motion", category: "Mechanics" },
      { slug: "gravitation", name: "Gravitation", category: "Mechanics" },
      { slug: "properties-of-matter", name: "Properties of Matter", category: "Mechanics" },
      { slug: "fluid-mechanics", name: "Fluid Mechanics", category: "Mechanics" },
      { slug: "thermal-physics", name: "Thermal Physics", category: "Thermal" },
      { slug: "thermodynamics", name: "Thermodynamics", category: "Thermal" },
      { slug: "kinetic-theory", name: "Kinetic Theory", category: "Thermal" },
      { slug: "oscillations", name: "Oscillations", category: "Waves" },
      { slug: "waves", name: "Waves", category: "Waves" },
      { slug: "electrostatics", name: "Electrostatics", category: "Electricity & Magnetism" },
      { slug: "capacitance", name: "Capacitance", category: "Electricity & Magnetism" },
      { slug: "current-electricity", name: "Current Electricity", category: "Electricity & Magnetism" },
      { slug: "magnetic-effects", name: "Magnetic Effects", category: "Electricity & Magnetism" },
      { slug: "electromagnetic-induction", name: "Electromagnetic Induction", category: "Electricity & Magnetism" },
      { slug: "alternating-current", name: "Alternating Current", category: "Electricity & Magnetism" },
      { slug: "electromagnetic-waves", name: "Electromagnetic Waves", category: "Optics" },
      { slug: "ray-optics", name: "Ray Optics", category: "Optics" },
      { slug: "wave-optics", name: "Wave Optics", category: "Optics" },
      { slug: "modern-physics", name: "Modern Physics", category: "Modern Physics" },
      { slug: "experimental-physics", name: "Experimental Physics", category: "General" },
    ],
    chemistry: [
      { slug: "atomic-structure", name: "Atomic Structure", category: "Physical Chemistry" },
      { slug: "chemical-bonding", name: "Chemical Bonding", category: "Physical Chemistry" },
      { slug: "gaseous-state", name: "Gaseous State", category: "Physical Chemistry" },
      { slug: "chemical-thermodynamics", name: "Chemical Thermodynamics", category: "Physical Chemistry" },
      { slug: "chemical-equilibrium", name: "Chemical Equilibrium", category: "Physical Chemistry" },
      { slug: "ionic-equilibrium", name: "Ionic Equilibrium", category: "Physical Chemistry" },
      { slug: "redox", name: "Redox", category: "Physical Chemistry" },
      { slug: "solutions", name: "Solutions", category: "Physical Chemistry" },
      { slug: "electrochemistry", name: "Electrochemistry", category: "Physical Chemistry" },
      { slug: "chemical-kinetics", name: "Chemical Kinetics", category: "Physical Chemistry" },
      { slug: "surface-chemistry", name: "Surface Chemistry", category: "Physical Chemistry" },
      { slug: "solid-state", name: "Solid State", category: "Physical Chemistry" },
      { slug: "periodic-properties", name: "Periodic Properties", category: "Inorganic Chemistry" },
      { slug: "hydrogen", name: "Hydrogen", category: "Inorganic Chemistry" },
      { slug: "s-block", name: "s-Block", category: "Inorganic Chemistry" },
      { slug: "p-block", name: "p-Block", category: "Inorganic Chemistry" },
      { slug: "d-and-f-block", name: "d and f Block", category: "Inorganic Chemistry" },
      { slug: "coordination-compounds", name: "Coordination Compounds", category: "Inorganic Chemistry" },
      { slug: "general-organic-chemistry", name: "General Organic Chemistry", category: "Organic Chemistry" },
      { slug: "hydrocarbons", name: "Hydrocarbons", category: "Organic Chemistry" },
      { slug: "alkyl-halides", name: "Alkyl Halides", category: "Organic Chemistry" },
      { slug: "alcohols-ethers", name: "Alcohols & Ethers", category: "Organic Chemistry" },
      { slug: "aldehydes-ketones", name: "Aldehydes & Ketones", category: "Organic Chemistry" },
      { slug: "carboxylic-acids", name: "Carboxylic Acids", category: "Organic Chemistry" },
      { slug: "amines", name: "Amines", category: "Organic Chemistry" },
      { slug: "polymers", name: "Polymers", category: "Organic Chemistry" },
      { slug: "biomolecules", name: "Biomolecules", category: "Organic Chemistry" },
      { slug: "analytical-chemistry", name: "Analytical Chemistry", category: "Inorganic Chemistry" },
      { slug: "qualitative-analysis", name: "Qualitative Analysis", category: "Inorganic Chemistry" },
      { slug: "iupac", name: "IUPAC", category: "Organic Chemistry" },
      { slug: "isomerism", name: "Isomerism", category: "Organic Chemistry" },
      { slug: "goc", name: "GOC", category: "Organic Chemistry" },
    ],
    mathematics: [
      { slug: "sets-relations-functions", name: "Sets, Relations & Functions", category: "Algebra" },
      { slug: "complex-numbers", name: "Complex Numbers", category: "Algebra" },
      { slug: "quadratic-equations", name: "Quadratic Equations", category: "Algebra" },
      { slug: "sequences-series", name: "Sequences & Series", category: "Algebra" },
      { slug: "binomial-theorem", name: "Binomial Theorem", category: "Algebra" },
      { slug: "permutations-combinations", name: "Permutations & Combinations", category: "Algebra" },
      { slug: "mathematical-induction", name: "Mathematical Induction", category: "Algebra" },
      { slug: "limits-continuity-differentiability", name: "Limits, Continuity & Differentiability", category: "Calculus" },
      { slug: "derivatives", name: "Derivatives", category: "Calculus" },
      { slug: "applications-of-derivatives", name: "Applications of Derivatives", category: "Calculus" },
      { slug: "indefinite-integrals", name: "Indefinite Integrals", category: "Calculus" },
      { slug: "definite-integrals", name: "Definite Integrals", category: "Calculus" },
      { slug: "differential-equations", name: "Differential Equations", category: "Calculus" },
      { slug: "straight-lines", name: "Straight Lines", category: "Coordinate Geometry" },
      { slug: "circles", name: "Circles", category: "Coordinate Geometry" },
      { slug: "parabola", name: "Parabola", category: "Coordinate Geometry" },
      { slug: "ellipse", name: "Ellipse", category: "Coordinate Geometry" },
      { slug: "hyperbola", name: "Hyperbola", category: "Coordinate Geometry" },
      { slug: "3d-geometry", name: "3D Geometry", category: "Coordinate Geometry" },
      { slug: "vectors", name: "Vectors", category: "Algebra" },
      { slug: "statistics", name: "Statistics", category: "Algebra" },
      { slug: "probability", name: "Probability", category: "Algebra" },
      { slug: "matrices-determinants", name: "Matrices & Determinants", category: "Algebra" },
      { slug: "trigonometric-functions", name: "Trigonometric Functions", category: "Trigonometry" },
      { slug: "inverse-trigonometric-functions", name: "Inverse Trigonometric Functions", category: "Trigonometry" },
      { slug: "trigonometric-equations", name: "Trigonometric Equations", category: "Trigonometry" },
    ],
  },
};

async function main() {
  const subjects = await db.subject.findMany();
  const subjectMap: Record<string, string> = {};
  subjects.forEach((s) => (subjectMap[s.slug] = s.id));

  // Build set of all canonical keys
  const canonicalKeys = new Set<string>();
  let totalCanonical = 0;
  for (const [examType, subjects_] of Object.entries(CANONICAL)) {
    for (const [subjectSlug, chapters] of Object.entries(subjects_)) {
      for (const ch of chapters) {
        canonicalKeys.add(`${examType}::${subjectSlug}::${ch.slug}`);
        totalCanonical++;
      }
    }
  }

  // Get all DB chapters
  const dbChapters = await db.chapter.findMany({
    include: { subject: true, _count: { select: { questions: true } } },
  });

  // Identify chapters to delete (in DB but NOT in canonical)
  const toDelete = dbChapters.filter((ch) => {
    const key = `${ch.examType}::${ch.subject.slug}::${ch.slug}`;
    return !canonicalKeys.has(key);
  });

  console.log(`=== CHAPTER FIX SCRIPT ===\n`);
  console.log(`Total canonical chapters: ${totalCanonical}`);
  console.log(`Current DB chapters: ${dbChapters.length}`);
  console.log(`Chapters to DELETE (wrong slugs): ${toDelete.length}`);

  // Safety check: ensure no questions linked
  const withQuestions = toDelete.filter((ch) => ch._count.questions > 0);
  if (withQuestions.length > 0) {
    console.error(`\n⚠️  ABORT: ${withQuestions.length} chapters to delete have linked questions!`);
    for (const ch of withQuestions) {
      console.error(`  ${ch.examType}/${ch.subject.slug}/${ch.slug}: ${ch._count.questions} questions`);
    }
    process.exit(1);
  }

  // Delete stale chapters
  console.log(`\n--- Deleting ${toDelete.length} stale chapters ---`);
  const deleteIds = toDelete.map((ch) => ch.id);
  if (deleteIds.length > 0) {
    const deleteResult = await db.chapter.deleteMany({
      where: { id: { in: deleteIds } },
    });
    console.log(`  Deleted ${deleteResult.count} chapters`);
  }

  // Now add missing chapters
  let created = 0;
  let skipped = 0;
  console.log(`\n--- Adding missing canonical chapters ---`);

  for (const [examType, subjects_] of Object.entries(CANONICAL)) {
    for (const [subjectSlug, chapters] of Object.entries(subjects_)) {
      const subjectId = subjectMap[subjectSlug];
      if (!subjectId) {
        console.error(`  ⚠ Subject not found: ${subjectSlug}`);
        continue;
      }

      for (const ch of chapters) {
        try {
          await db.chapter.create({
            data: {
              name: ch.name,
              slug: ch.slug,
              category: ch.category,
              subjectId,
              examType,
            },
          });
          created++;
          console.log(`  + [${examType}/${subjectSlug}] ${ch.slug}`);
        } catch (e: any) {
          if (e.message?.includes("Unique")) {
            skipped++;
          } else {
            console.error(`  ✗ Error creating ${ch.slug}: ${e.message}`);
          }
        }
      }
    }
  }

  console.log(`\n--- Final Count ---`);
  const finalCount = await db.chapter.groupBy({
    by: ["examType", "subjectId"],
    _count: true,
  });

  let grandTotal = 0;
  for (const c of finalCount) {
    const subj = subjects.find((s) => s.id === c.subjectId);
    console.log(`  ${c.examType}/${subj?.slug}: ${c._count} chapters`);
    grandTotal += c._count;
  }
  console.log(`\n  GRAND TOTAL: ${grandTotal} chapters`);
  console.log(`  Created: ${created}, Skipped (already exist): ${skipped}, Deleted: ${deleteIds.length}`);

  // Verify against canonical
  const finalChapters = await db.chapter.findMany({ include: { subject: true } });
  const finalKeys = new Set(finalChapters.map((c) => `${c.examType}::${c.subject.slug}::${c.slug}`));

  let missing = 0;
  for (const key of canonicalKeys) {
    if (!finalKeys.has(key)) {
      missing++;
      console.error(`  STILL MISSING: ${key}`);
    }
  }

  if (missing === 0) {
    console.log(`\n✅ ALL ${totalCanonical} canonical chapters are present in DB!`);
  } else {
    console.error(`\n❌ Still missing ${missing} chapters!`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());