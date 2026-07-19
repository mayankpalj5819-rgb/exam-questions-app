#!/usr/bin/env python3
"""Self-contained scraper + importer - runs until all chapters are done"""
import subprocess, json, os, sys, time

os.makedirs("/tmp/scraped", exist_ok=True)

CHAPTERS = [
    # JEE Main Physics (28)
    ("jee-main","physics","units-and-measurements"),("jee-main","physics","vector-algebra"),
    ("jee-main","physics","motion-in-a-straight-line"),("jee-main","physics","motion-in-a-plane"),
    ("jee-main","physics","circular-motion"),("jee-main","physics","laws-of-motion"),
    ("jee-main","physics","work-power-and-energy"),("jee-main","physics","center-of-mass"),
    ("jee-main","physics","rotational-motion"),("jee-main","physics","properties-of-matter"),
    ("jee-main","physics","heat-and-thermodynamics"),("jee-main","physics","simple-harmonic-motion"),
    ("jee-main","physics","waves"),("jee-main","physics","gravitation"),
    ("jee-main","physics","electrostatics"),("jee-main","physics","current-electricity"),
    ("jee-main","physics","capacitor"),("jee-main","physics","magnetics"),
    ("jee-main","physics","magnetic-properties-of-matter"),("jee-main","physics","electromagnetic-induction"),
    ("jee-main","physics","alternating-current"),("jee-main","physics","electromagnetic-waves"),
    ("jee-main","physics","wave-optics"),("jee-main","physics","geometrical-optics"),
    ("jee-main","physics","atoms-and-nuclei"),("jee-main","physics","dual-nature-of-radiation"),
    ("jee-main","physics","electronic-devices"),("jee-main","physics","communication-systems"),
    # JEE Main Chemistry (32)
    ("jee-main","chemistry","some-basic-concepts-of-chemistry"),("jee-main","chemistry","structure-of-atom"),
    ("jee-main","chemistry","redox-reactions"),("jee-main","chemistry","gaseous-state"),
    ("jee-main","chemistry","chemical-equilibrium"),("jee-main","chemistry","ionic-equilibrium"),
    ("jee-main","chemistry","solutions"),("jee-main","chemistry","thermodynamics"),
    ("jee-main","chemistry","electrochemistry"),("jee-main","chemistry","chemical-kinetics-and-nuclear-chemistry"),
    ("jee-main","chemistry","solid-state"),("jee-main","chemistry","surface-chemistry"),
    ("jee-main","chemistry","periodic-table-and-periodicity"),("jee-main","chemistry","chemical-bonding-and-molecular-structure"),
    ("jee-main","chemistry","isolation-of-elements"),("jee-main","chemistry","hydrogen"),
    ("jee-main","chemistry","s-block-elements"),("jee-main","chemistry","p-block-elements"),
    ("jee-main","chemistry","d-and-f-block-elements"),("jee-main","chemistry","coordination-compounds"),
    ("jee-main","chemistry","salt-analysis"),("jee-main","chemistry","environmental-chemistry"),
    ("jee-main","chemistry","basics-of-organic-chemistry"),("jee-main","chemistry","hydrocarbons"),
    ("jee-main","chemistry","haloalkanes-and-haloarenes"),("jee-main","chemistry","alcohols-phenols-and-ethers"),
    ("jee-main","chemistry","aldehydes-ketones-and-carboxylic-acids"),("jee-main","chemistry","compounds-containing-nitrogen"),
    ("jee-main","chemistry","polymers"),("jee-main","chemistry","biomolecules"),
    ("jee-main","chemistry","chemistry-in-everyday-life"),("jee-main","chemistry","practical-organic-chemistry"),
    # JEE Main Mathematics (32)
    ("jee-main","mathematics","sets-and-relations"),("jee-main","mathematics","logarithm"),
    ("jee-main","mathematics","quadratic-equation-and-inequalities"),("jee-main","mathematics","sequences-and-series"),
    ("jee-main","mathematics","mathematical-induction"),("jee-main","mathematics","binomial-theorem"),
    ("jee-main","mathematics","matrices-and-determinants"),("jee-main","mathematics","permutations-and-combinations"),
    ("jee-main","mathematics","probability"),("jee-main","mathematics","vector-algebra"),
    ("jee-main","mathematics","3d-geometry"),("jee-main","mathematics","complex-numbers"),
    ("jee-main","mathematics","statistics"),("jee-main","mathematics","mathematical-reasoning"),
    ("jee-main","mathematics","trigonometric-ratio-and-identites"),("jee-main","mathematics","trigonometric-functions-and-equations"),
    ("jee-main","mathematics","inverse-trigonometric-functions"),("jee-main","mathematics","properties-of-triangle"),
    ("jee-main","mathematics","height-and-distance"),("jee-main","mathematics","straight-lines-and-pair-of-straight-lines"),
    ("jee-main","mathematics","circle"),("jee-main","mathematics","parabola"),
    ("jee-main","mathematics","ellipse"),("jee-main","mathematics","hyperbola"),
    ("jee-main","mathematics","functions"),("jee-main","mathematics","limits-continuity-and-differentiability"),
    ("jee-main","mathematics","differentiation"),("jee-main","mathematics","application-of-derivatives"),
    ("jee-main","mathematics","indefinite-integrals"),("jee-main","mathematics","definite-integration"),
    ("jee-main","mathematics","area-under-the-curves"),("jee-main","mathematics","differential-equations"),
    # JEE Advanced Physics (24)
    ("jee-advanced","physics","units-and-measurements"),("jee-advanced","physics","motion"),
    ("jee-advanced","physics","laws-of-motion"),("jee-advanced","physics","work-power-and-energy"),
    ("jee-advanced","physics","impulse-and-momentum"),("jee-advanced","physics","rotational-motion"),
    ("jee-advanced","physics","properties-of-matter"),("jee-advanced","physics","heat-and-thermodynamics"),
    ("jee-advanced","physics","simple-harmonic-motion"),("jee-advanced","physics","waves"),
    ("jee-advanced","physics","gravitation"),("jee-advanced","physics","motion-in-a-plane"),
    ("jee-advanced","physics","electrostatics"),("jee-advanced","physics","current-electricity"),
    ("jee-advanced","physics","capacitor"),("jee-advanced","physics","magnetism"),
    ("jee-advanced","physics","electromagnetic-induction"),("jee-advanced","physics","alternating-current"),
    ("jee-advanced","physics","electromagnetic-waves"),("jee-advanced","physics","geometrical-optics"),
    ("jee-advanced","physics","wave-optics"),("jee-advanced","physics","practical-physics"),
    ("jee-advanced","physics","atoms-and-nuclei"),("jee-advanced","physics","dual-nature-of-radiation"),
    # JEE Advanced Chemistry (32)
    ("jee-advanced","chemistry","some-basic-concepts-of-chemistry"),("jee-advanced","chemistry","structure-of-atom"),
    ("jee-advanced","chemistry","redox-reactions"),("jee-advanced","chemistry","gaseous-state"),
    ("jee-advanced","chemistry","chemical-equilibrium"),("jee-advanced","chemistry","ionic-equilibrium"),
    ("jee-advanced","chemistry","solutions"),("jee-advanced","chemistry","thermodynamics"),
    ("jee-advanced","chemistry","chemical-kinetics-and-nuclear-chemistry"),("jee-advanced","chemistry","electrochemistry"),
    ("jee-advanced","chemistry","solid-state"),("jee-advanced","chemistry","surface-chemistry"),
    ("jee-advanced","chemistry","periodic-table-and-periodicity"),("jee-advanced","chemistry","chemical-bonding-and-molecular-structure"),
    ("jee-advanced","chemistry","isolation-of-elements"),("jee-advanced","chemistry","hydrogen"),
    ("jee-advanced","chemistry","s-block-elements"),("jee-advanced","chemistry","p-block-elements"),
    ("jee-advanced","chemistry","d-and-f-block-elements"),("jee-advanced","chemistry","coordination-compounds"),
    ("jee-advanced","chemistry","salt-analysis"),("jee-advanced","chemistry","environmental-chemistry"),
    ("jee-advanced","chemistry","basics-of-organic-chemistry"),("jee-advanced","chemistry","hydrocarbons"),
    ("jee-advanced","chemistry","haloalkanes-and-haloarenes"),("jee-advanced","chemistry","alcohols-phenols-and-ethers"),
    ("jee-advanced","chemistry","aldehydes-ketones-and-carboxylic-acids"),("jee-advanced","chemistry","compounds-containing-nitrogen"),
    ("jee-advanced","chemistry","polymers"),("jee-advanced","chemistry","biomolecules"),
    ("jee-advanced","chemistry","chemistry-in-everyday-life"),("jee-advanced","chemistry","practical-organic-chemistry"),
    # JEE Advanced Mathematics (26)
    ("jee-advanced","mathematics","quadratic-equation-and-inequalities"),("jee-advanced","mathematics","sequences-and-series"),
    ("jee-advanced","mathematics","mathematical-induction-and-binomial-theorem"),("jee-advanced","mathematics","matrices-and-determinants"),
    ("jee-advanced","mathematics","permutations-and-combinations"),("jee-advanced","mathematics","probability"),
    ("jee-advanced","mathematics","vector-algebra"),("jee-advanced","mathematics","3d-geometry"),
    ("jee-advanced","mathematics","statistics"),("jee-advanced","mathematics","complex-numbers"),
    ("jee-advanced","mathematics","trigonometric-functions-and-equations"),("jee-advanced","mathematics","inverse-trigonometric-functions"),
    ("jee-advanced","mathematics","properties-of-triangle"),("jee-advanced","mathematics","straight-lines-and-pair-of-straight-lines"),
    ("jee-advanced","mathematics","circle"),("jee-advanced","mathematics","parabola"),
    ("jee-advanced","mathematics","ellipse"),("jee-advanced","mathematics","hyperbola"),
    ("jee-advanced","mathematics","functions"),("jee-advanced","mathematics","limits-continuity-and-differentiability"),
    ("jee-advanced","mathematics","differentiation"),("jee-advanced","mathematics","application-of-derivatives"),
    ("jee-advanced","mathematics","indefinite-integrals"),("jee-advanced","mathematics","definite-integration"),
    ("jee-advanced","mathematics","application-of-integration"),("jee-advanced","mathematics","differential-equations"),
]

