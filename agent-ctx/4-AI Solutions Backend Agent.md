# Task 4 — AI Solutions Backend Agent

## What was done

### 1. Created `/api/solve` endpoint (`src/app/api/solve/route.ts`)
- **POST** handler accepting `{ questionId: string, questionText: string }`
- Uses `z-ai-web-dev-sdk` (`ZAI.create()` → `zai.chat.completions.create()`) to call LLM
- System prompt: JEE exam expert with LaTeX formatting instructions ($...$ / $$...$$)
- **In-memory cache** (`Map<string, string>`) keyed by `questionId` — avoids regenerating the same question
- Cache prunes oldest entries when size exceeds 500 (checked every 10 min)
- **30-second timeout** via `Promise.race` against a setTimeout rejection
- Reuses a singleton ZAI instance across requests
- Returns `{ solution: "..." }` on success; `{ error: "..." }` with appropriate HTTP status codes (400, 502, 504, 500) on failure
- No "use client" — pure server-side route

### 2. Updated `question-card.tsx`
- Added two new state variables: `localSolution` (string | null) and `aiSolutionOpen` (boolean)
- Replaced the `handleGenerateSolution` placeholder (setTimeout + toast) with a real `fetch("/api/solve")` call
  - POSTs `{ questionId, questionText }`
  - On success: stores solution in `localSolution` state, opens the collapsible, shows success toast
  - On error: shows error toast with the message from the API
  - Button shows loading spinner via existing `solveLoading` state
- If solution already generated, clicking the button toggles visibility (no re-fetch)
- Button label changes dynamically: "Generate AI Solution" → "Generating..." → "Show AI Solution" / "Hide AI Solution"
- New **collapsible section** with `AnimatePresence` + `motion.div` (same pattern as existing solution section) renders the AI solution using `<MathText>` for LaTeX support
- Styled with amber/orange gradient card to distinguish from the DB-sourced solution section

## Lint status
No new lint errors introduced. Pre-existing errors in `scripts/import-questions.ts` and `src/components/question-list.tsx` are unrelated.