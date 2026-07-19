#!/bin/bash
# Scrape ONE chapter - lean version, outputs directly to file
# Usage: bash scrape-one.sh exam-type subject chapter-slug

EXAM="$1"
SUBJ="$2"
SLUG="$3"
DIR="/tmp/scraped"
OUT="$DIR/${EXAM}_${SUBJ}_${SLUG}.json"

mkdir -p "$DIR"

# Skip if already has questions
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

agent-browser open "https://questions.examside.com/past-years/jee/${EXAM}/${SUBJ}/${SLUG}" 2>/dev/null
sleep 3
agent-browser wait --load networkidle 2>/dev/null || true
sleep 1

# Extract directly to file (no shell variable, avoids truncation)
agent-browser eval '(()=>{const cs=document.querySelectorAll("a.flex.gap-2[href*=\"/past-years/jee/question/\"]");const r=[];cs.forEach((c,i)=>{try{const f=c.querySelector(".flex.flex-col");if(!f)return;const t=f.children[0];if(!t)return;const txt=t.textContent.trim();const met=f.children[1];const imgs=[];c.querySelectorAll("img").forEach(img=>{const s=img.getAttribute("src")||"";if(s.length>20&&!s.includes("favicon")&&!s.includes("logo"))imgs.push(s)});if(txt.length<10)return;r.push({t:txt.substring(0,2000),m:met?met.textContent.trim():"",u:c.getAttribute("href")||"",im:imgs,i})}catch(e){}});return JSON.stringify({q:r,n:r.length})})' > "$OUT.raw" 2>/dev/null

# Strip outer quotes  
python3 -c "
import sys,json
raw=open('$OUT.raw').read().strip()
if raw.startswith('\"') and raw.endswith('\"'):
    raw=raw[1:-1]
    raw=raw.replace('\\\\\"','\"').replace('\\\"','\"')
open('$OUT','w').write(raw)
" 2>/dev/null || cp "$OUT.raw" "$OUT"

rm -f "$OUT.raw"

C=$(python3 -c "import json;d=json.load(open('$OUT'));print(len(d.get('q',[])))" 2>/dev/null || echo 0)
echo "  → $C questions"

agent-browser close 2>/dev/null || true