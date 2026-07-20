---
Task ID: 1
Agent: Main Agent
Task: Fix question display, replace AI with web search, fix analytics, improve UI

Work Log:
- Analyzed 5 user screenshots with VLM to understand requirements
- Queried database: 61,991 questions (55,686 JEE Main + 6,305 JEE Advanced)
- Found ALL questions have null options, null correctAnswer, null questionHtml, no images
- Found 1,490 MCQs have embedded (A)(B)(C)(D) options in questionText
- Found 1,737 questions have trailing "Choose the correct..." junk text
- Found 238 questions have (E) as 5th option
- Found LaTeX uses $...$ and $$...$$ format in questionText

Stage Summary:
- Rewrote /api/solve/route.ts to use web search + page reader instead of AI
- Rewrote question-card.tsx: removed AI solution, added "Find Answer Online" button, support for (E) options, improved text cleaning
- Rewrote analytics.tsx: standardized JEE weightage (equal 33.3% per subject), exam pattern info, chapter weightage from official data
- Updated landing.tsx: removed PCM question count difference, show weightage instead
- Updated navbar.tsx: added Analytics button in desktop and mobile
- Deleted /api/analytics/route.ts (no longer needed)
- All code compiles successfully
- Browser tested: landing page, questions (JEE Main + Advanced), MCQ filter, analytics, mobile responsiveness
- Fixed JEE Advanced bug: examType change now resets selectedSubject so sidebar loads correct chapters
- No console errors in browser
- Only 3 pre-existing lint warnings in scripts/ directory (not source code)