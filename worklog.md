---
Task ID: 1
Agent: Main Agent
Task: Fix "No Questions Found" error - Prisma client stale causing nullable field crash

Work Log:
- Analyzed user screenshot showing "No Questions Found" in JEE PYQ Vault
- Checked dev.log and found: `Error converting field "questionHtml" of expected non-nullable type "String", found incompatible value of "null"`
- Schema already had `questionHtml String?` but Prisma client was stale
- Ran `npx prisma generate` to regenerate client
- Fixed 56 `.json.raw` scraped files (jee-advanced data) by stripping outer quotes and wrapping in proper JSON format
- Imported all 82 scraped JSON files → 12,231 new questions added
- Updated chapter question counts across all 174 chapters
- Verified API returns questions correctly via curl: 9,278 physics questions confirmed

Stage Summary:
- DB now has 17,158 questions total (16,157 jee-main, 1,001 jee-advanced)
- 81/174 chapters have questions, 93 chapters still need scraping
- Root cause: Stale Prisma client + unprocessed .raw scraped files
- Fix: Regenerated Prisma client, processed .raw files, imported to DB
---
Task ID: 2
Agent: Main Agent  
Task: Build robust scraping pipeline (scrape-v3.sh + batch-scrape.sh)

Work Log:
- Diagnosed agent-browser eval output capture issue: `const` declarations persist between evals causing errors
- Fixed by using IIFE pattern: `(function(){...})()` 
- Created scrape-v3.sh: extracts all questions in one eval, pipes through python for double-JSON-parse (agent-browser wraps output in quotes)
- Tested successfully: 210 gravitation questions scraped
- Created batch-scrape.sh: iterates 93 missing chapters, skips already-scraped
- Started background batch scraping

Stage Summary:
- scrape-v3.sh reliably extracts questions from ExamSide pages
- batch-scrape.sh running in background processing 93 chapters
- Output: /tmp/scrape-progress.log, /tmp/scrape-batch.log
