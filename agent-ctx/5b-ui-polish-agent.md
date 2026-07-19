---
Task ID: 5b
Agent: UI Polish Agent
Task: Improve Question Cards, Question List, and Math Rendering

## Changes Summary

### 1. globals.css
- KaTeX inline font: 1.05em → **1.15em**, display font: 1.1em → **1.2em**
- Line-height: 1.8 → **1.9** for better readability
- Display math margins: 1rem → **1.25rem**
- Math error: changed from red error style to **amber warning** style (shows original text gracefully)
- Added `.math-svg` class for SVG elements from ExamSide (inline, 1.3em height)
- Table headers: warm amber tint instead of neutral gray
- Table borders: slightly darker for better visibility

### 2. math-text.tsx
- Added `escapeHtml()` utility function
- Error fallback now shows **original LaTeX text** (HTML-escaped, max 120 chars) instead of "[Math Error: ...]"
- SVG elements get `math-svg` class for proper inline sizing

### 3. question-card.tsx
- **Image zoom**: Replaced custom `ImageZoomOverlay` with shadcn `Dialog` component
- **Option circles**: A/B/C/D now in colored circles (amber/orange/rose/teal), green for correct answer
- **Generate AI Solution button**: Shows loading state, then toast "AI solution coming soon!"
- **Card hover**: `hover:shadow-xl hover:shadow-amber-500/8 hover:-translate-y-0.5`
- **Question number badge**: Gradient circle (amber→orange) with shadow
- **Exam metadata**: Extracts date from questionText (e.g., "8th April") for natural display

### 4. question-list.tsx
- **Back to Subjects button**: Arrow icon + "Subjects" label in header
- **Subject name**: Shown with matching icon (FlaskConical for Physics, etc.)
- **Empty state**: FolderSearch illustration, contextual message, "Clear Filters" + "Back to Subjects" actions
- **Sort**: Now passed to API as `sort` param (removed client-side sort)
- **Year filter**: Uses consistent "all" value

### 5. API Route (/api/questions)
- Added `sort` parameter: "newest" (desc year, default) or "oldest" (asc year)
- Added Prisma type import for proper typing