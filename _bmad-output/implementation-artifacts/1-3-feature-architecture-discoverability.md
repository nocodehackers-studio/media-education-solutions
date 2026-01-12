# Story 1.3: Feature Architecture & Discoverability

Status: complete

## Story

As a **developer or AI agent**,
I want **a well-organized folder structure with discoverability files**,
So that **I can quickly understand and navigate the codebase**.

## Acceptance Criteria

### AC1: Source Folder Structure
**Given** the src folder structure
**When** I inspect the directories
**Then** I see: features/, components/ui/, lib/, pages/, contexts/, types/, router/

### AC2: Feature Folders with Index Files
**Given** the features folder
**When** I check its contents
**Then** I see placeholder folders for: auth, contests, categories, participants, submissions, reviews, rankings, notifications
**And** each folder has an index.ts with a placeholder export comment

### AC3: PROJECT_INDEX.md Manifest
**Given** PROJECT_INDEX.md exists at project root
**When** I read it
**Then** I see a master manifest listing all features, their purpose, and key exports
**And** it follows the LLM discoverability format from architecture

### AC4: UI Components Index
**Given** components/ui/index.ts exists
**When** I check its exports
**Then** it exports Button, Card, Input from shadcn/ui (minimum starter set)

### AC5: Library Exports Complete
**Given** lib/index.ts exists
**When** I check its exports
**Then** it exports supabase client, cn utility, queryClient

## Tasks / Subtasks

- [x] Task 1: Install TanStack Query (AC: 5)
  - [x] 1.1 Run `npm install @tanstack/react-query`
  - [x] 1.2 Verify installation in package.json

- [x] Task 2: Create Query Client Configuration (AC: 5)
  - [x] 2.1 Create `src/lib/queryClient.ts` with configured QueryClient
  - [x] 2.2 Set default staleTime and retry options
  - [x] 2.3 Update `src/lib/index.ts` to export queryClient

- [x] Task 3: Add QueryClientProvider to App (AC: 5)
  - [x] 3.1 Wrap App with QueryClientProvider in main.tsx or App.tsx
  - [x] 3.2 Verify provider is at root level

- [x] Task 4: Verify Feature Folder Structure (AC: 1, 2)
  - [x] 4.1 Confirm all 8 feature folders exist
  - [x] 4.2 Verify each has index.ts with proper placeholder export
  - [x] 4.3 Add subfolder structure templates (api/, components/, hooks/, types/) as comments in index.ts

- [x] Task 5: Enhance PROJECT_INDEX.md (AC: 3)
  - [x] 5.1 Verify all features are listed with accurate descriptions
  - [x] 5.2 Add queryClient to lib/ section
  - [x] 5.3 Add "How to Use" quick reference section
  - [x] 5.4 Ensure format matches architecture spec

- [x] Task 6: Verify UI Components Index (AC: 4)
  - [x] 6.1 Confirm components/ui/index.ts exports Button, Card, Input
  - [x] 6.2 Add any missing exports from shadcn components

- [x] Task 7: Verify All Library Exports (AC: 5)
  - [x] 7.1 Confirm lib/index.ts exports: cn, supabase, queryClient
  - [x] 7.2 Verify each export works with test import

- [x] Task 8: Build Verification (AC: 1-5)
  - [x] 8.1 Run `npm run build` to verify no import errors
  - [x] 8.2 Run `npm run lint` to check for issues
  - [x] 8.3 Verify dev server starts without errors

### Review Follow-ups (AI)
- [x] [AI-Review][High] Align PROJECT_INDEX.md with architecture LLM format (add Key Exports column and entries). [PROJECT_INDEX.md:7]
- [x] [AI-Review][Medium] Update story File List to include git-modified files not listed (package-lock.json, src/index.css, src/types/index.ts, .env.example, vite.config.js, vite.config.d.ts). [_bmad-output/implementation-artifacts/1-3-feature-architecture-discoverability.md:294]
- [x] [AI-Review][Medium] Provide evidence for Task 7.2 and Task 8 (import verification/build/lint/dev server) or rerun and document. [_bmad-output/implementation-artifacts/1-3-feature-architecture-discoverability.md:70]

## Dev Notes

### Previous Story Learnings

**Story 1.1 Established:**
- React 19.2.3 with TypeScript strict mode
- Path aliases: `@/*` → `./src/*`
- shadcn/ui: new-york style, neutral base, lucide icons
- 8 feature folders created with `export {}` placeholders
- PROJECT_INDEX.md exists at root
- components/ui/index.ts exports Button, Card, Input

**Story 1.2 Added:**
- Supabase client at `src/lib/supabase.ts`
- Database types at `src/types/supabase.ts`
- lib/index.ts now exports: cn, supabase
- .env.local with Supabase credentials

**What's Missing (this story adds):**
- TanStack Query setup (queryClient)
- QueryClientProvider wrapper
- Enhanced PROJECT_INDEX.md with query client info

### TanStack Query Setup

**Create `src/lib/queryClient.ts`:**
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Don't refetch on window focus in development
      refetchOnWindowFocus: import.meta.env.PROD,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});
```

**Update `src/lib/index.ts`:**
```typescript
// === Utilities ===
export { cn } from './utils';

// === Supabase ===
export { supabase } from './supabase';

// === Query Client ===
export { queryClient } from './queryClient';
```

**Update `src/main.tsx` (or App.tsx):**
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
```

### Enhanced Feature Index Template

