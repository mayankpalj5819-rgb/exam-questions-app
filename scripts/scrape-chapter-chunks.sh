#!/bin/bash
# scrape-chapter-chunks.sh - Extract questions in chunks of 40 to avoid output limits
# Usage: bash scrape-chapter-chunks.sh exam subject slug output_dir
EXAM="$1"
SUBJ="$2"
SLUG="$3"
DIR="$4"
OUT="$DIR/${EXAM}_${SUBJ}_${SLUG}.json"
URL="https://questions.examside.com/past-years/jee/${EXAM}/${SUBJ}/${SLUG}"

mkdir -p "$DIR"

# Skip if done
if [ -f "$OUT" ] && [ -s "$OUT" ]; then
  C=$(python3 -c "import json;d=json.load(open('$OUT'));print(len(d.get('q',[])))" 2>/dev/null || echo 0)
  if [ "$C" -gt "0" ] 2>/dev/null; then
    echo "SKIP $SLUG ($C done)"
    exit 0
  fi
fi

echo "SCRAPE $SLUG"

agent-browser close 2>/dev/null || true
sleep 1
agent-browser open "$URL" 2>/dev/null
sleep 3
agent-browser wait --load networkidle 2>/dev/null || true
sleep 1

# Get total count
TOTAL=$(agent-browser eval 'document.querySelectorAll("a.flex.gap-2[href*=\"/past-years/jee/question/\"]').length' 2>/dev/null | tr -d '"')
TOTAL=${TOTAL:-0}
echo "  Found $TOTAL questions on page"

if [ "$TOTAL" -eq "0" ]; then
  echo '{"q":[],"n":0}' > "$OUT"
  agent-browser close 2>/dev/null || true
  echo "  → 0 questions"
  exit 0
fi

# Extract in chunks of 40
CHUNK=40
ALL_Q="[]"
EXTRACTED=0

for START in $(seq 0 $CHUNK $((TOTAL - 1))); do
  END=$((START + CHUNK))
  if [ "$END" -gt "$TOTAL" ]; then END=$TOTAL; fi
  
  CHUNK_JSON=$(agent-browser eval "(()=>{const cs=document.querySelectorAll('a.flex.gap-2[href*=\"/past-years/jee/question/\"]');const r=[];for(let i=${START};i<${END};i++){const c=cs[i];if(!c)continue;const f=c.querySelector('.flex.flex-col');if(!f)continue;const t=f.children[0];if(!t)continue;const met=f.children[1];r.push({t:t.textContent.trim().substring(0,2000),m:met?met.textContent.trim():'',u:c.getAttribute('href')||'',i})}return JSON.stringify(r)})" 2>/dev/null)
  
  # Merge: python joins the arrays
  MERGED=$(python3 -c "
import json,sys
try:
    existing=json.loads('''$ALL_Q''')
    chunk=json.loads('$CHUNK_JSON'.replace(\"'\",\"\\'\"))
    existing.extend(chunk)
    print(json.dumps(existing))
except Exception as e:
    print(f'ERR:{e}',file=sys.stderr)
    print('''$ALL_Q''')
" 2>/dev/null)
  
  if [ -n "$MERGED" ]; then
    ALL_Q="$MERGED"
  fi
  
  EXTRACTED=$(python3 -c "import json;print(len(json.loads('''$ALL_Q''')))" 2>/dev/null || echo "$EXTRACTED")
  echo "  Chunk ${START}-${END}: got $((END - START)), total so far: $EXTRACTED"
  
  sleep 0.5
done

# Save final result
FINAL=$(python3 -c "
import json
q=json.loads('''$ALL_Q''')
print(json.dumps({'q':q,'n':len(q)}))
" 2>/dev/null)

echo "$FINAL" > "$OUT"
echo "  → Saved $EXTRACTED questions to $OUT"

agent-browser close 2>/dev/null || true