EVAL_JS = "JSON.stringify(Array.from(document.querySelectorAll('a.flex.gap-2[href*=question]')).map(c=>({t:c.querySelector('.flex.flex-col')?.children[0]?.textContent?.trim().substring(0,500)||'',m:c.querySelector('.flex.flex-col')?.children[1]?.textContent?.trim()||'',u:c.getAttribute('href')||''})))"

log_file = open("/tmp/scrape-python.log", "a", buffering=1)

def ab(args, timeout=25):
    try:
        r = subprocess.run(["agent-browser"] + args, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip()
    except:
        return ""

def scrape(exam, subj, slug):
    outpath = f"/tmp/scraped/{exam}_{subj}_{slug}.json"
    # Skip if done
    if os.path.exists(outpath) and os.path.getsize(outpath) > 10:
        try:
            d = json.load(open(outpath))
            if d.get("q") and len(d["q"]) > 0:
                return len(d["q"]), True
        except:
            pass

    url = f"https://questions.examside.com/past-years/jee/{exam}/{subj}/{slug}"
    
    ab(["close"])
    time.sleep(1)
    
    result = ab(["open", url], 40)
    if "http" not in result:
        msg = f"[SKIP] {slug} - could not open"
        print(msg); log_file.write(msg + "\n")
        return 0, False
    
    time.sleep(4)
    ab(["wait", "--load", "networkidle"], 20)
    time.sleep(2)
    
    raw = ab(["eval", EVAL_JS], 30)
    
    if not raw or raw == "{}" or len(raw) < 10:
        json.dump({"q": [], "n": 0}, open(outpath, "w"))
        msg = f"{slug} → 0 questions"
        print(msg); log_file.write(msg + "\n")
        return 0, True
    
    try:
        cleaned = raw
        if cleaned.startswith('"') and cleaned.endswith('"'):
            cleaned = cleaned[1:-1].replace('\\"', '"')
        data = json.loads(cleaned)
        if isinstance(data, list):
            result = {"q": data, "n": len(data)}
        else:
            result = data
        json.dump(result, open(outpath, "w"))
        msg = f"{slug} → {result.get('n', 0)} questions"
        print(msg); log_file.write(msg + "\n")
        return result.get("n", 0), True
    except Exception as e:
        json.dump({"q": [], "n": 0}, open(outpath, "w"))
        msg = f"{slug} → ERROR: {str(e)[:60]}"
        print(msg); log_file.write(msg + "\n")
        return 0, False

def main():
    start = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    total_q = 0
    done = 0
    errors = 0
    
    msg = f"=== Starting at index {start}, {len(CHAPTERS)} chapters ==="
    print(msg); log_file.write(msg + "\n")
    
    for i in range(start, len(CHAPTERS)):
        exam, subj, slug = CHAPTERS[i]
        done += 1
        count, ok = scrape(exam, subj, slug)
        total_q += count
        if not ok: errors += 1
        time.sleep(1)
    
    ab(["close"])
    final = f"\n=== DONE: {done} chapters, {total_q} total, {errors} errors ==="
    print(final); log_file.write(final + "\n")
    log_file.close()

if __name__ == "__main__":
    main()