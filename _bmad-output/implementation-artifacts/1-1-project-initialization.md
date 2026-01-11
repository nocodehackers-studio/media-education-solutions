# Story 1.1: Project Initialization

Status: review

## Story

As a **developer**,
I want **a fully configured React + TypeScript project with Tailwind CSS, shadcn/ui, and routing**,
So that **I have a modern, consistent foundation to build features on**.

## Acceptance Criteria

### AC1: Project Setup & Development Server
**Given** a fresh development environment
**When** I clone the repository and run `npm install && npm run dev`
**Then** the application starts without errors on localhost
**And** the page displays a placeholder "Media Education Solutions" heading

### AC2: Core Dependencies Installed
**Given** the project is initialized
**When** I inspect the dependencies
**Then** I see React 19+, TypeScript, Vite, Tailwind CSS v4, React Router DOM
**And** shadcn/ui is configured with the project's design tokens

### AC3: Responsive Breakpoints Configured
**Given** Tailwind is configured
**When** I use responsive classes (sm:, md:, lg:, xl:, 2xl:)
**Then** breakpoints match UX spec:
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1440px (MacBook Pro 13" - primary target)

### AC4: Routing with 404 Handler
**Given** React Router is configured
**When** I navigate to an undefined route
**Then** I see a NotFound page placeholder

## Tasks / Subtasks

- [x] Task 1: Create Vite + React + TypeScript Project (AC: 1, 2)
  - [x] 1.1 Run `npm create vite@latest media-education-solutions -- --template react-ts`
  - [x] 1.2 Verify React 19+ is installed (check package.json)
  - [x] 1.3 Verify TypeScript strict mode in tsconfig.json
  - [x] 1.4 Create placeholder App.tsx with "Media Education Solutions" heading

- [x] Task 2: Install and Configure Tailwind CSS v4 (AC: 2, 3)
  - [x] 2.1 Run `npm install tailwindcss @tailwindcss/vite`
  - [x] 2.2 Configure vite.config.ts with Tailwind plugin
  - [x] 2.3 Create tailwind.config.ts with custom breakpoints
  - [x] 2.4 Create src/index.css with Tailwind directives
  - [x] 2.5 Verify responsive classes work

- [x] Task 3: Install and Configure shadcn/ui (AC: 2)
  - [x] 3.1 Run `npx shadcn@latest init`
  - [x] 3.2 Select: TypeScript, Default style, Slate color, CSS variables, tailwind.config.ts path
  - [x] 3.3 Install base components: Button, Card, Input
  - [x] 3.4 Create src/components/ui/index.ts with exports
  - [x] 3.5 Configure Inter font (UX spec typeface)

- [x] Task 4: Install React Router DOM and Create Routes (AC: 4)
  - [x] 4.1 Run `npm install react-router-dom`
  - [x] 4.2 Create src/router/index.tsx with basic routes
  - [x] 4.3 Create src/pages/public/NotFoundPage.tsx
  - [x] 4.4 Wrap App in BrowserRouter
  - [x] 4.5 Verify 404 route works

- [x] Task 5: Project Structure Setup (AC: 1)
  - [x] 5.1 Create folder structure per architecture spec
  - [x] 5.2 Create placeholder index.ts files for each feature folder (see Placeholder Content below)
  - [x] 5.3 Create lib/index.ts with utils export
  - [x] 5.4 Create contexts/index.ts placeholder
  - [x] 5.5 Create types/index.ts placeholder
  - [x] 5.6 Create pages/index.ts placeholder

**Placeholder index.ts Content:**
```typescript
// Example: src/features/auth/index.ts
// Auth feature exports - to be implemented in Epic 2
export {};
```

```typescript
// Example: src/features/contests/index.ts
// Contests feature exports - to be implemented in Epic 2
export {};
```

Use this pattern for all 8 feature folders. The empty export `export {}` makes the file a valid ES module.

- [x] Task 6: Configuration Files (AC: 1)
  - [x] 6.1 Create .env.example with placeholder variables
  - [x] 6.2 Configure .gitignore (add .env.local)
  - [x] 6.3 Create eslint.config.js for linting (modern flat config)
  - [x] 6.4 Create .prettierrc for formatting
  - [x] 6.5 Verify `npm run dev` works end-to-end

- [x] Task 7: Create PROJECT_INDEX.md (AC: 1)
  - [x] 7.1 Create PROJECT_INDEX.md at project root
  - [x] 7.2 Add header: "AI AGENTS: Read this file first when working on this project"
  - [x] 7.3 Add Features table with all 8 feature folders and placeholder descriptions
  - [x] 7.4 Add Shared Code section listing lib/ exports
  - [x] 7.5 Add Contexts section (placeholder for AuthContext, ParticipantSessionContext)
  - [x] 7.6 Add UI Components section listing shadcn/ui primitives
  - [x] 7.7 Add Pages section with route groups

## Dev Notes

### Critical Architecture Rules

1. **Feature Folder Structure (Bulletproof React)**
   - Every feature folder MUST have `index.ts` that exports its public API
   - Import ONLY from feature index, NEVER from deep paths
   ```typescript
   // CORRECT
   import { Button } from '@/components/ui';

   // WRONG - Never do this
   import { Button } from '@/components/ui/button';
   ```

2. **Named Exports Only**
   - NO default exports for components
   - Always use named exports: `export function ComponentName()`

3. **Naming Conventions**
   - Components: PascalCase (`NotFoundPage.tsx`)
   - Functions/variables: camelCase (`handleClick`)
   - Constants: SCREAMING_SNAKE (`MAX_FILE_SIZE`)

### Tailwind CSS v4 Specifics

**CRITICAL: Tailwind v4 has different configuration than v3!**

For Tailwind v4 with Vite:
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**CRITICAL: The `resolve.alias` configuration is REQUIRED for @/* imports to work at runtime. Without it, TypeScript will compile but imports will fail in the browser.**

**CSS Setup (v4 syntax):**
```css
/* src/index.css */
@import "tailwindcss";
```

**PostCSS Note:** With Tailwind v4's Vite plugin (`@tailwindcss/vite`), a separate `postcss.config.js` is NOT required. The Vite plugin handles CSS processing internally. Only create postcss.config.js if you need additional PostCSS plugins.

**Tailwind v4 + shadcn/ui Compatibility:**
shadcn/ui works with Tailwind v4. When running `npx shadcn@latest init`, it will detect your Tailwind version and configure accordingly. If you encounter issues:
1. Ensure `@tailwindcss/vite` is installed (not the PostCSS plugin)
2. Check that `tailwind.config.ts` uses the v4 format
3. Verify CSS imports use `@import "tailwindcss"` not the v3 directives

**Breakpoint Configuration (tailwind.config.ts):**
```typescript
export default {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1440px',  // MacBook Pro 13" - primary target
    }
  }
}
```

### shadcn/ui Configuration

**Required components.json:**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

**After init, install base components:**
```bash
npx shadcn@latest add button card input
```

### Folder Structure to Create

```
src/
├── main.tsx
├── App.tsx
├── index.css
├── vite-env.d.ts
├── components/
│   └── ui/
│       ├── index.ts          # Export all UI components
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
├── features/
│   ├── auth/
│   │   └── index.ts          # Placeholder: export {}
│   ├── contests/
│   │   └── index.ts
│   ├── categories/
│   │   └── index.ts
│   ├── participants/
│   │   └── index.ts
│   ├── submissions/
│   │   └── index.ts
│   ├── reviews/
│   │   └── index.ts
│   ├── rankings/
│   │   └── index.ts
│   └── notifications/
│       └── index.ts
├── pages/
│   ├── index.ts
│   └── public/
│       └── NotFoundPage.tsx
├── contexts/
│   └── index.ts
├── lib/
│   ├── index.ts
│   └── utils.ts              # cn() helper from shadcn
├── types/
│   └── index.ts
└── router/
    └── index.tsx