**Each feature index.ts should have this structure:**
```typescript
// features/auth/index.ts
// Auth feature - Admin/Judge login, session management
// Status: Placeholder (Epic 2)

// === Components ===
// export { LoginForm } from './components/LoginForm';

// === Hooks ===
// export { useAuth } from './hooks/useAuth';

// === API ===
// export { authApi } from './api/authApi';

// === Types ===
// export type { User, AuthState } from './types/auth.types';

export {};
```

### PROJECT_INDEX.md Updates

**Add to lib/ section:**
```markdown
| queryClient.ts | TanStack Query client with default options |
```

**Add Quick Reference section:**
```markdown
## Quick Reference

**Import patterns:**
```typescript
// From lib (utilities, clients)
import { cn, supabase, queryClient } from '@/lib';

// From features (components, hooks, types)
import { useAuth, LoginForm } from '@/features/auth';

// From UI components
import { Button, Card, Input } from '@/components/ui';
```

**State management:**
- Server state → TanStack Query hooks
- Form state → React Hook Form
- Auth state → AuthContext (Epic 2)
- Local UI → useState
```

### Verification Checklist

**Folder Structure Check:**
```
src/
├── components/ui/index.ts    ✓ exports Button, Card, Input
├── features/
│   ├── auth/index.ts         ✓ placeholder
│   ├── contests/index.ts     ✓ placeholder
│   ├── categories/index.ts   ✓ placeholder
│   ├── participants/index.ts ✓ placeholder
│   ├── submissions/index.ts  ✓ placeholder
│   ├── reviews/index.ts      ✓ placeholder
│   ├── rankings/index.ts     ✓ placeholder
│   └── notifications/index.ts✓ placeholder
├── lib/
│   ├── index.ts              ✓ exports cn, supabase, queryClient
│   ├── utils.ts              ✓ cn() helper
│   ├── supabase.ts           ✓ typed client
│   └── queryClient.ts        ← NEW
├── pages/
├── contexts/
├── types/
└── router/
```

### Import Verification Test

After completing tasks, verify imports work:
```typescript
// Test file or browser console
import { cn, supabase, queryClient } from '@/lib';
import { Button, Card, Input } from '@/components/ui';

console.log({ cn, supabase, queryClient, Button, Card, Input });
// All should be defined
```

### Architecture Compliance

**This story ensures:**
1. **Bulletproof React pattern** - All features have index.ts
2. **LLM discoverability** - PROJECT_INDEX.md is complete
3. **Clean imports** - All exports accessible via index files
4. **State management ready** - queryClient configured for server state

### References

- [Source: architecture/core-architectural-decisions.md#Frontend Architecture]
- [Source: architecture/project-structure-boundaries.md#LLM Discoverability System]
- [Source: architecture/implementation-patterns-consistency-rules.md#State Management Patterns]
- [Source: project-context.md#Feature Architecture]
- [Source: epic-1-project-foundation-core-infrastructure.md#Story 1.3]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

**Task 7.2 - Import Verification (2026-01-12):**
- lib/index.ts exports verified: cn, supabase, queryClient ✓
- components/ui/index.ts exports verified: Button, Card, Input ✓

**Task 8 - Build Verification (2026-01-12):**
- Build: SUCCESS (506.90 kB main chunk, 879ms)
- Lint: 0 errors, 1 warning (known shadcn buttonVariants pattern - react-refresh/only-export-components)
- Dev server: OK - Vite v7.3.1 ready in 179ms, responds at localhost:5173

### Completion Notes List

- Installed @tanstack/react-query@5.90.16
- Created queryClient.ts with 5-minute staleTime, 3 retries for queries, 1 retry for mutations
- Added QueryClientProvider at root level in main.tsx
- Enhanced all 8 feature index.ts files with structured placeholder comments (Components, Hooks, API, Types sections)
- Updated PROJECT_INDEX.md with queryClient in lib section and new Quick Reference section
- Verified all AC requirements satisfied: folder structure (AC1), feature folders with index files (AC2), PROJECT_INDEX manifest (AC3), UI components index (AC4), library exports (AC5)

### Change Log

| Date | Change | Files |
|------|--------|-------|
| 2026-01-11 | Added TanStack Query with QueryClient configuration | package.json, src/lib/queryClient.ts |
| 2026-01-11 | Added QueryClientProvider wrapper at app root | src/main.tsx |
| 2026-01-11 | Enhanced feature index files with structure templates | src/features/*/index.ts (8 files) |
| 2026-01-11 | Updated lib exports to include queryClient | src/lib/index.ts |
| 2026-01-11 | Added queryClient and Quick Reference to PROJECT_INDEX | PROJECT_INDEX.md |
| 2026-01-12 | [AI-Review] Aligned PROJECT_INDEX.md with architecture LLM format (Key Exports column) | PROJECT_INDEX.md |
| 2026-01-12 | [AI-Review] Added verification evidence for Task 7.2 and Task 8 | This file |
| 2026-01-12 | [AI-Review] Updated File List with all git-modified files | This file |

### File List

**Created:**
- src/lib/queryClient.ts

**Modified:**
- package.json (added @tanstack/react-query)
- package-lock.json (dependency lock update)
- src/lib/index.ts (added queryClient export)
- src/main.tsx (added QueryClientProvider)
- src/index.css (shadcn base styles)
- src/types/index.ts (type exports)
- src/features/auth/index.ts
- src/features/contests/index.ts
- src/features/categories/index.ts
- src/features/participants/index.ts
- src/features/submissions/index.ts
- src/features/reviews/index.ts
- src/features/rankings/index.ts
- src/features/notifications/index.ts
- PROJECT_INDEX.md (added Key Exports column per architecture spec)

**Removed:**
- vite.config.js (cleanup - using vite.config.ts)
- vite.config.d.ts (cleanup - not needed with ts config)
