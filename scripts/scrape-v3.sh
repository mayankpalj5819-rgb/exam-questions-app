#!/bin/bash
# Robust chapter scraper for ExamSide v4
# Usage: bash scripts/scrape-v3.sh <exam> <subject> <slug>
# Output: /tmp/scraped/<exam>_<subject>_<slug>.json

EXAM="$1"
SUBJECT="$2"
SLUG="$3"
OUTFILE="/tmp/scraped/${EXAM}_${SUBJECT}_${SLUG}.json"
BASE_URL="https://questions.examside.com/past-years/jee/${EXAM}/${SUBJECT}/${SLUG}"

echo "→ $EXAM/$SUBJECT/$SLUG"

# Navigate (don't use set -e, handle errors manually)
agent-browser open "$BASE_URL" > /dev/null 2>&1 || {
  echo "  ✗ Navigation failed"
  exit 1
}

# Wait for page to fully render - retry up to 3 times
COUNT=""
for attempt in 1 2 3; do
  sleep 3
  COUNT=$(agent-browser eval "(function(){return document.querySelectorAll('a.flex.gap-2[href*=\"/past-years/jee/question/\"]').length})()" 2>/dev/null | tr -d '[:space:]')
  if [ -n "$COUNT" ] && [ "$COUNT" != "0" ] && [ "$COUNT" != "null" ]; then
    break
  fi
  echo "  Retry $attempt: waiting for page..."
  sleep 3
done

if [ -z "$COUNT" ] || [ "$COUNT" = "0" ] || [ "$COUNT" = "null" ]; then
  echo "  SKIP (no questions found after retries)"
  exit 0
fi
echo "  $COUNT questions"

# Extract all at once (IIFE avoids const redeclaration)
agent-browser eval "(function(){var cards=document.querySelectorAll('a.flex.gap-2[href*=\"/past-years/jee/question/\"]');var r=[];for(var i=0;i<cards.length;i++){var col=cards[i].querySelector('.flex.flex-col');if(!col||col.children.length<2)continue;r.push({t:col.children[0].innerText.trim(),m:col.children[1].innerText.trim(),u:cards[i].getAttribute('href')||'',i:i})}return JSON.stringify(r)})()" 2>/dev/null | python3 -c "
import sys, json
raw = sys.stdin.read().strip()
if not raw or raw == 'null':
    sys.exit(1)
try:
    inner = json.loads(raw)
    if isinstance(inner, str):
        data = json.loads(inner)
    elif isinstance(inner, list):
        data = inner
    else:
        sys.exit(1)
except:
    sys.exit(1)
with open('$OUTFILE', 'w') as f:
    json.dump({'q': data}, f)
print('  ✓ ' + str(len(data)) + ' questions')
" 2>/dev/null

# Check result
if [ ! -f "$OUTFILE" ] || [ ! -s "$OUTFILE" ]; then
  echo "  ✗ Extraction failed (empty output)"
  exit 1
fi

# Verify file is valid
python3 -c "import json; d=json.load(open('$OUTFILE')); assert len(d.get('q',[])) > 0" 2>/dev/null || {
  echo "  ✗ Invalid output file"
  rm -f "$OUTFILE"
  exit 1
}