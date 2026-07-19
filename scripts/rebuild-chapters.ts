import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  datasourceUrl: "file:/home/z/my-project/db/custom.db",
});

// All chapter data from ExamSide - exact slugs verified
const CHAPTERS: {
  exam: string;
  subject: string;
  slug: string;
  name: string;
  category?: string;
}[] = [
  // === JEE MAIN PHYSICS ===
  { exam: "jee-main", subject: "physics", slug: "units-and-measurements", name: "Units & Measurements", category: "Mechanics" },
  { exam: "jee-main", subject: "physics", slug: "vector-algebra", name: "Vector Algebra", category: "Mechanics" },
  { exam: "jee-main", subject: "physics", slug: "motion-in-a-straight-line", name: "Motion in a Straight Line", category: "Mechanics" },
  { exam: "jee-main", subject: "physics", slug: "motion-in-a-plane", name: "Motion in a Plane", category: "Mechanics" },
  { exam: "jee-main", subject: "physics", slug: "circular-motion", name: "Circular Motion", category: "Mechanics" },
  { exam: "jee-main", subject: "physics", slug: "laws-of-motion", name: "Laws of Motion", category: "Mechanics" },
  { exam: "jee-main", subject: "physics", slug: "work-power-and-energy", name: "Work Power & Energy", category: "Mechanics" },
  { exam: "jee-main", subject: "physics", slug: "center-of-mass", name: "Center of Mass and Collision", category: "Mechanics" },
  { exam: "jee-main", subject: "physics", slug: "rotational-motion", name: "Rotational Motion", category: "Mechanics" },
  { exam: "jee-main", subject: "physics", slug: "properties-of-matter", name: "Properties of Matter", category: "Mechanics" },
  { exam: "jee-main", subject: "physics", slug: "heat-and-thermodynamics", name: "Heat and Thermodynamics", category: "Thermal" },
  { exam: "jee-main", subject: "physics", slug: "simple-harmonic-motion", name: "Simple Harmonic Motion", category: "Waves & Thermodynamics" },
  { exam: "jee-main", subject: "physics", slug: "waves", name: "Waves", category: "Waves & Thermodynamics" },
  { exam: "jee-main", subject: "physics", slug: "gravitation", name: "Gravitation", category: "Mechanics" },
  { exam: "jee-main", subject: "physics", slug: "electrostatics", name: "Electrostatics", category: "Electricity" },
  { exam: "jee-main", subject: "physics", slug: "current-electricity", name: "Current Electricity", category: "Electricity" },
  { exam: "jee-main", subject: "physics", slug: "capacitor", name: "Capacitor", category: "Electricity" },
  { exam: "jee-main", subject: "physics", slug: "magnetics", name: "Magnetic Effect of Current", category: "Electricity" },
  { exam: "jee-main", subject: "physics", slug: "magnetic-properties-of-matter", name: "Magnetic Properties of Matter", category: "Electricity" },
  { exam: "jee-main", subject: "physics", slug: "electromagnetic-induction", name: "Electromagnetic Induction", category: "Electricity" },
  { exam: "jee-main", subject: "physics", slug: "alternating-current", name: "Alternating Current", category: "Electricity" },
  { exam: "jee-main", subject: "physics", slug: "electromagnetic-waves", name: "Electromagnetic Waves", category: "Optics" },
  { exam: "jee-main", subject: "physics", slug: "wave-optics", name: "Wave Optics", category: "Optics" },
  { exam: "jee-main", subject: "physics", slug: "geometrical-optics", name: "Geometrical Optics", category: "Optics" },
  { exam: "jee-main", subject: "physics", slug: "atoms-and-nuclei", name: "Atoms and Nuclei", category: "Modern Physics" },
  { exam: "jee-main", subject: "physics", slug: "dual-nature-of-radiation", name: "Dual Nature of Radiation", category: "Modern Physics" },
  { exam: "jee-main", subject: "physics", slug: "electronic-devices", name: "Semiconductor", category: "Modern Physics" },
  { exam: "jee-main", subject: "physics", slug: "communication-systems", name: "Communication Systems", category: "Modern Physics" },

  // === JEE MAIN CHEMISTRY ===
  { exam: "jee-main", subject: "chemistry", slug: "some-basic-concepts-of-chemistry", name: "Some Basic Concepts of Chemistry", category: "Physical Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "structure-of-atom", name: "Structure of Atom", category: "Physical Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "redox-reactions", name: "Redox Reactions", category: "Physical Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "gaseous-state", name: "Gaseous State", category: "Physical Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "chemical-equilibrium", name: "Chemical Equilibrium", category: "Physical Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "ionic-equilibrium", name: "Ionic Equilibrium", category: "Physical Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "solutions", name: "Solutions", category: "Physical Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "thermodynamics", name: "Thermodynamics", category: "Physical Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "electrochemistry", name: "Electrochemistry", category: "Physical Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "chemical-kinetics-and-nuclear-chemistry", name: "Chemical Kinetics & Nuclear Chemistry", category: "Physical Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "solid-state", name: "Solid State", category: "Physical Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "surface-chemistry", name: "Surface Chemistry", category: "Physical Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "periodic-table-and-periodicity", name: "Periodic Table & Periodicity", category: "Inorganic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "chemical-bonding-and-molecular-structure", name: "Chemical Bonding & Molecular Structure", category: "Inorganic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "isolation-of-elements", name: "Isolation of Elements", category: "Inorganic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "hydrogen", name: "Hydrogen", category: "Inorganic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "s-block-elements", name: "s-Block Elements", category: "Inorganic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "p-block-elements", name: "p-Block Elements", category: "Inorganic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "d-and-f-block-elements", name: "d and f Block Elements", category: "Inorganic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "coordination-compounds", name: "Coordination Compounds", category: "Inorganic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "salt-analysis", name: "Salt Analysis", category: "Inorganic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "environmental-chemistry", name: "Environmental Chemistry", category: "Inorganic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "basics-of-organic-chemistry", name: "Basics of Organic Chemistry", category: "Organic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "hydrocarbons", name: "Hydrocarbons", category: "Organic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "haloalkanes-and-haloarenes", name: "Haloalkanes and Haloarenes", category: "Organic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "alcohols-phenols-and-ethers", name: "Alcohols, Phenols and Ethers", category: "Organic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "aldehydes-ketones-and-carboxylic-acids", name: "Aldehydes, Ketones & Carboxylic Acids", category: "Organic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "compounds-containing-nitrogen", name: "Compounds Containing Nitrogen", category: "Organic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "polymers", name: "Polymers", category: "Organic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "biomolecules", name: "Biomolecules", category: "Organic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "chemistry-in-everyday-life", name: "Chemistry in Everyday Life", category: "Organic Chemistry" },
  { exam: "jee-main", subject: "chemistry", slug: "practical-organic-chemistry", name: "Practical Organic Chemistry", category: "Organic Chemistry" },

  // === JEE MAIN MATHEMATICS ===
  { exam: "jee-main", subject: "mathematics", slug: "sets-and-relations", name: "Sets and Relations", category: "Algebra" },
  { exam: "jee-main", subject: "mathematics", slug: "logarithm", name: "Logarithm", category: "Algebra" },
  { exam: "jee-main", subject: "mathematics", slug: "quadratic-equation-and-inequalities", name: "Quadratic Equation & Inequalities", category: "Algebra" },
  { exam: "jee-main", subject: "mathematics", slug: "sequences-and-series", name: "Sequences and Series", category: "Algebra" },
  { exam: "jee-main", subject: "mathematics", slug: "mathematical-induction", name: "Mathematical Induction", category: "Algebra" },
  { exam: "jee-main", subject: "mathematics", slug: "binomial-theorem", name: "Binomial Theorem", category: "Algebra" },
  { exam: "jee-main", subject: "mathematics", slug: "matrices-and-determinants", name: "Matrices & Determinants", category: "Algebra" },
  { exam: "jee-main", subject: "mathematics", slug: "permutations-and-combinations", name: "Permutations and Combinations", category: "Algebra" },
  { exam: "jee-main", subject: "mathematics", slug: "probability", name: "Probability", category: "Algebra" },
  { exam: "jee-main", subject: "mathematics", slug: "vector-algebra", name: "Vector Algebra", category: "Coordinate Geometry" },
  { exam: "jee-main", subject: "mathematics", slug: "3d-geometry", name: "3D Geometry", category: "Coordinate Geometry" },
  { exam: "jee-main", subject: "mathematics", slug: "complex-numbers", name: "Complex Numbers", category: "Algebra" },
  { exam: "jee-main", subject: "mathematics", slug: "statistics", name: "Statistics", category: "Algebra" },
  { exam: "jee-main", subject: "mathematics", slug: "mathematical-reasoning", name: "Mathematical Reasoning", category: "Algebra" },
  { exam: "jee-main", subject: "mathematics", slug: "trigonometric-ratio-and-identites", name: "Trigonometric Ratio & Identities", category: "Trigonometry" },
  { exam: "jee-main", subject: "mathematics", slug: "trigonometric-functions-and-equations", name: "Trigonometric Equations", category: "Trigonometry" },
  { exam: "jee-main", subject: "mathematics", slug: "inverse-trigonometric-functions", name: "Inverse Trigonometric Functions", category: "Trigonometry" },
  { exam: "jee-main", subject: "mathematics", slug: "properties-of-triangle", name: "Properties of Triangle", category: "Trigonometry" },
  { exam: "jee-main", subject: "mathematics", slug: "height-and-distance", name: "Height and Distance", category: "Trigonometry" },
  { exam: "jee-main", subject: "mathematics", slug: "straight-lines-and-pair-of-straight-lines", name: "Straight Lines", category: "Coordinate Geometry" },
  { exam: "jee-main", subject: "mathematics", slug: "circle", name: "Circle", category: "Coordinate Geometry" },
  { exam: "jee-main", subject: "mathematics", slug: "parabola", name: "Parabola", category: "Coordinate Geometry" },
  { exam: "jee-main", subject: "mathematics", slug: "ellipse", name: "Ellipse", category: "Coordinate Geometry" },
  { exam: "jee-main", subject: "mathematics", slug: "hyperbola", name: "Hyperbola", category: "Coordinate Geometry" },
  { exam: "jee-main", subject: "mathematics", slug: "functions", name: "Functions", category: "Calculus" },
  { exam: "jee-main", subject: "mathematics", slug: "limits-continuity-and-differentiability", name: "Limits, Continuity & Differentiability", category: "Calculus" },
  { exam: "jee-main", subject: "mathematics", slug: "differentiation", name: "Differentiation", category: "Calculus" },
  { exam: "jee-main", subject: "mathematics", slug: "application-of-derivatives", name: "Application of Derivatives", category: "Calculus" },
  { exam: "jee-main", subject: "mathematics", slug: "indefinite-integrals", name: "Indefinite Integrals", category: "Calculus" },
  { exam: "jee-main", subject: "mathematics", slug: "definite-integration", name: "Definite Integration", category: "Calculus" },
  { exam: "jee-main", subject: "mathematics", slug: "area-under-the-curves", name: "Area Under The Curves", category: "Calculus" },
  { exam: "jee-main", subject: "mathematics", slug: "differential-equations", name: "Differential Equations", category: "Calculus" },

  // === JEE ADVANCED PHYSICS ===
  { exam: "jee-advanced", subject: "physics", slug: "units-and-measurements", name: "Units & Measurements", category: "General" },
  { exam: "jee-advanced", subject: "physics", slug: "motion", name: "Motion", category: "Mechanics" },
  { exam: "jee-advanced", subject: "physics", slug: "laws-of-motion", name: "Laws of Motion", category: "Mechanics" },
  { exam: "jee-advanced", subject: "physics", slug: "work-power-and-energy", name: "Work Power & Energy", category: "Mechanics" },
  { exam: "jee-advanced", subject: "physics", slug: "impulse-and-momentum", name: "Impulse & Momentum", category: "Mechanics" },
  { exam: "jee-advanced", subject: "physics", slug: "rotational-motion", name: "Rotational Motion", category: "Mechanics" },
  { exam: "jee-advanced", subject: "physics", slug: "properties-of-matter", name: "Properties of Matter", category: "Mechanics" },
  { exam: "jee-advanced", subject: "physics", slug: "heat-and-thermodynamics", name: "Heat and Thermodynamics", category: "Thermal" },
  { exam: "jee-advanced", subject: "physics", slug: "simple-harmonic-motion", name: "Simple Harmonic Motion", category: "Waves" },
  { exam: "jee-advanced", subject: "physics", slug: "waves", name: "Waves", category: "Waves" },
  { exam: "jee-advanced", subject: "physics", slug: "gravitation", name: "Gravitation", category: "Mechanics" },
  { exam: "jee-advanced", subject: "physics", slug: "motion-in-a-plane", name: "Motion in a Plane", category: "Mechanics" },
  { exam: "jee-advanced", subject: "physics", slug: "electrostatics", name: "Electrostatics", category: "Electricity & Magnetism" },
  { exam: "jee-advanced", subject: "physics", slug: "current-electricity", name: "Current Electricity", category: "Electricity & Magnetism" },
  { exam: "jee-advanced", subject: "physics", slug: "capacitor", name: "Capacitor", category: "Electricity & Magnetism" },
  { exam: "jee-advanced", subject: "physics", slug: "magnetism", name: "Magnetism", category: "Electricity & Magnetism" },
  { exam: "jee-advanced", subject: "physics", slug: "electromagnetic-induction", name: "Electromagnetic Induction", category: "Electricity & Magnetism" },
  { exam: "jee-advanced", subject: "physics", slug: "alternating-current", name: "Alternating Current", category: "Electricity & Magnetism" },
  { exam: "jee-advanced", subject: "physics", slug: "electromagnetic-waves", name: "Electromagnetic Waves", category: "Optics" },
  { exam: "jee-advanced", subject: "physics", slug: "geometrical-optics", name: "Geometrical Optics", category: "Optics" },
  { exam: "jee-advanced", subject: "physics", slug: "wave-optics", name: "Wave Optics", category: "Optics" },
  { exam: "jee-advanced", subject: "physics", slug: "practical-physics", name: "Practical Physics", category: "General" },
  { exam: "jee-advanced", subject: "physics", slug: "atoms-and-nuclei", name: "Atoms and Nuclei", category: "Modern Physics" },
  { exam: "jee-advanced", subject: "physics", slug: "dual-nature-of-radiation", name: "Dual Nature of Radiation", category: "Modern Physics" },

  // === JEE ADVANCED CHEMISTRY (same slugs as Main) ===
  { exam: "jee-advanced", subject: "chemistry", slug: "some-basic-concepts-of-chemistry", name: "Some Basic Concepts of Chemistry", category: "Physical Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "structure-of-atom", name: "Structure of Atom", category: "Physical Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "redox-reactions", name: "Redox Reactions", category: "Physical Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "gaseous-state", name: "Gaseous State", category: "Physical Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "chemical-equilibrium", name: "Chemical Equilibrium", category: "Physical Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "ionic-equilibrium", name: "Ionic Equilibrium", category: "Physical Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "solutions", name: "Solutions", category: "Physical Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "thermodynamics", name: "Thermodynamics", category: "Physical Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "chemical-kinetics-and-nuclear-chemistry", name: "Chemical Kinetics & Nuclear Chemistry", category: "Physical Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "electrochemistry", name: "Electrochemistry", category: "Physical Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "solid-state", name: "Solid State", category: "Physical Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "surface-chemistry", name: "Surface Chemistry", category: "Physical Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "periodic-table-and-periodicity", name: "Periodic Table & Periodicity", category: "Inorganic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "chemical-bonding-and-molecular-structure", name: "Chemical Bonding & Molecular Structure", category: "Inorganic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "isolation-of-elements", name: "Isolation of Elements", category: "Inorganic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "hydrogen", name: "Hydrogen", category: "Inorganic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "s-block-elements", name: "s-Block Elements", category: "Inorganic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "p-block-elements", name: "p-Block Elements", category: "Inorganic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "d-and-f-block-elements", name: "d and f Block Elements", category: "Inorganic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "coordination-compounds", name: "Coordination Compounds", category: "Inorganic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "salt-analysis", name: "Salt Analysis", category: "Inorganic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "basics-of-organic-chemistry", name: "Basics of Organic Chemistry", category: "Organic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "hydrocarbons", name: "Hydrocarbons", category: "Organic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "haloalkanes-and-haloarenes", name: "Haloalkanes and Haloarenes", category: "Organic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "alcohols-phenols-and-ethers", name: "Alcohols, Phenols and Ethers", category: "Organic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "aldehydes-ketones-and-carboxylic-acids", name: "Aldehydes, Ketones & Carboxylic Acids", category: "Organic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "compounds-containing-nitrogen", name: "Compounds Containing Nitrogen", category: "Organic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "polymers", name: "Polymers", category: "Organic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "biomolecules", name: "Biomolecules", category: "Organic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "chemistry-in-everyday-life", name: "Chemistry in Everyday Life", category: "Organic Chemistry" },
  { exam: "jee-advanced", subject: "chemistry", slug: "practical-organic-chemistry", name: "Practical Organic Chemistry", category: "Organic Chemistry" },

  // === JEE ADVANCED MATHEMATICS ===
  { exam: "jee-advanced", subject: "mathematics", slug: "quadratic-equation-and-inequalities", name: "Quadratic Equation & Inequalities", category: "Algebra" },
  { exam: "jee-advanced", subject: "mathematics", slug: "sequences-and-series", name: "Sequences and Series", category: "Algebra" },
  { exam: "jee-advanced", subject: "mathematics", slug: "mathematical-induction-and-binomial-theorem", name: "Math Induction & Binomial Theorem", category: "Algebra" },
  { exam: "jee-advanced", subject: "mathematics", slug: "matrices-and-determinants", name: "Matrices & Determinants", category: "Algebra" },
  { exam: "jee-advanced", subject: "mathematics", slug: "permutations-and-combinations", name: "Permutations and Combinations", category: "Algebra" },
  { exam: "jee-advanced", subject: "mathematics", slug: "probability", name: "Probability", category: "Algebra" },
  { exam: "jee-advanced", subject: "mathematics", slug: "vector-algebra", name: "Vector Algebra", category: "Coordinate Geometry" },
  { exam: "jee-advanced", subject: "mathematics", slug: "3d-geometry", name: "3D Geometry", category: "Coordinate Geometry" },
  { exam: "jee-advanced", subject: "mathematics", slug: "statistics", name: "Statistics", category: "Algebra" },
  { exam: "jee-advanced", subject: "mathematics", slug: "complex-numbers", name: "Complex Numbers", category: "Algebra" },
  { exam: "jee-advanced", subject: "mathematics", slug: "trigonometric-functions-and-equations", name: "Trigonometric Functions & Equations", category: "Trigonometry" },
  { exam: "jee-advanced", subject: "mathematics", slug: "inverse-trigonometric-functions", name: "Inverse Trigonometric Functions", category: "Trigonometry" },
  { exam: "jee-advanced", subject: "mathematics", slug: "properties-of-triangle", name: "Properties of Triangle", category: "Trigonometry" },
  { exam: "jee-advanced", subject: "mathematics", slug: "straight-lines-and-pair-of-straight-lines", name: "Straight Lines", category: "Coordinate Geometry" },
  { exam: "jee-advanced", subject: "mathematics", slug: "circle", name: "Circle", category: "Coordinate Geometry" },
  { exam: "jee-advanced", subject: "mathematics", slug: "parabola", name: "Parabola", category: "Coordinate Geometry" },
  { exam: "jee-advanced", subject: "mathematics", slug: "ellipse", name: "Ellipse", category: "Coordinate Geometry" },
  { exam: "jee-advanced", subject: "mathematics", slug: "hyperbola", name: "Hyperbola", category: "Coordinate Geometry" },
  { exam: "jee-advanced", subject: "mathematics", slug: "functions", name: "Functions", category: "Calculus" },
  { exam: "jee-advanced", subject: "mathematics", slug: "limits-continuity-and-differentiability", name: "Limits, Continuity & Differentiability", category: "Calculus" },
  { exam: "jee-advanced", subject: "mathematics", slug: "differentiation", name: "Differentiation", category: "Calculus" },
  { exam: "jee-advanced", subject: "mathematics", slug: "application-of-derivatives", name: "Application of Derivatives", category: "Calculus" },
  { exam: "jee-advanced", subject: "mathematics", slug: "indefinite-integrals", name: "Indefinite Integrals", category: "Calculus" },
  { exam: "jee-advanced", subject: "mathematics", slug: "definite-integration", name: "Definite Integration", category: "Calculus" },
  { exam: "jee-advanced", subject: "mathematics", slug: "application-of-integration", name: "Application of Integration", category: "Calculus" },
  { exam: "jee-advanced", subject: "mathematics", slug: "differential-equations", name: "Differential Equations", category: "Calculus" },
];

async function main() {
  // Get subjects
  const subjects = await db.subject.findMany();
  const sMap: Record<string, string> = {};
  subjects.forEach((s) => (sMap[s.slug] = s.id));

  let created = 0;
  for (const ch of CHAPTERS) {
    const subjectId = sMap[ch.subject];
    if (!subjectId) {
      console.error(`Subject not found: ${ch.subject}`);
      continue;
    }
    try {
      await db.chapter.create({
        data: {
          name: ch.name,
          slug: ch.slug,
          category: ch.category || null,
          subjectId,
          examType: ch.exam,
        },
      });
      created++;
    } catch (e: any) {
      if (e.message?.includes("Unique")) {
        console.log(`  Skip (exists): ${ch.exam}/${ch.subject}/${ch.slug}`);
      } else {
        console.error(`  Error: ${ch.slug}: ${e.message}`);
      }
    }
  }

  const counts = await db.chapter.groupBy({
    by: ["examType", "subjectId"],
    _count: true,
  });
  console.log(`\nCreated ${created} chapters total`);
  for (const c of counts) {
    const subj = subjects.find((s) => s.id === c.subjectId);
    console.log(`  ${c.examType}/${subj?.name}: ${c._count} chapters`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());