```

### Environment Variables (.env.example)

```env
# Supabase (required in Story 1.2)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Sentry (required in Story 1.5)
VITE_SENTRY_DSN=

# Bunny (required in Story 4.4)
# Note: These are server-side only, never exposed to client
```

### TypeScript Configuration (tsconfig.json)

Ensure path aliases are configured:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "strict": true
  }
}
```

### UX Design Tokens

**Inter Font Setup:**
```html
<!-- In index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Typography (from UX spec):**
- Body: 16px, weight 400
- Headings: 600 weight
- Line height: 1.5 for body, 1.2-1.3 for headings

### PROJECT_INDEX.md Template

**REQUIRED:** Create this file at project root for LLM agent discoverability.

```markdown
# Project Index - media-education-solutions

**AI AGENTS: Read this file first when working on this project.**

## Features (src/features/)

| Feature | Purpose | Status |
|---------|---------|--------|
| auth | Admin/Judge login, session management | Placeholder |
| contests | Contest CRUD, status management | Placeholder |
| categories | Category management within contests | Placeholder |
| participants | Participant codes, session, info | Placeholder |
| submissions | File uploads, submission management | Placeholder |
| reviews | Rating, feedback for submissions | Placeholder |
| rankings | Drag-drop ranking, tier ordering | Placeholder |
| notifications | Email triggers via Brevo | Placeholder |

