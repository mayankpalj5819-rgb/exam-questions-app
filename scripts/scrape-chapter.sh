#!/bin/bash
# Scrape a single chapter from ExamSide and save questions to a JSON file
# Usage: scrape-chapter.sh <exam-type> <subject> <chapter-slug> <output-file>

EXAM_TYPE="$1"
SUBJECT="$2"
CHAPTER_SLUG="$3"
OUTPUT="$4"

URL="https://questions.examside.com/past-years/jee/${EXAM_TYPE}/${SUBJECT}/${CHAPTER_SLUG}"

echo "Scraping: $URL"

# Close any existing browser
agent-browser close 2>/dev/null

# Open the page
agent-browser open "$URL" 2>&1 | head -1
sleep 2

# Wait for load
agent-browser wait --load networkidle 2>&1

# Extract questions
RESULT=$(agent-browser eval '(() => {
  const m = document.querySelector("main");
  if (!m) return JSON.stringify({error: "NO_MAIN", questions: [], total: 0});
  const cards = m.querySelectorAll("a.flex.gap-2[href*=\"/past-years/jee/question/\"]");
  const questions = [];
  cards.forEach((card, idx) => {
    try {
      const href = card.getAttribute("href") || "";
      const flexCol = card.querySelector(".flex.flex-col");
      if (!flexCol) return;
      const contentDiv = flexCol.children[0];
      if (!contentDiv) return;
      const questionHtml = contentDiv.innerHTML;
      const questionText = contentDiv.textContent.trim();
      const metaDiv = flexCol.children[1];
      const metaText = metaDiv ? metaDiv.textContent.trim() : "";
      const imgs = card.querySelectorAll("img");
      const imageUrls = [];
      imgs.forEach(img => {
        const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
        if (src && src.length > 20 && !src.includes("favicon") && !src.includes("logo")) {
          imageUrls.push(src);
        }
      });
      if (questionText.length < 10) return;
      questions.push({
        qh: questionHtml.substring(0, 15000),
        qt: questionText.substring(0, 3000),
        imgs: imageUrls,
        meta: metaText,
        url: href,
        idx: idx
      });
    } catch(e) {}
  });
  return JSON.stringify({questions, total: questions.length});
})()' 2>/dev/null)

# Save result
echo "$RESULT" > "$OUTPUT"
COUNT=$(echo "$RESULT" | grep -o '"total":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "  → Extracted $COUNT questions"

# Close browser
agent-browser close 2>/dev/null