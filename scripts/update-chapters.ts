import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({
  datasourceUrl: "file:/home/z/my-project/db/custom.db",
});

// Map of old slug -> correct examside slug for chapters that have questions
const slugUpdates: Record<string, {newSlug: string, newName?: string, newCategory?: string}>[] = [
  // Physics slugs are already correct
  // Chemistry
  {newSlug: "some-basic-concepts-of-chemistry", newName: "Some Basic Concepts of Chemistry", newCategory: "Physical Chemistry"},
  {newSlug: "structure-of-atom", newName: "Structure of Atom", newCategory: "Physical Chemistry"},
  {newSlug: "chemical-equilibrium", newName: "Chemical Equilibrium", newCategory: "Physical Chemistry"},
  {newSlug: "ionic-equilibrium", newName: "Ionic Equilibrium", newCategory: "Physical Chemistry"},
  {newSlug: "thermodynamics", newName: "Thermodynamics", newCategory: "Physical Chemistry"},
  {newSlug: "chemical-kinetics-and-nuclear-chemistry", newName: "Chemical Kinetics & Nuclear Chemistry", newCategory: "Physical Chemistry"},
  {newSlug: "solid-state", newName: "Solid State", newCategory: "Physical Chemistry"},
  {newSlug: "surface-chemistry", newName: "Surface Chemistry", newCategory: "Physical Chemistry"},
  {newSlug: "periodic-table-and-periodicity", newName: "Periodic Table & Periodicity", newCategory: "Inorganic Chemistry"},
  {newSlug: "chemical-bonding-and-molecular-structure", newName: "Chemical Bonding & Molecular Structure", newCategory: "Inorganic Chemistry"},
  {newSlug: "isolation-of-elements", newName: "Isolation of Elements", newCategory: "Inorganic Chemistry"},
  {newSlug: "hydrogen", newName: "Hydrogen", newCategory: "Inorganic Chemistry"},
  {newSlug: "s-block-elements", newName: "s-Block Elements", newCategory: "Inorganic Chemistry"},
  {newSlug: "p-block-elements", newName: "p-Block Elements", newCategory: "Inorganic Chemistry"},
  {newSlug: "d-and-f-block-elements", newName: "d & f Block Elements", newCategory: "Inorganic Chemistry"},
  {newSlug: "coordination-compounds", newName: "Coordination Compounds", newCategory: "Inorganic Chemistry"},
  {newSlug: "salt-analysis", newName: "Salt Analysis", newCategory: "Inorganic Chemistry"},
  {newSlug: "environmental-chemistry", newName: "Environmental Chemistry", newCategory: "Inorganic Chemistry"},
  {newSlug: "basics-of-organic-chemistry", newName: "Basics of Organic Chemistry", newCategory: "Organic Chemistry"},
  {newSlug: "hydrocarbons", newName: "Hydrocarbons", newCategory: "Organic Chemistry"},
  {newSlug: "haloalkanes-and-haloarenes", newName: "Haloalkanes & Haloarenes", newCategory: "Organic Chemistry"},
  {newSlug: "alcohols-phenols-and-ethers", newName: "Alcohols, Phenols & Ethers", newCategory: "Organic Chemistry"},
  {newSlug: "aldehydes-ketones-and-carboxylic-acids", newName: "Aldehydes, Ketones & Carboxylic Acids", newCategory: "Organic Chemistry"},
  {newSlug: "compounds-containing-nitrogen", newName: "Compounds Containing Nitrogen", newCategory: "Organic Chemistry"},
  {newSlug: "polymers", newName: "Polymers", newCategory: "Organic Chemistry"},
  {newSlug: "biomolecules", newName: "Biomolecules", newCategory: "Organic Chemistry"},
  // Math
  {newSlug: "sets-and-relations", newName: "Sets & Relations", newCategory: "Algebra"},
  {newSlug: "logarithm", newName: "Logarithm", newCategory: "Algebra"},
  {newSlug: "quadratic-equation-and-inequalities", newName: "Quadratic Equation & Inequalities", newCategory: "Algebra"},
  {newSlug: "sequences-and-series", newName: "Sequences & Series", newCategory: "Algebra"},
  {newSlug: "mathematical-induction", newName: "Mathematical Induction", newCategory: "Algebra"},
  {newSlug: "binomial-theorem", newName: "Binomial Theorem", newCategory: "Algebra"},
  {newSlug: "matrices-and-determinants", newName: "Matrices & Determinants", newCategory: "Algebra"},
  {newSlug: "permutations-and-combinations", newName: "Permutations & Combinations", newCategory: "Algebra"},
  {newSlug: "probability", newName: "Probability", newCategory: "Algebra"},
  {newSlug: "complex-numbers", newName: "Complex Numbers", newCategory: "Algebra"},
  {newSlug: "statistics", newName: "Statistics", newCategory: "Algebra"},
  {newSlug: "mathematical-reasoning", newName: "Mathematical Reasoning", newCategory: "Algebra"},
  {newSlug: "vector-algebra-2", newName: "Vector Algebra", newCategory: "3D Geometry"},
  {newSlug: "3d-geometry", newName: "3D Geometry", newCategory: "3D Geometry"},
  {newSlug: "trigonometric-ratio-and-identites", newName: "Trigonometric Ratio & Identities", newCategory: "Trigonometry"},
  {newSlug: "trigonometric-functions-and-equations", newName: "Trigonometric Functions & Equations", newCategory: "Trigonometry"},
  {newSlug: "inverse-trigonometric-functions", newName: "Inverse Trigonometric Functions", newCategory: "Trigonometry"},
  {newSlug: "properties-of-triangles", newName: "Properties of Triangle", newCategory: "Trigonometry"},
  {newSlug: "straight-lines-and-pair-of-straight-lines", newName: "Straight Lines", newCategory: "Coordinate Geometry"},
  {newSlug: "circle", newName: "Circle", newCategory: "Coordinate Geometry"},
  {newSlug: "parabola", newName: "Parabola", newCategory: "Coordinate Geometry"},
  {newSlug: "ellipse", newName: "Ellipse", newCategory: "Coordinate Geometry"},
  {newSlug: "hyperbola", newName: "Hyperbola", newCategory: "Coordinate Geometry"},
  {newSlug: "functions", newName: "Functions", newCategory: "Calculus"},
  {newSlug: "limits-continuity-and-differentiability", newName: "Limits, Continuity & Differentiability", newCategory: "Calculus"},
  {newSlug: "differentiation", newName: "Differentiation", newCategory: "Calculus"},
  {newSlug: "application-of-derivatives", newName: "Application of Derivatives", newCategory: "Calculus"},
  {newSlug: "indefinite-integrals", newName: "Indefinite Integrals", newCategory: "Calculus"},
  {newSlug: "definite-integration", newName: "Definite Integration", newCategory: "Calculus"},
  {newSlug: "area-under-the-curves", newName: "Area Under The Curves", newCategory: "Calculus"},
  {newSlug: "differential-equations", newName: "Differential Equations", newCategory: "Calculus"},
];

