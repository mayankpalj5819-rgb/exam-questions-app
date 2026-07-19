import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  datasourceUrl: "file:/home/z/my-project/db/custom.db",
});

// ACTUAL ExamSide slugs scraped from the live site
const CHAPTER_DATA: Record<string, Record<string, { slug: string; name: string; category: string }[]>> = {
  "jee-main": {
    physics: [
      { slug: "units-and-measurements", name: "Units & Measurements", category: "Mechanics" },
      { slug: "vector-algebra", name: "Vector Algebra", category: "Mechanics" },
      { slug: "motion-in-a-straight-line", name: "Motion in a Straight Line", category: "Mechanics" },
      { slug: "motion-in-a-plane", name: "Motion in a Plane", category: "Mechanics" },
      { slug: "circular-motion", name: "Circular Motion", category: "Mechanics" },
      { slug: "laws-of-motion", name: "Laws of Motion", category: "Mechanics" },
      { slug: "work-power-and-energy", name: "Work, Power & Energy", category: "Mechanics" },
      { slug: "center-of-mass", name: "Centre of Mass", category: "Mechanics" },
      { slug: "rotational-motion", name: "Rotational Motion", category: "Mechanics" },
      { slug: "properties-of-matter", name: "Properties of Matter", category: "Mechanics" },
      { slug: "heat-and-thermodynamics", name: "Heat & Thermodynamics", category: "Thermal Physics" },
      { slug: "simple-harmonic-motion", name: "Simple Harmonic Motion", category: "Waves & Oscillations" },
      { slug: "waves", name: "Waves", category: "Waves & Oscillations" },
      { slug: "gravitation", name: "Gravitation", category: "Mechanics" },
      { slug: "electrostatics", name: "Electrostatics", category: "Electromagnetism" },
      { slug: "current-electricity", name: "Current Electricity", category: "Electromagnetism" },
      { slug: "capacitor", name: "Capacitor", category: "Electromagnetism" },
      { slug: "magnetics", name: "Magnetics", category: "Electromagnetism" },
      { slug: "magnetic-properties-of-matter", name: "Magnetic Properties of Matter", category: "Electromagnetism" },
      { slug: "electromagnetic-induction", name: "Electromagnetic Induction", category: "Electromagnetism" },
      { slug: "alternating-current", name: "Alternating Current", category: "Electromagnetism" },
      { slug: "electromagnetic-waves", name: "Electromagnetic Waves", category: "Optics" },
      { slug: "wave-optics", name: "Wave Optics", category: "Optics" },
      { slug: "geometrical-optics", name: "Geometrical Optics", category: "Optics" },
      { slug: "atoms-and-nuclei", name: "Atoms & Nuclei", category: "Modern Physics" },
      { slug: "dual-nature-of-radiation", name: "Dual Nature of Radiation", category: "Modern Physics" },
      { slug: "electronic-devices", name: "Electronic Devices", category: "Modern Physics" },
      { slug: "communication-systems", name: "Communication Systems", category: "Modern Physics" },
    ],
    chemistry: [
      { slug: "some-basic-concepts-of-chemistry", name: "Some Basic Concepts of Chemistry", category: "Physical Chemistry" },
      { slug: "structure-of-atom", name: "Structure of Atom", category: "Physical Chemistry" },
      { slug: "redox-reactions", name: "Redox Reactions", category: "Physical Chemistry" },
      { slug: "gaseous-state", name: "Gaseous State", category: "Physical Chemistry" },
      { slug: "chemical-equilibrium", name: "Chemical Equilibrium", category: "Physical Chemistry" },
      { slug: "ionic-equilibrium", name: "Ionic Equilibrium", category: "Physical Chemistry" },
      { slug: "solutions", name: "Solutions", category: "Physical Chemistry" },
      { slug: "thermodynamics", name: "Thermodynamics", category: "Physical Chemistry" },
      { slug: "electrochemistry", name: "Electrochemistry", category: "Physical Chemistry" },
      { slug: "chemical-kinetics-and-nuclear-chemistry", name: "Chemical Kinetics & Nuclear Chemistry", category: "Physical Chemistry" },
      { slug: "solid-state", name: "Solid State", category: "Physical Chemistry" },
      { slug: "surface-chemistry", name: "Surface Chemistry", category: "Physical Chemistry" },
      { slug: "periodic-table-and-periodicity", name: "Periodic Table & Periodicity", category: "Inorganic Chemistry" },
      { slug: "chemical-bonding-and-molecular-structure", name: "Chemical Bonding & Molecular Structure", category: "Inorganic Chemistry" },
      { slug: "isolation-of-elements", name: "Isolation of Elements", category: "Inorganic Chemistry" },
      { slug: "hydrogen", name: "Hydrogen", category: "Inorganic Chemistry" },
      { slug: "s-block-elements", name: "s-Block Elements", category: "Inorganic Chemistry" },
      { slug: "p-block-elements", name: "p-Block Elements", category: "Inorganic Chemistry" },
      { slug: "d-and-f-block-elements", name: "d & f Block Elements", category: "Inorganic Chemistry" },
      { slug: "coordination-compounds", name: "Coordination Compounds", category: "Inorganic Chemistry" },
      { slug: "salt-analysis", name: "Salt Analysis", category: "Inorganic Chemistry" },
      { slug: "environmental-chemistry", name: "Environmental Chemistry", category: "Inorganic Chemistry" },
      { slug: "basics-of-organic-chemistry", name: "Basics of Organic Chemistry", category: "Organic Chemistry" },
      { slug: "hydrocarbons", name: "Hydrocarbons", category: "Organic Chemistry" },
      { slug: "haloalkanes-and-haloarenes", name: "Haloalkanes & Haloarenes", category: "Organic Chemistry" },
      { slug: "alcohols-phenols-and-ethers", name: "Alcohols, Phenols & Ethers", category: "Organic Chemistry" },
      { slug: "aldehydes-ketones-and-carboxylic-acids", name: "Aldehydes, Ketones & Carboxylic Acids", category: "Organic Chemistry" },
      { slug: "compounds-containing-nitrogen", name: "Compounds Containing Nitrogen", category: "Organic Chemistry" },
      { slug: "polymers", name: "Polymers", category: "Organic Chemistry" },
      { slug: "biomolecules", name: "Biomolecules", category: "Organic Chemistry" },
      { slug: "chemistry-in-everyday-life", name: "Chemistry in Everyday Life", category: "Organic Chemistry" },
      { slug: "practical-organic-chemistry", name: "Practical Organic Chemistry", category: "Organic Chemistry" },
    ],
    mathematics: [
      { slug: "sets-and-relations", name: "Sets & Relations", category: "Algebra" },
      { slug: "logarithm", name: "Logarithm", category: "Algebra" },
      { slug: "quadratic-equation-and-inequalities", name: "Quadratic Equations & Inequalities", category: "Algebra" },
      { slug: "sequences-and-series", name: "Sequences & Series", category: "Algebra" },
      { slug: "mathematical-induction", name: "Mathematical Induction", category: "Algebra" },
      { slug: "binomial-theorem", name: "Binomial Theorem", category: "Algebra" },
      { slug: "matrices-and-determinants", name: "Matrices & Determinants", category: "Algebra" },
      { slug: "permutations-and-combinations", name: "Permutations & Combinations", category: "Algebra" },
      { slug: "probability", name: "Probability", category: "Algebra" },
      { slug: "vector-algebra", name: "Vector Algebra", category: "Coordinate Geometry" },
      { slug: "3d-geometry", name: "3D Geometry", category: "Coordinate Geometry" },
      { slug: "complex-numbers", name: "Complex Numbers", category: "Algebra" },
      { slug: "statistics", name: "Statistics", category: "Algebra" },
      { slug: "mathematical-reasoning", name: "Mathematical Reasoning", category: "Algebra" },
      { slug: "trigonometric-ratio-and-identites", name: "Trigonometric Ratios & Identities", category: "Trigonometry" },
      { slug: "trigonometric-functions-and-equations", name: "Trigonometric Functions & Equations", category: "Trigonometry" },
      { slug: "inverse-trigonometric-functions", name: "Inverse Trigonometric Functions", category: "Trigonometry" },
      { slug: "properties-of-triangle", name: "Properties of Triangle", category: "Trigonometry" },
      { slug: "height-and-distance", name: "Height & Distance", category: "Trigonometry" },
      { slug: "straight-lines-and-pair-of-straight-lines", name: "Straight Lines & Pair of Straight Lines", category: "Coordinate Geometry" },
      { slug: "circle", name: "Circle", category: "Coordinate Geometry" },
      { slug: "parabola", name: "Parabola", category: "Coordinate Geometry" },
      { slug: "ellipse", name: "Ellipse", category: "Coordinate Geometry" },
      { slug: "hyperbola", name: "Hyperbola", category: "Coordinate Geometry" },
      { slug: "functions", name: "Functions", category: "Calculus" },
      { slug: "limits-continuity-and-differentiability", name: "Limits, Continuity & Differentiability", category: "Calculus" },
      { slug: "differentiation", name: "Differentiation", category: "Calculus" },
      { slug: "application-of-derivatives", name: "Application of Derivatives", category: "Calculus" },
      { slug: "indefinite-integrals", name: "Indefinite Integrals", category: "Calculus" },
      { slug: "definite-integration", name: "Definite Integration", category: "Calculus" },
      { slug: "area-under-the-curves", name: "Area Under the Curves", category: "Calculus" },
      { slug: "differential-equations", name: "Differential Equations", category: "Calculus" },
    ],
  },
  "jee-advanced": {
    physics: [
      { slug: "units-and-measurements", name: "Units & Measurements", category: "Mechanics" },
      { slug: "motion", name: "Motion", category: "Mechanics" },
      { slug: "laws-of-motion", name: "Laws of Motion", category: "Mechanics" },
      { slug: "work-power-and-energy", name: "Work, Power & Energy", category: "Mechanics" },
      { slug: "impulse-and-momentum", name: "Impulse & Momentum", category: "Mechanics" },
      { slug: "rotational-motion", name: "Rotational Motion", category: "Mechanics" },
      { slug: "properties-of-matter", name: "Properties of Matter", category: "Mechanics" },
      { slug: "heat-and-thermodynamics", name: "Heat & Thermodynamics", category: "Thermal Physics" },
      { slug: "simple-harmonic-motion", name: "Simple Harmonic Motion", category: "Waves & Oscillations" },
      { slug: "waves", name: "Waves", category: "Waves & Oscillations" },
      { slug: "gravitation", name: "Gravitation", category: "Mechanics" },
      { slug: "motion-in-a-plane", name: "Motion in a Plane", category: "Mechanics" },
      { slug: "electrostatics", name: "Electrostatics", category: "Electromagnetism" },
      { slug: "current-electricity", name: "Current Electricity", category: "Electromagnetism" },
      { slug: "capacitor", name: "Capacitor", category: "Electromagnetism" },
      { slug: "magnetism", name: "Magnetism", category: "Electromagnetism" },
      { slug: "electromagnetic-induction", name: "Electromagnetic Induction", category: "Electromagnetism" },
      { slug: "alternating-current", name: "Alternating Current", category: "Electromagnetism" },
      { slug: "electromagnetic-waves", name: "Electromagnetic Waves", category: "Optics" },
      { slug: "geometrical-optics", name: "Geometrical Optics", category: "Optics" },
      { slug: "wave-optics", name: "Wave Optics", category: "Optics" },
      { slug: "practical-physics", name: "Practical Physics", category: "Modern Physics" },
      { slug: "atoms-and-nuclei", name: "Atoms & Nuclei", category: "Modern Physics" },
      { slug: "dual-nature-of-radiation", name: "Dual Nature of Radiation", category: "Modern Physics" },
    ],
    chemistry: [
      { slug: "some-basic-concepts-of-chemistry", name: "Some Basic Concepts of Chemistry", category: "Physical Chemistry" },
      { slug: "structure-of-atom", name: "Structure of Atom", category: "Physical Chemistry" },
      { slug: "redox-reactions", name: "Redox Reactions", category: "Physical Chemistry" },
      { slug: "gaseous-state", name: "Gaseous State", category: "Physical Chemistry" },
      { slug: "chemical-equilibrium", name: "Chemical Equilibrium", category: "Physical Chemistry" },
      { slug: "ionic-equilibrium", name: "Ionic Equilibrium", category: "Physical Chemistry" },
      { slug: "solutions", name: "Solutions", category: "Physical Chemistry" },
      { slug: "thermodynamics", name: "Thermodynamics", category: "Physical Chemistry" },
      { slug: "chemical-kinetics-and-nuclear-chemistry", name: "Chemical Kinetics & Nuclear Chemistry", category: "Physical Chemistry" },
      { slug: "electrochemistry", name: "Electrochemistry", category: "Physical Chemistry" },
      { slug: "solid-state", name: "Solid State", category: "Physical Chemistry" },
      { slug: "surface-chemistry", name: "Surface Chemistry", category: "Physical Chemistry" },
      { slug: "periodic-table-and-periodicity", name: "Periodic Table & Periodicity", category: "Inorganic Chemistry" },
      { slug: "chemical-bonding-and-molecular-structure", name: "Chemical Bonding & Molecular Structure", category: "Inorganic Chemistry" },
      { slug: "isolation-of-elements", name: "Isolation of Elements", category: "Inorganic Chemistry" },
      { slug: "hydrogen", name: "Hydrogen", category: "Inorganic Chemistry" },
      { slug: "s-block-elements", name: "s-Block Elements", category: "Inorganic Chemistry" },
      { slug: "p-block-elements", name: "p-Block Elements", category: "Inorganic Chemistry" },
      { slug: "d-and-f-block-elements", name: "d & f Block Elements", category: "Inorganic Chemistry" },
      { slug: "coordination-compounds", name: "Coordination Compounds", category: "Inorganic Chemistry" },
      { slug: "salt-analysis", name: "Salt Analysis", category: "Inorganic Chemistry" },
      { slug: "environmental-chemistry", name: "Environmental Chemistry", category: "Inorganic Chemistry" },
      { slug: "basics-of-organic-chemistry", name: "Basics of Organic Chemistry", category: "Organic Chemistry" },
      { slug: "hydrocarbons", name: "Hydrocarbons", category: "Organic Chemistry" },
      { slug: "haloalkanes-and-haloarenes", name: "Haloalkanes & Haloarenes", category: "Organic Chemistry" },
      { slug: "alcohols-phenols-and-ethers", name: "Alcohols, Phenols & Ethers", category: "Organic Chemistry" },
      { slug: "aldehydes-ketones-and-carboxylic-acids", name: "Aldehydes, Ketones & Carboxylic Acids", category: "Organic Chemistry" },
      { slug: "compounds-containing-nitrogen", name: "Compounds Containing Nitrogen", category: "Organic Chemistry" },
      { slug: "polymers", name: "Polymers", category: "Organic Chemistry" },
      { slug: "biomolecules", name: "Biomolecules", category: "Organic Chemistry" },
      { slug: "chemistry-in-everyday-life", name: "Chemistry in Everyday Life", category: "Organic Chemistry" },
      { slug: "practical-organic-chemistry", name: "Practical Organic Chemistry", category: "Organic Chemistry" },
    ],
    mathematics: [
      { slug: "quadratic-equation-and-inequalities", name: "Quadratic Equations & Inequalities", category: "Algebra" },
      { slug: "sequences-and-series", name: "Sequences & Series", category: "Algebra" },
      { slug: "mathematical-induction-and-binomial-theorem", name: "Math Induction & Binomial Theorem", category: "Algebra" },
      { slug: "matrices-and-determinants", name: "Matrices & Determinants", category: "Algebra" },
      { slug: "permutations-and-combinations", name: "Permutations & Combinations", category: "Algebra" },
      { slug: "probability", name: "Probability", category: "Algebra" },
      { slug: "vector-algebra", name: "Vector Algebra", category: "Coordinate Geometry" },
      { slug: "3d-geometry", name: "3D Geometry", category: "Coordinate Geometry" },
      { slug: "statistics", name: "Statistics", category: "Algebra" },
      { slug: "complex-numbers", name: "Complex Numbers", category: "Algebra" },
      { slug: "trigonometric-functions-and-equations", name: "Trigonometric Functions & Equations", category: "Trigonometry" },
      { slug: "inverse-trigonometric-functions", name: "Inverse Trigonometric Functions", category: "Trigonometry" },
      { slug: "properties-of-triangle", name: "Properties of Triangle", category: "Trigonometry" },
      { slug: "straight-lines-and-pair-of-straight-lines", name: "Straight Lines & Pair of Straight Lines", category: "Coordinate Geometry" },
      { slug: "circle", name: "Circle", category: "Coordinate Geometry" },
      { slug: "parabola", name: "Parabola", category: "Coordinate Geometry" },
      { slug: "ellipse", name: "Ellipse", category: "Coordinate Geometry" },
      { slug: "hyperbola", name: "Hyperbola", category: "Coordinate Geometry" },
      { slug: "functions", name: "Functions", category: "Calculus" },
      { slug: "limits-continuity-and-differentiability", name: "Limits, Continuity & Differentiability", category: "Calculus" },
      { slug: "differentiation", name: "Differentiation", category: "Calculus" },
      { slug: "application-of-derivatives", name: "Application of Derivatives", category: "Calculus" },
      { slug: "indefinite-integrals", name: "Indefinite Integrals", category: "Calculus" },
      { slug: "definite-integration", name: "Definite Integration", category: "Calculus" },
      { slug: "application-of-integration", name: "Application of Integration", category: "Calculus" },
      { slug: "differential-equations", name: "Differential Equations", category: "Calculus" },
    ],
  },
};

