#!/bin/bash
# Scrape ALL remaining chapters - run in sets of 6
cd /home/z/my-project
echo "Starting at $(date)" > /tmp/scrape-progress.txt

# JEE Main Physics (remaining 22)
for SL in units-and-measurements vector-algebra motion-in-a-straight-line motion-in-a-plane circular-motion center-of-mass rotational-motion properties-of-matter heat-and-thermodynamics simple-harmonic-motion waves gravitation capacitor magnetics magnetic-properties-of-matter electromagnetic-induction alternating-current electromagnetic-waves atoms-and-nuclei dual-nature-of-radiation electronic-devices communication-systems; do
  bash scripts/s1.sh jee-main physics "$SL" 2>&1
done
echo "JEE Main Physics done: $(date)" >> /tmp/scrape-progress.txt

# JEE Main Chemistry (32)
for SL in some-basic-concepts-of-chemistry structure-of-atom redox-reactions gaseous-state chemical-equilibrium ionic-equilibrium solutions thermodynamics electrochemistry chemical-kinetics-and-nuclear-chemistry solid-state surface-chemistry periodic-table-and-periodicity chemical-bonding-and-molecular-structure isolation-of-elements hydrogen s-block-elements p-block-elements d-and-f-block-elements coordination-compounds salt-analysis environmental-chemistry basics-of-organic-chemistry hydrocarbons haloalkanes-and-haloarenes alcohols-phenols-and-ethers aldehydes-ketones-and-carboxylic-acids compounds-containing-nitrogen polymers biomolecules chemistry-in-everyday-life practical-organic-chemistry; do
  bash scripts/s1.sh jee-main chemistry "$SL" 2>&1
done
echo "JEE Main Chemistry done: $(date)" >> /tmp/scrape-progress.txt

# JEE Main Mathematics (32)
for SL in sets-and-relations logarithm quadratic-equation-and-inequalities sequences-and-series mathematical-induction binomial-theorem matrices-and-determinants permutations-and-combinations probability vector-algebra 3d-geometry complex-numbers statistics mathematical-reasoning trigonometric-ratio-and-identites trigonometric-functions-and-equations inverse-trigonometric-functions properties-of-triangle height-and-distance straight-lines-and-pair-of-straight-lines circle parabola ellipse hyperbola functions limits-continuity-and-differentiability differentiation application-of-derivatives indefinite-integrals definite-integration area-under-the-curves differential-equations; do
  bash scripts/s1.sh jee-main mathematics "$SL" 2>&1
done
echo "JEE Main Math done: $(date)" >> /tmp/scrape-progress.txt

# JEE Advanced Physics (24)
for SL in units-and-measurements motion laws-of-motion work-power-and-energy impulse-and-momentum rotational-motion properties-of-matter heat-and-thermodynamics simple-harmonic-motion waves gravitation motion-in-a-plane electrostatics current-electricity capacitor magnetism electromagnetic-induction alternating-current electromagnetic-waves geometrical-optics wave-optics practical-physics atoms-and-nuclei dual-nature-of-radiation; do
  bash scripts/s1.sh jee-advanced physics "$SL" 2>&1
done
echo "JEE Adv Physics done: $(date)" >> /tmp/scrape-progress.txt

# JEE Advanced Chemistry (32)
for SL in some-basic-concepts-of-chemistry structure-of-atom redox-reactions gaseous-state chemical-equilibrium ionic-equilibrium solutions thermodynamics chemical-kinetics-and-nuclear-chemistry electrochemistry solid-state surface-chemistry periodic-table-and-periodicity chemical-bonding-and-molecular-structure isolation-of-elements hydrogen s-block-elements p-block-elements d-and-f-block-elements coordination-compounds salt-analysis environmental-chemistry basics-of-organic-chemistry hydrocarbons haloalkanes-and-haloarenes alcohols-phenols-and-ethers aldehydes-ketones-and-carboxylic-acids compounds-containing-nitrogen polymers biomolecules chemistry-in-everyday-life practical-organic-chemistry; do
  bash scripts/s1.sh jee-advanced chemistry "$SL" 2>&1
done
echo "JEE Adv Chemistry done: $(date)" >> /tmp/scrape-progress.txt

# JEE Advanced Mathematics (26)
for SL in quadratic-equation-and-inequalities sequences-and-series mathematical-induction-and-binomial-theorem matrices-and-determinants permutations-and-combinations probability vector-algebra 3d-geometry statistics complex-numbers trigonometric-functions-and-equations inverse-trigonometric-functions properties-of-triangle straight-lines-and-pair-of-straight-lines circle parabola ellipse hyperbola functions limits-continuity-and-differentiability differentiation application-of-derivatives indefinite-integrals definite-integration application-of-integration differential-equations; do
  bash scripts/s1.sh jee-advanced mathematics "$SL" 2>&1
done
echo "JEE Adv Math done: $(date)" >> /tmp/scrape-progress.txt

echo "ALL DONE: $(date)" >> /tmp/scrape-progress.txt
agent-browser close 2>/dev/null
echo "Total files: $(ls /tmp/scraped/*.json | wc -l)"
TOTAL_Q=$(python3 -c "import os,glob;print(sum(json.load(open(f)).get('n',0) for f in glob.glob('/tmp/scraped/*.json')))" 2>/dev/null)
echo "Total questions scraped: $TOTAL_Q"