async function updateChapters() {
  // For chemistry, find and update existing chapters
  const chemSubject = await db.subject.findUnique({ where: { slug: "chemistry" } });
  const mathSubject = await db.subject.findUnique({ where: { slug: "mathematics" } });

  if (chemSubject) {
    const chemChapters = await db.chapter.findMany({ where: { subjectId: chemSubject.id, examType: "jee-main" } });
    console.log(`Chemistry chapters in DB: ${chemChapters.length}`);

    // Delete old chapters and recreate with correct slugs
    for (const ch of chemChapters) {
      await db.chapter.delete({ where: { id: ch.id } });
    }

    const chemChaptersNew = [
      { name: "Some Basic Concepts of Chemistry", slug: "some-basic-concepts-of-chemistry", category: "Physical Chemistry" },
      { name: "Structure of Atom", slug: "structure-of-atom", category: "Physical Chemistry" },
      { name: "Redox Reactions", slug: "redox-reactions", category: "Physical Chemistry" },
      { name: "Gaseous State", slug: "gaseous-state", category: "Physical Chemistry" },
      { name: "Chemical Equilibrium", slug: "chemical-equilibrium", category: "Physical Chemistry" },
      { name: "Ionic Equilibrium", slug: "ionic-equilibrium", category: "Physical Chemistry" },
      { name: "Solutions", slug: "solutions", category: "Physical Chemistry" },
      { name: "Thermodynamics", slug: "thermodynamics", category: "Physical Chemistry" },
      { name: "Electrochemistry", slug: "electrochemistry", category: "Physical Chemistry" },
      { name: "Chemical Kinetics & Nuclear Chemistry", slug: "chemical-kinetics-and-nuclear-chemistry", category: "Physical Chemistry" },
      { name: "Solid State", slug: "solid-state", category: "Physical Chemistry" },
      { name: "Surface Chemistry", slug: "surface-chemistry", category: "Physical Chemistry" },
      { name: "Periodic Table & Periodicity", slug: "periodic-table-and-periodicity", category: "Inorganic Chemistry" },
      { name: "Chemical Bonding & Molecular Structure", slug: "chemical-bonding-and-molecular-structure", category: "Inorganic Chemistry" },
      { name: "Isolation of Elements", slug: "isolation-of-elements", category: "Inorganic Chemistry" },
      { name: "Hydrogen", slug: "hydrogen", category: "Inorganic Chemistry" },
      { name: "s-Block Elements", slug: "s-block-elements", category: "Inorganic Chemistry" },
      { name: "p-Block Elements", slug: "p-block-elements", category: "Inorganic Chemistry" },
      { name: "d & f Block Elements", slug: "d-and-f-block-elements", category: "Inorganic Chemistry" },
      { name: "Coordination Compounds", slug: "coordination-compounds", category: "Inorganic Chemistry" },
      { name: "Salt Analysis", slug: "salt-analysis", category: "Inorganic Chemistry" },
      { name: "Environmental Chemistry", slug: "environmental-chemistry", category: "Inorganic Chemistry" },
      { name: "Basics of Organic Chemistry", slug: "basics-of-organic-chemistry", category: "Organic Chemistry" },
      { name: "Hydrocarbons", slug: "hydrocarbons", category: "Organic Chemistry" },
      { name: "Haloalkanes & Haloarenes", slug: "haloalkanes-and-haloarenes", category: "Organic Chemistry" },
      { name: "Alcohols, Phenols & Ethers", slug: "alcohols-phenols-and-ethers", category: "Organic Chemistry" },
      { name: "Aldehydes, Ketones & Carboxylic Acids", slug: "aldehydes-ketones-and-carboxylic-acids", category: "Organic Chemistry" },
      { name: "Compounds Containing Nitrogen", slug: "compounds-containing-nitrogen", category: "Organic Chemistry" },
      { name: "Polymers", slug: "polymers", category: "Organic Chemistry" },
      { name: "Biomolecules", slug: "biomolecules", category: "Organic Chemistry" },
      { name: "Chemistry in Everyday Life", slug: "chemistry-in-everyday-life", category: "Organic Chemistry" },
      { name: "Practical Organic Chemistry", slug: "practical-organic-chemistry", category: "Organic Chemistry" },
    ];

    for (const ch of chemChaptersNew) {
      await db.chapter.create({
        data: { ...ch, subjectId: chemSubject.id, examType: "jee-main" },
      });
    }
    console.log(`Created ${chemChaptersNew.length} chemistry chapters`);
  }

  if (mathSubject) {
    const mathChapters = await db.chapter.findMany({ where: { subjectId: mathSubject.id, examType: "jee-main" } });
    for (const ch of mathChapters) {
      await db.chapter.delete({ where: { id: ch.id } });
    }

    const mathChaptersNew = [
      { name: "Sets & Relations", slug: "sets-and-relations", category: "Algebra" },
      { name: "Logarithm", slug: "logarithm", category: "Algebra" },
      { name: "Quadratic Equation & Inequalities", slug: "quadratic-equation-and-inequalities", category: "Algebra" },
      { name: "Sequences & Series", slug: "sequences-and-series", category: "Algebra" },
      { name: "Mathematical Induction", slug: "mathematical-induction", category: "Algebra" },
      { name: "Binomial Theorem", slug: "binomial-theorem", category: "Algebra" },
      { name: "Matrices & Determinants", slug: "matrices-and-determinants", category: "Algebra" },
      { name: "Permutations & Combinations", slug: "permutations-and-combinations", category: "Algebra" },
      { name: "Probability", slug: "probability", category: "Algebra" },
      { name: "Vector Algebra", slug: "vector-algebra-2", category: "3D Geometry" },
      { name: "3D Geometry", slug: "3d-geometry", category: "3D Geometry" },
      { name: "Complex Numbers", slug: "complex-numbers", category: "Algebra" },
      { name: "Statistics", slug: "statistics", category: "Algebra" },
      { name: "Mathematical Reasoning", slug: "mathematical-reasoning", category: "Algebra" },
      { name: "Trigonometric Ratio & Identities", slug: "trigonometric-ratio-and-identites", category: "Trigonometry" },
      { name: "Trigonometric Functions & Equations", slug: "trigonometric-functions-and-equations", category: "Trigonometry" },
      { name: "Inverse Trigonometric Functions", slug: "inverse-trigonometric-functions", category: "Trigonometry" },
      { name: "Properties of Triangle", slug: "properties-of-triangles", category: "Trigonometry" },
      { name: "Height and Distance", slug: "height-and-distance", category: "Trigonometry" },
      { name: "Straight Lines", slug: "straight-lines-and-pair-of-straight-lines", category: "Coordinate Geometry" },
      { name: "Circle", slug: "circle", category: "Coordinate Geometry" },
      { name: "Parabola", slug: "parabola", category: "Coordinate Geometry" },
      { name: "Ellipse", slug: "ellipse", category: "Coordinate Geometry" },
      { name: "Hyperbola", slug: "hyperbola", category: "Coordinate Geometry" },
      { name: "Functions", slug: "functions", category: "Calculus" },
      { name: "Limits, Continuity & Differentiability", slug: "limits-continuity-and-differentiability", category: "Calculus" },
      { name: "Differentiation", slug: "differentiation", category: "Calculus" },
      { name: "Application of Derivatives", slug: "application-of-derivatives", category: "Calculus" },
      { name: "Indefinite Integrals", slug: "indefinite-integrals", category: "Calculus" },
      { name: "Definite Integration", slug: "definite-integration", category: "Calculus" },
      { name: "Area Under The Curves", slug: "area-under-the-curves", category: "Calculus" },
      { name: "Differential Equations", slug: "differential-equations", category: "Calculus" },
    ];

    for (const ch of mathChaptersNew) {
      await db.chapter.create({
        data: { ...ch, subjectId: mathSubject.id, examType: "jee-main" },
      });
    }
    console.log(`Created ${mathChaptersNew.length} math chapters`);
  }

  // Update question counts for all chapters
  const allChapters = await db.chapter.findMany({ include: { subject: true } });
  for (const ch of allChapters) {
    const count = await db.question.count({ where: { subjectId: ch.subjectId, exam: ch.examType, questionText: { contains: '' } } });
    // We can't easily link questions to chapters by slug since we didn't have chapterId
    // So let's link them now
  }

  // Link orphan questions to chapters based on source URL
  const questions = await db.question.findMany({ where: { chapterId: null } });
  let linked = 0;
  for (const q of questions) {
    if (!q.sourceUrl) continue;
    const slugMatch = q.sourceUrl.match(/\/(physics|chemistry|mathematics)\/([a-z0-9-]+)\?/);
    if (!slugMatch) continue;
    const subjectSlug = slugMatch[1];
    const chapterSlug = slugMatch[2];

    const subject = await db.subject.findUnique({ where: { slug: subjectSlug } });
    if (!subject) continue;

    const chapter = await db.chapter.findFirst({
      where: { slug: chapterSlug, subjectId: subject.id, examType: q.exam },
    });
    if (chapter) {
      await db.question.update({ where: { id: q.id }, data: { chapterId: chapter.id } });
      linked++;
    }
  }
  console.log(`Linked ${linked} questions to chapters`);

  // Now update question counts
  const chaptersWithQuestions = await db.chapter.findMany({ where: { questions: { some: {} } }, include: { _count: { select: { questions: true } } } });
  for (const ch of chaptersWithQuestions) {
    await db.chapter.update({ where: { id: ch.id }, data: { questionCount: ch._count.questions } });
  }
  console.log(`Updated question counts for ${chaptersWithQuestions.length} chapters`);
}

updateChapters()
  .catch(console.error)
  .finally(() => db.$disconnect());