## Shared Code (src/lib/)

| File | Purpose |
|------|---------|
| utils.ts | cn() helper, shared utilities |

## Contexts (src/contexts/)

| Context | Purpose | Status |
|---------|---------|--------|
| AuthContext | Admin/Judge authentication state | Planned (Epic 2) |
| ParticipantSessionContext | Participant codes + 120min timeout | Planned (Epic 4) |

## UI Components (src/components/ui/)

shadcn/ui primitives: Button, Card, Input (more added as needed)

## Pages (src/pages/)

| Route Group | Pages |
|-------------|-------|
| public/ | NotFoundPage |

## Edge Functions (supabase/functions/)

To be added in Story 1.2+
```

### Project Structure Notes

- Alignment with Bulletproof React pattern as specified in architecture
- All placeholder index.ts files should export empty object or placeholder comment
- Tests will be co-located with source files (added in later stories)

### References

- [Source: architecture/project-structure-boundaries.md#Complete Project Directory Structure]
- [Source: architecture/core-architectural-decisions.md#Updated Initialization Sequence]
- [Source: architecture/implementation-patterns-consistency-rules.md]
- [Source: ux-design/design-system-foundation.md#Design System Choice]
- [Source: ux-design/responsive-design-accessibility.md#Breakpoint Strategy]
- [Source: ux-design/visual-design-foundation.md#Typography System]
- [Source: project-context.md#Technology Stack & Versions]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- CSS @import warning from shadcn's Tailwind v4 compatibility (non-blocking, build succeeds)
- ESLint warning for buttonVariants export in shadcn button.tsx (expected behavior)

### Completion Notes List

- All 7 tasks and 35 subtasks completed successfully
- React 19.2.3 installed with TypeScript strict mode
- Tailwind CSS v4 with @tailwindcss/vite plugin configured
- Custom breakpoints: sm:640px, md:768px, lg:1024px, xl:1280px, 2xl:1440px
- shadcn/ui initialized with Button, Card, Input components
- React Router v6+ with 404 handler (NotFoundPage)
- 8 feature folders with placeholder index.ts files
- PROJECT_INDEX.md created for AI agent discoverability
- Build passes: 53 modules, 311.79 kB JS, 23.17 kB CSS
- Lint passes: 0 errors, 1 expected warning

### Change Log

| Date | Change | Files |
|------|--------|-------|
| 2026-01-11 | Initial project setup with Vite + React 19 + TypeScript | package.json, tsconfig.json, vite.config.ts |
| 2026-01-11 | Tailwind CSS v4 configuration | tailwind.config.ts, src/index.css |
| 2026-01-11 | shadcn/ui initialization and base components | components.json, src/components/ui/* |
| 2026-01-11 | React Router with 404 handler | src/router/index.tsx, src/pages/* |
| 2026-01-11 | Project structure with feature folders | src/features/*/index.ts |
| 2026-01-11 | Configuration files | .env.example, .gitignore, .prettierrc, eslint.config.js |
| 2026-01-11 | PROJECT_INDEX.md for AI discoverability | PROJECT_INDEX.md |

### File List

Files created:
- PROJECT_INDEX.md (REQUIRED - LLM discoverability manifest)
- package.json (generated by Vite)
- tsconfig.json (generated by Vite, customize)
- vite.config.ts (with resolve.alias for @/* imports)
- tailwind.config.ts
- components.json (shadcn)
- .env.example
- .gitignore
- .eslintrc.cjs
- .prettierrc
- index.html (add Inter font links)
- src/main.tsx
- src/App.tsx
- src/index.css
- src/vite-env.d.ts
- src/components/ui/index.ts
- src/components/ui/button.tsx (shadcn generated)
- src/components/ui/card.tsx (shadcn generated)
- src/components/ui/input.tsx (shadcn generated)
- src/features/*/index.ts (8 placeholder files)
- src/pages/index.ts
- src/pages/public/NotFoundPage.tsx
- src/contexts/index.ts
- src/lib/index.ts
- src/lib/utils.ts (shadcn generated)
- src/types/index.ts
- src/router/index.tsx

**Note:** postcss.config.js is NOT required with Tailwind v4's Vite plugin.
