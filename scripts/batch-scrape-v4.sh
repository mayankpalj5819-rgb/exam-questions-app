#!/bin/bash
# Batch scraper v4 - proven extraction logic, restart browser every 8 chapters
# Selector: a.flex.gap-2[href*="/past-years/jee/question/"] with .flex.flex-col children

LOG="/tmp/scrape-v4.log"
> "$LOG"

restart_browser() {
  pkill -9 -f chrome 2>/dev/null
  pkill -9 -f agent-browser 2>/dev/null
  sleep 2
}

scrape_one() {
  local EXAM="$1" SUBJECT="$2" SLUG="$3"
  local OUTFILE="/tmp/scraped/${EXAM}_${SUBJECT}_${SLUG}.json"
  local BASE_URL="https://questions.examside.com/past-years/jee/${EXAM}/${SUBJECT}/${SLUG}"

  # Skip if already has questions
  if [ -f "$OUTFILE" ] && [ -s "$OUTFILE" ]; then
    local qcount=$(python3 -c "import json; d=json.load(open('$OUTFILE')); print(len(d.get('q',[])))" 2>/dev/null)
    if [ -n "$qcount" ] && [ "$qcount" -gt 0 ]; then
      echo "  SKIP (already $qcount questions)"
      return
    fi
  fi

  rm -f "$OUTFILE"

  agent-browser open "$BASE_URL" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "  ✗ nav failed"
    return
  fi

  # Extract questions (IIFE pattern, proven extraction logic)
  RESULT=$(agent-browser eval "(function(){var cards=document.querySelectorAll('a.flex.gap-2[href*=\"/past-years/jee/question/\"]');var r=[];for(var i=0;i<cards.length;i++){var col=cards[i].querySelector('.flex.flex-col');if(!col||col.children.length<2)continue;r.push({t:col.children[0].innerText.trim(),m:col.children[1].innerText.trim(),u:cards[i].getAttribute('href')||'',i:i})}return JSON.stringify(r)})()" 2>/dev/null)

  # If empty, retry once after brief wait
  if [ -z "$RESULT" ] || [ "$RESULT" = '"null"' ] || [ "$RESULT" = 'null' ] || [ "$RESULT" = '""' ]; then
    sleep 3
    RESULT=$(agent-browser eval "(function(){var cards=document.querySelectorAll('a.flex.gap-2[href*=\"/past-years/jee/question/\"]');var r=[];for(var i=0;i<cards.length;i++){var col=cards[i].querySelector('.flex.flex-col');if(!col||col.children.length<2)continue;r.push({t:col.children[0].innerText.trim(),m:col.children[1].innerText.trim(),u:cards[i].getAttribute('href')||'',i:i})}return JSON.stringify(r)})()" 2>/dev/null)
  fi

  # Parse and save (double JSON parse for agent-browser quote wrapping)
  echo "$RESULT" | python3 -c "
import sys, json
raw = sys.stdin.read().strip()
if not raw or raw == 'null':
    print('  empty')
    sys.exit(0)
try:
    inner = json.loads(raw)
    if isinstance(inner, str):
        data = json.loads(inner)
    elif isinstance(inner, list):
        data = inner
    else:
        print('  bad type')
        sys.exit(0)
except Exception as e:
    print(f'  parse err: {e}')
    sys.exit(0)
if len(data) == 0:
    print('  0 questions')
    sys.exit(0)
with open('$OUTFILE', 'w') as f:
    json.dump({'q': data}, f)
print(f'  ✓ {len(data)} questions')
"
}

# Read remaining chapters
CHAPTERS=()
while IFS= read -r line; do
  CHAPTERS+=("$line")
done < /tmp/remaining.txt

TOTAL=${#CHAPTERS[@]}
echo "=== Scraping $TOTAL chapters ==="
echo "Started: $(date)"

COUNT=0
for entry in "${CHAPTERS[@]}"; do
  COUNT=$((COUNT + 1))

  # Restart browser every 8 chapters
  if [ $((COUNT % 8)) -eq 1 ] && [ $COUNT -gt 1 ]; then
    echo "  [restarting browser...]"
    restart_browser
  fi

  # Parse: exam_subject_slug
  first_="${entry%%_*}"
  rest="${entry#*_}"
  second_="${rest%%_*}"
  slug="${rest#*_}"

  echo "[$COUNT/$TOTAL] $first_/$second_/$slug"
  scrape_one "$first_" "$second_" "$slug"

  echo "  [$COUNT/$TOTAL]" >> "$LOG"
done

echo "=== Done: $(date) ===" | tee -a "$LOG"