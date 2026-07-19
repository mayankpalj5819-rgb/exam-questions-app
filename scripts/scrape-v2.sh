#!/bin/bash
# Scrape a single chapter from ExamSide
# Usage: bash scripts/scrape-v2.sh <exam> <subject> <slug>
# Output: /tmp/scraped/<exam>_<subject>_<slug>.json

set -e

EXAM="$1"
SUBJECT="$2"
SLUG="$3"
OUTFILE="/tmp/scraped/${EXAM}_${SUBJECT}_${SLUG}.json"

BASE_URL="https://questions.examside.com/past-years/jee/${EXAM}/${SUBJECT}/${SLUG}"

echo "→ Scraping: $EXAM/$SUBJECT/$SLUG"

# Navigate to page
agent-browser open "$BASE_URL" > /dev/null 2>&1
sleep 4

# Get total question count
COUNT=$(agent-browser eval "document.querySelectorAll('a.flex.gap-2[href*=\"/past-years/jee/question/\"]').length" 2>/dev/null | tr -d '[:space:]')
echo "  Found $COUNT questions on page"

if [ -z "$COUNT" ] || [ "$COUNT" = "0" ] || [ "$COUNT" = "null" ]; then
  echo "  SKIP: No questions found"
  exit 0
fi

# Extract all questions using a file-based approach
# Write extraction script to a temp file to avoid shell escaping issues
cat > /tmp/extract-questions.js << 'JSEOF'
const cards = document.querySelectorAll('a.flex.gap-2[href*="/past-years/jee/question/"]');
const results = [];
for (let i = 0; i < cards.length; i++) {
  const card = cards[i];
  const col = card.querySelector('.flex.flex-col');
  if (!col || col.children.length < 2) continue;
  const text = col.children[0]?.innerText?.trim() || '';
  const meta = col.children[1]?.innerText?.trim() || '';
  const href = card.getAttribute('href') || '';
  results.push({ t: text, m: meta, u: href, i: i });
}
return JSON.stringify(results);
JSEOF

# Extract in batches of 20 and append to file
BATCH=20
TMPFILE="/tmp/scrape-batch-$$.json"
> "$TMPFILE"

for ((i=0; i<COUNT; i+=BATCH)); do
  END=$((i + BATCH - 1))
  if [ $END -ge $COUNT ]; then
    END=$((COUNT - 1))
  fi

  # Create extraction script with specific range
  cat > /tmp/extract-batch.js << JSEOF
const cards = document.querySelectorAll('a.flex.gap-2[href*="/past-years/jee/question/"]');
const results = [];
for (let i = ${i}; i <= ${END} && i < cards.length; i++) {
  const card = cards[i];
  const col = card.querySelector('.flex.flex-col');
  if (!col || col.children.length < 2) continue;
  results.push({
    t: (col.children[0]?.innerText || '').trim(),
    m: (col.children[1]?.innerText || '').trim(),
    u: card.getAttribute('href') || '',
    i: i
  });
}
return JSON.stringify(results);
JSEOF

  # Run extraction
  BATCH_RESULT=$(agent-browser eval "$(cat /tmp/extract-batch.js)" 2>/dev/null) || true

  if [ -n "$BATCH_RESULT" ] && [ "$BATCH_RESULT" != "null" ] && [ "$BATCH_RESULT" != "undefined" ]; then
    # Validate it's JSON
    echo "$BATCH_RESULT" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null && {
      echo "$BATCH_RESULT" >> "$TMPFILE"
      echo "  Batch $i-$END: OK"
    } || {
      echo "  Batch $i-$END: invalid JSON"
    }
  else
    echo "  Batch $i-$END: empty"
  fi
done

# Merge batches and save
python3 << PYEOF
import json

batches = []
with open("$TMPFILE") as f:
    content = f.read().strip()

# Try to parse as a single JSON first
if content.startswith("["):
    try:
        data = json.loads(content)
        batches.append(data)
    except:
        pass

# If that didn't work, try splitting by ][ and parsing each
if not batches:
    # Each line might be a separate JSON array
    for line in content.split("\n"):
        line = line.strip()
        if not line:
            continue
        try:
            data = json.loads(line)
            if isinstance(data, list):
                batches.append(data)
        except:
            pass

# Flatten all batches
all_questions = []
for batch in batches:
    all_questions.extend(batch)

if all_questions:
    with open("$OUTFILE", "w") as f:
        json.dump({"q": all_questions}, f)
    print(f"  ✓ Saved {len(all_questions)} questions to $OUTFILE")
else:
    print(f"  ✗ No valid questions extracted")
PYEOF

rm -f "$TMPFILE" /tmp/extract-batch.js /tmp/extract-questions.js