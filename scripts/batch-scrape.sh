#!/bin/bash
# Batch scrape chapters from ExamSide
# Usage: bash scripts/batch-scrape.sh <exam-type> <subject> <chapters-comma-separated>

set -e

EXAM_TYPE="${1:-jee-main}"
SUBJECT="${2:-physics}"
CHAPTERS_CSV="${3:-electrostatics,current-electricity,gravitation}"

EVAL_SCRIPT="/home/z/my-project/scrape-eval.js"
IMPORT_SCRIPT="/home/z/my-project/scripts/import-questions.ts"

IFS=',' read -ra CHAPTERS <<< "$CHAPTERS_CSV"

# Close any existing browser
agent-browser close 2>/dev/null || true
sleep 1

for CHAPTER in "${CHAPTERS[@]}"; do
    echo ""
    echo "========================================="
    echo "Scraping: $SUBJECT/$CHAPTER ($EXAM_TYPE)"
    echo "========================================="
    
    URL="https://questions.examside.com/past-years/jee/$EXAM_TYPE/$SUBJECT/$CHAPTER"
    
    # Open page
    agent-browser open "$URL" 2>&1 | tail -1
    agent-browser wait --load networkidle 2>&1
    sleep 2
    
    # Extract data
    agent-browser eval --json "$(cat $EVAL_SCRIPT)" 2>/dev/null > "/home/z/my-project/scrape-batch.json"
    
    # Check if we got data
    if [ -s "/home/z/my-project/scrape-batch.json" ]; then
        # Import to DB
        cd /home/z/my-project
        bun run "$IMPORT_SCRIPT" scrape-batch.json "$SUBJECT" "$CHAPTER" "$EXAM_TYPE" 2>&1
    else
        echo "  No data received"
    fi
    
    # Small delay
    sleep 1
done

agent-browser close 2>&1 || true
echo ""
echo "✨ Batch scraping complete!"