async function main() {
  // Get or create subjects
  const subjectSlugs = ["physics", "chemistry", "mathematics"];
  const subjects: Record<string, { id: string; name: string; slug: string }> = {};

  for (const slug of subjectSlugs) {
    let subj = await db.subject.findUnique({ where: { slug } });
    if (!subj) {
      subj = await db.subject.create({
        data: { name: slug.charAt(0).toUpperCase() + slug.slice(1), slug },
      });
      console.log(`  Created subject: ${subj.name}`);
    }
    subjects[slug] = subj;
  }

  // Delete all existing chapters
  const deletedCount = await db.chapter.deleteMany({});
  console.log(`Deleted ${deletedCount.count} old chapters`);

  // Create all chapters with correct slugs
  let totalCreated = 0;
  for (const [examType, examSubjects] of Object.entries(CHAPTER_DATA)) {
    for (const [subjectSlug, chapters] of Object.entries(examSubjects)) {
      const subject = subjects[subjectSlug];
      for (const ch of chapters) {
        await db.chapter.create({
          data: {
            name: ch.name,
            slug: ch.slug,
            category: ch.category,
            subjectId: subject.id,
            examType,
            questionCount: 0,
          },
        });
        totalCreated++;
      }
      console.log(`  ${examType}/${subjectSlug}: ${chapters.length} chapters`);
    }
  }

  console.log(`\n✅ Created ${totalCreated} chapters total`);

  // Verify
  const verify = await db.chapter.groupBy({
    by: ["examType"],
    _count: true,
  });
  for (const v of verify) {
    console.log(`  ${v.examType}: ${v._count} chapters`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());