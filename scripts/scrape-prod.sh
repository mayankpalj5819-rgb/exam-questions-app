#!/bin/bash
# Production scraper - uses Array.from().map() approach
# Usage: bash scripts/scrape-prod.sh <start_index> <output_dir>
# Runs in background, scrapes all 174 chapters

DIR="${2:-/tmp/scraped}"
START="${1:-0}"
LOG="/tmp/scrape-prod.log"
AGENT_PID=""

cleanup() {
  echo "Cleaning up..." >> "$LOG"
  agent-browser close 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

mkdir -p "$DIR"

# All chapters: "exam|subject|slug|name"
CHAPTERS=(
"jee-main|physics|units-and-measurements|Units & Measurements"
"jee-main|physics|vector-algebra|Vector Algebra"
"jee-main|physics|motion-in-a-straight-line|Motion in a Straight Line"
"jee-main|physics|motion-in-a-plane|Motion in a Plane"
"jee-main|physics|circular-motion|Circular Motion"
"jee-main|physics|laws-of-motion|Laws of Motion"
"jee-main|physics|work-power-and-energy|Work Power & Energy"
"jee-main|physics|center-of-mass|Centre of Mass"
"jee-main|physics|rotational-motion|Rotational Motion"
"jee-main|physics|properties-of-matter|Properties of Matter"
"jee-main|physics|heat-and-thermodynamics|Heat & Thermodynamics"
"jee-main|physics|simple-harmonic-motion|SHM"
"jee-main|physics|waves|Waves"
"jee-main|physics|gravitation|Gravitation"
"jee-main|physics|electrostatics|Electrostatics"
"jee-main|physics|current-electricity|Current Electricity"
"jee-main|physics|capacitor|Capacitor"
"jee-main|physics|magnetics|Magnetics"
"jee-main|physics|magnetic-properties-of-matter|Magnetic Properties"
"jee-main|physics|electromagnetic-induction|EMI"
"jee-main|physics|alternating-current|AC"
"jee-main|physics|electromagnetic-waves|EM Waves"
"jee-main|physics|wave-optics|Wave Optics"
"jee-main|physics|geometrical-optics|Geometrical Optics"
"jee-main|physics|atoms-and-nuclei|Atoms & Nuclei"
"jee-main|physics|dual-nature-of-radiation|Dual Nature"
"jee-main|physics|electronic-devices|Electronic Devices"
"jee-main|physics|communication-systems|Communication Systems"
"jee-main|chemistry|some-basic-concepts-of-chemistry|Basic Concepts"
"jee-main|chemistry|structure-of-atom|Structure of Atom"
"jee-main|chemistry|redox-reactions|Redox"
"jee-main|chemistry|gaseous-state|Gaseous State"
"jee-main|chemistry|chemical-equilibrium|Chemical Equilibrium"
"jee-main|chemistry|ionic-equilibrium|Ionic Equilibrium"
"jee-main|chemistry|solutions|Solutions"
"jee-main|chemistry|thermodynamics|Thermodynamics"
"jee-main|chemistry|electrochemistry|Electrochemistry"
"jee-main|chemistry|chemical-kinetics-and-nuclear-chemistry|Chemical Kinetics"
"jee-main|chemistry|solid-state|Solid State"
"jee-main|chemistry|surface-chemistry|Surface Chemistry"
"jee-main|chemistry|periodic-table-and-periodicity|Periodic Table"
"jee-main|chemistry|chemical-bonding-and-molecular-structure|Chemical Bonding"
"jee-main|chemistry|isolation-of-elements|Isolation of Elements"
"jee-main|chemistry|hydrogen|Hydrogen"
"jee-main|chemistry|s-block-elements|s-Block"
"jee-main|chemistry|p-block-elements|p-Block"
"jee-main|chemistry|d-and-f-block-elements|d&f Block"
"jee-main|chemistry|coordination-compounds|Coordination Compounds"
"jee-main|chemistry|salt-analysis|Salt Analysis"
"jee-main|chemistry|environmental-chemistry|Environmental Chemistry"
"jee-main|chemistry|basics-of-organic-chemistry|Organic Basics"
"jee-main|chemistry|hydrocarbons|Hydrocarbons"
"jee-main|chemistry|haloalkanes-and-haloarenes|Haloalkanes"
"jee-main|chemistry|alcohols-phenols-and-ethers|Alcohols & Ethers"
"jee-main|chemistry|aldehydes-ketones-and-carboxylic-acids|Aldehydes & Ketones"
"jee-main|chemistry|compounds-containing-nitrogen|Nitrogen Compounds"
"jee-main|chemistry|polymers|Polymers"
"jee-main|chemistry|biomolecules|Biomolecules"
"jee-main|chemistry|chemistry-in-everyday-life|Everyday Chemistry"
"jee-main|chemistry|practical-organic-chemistry|Practical Organic"
"jee-main|mathematics|sets-and-relations|Sets & Relations"
"jee-main|mathematics|logarithm|Logarithm"
"jee-main|mathematics|quadratic-equation-and-inequalities|Quadratic Equations"
"jee-main|mathematics|sequences-and-series|Sequences & Series"
"jee-main|mathematics|mathematical-induction|Math Induction"
"jee-main|mathematics|binomial-theorem|Binomial Theorem"
"jee-main|mathematics|matrices-and-determinants|Matrices"
"jee-main|mathematics|permutations-and-combinations|Permutations"
"jee-main|mathematics|probability|Probability"
"jee-main|mathematics|vector-algebra|Vector Algebra"
"jee-main|mathematics|3d-geometry|3D Geometry"
"jee-main|mathematics|complex-numbers|Complex Numbers"
"jee-main|mathematics|statistics|Statistics"
"jee-main|mathematics|mathematical-reasoning|Math Reasoning"
"jee-main|mathematics|trigonometric-ratio-and-identites|Trig Ratios"
"jee-main|mathematics|trigonometric-functions-and-equations|Trig Functions"
"jee-main|mathematics|inverse-trigonometric-functions|Inverse Trig"
"jee-main|mathematics|properties-of-triangle|Triangle Properties"
"jee-main|mathematics|height-and-distance|Height & Distance"
"jee-main|mathematics|straight-lines-and-pair-of-straight-lines|Straight Lines"
"jee-main|mathematics|circle|Circle"
"jee-main|mathematics|parabola|Parabola"
"jee-main|mathematics|ellipse|Ellipse"
"jee-main|mathematics|hyperbola|Hyperbola"
"jee-main|mathematics|functions|Functions"
"jee-main|mathematics|limits-continuity-and-differentiability|Limits"
"jee-main|mathematics|differentiation|Differentiation"
"jee-main|mathematics|application-of-derivatives|Application of Derivatives"
"jee-main|mathematics|indefinite-integrals|Indefinite Integrals"
"jee-main|mathematics|definite-integration|Definite Integration"
"jee-main|mathematics|area-under-the-curves|Area Under Curves"
"jee-main|mathematics|differential-equations|Differential Equations"
"jee-advanced|physics|units-and-measurements|Units"
"jee-advanced|physics|motion|Motion"
"jee-advanced|physics|laws-of-motion|Laws of Motion"
"jee-advanced|physics|work-power-and-energy|Work & Energy"
"jee-advanced|physics|impulse-and-momentum|Impulse & Momentum"
"jee-advanced|physics|rotational-motion|Rotational Motion"
"jee-advanced|physics|properties-of-matter|Properties"
"jee-advanced|physics|heat-and-thermodynamics|Heat & Thermo"
"jee-advanced|physics|simple-harmonic-motion|SHM"
"jee-advanced|physics|waves|Waves"
"jee-advanced|physics|gravitation|Gravitation"
"jee-advanced|physics|motion-in-a-plane|Motion in Plane"
"jee-advanced|physics|electrostatics|Electrostatics"
"jee-advanced|physics|current-electricity|Current Electricity"
"jee-advanced|physics|capacitor|Capacitor"
"jee-advanced|physics|magnetism|Magnetism"
"jee-advanced|physics|electromagnetic-induction|EMI"
"jee-advanced|physics|alternating-current|AC"
"jee-advanced|physics|electromagnetic-waves|EM Waves"
"jee-advanced|physics|geometrical-optics|Geometrical Optics"
"jee-advanced|physics|wave-optics|Wave Optics"
"jee-advanced|physics|practical-physics|Practical Physics"
"jee-advanced|physics|atoms-and-nuclei|Atoms & Nuclei"
"jee-advanced|physics|dual-nature-of-radiation|Dual Nature"
"jee-advanced|chemistry|some-basic-concepts-of-chemistry|Basic Concepts"
"jee-advanced|chemistry|structure-of-atom|Structure of Atom"
"jee-advanced|chemistry|redox-reactions|Redox"
"jee-advanced|chemistry|gaseous-state|Gaseous State"
"jee-advanced|chemistry|chemical-equilibrium|Chemical Equilibrium"
"jee-advanced|chemistry|ionic-equilibrium|Ionic Equilibrium"
"jee-advanced|chemistry|solutions|Solutions"
"jee-advanced|chemistry|thermodynamics|Thermodynamics"
"jee-advanced|chemistry|chemical-kinetics-and-nuclear-chemistry|Chemical Kinetics"
"jee-advanced|chemistry|electrochemistry|Electrochemistry"
"jee-advanced|chemistry|solid-state|Solid State"
"jee-advanced|chemistry|surface-chemistry|Surface Chemistry"
"jee-advanced|chemistry|periodic-table-and-periodicity|Periodic Table"
"jee-advanced|chemistry|chemical-bonding-and-molecular-structure|Chemical Bonding"
"jee-advanced|chemistry|isolation-of-elements|Isolation of Elements"
"jee-advanced|chemistry|hydrogen|Hydrogen"
"jee-advanced|chemistry|s-block-elements|s-Block"
"jee-advanced|chemistry|p-block-elements|p-Block"
"jee-advanced|chemistry|d-and-f-block-elements|d&f Block"
"jee-advanced|chemistry|coordination-compounds|Coordination"
"jee-advanced|chemistry|salt-analysis|Salt Analysis"
"jee-advanced|chemistry|environmental-chemistry|Environmental"
"jee-advanced|chemistry|basics-of-organic-chemistry|Organic Basics"
"jee-advanced|chemistry|hydrocarbons|Hydrocarbons"
"jee-advanced|chemistry|haloalkanes-and-haloarenes|Haloalkanes"
"jee-advanced|chemistry|alcohols-phenols-and-ethers|Alcohols & Ethers"
"jee-advanced|chemistry|aldehydes-ketones-and-carboxylic-acids|Aldehydes & Ketones"
"jee-advanced|chemistry|compounds-containing-nitrogen|Nitrogen Compounds"
"jee-advanced|chemistry|polymers|Polymers"
"jee-advanced|chemistry|biomolecules|Biomolecules"
"jee-advanced|chemistry|chemistry-in-everyday-life|Everyday Chemistry"
"jee-advanced|chemistry|practical-organic-chemistry|Practical Organic"
"jee-advanced|mathematics|quadratic-equation-and-inequalities|Quadratic"
"jee-advanced|mathematics|sequences-and-series|Sequences"
"jee-advanced|mathematics|mathematical-induction-and-binomial-theorem|Induction & Binomial"
"jee-advanced|mathematics|matrices-and-determinants|Matrices"
"jee-advanced|mathematics|permutations-and-combinations|Permutations"
"jee-advanced|mathematics|probability|Probability"
"jee-advanced|mathematics|vector-algebra|Vector Algebra"
"jee-advanced|mathematics|3d-geometry|3D Geometry"
"jee-advanced|mathematics|statistics|Statistics"
"jee-advanced|mathematics|complex-numbers|Complex Numbers"
"jee-advanced|mathematics|trigonometric-functions-and-equations|Trig Functions"
"jee-advanced|mathematics|inverse-trigonometric-functions|Inverse Trig"
"jee-advanced|mathematics|properties-of-triangle|Triangle"
"jee-advanced|mathematics|straight-lines-and-pair-of-straight-lines|Straight Lines"
"jee-advanced|mathematics|circle|Circle"
"jee-advanced|mathematics|parabola|Parabola"
"jee-advanced|mathematics|ellipse|Ellipse"
"jee-advanced|mathematics|hyperbola|Hyperbola"
"jee-advanced|mathematics|functions|Functions"
"jee-advanced|mathematics|limits-continuity-and-differentiability|Limits"
"jee-advanced|mathematics|differentiation|Differentiation"
"jee-advanced|mathematics|application-of-derivatives|App of Derivatives"
"jee-advanced|mathematics|indefinite-integrals|Indefinite Integrals"
"jee-advanced|mathematics|definite-integration|Definite Integration"
"jee-advanced|mathematics|application-of-integration|App of Integration"
"jee-advanced|mathematics|differential-equations|Differential Eq"
)

TOTAL=${#CHAPTERS[@]}
DONE=0
ERR=0

echo "=== Scraping started at $(date) from index $START ===" | tee "$LOG"

for ((i=START; i<TOTAL; i++)); do
  IFS='|' read -r EXAM SUBJ SLUG NAME <<< "${CHAPTERS[$i]}"
  DONE=$((DONE + 1))
  OUT="$DIR/${EXAM}_${SUBJ}_${SLUG}.json"
  URL="https://questions.examside.com/past-years/jee/${EXAM}/${SUBJ}/${SLUG}"

  # Skip if done
  if [ -f "$OUT" ] && [ -s "$OUT" ]; then
    C=$(python3 -c "import json;print(len(json.load(open('$OUT')).get('q',[])))" 2>/dev/null || echo 0)
    if [ "$C" -gt "0" ] 2>/dev/null; then
      echo "[$DONE/$TOTAL] SKIP $SLUG ($C)" | tee -a "$LOG"
      continue
    fi
  fi

  echo "[$DONE/$TOTAL] $EXAM/$SUBJ/$SLUG" | tee -a "$LOG"

  # Close & reopen for fresh state
  agent-browser close 2>/dev/null || true
  sleep 1

  agent-browser open "$URL" 2>/dev/null
  sleep 4
  agent-browser wait --load networkidle 2>/dev/null || true
  sleep 2

  # Extract using Array.from approach (reliable!)
  agent-browser eval "JSON.stringify(Array.from(document.querySelectorAll('a.flex.gap-2[href*=question]')).map(c=>({t:c.querySelector('.flex.flex-col')?.children[0]?.textContent?.trim().substring(0,500)||'',m:c.querySelector('.flex.flex-col')?.children[1]?.textContent?.trim()||'',u:c.getAttribute('href')||''})))" > "$OUT.raw" 2>/dev/null

  # Process: strip outer quotes, validate, save
  python3 -c "
import json,sys
raw = open('$OUT.raw').read().strip()
if not raw or raw == '{}':
    open('$OUT','w').write(json.dumps({'q':[],'n':0}))
    print('  → 0 questions')
    sys.exit(0)
# Strip outer quotes
if raw.startswith('\"') and raw.endswith('\"'):
    raw = raw[1:-1].replace('\\\\\"','\"')
try:
    data = json.loads(raw)
    if isinstance(data, list):
        result = {'q': data, 'n': len(data)}
    else:
        result = data
    open('$OUT','w').write(json.dumps(result))
    print(f'  → {result.get(\"n\", len(result.get(\"q\",[])))} questions')
except Exception as e:
    open('$OUT','w').write(json.dumps({'q':[],'n':0}))
    print(f'  → Parse error: {e}')
" 2>/dev/null | tee -a "$LOG"

  rm -f "$OUT.raw"
  sleep 1
done

agent-browser close 2>/dev/null || true
echo "=== Done at $(date). $DONE processed, $ERR errors ===" | tee -a "$LOG"
echo "Files: $(ls $DIR/*.json 2>/dev/null | wc -l)" | tee -a "$LOG"