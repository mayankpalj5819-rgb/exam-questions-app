# Task 2-d: Global Utility Components

## Components Created

### 1. `src/components/shortcuts-help.tsx`
- Keyboard shortcuts dialog using shadcn Dialog
- 3 sections: General, Questions, Navigation
- Global `?` key listener (ignores input fields)
- Kbd-styled badges, hover rows, scrollable content

### 2. `src/components/back-to-top.tsx`
- Fixed floating button (bottom-right, amber gradient)
- Shows after 400px scroll, hides when scrolling up
- requestAnimationFrame-based performance
- framer-motion AnimatePresence

### 3. `src/components/quick-navigate.tsx`
- Command palette dialog triggered by `/` key
- 10 quick actions with search filtering
- Arrow key navigation + Enter selection
- Keyword-based fuzzy matching

### 4. `src/components/confetti.tsx`
- 40 framer-motion particles (no external lib)
- Random positions/sizes/colors/shapes
- Controlled via `show: boolean` prop

## Integration
- `page.tsx`: Added ShortcutsHelp, QuickNavigate, BackToTop after footer
- `navbar.tsx`: Added HelpCircle button (amber accent) before theme toggle
- Lint: 0 new issues (17 pre-existing in scripts/)