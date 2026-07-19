#!/bin/bash
# Batch scrape all missing chapters
# Usage: bash scripts/batch-scrape.sh [start_index]
# Don't use set -e - individual failures should not stop the batch

CHAPTERS=(
"jee-advanced_physics_impulse-and-momentum"
"jee-advanced_physics_properties-of-matter"
"jee-advanced_physics_simple-harmonic-motion"
"jee-advanced_physics_capacitor"
"jee-advanced_physics_electromagnetic-waves"
"jee-advanced_physics_practical-physics"
"jee-advanced_physics_atoms-and-nuclei"
"jee-advanced_physics_dual-nature-of-radiation"
"jee-advanced_chemistry_some-basic-concepts-of-chemistry"
"jee-advanced_chemistry_structure-of-atom"
"jee-advanced_chemistry_redox-reactions"
"jee-advanced_chemistry_gaseous-state"
"jee-advanced_chemistry_chemical-equilibrium"
"jee-advanced_chemistry_ionic-equilibrium"
"jee-advanced_chemistry_solutions"
"jee-advanced_chemistry_thermodynamics"
"jee-advanced_chemistry_chemical-kinetics-and-nuclear-chemistry"
"jee-advanced_chemistry_electrochemistry"
"jee-advanced_chemistry_solid-state"
"jee-advanced_chemistry_surface-chemistry"
"jee-advanced_chemistry_periodic-table-and-periodicity"
"jee-advanced_chemistry_chemical-bonding-and-molecular-structure"
"jee-advanced_chemistry_isolation-of-elements"
"jee-advanced_chemistry_hydrogen"
"jee-advanced_chemistry_s-block-elements"
"jee-advanced_chemistry_p-block-elements"
"jee-advanced_chemistry_d-and-f-block-elements"
"jee-advanced_chemistry_coordination-compounds"
"jee-advanced_chemistry_salt-analysis"
"jee-advanced_chemistry_environmental-chemistry"
"jee-advanced_chemistry_basics-of-organic-chemistry"
"jee-advanced_chemistry_hydrocarbons"
"jee-advanced_chemistry_haloalkanes-and-haloarenes"
"jee-advanced_chemistry_alcohols-phenols-and-ethers"
"jee-advanced_chemistry_aldehydes-ketones-and-carboxylic-acids"
"jee-advanced_chemistry_compounds-containing-nitrogen"
"jee-advanced_chemistry_polymers"
"jee-advanced_chemistry_biomolecules"
"jee-advanced_chemistry_chemistry-in-everyday-life"
"jee-advanced_chemistry_practical-organic-chemistry"
"jee-advanced_mathematics_mathematical-induction-and-binomial-theorem"
"jee-advanced_mathematics_vector-algebra"
"jee-advanced_mathematics_3d-geometry"
"jee-advanced_mathematics_statistics"
"jee-advanced_mathematics_inverse-trigonometric-functions"
"jee-advanced_mathematics_properties-of-triangle"
"jee-advanced_mathematics_straight-lines-and-pair-of-straight-lines"
"jee-advanced_mathematics_circle"
"jee-advanced_mathematics_parabola"
"jee-advanced_mathematics_ellipse"
"jee-advanced_mathematics_hyperbola"
"jee-advanced_mathematics_functions"
"jee-advanced_mathematics_limits-continuity-and-differentiability"
"jee-advanced_mathematics_differentiation"
"jee-advanced_mathematics_application-of-derivatives"
"jee-advanced_mathematics_indefinite-integrals"
"jee-advanced_mathematics_definite-integration"
"jee-advanced_mathematics_application-of-integration"
"jee-advanced_mathematics_differential-equations"
"jee-main_physics_gravitation"
"jee-main_physics_magnetics"
"jee-main_physics_electromagnetic-induction"
"jee-main_physics_atoms-and-nuclei"
"jee-main_chemistry_some-basic-concepts-of-chemistry"
"jee-main_chemistry_structure-of-atom"
"jee-main_chemistry_redox-reactions"
"jee-main_chemistry_thermodynamics"
"jee-main_chemistry_electrochemistry"
"jee-main_chemistry_isolation-of-elements"
"jee-main_chemistry_hydrogen"
"jee-main_chemistry_s-block-elements"
"jee-main_chemistry_p-block-elements"
"jee-main_chemistry_d-and-f-block-elements"
"jee-main_chemistry_salt-analysis"
"jee-main_chemistry_environmental-chemistry"
"jee-main_chemistry_basics-of-organic-chemistry"
"jee-main_chemistry_practical-organic-chemistry"
"jee-main_mathematics_sets-and-relations"
"jee-main_mathematics_logarithm"
"jee-main_mathematics_mathematical-induction"
"jee-main_mathematics_vector-algebra"
"jee-main_mathematics_3d-geometry"
"jee-main_mathematics_statistics"
"jee-main_mathematics_mathematical-reasoning"
"jee-main_mathematics_trigonometric-ratio-and-identites"
"jee-main_mathematics_properties-of-triangle"
"jee-main_mathematics_height-and-distance"
"jee-main_mathematics_straight-lines-and-pair-of-straight-lines"
"jee-main_mathematics_circle"
"jee-main_mathematics_parabola"
"jee-main_mathematics_ellipse"
"jee-main_mathematics_hyperbola"
"jee-main_mathematics_area-under-the-curves"
)

START=${1:-0}
TOTAL=${#CHAPTERS[@]}
SUCCESS=0
FAIL=0
SKIP=0

echo "========================================="
echo "Batch scraping $TOTAL chapters from index $START"
echo "========================================="
echo ""

for ((i=START; i<TOTAL; i++)); do
  ENTRY="${CHAPTERS[$i]}"
  # Parse: exam_subject_slug
  FIRST_US=$(echo "$ENTRY" | cut -d'_' -f1)
  REST=$(echo "$ENTRY" | cut -d'_' -f2-)
  SECOND_US=$(echo "$REST" | cut -d'_' -f1)
  SLUG=$(echo "$REST" | cut -d'_' -f2-)
  
  OUTFILE="/tmp/scraped/${ENTRY}.json"
  
  # Skip if already scraped with content
  if [ -f "$OUTFILE" ] && [ -s "$OUTFILE" ]; then
    QCOUNT=$(python3 -c "import json; d=json.load(open('$OUTFILE')); print(len(d.get('q',[])))" 2>/dev/null || echo "0")
    if [ "$QCOUNT" != "0" ]; then
      echo "[$((i+1))/$TOTAL] SKIP $ENTRY (already has $QCOUNT questions)"
      SKIP=$((SKIP + 1))
      continue
    fi
  fi
  
  echo "[$((i+1))/$TOTAL] $ENTRY"
  if bash /home/z/my-project/scripts/scrape-v3.sh "$FIRST_US" "$SECOND_US" "$SLUG" 2>&1; then
    SUCCESS=$((SUCCESS + 1))
  else
    echo "  ✗ FAILED"
    FAIL=$((FAIL + 1))
  fi
  echo ""
  
  # Log progress
  echo "$(date '+%H:%M:%S') [$((i+1))/$TOTAL] $ENTRY - done=$SUCCESS fail=$FAIL skip=$SKIP" >> /tmp/scrape-progress.log
done

echo "========================================="
echo "Complete! Success: $SUCCESS, Failed: $FAIL, Skipped: $SKIP"
echo "========================================="